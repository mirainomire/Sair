import { Global, Module } from '@nestjs/common';
import { PilotDataService } from './pilot-data.service';

@Global()
@Module({
  providers: [PilotDataService],
  exports: [PilotDataService],
})
export class DataModule {}
