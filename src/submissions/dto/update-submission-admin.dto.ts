import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateSubmissionAdminDto {
  @IsInt()
  @Min(0)
  pointsGiven: number;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  adminDescription?: string;
}
