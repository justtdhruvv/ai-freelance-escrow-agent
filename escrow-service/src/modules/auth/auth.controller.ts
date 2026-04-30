import { Request, Response } from 'express';
import { AuthService, CreateUserInput, LoginInput } from './auth.service';
import { generateToken } from '../../utils/jwt';
import { logger } from '../../utils/logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  signup = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', '/auth/signup', req.body);
    
    try {
      const { name, email, password, role }: CreateUserInput = req.body;

      if (!email || !password || !role) {
        const errorResponse = { error: 'Missing required fields: email, password, role' };
        res.status(400).json(errorResponse);
        return;
      }

      if (!['employer', 'freelancer'].includes(role)) {
        const errorResponse = { error: 'Role must be either "employer" or "freelancer"' };
        res.status(400).json(errorResponse);
        return;
      }

      if (password.length < 6) {
        const errorResponse = { error: 'Password must be at least 6 characters long' };
        res.status(400).json(errorResponse);
        return;
      }

      const user = await this.authService.createUser({
        name: name || '',
        email,
        password,
        role
      });

      const token = generateToken({
        userId: user.user_id,
        role: user.role
      });

      const { password_hash, ...userWithoutPassword } = user;

      const successResponse = { token, user: userWithoutPassword };
      res.status(201).json(successResponse);
    } catch (error) {
      logger.error('Signup error', error);
      
      if (error instanceof Error) {
        if (error.message === 'User with this email already exists') {
          const errorResponse = { error: 'User with this email already exists' };
          res.status(409).json(errorResponse);
          return;
        }
      }
      
      const errorResponse = { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' };
      res.status(500).json(errorResponse);
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', '/auth/login', req.body);
    
    try {
      const { email, password }: LoginInput = req.body;

      if (!email || !password) {
        const errorResponse = { error: 'Missing required fields: email, password' };
        res.status(400).json(errorResponse);
        return;
      }

      const user = await this.authService.validateUser({
        email,
        password
      });

      if (!user) {
        const errorResponse = { error: 'Invalid email or password' };
        res.status(401).json(errorResponse);
        return;
      }

      const token = generateToken({
        userId: user.user_id,
        role: user.role
      });

      const { password_hash, ...userWithoutPassword } = user;

      const successResponse = { token, user: userWithoutPassword };
      res.status(200).json(successResponse);
    } catch (error) {
      logger.error('Login error', error);
      const errorResponse = { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' };
      res.status(500).json(errorResponse);
    }
  };
}
