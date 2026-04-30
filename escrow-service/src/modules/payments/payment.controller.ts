import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { logger } from '../../utils/logger';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  /**
   * Simulate client funding a project into escrow
   * POST /payments/projects/:projectId/fund
   */
  fundProject = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', `/payments/projects/${req.params.projectId}/fund`, req.body);

    try {
      const user = (req as any).user;
      const projectId = req.params.projectId as string;

      if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const project = await this.paymentService.getProjectById(projectId);
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      if (project.employer_id !== user.userId) {
        res.status(403).json({ error: 'Only the project client can fund the project' });
        return;
      }

      const paymentEvent = await this.paymentService.fundProject(projectId);

      res.status(200).json({
        success: true,
        message: `Project funded successfully! ₹${(project.total_price / 100).toFixed(2)} is now held in escrow.`,
        payment_event_id: paymentEvent.payment_event_id,
        amount: paymentEvent.amount,
        project_id: paymentEvent.project_id
      });
    } catch (error) {
      logger.error('Fund project error', error);
      res.status(500).json({
        error: 'Failed to fund project',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Release milestone payment to freelancer
   * POST /payments/milestones/:milestoneId/release
   */
  releaseMilestonePayment = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', `/payments/milestones/${req.params.milestoneId}/release`, req.body);

    try {
      const user = (req as any).user;
      const milestoneId = req.params.milestoneId as string;
      const { triggered_by } = req.body;

      if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const milestone = await this.paymentService.getMilestoneById(milestoneId);
      if (!milestone) {
        res.status(404).json({ error: 'Milestone not found' });
        return;
      }

      const project = await this.paymentService.getProjectById(milestone.project_id);
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      if (project.employer_id !== user.userId) {
        res.status(403).json({ error: 'Only the project client can release milestone payments' });
        return;
      }

      const validTriggers = ['aqa_auto', 'manual', 'dispute_resolution'];
      const triggerType = triggered_by || 'manual';
      if (!validTriggers.includes(triggerType)) {
        res.status(400).json({ error: 'Invalid triggered_by parameter' });
        return;
      }

      const paymentEvent = await this.paymentService.releaseMilestonePayment(
        milestoneId,
        triggerType as 'aqa_auto' | 'manual' | 'dispute_resolution'
      );

      res.status(200).json({
        payment_event_id: paymentEvent.payment_event_id,
        milestone_id: milestoneId,
        amount: paymentEvent.amount,
        type: paymentEvent.type,
        triggered_by: paymentEvent.triggered_by,
        created_at: paymentEvent.created_at
      });
    } catch (error) {
      logger.error('Release milestone payment error', error);

      if (error instanceof Error) {
        if (error.message === 'Milestone not found') { res.status(404).json({ error: 'Milestone not found' }); return; }
        if (error.message === 'Milestone must be passed before payment can be released') { res.status(400).json({ error: error.message }); return; }
        if (error.message === 'Insufficient escrow balance') { res.status(400).json({ error: 'Insufficient escrow balance' }); return; }
      }

      res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  /**
   * Release prorated milestone payment to freelancer
   * POST /payments/milestones/:milestoneId/release-prorated
   */
  releaseProratedPayment = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', `/payments/milestones/${req.params.milestoneId}/release-prorated`, req.body);

    try {
      const user = (req as any).user;
      const milestoneId = req.params.milestoneId as string;
      const { passRate } = req.body;

      if (!user) { res.status(401).json({ error: 'User not authenticated' }); return; }
      if (passRate === undefined || passRate < 0 || passRate > 1) {
        res.status(400).json({ error: 'Valid pass rate (0-1) is required' });
        return;
      }

      const paymentEvent = await this.paymentService.releaseProratedPayment(milestoneId, passRate, 'manual');
      res.status(200).json({ success: true, message: 'Prorated payment released', data: paymentEvent });
    } catch (error) {
      logger.error('Error releasing prorated payment', error);
      res.status(500).json({ error: 'Failed to release prorated payment', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  /**
   * Get payment events for a project
   * GET /payments/projects/:projectId/payment-events
   */
  getProjectPaymentEvents = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const projectId = req.params.projectId as string;

      if (!user) { res.status(401).json({ error: 'User not authenticated' }); return; }

      const project = await this.paymentService.getProjectById(projectId);
      if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

      if (project.employer_id !== user.userId && project.freelancer_id !== user.userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const paymentEvents = await this.paymentService.getPaymentEventsByProject(projectId);
      res.status(200).json({ project_id: projectId, payment_events: paymentEvents, count: paymentEvents.length });
    } catch (error) {
      logger.error('Get project payment events error', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
