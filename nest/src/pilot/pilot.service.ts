import { Injectable } from '@nestjs/common';
import { PilotDataService } from '../data/pilot-data.service';

@Injectable()
export class PilotService {
  constructor(private readonly data: PilotDataService) {}

  me() {
    return {
      data: {
        name: this.data.pilotName,
        username: this.data.account.username,
        totalFlightHours: this.data.totalFlightHours,
        avatarUrl: this.data.account.avatarUrl,
        rank: this.data.account.rank,
        homeBase: this.data.account.homeBase,
        scheduleToday: this.data.scheduleToday,
      },
    };
  }
}
