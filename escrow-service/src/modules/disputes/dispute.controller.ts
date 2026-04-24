import { Request, Response } from 'express';
import { DisputeService } from './dispute.service';
import { logger } from '../../utils/logger';

export class DisputeController {
  private disputeService: DisputeService;

  constructor() {
    this.disputeService = new DisputeService();
  }

  createDispute = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      if (!user) { res.status(401).json({ error: 'Unauthenticated' }); return; }

      const { project_id, dispute_type, description, milestone_id } = req.body;

      if (!project_id || !dispute_type || !description) {
        res.status(400).json({ error: 'project_id, dispute_type, and description are required' });
        return;
      }

      const dispute = await this.disputeService.createDispute({
        project_id,
        raised_by: user.userId,
        dispute_type,
        description,
        milestone_id
      });

      res.status(201).json(dispute);
    } catch (error) {
      logger.error('Create dispute error', error);
      res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  getProjectDisputes = async (req: Request, res: Response): Promise<void> => {
    try {
      const project_id = req.params.project_id as string;
      const disputes = await this.disputeService.getDisputesByProject(project_id);
      res.status(200).json(disputes);
    } catch (error) {
      logger.error('Get project disputes error', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getMyDisputes = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      if (!user) { res.status(401).json({ error: 'Unauthenticated' }); return; }

      const disputes = await this.disputeService.getDisputesForUser(user.userId);
      res.status(200).json(disputes);
    } catch (error) {
      logger.error('Get my disputes error', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getAllDisputes = async (req: Request, res: Response): Promise<void> => {
    try {
      const disputes = await this.disputeService.getAllDisputes();
      res.status(200).json(disputes);
    } catch (error) {
      logger.error('Get all disputes error', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  resolveDispute = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      if (!user) { res.status(401).json({ error: 'Unauthenticated' }); return; }

      const dispute_id = req.params.dispute_id as string;
      const { resolution } = req.body;

      if (!resolution) {
        res.status(400).json({ error: 'resolution text is required' });
        return;
      }

      const dispute = await this.disputeService.resolveDispute(dispute_id, user.userId, resolution);
      res.status(200).json(dispute);
    } catch (error) {
      logger.error('Resolve dispute error', error);
      res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  updateDisputeStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const dispute_id = req.params.dispute_id as string;
      const { status } = req.body;

      const validStatuses = ['open', 'under_review', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
        return;
      }

      const dispute = await this.disputeService.updateDisputeStatus(dispute_id, status);
      res.status(200).json(dispute);
    } catch (error) {
      logger.error('Update dispute status error', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
