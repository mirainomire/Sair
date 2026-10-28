import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Sign in with the sample pilot account' })
  @ApiOkResponse({ description: 'Bearer token for the other routes.' })
  @ApiUnauthorizedResponse({ description: 'Username or password does not match.' })
  login(@Body() body: LoginDto) {
    return this.auth.login(body);
  }
}
