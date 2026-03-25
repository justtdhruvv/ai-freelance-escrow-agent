import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

export interface FreelancerWallet {
  wallet_id: string;
  freelancer_id: string;
  balance: number;
  available_balance: number;
  pending_balance: number;
  created_at?: Date;
}

export interface WalletTransaction {
  transaction_id: string;
  wallet_id: string;
  type: 'credit' | 'debit' | 'conversion';
  amount: number;
  description: string;
  reference_id?: string;
  reference_type?: 'payment_event' | 'conversion' | 'manual_adjustment';
  created_at?: Date;
}

export interface WalletConversion {
  conversion_id: string;
  freelancer_id: string;
  internal_amount: number;
  real_amount: number;
  status: 'pending' | 'processed' | 'cancelled';
  conversion_rate: number;
  fees: number;
  created_at?: Date;
  processed_at?: Date;
}

export class WalletService {
  
  /**
   * Get freelancer wallet by ID
   */
  async getWalletByFreelancerId(freelancerId: string): Promise<FreelancerWallet | null> {
    try {
      const wallet = await db('freelancer_wallets')
        .where({ freelancer_id: freelancerId })
        .first();
      
      return wallet || null;
    } catch (error) {
      logger.error('Error getting wallet by freelancer ID', error);
      throw error;
    }
  }

  /**
   * Get wallet by wallet ID
   */
  async getWalletById(walletId: string): Promise<FreelancerWallet | null> {
    try {
      const wallet = await db('freelancer_wallets')
        .where({ wallet_id: walletId })
        .first();
      
      return wallet || null;
    } catch (error) {
      logger.error('Error getting wallet by ID', error);
      throw error;
    }
  }

  /**
   * Create wallet for freelancer
   */
  async createWallet(freelancerId: string): Promise<FreelancerWallet> {
    const trx = await db.transaction();
    
    try {
      const walletId = uuidv4();
      
      // Check if wallet already exists
      const existingWallet = await trx('freelancer_wallets')
        .where({ freelancer_id: freelancerId })
        .first();
      
      if (existingWallet) {
        await trx.rollback();
        throw new Error('Wallet already exists for this freelancer');
      }
      
      // Create new wallet with 0 balance
      await trx('freelancer_wallets').insert({
        wallet_id: walletId,
        freelancer_id: freelancerId,
        balance: 0,
        available_balance: 0,
        pending_balance: 0,
        created_at: new Date()
      });
      
      const wallet = await trx('freelancer_wallets')
        .where({ wallet_id: walletId })
        .first();
      
      await trx.commit();
      
      logger.info('Wallet created for freelancer', {
        wallet_id: walletId,
        freelancer_id: freelancerId
      });
      
      return wallet;
    } catch (error) {
      await trx.rollback();
      logger.error('Error creating wallet', error);
      throw error;
    }
  }

  /**
   * Add credits to wallet (for milestone payments)
   */
  async addCredits(
    freelancerId: string, 
    amount: number, 
    description: string,
    referenceId?: string,
    referenceType?: 'payment_event' | 'manual_adjustment'
  ): Promise<WalletTransaction> {
    const trx = await db.transaction();
    
    try {
      // Get or create wallet
      let wallet = await trx('freelancer_wallets')
        .where({ freelancer_id: freelancerId })
        .first();
      
      if (!wallet) {
        // Create wallet if it doesn't exist
        const walletId = uuidv4();
        await trx('freelancer_wallets').insert({
          wallet_id: walletId,
          freelancer_id: freelancerId,
          balance: 0,
          available_balance: 0,
          pending_balance: 0,
          created_at: new Date()
        });
        
        wallet = await trx('freelancer_wallets')
          .where({ wallet_id: walletId })
          .first();
      }
      
      // Update wallet balance
      const newBalance = wallet.balance + amount;
      await trx('freelancer_wallets')
        .where({ freelancer_id: freelancerId })
        .update({ 
          balance: newBalance,
          available_balance: newBalance
        });
      
      // Create transaction record
      const transactionId = uuidv4();
      await trx('wallet_transactions').insert({
        transaction_id: transactionId,
        wallet_id: wallet.wallet_id,
        type: 'credit',
        amount: amount,
        description,
        reference_id: referenceId,
        reference_type: referenceType,
        created_at: new Date()
      });
      
      const transaction: WalletTransaction = {
        transaction_id: transactionId,
        wallet_id: wallet.wallet_id,
        type: 'credit',
        amount,
        description,
        reference_id: referenceId,
        reference_type: referenceType
      };
      
      await trx.commit();
      
      logger.info('Credits added to wallet', {
        freelancer_id: freelancerId,
        amount,
        new_balance: newBalance,
        transaction_id: transactionId
      });
      
      return transaction;
    } catch (error) {
      await trx.rollback();
      logger.error('Error adding credits to wallet', error);
      throw error;
    }
  }

