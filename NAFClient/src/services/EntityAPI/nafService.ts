import { api } from "../api";
import type { NAF } from "@/types/api/naf";
import type { PagedResult } from "@/types/common/pagedResult";

export const getSubordinateNAFs = async (
  employee: string,
  page: number,
): Promise<PagedResult<NAF>> => {
  const res = await api.get(`/NAFs/${employee}/subordinates/`, {
    params: { page },
  });
  if (!res.data) {
    return {
      data: [],
      totalCount: 0,
      pageSize: 6,
      currentPage: page ?? 1,
      totalPages: 0,
    };
  }
  console.log(res.data);

  return res.data;
};

export const getApproverNAFs = async (
  employee: string,
  page: number,
): Promise<PagedResult<NAF>> => {
  const res = await api.get(`/NAFs/${employee}/approver`, {
    params: { page },
  });
  if (!res.data) {
    return {
      data: [],
      totalCount: 0,
      pageSize: 6,
      currentPage: page ?? 1,
      totalPages: 0,
    };
  }
  console.log(res.data);

  return res.data;
};

export const getNAF = async (id: string): Promise<NAF> => {
  const data = (await api.get(`/NAFs/${id}`)).data;
  console.log(data);
  return data;
};

export const employeeHasNAF = async (
  employeeId: string,
  departmentId: string,
): Promise<boolean> => {
  return (
    await api.get(`/NAFs/hasNAF/${employeeId}/department/${departmentId}`)
  ).data;
};

export const getEmployeeNAFs = async (employeeId: string): Promise<NAF[]> => {
  return (await api.get(`/NAFs/employee/${employeeId}`)).data;
};

export const createNAF = async (payload: {
  employeeId: string;
  requestorId: string;
  resourceIds: number[];
  dateNeeded?: string | null;
}) => {
  const response = await api.post("/NAFs", payload);
  return response.data;
};

export const deactivateNAF = async (id: string) => {
  return (await api.delete(`/NAFs/${id}`)).data;
};
