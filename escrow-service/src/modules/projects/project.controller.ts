import { Request, Response } from 'express';
import { ProjectService, CreateProjectInput } from './project.service';
import { VerificationContractService } from '../verificationContract/verificationContract.service';
import { logger } from '../../utils/logger';

export class ProjectController {
  private projectService: ProjectService;
  private VerificationContractService: VerificationContractService;
  constructor() {
    this.projectService = new ProjectService();
    this.VerificationContractService = new VerificationContractService();
  }

  createProject = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', '/projects', req.body);
    
    try {
      const user = (req as any).user;
      
      if (!user || user.role !== 'freelancer') {
        const errorResponse = { error: 'Only freelancers can create projects' };
        res.status(403).json(errorResponse);
        return;
      }

      const { name, client_id, total_price, timeline_days, description }: CreateProjectInput = req.body;

      // Validate client_id
      if (!client_id || typeof client_id !== 'string' || client_id.trim().length === 0) {
        const errorResponse = { error: 'Valid client_id is required' };
        res.status(400).json(errorResponse);
        return;
      }

      // Validate total_price
      if (!total_price || typeof total_price !== 'number' || total_price <= 0) {
        const errorResponse = { error: 'Valid total_price is required (must be a positive number)' };
        res.status(400).json(errorResponse);
        return;
      }

      // Validate timeline_days
      if (timeline_days !== undefined && (typeof timeline_days !== 'number' || timeline_days <= 0)) {
        const errorResponse = { error: 'timeline_days must be a positive number if provided' };
        res.status(400).json(errorResponse);
        return;
      }

      // Verify that the client belongs to the freelancer
      const isClientOfFreelancer = await this.projectService.checkFreelancerClientRelation(user.userId, client_id);
      
      if (!isClientOfFreelancer) {
        const errorResponse = { error: 'Client not found or access denied' };
        res.status(404).json(errorResponse);
        return;
      }

      const project = await this.projectService.createProject({
        name,
        client_id,
        total_price,
        timeline_days,
        freelancer_id: user.userId,
        employer_id: client_id,  // client_id is actually the employer_id
        description
      });

      const successResponse = {
        name: project.name,
        project_id: project.project_id,
        employer_id: project.employer_id,
        freelancer_id: project.freelancer_id,
        description: project.description,
        status: project.status,
        total_price: project.total_price,
        timeline_days: project.timeline_days,
        created_at: project.created_at
      };

      await this.VerificationContractService.createVerificationContract({
        project_id: project.project_id,
        generated_from_sop_version: 1
      });

      res.status(201).json(successResponse);
    } catch (error) {
      logger.error('Create project error', error);
      const errorResponse = { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' };
      res.status(500).json(errorResponse);
    }
  };

  getProjects = async (req: Request, res: Response): Promise<void> => {
    logger.request('GET', '/projects');
    
    try {
      const user = (req as any).user;
      
      if (!user) {
        const errorResponse = { error: 'User not authenticated' };
        res.status(401).json(errorResponse);
        return;
      }

      let projects;

      if (user.role === 'freelancer') {
        // Freelancers can see projects they created
        projects = await this.projectService.getProjectsByFreelancer(user.userId);
      } else if (user.role === 'employer') {
        // Employers can see projects where they are the client
        projects = await this.projectService.getProjectsByEmployer(user.userId);
      } else {
        const errorResponse = { error: 'Invalid user role' };
        res.status(403).json(errorResponse);
        return;
      }

      const projectsResponse = projects.map(project => ({
        project_id: project.project_id,
        employer_id: project.employer_id,
        employer_email: project.employer_email,
        freelancer_id: project.freelancer_id,
        name: project.name,
        status: project.status,
        description: project.description,
        total_price: project.total_price,
        timeline_days: project.timeline_days,
        stripe_payment_intent_id: project.stripe_payment_intent_id,
        created_at: project.created_at
      }));

      res.status(200).json(projectsResponse);
    } catch (error) {
      logger.error('Get projects error', error);
      const errorResponse = { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' };
      res.status(500).json(errorResponse);
    }
  };

  getProjectById = async (req: Request, res: Response): Promise<void> => {
    logger.request('GET', `/projects/${req.params.id}`);
    
    try {
      const user = (req as any).user;
      const { id } = req.params;
      
      if (!user) {
        const errorResponse = { error: 'User not authenticated' };
        res.status(401).json(errorResponse);
        return;
      }

      if (!id || Array.isArray(id)) {
        const errorResponse = { error: 'Valid Project ID is required' };
        res.status(400).json(errorResponse);
        return;
      }

      let project;

      if (user.role === 'freelancer') {
        // Freelancers can only access projects they created
        project = await this.projectService.getProjectByFreelancerAndId(id, user.userId);
      } else if (user.role === 'employer') {
        // Employers can only access projects where they are the client
        project = await this.projectService.getProjectByIdAndEmployer(id, user.userId);
      } else {
        const errorResponse = { error: 'Invalid user role' };
        res.status(403).json(errorResponse);
        return;
      }
      
      if (!project) {
        const errorResponse = { error: 'Project not found or access denied' };
        res.status(404).json(errorResponse);
        return;
      }

      const projectResponse = {
        project_id: project.project_id,
        employer_id: project.employer_id,
        freelancer_id: project.freelancer_id,
        status: project.status,
        total_price: project.total_price,
        timeline_days: project.timeline_days,
        stripe_payment_intent_id: project.stripe_payment_intent_id,
        created_at: project.created_at,
        name: project.name,
        description: project.description
      };

      res.status(200).json(projectResponse);
    } catch (error) {
      logger.error('Get project by ID error', error);
      const errorResponse = { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' };
      res.status(500).json(errorResponse);
    }
  };
}