  /**
   * Convert internal credits to real money (for future implementation)
   */
  async convertToRealMoney(
    freelancerId: string, 
    internalAmount: number, 
    conversionRate: number = 1.0
  ): Promise<WalletConversion> {
    const trx = await db.transaction();
    
    try {
      // Get wallet
      const wallet = await trx('freelancer_wallets')
        .where({ freelancer_id: freelancerId })
        .first();
      
      if (!wallet) {
        throw new Error('Wallet not found');
      }
      
      if (wallet.balance < internalAmount) {
        throw new Error('Insufficient balance for conversion');
      }
      
      // Calculate conversion details
      const realAmount = Math.floor(internalAmount * conversionRate);
      const fees = Math.floor(realAmount * 0.02); // 2% conversion fee
      
      // Create conversion record
      const conversionId = uuidv4();
      await trx('wallet_conversions').insert({
        conversion_id: conversionId,
        freelancer_id: freelancerId,
        internal_amount: internalAmount,
        real_amount: realAmount - fees,
        status: 'pending',
        conversion_rate: conversionRate,
        fees,
        created_at: new Date()
      });
      
      // Update wallet balance (deduct internal credits)
      await trx('freelancer_wallets')
        .where({ freelancer_id: freelancerId })
        .update({ 
          balance: wallet.balance - internalAmount,
          pending_balance: wallet.pending_balance + internalAmount
        });
      
      // Create transaction record
      await trx('wallet_transactions').insert({
        transaction_id: uuidv4(),
        wallet_id: wallet.wallet_id,
        type: 'conversion',
        amount: -internalAmount,
        description: `Convert ${internalAmount} credits to real money`,
        reference_id: conversionId,
        reference_type: 'conversion',
        created_at: new Date()
      });
      
      const conversion: WalletConversion = {
        conversion_id: conversionId,
        freelancer_id: freelancerId,
        internal_amount: internalAmount,
        real_amount: realAmount - fees,
        status: 'pending',
        conversion_rate: conversionRate,
        fees
      };
      
      await trx.commit();
      
      logger.info('Wallet conversion initiated', {
        conversion_id: conversionId,
        freelancer_id: freelancerId,
        internal_amount: internalAmount,
        real_amount: realAmount - fees
      });
      
      return conversion;
    } catch (error) {
      await trx.rollback();
      logger.error('Error converting credits to real money', error);
      throw error;
    }
  }

  /**
   * Get wallet balance summary
   */
  async getWalletSummary(freelancerId: string): Promise<{
    wallet: FreelancerWallet;
    total_earned: number;
    total_converted: number;
    pending_conversions: number;
  }> {
    try {
      // Get wallet
      const wallet = await db('freelancer_wallets')
        .where({ freelancer_id: freelancerId })
        .first();
      
      if (!wallet) {
        throw new Error('Wallet not found');
      }
      
      // Get total earned from transactions
      const totalEarned = await db('wallet_transactions')
        .where({ 
          wallet_id: wallet.wallet_id,
          type: 'credit'
        })
        .sum('amount as total')
        .first();
      
      // Get total converted from conversions
      const totalConverted = await db('wallet_conversions')
        .where({ 
          freelancer_id: freelancerId,
          status: 'processed'
        })
        .sum('real_amount as total')
        .first();
      
      // Get pending conversions
      const pendingConversions = await db('wallet_conversions')
        .where({ 
          freelancer_id: freelancerId,
          status: 'pending'
        })
        .sum('internal_amount as total')
        .first();
      
      return {
        wallet,
        total_earned: totalEarned?.total || 0,
        total_converted: totalConverted?.total || 0,
        pending_conversions: pendingConversions?.total || 0
      };
    } catch (error) {
      logger.error('Error getting wallet summary', error);
      throw error;
    }
  }

  /**
   * Get wallet transaction history
   */
  async getTransactionHistory(
    freelancerId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<WalletTransaction[]> {
    try {
      const wallet = await db('freelancer_wallets')
        .where({ freelancer_id: freelancerId })
        .first();
      
      if (!wallet) {
        return [];
      }
      
      const transactions = await db('wallet_transactions')
        .where({ wallet_id: wallet.wallet_id })
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);
      
      return transactions;
    } catch (error) {
      logger.error('Error getting transaction history', error);
      throw error;
    }
  }
}
