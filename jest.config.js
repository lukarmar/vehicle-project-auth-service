module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  modulePaths: ['<rootDir>/src/'],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: ["<rootDir>/src/application/**/*.ts", "<rootDir>/src/domain/**/*.ts"],
  coveragePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/node_modules/',
    '<rootDir>/src/application/dtos/',
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@domain/(.*)$": "<rootDir>/src/domain/$1",
    "^@application/(.*)$": "<rootDir>/src/application/$1",
    "^@infrastructure/(.*)$": "<rootDir>/src/infrastructure/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1"
  },
  clearMocks: true,
};