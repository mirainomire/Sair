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
        crewId: this.data.account.crewId,
        aircraftRatings: this.data.account.aircraftRatings,
        email: this.data.account.email,
        mobile: this.data.account.mobile,
        operationsContacts: this.data.account.operationsContacts,
        scheduleToday: this.data.scheduleToday,
        lastSyncedAt: this.data.lastSyncedAt,
      },
    };
  }
}
