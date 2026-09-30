import type { AuthenticatedUserRecord } from './RealAuthService.js';

export interface SystemStaffPreset {
  email: string;
  password: string;
  record: Omit<AuthenticatedUserRecord, 'passwordHash'>;
}

// Day-0 Clean Slate: Zero hardcoded client presets. Genuine users authenticate via database records or partner credentials.
export const SYSTEM_STAFF_PRESETS: Map<string, SystemStaffPreset> = new Map();
