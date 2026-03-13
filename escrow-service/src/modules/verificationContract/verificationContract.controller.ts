import { Request, Response } from 'express';
import { VerificationContractService, CreateVerificationContractInput } from './verificationContract.service';
import { logger } from '../../utils/logger';

export class VerificationContractController {
  private verificationContractService: VerificationContractService;

  constructor() {
    this.verificationContractService = new VerificationContractService();
  }

  createVerificationContract = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', `/projects/${req.params.projectId}/verification-contract`, req.body);
    
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

      // Only employers can create verification contracts
      if (user.role !== 'employer') {
        const errorResponse = { error: 'Only employers can create verification contracts' };
        res.status(403).json(errorResponse);
        return;
      }

      // Verify project exists and user owns it
      const project = await this.verificationContractService.getProjectByIdAndEmployer(projectId, user.userId);
      
      if (!project) {
        const errorResponse = { error: 'Project not found or access denied' };
        res.status(404).json(errorResponse);
        return;
      }

      // Check if contract already exists for this project
      const existingContract = await this.verificationContractService.getVerificationContractByProjectId(projectId);
      if (existingContract) {
        const errorResponse = { error: 'Verification contract already exists for this project' };
        res.status(409).json(errorResponse);
        return;
      }

      const { generated_from_sop_version }: CreateVerificationContractInput = req.body;

      const contract = await this.verificationContractService.createVerificationContract({
        project_id: projectId,
        generated_from_sop_version
      });

      const successResponse = {
        contract_id: contract.contract_id,
        project_id: contract.project_id,
        freelancer_approved: contract.freelancer_approved,
        client_approved: contract.client_approved
      };

