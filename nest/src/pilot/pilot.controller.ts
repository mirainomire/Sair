import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PilotService } from './pilot.service';

@ApiTags('pilot')
@ApiBearerAuth()
@Controller('pilot')
export class PilotController {
  constructor(private readonly pilot: PilotService) {}

  @Get('me')
  @ApiOperation({ summary: 'Pilot name, total flight hours, and avatar' })
  @ApiOkResponse({ description: 'Signed-in pilot profile.' })
  me() {
    return this.pilot.me();
  }
}
