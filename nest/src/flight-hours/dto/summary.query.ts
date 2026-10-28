import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const SUMMARY_RANGES = ['1w', '1m', '3m', '6m', '1y'] as const;
export type SummaryRange = (typeof SUMMARY_RANGES)[number];

export class SummaryQueryDto {
  @ApiProperty({ example: '1w', enum: SUMMARY_RANGES, description: 'Chart window. 1w is the default in the app.' })
  @IsIn(SUMMARY_RANGES, { message: 'range must be one of 1w, 1m, 3m, 6m, 1y' })
  range!: SummaryRange;
}
