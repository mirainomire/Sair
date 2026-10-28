import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonErrors, apiJson } from '../common/api-docs';
import { PilotService } from './pilot.service';

const signedOut = [{ summary: 'No token, or a token the server cannot verify', message: 'Sign in first.' }];

@ApiTags('pilot')
@ApiBearerAuth()
@Controller('pilot')
export class PilotController {
  constructor(private readonly pilot: PilotService) {}

  @Get('me')
  @ApiOperation({ summary: 'Pilot name, total flight hours, and avatar' })
  @apiJson(200, 'Signed-in pilot profile.', {
    data: {
      name: 'John Doe',
      username: 'johndoe',
      totalFlightHours: 1444.5,
      avatarUrl: '/brand/pilot-avatar.png',
      rank: 'Captain',
      homeBase: 'MKW',
      scheduleToday: '2026-05-15',
    },
  })
  @ApiCommonErrors([], signedOut)
  me() {
    return this.pilot.me();
  }
}
