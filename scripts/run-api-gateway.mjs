process.env.DATABASE_URL = 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
process.env.NODE_ENV = 'development';
process.env.ALLOW_EMBEDDED_POSTGRES = 'false';

import('../apps/api-gateway/dist/server.js').catch(err => {
  console.error('Fatal API Gateway error:', err);
  process.exit(1);
});
