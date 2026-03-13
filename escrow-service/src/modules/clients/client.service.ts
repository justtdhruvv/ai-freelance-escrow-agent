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

export interface FreelancerClient {
  id: string;
  freelancer_id: string;
  client_id: string;
  created_at?: Date;
}

export interface CreateClientInput {
  email: string;
}

export interface CreateClientResult {
  user: User;
  generatedPassword: string;
  freelancerClient: FreelancerClient;
}

export class ClientService {
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

  async createClientAccount(freelancerId: string, clientData: CreateClientInput): Promise<CreateClientResult> {
    try {
      // Check if email already exists
      const existingUser = await this.findUserByEmail(clientData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Generate user data
      const client_id = uuidv4();
      const generatedPassword = generateRandomPassword(12);
      const password_hash = await hashPassword(generatedPassword);

      // Insert new user (client)
      await db('users')
        .insert({
          user_id: client_id,
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

      // Create freelancer-client relationship
      const freelancerClient = await this.createFreelancerClientRelation(freelancerId, client_id);

      // Remove password hash from returned user
      const { password_hash: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        generatedPassword,
        freelancerClient
      };
    } catch (error) {
      logger.error('Error creating client account', error);
      throw error;
    }
  }

  async createFreelancerClientRelation(freelancerId: string, clientId: string): Promise<FreelancerClient> {
    try {
      const relationId = uuidv4();
      
      await db('freelancer_clients')
        .insert({
          id: relationId,
          freelancer_id: freelancerId,
          client_id: clientId,
          created_at: new Date()
        });

      const relation = await db('freelancer_clients')
        .where({ id: relationId })
        .first();
      
      if (!relation) {
        throw new Error('Failed to create freelancer-client relation');
      }

      return relation;
    } catch (error) {
      logger.error('Error creating freelancer-client relation', error);
      throw new Error('Error creating freelancer-client relation');
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

  async createClientAndSendEmail(freelancerId: string, clientData: CreateClientInput): Promise<{ message: string }> {
    try {
      // Create client account and relation
      const { user, generatedPassword } = await this.createClientAccount(freelancerId, clientData);

      // Send email with credentials
      await this.sendClientAccountEmail(user.email, generatedPassword);

      logger.info('Client account created and email sent', { 
        freelancerId,
        clientId: user.user_id, 
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

  async getFreelancerClients(freelancerId: string): Promise<User[]> {
    try {
      const clients = await db('users as u')
        .join('freelancer_clients as fc', 'fc.client_id', 'u.user_id')
        .where('fc.freelancer_id', freelancerId)
        .select(
          'u.user_id',
          'u.role',
          'u.email',
          'u.pfi_score',
          'u.trust_score',
          'u.pfi_history',
          'u.grace_period_active',
          'u.created_at'
        );

      return clients;
    } catch (error) {
      logger.error('Error fetching freelancer clients', error);
      throw new Error('Error fetching freelancer clients');
    }
  }

  async checkFreelancerClientRelation(freelancerId: string, clientId: string): Promise<boolean> {
    try {
      const relation = await db('freelancer_clients')
        .where({ freelancer_id: freelancerId, client_id: clientId })
        .first();
      
      return !!relation;
    } catch (error) {
      logger.error('Error checking freelancer-client relation', error);
      throw new Error('Error checking freelancer-client relation');
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
}
