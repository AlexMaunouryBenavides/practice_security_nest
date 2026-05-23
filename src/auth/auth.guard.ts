import {
  CanActivate,
  Injectable,
  UnauthorizedException,
  ExecutionContext,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload } from 'src/types/jwt-payload.type';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService,
    private userService: UserService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromCookie(request);
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const user= await this.userService.findAll();
      console.log(user);
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      console.log("payload authguard => ", payload);
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    const cookies = request.cookies as Record<string, unknown>;
    const token = cookies?.access_token;
    return typeof token === 'string' ? token : undefined;
  }
}
