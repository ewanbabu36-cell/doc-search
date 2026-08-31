import path from 'node:path';
import { pathToFileURL } from 'node:url';

const neonEntry = pathToFileURL(path.resolve('node_modules/neon/dist/index.js')).href;
import(neonEntry);
