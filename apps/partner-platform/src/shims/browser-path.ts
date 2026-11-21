export const join = (...args: string[]): string => args.filter(Boolean).join('/').replace(/\/+/g, '/');
export const resolve = (...args: string[]): string => '/' + args.filter(Boolean).join('/').replace(/\/+/g, '/');
export default { join, resolve };
