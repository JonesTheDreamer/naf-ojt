import { api } from "../api";
import type {
  InternetPurposeItem,
  InternetResourceItem,
  GroupEmailItem,
  SharedFolderItem,
  AddBasicResourceResult,
} from "@/shared/types/api/naf";

export const getInternetPurposes = async (): Promise<InternetPurposeItem[]> => {
  return (await api.get("/InternetPurposes")).data;
};

export const getInternetResources = async (): Promise<InternetResourceItem[]> => {
  return (await api.get("/InternetResources")).data;
};

export const getGroupEmails = async (): Promise<GroupEmailItem[]> => {
  return (await api.get("/GroupEmails")).data;
};

export const getSharedFolders = async (): Promise<SharedFolderItem[]> => {
  return (await api.get("/SharedFolders")).data;
};

export const createInternetPurpose = async (
  name: string,
  description: string,
): Promise<InternetPurposeItem> => {
  return (await api.post("/InternetPurposes", { name, description })).data;
};

export const createInternetResource = async (
  name: string,
  url: string,
  description: string | null,
  purposeId: number,
): Promise<InternetResourceItem> => {
  return (await api.post("/InternetResources", { name, url, description, purposeId })).data;
};

export const addBasicResourcesToNAF = async (
  nafId: string,
  resources: { id: number; dateNeeded: string }[],
): Promise<AddBasicResourceResult[]> => {
  return (await api.post(`/NAFs/${nafId}/resources/basic`, {
    resources: resources.map((r) => ({
      resourceId: r.id,
      dateNeeded: r.dateNeeded || null,
    })),
  })).data;
};
