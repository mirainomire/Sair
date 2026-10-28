import { Injectable, OnModuleInit } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { isRealIsoDate } from '../common/dates';

export type FlightDay = { date: string; hours: number };

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
  readonly account = {
    username: 'johndoe',
    password: 'susiairtest',
    rank: 'Captain',
    homeBase: 'MKW',
    avatarUrl: '/brand/pilot-avatar.png',
  };

  private flightFile!: FlightFile;
  private documentFile!: DocumentFile;
  private scheduleFile!: ScheduleFile;

  onModuleInit() {
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
