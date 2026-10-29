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
  @ApiOperation({ summary: 'Verified pilot profile and operational contacts' })
  @apiJson(200, 'Signed-in pilot profile. totalFlightHours is an overall aggregate, not a PIC/SIC breakdown.', {
    data: {
      name: 'John Doe',
      username: 'johndoe',
      totalFlightHours: 1444.5,
      avatarUrl: '/brand/pilot-avatar.png',
      rank: 'Captain',
      homeBase: 'MKW',
      crewId: 'SA-DEMO-0421',
      aircraftRatings: ['C208B', 'DHC-6 Twin Otter'],
      email: 'john.doe@susiair.example',
      mobile: '+628111234567',
      operationsContacts: {
        crewScheduling: { phone: '+628111234568', whatsapp: '628111234568', hours: '06:00–22:00 WIB daily' },
        occ: { phone: '+628111234569', whatsapp: '628111234569', hours: '24/7 operational support' },
      },
      scheduleToday: '2026-05-15',
      lastSyncedAt: '2026-10-29T20:00:00.000Z',
    },
  })
  @ApiCommonErrors([], signedOut)
  me() {
    return this.pilot.me();
  }
}
