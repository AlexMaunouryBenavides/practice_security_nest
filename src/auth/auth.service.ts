import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { SignInDto } from './dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async signIn(data: SignInDto): Promise<{ accessToken: string }> {
    const user = await this.usersService.readOneByEmail(data);

    if (!user) {
      throw new UnauthorizedException();
    }

    const isMatch = await bcrypt.compare(data.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, role: user.role };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}
