import { Request, Response } from 'express';
import { AIService } from './ai.service';
import { logger } from '../../utils/logger';

export class AIController {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * Generate milestones from client brief
   * POST /ai/generate-milestones
   */
  generateMilestonesFromBrief = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', '/ai/generate-milestones', req.body);
    
    try {
      const user = (req as any).user;
      const { brief_id } = req.body;
      
      if (!user) {
        const errorResponse = { error: 'User not authenticated' };
        res.status(401).json(errorResponse);
        return;
      }

      if (!brief_id) {
        const errorResponse = { error: 'brief_id is required' };
        res.status(400).json(errorResponse);
        return;
      }

      // Generate milestones using AI
      const result = await this.aiService.generateMilestonesFromBrief(brief_id);

      const successResponse = {
        brief_id: brief_id,
        milestones: result.milestones,
        confidence: result.confidence,
        processing_time: result.processing_time
      };

      res.status(200).json(successResponse);
    } catch (error) {
      logger.error('Generate milestones error', error);
      const errorResponse = { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      };
      res.status(500).json(errorResponse);
    }
  };
}
