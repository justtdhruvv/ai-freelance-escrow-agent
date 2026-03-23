import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import axios from 'axios';

export interface SOPGenerationRequest {
  project_id: string;
  raw_text: string;
  domain: string;
  timeline_days: number;
}

export interface SOPGenerationResponse {
  sop_id: string;
}

export interface AIResponse {
  request_id: string | null;
  status: string;
  output: any;
  error_message?: string;
  model_used: string;
}

export class SOPService {
  private readonly AI_API_BASE_URL = 'http://127.0.0.1:8000';

  /**
   * Helper function to convert ISO datetime string to MySQL DATE format (YYYY-MM-DD)
   */
  private toMySQLDate(dateStr: string): string | null {
    if (!dateStr) return null;
    return new Date(dateStr).toISOString().split('T')[0];
  }

  async generateAndStoreSOP(request: SOPGenerationRequest): Promise<SOPGenerationResponse> {
    try {
      // Step 1: Call AI API
      const aiResponse = await this.callAIAPI(request);
      
      if (aiResponse.status !== 'success' || !aiResponse.output) {
        throw new Error(`AI API failed: ${aiResponse.error_message || 'Unknown error'}`);
      }

      const output = aiResponse.output;

      // Step 2: Start database transaction
      const trx = await db.transaction();

      try {
        // Step 3: Insert SOP
        const sopId = uuidv4();
        await this.insertSOP(trx, sopId, request.project_id, output);

        // Step 4: Insert milestones
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

            // Step 5: Insert verification checks for this milestone
            if (!milestone.checks || !Array.isArray(milestone.checks)) {
              logger.info('Milestone has no checks or invalid checks array', {
                milestone_id: milestoneId,
                milestone_title: milestone.title,
                checks: milestone.checks
              });
              continue; // Skip this milestone but continue with others
            }

            if (milestone.checks.length === 0) {
              logger.info('Milestone has empty checks array', {
                milestone_id: milestoneId,
                milestone_title: milestone.title
              });
              continue; // Skip this milestone but continue with others
            }

            logger.info('Inserting verification checks', {
              milestone_id: milestoneId,
              checks_to_insert: milestone.checks.length
            });

            for (const check of milestone.checks) {
              await this.insertVerificationCheck(trx, sopId, milestoneId, check);
            }

            logger.info('Successfully inserted milestone and its checks', {
              milestone_id: milestoneId,
              checks_inserted: milestone.checks.length
            });
          }
        } else {
          logger.info('No milestones found in AI output', {
            sop_id: sopId,
            output_milestones: output.milestones
          });
        }

        // Step 6: Commit transaction
        await trx.commit();

        logger.info('SOP generated and stored successfully', {
          sop_id: sopId,
          project_id: request.project_id,
          milestones_count: output.milestones?.length || 0
        });

        return { sop_id: sopId };

      } catch (error) {
        // Rollback on any error
        await trx.rollback();
        throw error;
      }

    } catch (error) {
      logger.error('Error generating and storing SOP', error);
      throw new Error(`Failed to generate and store SOP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async callAIAPI(request: SOPGenerationRequest): Promise<AIResponse> {
    try {
      const response = await axios.post(
          `${this.AI_API_BASE_URL}/ai/generate-sop`,
          request,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 600000, // 10 minutes timeout
          }
        );

      return response.data;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error_message || error.message;
        throw new Error(`AI API call failed: ${errorMessage}`);
      }
      throw new Error(`AI API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      sop_id: sopId, // ✅ ADD THIS
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

  async getSOPById(sopId: string): Promise<any | null> {
    try {
      const sop = await db('sops')
        .where({ sop_id: sopId })
        .first();

      return sop || null;
    } catch (error) {
      logger.error('Error fetching SOP by ID', error);
      throw new Error('Error fetching SOP');
    }
  }

  async getSOPsByProjectId(projectId: string): Promise<any[]> {
    try {
      const sops = await db('sops')
        .where({ project_id: projectId })
        .orderBy('created_at', 'desc');

      return sops;
    } catch (error) {
      logger.error('Error fetching SOPs by project ID', error);
      throw new Error('Error fetching SOPs');
    }
  }

  async getMilestonesBySOPId(sopId: string): Promise<any[]> {
    try {
      const milestones = await db('milestone_checks')
        .where({ project_id: db('sops').select('project_id').where({ sop_id: sopId }).first() })
        .orderBy('deadline', 'asc');

      return milestones;
    } catch (error) {
      logger.error('Error fetching milestones by SOP ID', error);
      throw new Error('Error fetching milestones');
    }
  }

  async getVerificationChecksByMilestoneId(milestoneId: string): Promise<any[]> {
    try {
      console.log('DEBUG: Fetching verification checks for milestone_id:', milestoneId);
      
      // First, let's see all milestone IDs in the verification_checks table
      const allMilestoneIds = await db('verification_checks')
        .select('milestone_id')
        .distinct();
      
      console.log('DEBUG: All milestone IDs in verification_checks:', allMilestoneIds.map(row => row.milestone_id));
      
      const checks = await db('verification_checks')
        .where({ milestone_id: milestoneId });
      
      console.log('DEBUG: Raw query result:', checks);
      console.log('DEBUG: Number of checks found:', checks.length);
      
      // Let's also check if the milestone exists and if there are any verification checks at all
      const milestoneExists = await db('milestone_checks')
        .where({ milestone_id: milestoneId })
        .first();
      
      console.log('DEBUG: Milestone exists:', !!milestoneExists);
      
      const allChecksCount = await db('verification_checks')
        .count('* as count')
        .first();
      
      console.log('DEBUG: Total verification checks in database:', allChecksCount?.count);
      
      return checks;
    } catch (error) {
      logger.error('Error fetching verification checks by milestone ID', error);
      throw new Error('Error fetching verification checks');
    }
  }

  async getVerificationCheckById(checkId: string): Promise<any | null> {
    try {
      const check = await db('verification_checks')
        .where({ check_id: checkId })
        .first();

      return check || null;
    } catch (error) {
      logger.error('Error fetching verification check by ID', error);
      throw new Error('Error fetching verification check');
    }
  }
}
