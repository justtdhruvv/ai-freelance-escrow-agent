import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

export interface Project {
  project_id: string;
  employer_id: string;
  freelancer_id?: string;
  status: 'draft' | 'sop_review' | 'client_review' | 'active' | 'completed' | 'disputed' | 'cancelled';
  total_price: number;
  timeline_days?: number;
  stripe_payment_intent_id?: string;
  created_at?: Date;
}

export interface CreateProjectInput {
  total_price: number;
  timeline_days?: number;
}

export interface CreateProjectData extends CreateProjectInput {
  employer_id: string;
}

export class ProjectService {
  async createProject(projectData: CreateProjectData): Promise<Project> {
    try {
      const project_id = uuidv4();
      
      await db('projects')
        .insert({
          project_id,
          employer_id: projectData.employer_id,
          total_price: projectData.total_price,
          timeline_days: projectData.timeline_days || null,
          status: 'draft',
          created_at: new Date()
        });

      const project = await this.getProjectById(project_id);
      
      if (!project) {
        throw new Error('Failed to create project');
      }

      return project;
    } catch (error) {
      logger.error('Error creating project', error);
      throw new Error('Error creating project');
    }
  }

  async getProjectsByEmployer(employer_id: string): Promise<Project[]> {
    try {
      const projects = await db('projects')
        .where({ employer_id })
        .orderBy('created_at', 'desc');
      
      return projects;
    } catch (error) {
      logger.error('Error fetching projects by employer', error);
      throw new Error('Error fetching projects');
    }
  }

  async getProjectById(project_id: string): Promise<Project | null> {
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

  async getProjectByIdAndEmployer(project_id: string, employer_id: string): Promise<Project | null> {
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
}
