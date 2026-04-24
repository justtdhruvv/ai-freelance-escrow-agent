import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import { SubmissionService, Submission, MilestoneWithChecks } from '../submissions/submission.service';
import { runCheck, VerificationCheck } from '../ai/check.runners';

export interface AQAResult {
  aqa_id: string;
  submission_id: string;
  milestone_id: string;
  verdict: 'passed' | 'partial' | 'failed' | 'error';
  pass_rate: number;
  payment_trigger: 'full' | 'prorated' | 'none' | 'error';
  payment_status: 'pending' | 'processed';
  audit_report: any;
  all_checks: any;
  milestone_amount: number;
  execution_time_ms?: number;
  ai_model_used?: string;
  error_message?: string;
  aqa_version: string;
  created_at: Date;
}

export class AQAService {
  private submissionService: SubmissionService;

  constructor() {
    this.submissionService = new SubmissionService();
  }

  async runAQA(submissionId: string): Promise<AQAResult> {
    const trx = await db.transaction();

    try {
      const submission = await this.submissionService.getSubmissionById(submissionId);
      if (!submission) throw new Error('Submission not found');

      const milestone = await this.submissionService.getMilestoneWithChecks(submission.milestone_id || '');
      if (!milestone) throw new Error('Milestone not found');

      const githubToken = await this.submissionService.getUserGitHubToken(submission.user_id);

      const startTime = Date.now();
      const aqaOutput = await this.runChecks(submission, milestone, githubToken || '');
      const executionTime = Date.now() - startTime;

      logger.info('Storing AQA result', {
        submission_id: submissionId,
        milestone_id: milestone.milestone_id,
        verdict: aqaOutput.verdict,
        execution_time_ms: executionTime
      });

      const aqaResult = await this.storeAQAResult(trx, submissionId, milestone.milestone_id, {
        ...aqaOutput,
        execution_time_ms: executionTime
      });

      await trx('submissions')
        .where({ submission_id: submissionId })
        .update({ status: 'aqa_completed', aqa_completed_at: new Date(), updated_at: new Date() });

      await this.submissionService.updateMilestoneStatus(milestone.milestone_id, aqaResult.verdict);
      if (aqaResult.verdict === 'failed') {
        await this.applyRevisionLogic(trx, milestone.milestone_id);
      }
      await this.processPaymentTrigger(trx, aqaResult);
      await this.checkAndCompleteProject(trx, milestone.milestone_id);
      await this.updatePfiScore(submission.user_id, aqaResult.verdict);

      await trx.commit();

      logger.info('AQA completed successfully', {
        aqa_id: aqaResult.aqa_id,
        submission_id: submissionId,
        verdict: aqaResult.verdict,
        execution_time_ms: executionTime
      });

      return aqaResult;

    } catch (error) {
      await trx.rollback();
      await this.submissionService.updateSubmissionStatus(submissionId, 'aqa_failed');
      await this.submissionService.incrementRetryCount(submissionId);
      logger.error('AQA execution failed', error);
      throw error;
    }
  }

  private async runChecks(
    submission: Submission,
    milestone: MilestoneWithChecks,
    githubToken: string
  ): Promise<any> {
    const checkContext: Record<string, string> = {
      base_url: '',
      repo_url: submission.repo_url || '',
      content: submission.content || '',
      github_token: githubToken
    };

    // Run all auto checks concurrently
    const autoChecks = milestone.checks.filter(c => c.verified_by !== 'manual');
    const manualChecks = milestone.checks.filter(c => c.verified_by === 'manual');

    const checkInputs: VerificationCheck[] = autoChecks.map(c => ({
      check_id: c.check_id,
      type: c.type,
      description: c.description,
      params: typeof c.params === 'string' ? JSON.parse(c.params) : (c.params || {}),
      verified_by: c.verified_by || 'auto'
    }));

    const completedChecks = await Promise.all(
      checkInputs.map(check => runCheck(check, checkContext))
    );

    // Handle manual checks
    const manualResults: VerificationCheck[] = manualChecks.map(c => ({
      check_id: c.check_id,
      type: c.type,
      description: c.description,
      params: typeof c.params === 'string' ? JSON.parse(c.params) : (c.params || {}),
      result: 'pending',
      evidence: 'Requires manual review',
      verified_by: 'manual',
      verified_at: new Date().toISOString()
    }));

    const allChecks = [...completedChecks, ...manualResults];

    // Calculate pass_rate from auto checks only
    const passed = completedChecks.filter(c => c.result === 'pass').length;
    const partial = completedChecks.filter(c => c.result === 'partial').length;
    const total = completedChecks.length;
    const passRate = total === 0 ? 1.0 : (passed + partial * 0.5) / total;

    let verdict: string;
    if (passRate === 1.0) verdict = 'passed';
    else if (passRate >= 0.5) verdict = 'partial';
    else verdict = 'failed';

    let paymentTrigger: string;
    if (verdict === 'passed') paymentTrigger = 'full';
    else if (verdict === 'partial') paymentTrigger = 'prorated';
    else paymentTrigger = 'none';

    const summary = `Milestone '${milestone.title}': ${verdict}. Pass rate: ${Math.round(passRate * 100)}%`;

    const auditReport = {
      summary,
      passed_checks: completedChecks.filter(c => c.result === 'pass').map(c => c.description),
      failed_checks: completedChecks.filter(c => c.result === 'fail').map(c => ({
        check: c.description,
        reason: c.evidence || ''
      })),
      missing_items: completedChecks.filter(c => c.result === 'fail').map(c => c.description),
      comparison_table: completedChecks.map(c => ({
        expected: c.description,
        actual: c.evidence || 'no evidence'
      }))
    };

    return {
      verdict,
      pass_rate: passRate,
      payment_trigger: paymentTrigger,
      milestone_amount: milestone.payment_amount,
      audit_report: auditReport,
      all_checks: allChecks
    };
  }

