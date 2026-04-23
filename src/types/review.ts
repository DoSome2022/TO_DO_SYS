// src/types/review.ts
export type Version = {
  id: string;
  versionName: string;
  contentUrl: string | null;
  note: string | null;
  reviewStatus: "PENDING" | "APPROVED" | "REJECTED" | "REVISING";
  reviewComment: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  user: {
    name: string | null;
  };
  versionNumber: number;
  isLatest: boolean;
};

export type Deliverable = {
  id: string;
  name: string;
  url: string;
  fileKey: string | null;
  fileSize: number | null;
  createdAt: Date;
};

export type Phase = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  selectedVersions: Version[];
  deliverables: Deliverable[];
};