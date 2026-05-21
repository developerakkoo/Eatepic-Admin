import { HttpErrorResponse } from '@angular/common/http';

export function messageFromApiError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error;
    if (body && typeof body === 'object' && 'message' in body) {
      return String((body as { message: string }).message);
    }
    if (error.status === 0) return 'Network error. Check your connection.';
    return error.message || 'Request failed';
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
