import { Test, TestingModule } from '@nestjs/testing';
import { EscrowService } from './escrow.service';
import { DatabaseService } from '../../config/database.config';

describe('EscrowService', () => {
  let service: EscrowService;
  let databaseService: DatabaseService;

  const mockDatabaseService = {
    $transaction: jest.fn(),
    user: {
      findUnique: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscrowService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<EscrowService>(EscrowService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('depositToEscrow', () => {
    it('should throw error for invalid amount', async () => {
      await expect(
        service.depositToEscrow('user1', 'project1', 0),
      ).rejects.toThrow('Amount must be greater than 0');
    });

    it('should throw error for negative amount', async () => {
      await expect(
        service.depositToEscrow('user1', 'project1', -100),
      ).rejects.toThrow('Amount must be greater than 0');
    });
  });
});
