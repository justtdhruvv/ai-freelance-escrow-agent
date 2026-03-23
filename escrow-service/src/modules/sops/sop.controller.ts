import { Request, Response } from 'express';
import { SOPService, SOPGenerationRequest } from './sop.service';
import { logger } from '../../utils/logger';

export class SOPController {
  private sopService: SOPService;

  constructor() {
    this.sopService = new SOPService();
  }

  generateSOP = async (req: Request, res: Response): Promise<void> => {
    try {
      const { project_id, raw_text, domain, timeline_days }: SOPGenerationRequest = req.body;

      // Validate required fields
      if (!project_id || typeof project_id !== 'string') {
        res.status(400).json({ error: 'project_id is required and must be a string' });
        return;
      }

      if (!raw_text || typeof raw_text !== 'string') {
        res.status(400).json({ error: 'raw_text is required and must be a string' });
        return;
      }

      if (!domain || typeof domain !== 'string') {
        res.status(400).json({ error: 'domain is required and must be a string' });
        return;
      }

      if (!timeline_days || typeof timeline_days !== 'number' || timeline_days <= 0) {
        res.status(400).json({ error: 'timeline_days is required and must be a positive number' });
        return;
      }

      // Generate and store SOP
      const result = await this.sopService.generateAndStoreSOP({
        project_id,
        raw_text,
        domain,
        timeline_days
      });

      res.status(201).json(result);

    } catch (error) {
      logger.error('Generate SOP error', error);
      
      if (error instanceof Error) {
        if (error.message.includes('AI API failed')) {
          res.status(503).json({ error: 'AI service unavailable', details: error.message });
        } else if (error.message.includes('not found')) {
          res.status(404).json({ error: 'Resource not found', details: error.message });
        } else if (error.message.includes('validation') || error.message.includes('required')) {
          res.status(400).json({ error: 'Invalid input', details: error.message });
        } else {
          res.status(500).json({ error: 'Internal server error', details: error.message });
        }
      } else {
        res.status(500).json({ error: 'Internal server error', details: 'Unknown error' });
      }
    }
  };

  getSOPById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sop_id } = req.params;

      if (!sop_id || typeof sop_id !== 'string') {
        res.status(400).json({ error: 'sop_id is required and must be a string' });
        return;
      }

      const sop = await this.sopService.getSOPById(sop_id);

      if (!sop) {
        res.status(404).json({ error: 'SOP not found' });
        return;
      }

      res.status(200).json(sop);

    } catch (error) {
      logger.error('Get SOP by ID error', error);
      res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  getSOPsByProjectId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { project_id } = req.params;

      if (!project_id || typeof project_id !== 'string') {
        res.status(400).json({ error: 'project_id is required and must be a string' });
        return;
      }

      const sops = await this.sopService.getSOPsByProjectId(project_id);
      res.status(200).json(sops);

    } catch (error) {
      logger.error('Get SOPs by project ID error', error);
      res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  getMilestonesBySOPId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sop_id } = req.params;

      if (!sop_id || typeof sop_id !== 'string') {
        res.status(400).json({ error: 'sop_id is required and must be a string' });
        return;
      }

      const milestones = await this.sopService.getMilestonesBySOPId(sop_id);
      res.status(200).json(milestones);

    } catch (error) {
      logger.error('Get milestones by SOP ID error', error);
      res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  getVerificationChecksByMilestoneId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { milestone_id } = req.params;

      if (!milestone_id || typeof milestone_id !== 'string') {
        res.status(400).json({ error: 'milestone_id is required and must be a string' });
        return;
      }

      const checks = await this.sopService.getVerificationChecksByMilestoneId(milestone_id);
      res.status(200).json(checks);

    } catch (error) {
      logger.error('Get verification checks by milestone ID error', error);
      res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  getVerificationCheckById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { check_id } = req.params;

      if (!check_id || typeof check_id !== 'string') {
        res.status(400).json({ error: 'check_id is required and must be a string' });
        return;
      }

      const check = await this.sopService.getVerificationCheckById(check_id);

      if (!check) {
        res.status(404).json({ error: 'Verification check not found' });
        return;
      }

      res.status(200).json(check);

    } catch (error) {
      logger.error('Get verification check by ID error', error);
      res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  };
}
