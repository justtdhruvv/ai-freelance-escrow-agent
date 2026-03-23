import { Request, Response } from 'express';
import { AQAService } from './aqa.service';
import { SubmissionService } from '../submissions/submission.service';
import { logger } from '../../utils/logger';

export class AQAController {
  private aqaService: AQAService;
  private submissionService: SubmissionService;

  constructor() {
    this.aqaService = new AQAService();
    this.submissionService = new SubmissionService();
  }

  runAQA = async (req: Request, res: Response): Promise<void> => {
    console.log('🎮 AQA Controller runAQA called');
    logger.request('POST', `/submissions/${req.params.submission_id}/run-aqa`);
    
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

      // 1. Idempotency check
      const canRun = await this.aqaService.canRunAQA(submission_id);
      
      if (!canRun.canRun) {
        if (canRun.existingResult) {
          // Return existing result
          res.status(200).json(canRun.existingResult);
          return;
        }
        
        res.status(400).json({ error: canRun.reason });
        return;
      }

      // 2. Race condition prevention - update status with condition
      logger.info('Attempting to update submission status', {
        submission_id,
        expected_status: 'submitted or aqa_failed or aqa_completed',
        new_status: 'aqa_running'
      });
      
      // Try to update from 'submitted' first
      let statusUpdated = await this.submissionService.updateSubmissionStatusWithCondition(
        submission_id, 
        'submitted', 
        'aqa_running'
      );

      // If that fails, try from 'aqa_failed' (retry scenario)
      if (!statusUpdated) {
        statusUpdated = await this.submissionService.updateSubmissionStatusWithCondition(
          submission_id, 
          'aqa_failed', 
          'aqa_running'
        );
      }

      // If that fails, try from 'aqa_completed' (error retry scenario)
      if (!statusUpdated) {
        statusUpdated = await this.submissionService.updateSubmissionStatusWithCondition(
          submission_id, 
          'aqa_completed', 
          'aqa_running'
        );
      }

      logger.info('Status update result', {
        submission_id,
        status_updated: statusUpdated
      });

      if (!statusUpdated) {
        // Check current submission status for debugging
        const currentSubmission = await this.submissionService.getSubmissionById(submission_id);
        logger.error('Conditional update failed', {
          submission_id,
          current_status: currentSubmission?.status,
          expected_status: 'submitted or aqa_failed or aqa_completed'
        });
        
        // Someone else already started AQA or status changed
        const existingResult = await this.aqaService.getAQAResult(submission_id);
        if (existingResult) {
          res.status(200).json(existingResult);
          return;
        }
        
        res.status(400).json({ 
          error: 'AQA already running or submission status changed',
          details: `Current status: ${currentSubmission?.status}, Expected: submitted or aqa_failed or aqa_completed`
        });
        return;
      }

      // 3. Execute AQA (synchronous)
      const result = await this.aqaService.runAQA(submission_id);

      // 4. Return result
      res.status(200).json(result);

    } catch (error) {
      logger.error('Run AQA error', error);
      
      // Update submission status to failed if not already updated
      try {
        const submissionId = Array.isArray(req.params.submission_id) 
          ? req.params.submission_id[0] 
          : req.params.submission_id;
        await this.submissionService.updateSubmissionStatus(submissionId, 'aqa_failed');
      } catch (statusError) {
        logger.error('Failed to update submission status after AQA error', statusError);
      }
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ error: error.message });
          return;
        }
        
        if (error.message.includes('Maximum retry')) {
          res.status(400).json({ error: error.message });
          return;
        }
      }
      
      res.status(500).json({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  getAQAResult = async (req: Request, res: Response): Promise<void> => {
    logger.request('GET', `/submissions/${req.params.submission_id}/aqa-result`);
    
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

      const result = await this.aqaService.getAQAResult(submission_id);

      if (!result) {
        res.status(404).json({ error: 'AQA result not found' });
        return;
      }

      res.status(200).json(result);

    } catch (error) {
      logger.error('Get AQA result error', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  retryAQA = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', `/submissions/${req.params.submission_id}/retry-aqa`);
    
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

      const result = await this.aqaService.retryAQA(submission_id);

      res.status(200).json(result);

    } catch (error) {
      logger.error('Retry AQA error', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ error: error.message });
          return;
        }
        
        if (error.message.includes('Maximum retry')) {
          res.status(400).json({ error: error.message });
          return;
        }
      }
      
      res.status(500).json({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };
}
