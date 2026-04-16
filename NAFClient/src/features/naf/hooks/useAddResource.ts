import { useQueryClient } from "@tanstack/react-query";
import {
  addBasicResourcesToNAF,
  createInternetPurpose,
  createInternetResource,
} from "@/services/EntityAPI/resourceMetadataService";
import { createResourceRequest } from "@/services/EntityAPI/resourceRequestService";
import { toast } from "sonner";

export type InternetEntry = {
  _id: string;
  internetPurposeId: number | null;
  internetResourceId: number | null;
  purpose: string;
  dateNeeded: string;
  // "Other" mode — user is creating a new purpose + resource
  isOther: boolean;
  newPurposeName: string;
  newPurposeDescription: string;
  newResourceName: string;
  newResourceUrl: string;
  newResourceDescription: string;
};

export type GroupEmailEntry = {
  _id: string;
  groupEmailId: number | null;
  purpose: string;
  dateNeeded: string;
};

export type SharedFolderEntry = {
  _id: string;
  sharedFolderId: number | null;
  purpose: string;
  dateNeeded: string;
};

export type BasicResourceWithDate = {
  id: number;
  dateNeeded: string;
};

type AddResourcesParams = {
  nafId: string;
  basicResources: BasicResourceWithDate[];
  internetEntries: InternetEntry[];
  groupEmailEntries: GroupEmailEntry[];
  sharedFolderEntries: SharedFolderEntry[];
};

export type AddResult = {
  errors: string[];
  allSucceeded: boolean;
};

export const useAddResource = () => {
  const queryClient = useQueryClient();

  const submit = async (params: AddResourcesParams): Promise<AddResult> => {
    const errors: string[] = [];
    let anySuccess = false;

    // ── Basic resources ───────────────────────────────────────────────────────
    if (params.basicResources.length > 0) {
      try {
        const results = await addBasicResourcesToNAF(
          params.nafId,
          params.basicResources,
        );
        results.forEach((r) => {
          if (r.success) {
            anySuccess = true;
          } else {
            errors.push(`Resource ${r.resourceId}: ${r.error ?? "Failed"}`);
          }
        });
      } catch (e: any) {
        errors.push(`Basic resources: ${e.message ?? "Unknown error"}`);
      }
    }

    // ── Special resources (fired sequentially for "other" entries, parallel otherwise) ──
    const specialTasks: Promise<void>[] = [];

    params.internetEntries.forEach((entry) => {
      specialTasks.push(
        (async () => {
          try {
            let resourceId = entry.internetResourceId;

            if (entry.isOther) {
              const newPurpose = await createInternetPurpose(
                entry.newPurposeName,
                entry.newPurposeDescription,
              );
              const newResource = await createInternetResource(
                entry.newResourceName,
                entry.newResourceUrl,
                entry.newResourceDescription || null,
                newPurpose.id,
              );
              resourceId = newResource.id;
              queryClient.invalidateQueries({ queryKey: ["internetPurposes"] });
              queryClient.invalidateQueries({ queryKey: ["internetResources"] });
            }

            await createResourceRequest({
              nafId: params.nafId,
              resourceId: 1,
              purpose: entry.purpose,
              additionalInfo: { InternetResourceId: resourceId! },
              dateNeeded: entry.dateNeeded || null,
            });
            anySuccess = true;
          } catch (e: any) {
            const msg = e?.response?.data ?? e?.message ?? "Unknown error";
            errors.push(`Internet resource: ${msg}`);
          }
        })(),
      );
    });

    params.groupEmailEntries.forEach((entry) => {
      specialTasks.push(
        createResourceRequest({
          nafId: params.nafId,
          resourceId: 2,
          purpose: entry.purpose,
          additionalInfo: { GroupEmailId: entry.groupEmailId! },
          dateNeeded: entry.dateNeeded || null,
        })
          .then(() => {
            anySuccess = true;
          })
          .catch((e: any) => {
            const msg = e?.response?.data ?? e?.message ?? "Unknown error";
            errors.push(`Group email: ${msg}`);
          }),
      );
    });

    params.sharedFolderEntries.forEach((entry) => {
      specialTasks.push(
        createResourceRequest({
          nafId: params.nafId,
          resourceId: 3,
          purpose: entry.purpose,
          additionalInfo: { SharedFolderId: entry.sharedFolderId! },
          dateNeeded: entry.dateNeeded || null,
        })
          .then(() => {
            anySuccess = true;
          })
          .catch((e: any) => {
            const msg = e?.response?.data ?? e?.message ?? "Unknown error";
            errors.push(`Shared folder: ${msg}`);
          }),
      );
    });

    await Promise.all(specialTasks);

    if (anySuccess) {
      queryClient.invalidateQueries({ queryKey: ["naf", params.nafId] });
      queryClient.invalidateQueries({ queryKey: ["subordinateNAFs"] });
      queryClient.invalidateQueries({ queryKey: ["approverNAFs"] });
    }

    const result = { errors, allSucceeded: errors.length === 0 };

    if (result.allSucceeded) {
      toast.success("Resources added successfully");
    } else if (anySuccess) {
      toast.warning("Some resources could not be added");
    } else {
      toast.error("Failed to add resources");
    }

    return result;
  };

  return { submit };
};
