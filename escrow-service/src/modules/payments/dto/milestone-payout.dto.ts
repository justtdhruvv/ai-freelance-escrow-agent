import { IsString, IsNumber, IsInt, Min, Max } from 'class-validator';

export class MilestonePayoutDto {
  @IsString()
  milestoneId: string;

  @IsString()
  freelancerId: string;

  @IsNumber()
  @IsInt()
  @Min(0)
  @Max(100)
  score: number;
}
