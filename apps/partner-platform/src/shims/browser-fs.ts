/**
 * Browser-compatible shim for Node.js fs module in Vite client builds.
 * Prevents "Module node:fs has been externalized" warnings and provides safe no-ops.
 */

export const existsSync = (): boolean => false;
export const mkdirSync = (): void => {};
export const readFileSync = (): string => '';
export const writeFileSync = (): void => {};
export const readdirSync = (): string[] => [];
export const unlinkSync = (): void => {};
export const statSync = (): { isDirectory: () => boolean; isFile: () => boolean } => ({
  isDirectory: () => false,
  isFile: () => false
});

export default {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  unlinkSync,
  statSync
};
