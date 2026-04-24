import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

export interface Dispute {
  dispute_id: string;
  project_id: string;
  raised_by: string;
  dispute_type: string;
  description: string;
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  resolution?: string;
  resolved_by?: string;
  milestone_id?: string;
  created_at: Date;
  resolved_at?: Date;
  updated_at: Date;
}

export class DisputeService {
  async createDispute(data: {
    project_id: string;
    raised_by: string;
    dispute_type: string;
    description: string;
    milestone_id?: string;
  }): Promise<Dispute> {
    try {
      const dispute_id = uuidv4();
      const now = new Date();

      // Mark project as disputed
      await db('projects').where({ project_id: data.project_id }).update({ status: 'disputed' });

      await db('disputes').insert({
        dispute_id,
        project_id: data.project_id,
        raised_by: data.raised_by,
        dispute_type: data.dispute_type,
        description: data.description,
        milestone_id: data.milestone_id || null,
        status: 'open',
        created_at: now,
        updated_at: now
      });

      const dispute = await db('disputes').where({ dispute_id }).first();
      logger.info('Dispute created', { dispute_id, project_id: data.project_id });
      return dispute;
    } catch (error) {
      logger.error('Error creating dispute', error);
      throw error;
    }
  }

  async getDisputesByProject(project_id: string): Promise<Dispute[]> {
    try {
      return await db('disputes').where({ project_id }).orderBy('created_at', 'desc');
    } catch (error) {
      logger.error('Error fetching disputes by project', error);
      throw new Error('Error fetching disputes');
    }
  }

  async getDisputesByUser(user_id: string): Promise<Dispute[]> {
    try {
      return await db('disputes').where({ raised_by: user_id }).orderBy('created_at', 'desc');
    } catch (error) {
      logger.error('Error fetching disputes by user', error);
      throw new Error('Error fetching disputes');
    }
  }

  async getDisputesForUser(userId: string): Promise<Dispute[]> {
    try {
      const userProjects = await db('projects')
        .where({ freelancer_id: userId })
        .orWhere({ employer_id: userId })
        .select('project_id');

      const projectIds = userProjects.map((p: any) => p.project_id);

      return await db('disputes')
        .where({ raised_by: userId })
        .orWhereIn('project_id', projectIds)
        .orderBy('created_at', 'desc');
    } catch (error) {
      logger.error('Error fetching disputes for user', error);
      throw new Error('Error fetching disputes');
    }
  }

  async getDisputeById(dispute_id: string): Promise<Dispute | null> {
    try {
      const dispute = await db('disputes').where({ dispute_id }).first();
      return dispute || null;
    } catch (error) {
      logger.error('Error fetching dispute', error);
      throw new Error('Error fetching dispute');
    }
  }

  async getAllDisputes(): Promise<Dispute[]> {
    try {
      return await db('disputes').orderBy('created_at', 'desc');
    } catch (error) {
      logger.error('Error fetching all disputes', error);
      throw new Error('Error fetching disputes');
    }
  }

  async resolveDispute(dispute_id: string, resolved_by: string, resolution: string): Promise<Dispute> {
    try {
      const dispute = await this.getDisputeById(dispute_id);
      if (!dispute) throw new Error('Dispute not found');

      const now = new Date();
      await db('disputes').where({ dispute_id }).update({
        status: 'resolved',
        resolution,
        resolved_by,
        resolved_at: now,
        updated_at: now
      });

      // Restore project status to active if it was only disputed
      const otherOpenDisputes = await db('disputes')
        .where({ project_id: dispute.project_id, status: 'open' })
        .whereNot({ dispute_id })
        .count('dispute_id as count')
        .first();

      if (Number(otherOpenDisputes?.count || 0) === 0) {
        await db('projects').where({ project_id: dispute.project_id }).update({ status: 'active' });
      }

      logger.info('Dispute resolved', { dispute_id, resolved_by });
      return await this.getDisputeById(dispute_id) as Dispute;
    } catch (error) {
      logger.error('Error resolving dispute', error);
      throw error;
    }
  }

  async updateDisputeStatus(dispute_id: string, status: 'open' | 'under_review' | 'resolved' | 'closed'): Promise<Dispute> {
    try {
      await db('disputes').where({ dispute_id }).update({ status, updated_at: new Date() });
      return await this.getDisputeById(dispute_id) as Dispute;
    } catch (error) {
      logger.error('Error updating dispute status', error);
      throw error;
    }
  }
}
