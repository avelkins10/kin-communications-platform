export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
  pagination?: { page: number; limit: number; total: number };
}

export function ok<T>(data: T, pagination?: APIResponse<T>["pagination"]): APIResponse<T> {
  return { success: true, data, pagination };
}

export function fail(code: string, message: string, details?: unknown): APIResponse<never> {
  return { success: false, error: { code, message, details } };
}


