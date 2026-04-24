import { api } from "../api";
import type { Resource, ResourceGroup } from "@/shared/types/api/naf";

export const getAllResources = async (): Promise<Resource[]> => {
  try {
    return (await api.get(`/resources`)).data;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const getResource = async (
  resourceId: number,
): Promise<Resource | null> => {
  try {
    return (await api.get(`/resources/${resourceId}`)).data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const getResourceGroups = async (): Promise<ResourceGroup[]> => {
  try {
    return (await api.get(`/ResourceGroups`)).data;
  } catch (error) {
    console.log(error);
    return [];
  }
};
