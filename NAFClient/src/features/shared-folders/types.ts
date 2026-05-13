export interface SharedFolderDTO {
  id: number;
  name: string;
  ownerName: string | null;
  ownerId: string | null;
  isActive: boolean;
}

export interface SharedFolderAccessEntryDTO {
  employeeName: string;
  position: string;
  progress: string;
  dateRequested: string;
}

export interface PagedAccessList {
  data: SharedFolderAccessEntryDTO[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

export interface SharedFolderDetailDTO extends SharedFolderDTO {
  accessList: PagedAccessList;
}

export interface SharedFolderWriteDTO {
  name: string;
  ownerId: string | null;
}
