export interface QBRecord {
  rid?: number;
  [fid: `fid_${number}`]: unknown;
}

export interface QBQueryRequest {
  from: string; // table id
  select: number[]; // fids
  where?: string;
  sortBy?: { fieldId: number; order: "ASC" | "DESC" }[];
  options?: { skip?: number; top?: number };
}

export interface QBQueryResponse {
  data: QBRecord[];
  fields: { id: number; label: string }[];
}


