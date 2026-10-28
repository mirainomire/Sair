import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiCommonErrors, apiJson } from '../common/api-docs';
import { DailyHoursQueryDto } from './dto/daily-hours.query';
import { SUMMARY_RANGES, SummaryQueryDto } from './dto/summary.query';
import { FlightHoursService } from './flight-hours.service';

const signedOut = [{ summary: 'No token, or a token the server cannot verify', message: 'Sign in first.' }];

@ApiTags('flight-hours')
@ApiBearerAuth()
@Controller(['flight-hours', 'flights-hours'])
export class FlightHoursController {
  constructor(private readonly hours: FlightHoursService) {}

  @Get()
  @ApiOperation({ summary: 'Daily flight hours between two dates' })
  @ApiQuery({ name: 'from', required: true, example: '2026-05-14', description: 'First day, YYYY-MM-DD.' })
  @ApiQuery({ name: 'to', required: true, example: '2026-05-16', description: 'Last day, YYYY-MM-DD. Must be on or after from.' })
  @apiJson(200, 'One row per day. A missing day is returned as 0 and is not skipped.', {
    data: {
      from: '2026-05-14',
      to: '2026-05-16',
      days: [
        { date: '2026-05-14', hours: 6.7 },
        { date: '2026-05-15', hours: 6.4 },
        { date: '2026-05-16', hours: 6.2 },
      ],
    },
  })
  @ApiCommonErrors(
    [
      { summary: 'from or to is not a real calendar date', message: 'from and to must be real dates in YYYY-MM-DD.' },
      { summary: 'from is after to', message: 'from must be on or before to.' },
      { summary: 'The window is longer than 800 days', message: 'Date range is too long.' },
    ],
    signedOut,
  )
  daily(@Query() query: DailyHoursQueryDto) {
    return this.hours.daily(query.from, query.to);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Limit cards and the rolling-sum chart' })
  @ApiQuery({
    name: 'range',
    required: true,
    description: 'Chart window. 1w is the default in the app.',
    schema: { type: 'string', enum: [...SUMMARY_RANGES], example: '1w' },
  })
  @apiJson(200, 'Rolling sums are calculated on the server. series has 15 points, from 7 days before operational today through 7 days after. Two points are shown here.', {
    data: {
      pilotName: 'John Doe',
      totalFlightHours: 1444.5,
      referenceDate: '2026-05-15',
      today: '2026-05-15',
      todayIndex: 7,
      range: '1w',
      ranges: ['1w', '1m', '3m', '6m', '1y'],
      limit: 40,
      max: 45,
      plotMax: 45,
      windowDays: 7,
      used: 25.2,
      overLimit: false,
      limits: { daily: 8, weekly: 40, monthly: 100, annual: 1050 },
      cards: [
        { label: 'Daily', used: 6.4, limit: 8, windowDays: 1, overLimit: false, indicator: 80 },
        { label: 'Weekly', used: 25.2, limit: 40, windowDays: 7, overLimit: false, indicator: 63 },
        { label: 'Monthly', used: 87.2, limit: 100, windowDays: 30, overLimit: false, indicator: 87.2 },
        { label: 'Annual', used: 1013.8, limit: 1050, windowDays: 365, overLimit: false, indicator: 96.6 },
      ],
      series: [
        { date: '2026-05-08', hours: 5.2, rollingSum: 15, isToday: false, aboveLimit: false },
        { date: '2026-05-15', hours: 6.4, rollingSum: 25.2, isToday: true, aboveLimit: false },
      ],
      buckets: [{ label: '09', hours: 0, rollingSum: 15 }],
    },
  })
  @ApiCommonErrors(
    [{ summary: 'range is missing or not one of the five keys', message: 'range must be one of 1w, 1m, 3m, 6m, 1y' }],
    signedOut,
  )
  summary(@Query() query: SummaryQueryDto) {
    return this.hours.summary(query.range);
  }
}
