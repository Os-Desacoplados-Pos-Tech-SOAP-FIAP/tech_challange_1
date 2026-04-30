import type { Config } from 'jest';

const moduleNameMapper = {
  '^@domain/(.*)$': '<rootDir>/src/domain/$1',
  '^@application/(.*)$': '<rootDir>/src/application/$1',
  '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
  '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  '^@common/(.*)$': '<rootDir>/src/common/$1',
};

const transform = {
  '^.+\\.(t|j)s$': 'ts-jest',
};

const config: Config = {
  rootDir: '.',
  collectCoverageFrom: [
    'src/domain/**/*.(t|j)s',
    'src/application/**/*.(t|j)s',
    '!src/**/*.spec.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageDirectory: './coverage',
  projects: [
    {
      displayName: 'unit',
      rootDir: '.',
      testEnvironment: 'node',
      moduleFileExtensions: ['js', 'json', 'ts'],
      testRegex: '.*\\.spec\\.ts$',
      transform,
      moduleNameMapper,
    },
    {
      displayName: 'e2e',
      rootDir: '.',
      testEnvironment: 'node',
      moduleFileExtensions: ['js', 'json', 'ts'],
      testRegex: '.*\\.e2e-spec\\.ts$',
      transform,
      moduleNameMapper,
    },
  ],
};

export default config;
