// Mirrors the API contracts (SRS §13.1-13.2, §13.4)
export interface AllocateRequest {
  documentTypeId: number;
  documentName: string;
  engineerName: string;
  requestKey: string;
}

export interface AllocationResponse {
  allocationId: number;
  documentTypeId: number;
  prefix: string;
  number: number;
  generatedIdentifier: string;
  documentName: string;
  engineerName: string;
  requestKey: string;
  createdAt: string; // ISO-8601 UTC
}

export interface AllocationSummary {
  allocationId: number;
  generatedIdentifier: string;
  documentTypeId: number;
  prefix: string;
  number: number;
  documentName: string;
  engineerName: string;
  createdAt: string;
}