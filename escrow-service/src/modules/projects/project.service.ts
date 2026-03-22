import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import { AIService } from '../ai/ai.service';

export interface Project {
  description: string;
  name: string;
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
  description: string;
  name: string;
  client_id: string;
  total_price: number;
  timeline_days?: number;
}

export interface CreateProjectData extends CreateProjectInput {
  freelancer_id: string;
  employer_id: string;
}

export class ProjectService {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  async createProject(projectData: CreateProjectData): Promise<Project> {
    try {
      const project_id = uuidv4();
      
      await db('projects')
        .insert({
          name: projectData.name,
          project_id,
          employer_id: projectData.employer_id,
          freelancer_id: projectData.freelancer_id,
          description: projectData.description,
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

  /**
   * Create milestones from AI-generated data
   */
  async createMilestonesFromAI(projectId: string, briefId: string): Promise<any[]> {
    try {
      // Generate milestones using AI
      const aiResult = await this.aiService.generateMilestonesFromBrief(briefId);
      
      // Insert generated milestones into database
      const milestones = [];
      
      for (const milestone of aiResult.milestones) {
        const milestoneId = uuidv4();
        
        await db('milestone_checks').insert({
          milestone_id: milestoneId,
          project_id: projectId,
          title: milestone.title,
          description: milestone.description,
          amount: milestone.amount,
          status: 'pending',
          created_at: new Date()
        });
        
        milestones.push({
          milestone_id: milestoneId,
          title: milestone.title,
          description: milestone.description,
          amount: milestone.amount,
          status: 'pending',
          estimated_days: milestone.estimated_days
        });
      }
      
      logger.info('Created milestones from AI generation', {
        project_id: projectId,
        brief_id: briefId,
        milestones_count: milestones.length
      });
      
      return milestones;
    } catch (error) {
      logger.error('Error creating milestones from AI', error);
      throw new Error('Error creating milestones from AI');
    }
  }

  async getProjectById(projectId: string): Promise<Project | null> {
    try {
      const project = await db('projects')
        .where({ project_id: projectId })
        .first();
      
      return project || null;
    } catch (error) {
      logger.error('Error fetching project by ID', error);
      throw new Error('Error fetching project');
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

  async checkFreelancerClientRelation(freelancer_id: string, client_id: string): Promise<boolean> {
    try {
      const relation = await db('freelancer_clients')
        .where({ freelancer_id, client_id })
        .first();
      
      return !!relation;
    } catch (error) {
      logger.error('Error checking freelancer-client relation', error);
      throw new Error('Error checking relation');
    }
  }

  async createFreelancerClientRelation(freelancer_id: string, client_id: string): Promise<void> {
    try {
      await db('freelancer_clients')
        .insert({
          freelancer_id,
          client_id,
          created_at: new Date()
        });
      
      logger.info('Created freelancer-client relation', {
        freelancer_id,
        client_id
      });
    } catch (error) {
      logger.error('Error creating freelancer-client relation', error);
      throw new Error('Error creating relation');
    }
  }

  async getProjectsByFreelancer(freelancer_id: string): Promise<Project[]> {
    try {
      const projects = await db('projects')
        .where({ freelancer_id })
        .orderBy('created_at', 'desc');
      
      return projects;
    } catch (error) {
      logger.error('Error fetching projects by freelancer', error);
      throw new Error('Error fetching projects');
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

  async getProjectByFreelancerAndId(project_id: string, freelancer_id: string): Promise<Project | null> {
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
