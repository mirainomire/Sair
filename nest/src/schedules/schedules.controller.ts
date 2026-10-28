import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SchedulesQueryDto } from './dto/schedules.query';
import { SchedulesService } from './schedules.service';

@ApiTags('schedules')
@ApiBearerAuth()
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedules: SchedulesService) {}

  @Get()
  @ApiOperation({ summary: 'Duty entries for one month' })
  @ApiOkResponse({ description: 'Days, legend, and logbook progress for the requested month.' })
  month(@Query() query: SchedulesQueryDto) {
    return this.schedules.month(query.year, query.month);
  }
}
