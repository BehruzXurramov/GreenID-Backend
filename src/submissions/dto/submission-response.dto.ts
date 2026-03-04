import { UserSummaryDto } from '../../users/dto/user-response.dto';
import { SubmissionStatus } from '../enums/submission-status.enum';

export class SubmissionResponseDto {
  id: string;
  userId: string;
  beforeImage: string;
  afterImage: string;
  description: string;
  adminDescription: string | null;
  status: SubmissionStatus;
  pointsGiven: number | null;
  createdAt: Date;
  updatedAt: Date;
  user?: UserSummaryDto;
}