  async canRunAQA(submissionId: string): Promise<{ canRun: boolean; reason?: string; existingResult?: AQAResult }> {
    try {
      const submission = await this.submissionService.getSubmissionById(submissionId);

      if (!submission) return { canRun: false, reason: 'Submission not found' };
      if (submission.status === 'aqa_running') {
        const staleCutoff = 600000;
        const updatedAt = new Date(submission.updated_at).getTime();
        if (new Date().getTime() - updatedAt > staleCutoff) {
          await this.submissionService.updateSubmissionStatus(submission.submission_id, 'submitted');
          return { canRun: true };
        } else {
          return { canRun: false, reason: 'AQA already running for this submission' };
        }
      }

      if (submission.status === 'aqa_completed') {
        const existingResult = await this.getAQAResult(submissionId);
        if (existingResult?.verdict === 'error') return { canRun: true };
        return { canRun: false, reason: 'AQA already completed for this submission', existingResult: existingResult || undefined };
      }

      if (submission.retry_count >= 3) return { canRun: false, reason: 'Maximum retry attempts exceeded' };

      return { canRun: true };
    } catch (error) {
      logger.error('Error checking AQA eligibility', error);
      return { canRun: false, reason: 'Error checking AQA eligibility' };
    }
  }

  async getAQAResult(submissionId: string): Promise<AQAResult | null> {
    try {
      const result = await db('aqa_results').where({ submission_id: submissionId }).first();
      return result || null;
    } catch (error) {
      logger.error('Error fetching AQA result', error);
      throw new Error('Error fetching AQA result');
    }
  }

  async retryAQA(submissionId: string): Promise<AQAResult> {
    const submission = await this.submissionService.getSubmissionById(submissionId);
    if (!submission) throw new Error('Submission not found');
    if (submission.retry_count >= 3) throw new Error('Maximum retry attempts exceeded');

    await this.submissionService.updateSubmissionStatus(submissionId, 'submitted');
    await this.submissionService.incrementRetryCount(submissionId);
    return await this.runAQA(submissionId);
  }

  private async applyRevisionLogic(trx: any, milestoneId: string): Promise<void> {
    const milestone = await trx('milestone_checks').where({ milestone_id: milestoneId }).first();
    if (!milestone) return;

    if (milestone.revisions_used < milestone.max_revisions) {
      await trx('milestone_checks')
        .where({ milestone_id: milestoneId })
        .update({
          revisions_used: milestone.revisions_used + 1,
          status: 'pending'
        });
      logger.info('Revision applied, milestone reset to pending', {
        milestone_id: milestoneId,
        revisions_used: milestone.revisions_used + 1,
        max_revisions: milestone.max_revisions
      });
    } else {
      await trx('milestone_checks')
        .where({ milestone_id: milestoneId })
        .update({ status: 'revision_exhausted' });
      logger.info('Revision limit reached, milestone marked exhausted', {
        milestone_id: milestoneId
      });
    }
  }

