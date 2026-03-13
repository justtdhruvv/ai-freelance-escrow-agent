import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

export interface VerificationContract {
  contract_id: string;
  project_id: string;
  generated_from_sop_version?: number;
  freelancer_approved: boolean;
  client_approved: boolean;
  locked_at?: Date;
  created_at?: Date;
}

export interface CreateVerificationContractInput {
  project_id: string;
  generated_from_sop_version?: number;
}

export class VerificationContractService {
  async createVerificationContract(contractData: CreateVerificationContractInput): Promise<VerificationContract> {
    try {
      const contract_id = uuidv4();
      
      await db('verification_contracts')
        .insert({
          contract_id,
          project_id: contractData.project_id,
          generated_from_sop_version: contractData.generated_from_sop_version || null,
          freelancer_approved: false,
          client_approved: false,
          created_at: new Date()
        });

      const contract = await this.getVerificationContractById(contract_id);
      
      if (!contract) {
        throw new Error('Failed to create verification contract');
      }

      return contract;
    } catch (error) {
      logger.error('Error creating verification contract', error);
      throw new Error('Error creating verification contract');
    }
  }

  async getVerificationContractById(contract_id: string): Promise<VerificationContract | null> {
    try {
      const contract = await db('verification_contracts')
        .where({ contract_id })
        .first();
      
      return contract || null;
    } catch (error) {
      logger.error('Error fetching verification contract by ID', error);
      throw new Error('Error fetching verification contract');
    }
  }

  async getVerificationContractByProjectId(project_id: string): Promise<VerificationContract | null> {
    try {
      const contract = await db('verification_contracts')
        .where({ project_id })
        .first();
      
      return contract || null;
    } catch (error) {
      logger.error('Error fetching verification contract by project ID', error);
      throw new Error('Error fetching verification contract');
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

  async updateClientApproval(contract_id: string): Promise<VerificationContract | null> {
    try {
      await db('verification_contracts')
        .where({ contract_id })
        .update({ client_approved: true });

      return await this.getVerificationContractById(contract_id);
    } catch (error) {
      logger.error('Error updating client approval', error);
      throw new Error('Error updating client approval');
    }
  }

  async updateFreelancerApproval(contract_id: string): Promise<VerificationContract | null> {
    try {
      await db('verification_contracts')
        .where({ contract_id })
        .update({ freelancer_approved: true });

      return await this.getVerificationContractById(contract_id);
    } catch (error) {
      logger.error('Error updating freelancer approval', error);
      throw new Error('Error updating freelancer approval');
    }
  }

  async lockContract(contract_id: string): Promise<VerificationContract | null> {
    try {
      await db('verification_contracts')
        .where({ contract_id })
        .update({ locked_at: new Date() });

      return await this.getVerificationContractById(contract_id);
    } catch (error) {
      logger.error('Error locking contract', error);
      throw new Error('Error locking contract');
    }
  }
}
