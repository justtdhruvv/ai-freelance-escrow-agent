import { ApiProperty } from '@nestjs/swagger';

export class PaymentResultDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'milestone_123' })
  milestoneId: string;

  @ApiProperty({ example: 'freelancer_456' })
  freelancerId: string;

  @ApiProperty({ example: 1000.00 })
  payoutAmount: number;

  @ApiProperty({ example: 1000.00 })
  originalAmount: number;

  @ApiProperty({ example: 100 })
  paymentPercentage: number;

  @ApiProperty({ example: 'paid' })
  milestoneStatus: string;

  @ApiProperty({ example: 'Full payment released: Excellent work (score >= 90)' })
  message: string;
}
