import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import { AuthModule } from './auth/auth.module';
import { DataModule } from './data/data.module';
import { DocumentsModule } from './documents/documents.module';
import { FlightHoursModule } from './flight-hours/flight-hours.module';
import { PilotModule } from './pilot/pilot.module';
import { SchedulesModule } from './schedules/schedules.module';

@Module({
  imports: [DataModule, AuthModule, PilotModule, FlightHoursModule, DocumentsModule, SchedulesModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
