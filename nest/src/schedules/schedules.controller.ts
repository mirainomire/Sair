import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiCommonErrors, apiJson } from '../common/api-docs';
import { SchedulesQueryDto } from './dto/schedules.query';
import { SchedulesService } from './schedules.service';

const signedOut = [{ summary: 'No token, or a token the server cannot verify', message: 'Sign in first.' }];

@ApiTags('schedules')
@ApiBearerAuth()
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedules: SchedulesService) {}

  @Get()
  @ApiOperation({ summary: 'Duty entries for one month' })
  @ApiQuery({ name: 'year', required: true, example: 2026, description: 'Calendar year, from 2000 through 2100.' })
  @ApiQuery({ name: 'month', required: true, example: 5, description: 'Month number, 1 through 12.' })
  @apiJson(200, 'Days, legend, and logbook progress for the requested month. logged is true when countLogbooks equals countSchedules. One day is shown here; the month returns every duty day.', {
    data: {
      year: 2026,
      month: 5,
      today: '2026-05-15',
      legend: [
        { code: 'DTY', label: 'On Duty', color: '#10B981' },
        { code: 'RLV', label: 'Requested Leave', color: '#475569' },
      ],
      entries: [
        {
          id: '97027',
          date: '2026-05-15',
          status: 1,
          baseName: 'MKW',
          baseColor: '#10B981',
          dutyType: 'DTY',
          countSchedules: 6,
          countLogbooks: 6,
          logged: true,
        },
      ],
    },
  })
  @ApiCommonErrors(
    [
      { summary: 'year or month is missing or not an integer', message: 'year must be an integer number' },
      { summary: 'month is outside 1 to 12', message: 'month must not be greater than 12' },
    ],
    signedOut,
  )
  month(@Query() query: SchedulesQueryDto) {
    return this.schedules.month(query.year, query.month);
  }
}
