import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { EscrowService } from './escrow.service';
import { DepositDto } from './dto/deposit.dto';

@ApiTags('escrow')
@Controller('escrow')
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  @Post('deposit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deposit funds into project escrow' })
  @ApiResponse({ status: 200, description: 'Funds deposited successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User or project not found' })
  async depositToEscrow(@Body() depositDto: DepositDto) {
    return this.escrowService.depositToEscrow(
      depositDto.userId,
      depositDto.projectId,
      depositDto.amount,
    );
  }

  @Get('project/:projectId/balance')
  @ApiOperation({ summary: 'Get project escrow balance' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project escrow balance' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProjectEscrowBalance(@Param('projectId') projectId: string) {
    return this.escrowService.getProjectEscrowBalance(projectId);
  }

  @Get('user/:userId/wallet')
  @ApiOperation({ summary: 'Get user wallet balance' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User wallet balance' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserWalletBalance(@Param('userId') userId: string) {
    return this.escrowService.getUserWalletBalance(userId);
  }
}
