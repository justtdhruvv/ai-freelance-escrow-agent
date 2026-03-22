import { Request, Response } from 'express';
import { ClientBriefService, CreateClientBriefInput } from './clientBrief.service';
import { logger } from '../../utils/logger';

export class ClientBriefController {
  private clientBriefService: ClientBriefService;

  constructor() {
    this.clientBriefService = new ClientBriefService();
  }

  createClientBrief = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', `/projects/${req.params.projectId}/brief`, req.body);
    
    try {
      const user = (req as any).user;
      const { projectId } = req.params;
      
      if (!user) {
        const errorResponse = { error: 'User not authenticated' };
        res.status(401).json(errorResponse);
        return;
      }

      if (!projectId || Array.isArray(projectId)) {
        const errorResponse = { error: 'Valid Project ID is required' };
        res.status(400).json(errorResponse);
        return;
      }

      // Verify project exists and user owns it (check both freelancer and employer)
      let project;
      if (user.role === 'freelancer') {
        project = await this.clientBriefService.getProjectByIdAndFreelancer(projectId, user.userId);
      } else if (user.role === 'employer') {
        project = await this.clientBriefService.getProjectByIdAndEmployer(projectId, user.userId);
      }
      
      if (!project) {
        const errorResponse = { error: 'Project not found or access denied' };
        res.status(404).json(errorResponse);
        return;
      }

      const { raw_text, domain }: CreateClientBriefInput = req.body;

      if (!raw_text || typeof raw_text !== 'string' || raw_text.trim().length === 0) {
        const errorResponse = { error: 'raw_text is required and must be a non-empty string' };
        res.status(400).json(errorResponse);
        return;
      }

      if (!domain || !['code', 'design', 'content', 'general'].includes(domain)) {
        const errorResponse = { error: 'domain must be one of: code, design, content, general' };
        res.status(400).json(errorResponse);
        return;
      }

      const brief = await this.clientBriefService.createClientBrief({
        raw_text: raw_text.trim(),
        domain,
        project_id: projectId
      });

      const successResponse = {
        brief_id: brief.brief_id,
        project_id: brief.project_id,
        raw_text: brief.raw_text,
        domain: brief.domain,
        ai_processed: brief.ai_processed
      };

      res.status(201).json(successResponse);
    } catch (error) {
      logger.error('Create client brief error', error);
      const errorResponse = { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' };
      res.status(500).json(errorResponse);
    }
  };

  getClientBrief = async (req: Request, res: Response): Promise<void> => {
    logger.request('GET', `/projects/${req.params.projectId}/brief`);
    
    try {
      const user = (req as any).user;
      const { projectId } = req.params;
      
      if (!user) {
        const errorResponse = { error: 'User not authenticated' };
        res.status(401).json(errorResponse);
        return;
      }

      if (!projectId || Array.isArray(projectId)) {
        const errorResponse = { error: 'Valid Project ID is required' };
        res.status(400).json(errorResponse);
        return;
      }

      // Verify project exists
      const project = await this.clientBriefService.getProjectById(projectId);
      
      if (!project) {
        const errorResponse = { error: 'Project not found' };
        res.status(404).json(errorResponse);
        return;
      }

      // Only project owner can access the brief
      if (project.employer_id !== user.userId) {
        const errorResponse = { error: 'Access denied - only project owner can view brief' };
        res.status(403).json(errorResponse);
        return;
      }

      const brief = await this.clientBriefService.getClientBriefByProjectId(projectId);
      
      if (!brief) {
        const errorResponse = { error: 'Brief not found for this project' };
        res.status(404).json(errorResponse);
        return;
      }

      const briefResponse = {
        brief_id: brief.brief_id,
        project_id: brief.project_id,
        raw_text: brief.raw_text,
        domain: brief.domain,
        ai_processed: brief.ai_processed,
        created_at: brief.created_at
      };

      res.status(200).json(briefResponse);
    } catch (error) {
      logger.error('Get client brief error', error);
      const errorResponse = { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' };
      res.status(500).json(errorResponse);
    }
  };
}
