import { IsIn } from 'class-validator';

export const SUMMARY_RANGES = ['1w', '1m', '3m', '6m', '1y'] as const;
export type SummaryRange = (typeof SUMMARY_RANGES)[number];

export class SummaryQueryDto {
  @IsIn(SUMMARY_RANGES, { message: 'range must be one of 1w, 1m, 3m, 6m, 1y' })
  range!: SummaryRange;
}
