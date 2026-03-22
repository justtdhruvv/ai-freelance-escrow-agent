import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { RazorpayService } from './razorpay.service';
import { logger } from '../../utils/logger';

export class PaymentController {
  private paymentService: PaymentService;
  private razorpayService: RazorpayService;

  constructor() {
    this.paymentService = new PaymentService();
    this.razorpayService = new RazorpayService();
  }

  /**
   * Create escrow order for project funding
   * POST /projects/:projectId/escrow
   */
  createEscrowOrder = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', `/projects/${req.params.projectId}/escrow`, req.body);
    
    try {
      const user = (req as any).user;
      const { projectId } = req.params;
      
      if (!user) {
        const errorResponse = { error: 'User not authenticated' };
        res.status(401).json(errorResponse);
        return;
      }

      if (!projectId || Array.isArray(projectId)) {
        const errorResponse = { error: 'Valid Project ID is required' };
        res.status(400).json(errorResponse);
        return;
      }

      // Verify project exists and user has access
      const project = await this.paymentService.getProjectById(projectId);
      
      if (!project) {
        const errorResponse = { error: 'Project not found' };
        res.status(404).json(errorResponse);
        return;
      }

      // Only employer (client) can fund the project
      if (project.employer_id !== user.userId) {
        const errorResponse = { error: 'Only the project client can create escrow order' };
        res.status(403).json(errorResponse);
        return;
      }

      // Project should be in draft status to create escrow
      if (project.status !== 'draft') {
        const errorResponse = { error: 'Project must be in draft status to create escrow order' };
        res.status(400).json(errorResponse);
        return;
      }

      // Validate project has total_price
      if (!project.total_price || project.total_price <= 0) {
        const errorResponse = { error: 'Project must have a valid total price' };
        res.status(400).json(errorResponse);
        return;
      }

      // Create escrow order
      const escrowOrder = await this.paymentService.createEscrowOrder(
        projectId,
        project.total_price
      );

      const successResponse = {
        order_id: escrowOrder.order_id,
        amount: escrowOrder.amount,
        currency: escrowOrder.currency,
        key_id: this.razorpayService.getPublicKey(),
        project_details: {
          project_id: projectId,
          total_price: project.total_price,
          status: project.status
        }
      };

      res.status(201).json(successResponse);
    } catch (error) {
      logger.error('Create escrow order error', error);
      const errorResponse = { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      };
      res.status(500).json(errorResponse);
    }
  };

  /**
   * Confirm real payment
   * POST /payments/confirm
   */
  confirmPayment = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', '/payments/confirm', req.body);
    
    try {
      const { order_id, payment_id, razorpay_signature } = req.body;
      
      if (!order_id || !payment_id || !razorpay_signature) {
        const errorResponse = { error: 'order_id, payment_id, and razorpay_signature are required' };
        res.status(400).json(errorResponse);
        return;
      }

      // Confirm payment
      const paymentEvent = await this.paymentService.confirmPayment({
        order_id,
        payment_id,
        razorpay_signature
      });

      const successResponse = {
        payment_event_id: paymentEvent.payment_event_id,
        project_id: paymentEvent.project_id,
        type: paymentEvent.type,
        amount: paymentEvent.amount,
        order_id: paymentEvent.razorpay_order_id,
        payment_id: paymentEvent.razorpay_payment_id,
        created_at: paymentEvent.created_at
      };

      res.status(200).json(successResponse);
    } catch (error) {
      logger.error('Confirm payment error', error);
      const errorResponse = { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      };
      res.status(500).json(errorResponse);
    }
  };

  /**
   * Release milestone payment to freelancer
   * POST /milestones/:milestoneId/release
   */
  releaseMilestonePayment = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', `/milestones/${req.params.milestoneId}/release`, req.body);
    
    try {
      const user = (req as any).user;
      const { milestoneId } = req.params;
      const { triggered_by } = req.body;
      
      if (!user) {
        const errorResponse = { error: 'User not authenticated' };
        res.status(401).json(errorResponse);
        return;
      }

      if (!milestoneId || Array.isArray(milestoneId)) {
        const errorResponse = { error: 'Valid Milestone ID is required' };
        res.status(400).json(errorResponse);
        return;
      }

      // Get milestone details
      const milestone = await this.paymentService.getMilestoneById(milestoneId);
      
      if (!milestone) {
        const errorResponse = { error: 'Milestone not found' };
        res.status(404).json(errorResponse);
        return;
      }

      // Get project details to verify permissions
      const project = await this.paymentService.getProjectById(milestone.project_id);
      
      if (!project) {
        const errorResponse = { error: 'Project not found' };
        res.status(404).json(errorResponse);
        return;
      }

      // Only employer (client) can release milestone payments
      if (project.employer_id !== user.userId) {
        const errorResponse = { error: 'Only the project client can release milestone payments' };
        res.status(403).json(errorResponse);
        return;
      }

      // Validate triggered_by parameter
      const validTriggerTypes = ['aqa_auto', 'manual', 'dispute_resolution'];
      const triggerType = triggered_by || 'manual';
      
      if (!validTriggerTypes.includes(triggerType)) {
        const errorResponse = { error: 'Invalid triggered_by parameter' };
        res.status(400).json(errorResponse);
        return;
      }

      // Release milestone payment
      const paymentEvent = await this.paymentService.releaseMilestonePayment(
        milestoneId,
        triggerType as 'aqa_auto' | 'manual' | 'dispute_resolution'
      );

      const successResponse = {
        payment_event_id: paymentEvent.payment_event_id,
        milestone_id: milestoneId,
        amount: paymentEvent.amount,
        type: paymentEvent.type,
        triggered_by: paymentEvent.triggered_by,
        razorpay_transfer_id: paymentEvent.razorpay_transfer_id,
        created_at: paymentEvent.created_at
      };

      res.status(200).json(successResponse);
    } catch (error) {
      logger.error('Release milestone payment error', error);
      
      if (error instanceof Error) {
        if (error.message === 'Milestone not found') {
          const errorResponse = { error: 'Milestone not found' };
          res.status(404).json(errorResponse);
          return;
        }
        
        if (error.message === 'Milestone must be passed before payment can be released') {
          const errorResponse = { error: 'Milestone must be passed before payment can be released' };
          res.status(400).json(errorResponse);
          return;
        }
        
        if (error.message === 'Insufficient escrow balance') {
          const errorResponse = { error: 'Insufficient escrow balance' };
          res.status(400).json(errorResponse);
          return;
        }
      }
      
      const errorResponse = { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      };
      res.status(500).json(errorResponse);
    }
  };

  /**
   * Get payment events for a project
   * GET /projects/:projectId/payment-events
   */
  getProjectPaymentEvents = async (req: Request, res: Response): Promise<void> => {
    logger.request('GET', `/projects/${req.params.projectId}/payment-events`);
    
    try {
      const user = (req as any).user;
      const { projectId } = req.params;
      
      if (!user) {
        const errorResponse = { error: 'User not authenticated' };
        res.status(401).json(errorResponse);
        return;
      }

      if (!projectId || Array.isArray(projectId)) {
        const errorResponse = { error: 'Valid Project ID is required' };
        res.status(400).json(errorResponse);
        return;
      }

      // Verify project exists and user has access
      const project = await this.paymentService.getProjectById(projectId);
      
      if (!project) {
        const errorResponse = { error: 'Project not found' };
        res.status(404).json(errorResponse);
        return;
      }

      // Only project participants (client or freelancer) can view payment events
      if (project.employer_id !== user.userId && project.freelancer_id !== user.userId) {
        const errorResponse = { error: 'Access denied' };
        res.status(403).json(errorResponse);
        return;
      }

      // Get payment events
      const paymentEvents = await this.paymentService.getPaymentEventsByProject(projectId);

      const successResponse = {
        project_id: projectId,
        payment_events: paymentEvents,
        count: paymentEvents.length
      };

      res.status(200).json(successResponse);
    } catch (error) {
      logger.error('Get project payment events error', error);
      const errorResponse = { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      };
      res.status(500).json(errorResponse);
    }
  };

  /**
   * Get Razorpay public key for frontend
   * GET /payments/key
   */
  getRazorpayKey = async (req: Request, res: Response): Promise<void> => {
    logger.request('GET', '/payments/key');
    
    try {
      const publicKey = this.razorpayService.getPublicKey();
      
      if (!publicKey) {
        const errorResponse = { error: 'Razorpay not configured' };
        res.status(500).json(errorResponse);
        return;
      }

      const successResponse = {
        key_id: publicKey
      };

      res.status(200).json(successResponse);
    } catch (error) {
      logger.error('Get Razorpay key error', error);
      const errorResponse = { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      };
      res.status(500).json(errorResponse);
    }
  };
}
