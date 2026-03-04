import { UserRole } from '../enums/user-role.enum';

export class UserResponseDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

export class UserSummaryDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  points: number;
}
