import { Request, Response } from 'express';
import { ProjectService, CreateProjectInput } from './project.service';
import { logger } from '../../utils/logger';

export class ProjectController {
  private projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService();
  }

  createProject = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', '/projects', req.body);
    
    try {
      const user = (req as any).user;
      
      if (!user || user.role !== 'employer') {
        const errorResponse = { error: 'Only employers can create projects' };
        res.status(403).json(errorResponse);
        return;
      }

      const { total_price, timeline_days }: CreateProjectInput = req.body;

      if (!total_price || typeof total_price !== 'number' || total_price <= 0) {
        const errorResponse = { error: 'Valid total_price is required (must be a positive number)' };
        res.status(400).json(errorResponse);
        return;
      }

      if (timeline_days !== undefined && (typeof timeline_days !== 'number' || timeline_days <= 0)) {
        const errorResponse = { error: 'timeline_days must be a positive number if provided' };
        res.status(400).json(errorResponse);
        return;
      }

      const project = await this.projectService.createProject({
        total_price,
        timeline_days,
        employer_id: user.userId
      });

      const successResponse = {
        project_id: project.project_id,
        employer_id: project.employer_id,
        status: project.status,
        total_price: project.total_price,
        timeline_days: project.timeline_days
      };

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

      const projects = await this.projectService.getProjectsByEmployer(user.userId);

      const projectsResponse = projects.map(project => ({
        project_id: project.project_id,
        employer_id: project.employer_id,
        freelancer_id: project.freelancer_id,
        status: project.status,
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

      const project = await this.projectService.getProjectByIdAndEmployer(id, user.userId);
      
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
        created_at: project.created_at
      };

      res.status(200).json(projectResponse);
    } catch (error) {
      logger.error('Get project by ID error', error);
      const errorResponse = { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' };
      res.status(500).json(errorResponse);
    }
  };
}
