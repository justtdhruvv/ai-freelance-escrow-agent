import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PaymentsService, PaymentResult } from './payments.service';
import { MilestonePayoutDto } from './dto/milestone-payout.dto';
import { PaymentResultDto } from './dto/payment-result.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('milestone-payout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process automated milestone payout based on score' })
  @ApiResponse({ status: 200, description: 'Payout processed successfully', type: PaymentResultDto })
  @ApiResponse({ status: 400, description: 'Bad request - invalid score or insufficient funds' })
  @ApiResponse({ status: 404, description: 'Milestone or project not found' })
  async processMilestonePayout(@Body() payoutDto: MilestonePayoutDto) {
    return this.paymentsService.processMilestonePayout(
      payoutDto.milestoneId,
      payoutDto.freelancerId,
      payoutDto.score,
    );
  }

  @Get('milestone/:milestoneId/history')
  @ApiOperation({ summary: 'Get payment history for a specific milestone' })
  @ApiParam({ name: 'milestoneId', description: 'Milestone ID' })
  @ApiResponse({ status: 200, description: 'Milestone payment history' })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  async getMilestonePaymentHistory(@Param('milestoneId') milestoneId: string) {
    return this.paymentsService.getMilestonePaymentHistory(milestoneId);
  }

  @Get('freelancer/:freelancerId/history')
  @ApiOperation({ summary: 'Get payment history for a freelancer' })
  @ApiParam({ name: 'freelancerId', description: 'Freelancer ID' })
  @ApiResponse({ status: 200, description: 'Freelancer payment history' })
  @ApiResponse({ status: 404, description: 'Freelancer not found' })
  async getFreelancerPaymentHistory(@Param('freelancerId') freelancerId: string) {
    return this.paymentsService.getFreelancerPaymentHistory(freelancerId);
  }
}
