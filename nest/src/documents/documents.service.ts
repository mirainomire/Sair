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
          const state = daysRemaining <= 0
            ? 'expired'
            : daysRemaining <= 7
              ? 'critical'
              : daysRemaining <= 14
                ? 'urgent'
                : daysRemaining <= 30
                  ? 'soon'
                  : 'safe';
          return {
            id: row.id,
            label: row.label,
            expiryDate: row.expiryDate,
            daysRemaining,
            state,
          };
        }).sort((a, b) => {
          const priority: Record<string, number> = { expired: 0, critical: 1, urgent: 2, soon: 3, safe: 4 };
          return priority[a.state] - priority[b.state] || a.daysRemaining - b.daysRemaining;
        }),
      },
    };
  }
}
