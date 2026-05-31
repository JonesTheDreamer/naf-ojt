export interface ForSocReviewItem {
  resourceRequestId: string;
  nafId: string;
  nafReference: string;
  employeeName: string;
  resourceName: string;
  dateNeeded: string | null;
  currentStepId: string;
  stepClaimedBy: string | null;
}
