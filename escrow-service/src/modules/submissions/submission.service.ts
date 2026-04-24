import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

export interface CreateSubmissionInput {
  project_id: string;
  milestone_id: string;
  type: 'code' | 'content' | 'design' | 'mixed' | 'documentation' | 'other';
  content?: string;
  repo_url?: string;
  repo_branch?: string;
}

export interface Submission {
  submission_id: string;
  project_id: string;
  milestone_id: string;
  user_id: string;
  type: string;
  content?: string;
  repo_url?: string;
  repo_branch: string;
  status: 'draft' | 'submitted' | 'aqa_running' | 'aqa_completed' | 'aqa_failed';
  retry_count: number;
  submitted_at?: Date;
  aqa_started_at?: Date;
  aqa_completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface MilestoneWithChecks {
  milestone_id: string;
  project_id: string;
  title: string;
  deadline: string;
  payment_amount: number;
  status: string;
  revisions_used: number;
  max_revisions: number;
  checks: Array<{
    check_id: string;
    type: string;
    description: string;
    params: any;
    result: string;
    evidence?: string;
    verified_by: string;
  }>;
}

export class SubmissionService {
  async createSubmission(userId: string, data: CreateSubmissionInput): Promise<Submission> {
    const trx = await db.transaction();
    
    try {
      // 1. Verify user owns milestone
      const milestone = await trx('milestone_checks')
        .where({ milestone_id: data.milestone_id, project_id: data.project_id })
        .first();
      
      if (!milestone) {
        await trx.rollback();
        throw new Error('Milestone not found');
      }

      if (milestone.status === 'revision_exhausted') {
        await trx.rollback();
        throw new Error('Milestone revisions exhausted: no further submissions allowed');
      }

      const project = await trx('projects')
        .where({ project_id: data.project_id })
        .first();
      
      if (!project || project.freelancer_id !== userId) {
        await trx.rollback();
        throw new Error('Unauthorized: Only freelancer can submit milestone');
      }
      
      // 2. Check for active submission (PREVENT DUPLICATE)
      const activeSubmission = await trx('submissions')
        .where({ 
          milestone_id: data.milestone_id
        })
        .whereIn('status', ['submitted', 'aqa_running'])
        .first();
      
      if (activeSubmission) {
        await trx.rollback();
        throw new Error('Active submission already exists for this milestone');
      }
      
      // 3. Create submission
      const submissionData = {
        submission_id: uuidv4(),
        project_id: data.project_id,
        milestone_id: data.milestone_id,
        user_id: userId,
        type: data.type,
        content: data.content || null,
        repo_url: data.repo_url || null,
        repo_branch: data.repo_branch || 'main',
        status: 'submitted',
        submitted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await trx('submissions').insert(submissionData);
      
      // 4. Update milestone status
      await trx('milestone_checks')
        .where({ milestone_id: data.milestone_id })
        .update({ status: 'submitted' });
      
      await trx.commit();
      
      // 5. Return created submission
      const submission = await this.getSubmissionById(submissionData.submission_id);
      if (!submission) {
        throw new Error('Failed to retrieve created submission');
      }
      
      logger.info('Submission created successfully', {
        submission_id: submissionData.submission_id,
        milestone_id: data.milestone_id,
        user_id: userId
      });
      
      return submission;
      
    } catch (error) {
      await trx.rollback();
      logger.error('Error creating submission', error);
      throw error;
    }
  }
  
  async getSubmissionById(submissionId: string, requestingUserId?: string): Promise<Submission | null> {
    try {
      const submission = await db('submissions')
        .where({ submission_id: submissionId })
        .first();

      if (!submission) return null;

      if (requestingUserId && submission.user_id !== requestingUserId) {
        throw new Error('Unauthorized: you do not own this submission');
      }

      return submission;
    } catch (error) {
      logger.error('Error fetching submission by ID', error);
      throw error;
    }
  }
  
  async getActiveSubmissionByMilestone(milestoneId: string): Promise<Submission | null> {
    try {
      const submission = await db('submissions')
        .where({ 
          milestone_id: milestoneId
        })
        .whereIn('status', ['submitted', 'aqa_running'])
        .first();
      
      return submission || null;
    } catch (error) {
      logger.error('Error fetching active submission by milestone', error);
      throw new Error('Error fetching active submission');
    }
  }
  
  async updateSubmissionStatus(submissionId: string, status: string): Promise<void> {
    try {
      const updateData: any = { status, updated_at: new Date() };
      
      if (status === 'aqa_running') {
        updateData.aqa_started_at = new Date();
      } else if (status === 'aqa_completed' || status === 'aqa_failed') {
        updateData.aqa_completed_at = new Date();
      }
      
      await db('submissions')
        .where({ submission_id: submissionId })
        .update(updateData);
    } catch (error) {
      logger.error('Error updating submission status', error);
      throw new Error('Error updating submission status');
    }
  }
  
  async updateSubmissionStatusWithCondition(
    submissionId: string, 
    currentStatus: string, 
    newStatus: string
  ): Promise<boolean> {
    try {
      const updateData: any = { status: newStatus, updated_at: new Date() };
      
      if (newStatus === 'aqa_running') {
        updateData.aqa_started_at = new Date();
      } else if (newStatus === 'aqa_completed' || newStatus === 'aqa_failed') {
        updateData.aqa_completed_at = new Date();
      }
      
      const rowsUpdated = await db('submissions')
        .where({ 
          submission_id: submissionId,
          status: currentStatus
        })
        .update(updateData);
      
      return rowsUpdated > 0;
    } catch (error) {
      logger.error('Error updating submission status with condition', error);
      throw new Error('Error updating submission status');
    }
  }
  
  async getUserGitHubToken(userId: string): Promise<string | null> {
    try {
      const user = await db('users')
        .where({ user_id: userId })
        .select('github_token')
        .first();
      
      return user?.github_token || null;
    } catch (error) {
      logger.error('Error fetching user GitHub token', error);
      throw new Error('Error fetching user GitHub token');
    }
  }
  
  async incrementRetryCount(submissionId: string): Promise<void> {
    try {
      await db('submissions')
        .where({ submission_id: submissionId })
        .increment('retry_count', 1);
    } catch (error) {
      logger.error('Error incrementing retry count', error);
      throw new Error('Error incrementing retry count');
    }
  }
  
  async getMilestoneWithChecks(milestoneId: string): Promise<MilestoneWithChecks | null> {
    try {
      // Get milestone
      const milestone = await db('milestone_checks')
        .where({ milestone_id: milestoneId })
        .first();
      
      if (!milestone) {
        return null;
      }
      
      // Get verification checks
      const checks = await db('verification_checks')
        .where({ milestone_id: milestoneId })
        .select(
          'check_id',
          'type',
          'description',
          'params',
          'result',
          'evidence',
          'verified_by'
        );
      
      return {
        ...milestone,
        checks: checks.map(check => ({
          ...check,
          params: typeof check.params === 'string' ? JSON.parse(check.params) : check.params
        }))
      };
    } catch (error) {
      logger.error('Error fetching milestone with checks', error);
      throw new Error('Error fetching milestone with checks');
    }
  }
  
  async updateMilestoneStatus(milestoneId: string, verdict: string): Promise<void> {
    try {
      let status: string;
      switch (verdict) {
        case 'passed':
          status = 'passed';
          break;
        case 'partial':
          status = 'partial';
          break;
        case 'failed':
          status = 'failed';
          break;
        default:
          status = 'failed';
      }
      
      await db('milestone_checks')
        .where({ milestone_id: milestoneId })
        .update({ status });
    } catch (error) {
      logger.error('Error updating milestone status', error);
      throw new Error('Error updating milestone status');
    }
  }
}
