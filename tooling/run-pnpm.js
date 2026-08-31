const workerThreads = require('worker_threads');
const OrigWorker = workerThreads.Worker;

class PatchedWorker extends OrigWorker {
  constructor(filename, options = {}) {
    const patchedOptions = {
      ...options,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        ...(options.env || {})
      }
    };
    super(filename, patchedOptions);
  }
}

workerThreads.Worker = PatchedWorker;

require('./pnpm.cjs');
