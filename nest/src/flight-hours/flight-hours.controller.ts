import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DailyHoursQueryDto } from './dto/daily-hours.query';
import { SummaryQueryDto } from './dto/summary.query';
import { FlightHoursService } from './flight-hours.service';

@ApiTags('flight-hours')
@ApiBearerAuth()
@Controller(['flight-hours', 'flights-hours'])
export class FlightHoursController {
  constructor(private readonly hours: FlightHoursService) {}

  @Get()
  @ApiOperation({ summary: 'Daily flight hours between two dates' })
  @ApiOkResponse({ description: 'One row per day. Missing days are 0.' })
  daily(@Query() query: DailyHoursQueryDto) {
    return this.hours.daily(query.from, query.to);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Limit cards and the rolling-sum chart' })
  @ApiOkResponse({ description: 'Rolling sums are calculated on the server.' })
  summary(@Query() query: SummaryQueryDto) {
    return this.hours.summary(query.range);
  }
}
