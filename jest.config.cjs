module.exports = {
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transformIgnorePatterns: []
};
