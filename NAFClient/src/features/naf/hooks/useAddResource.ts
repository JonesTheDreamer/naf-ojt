import { useQueryClient } from "@tanstack/react-query";
import {
  addBasicResourcesToNAF,
} from "@/services/EntityAPI/resourceMetadataService";
import { createResourceRequest } from "@/services/EntityAPI/resourceRequestService";

export type InternetEntry = {
  _id: string;
  internetPurposeId: number | null;
  internetResourceId: number | null;
  purpose: string;
};

export type GroupEmailEntry = {
  _id: string;
  groupEmailId: number | null;
  purpose: string;
};

export type SharedFolderEntry = {
  _id: string;
  sharedFolderId: number | null;
  purpose: string;
};

type AddResourcesParams = {
  nafId: string;
  basicResourceIds: number[];
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
    if (params.basicResourceIds.length > 0) {
      try {
        const results = await addBasicResourcesToNAF(
          params.nafId,
          params.basicResourceIds,
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

    // ── Special resources (fired in parallel, non-blocking per item) ──────────
    const specialTasks: Promise<void>[] = [];

    params.internetEntries.forEach((entry) => {
      specialTasks.push(
        createResourceRequest({
          nafId: params.nafId,
          resourceId: 1,
          purpose: entry.purpose,
          additionalInfo: { InternetResourceId: entry.internetResourceId! },
        })
          .then(() => {
            anySuccess = true;
          })
          .catch((e: any) => {
            const msg = e?.response?.data ?? e?.message ?? "Unknown error";
            errors.push(`Internet resource: ${msg}`);
          }),
      );
    });

    params.groupEmailEntries.forEach((entry) => {
      specialTasks.push(
        createResourceRequest({
          nafId: params.nafId,
          resourceId: 2,
          purpose: entry.purpose,
          additionalInfo: { GroupEmailId: entry.groupEmailId! },
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
    }

    return { errors, allSucceeded: errors.length === 0 };
  };

  return { submit };
};
