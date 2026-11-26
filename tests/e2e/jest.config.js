const path = require('path');

const apiNodeModules = path.resolve(__dirname, '../../apps/api/node_modules');

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: __dirname,
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      path.join(apiNodeModules, 'ts-jest'),
      {
        tsconfig: {
          module: 'commonjs',
          target: 'ES2021',
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          esModuleInterop: true,
          skipLibCheck: true,
          baseUrl: '.',
          paths: {
            '*': [path.join(apiNodeModules, '*')],
          },
        },
      },
    ],
  },
  moduleDirectories: ['node_modules', apiNodeModules],
};
