import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

export interface ClientBrief {
  brief_id: string;
  project_id: string;
  raw_text: string;
  domain: 'code' | 'design' | 'content' | 'general';
  ai_processed: boolean;
  created_at?: Date;
}

export interface CreateClientBriefInput {
  client_breif: string;
  domain: 'code' | 'design' | 'content' | 'general';
}

export interface CreateClientBriefData extends CreateClientBriefInput {
  project_id: string;
}

export class ClientBriefService {
  async createClientBrief(briefData: CreateClientBriefData): Promise<ClientBrief> {
    try {
      const brief_id = uuidv4();
      
      await db('client_briefs')
        .insert({
          brief_id,
          project_id: briefData.project_id,
          raw_text: briefData.client_breif,
          domain: briefData.domain,
          ai_processed: false,
          created_at: new Date()
        });

      const brief = await this.getClientBriefById(brief_id);
      
      if (!brief) {
        throw new Error('Failed to create client brief');
      }

      return brief;
    } catch (error) {
      logger.error('Error creating client brief', error);
      throw new Error('Error creating client brief');
    }
  }

  async getClientBriefById(brief_id: string): Promise<ClientBrief | null> {
    try {
      const brief = await db('client_briefs')
        .where({ brief_id })
        .first();
      
      return brief || null;
    } catch (error) {
      logger.error('Error fetching client brief by ID', error);
      throw new Error('Error fetching client brief');
    }
  }

  async getClientBriefByProjectId(project_id: string): Promise<ClientBrief | null> {
    try {
      const brief = await db('client_briefs')
        .where({ project_id })
        .first();
      
      return brief || null;
    } catch (error) {
      logger.error('Error fetching client brief by project ID', error);
      throw new Error('Error fetching client brief');
    }
  }

  async getProjectById(project_id: string): Promise<any | null> {
    try {
      const project = await db('projects')
        .where({ project_id })
        .first();
      
      return project || null;
    } catch (error) {
      logger.error('Error fetching project by ID', error);
      throw new Error('Error fetching project');
    }
  }

  async getProjectByIdAndEmployer(project_id: string, employer_id: string): Promise<any | null> {
    try {
      const project = await db('projects')
        .where({ project_id, employer_id })
        .first();
      
      return project || null;
    } catch (error) {
      logger.error('Error fetching project by ID and employer', error);
      throw new Error('Error fetching project');
    }
  }

  async getProjectByIdAndFreelancer(project_id: string, freelancer_id: string): Promise<any | null> {
    try {
      const project = await db('projects')
        .where({ project_id, freelancer_id })
        .first();
      
      return project || null;
    } catch (error) {
      logger.error('Error fetching project by ID and freelancer', error);
      throw new Error('Error fetching project');
    }
  }
}
