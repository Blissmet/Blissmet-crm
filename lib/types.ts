import type { ClientRow, DocumentRow } from "@/types/database";

export type ClientWithPhoto = ClientRow & {
  photoSignedUrl: string | null;
};

export type RecentDocument = Pick<
  DocumentRow,
  "id" | "client_id" | "doc_type" | "file_name" | "uploaded_at"
> & {
  clients: {
    first_name: string;
    last_name: string;
    client_id: string;
  } | null;
};

export type ClientSort =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc";

export type ClientListFilters = {
  q: string;
  status: "Active" | "Inactive" | "";
  sort: ClientSort;
  page: number;
};
