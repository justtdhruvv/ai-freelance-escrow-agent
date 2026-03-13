import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../config/database.config';
import { Decimal } from 'decimal.js';

// Define enums locally since they're not exported from Prisma client
enum UserRole {
  employer = 'employer',
  freelancer = 'freelancer'
}

enum TransactionType {
  deposit = 'deposit',
  escrow_release = 'escrow_release',
  milestone_payment = 'milestone_payment',
  refund = 'refund',
  withdrawal = 'withdrawal'
}

@Injectable()
export class EscrowService {
  constructor(private readonly databaseService: DatabaseService) {}

  async depositToEscrow(userId: string, projectId: string, amount: number): Promise<{ escrowBalance: Decimal }> {
    // Validate amount
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const decimalAmount = new Decimal(amount);

    // Use Prisma transaction for atomic operations
    const result = await this.databaseService.$transaction(async (tx: any) => {
      // 1. Check user exists and is employer
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role !== UserRole.employer) {
        throw new BadRequestException('Only employers can deposit to escrow');
      }

      // 2. Check project exists and belongs to the employer
      const project = await tx.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      if (project.clientId !== userId) {
        throw new BadRequestException('You can only deposit to your own projects');
      }

      // 3. Check employer wallet balance
      const userBalance = new Decimal(user.walletBalance.toString());
      if (userBalance.lessThan(decimalAmount)) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      // 4. Deduct from employer wallet
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: {
            decrement: decimalAmount.toNumber(),
          },
        },
      });

      // 5. Add amount to project escrow balance
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: {
          escrowBalance: {
            increment: decimalAmount.toNumber(),
          },
        },
      });

      // 6. Create transaction record
      await tx.transaction.create({
        data: {
          projectId,
          fromUser: userId,
          toUser: project.freelancerId || userId, // If no freelancer yet, send to self
          amount: decimalAmount.toNumber(),
          type: TransactionType.deposit,
        },
      });

      return {
        escrowBalance: new Decimal(updatedProject.escrowBalance.toString()),
      };
    });

    return result;
  }

  async getProjectEscrowBalance(projectId: string): Promise<{ escrowBalance: Decimal }> {
    const project = await this.databaseService.project.findUnique({
      where: { id: projectId },
      select: { escrowBalance: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return { escrowBalance: new Decimal(project.escrowBalance.toString()) };
  }

  async getUserWalletBalance(userId: string): Promise<{ walletBalance: Decimal }> {
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { walletBalance: new Decimal(user.walletBalance.toString()) };
  }
}
