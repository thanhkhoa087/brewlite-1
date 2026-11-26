const path = require('path');
const { spawnSync } = require('child_process');

const apiDir = path.resolve(__dirname, '../../apps/api');
const apiNodeModules = path.join(apiDir, 'node_modules');
const jestBin = path.join(apiNodeModules, 'jest', 'bin', 'jest.js');
const configPath = path.join(__dirname, 'jest.config.js');

const result = spawnSync(process.execPath, [jestBin, '--config', configPath, '--runInBand'], {
  cwd: apiDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_PATH: apiNodeModules,
  },
});

process.exit(result.status ?? 1);
