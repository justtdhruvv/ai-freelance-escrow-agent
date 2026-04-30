import { Request, Response } from 'express';
import db from '../../config/database';
import { WalletService, FreelancerWallet, WalletTransaction, WalletConversion } from './wallet.service';
import { logger } from '../../utils/logger';

const CONVERSION_ESTIMATED_ARRIVAL = '2-3 business days';

export class WalletController {
  private walletService: WalletService;

  constructor() {
    this.walletService = new WalletService();
  }

  /**
   * Get freelancer wallet details
   * GET /wallet
   */
  getWallet = async (req: Request, res: Response): Promise<void> => {
    logger.request('GET', '/wallet', req.body);
    
    try {
      const user = (req as any).user;
      
      if (!user) {
        const errorResponse = { error: 'User not authenticated' };
        res.status(401).json(errorResponse);
        return;
      }

      // ✅ Allow both employers and freelancers to have wallets
      // Employers can view their escrow balance, freelancers view their earned credits
      const walletSummary = await this.walletService.getWalletSummary(user.userId);
      
      const successResponse = {
        success: true,
        data: {
          wallet_id: walletSummary.wallet.wallet_id,
          freelancer_id: walletSummary.wallet.freelancer_id,
          balance: walletSummary.wallet.balance,           // Total internal credits
          available_balance: walletSummary.wallet.available_balance, // Available for conversion
          pending_balance: walletSummary.wallet.pending_balance,   // Pending conversions
          total_earned: walletSummary.total_earned,           // Total credits earned
          total_converted: walletSummary.total_converted,       // Total converted to real money
          wallet_type: user.role === 'freelancer' ? 'internal' : 'escrow',
          currency: user.role === 'freelancer' ? 'credits' : 'USD'
        }
      };
      
      res.status(200).json(successResponse);

    } catch (error) {
      logger.error('Error getting wallet', error);
      const errorResponse = { 
        error: 'Failed to get wallet',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(errorResponse);
    }
  };

  /**
   * Get wallet transaction history
   * GET /wallet/transactions
   */
  getTransactionHistory = async (req: Request, res: Response): Promise<void> => {
    logger.request('GET', '/wallet/transactions', req.query);
    
    try {
      const user = (req as any).user;
      
      if (!user) {
        const errorResponse = { error: 'User not authenticated' };
        res.status(401).json(errorResponse);
        return;
      }

      // ✅ Allow both employers and freelancers to view transaction history
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const transactions = await this.walletService.getTransactionHistory(user.userId, limit, offset);
      
      const successResponse = {
        success: true,
        data: {
          transactions,
          pagination: {
            limit,
            offset,
            has_more: transactions.length === limit
          }
        }
      };
      
      res.status(200).json(successResponse);

    } catch (error) {
      logger.error('Error getting transaction history', error);
      const errorResponse = { 
        error: 'Failed to get transaction history',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(errorResponse);
    }
  };

  /**
   * Convert internal credits to real money
   * POST /wallet/convert
   */
  convertToRealMoney = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', '/wallet/convert', req.body);
    
    try {
      const user = (req as any).user;
      
      if (!user) {
        const errorResponse = { error: 'User not authenticated' };
        res.status(401).json(errorResponse);
        return;
      }

      if (user.role !== 'freelancer') {
        const errorResponse = { error: 'Only freelancers can convert credits' };
        res.status(403).json(errorResponse);
        return;
      }

      const { internal_amount, conversion_rate } = req.body;
      
      if (!internal_amount || internal_amount <= 0) {
        const errorResponse = { error: 'Valid internal_amount is required' };
        res.status(400).json(errorResponse);
        return;
      }

      // Validate conversion rate (optional, defaults to 1.0)
      const rate = conversion_rate && conversion_rate > 0 ? conversion_rate : 1.0;
      
      const conversion = await this.walletService.convertToRealMoney(
        user.userId, 
        parseInt(internal_amount), 
        rate
      );
      
      const successResponse = {
        success: true,
        message: 'Conversion initiated successfully',
        data: {
          conversion_id: conversion.conversion_id,
          internal_amount: conversion.internal_amount,
          real_amount: conversion.real_amount,
          conversion_rate: conversion.conversion_rate,
          fees: conversion.fees,
          status: conversion.status,
          estimated_arrival: CONVERSION_ESTIMATED_ARRIVAL
        }
      };
      
      res.status(200).json(successResponse);

    } catch (error) {
      logger.error('Error converting credits to real money', error);
      const errorResponse = { 
        error: 'Failed to convert credits',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(errorResponse);
    }
  };

  /**
   * Get conversion status
   * GET /wallet/conversions/:conversion_id
   */
  getConversionStatus = async (req: Request, res: Response): Promise<void> => {
    logger.request('GET', `/wallet/conversions/${req.params.conversion_id}`, req.params);
    
    try {
      const user = (req as any).user;
      
      if (!user) {
        const errorResponse = { error: 'User not authenticated' };
        res.status(401).json(errorResponse);
        return;
      }

      const { conversion_id } = req.params;
      
      if (!conversion_id) {
        const errorResponse = { error: 'Conversion ID is required' };
        res.status(400).json(errorResponse);
        return;
      }

      // Get conversion details from database
      const conversion = await db('wallet_conversions')
        .where({ 
          conversion_id,
          freelancer_id: user.userId 
        })
        .first();
      
      if (!conversion) {
        const errorResponse = { error: 'Conversion not found' };
        res.status(404).json(errorResponse);
        return;
      }
      
      const successResponse = {
        success: true,
        data: conversion
      };
      
      res.status(200).json(successResponse);

    } catch (error) {
      logger.error('Error getting conversion status', error);
      const errorResponse = { 
        error: 'Failed to get conversion status',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(errorResponse);
    }
  };
}
