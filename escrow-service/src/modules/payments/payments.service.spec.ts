import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService, PaymentResult } from './payments.service';
import { DatabaseService } from '../../config/database.config';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let databaseService: DatabaseService;

  const mockDatabaseService = {
    $transaction: jest.fn(),
    milestone: {
      findUnique: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processMilestonePayout', () => {
    it('should throw error for invalid score (negative)', async () => {
      await expect(
        service.processMilestonePayout('milestone1', 'freelancer1', -10),
      ).rejects.toThrow('Score must be between 0 and 100');
    });

    it('should throw error for invalid score (over 100)', async () => {
      await expect(
        service.processMilestonePayout('milestone1', 'freelancer1', 150),
      ).rejects.toThrow('Score must be between 0 and 100');
    });

    it('should calculate full payment for score >= 90', async () => {
      const mockMilestone = {
        id: 'milestone1',
        paymentAmount: 1000,
        status: 'completed',
        projectId: 'project1',
        project: { clientId: 'client1' },
      };

      const mockProject = { escrowBalance: 2000 };

      mockDatabaseService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          milestone: { findUnique: jest.fn().mockResolvedValue(mockMilestone) },
          project: { 
            findUnique: jest.fn().mockResolvedValue(mockProject),
            update: jest.fn().mockResolvedValue({})
          },
          user: { update: jest.fn().mockResolvedValue({}) },
          transaction: { create: jest.fn().mockResolvedValue({}) },
        });
      });

      const result = await service.processMilestonePayout('milestone1', 'freelancer1', 95);

      expect(result.paymentPercentage).toBe(100);
      expect(result.payoutAmount).toBe(1000);
      expect(result.message).toContain('Excellent work');
    });

    it('should calculate 80% payment for score >= 70', async () => {
      const mockMilestone = {
        id: 'milestone1',
        paymentAmount: 1000,
        status: 'completed',
        projectId: 'project1',
        project: { clientId: 'client1' },
      };

      const mockProject = { escrowBalance: 2000 };

      mockDatabaseService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          milestone: { findUnique: jest.fn().mockResolvedValue(mockMilestone) },
          project: { 
            findUnique: jest.fn().mockResolvedValue(mockProject),
            update: jest.fn().mockResolvedValue({})
          },
          user: { update: jest.fn().mockResolvedValue({}) },
          transaction: { create: jest.fn().mockResolvedValue({}) },
        });
      });

      const result = await service.processMilestonePayout('milestone1', 'freelancer1', 75);

      expect(result.paymentPercentage).toBe(80);
      expect(result.payoutAmount).toBe(800);
      expect(result.message).toContain('Good work');
    });

    it('should reject milestone for score < 70', async () => {
      const mockMilestone = {
        id: 'milestone1',
        paymentAmount: 1000,
        status: 'completed',
        projectId: 'project1',
        project: { clientId: 'client1' },
      };

      const mockProject = { escrowBalance: 2000 };

      mockDatabaseService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          milestone: { findUnique: jest.fn().mockResolvedValue(mockMilestone) },
          project: { 
            findUnique: jest.fn().mockResolvedValue(mockProject),
            update: jest.fn().mockResolvedValue({})
          },
          user: { update: jest.fn().mockResolvedValue({}) },
          transaction: { create: jest.fn().mockResolvedValue({}) },
        });
      });

      const result = await service.processMilestonePayout('milestone1', 'freelancer1', 65);

      expect(result.paymentPercentage).toBe(0);
      expect(result.payoutAmount).toBe(0);
      expect(result.message).toContain('Revision required');
    });
  });
});
