export enum ReviewVerdict {
  CONFIRMED = 'CONFIRMED',
  REFUTED = 'REFUTED',
  PENDING = 'PENDING',
}

export interface ReviewRecordDto {
  id: string
  nodeId: string
  reviewedAt: string
  verdict: ReviewVerdict
  evidenceSummary: string
  weightBefore: number
  weightAfter: number
}
