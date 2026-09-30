// RFC 9457 error body returned by the API for 4xx/5xx
export interface ProblemDetails {
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
}