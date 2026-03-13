import { Request, Response } from 'express';
import { ClientService, CreateClientInput } from './client.service';
import { logger } from '../../utils/logger';

export class ClientController {
  private clientService: ClientService;

  constructor() {
    this.clientService = new ClientService();
  }

  createClient = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', '/clients', req.body);
    
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

      const result = await this.clientService.createClientAndSendEmail(
        user.userId,
        {
          email: email.trim().toLowerCase()
        }
      );

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

  getFreelancerClients = async (req: Request, res: Response): Promise<void> => {
    logger.request('GET', '/clients');
    
    try {
      const user = (req as any).user;
      
      if (!user) {
        const errorResponse = { error: 'User not authenticated' };
        res.status(401).json(errorResponse);
        return;
      }

      // Only freelancers can view their clients
      if (user.role !== 'freelancer') {
        const errorResponse = { error: 'Only freelancers can view their clients' };
        res.status(403).json(errorResponse);
        return;
      }

      const clients = await this.clientService.getFreelancerClients(user.userId);

      const successResponse = {
        clients,
        count: clients.length
      };

      res.status(200).json(successResponse);
    } catch (error) {
      logger.error('Get freelancer clients error', error);
      const errorResponse = { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' };
      res.status(500).json(errorResponse);
    }
  };

  getClientById = async (req: Request, res: Response): Promise<void> => {
    logger.request('GET', `/clients/${req.params.clientId}`);
    
    try {
      const user = (req as any).user;
      const { clientId } = req.params;
      
      if (!user) {
        const errorResponse = { error: 'User not authenticated' };
        res.status(401).json(errorResponse);
        return;
      }

      // Only freelancers can view their clients
      if (user.role !== 'freelancer') {
        const errorResponse = { error: 'Only freelancers can view their clients' };
        res.status(403).json(errorResponse);
        return;
      }

      if (!clientId || Array.isArray(clientId)) {
        const errorResponse = { error: 'Valid Client ID is required' };
        res.status(400).json(errorResponse);
        return;
      }

      // Check if client belongs to the freelancer
      const isClientOfFreelancer = await this.clientService.checkFreelancerClientRelation(user.userId, clientId);
      
      if (!isClientOfFreelancer) {
        const errorResponse = { error: 'Client not found or access denied' };
        res.status(404).json(errorResponse);
        return;
      }

      const client = await this.clientService.getUserById(clientId);
      
      if (!client) {
        const errorResponse = { error: 'Client not found' };
        res.status(404).json(errorResponse);
        return;
      }

      // Remove sensitive data from response
      const { password_hash, ...clientWithoutPassword } = client;

      res.status(200).json(clientWithoutPassword);
    } catch (error) {
      logger.error('Get client by ID error', error);
      const errorResponse = { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' };
      res.status(500).json(errorResponse);
    }
  };
}
