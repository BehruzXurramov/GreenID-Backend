import { UserRole } from '../../users/enums/user-role.enum';

export interface RequestUser {
  userId: string;
  role: UserRole;
}
