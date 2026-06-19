import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { UserRole } from '../types/user-role.type';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly userService: UserService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    // Never create a default account on a production deployment.
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    // Idempotent: only seed when the table is empty.
    const userCount = await this.userRepository.count();
    if (userCount > 0) {
      return;
    }

    await this.userService.createUser({
      name: 'test',
      email: 'test@test.com',
      password: 'password',
      role: [UserRole.USER],
    });

    this.logger.log('Seeded dev test account: test@test.com / password');
  }
}
