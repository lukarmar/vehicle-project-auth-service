module.exports = {
  preset: 'ts-jest',
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
    '<rootDir>/src/application/interfaces/',
    '<rootDir>/src/domain/repositories/',
  ],
  coverageDirectory: "coverage",
  testEnvironment: "node",
  coverageProvider: "v8",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@domain/(.*)$": "<rootDir>/src/domain/$1",
    "^@application/(.*)$": "<rootDir>/src/application/$1",
    "^@infrastructure/(.*)$": "<rootDir>/src/infrastructure/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1"
  },
  clearMocks: true,
};