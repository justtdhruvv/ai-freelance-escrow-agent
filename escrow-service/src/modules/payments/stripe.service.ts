import Stripe from 'stripe';
import db from '../../config/database';
import { logger } from '../../utils/logger';
import { PaymentService } from './payment.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export class StripeService {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  async createCheckoutSession(projectId: string, userId: string): Promise<string> {
    const project = await db('projects').where({ project_id: projectId }).first();
    if (!project) throw new Error('Project not found');
    if (project.employer_id !== userId) throw new Error('Only the project employer can fund this project');

    const fundableStatuses = ['draft', 'sop_review', 'client_review', 'pending'];
    if (!fundableStatuses.includes(project.status)) {
      throw new Error('Project is already funded or not in a fundable state');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const projectName = project.name || `Project ${projectId.slice(0, 8)}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: `Escrow: ${projectName}`,
              description: 'Funds held securely in escrow. Released to freelancer only when milestones pass AI quality checks.',
            },
            unit_amount: project.total_price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${frontendUrl}/dashboard/projects?session_id={CHECKOUT_SESSION_ID}&project_id=${projectId}`,
      cancel_url: `${frontendUrl}/dashboard/projects?payment_cancelled=true`,
      metadata: {
        project_id: projectId,
        user_id: userId,
      },
    });

    logger.info('Stripe checkout session created', { project_id: projectId, session_id: session.id });
    return session.url!;
  }

  async verifyAndFundProject(sessionId: string, projectId: string, userId: string): Promise<any> {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed');
    }

    if (session.metadata?.project_id !== projectId) {
      throw new Error('Session does not match this project');
    }

    const paymentEvent = await this.paymentService.fundProject(projectId);

    logger.info('Project escrow funded via Stripe', {
      project_id: projectId,
      session_id: sessionId,
      amount: paymentEvent.amount,
    });

    return paymentEvent;
  }
}
