module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/config/**',
    '!src/server.ts',
    '!src/types/**',
  ],
  coverageDirectory: 'coverage',
  clearMocks: true,
  restoreMocks: true,
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2022',
          module: 'commonjs',
          esModuleInterop: true,
          skipLibCheck: true,
          types: ['node', 'jest'],
        },
      },
    ],
  },
};
