import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'api/src/types/user-role.type';

export const ROLES_KEY = 'role';
export const Roles = (...role: UserRole[]) => SetMetadata(ROLES_KEY, role);
