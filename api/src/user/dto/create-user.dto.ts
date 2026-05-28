import { UserRole } from '../../types/user-role.type';

export class CreateUserDto {
  constructor(name: string, email: string, password: string, role: UserRole[]) {
    this.name = name;
    this.email = email;
    this.password = password;
    this.role = role;
  }

  name: string;

  email: string;

  password: string;

  role: UserRole[];
}
