import {
  getInternetPurposes,
  getInternetResources,
  getGroupEmails,
  getSharedFolders,
} from "@/services/EntityAPI/resourceMetadataService";
import { getAllResources } from "@/services/EntityAPI/resourceService";
import type {
  InternetPurposeItem,
  InternetResourceItem,
  GroupEmailItem,
  SharedFolderItem,
  Resource,
} from "@/types/api/naf";
import { useQuery } from "@tanstack/react-query";

const STALE_24H = 24 * 60 * 60 * 1000;

export const useResource = () => {
  const getAllResource = useQuery<Resource[], Error>({
    queryKey: ["allResources"],
    queryFn: () => getAllResources(),
    staleTime: STALE_24H,
  });

  return {
    getAllResource,
    isLoading: getAllResource.isLoading,
    isError: getAllResource.isError,
  };
};

export const useResourceMetadata = () => {
  const internetPurposes = useQuery<InternetPurposeItem[], Error>({
    queryKey: ["internetPurposes"],
    queryFn: getInternetPurposes,
    staleTime: STALE_24H,
  });

  const internetResources = useQuery<InternetResourceItem[], Error>({
    queryKey: ["internetResources"],
    queryFn: getInternetResources,
    staleTime: STALE_24H,
  });

  const groupEmails = useQuery<GroupEmailItem[], Error>({
    queryKey: ["groupEmails"],
    queryFn: getGroupEmails,
    staleTime: STALE_24H,
  });

  const sharedFolders = useQuery<SharedFolderItem[], Error>({
    queryKey: ["sharedFolders"],
    queryFn: getSharedFolders,
    staleTime: STALE_24H,
  });

  return {
    internetPurposes,
    internetResources,
    groupEmails,
    sharedFolders,
    isLoading:
      internetPurposes.isLoading ||
      internetResources.isLoading ||
      groupEmails.isLoading ||
      sharedFolders.isLoading,
  };
};