  private async checkAndCompleteProject(trx: any, milestoneId: string): Promise<void> {
    try {
      const milestone = await trx('milestone_checks').where({ milestone_id: milestoneId }).first();
      if (!milestone) return;

      const allMilestones = await trx('milestone_checks').where({ project_id: milestone.project_id });
      const terminalStatuses = new Set(['paid', 'revision_exhausted']);
      const allDone = allMilestones.every((m: any) => terminalStatuses.has(m.status));

      if (!allDone) return;

      const project = await trx('projects').where({ project_id: milestone.project_id }).first();
      if (!project || project.status === 'completed') return;

      await trx('projects')
        .where({ project_id: project.project_id })
        .update({ status: 'completed' });

      if (project.escrow_balance > 0) {
        const { WalletService } = await import('../wallets/wallet.service');
        const walletService = new WalletService();
        await walletService.addCredits(
          project.employer_id,
          project.escrow_balance,
          `Escrow refund for completed project ${project.project_id}`,
          undefined,
          'escrow_refund'
        );
        await trx('projects')
          .where({ project_id: project.project_id })
          .update({ escrow_balance: 0 });
      }

      logger.info('Project marked completed and escrow balance refunded', {
        project_id: project.project_id,
        refund_amount: project.escrow_balance
      });
    } catch (error) {
      logger.error('Error in checkAndCompleteProject', error);
    }
  }

  private async storeAQAResult(trx: any, submissionId: string, milestoneId: string, result: any): Promise<AQAResult> {
    const aqaId = uuidv4();

    const aqaResultData = {
      aqa_id: aqaId,
      submission_id: submissionId,
      milestone_id: milestoneId,
      verdict: result.verdict || 'error',
      pass_rate: result.pass_rate || 0,
      payment_trigger: result.payment_trigger || 'none',
      payment_status: ['passed', 'partial'].includes(result.verdict) ? 'pending' : 'none',
      audit_report: result.audit_report ? JSON.stringify(result.audit_report) : null,
      all_checks: result.all_checks?.length > 0 ? JSON.stringify(result.all_checks) : null,
      milestone_amount: result.milestone_amount || 0,
      execution_time_ms: result.execution_time_ms || null,
      ai_model_used: 'gemini-2.5-flash',
      error_message: result.error_message || null,
      aqa_version: 'v1',
      created_at: new Date()
    };

    await trx('aqa_results').insert(aqaResultData);

    return {
      ...aqaResultData,
      audit_report: aqaResultData.audit_report ? JSON.parse(aqaResultData.audit_report) : null,
      all_checks: aqaResultData.all_checks ? JSON.parse(aqaResultData.all_checks) : [],
      payment_status: 'pending'
    };
  }

  private async processPaymentTrigger(trx: any, aqaResult: AQAResult): Promise<void> {
    if (!['passed', 'partial'].includes(aqaResult.verdict) || aqaResult.payment_status !== 'pending') return;

    try {
      const { WalletService } = await import('../wallets/wallet.service');
      const walletService = new WalletService();

      const milestone = await trx('milestone_checks').where({ milestone_id: aqaResult.milestone_id }).first();
      if (!milestone) throw new Error('Milestone not found for payment processing');

      const project = await db('projects').where({ project_id: milestone.project_id }).first();
      if (!project) throw new Error('Project not found for payment processing');

      if (aqaResult.verdict === 'passed') {
        await walletService.addCredits(
          project.freelancer_id,
          milestone.payment_amount,
          `Full payment for milestone: ${milestone.title}`,
          aqaResult.milestone_id,
          'milestone_payment'
        );
      } else if (aqaResult.verdict === 'partial') {
        const proratedAmount = Math.floor(milestone.payment_amount * aqaResult.pass_rate);
        await walletService.addCredits(
          project.freelancer_id,
          proratedAmount,
          `Partial payment (${Math.round(aqaResult.pass_rate * 100)}%) for milestone: ${milestone.title}`,
          aqaResult.milestone_id,
          'milestone_payment'
        );
      }

      await trx('aqa_results').where({ aqa_id: aqaResult.aqa_id }).update({ payment_status: 'processed' });

      logger.info('Wallet credits added successfully', {
        aqa_id: aqaResult.aqa_id,
        milestone_id: aqaResult.milestone_id,
        verdict: aqaResult.verdict,
        freelancer_id: project.freelancer_id
      });
    } catch (paymentError) {
      logger.error('Wallet credit addition failed', { aqa_id: aqaResult.aqa_id, error: paymentError });
    }
  }

  private async updatePfiScore(freelancerId: string, verdict: string): Promise<void> {
    try {
      const { PaymentService } = await import('../payments/payment.service');
      const paymentService = new PaymentService();

      if (verdict === 'passed' || verdict === 'partial') {
        await paymentService.updatePfiScore(freelancerId, 'milestone_passed');
      } else if (verdict === 'failed') {
        await paymentService.updatePfiScore(freelancerId, 'milestone_failed');
      }

      logger.info('PFI score updated', { freelancer_id: freelancerId, verdict });
    } catch (error) {
      logger.error('Failed to update PFI score', error);
    }
  }
}
