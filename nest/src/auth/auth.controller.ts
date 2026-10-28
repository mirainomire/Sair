import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonErrors, apiJson } from '../common/api-docs';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with the sample pilot account johndoe / susiairtest.' })
  @apiJson(200, 'Bearer token for the other routes. Send it as Authorization: Bearer <token>.', {
    data: { token: 'eyJ1c2VybmFtZSI6ImpvaG5kb2UiLCJuYW1lIjoiSm9obiBEb2UiLCJleHAiOjE3ODAwMDAwMDAwMH0.signature' },
  })
  @ApiCommonErrors(
    [
      { summary: 'Username shorter than 3 characters', message: 'username must be longer than or equal to 3 characters' },
      { summary: 'A field other than username or password', message: 'property extra should not exist' },
    ],
    [{ summary: 'Wrong username or password', message: 'Username or password does not match.' }],
  )
  login(@Body() body: LoginDto) {
    return this.auth.login(body);
  }
}
