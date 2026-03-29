import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { logger } from '../../utils/logger';
import { SubmissionService, Submission, MilestoneWithChecks } from '../submissions/submission.service';

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

export interface AIRequest {
  request_id?: string;
  payload: {
    submission: {
      submission_id: string;
      project_id: string;
      milestone_id: string;
      type: string;
      content?: string;
      repo_url?: string;
    };
    milestone: {
      milestone_id: string;
      project_id: string;
      title: string;
      deadline: string;
      payment_amount: number;
      checks: Array<{
        check_id: string;
        type: string;
        description: string;
        params: any;
      }>;
    };
  };
  context?: {
    github_token: string;
    base_url?: string;
  };
}

export interface AIResponse {
  request_id?: string;
  status: 'success' | 'error';
  output?: any;
  error_message?: string;
  model_used?: string;
}

export class AQAService {
  private readonly AI_API_BASE_URL = 'http://127.0.0.1:8000';
  private readonly AI_TIMEOUT = 300000; // 5 minutes
  private submissionService: SubmissionService;

  constructor() {
    this.submissionService = new SubmissionService();
  }

  async runAQA(submissionId: string): Promise<AQAResult> {
    console.log('🎯 runAQA method called with submission_id:', submissionId);
    
    const trx = await db.transaction();
    
    try {
      // 1. Get submission and milestone data
      const [submission, milestone] = await Promise.all([
        this.submissionService.getSubmissionById(submissionId),
        this.submissionService.getMilestoneWithChecks((await this.submissionService.getSubmissionById(submissionId))?.milestone_id || '')
      ]);

      if (!submission) {
        throw new Error('Submission not found');
      }

      if (!milestone) {
        throw new Error('Milestone not found');
      }

      // 2. Get user's GitHub token (SECURE: runtime fetch)
      const githubToken = await this.submissionService.getUserGitHubToken(submission.user_id);

      // 3. Call AI Agent with timeout
      console.log('🚀 About to call AI agent', {
        submission_id: submissionId,
        milestone_id: milestone.milestone_id,
        checks_count: milestone.checks.length
      });
      
      const startTime = Date.now();
      const aiResponse = await this.callAIAPI(submission, milestone, githubToken || '');
      const executionTime = Date.now() - startTime;
      
      console.log('📥 AI agent response received', {
        status: aiResponse.status,
        has_output: !!aiResponse.output,
        output_keys: aiResponse.output ? Object.keys(aiResponse.output) : []
      });

      // 4. Store AQA result
      logger.info('Storing AQA result', {
        submission_id: submissionId,
        milestone_id: milestone.milestone_id,
        ai_response_output: aiResponse.output,
        has_output: !!aiResponse.output,
        execution_time_ms: executionTime,
        ai_model_used: aiResponse.model_used
      });
      
      const aqaResult = await this.storeAQAResult(trx, submissionId, milestone.milestone_id, {
        ...aiResponse.output,
        execution_time_ms: executionTime,
        ai_model_used: aiResponse.model_used
      });

      // 5. Update submission status
      await trx('submissions')
        .where({ submission_id: submissionId })
        .update({
          status: 'aqa_completed',
          aqa_completed_at: new Date(),
          updated_at: new Date()
        });

      // 6. Update milestone status based on AQA verdict
      await this.submissionService.updateMilestoneStatus(milestone.milestone_id, aqaResult.verdict);

      // 7. Process payment trigger (within transaction)
      await this.processPaymentTrigger(trx, aqaResult);

      // 8. Update PFI score based on AQA result
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
      
      // Update submission status to failed
      await this.submissionService.updateSubmissionStatus(submissionId, 'aqa_failed');
      await this.submissionService.incrementRetryCount(submissionId);
      
      logger.error('AQA execution failed', error);
      throw error;
    }
  }

