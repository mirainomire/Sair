import { Injectable } from '@nestjs/common';
import { dayDiff } from '../common/dates';
import { PilotDataService } from '../data/pilot-data.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly data: PilotDataService) {}

  list() {
    const today = this.data.documentsToday;
    const warningDays = this.data.warningDays;
    return {
      data: {
        referenceDate: today,
        warningDays,
        documents: this.data.documents.map((row) => {
          const daysRemaining = dayDiff(today, row.expiryDate);
          const state = daysRemaining <= 0 ? 'expired' : daysRemaining <= warningDays ? 'soon' : 'safe';
          return {
            id: row.id,
            label: row.label,
            expiryDate: row.expiryDate,
            daysRemaining,
            state,
          };
        }),
      },
    };
  }
}
