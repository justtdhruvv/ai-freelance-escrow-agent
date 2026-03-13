import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword, verifyPassword } from '../../utils/password';
import { logger } from '../../utils/logger';

export interface User {
  user_id: string;
  role: 'employer' | 'freelancer';
  email: string;
  password_hash: string;
  pfi_score?: number;
  trust_score?: number;
  pfi_history?: any;
  grace_period_active?: boolean;
  created_at?: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  role: 'employer' | 'freelancer';
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  async findUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await db('users')
        .where({ email })
        .first();
      
      return user || null;
    } catch (error) {
      throw new Error('Error finding user by email');
    }
  }

  async createUser(userData: CreateUserInput): Promise<User> {
    try {
      const existingUser = await this.findUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const user_id = uuidv4();
      const password_hash = await hashPassword(userData.password);

      await db('users')
        .insert({
          user_id,
          email: userData.email,
          password_hash,
          role: userData.role,
          pfi_score: 500,
          trust_score: 500,
          created_at: new Date()
        });

      const user = await this.findUserByEmail(userData.email);
      
      if (!user) {
        throw new Error('Failed to create user');
      }

      return user;
    } catch (error) {
      logger.error('Error creating user', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error creating user');
    }
  }

  async validateUser(loginData: LoginInput): Promise<User | null> {
    try {
      const user = await this.findUserByEmail(loginData.email);
      
      if (!user) {
        return null;
      }

      const isPasswordValid = await verifyPassword(loginData.password, user.password_hash);
      
      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      throw new Error('Error validating user');
    }
  }

  async getUserById(user_id: string): Promise<User | null> {
    try {
      const user = await db('users')
        .where({ user_id })
        .first();
      
      return user || null;
    } catch (error) {
      throw new Error('Error finding user by ID');
    }
  }
}
