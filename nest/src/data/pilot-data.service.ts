import { Injectable, OnModuleInit } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { isRealIsoDate } from '../common/dates';

export type FlightDay = { date: string; hours: number };
export type OperationsContact = { phone: string; whatsapp: string; hours: string };

export type ChartBound = {
  limit: number;
  max: number;
  windowDays: number;
  displayRangeDays: number;
};

export type DutyLimits = {
  daily: number;
  weekly: number;
  monthly: number;
  annual: number;
};

type FlightFile = {
  pilot: { name: string; totalFlightHours: number };
  limits: DutyLimits;
  chartBounds: Record<string, ChartBound>;
  flightHours: FlightDay[];
};

type DocumentFile = {
  today: string;
  thresholds: { warningDays: number };
  documents: { id: string; label: string; expiryDate: string }[];
};

type ScheduleRow = {
  id: string;
  duty_date: string;
  status: number;
  base_name: string;
  base_color: string;
  duty_type: string;
  count_schedules: number;
  count_logbooks: number;
};

type ScheduleFile = {
  today: string;
  legend: { code: string; label: string; color: string }[];
  schedules: ScheduleRow[];
};

@Injectable()
export class PilotDataService implements OnModuleInit {
  // This is the sample-data boundary. Feature services consume typed getters
  // instead of reading JSON files or knowing where the files are stored.
  readonly account = {
    username: 'johndoe',
    password: 'susiairtest',
    rank: 'Captain',
    homeBase: 'MKW',
    avatarUrl: '/brand/pilot-avatar.png',
    crewId: 'SA-DEMO-0421',
    aircraftRatings: ['C208B', 'DHC-6 Twin Otter'] as string[],
    email: 'john.doe@susiair.example',
    mobile: '+628111234567',
    operationsContacts: {
      crewScheduling: { phone: '+628111234568', whatsapp: '628111234568', hours: '06:00–22:00 WIB daily' } as OperationsContact,
      occ: { phone: '+628111234569', whatsapp: '628111234569', hours: '24/7 operational support' } as OperationsContact,
    },
  };

  private flightFile!: FlightFile;
  private documentFile!: DocumentFile;
  private scheduleFile!: ScheduleFile;
  private loadedAt = '';

  onModuleInit() {
    this.loadedAt = new Date().toISOString();
    const dir = this.dataDir();
    this.flightFile = this.read<FlightFile>(dir, 'mock-flight-hours.json');
    this.documentFile = this.read<DocumentFile>(dir, 'mock-documents.json');
    this.scheduleFile = this.read<ScheduleFile>(dir, 'mock-schedules.json');
    this.flightFile.flightHours = [...this.flightFile.flightHours].sort((a, b) => a.date.localeCompare(b.date));
  }

  get pilotName() {
    return this.flightFile.pilot.name;
  }

  get totalFlightHours() {
    return this.flightFile.pilot.totalFlightHours;
  }

  get limits() {
    return this.flightFile.limits;
  }

  get chartBounds() {
    return this.flightFile.chartBounds;
  }

  get flightDays() {
    return this.flightFile.flightHours;
  }

  get sampleToday() {
    const configured = process.env.SAMPLE_TODAY?.trim();
    if (configured && isRealIsoDate(configured)) return configured;
    return '2026-05-15';
  }

  get documentsToday() {
    return this.sampleToday;
  }

  get warningDays() {
    return this.documentFile.thresholds.warningDays;
  }

  get documents() {
    return this.documentFile.documents;
  }

  get scheduleToday() {
    return this.sampleToday;
  }

  get lastSyncedAt() {
    return this.loadedAt;
  }

  get legend() {
    return this.scheduleFile.legend;
  }

  get schedules() {
    return this.scheduleFile.schedules;
  }

  private dataDir() {
    const candidates = [join(process.cwd(), 'data'), join(process.cwd(), 'nest', 'data')];
    const found = candidates.find((dir) => existsSync(join(dir, 'mock-flight-hours.json')));
    if (!found) throw new Error('Pilot sample JSON was not found.');
    return found;
  }

  private read<T>(dir: string, file: string) {
    return JSON.parse(readFileSync(join(dir, file), 'utf8')) as T;
  }
}
