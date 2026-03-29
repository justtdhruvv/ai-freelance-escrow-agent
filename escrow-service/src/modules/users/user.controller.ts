import { Request, Response } from 'express';
import { UserService, CreateClientInput } from './user.service';
import { EmailService } from '../../utils/emailService';
import { logger } from '../../utils/logger';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  createClientAccount = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', '/users/create-client', req.body);
    
    try {
      const user = (req as any).user;
      
      if (!user) {
        const errorResponse = { error: 'User not authenticated' };
        res.status(401).json(errorResponse);
        return;
      }

      // Only freelancers can create client accounts
      if (user.role !== 'freelancer') {
        const errorResponse = { error: 'Only freelancers can create client accounts' };
        res.status(403).json(errorResponse);
        return;
      }

      const { email }: CreateClientInput = req.body;

      // Validate email input
      if (!email || typeof email !== 'string' || email.trim().length === 0) {
        const errorResponse = { error: 'Email is required and must be a non-empty string' };
        res.status(400).json(errorResponse);
        return;
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        const errorResponse = { error: 'Invalid email format' };
        res.status(400).json(errorResponse);
        return;
      }

      const result = await this.userService.createClientAndSendEmail({
        email: email.trim().toLowerCase()
      });

      const successResponse = {
        message: result.message
      };

      res.status(201).json(successResponse);
    } catch (error) {
      logger.error('Create client account error', error);
      
      if (error instanceof Error) {
        if (error.message === 'User with this email already exists') {
          const errorResponse = { error: 'User with this email already exists' };
          res.status(409).json(errorResponse);
          return;
        }
        
        if (error.message === 'Failed to send email to client') {
          const errorResponse = { error: 'Account created but failed to send email notification' };
          res.status(500).json(errorResponse);
          return;
        }
      }
      
      const errorResponse = { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' };
      res.status(500).json(errorResponse);
    }
  };

  getUserProfile = async (req: Request, res: Response): Promise<void> => {
    logger.request('GET', '/users/profile');
    
    try {
      const user = (req as any).user;
      
      if (!user) {
        const errorResponse = { error: 'User not authenticated' };
        res.status(401).json(errorResponse);
        return;
      }

      const userProfile = await this.userService.getUserById(user.userId);
      
      if (!userProfile) {
        const errorResponse = { error: 'User not found' };
        res.status(404).json(errorResponse);
        return;
      }

      // Remove sensitive data from response
      const { password_hash, ...userProfileWithoutPassword } = userProfile;

      res.status(200).json(userProfileWithoutPassword);
    } catch (error) {
      logger.error('Get user profile error', error);
      const errorResponse = { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' };
      res.status(500).json(errorResponse);
    }
  };

  testEmailConnection = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', '/users/test-email');
    
    try {
      const user = (req as any).user;
      
      if (!user) {
        const errorResponse = { error: 'User not authenticated' };
        res.status(401).json(errorResponse);
        return;
      }

      const emailService = new EmailService();
      
      // Test connection
      const connectionTest = await emailService.testConnection();
      
      if (!connectionTest) {
        const errorResponse = { error: 'Email service connection failed' };
        res.status(500).json(errorResponse);
        return;
      }

      // Test sending email
      const testEmail = await emailService.sendClientAccountCreatedEmail(
        'test@example.com',
        'testPassword123!',
        'http://localhost:3000/login'
      );

      if (!testEmail) {
        const errorResponse = { error: 'Test email sending failed' };
        res.status(500).json(errorResponse);
        return;
      }

      const successResponse = {
        message: 'Email service is working correctly',
        connectionTest: true,
        emailTest: true
      };

      res.status(200).json(successResponse);
    } catch (error) {
      logger.error('Test email connection error', error);
      const errorResponse = { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' };
      res.status(500).json(errorResponse);
    }
  };
}