      res.status(201).json(successResponse);
    } catch (error) {
      logger.error('Create verification contract error', error);
      const errorResponse = { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' };
      res.status(500).json(errorResponse);
    }
  };

  approveClient = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', `/verification-contract/${req.params.contractId}/approve-client`);
    
    try {
      const user = (req as any).user;
      const { contractId } = req.params;
      
      if (!user) {
        const errorResponse = { error: 'User not authenticated' };
        res.status(401).json(errorResponse);
        return;
      }

      if (!contractId || Array.isArray(contractId)) {
        const errorResponse = { error: 'Valid Contract ID is required' };
        res.status(400).json(errorResponse);
        return;
      }

      // Get contract and verify project ownership
      const contract = await this.verificationContractService.getVerificationContractById(contractId);
      
      if (!contract) {
        const errorResponse = { error: 'Contract not found' };
        res.status(404).json(errorResponse);
        return;
      }

      const project = await this.verificationContractService.getProjectByIdAndEmployer(contract.project_id, user.userId);
      
      if (!project) {
        const errorResponse = { error: 'Access denied - only project owner can approve contract' };
        res.status(403).json(errorResponse);
        return;
      }

      if (contract.locked_at) {
        const errorResponse = { error: 'Contract is already locked and cannot be modified' };
        res.status(400).json(errorResponse);
        return;
      }

      const updatedContract = await this.verificationContractService.updateClientApproval(contractId);

      const successResponse = {
        contract_id: updatedContract!.contract_id,
        project_id: updatedContract!.project_id,
        freelancer_approved: updatedContract!.freelancer_approved,
        client_approved: updatedContract!.client_approved
      };

      res.status(200).json(successResponse);
    } catch (error) {
      logger.error('Approve client contract error', error);
      const errorResponse = { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' };
      res.status(500).json(errorResponse);
    }
  };

  approveFreelancer = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', `/verification-contract/${req.params.contractId}/approve-freelancer`);
    
    try {
      const user = (req as any).user;
      const { contractId } = req.params;
      
      if (!user) {
        const errorResponse = { error: 'User not authenticated' };
        res.status(401).json(errorResponse);
        return;
      }

      if (!contractId || Array.isArray(contractId)) {
        const errorResponse = { error: 'Valid Contract ID is required' };
        res.status(400).json(errorResponse);
        return;
      }

      // Get contract and verify freelancer assignment
      const contract = await this.verificationContractService.getVerificationContractById(contractId);
      
      if (!contract) {
        const errorResponse = { error: 'Contract not found' };
        res.status(404).json(errorResponse);
        return;
      }

      const project = await this.verificationContractService.getProjectByIdAndFreelancer(contract.project_id, user.userId);
      
      if (!project) {
        const errorResponse = { error: 'Access denied - only assigned freelancer can approve contract' };
        res.status(403).json(errorResponse);
        return;
      }

      if (contract.locked_at) {
        const errorResponse = { error: 'Contract is already locked and cannot be modified' };
        res.status(400).json(errorResponse);
        return;
      }

      const updatedContract = await this.verificationContractService.updateFreelancerApproval(contractId);

      const successResponse = {
        contract_id: updatedContract!.contract_id,
        project_id: updatedContract!.project_id,
        freelancer_approved: updatedContract!.freelancer_approved,
        client_approved: updatedContract!.client_approved
      };

      res.status(200).json(successResponse);
    } catch (error) {
      logger.error('Approve freelancer contract error', error);
      const errorResponse = { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' };
      res.status(500).json(errorResponse);
    }
  };

  lockContract = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', `/verification-contract/${req.params.contractId}/lock`);
    
    try {
      const user = (req as any).user;
      const { contractId } = req.params;
      
      if (!user) {
        const errorResponse = { error: 'User not authenticated' };
        res.status(401).json(errorResponse);
        return;
      }

      if (!contractId || Array.isArray(contractId)) {
        const errorResponse = { error: 'Valid Contract ID is required' };
        res.status(400).json(errorResponse);
        return;
      }

      const contract = await this.verificationContractService.getVerificationContractById(contractId);
      
      if (!contract) {
        const errorResponse = { error: 'Contract not found' };
        res.status(404).json(errorResponse);
        return;
      }

      // Verify user is either employer or assigned freelancer
      const project = await this.verificationContractService.getProjectById(contract.project_id);
      
      if (!project || (project.employer_id !== user.userId && project.freelancer_id !== user.userId)) {
        const errorResponse = { error: 'Access denied - only project owner or assigned freelancer can lock contract' };
        res.status(403).json(errorResponse);
        return;
      }

      if (contract.locked_at) {
        const errorResponse = { error: 'Contract is already locked' };
        res.status(400).json(errorResponse);
        return;
      }

      if (!contract.freelancer_approved || !contract.client_approved) {
        const errorResponse = { error: 'Both freelancer and client must approve the contract before locking' };
        res.status(400).json(errorResponse);
        return;
      }

      const lockedContract = await this.verificationContractService.lockContract(contractId);

      const successResponse = {
        contract_id: lockedContract!.contract_id,
        project_id: lockedContract!.project_id,
        freelancer_approved: lockedContract!.freelancer_approved,
        client_approved: lockedContract!.client_approved,
        locked_at: lockedContract!.locked_at
      };

      res.status(200).json(successResponse);
    } catch (error) {
      logger.error('Lock contract error', error);
      const errorResponse = { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' };
      res.status(500).json(errorResponse);
    }
  };

  getVerificationContract = async (req: Request, res: Response): Promise<void> => {
    logger.request('GET', `/projects/${req.params.projectId}/verification-contract`);
    
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

      // Verify project exists and user has access
      const project = await this.verificationContractService.getProjectById(projectId);
      
      if (!project) {
        const errorResponse = { error: 'Project not found' };
        res.status(404).json(errorResponse);
        return;
      }

      // Check if user is employer or assigned freelancer
      if (project.employer_id !== user.userId && project.freelancer_id !== user.userId) {
        const errorResponse = { error: 'Access denied - only project owner or assigned freelancer can view contract' };
        res.status(403).json(errorResponse);
        return;
      }

      const contract = await this.verificationContractService.getVerificationContractByProjectId(projectId);
      
      if (!contract) {
        const errorResponse = { error: 'Verification contract not found for this project' };
        res.status(404).json(errorResponse);
        return;
      }

      const contractResponse = {
        contract_id: contract.contract_id,
        project_id: contract.project_id,
        generated_from_sop_version: contract.generated_from_sop_version,
        freelancer_approved: contract.freelancer_approved,
        client_approved: contract.client_approved,
        locked_at: contract.locked_at,
        created_at: contract.created_at
      };

      res.status(200).json(contractResponse);
    } catch (error) {
      logger.error('Get verification contract error', error);
      const errorResponse = { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' };
      res.status(500).json(errorResponse);
    }
  };
}
