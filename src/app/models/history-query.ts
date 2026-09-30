// SRS §13.3; unset filters are not sent
export interface HistoryQuery {
  documentTypeId?: number;
  engineer?: string;
  identifier?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}