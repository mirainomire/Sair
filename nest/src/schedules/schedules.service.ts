import { Injectable } from '@nestjs/common';
import { PilotDataService } from '../data/pilot-data.service';

@Injectable()
export class SchedulesService {
  constructor(private readonly data: PilotDataService) {}

  month(year: number, month: number) {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    const entries = this.data.schedules
      .filter((row) => row.duty_date.startsWith(`${key}-`))
      .map((row) => ({
        id: row.id,
        date: row.duty_date,
        status: row.status,
        baseName: row.base_name,
        baseColor: row.base_color,
        dutyType: row.duty_type,
        countSchedules: row.count_schedules,
        countLogbooks: row.count_logbooks,
        logged: row.count_logbooks === row.count_schedules,
      }));

    return {
      data: {
        year,
        month,
        today: this.data.scheduleToday,
        legend: this.data.legend,
        entries,
      },
    };
  }
}
