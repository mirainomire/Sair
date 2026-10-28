import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PilotDataService } from '../data/pilot-data.service';
import { LoginDto } from './dto/login.dto';
import { readToken, safeEqual, signToken } from './password';

@Injectable()
export class AuthService {
  constructor(private readonly data: PilotDataService) {}

  private secret() {
    return process.env.AUTH_SECRET || 'susiair-pilot-dev-secret';
  }

  login(body: LoginDto) {
    const account = this.data.account;
    const usernameOk = safeEqual(body.username, account.username);
    const passwordOk = safeEqual(body.password, account.password);
    if (!usernameOk || !passwordOk) {
      throw new UnauthorizedException('Username or password does not match.');
    }
    const token = signToken({ username: account.username, name: this.data.pilotName }, this.secret());
    return { data: { token } };
  }

  verify(token: string) {
    const payload = readToken(token, this.secret());
    if (!payload || payload.username !== this.data.account.username) return null;
    return payload;
  }
}
