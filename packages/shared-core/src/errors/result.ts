import { AppError } from './app-error.js';

export type Result<T, E = AppError> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: E };

export const Result = {
  ok<T>(data: T): Result<T, never> {
    return { success: true, data };
  },
  err<E = AppError>(error: E): Result<never, E> {
    return { success: false, error };
  }
};
