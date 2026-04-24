import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import { generateSOP } from '../ai/sop.generator';

export interface SOPGenerationRequest {
  project_id: string;
  raw_text: string;
  domain: string;
  timeline_days: number;
}

export interface SOPGenerationResponse {
  sop_id: string;
}

export class SOPService {
  private toMySQLDate(dateStr: string): string | null {
    if (!dateStr) return null;
    return new Date(dateStr).toISOString().split('T')[0];
  }

  async generateAndStoreSOP(request: SOPGenerationRequest): Promise<SOPGenerationResponse> {
    try {
      const output = await generateSOP(
        request.raw_text,
        request.domain,
        request.timeline_days,
        request.project_id
      );

      const trx = await db.transaction();

      try {
        const sopId = uuidv4();
        await this.insertSOP(trx, sopId, request.project_id, output);

        if (output.milestones && Array.isArray(output.milestones)) {
          logger.info('Inserting milestones', {
            total_milestones: output.milestones.length,
            sop_id: sopId
          });

          for (const milestone of output.milestones) {
            const milestoneId = uuidv4();

            logger.info('Inserting milestone', {
              milestone_id: milestoneId,
              milestone_title: milestone.title,
              checks_count: milestone.checks?.length || 0
            });

            await this.insertMilestone(trx, milestoneId, sopId, request.project_id, milestone);

            if (!milestone.checks || !Array.isArray(milestone.checks) || milestone.checks.length === 0) {
              logger.info('Milestone has no checks', { milestone_id: milestoneId, milestone_title: milestone.title });
              continue;
            }

            for (const check of milestone.checks) {
              await this.insertVerificationCheck(trx, sopId, milestoneId, check);
            }

            logger.info('Successfully inserted milestone and its checks', {
              milestone_id: milestoneId,
              checks_inserted: milestone.checks.length
            });
          }
        } else {
          logger.info('No milestones found in SOP output', { sop_id: sopId });
        }

        await trx.commit();

        logger.info('SOP generated and stored successfully', {
          sop_id: sopId,
          project_id: request.project_id,
          milestones_count: output.milestones?.length || 0
        });

        return { sop_id: sopId };

      } catch (error) {
        await trx.rollback();
        throw error;
      }

    } catch (error) {
      logger.error('Error generating and storing SOP', error);
      throw new Error(`Failed to generate and store SOP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async insertSOP(trx: any, sopId: string, projectId: string, output: any): Promise<void> {
    await trx('sops').insert({
      sop_id: sopId,
      project_id: projectId,
      version: output.version || 1,
      content_html: output.content_html || '',
      freelancer_approved: false,
      client_approved: false,
      locked_at: null,
      edit_history: null,
      created_at: new Date()
    });
  }

  private async insertMilestone(trx: any, milestoneId: string, sopId: string, projectId: string, milestone: any): Promise<void> {
    await trx('milestone_checks').insert({
      milestone_id: milestoneId,
      sop_id: sopId,
      project_id: projectId,
      title: milestone.title || '',
      deadline: this.toMySQLDate(milestone.deadline),
      payment_amount: milestone.payment_amount || 0,
      status: 'pending',
      revisions_used: 0,
      max_revisions: 2,
      created_at: new Date()
    });
  }

  private async insertVerificationCheck(trx: any, sopId: string, milestoneId: string, check: any): Promise<void> {
    await trx('verification_checks').insert({
      check_id: uuidv4(),
      sop_id: sopId,
      milestone_id: milestoneId,
      type: check.type || '',
      description: check.description || '',
      params: JSON.stringify(check.params || {}),
      result: 'pending',
      evidence: null,
      verified_by: check.verified_by || 'auto',
      verified_at: null,
      created_at: new Date()
    });
  }

  async approveSOP(sopId: string, role: 'employer' | 'freelancer'): Promise<any> {
    try {
      const sop = await db('sops').where({ sop_id: sopId }).first();
      if (!sop) throw new Error('SOP not found');

      const updateField = role === 'freelancer' ? 'freelancer_approved' : 'client_approved';
      await db('sops').where({ sop_id: sopId }).update({ [updateField]: true });

      const updatedSop = await db('sops').where({ sop_id: sopId }).first();
      if (updatedSop.freelancer_approved && updatedSop.client_approved && !updatedSop.locked_at) {
        await db('sops').where({ sop_id: sopId }).update({ locked_at: new Date() });
        await db('projects').where({ project_id: sop.project_id }).update({ status: 'active' });
        logger.info('SOP locked — both parties approved, project set to active', { sop_id: sopId, project_id: sop.project_id });
      }

      return await db('sops').where({ sop_id: sopId }).first();
    } catch (error) {
      logger.error('Error approving SOP', error);
      throw error;
    }
  }

  async getSOPById(sopId: string): Promise<any | null> {
    try {
      const sop = await db('sops').where({ sop_id: sopId }).first();
      return sop || null;
    } catch (error) {
      logger.error('Error fetching SOP by ID', error);
      throw new Error('Error fetching SOP');
    }
  }

  async getSOPsByProjectId(projectId: string): Promise<any[]> {
    try {
      const sops = await db('sops').where({ project_id: projectId }).orderBy('created_at', 'desc');
      return sops;
    } catch (error) {
      logger.error('Error fetching SOPs by project ID', error);
      throw new Error('Error fetching SOPs');
    }
  }

  async getMilestonesBySOPId(sopId: string): Promise<any[]> {
    try {
      const milestones = await db('milestone_checks').where('sop_id', sopId).orderBy('created_at', 'asc');
      return milestones;
    } catch (error) {
      logger.error('Error fetching milestones by SOP ID', error);
      throw new Error('Error fetching milestones');
    }
  }

  async getVerificationChecksByMilestoneId(milestoneId: string): Promise<any[]> {
    try {
      const checks = await db('verification_checks').where({ milestone_id: milestoneId });
      return checks;
    } catch (error) {
      logger.error('Error fetching verification checks by milestone ID', error);
      throw new Error('Error fetching verification checks');
    }
  }

  async getVerificationCheckById(checkId: string): Promise<any | null> {
    try {
      const check = await db('verification_checks').where({ check_id: checkId }).first();
      return check || null;
    } catch (error) {
      logger.error('Error fetching verification check by ID', error);
      throw new Error('Error fetching verification check');
    }
  }
}
