import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../../utils/password';
import { generateRandomPassword } from '../../utils/passwordGenerator';
import { EmailService } from '../../utils/emailService';
import { logger } from '../../utils/logger';

export interface User {
  user_id: string;
  role: 'employer' | 'freelancer';
  email: string;
  password_hash?: string;
  pfi_score?: number;
  trust_score?: number;
  pfi_history?: any;
  grace_period_active?: boolean;
  created_at?: Date;
}

export interface CreateClientInput {
  email: string;
}

export interface CreateClientResult {
  user: User;
  generatedPassword: string;
}

export class UserService {
  private emailService: EmailService | null = null;

  private getEmailService(): EmailService {
    if (!this.emailService) {
      this.emailService = new EmailService();
    }
    return this.emailService;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await db('users')
        .where({ email })
        .first();
      
      return user || null;
    } catch (error) {
      logger.error('Error finding user by email', error);
      throw new Error('Error finding user by email');
    }
  }

  async createClientAccount(clientData: CreateClientInput): Promise<CreateClientResult> {
    try {
      // Check if email already exists
      const existingUser = await this.findUserByEmail(clientData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Generate user data
      const user_id = uuidv4();
      const generatedPassword = generateRandomPassword(12);
      const password_hash = await hashPassword(generatedPassword);

      // Insert new user
      await db('users')
        .insert({
          user_id,
          email: clientData.email,
          password_hash,
          role: 'employer',
          pfi_score: 500,
          trust_score: 500,
          grace_period_active: false,
          created_at: new Date()
        });

      // Retrieve created user
      const user = await this.findUserByEmail(clientData.email);
      
      if (!user) {
        throw new Error('Failed to create user');
      }

      // Remove password hash from returned user
      const { password_hash: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        generatedPassword
      };
    } catch (error) {
      logger.error('Error creating client account', error);
      throw error;
    }
  }

  async sendClientAccountEmail(email: string, password: string): Promise<boolean> {
    try {
      const loginUrl = process.env.FRONTEND_URL || 'https://yourapp.com/login';
      
      const emailSent = await this.getEmailService().sendClientAccountCreatedEmail(
        email,
        password,
        loginUrl
      );

      if (!emailSent) {
        logger.error('Failed to send client account email', { email });
        throw new Error('Failed to send email to client');
      }

      return true;
    } catch (error) {
      logger.error('Error sending client account email', error);
      throw error;
    }
  }

  async createClientAndSendEmail(clientData: CreateClientInput): Promise<{ message: string }> {
    try {
      // Create client account
      const { user, generatedPassword } = await this.createClientAccount(clientData);

      // Send email with credentials
      await this.sendClientAccountEmail(user.email, generatedPassword);

      logger.info('Client account created and email sent', { 
        userId: user.user_id, 
        email: user.email 
      });

      return {
        message: 'Client account created and email sent'
      };
    } catch (error) {
      logger.error('Error in createClientAndSendEmail', error);
      throw error;
    }
  }

  async getUserById(user_id: string): Promise<User | null> {
    try {
      const user = await db('users')
        .where({ user_id })
        .first();

      return user || null;
    } catch (error) {
      logger.error('Error finding user by ID', error);
      throw new Error('Error finding user by ID');
    }
  }

  async updateUserProfile(userId: string, data: { github_token?: string; stripe_account_id?: string; razorpay_account_id?: string }): Promise<User> {
    try {
      const updateData: Record<string, any> = {};
      if (data.github_token !== undefined) updateData.github_token = data.github_token;
      if (data.stripe_account_id !== undefined) updateData.stripe_account_id = data.stripe_account_id;
      if (data.razorpay_account_id !== undefined) updateData.razorpay_account_id = data.razorpay_account_id;

      if (Object.keys(updateData).length === 0) throw new Error('No fields to update');

      await db('users').where({ user_id: userId }).update(updateData);

      const user = await this.getUserById(userId);
      if (!user) throw new Error('User not found after update');
      return user;
    } catch (error) {
      logger.error('Error updating user profile', error);
      throw error;
    }
  }
}
