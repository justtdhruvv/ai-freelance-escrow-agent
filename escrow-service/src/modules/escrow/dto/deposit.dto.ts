import { IsString, IsNumber, IsPositive } from 'class-validator';

export class DepositDto {
  @IsString()
  userId: string;

  @IsString()
  projectId: string;

  @IsNumber()
  @IsPositive()
  amount: number;
}
