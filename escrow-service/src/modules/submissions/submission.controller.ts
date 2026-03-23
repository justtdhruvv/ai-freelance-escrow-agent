import { Request, Response } from 'express';
import { SubmissionService, CreateSubmissionInput } from './submission.service';
import { logger } from '../../utils/logger';

export class SubmissionController {
  private submissionService: SubmissionService;

  constructor() {
    this.submissionService = new SubmissionService();
  }

  createSubmission = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', '/submissions', req.body);
    
    try {
      const user = (req as any).user;
      
      if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { type, content, repo_url, repo_branch } = req.body;
      const project_id = req.body.project_id || req.params.project_id;
      const milestone_id = req.body.milestone_id || req.params.milestone_id;
      
      const submissionData: CreateSubmissionInput = {
        project_id,
        milestone_id,
        type,
        content: content || undefined,
        repo_url: repo_url || undefined,
        repo_branch: repo_branch || 'main'
      };

      // Validate required fields
      if (!project_id || typeof project_id !== 'string') {
        res.status(400).json({ error: 'project_id is required and must be a string' });
        return;
      }

      if (!milestone_id || typeof milestone_id !== 'string') {
        res.status(400).json({ error: 'milestone_id is required and must be a string' });
        return;
      }

      if (!type || !['code', 'content', 'design', 'mixed'].includes(type)) {
        res.status(400).json({ error: 'type is required and must be one of: code, content, design, mixed' });
        return;
      }

      // Validate that at least content or repo_url is provided
      if (!content && !repo_url) {
        res.status(400).json({ error: 'Either content or repo_url must be provided' });
        return;
      }

      const submission = await this.submissionService.createSubmission(user.userId, submissionData);

      const successResponse = {
        message: 'Submission created successfully',
        submission: {
          submission_id: submission.submission_id,
          project_id: submission.project_id,
          milestone_id: submission.milestone_id,
          type: submission.type,
          status: submission.status,
          submitted_at: submission.submitted_at,
          created_at: submission.created_at
        }
      };

      res.status(201).json(successResponse);

    } catch (error) {
      logger.error('Create submission error', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Unauthorized')) {
          res.status(403).json({ error: error.message });
          return;
        }
        
        if (error.message.includes('not found')) {
          res.status(404).json({ error: error.message });
          return;
        }
        
        if (error.message.includes('already exists')) {
          res.status(409).json({ error: error.message });
          return;
        }
      }
      
      res.status(500).json({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  getSubmission = async (req: Request, res: Response): Promise<void> => {
    logger.request('GET', `/submissions/${req.params.submission_id}`);
    
    try {
      const user = (req as any).user;
      
      if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { submission_id } = req.params;

      if (!submission_id || typeof submission_id !== 'string') {
        res.status(400).json({ error: 'submission_id is required and must be a string' });
        return;
      }

      const submission = await this.submissionService.getSubmissionById(submission_id);

      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      // TODO: Add authorization check - user can only view their own submissions
      // For now, return the submission
      res.status(200).json(submission);

    } catch (error) {
      logger.error('Get submission error', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };
}
