import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../config/database.config';
import { Decimal } from 'decimal.js';

// Define enums locally
enum MilestoneStatus {
  pending = 'pending',
  in_progress = 'in_progress',
  completed = 'completed',
  approved = 'approved',
  rejected = 'rejected',
  paid = 'paid'
}

enum TransactionType {
  deposit = 'deposit',
  escrow_release = 'escrow_release',
  milestone_payment = 'milestone_payment',
  refund = 'refund',
  withdrawal = 'withdrawal'
}

export interface PaymentResult {
  success: boolean;
  milestoneId: string;
  freelancerId: string;
  payoutAmount: number;
  originalAmount: number;
  paymentPercentage: number;
  milestoneStatus: MilestoneStatus;
  message: string;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async processMilestonePayout(
    milestoneId: string,
    freelancerId: string,
    score: number,
  ): Promise<PaymentResult> {
    // Validate score
    if (score < 0 || score > 100) {
      throw new BadRequestException('Score must be between 0 and 100');
    }

    // Use Prisma transaction for atomic operations
    const result = await this.databaseService.$transaction(async (tx: any) => {
      // 1. Fetch milestone
      const milestone = await tx.milestone.findUnique({
        where: { id: milestoneId },
        include: { project: true },
      });

      if (!milestone) {
        throw new NotFoundException('Milestone not found');
      }

      if (milestone.status !== MilestoneStatus.completed) {
        throw new BadRequestException('Milestone must be completed before payment');
      }

      // 2. Fetch project escrow balance
      const project = await tx.project.findUnique({
        where: { id: milestone.projectId },
        select: { escrowBalance: true },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      const originalAmount = new Decimal(milestone.paymentAmount.toString());
      const escrowBalance = new Decimal(project.escrowBalance.toString());

      // 3. Calculate payout based on score
      const { payoutAmount, paymentPercentage, milestoneStatus, message } = this.calculatePayout(
        originalAmount,
        score,
      );

      const payoutDecimal = new Decimal(payoutAmount.toString());

      // Check if escrow has sufficient balance
      if (escrowBalance.lessThan(payoutDecimal)) {
        throw new BadRequestException('Insufficient escrow balance for payout');
      }

      // 4. Deduct from escrow balance
      await tx.project.update({
        where: { id: milestone.projectId },
        data: {
          escrowBalance: {
            decrement: payoutDecimal.toNumber(),
          },
        },
      });

      // 5. Add payout to freelancer wallet (only if payment is being made)
      if (paymentPercentage > 0) {
        await tx.user.update({
          where: { id: freelancerId },
          data: {
            walletBalance: {
              increment: payoutDecimal.toNumber(),
            },
          },
        });
      }

      // 6. Mark milestone as paid or revision required
      await tx.milestone.update({
        where: { id: milestoneId },
        data: {
          status: milestoneStatus,
        },
      });

      // 7. Create transaction record (only if payment is being made)
      if (paymentPercentage > 0) {
        await tx.transaction.create({
          data: {
            projectId: milestone.projectId,
            fromUser: milestone.project.clientId,
            toUser: freelancerId,
            amount: payoutDecimal.toNumber(),
            type: TransactionType.milestone_payment,
          },
        });
      }

      return {
        success: true,
        milestoneId,
        freelancerId,
        payoutAmount: payoutDecimal.toNumber(),
        originalAmount: originalAmount.toNumber(),
        paymentPercentage,
        milestoneStatus,
        message,
      };
    });

    return result;
  }

  private calculatePayout(
    originalAmount: Decimal,
    score: number,
  ): {
    payoutAmount: Decimal;
    paymentPercentage: number;
    milestoneStatus: MilestoneStatus;
    message: string;
  } {
    if (score >= 90) {
      // Full payment
      return {
        payoutAmount: originalAmount,
        paymentPercentage: 100,
        milestoneStatus: MilestoneStatus.paid,
        message: 'Full payment released: Excellent work (score >= 90)',
      };
    } else if (score >= 70) {
      // 80% payment
      const payoutAmount = originalAmount.mul(0.8);
      return {
        payoutAmount,
        paymentPercentage: 80,
        milestoneStatus: MilestoneStatus.paid,
        message: 'Partial payment released: Good work (score >= 70, 80% payout)',
      };
    } else {
      // Revision required - no payment
      return {
        payoutAmount: new Decimal(0),
        paymentPercentage: 0,
        milestoneStatus: MilestoneStatus.rejected,
        message: 'Revision required: Score below 70, no payment released',
      };
    }
  }

  async getMilestonePaymentHistory(milestoneId: string): Promise<any> {
    const milestone = await this.databaseService.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        project: {
          select: {
            clientId: true,
            title: true,
          },
        },
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    const transactions = await this.databaseService.transaction.findMany({
      where: {
        projectId: milestone.projectId,
        type: TransactionType.milestone_payment,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return {
      milestone,
      transactions,
    };
  }

  async getFreelancerPaymentHistory(freelancerId: string): Promise<any> {
    const user = await this.databaseService.user.findUnique({
      where: { id: freelancerId },
    });

    if (!user) {
      throw new NotFoundException('Freelancer not found');
    }

    const transactions = await this.databaseService.transaction.findMany({
      where: {
        toUser: freelancerId,
        type: TransactionType.milestone_payment,
      },
      include: {
        project: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    const totalEarned = transactions.reduce(
      (sum, tx) => sum + parseFloat(tx.amount.toString()),
      0,
    );

    return {
      freelancerId,
      totalEarned,
      transactions,
      transactionCount: transactions.length,
    };
  }
}
