import { UserRole } from 'src/types/user-role.type';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  constructor(name: string, email: string, password: string, role: UserRole[]) {
    this.name = name;
    this.email = email;
    this.password = password;
    this.role = role;
  }

  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole[];
}