  async canRunAQA(submissionId: string): Promise<{
    canRun: boolean;
    reason?: string;
    existingResult?: AQAResult;
  }> {
    console.log('🔍 canRunAQA called for submission_id:', submissionId);
    
    try {
      const submission = await this.submissionService.getSubmissionById(submissionId);
      
      console.log('📋 Submission status:', submission?.status);
      
      if (!submission) {
        console.log('❌ Submission not found');
        return { canRun: false, reason: 'Submission not found' };
      }

      if (submission.status === 'aqa_running') {
        console.log('⏳ AQA already running');
        return { canRun: false, reason: 'AQA already running for this submission' };
      }

      if (submission.status === 'aqa_completed') {
        console.log('✅ AQA already completed, checking if it was an error');
        const existingResult = await this.getAQAResult(submissionId);
        
        // Allow retry if previous result was an error
        if (existingResult && existingResult.verdict === 'error') {
          console.log('🔄 Previous AQA resulted in error, allowing retry');
          return { canRun: true };
        }
        
        console.log('✅ AQA already completed successfully, returning existing result');
        return { 
          canRun: false, 
          reason: 'AQA already completed for this submission',
          existingResult: existingResult || undefined
        };
      }

      if (submission.retry_count >= 3) {
        return { canRun: false, reason: 'Maximum retry attempts exceeded' };
      }

      return { canRun: true };

    } catch (error) {
      logger.error('Error checking AQA eligibility', error);
      return { canRun: false, reason: 'Error checking AQA eligibility' };
    }
  }

  async getAQAResult(submissionId: string): Promise<AQAResult | null> {
    try {
      const result = await db('aqa_results')
        .where({ submission_id: submissionId })
        .first();

      return result || null;
    } catch (error) {
      logger.error('Error fetching AQA result', error);
      throw new Error('Error fetching AQA result');
    }
  }

  async retryAQA(submissionId: string): Promise<AQAResult> {
    const submission = await this.submissionService.getSubmissionById(submissionId);
    
    if (!submission) {
      throw new Error('Submission not found');
    }

    if (submission.retry_count >= 3) {
      throw new Error('Maximum retry attempts exceeded');
    }

    // Reset submission status and increment retry count
    await this.submissionService.updateSubmissionStatus(submissionId, 'submitted');
    await this.submissionService.incrementRetryCount(submissionId);

    // Re-run AQA
    return await this.runAQA(submissionId);
  }

