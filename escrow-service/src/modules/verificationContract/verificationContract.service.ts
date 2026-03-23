import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import { error } from 'node:console';

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
      const verification_contract_id = uuidv4();

      await db('verification_contracts')
        .insert({
          verification_contract_id: verification_contract_id,
          contract_id: 1,
          project_id: contractData.project_id,
          generated_from_sop_version: contractData.generated_from_sop_version || null,
          freelancer_approved: false,
          client_approved: false,
          created_at: new Date()
        });

      const contract = await this.getVerificationContractById(verification_contract_id);
      console.log(contract);

      if (!contract) {
        throw new Error('Failed to create verification contract');
      }

      return contract;
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error('Unknown error:', error);
      }
    }
  }

  async getVerificationContractById(verification_contract_id: string): Promise<VerificationContract | null> {
    try {
      const contract = await db('verification_contracts')
        .where({ verification_contract_id })
        .first();

      return contract || null;
    } catch (error) {
      logger.error('Error fetching verification contract by ID', error);
      throw new Error('Error fetching verification contract');
    }
  }

  async getVerificationContractByProjectId(
    project_id: string
  ): Promise<any | null> {
    try {
      const contract = await db('verification_contracts as vc')
        .join('contracts as c', 'vc.contract_id', 'c.contract_id')
        .where('vc.project_id', project_id)
        .select(
          'c.contract_id',
          'c.policy',
          'vc.verification_contract_id',
          'vc.project_id',
          'vc.generated_from_sop_version',
          'vc.freelancer_approved',
          'vc.client_approved',
          'vc.isLocked',
          'vc.locked_at',
          'vc.created_at'
        )
        .first();

      if (!contract) return null;

      return {
        contract_id: contract.contract_id,
        policy: contract.policy,
        verification_contract_id: contract.verification_contract_id,
        project_id: contract.project_id,
        generated_from_sop_version: contract.generated_from_sop_version,
        freelancer_approved: contract.freelancer_approved,
        client_approved: contract.client_approved,
        isLocked: contract.isLocked,
        locked_at: contract.locked_at,
        created_at: contract.created_at
      };

    } catch (error: unknown) {
      logger.error('Error fetching contract via project ID', error);
      throw new Error('Error fetching contract');
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

  async updateClientApproval(verification_contract_id: string): Promise<VerificationContract | null> {
    try {
      await db('verification_contracts')
        .where({ verification_contract_id })
        .update({ client_approved: true });

      return await this.getVerificationContractById(verification_contract_id);
    } catch (error) {
      logger.error('Error updating client approval', error);
      throw new Error('Error updating client approval');
    }
  }

  async updateFreelancerApproval(verification_contract_id: string): Promise<VerificationContract | null> {
    try {
      await db('verification_contracts')
        .where({ verification_contract_id })
        .update({ freelancer_approved: true });

      return await this.getVerificationContractById(verification_contract_id);
    } catch (error) {
      logger.error('Error updating freelancer approval', error);
      throw new Error('Error updating freelancer approval');
    }
  }

  async lockContract(
    verification_contract_id: string
  ): Promise<VerificationContract | null> {
    try {
      // Step 1: Fetch current contract state
      const contract = await this.getVerificationContractById(verification_contract_id);

      if (!contract) {
        return null; // or throw if this should never happen
      }

      // Step 2: Check approval conditions
      const isFreelancerApproved = !!contract.freelancer_approved;
      const isClientApproved = !!contract.client_approved;

      if (!isFreelancerApproved || !isClientApproved) {
        // ✅ Skip locking silently
        return contract;
      }

      // Step 3: Lock contract
      await db('verification_contracts')
        .where({ verification_contract_id })
        .update({ isLocked: true })
        .update({ locked_at: new Date() });

      // Step 4: Return updated contract
      return await this.getVerificationContractById(verification_contract_id);

    } catch (error: unknown) {
      logger.error('Error locking contract', error);
      throw new Error('Error locking contract');
    }
  }
}
