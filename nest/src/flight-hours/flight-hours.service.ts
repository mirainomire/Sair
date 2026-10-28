import { BadRequestException, Injectable } from '@nestjs/common';
import { addIsoDays, isRealIsoDate, round1 } from '../common/dates';
import { PilotDataService } from '../data/pilot-data.service';
import { SummaryRange } from './dto/summary.query';

@Injectable()
export class FlightHoursService {
  constructor(private readonly data: PilotDataService) {}

  daily(from: string, to: string) {
    this.assertRange(from, to);
    const byDate = new Map(this.data.flightDays.map((row) => [row.date, row.hours]));
    const days: { date: string; hours: number }[] = [];
    for (let date = from; date <= to; date = addIsoDays(date, 1)) {
      days.push({ date, hours: round1(byDate.get(date) ?? 0) });
    }
    return { data: { from, to, days } };
  }

  summary(range: SummaryRange) {
    const bound = this.data.chartBounds[range];
    if (!bound) throw new BadRequestException('Unknown range.');

    const rows = this.data.flightDays;
    const today = this.data.sampleToday;
    const byDate = new Map(rows.map((row) => [row.date, row.hours]));
    const limits = this.data.limits;
    const cards = [
      this.card('Daily', this.sumEnding(byDate, today, 1), limits.daily, 1),
      this.card('Weekly', this.sumEnding(byDate, today, 7), limits.weekly, 7),
      this.card('Monthly', this.sumEnding(byDate, today, 30), limits.monthly, 30),
      this.card('Annual', this.sumEnding(byDate, today, 365), limits.annual, 365),
    ];

    const series: { date: string; hours: number; rollingSum: number; isToday: boolean; aboveLimit: boolean }[] = [];
    for (let offset = -7; offset <= 7; offset += 1) {
      const date = addIsoDays(today, offset);
      const rollingSum = this.sumEnding(byDate, date, bound.windowDays);
      series.push({
        date,
        hours: round1(byDate.get(date) ?? 0),
        rollingSum,
        isToday: offset === 0,
        aboveLimit: rollingSum > bound.limit,
      });
    }
    const peak = series.reduce((highest, point) => Math.max(highest, point.rollingSum), 0);
    // The configured Y max is the chart ceiling. If a rolling sum is higher, the ceiling
    // grows to that sum so the point stays inside the card. The red line stays on the limit.
    const plotMax = Math.max(bound.max, peak);

    const windowStart = addIsoDays(today, -(bound.windowDays - 1));
    const windowDays: { date: string; hours: number }[] = [];
    for (let offset = 0; offset < bound.windowDays; offset += 1) {
      const date = addIsoDays(windowStart, offset);
      windowDays.push({ date, hours: byDate.get(date) ?? 0 });
    }
    const bucketCount = Math.max(1, bound.displayRangeDays);
    const buckets: { label: string; hours: number; rollingSum: number }[] = [];
    for (let index = 0; index < bucketCount; index += 1) {
      const fromIndex = Math.floor((index * windowDays.length) / bucketCount);
      const toIndex = Math.floor(((index + 1) * windowDays.length) / bucketCount);
      const slice = windowDays.slice(fromIndex, Math.max(toIndex, fromIndex + 1));
      const hours = round1(slice.reduce((sum, item) => sum + item.hours, 0));
      const label =
        slice.length === 1 ? slice[0].date.slice(8) : `${slice[0].date.slice(8)}–${slice[slice.length - 1].date.slice(8)}`;
      buckets.push({ label, hours, rollingSum: this.sumEnding(byDate, slice[slice.length - 1].date, bound.windowDays) });
    }

    const used = this.sumEnding(byDate, today, bound.windowDays);
    return {
      data: {
        pilotName: this.data.pilotName,
        totalFlightHours: this.data.totalFlightHours,
        referenceDate: today,
        today,
        todayIndex: series.findIndex((point) => point.isToday),
        range,
        ranges: ['1w', '1m', '3m', '6m', '1y'],
        limit: bound.limit,
        max: bound.max,
        plotMax,
        windowDays: bound.windowDays,
        used,
        overLimit: used > bound.limit,
        limits,
        cards,
        series,
        buckets,
      },
    };
  }

  private card(label: string, used: number, limit: number, windowDays: number) {
    return {
      label,
      used,
      limit,
      windowDays,
      overLimit: used > limit,
      indicator: limit > 0 ? Math.min(100, round1((used / limit) * 100)) : 0,
    };
  }

  private sumEnding(byDate: Map<string, number>, end: string, windowDays: number) {
    let total = 0;
    for (let offset = 0; offset < windowDays; offset += 1) {
      // Every date in the window is visited. A logged 0 and a date with no row both add 0.
      // Dates before the first record are missing, so they add 0 and the window is not shortened.
      // A future end date still returns this trailing sum. Recorded hours on that date count.
      // A future date with no row adds 0. Nothing beyond the file is projected.
      const date = addIsoDays(end, -offset);
      total += byDate.get(date) ?? 0;
    }
    return round1(total);
  }

  private assertRange(from: string, to: string) {
    if (!isRealIsoDate(from) || !isRealIsoDate(to)) {
      throw new BadRequestException('from and to must be real dates in YYYY-MM-DD.');
    }
    if (from > to) throw new BadRequestException('from must be on or before to.');
    const span = (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / 86_400_000;
    if (span > 800) throw new BadRequestException('Date range is too long.');
  }
}
