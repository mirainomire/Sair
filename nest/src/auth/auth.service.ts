import { HttpException, HttpStatus, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PilotDataService } from '../data/pilot-data.service';
import { LoginDto } from './dto/login.dto';
import { readToken, safeEqual, signToken, verifyPassword } from './password';

@Injectable()
export class AuthService {
  private readonly failures = new Map<string, { count: number; resetAt: number }>();
  constructor(private readonly data: PilotDataService) {}

  private secret() {
    const secret = process.env.AUTH_SECRET?.trim();
    if (!secret && process.env.NODE_ENV === 'production') throw new InternalServerErrorException('Server authentication is not configured.');
    return secret || 'susiair-pilot-dev-secret';
  }

  login(body: LoginDto, clientKey = 'unknown') {
    const now = Date.now();
    const current = this.failures.get(clientKey);
    if (current && current.resetAt > now && current.count >= 5) throw new HttpException('Too many sign-in attempts. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    if (current && current.resetAt <= now) this.failures.delete(clientKey);
    const account = this.data.account;
    const usernameOk = safeEqual(body.username, account.username);
    const passwordOk = verifyPassword(body.password, account.passwordHash);
    if (!usernameOk || !passwordOk) {
      const previous = this.failures.get(clientKey);
      this.failures.set(clientKey, { count: (previous?.count ?? 0) + 1, resetAt: now + 15 * 60 * 1000 });
      throw new UnauthorizedException('Username or password does not match.');
    }
    this.failures.delete(clientKey);
    const token = signToken({ username: account.username, name: this.data.pilotName }, this.secret());
    return { data: { token } };
  }

  verify(token: string) {
    const payload = readToken(token, this.secret());
    if (!payload || payload.username !== this.data.account.username) return null;
    return payload;
  }
}