  private async callAIAPI(
    submission: Submission, 
    milestone: MilestoneWithChecks, 
    githubToken: string
  ): Promise<AIResponse> {
    try {
      const request: AIRequest = {
        payload: {
          submission: {
            submission_id: submission.submission_id,
            project_id: submission.project_id,
            milestone_id: submission.milestone_id,
            type: submission.type,
            content: submission.content || undefined,
            repo_url: submission.repo_url || undefined
          },
          milestone: {
            milestone_id: milestone.milestone_id,
            project_id: milestone.project_id,
            title: milestone.title,
            deadline: milestone.deadline,
            payment_amount: milestone.payment_amount,
            checks: milestone.checks.map(check => ({
              check_id: check.check_id,
              type: check.type,
              description: check.description,
              params: check.params,
              verified_by: check.verified_by || 'auto' // Add required verified_by field
            }))
          }
        },
        context: {
          github_token: githubToken
        }
      };

      logger.info('Calling AI AQA API', {
        submission_id: submission.submission_id,
        milestone_id: milestone.milestone_id,
        checks_count: milestone.checks.length,
        github_token_provided: !!githubToken
      });

      const response = await axios.post(
        `${this.AI_API_BASE_URL}/ai/run-aqa`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: this.AI_TIMEOUT, // 5 minutes timeout
        }
      );

      logger.info('AI AQA API response received', {
        status: response.data.status,
        model_used: response.data.model_used,
        has_output: !!response.data.output,
        output_keys: response.data.output ? Object.keys(response.data.output) : [],
        full_response: JSON.stringify(response.data, null, 2)
      });

      return response.data;

    } catch (error) {
      logger.error('AI AQA API call failed', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error_message || error.message;
        throw new Error(`AI API call failed: ${errorMessage}`);
      }
      
      throw new Error(`AI API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async storeAQAResult(
    trx: any, 
    submissionId: string, 
    milestoneId: string,
    result: any
  ): Promise<AQAResult> {
    const aqaId = uuidv4();
    
    const aqaResultData = {
      aqa_id: aqaId,
      submission_id: submissionId,
      milestone_id: milestoneId, // Use the passed milestone_id instead of result.milestone_id
      verdict: result.verdict || 'error',
      pass_rate: result.pass_rate || 0,
      payment_trigger: result.payment_trigger || 'none',
      payment_status: result.verdict === 'passed' || result.verdict === 'partial' ? 'pending' : 'none',
      audit_report: result.audit_report ? JSON.stringify(result.audit_report) : null,
      all_checks: result.all_checks && result.all_checks.length > 0 ? JSON.stringify(result.all_checks) : null,
      milestone_amount: result.milestone_amount || 0,
      execution_time_ms: result.execution_time_ms || null,
      ai_model_used: result.model_used || null,
      error_message: result.error_message || null,
      aqa_version: 'v1',
      created_at: new Date()
    };

    console.log('💾 Storing AQA result data:', aqaResultData);

    await trx('aqa_results').insert(aqaResultData);

    // Return the stored result
    return {
      ...aqaResultData,
      audit_report: aqaResultData.audit_report ? JSON.parse(aqaResultData.audit_report) : null,
      all_checks: aqaResultData.all_checks ? JSON.parse(aqaResultData.all_checks) : [],
      payment_status: 'pending' // Default value
    };
  }

  private async processPaymentTrigger(trx: any, aqaResult: AQAResult): Promise<void> {
    // Only trigger payment if verdict allows payment AND payment not processed
    if (['passed', 'partial'].includes(aqaResult.verdict) && aqaResult.payment_status === 'pending') {
      
      try {
        // Import WalletService to add credits to freelancer wallet
        const { WalletService } = await import('../wallets/wallet.service');
        const walletService = new WalletService();

        // Get milestone details from milestone_checks table (correct table)
        const milestone = await trx('milestone_checks')
          .where({ milestone_id: aqaResult.milestone_id })
          .first();
        
        if (!milestone) {
          throw new Error('Milestone not found for payment processing');
        }

        // Get project details to get freelancer_id
        const project = await db('projects')
          .where({ project_id: milestone.project_id })
          .first();
        
        if (!project) {
          throw new Error('Project not found for payment processing');
        }

        // Call appropriate wallet credit method based on verdict
        if (aqaResult.verdict === 'passed') {
          // Full payment for passed milestones
          await walletService.addCredits(
            project.freelancer_id,  // Get freelancer_id from project
            milestone.payment_amount,  // Use payment_amount from milestone_checks
            `Full payment for milestone: ${milestone.title}`,
            aqaResult.milestone_id,  // Reference to milestone
            'milestone_payment'
          );
        } else if (aqaResult.verdict === 'partial') {
          // Prorated payment for partial results
          const proratedAmount = Math.floor(milestone.payment_amount * aqaResult.pass_rate);
          await walletService.addCredits(
            project.freelancer_id,
            proratedAmount,
            `Partial payment (${Math.round(aqaResult.pass_rate * 100)}%) for milestone: ${milestone.title}`,
            aqaResult.milestone_id,
            'milestone_payment'
          );
        }

        // Update payment status
        await trx('aqa_results')
          .where({ aqa_id: aqaResult.aqa_id })
          .update({ payment_status: 'processed' });

        logger.info('Wallet credits added successfully', {
          aqa_id: aqaResult.aqa_id,
          milestone_id: aqaResult.milestone_id,
          verdict: aqaResult.verdict,
          pass_rate: aqaResult.pass_rate,
          freelancer_id: project.freelancer_id,
          payment_type: aqaResult.verdict === 'passed' ? 'full' : 'prorated'
        });

      } catch (paymentError) {
        // Log payment error but don't fail AQA
        logger.error('Wallet credit addition failed', {
          aqa_id: aqaResult.aqa_id,
          milestone_id: aqaResult.milestone_id,
          error: paymentError
        });
        
        // Don't throw - AQA should succeed even if payment fails
      }
    }
  }

  private async updatePfiScore(freelancerId: string, verdict: string): Promise<void> {
    try {
      // Import PaymentService to avoid circular dependency
      const { PaymentService } = await import('../payments/payment.service');
      const paymentService = new PaymentService();

      // Update PFI score based on verdict
      if (verdict === 'passed') {
        await paymentService.updatePfiScore(freelancerId, 'milestone_passed');
      } else if (verdict === 'failed') {
        await paymentService.updatePfiScore(freelancerId, 'milestone_failed');
      } else if (verdict === 'partial') {
        // Partial completion still gets some points
        await paymentService.updatePfiScore(freelancerId, 'milestone_passed');
      }

      logger.info('PFI score updated', {
        freelancer_id: freelancerId,
        verdict: verdict
      });
    } catch (error) {
      logger.error('Failed to update PFI score', error);
      // Don't throw - AQA should succeed even if PFI update fails
    }
  }
}
