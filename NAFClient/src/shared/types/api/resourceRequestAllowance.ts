export type ResourceRequestAllowance = {
  id: number;
  resourceId: number;
  resourceName: string;
  locationId: number;
  locationName: string;
  allowanceDays: number;
};

export type CreateResourceRequestAllowanceDTO = {
  resourceId: number;
  locationId: number;
  allowanceDays: number;
};

export type UpdateResourceRequestAllowanceDTO = {
  allowanceDays: number;
};
