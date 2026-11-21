export const randomUUID = (): string =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : '00000000-0000-0000-0000-000000000000';

export const createHash = (): { update: () => { digest: () => string } } => ({
  update: () => ({
    digest: () => '0000000000000000000000000000000000000000000000000000000000000000'
  })
});

export default { randomUUID, createHash };
