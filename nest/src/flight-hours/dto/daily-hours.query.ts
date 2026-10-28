import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class DailyHoursQueryDto {
  @ApiProperty({ example: '2026-05-14', description: 'First day, YYYY-MM-DD.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'from must be YYYY-MM-DD' })
  from!: string;

  @ApiProperty({ example: '2026-05-16', description: 'Last day, YYYY-MM-DD. Must be on or after from.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'to must be YYYY-MM-DD' })
  to!: string;
}
