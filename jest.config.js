module.exports = {
  roots: ["<rootDir>/src"],
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": "babel-jest",
  },
  setupFilesAfterEnv: ["<rootDir>/src/components/__tests__/setupTests.js"],
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(tsx?)$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  transformIgnorePatterns: [
    "node_modules/(?!(d3|d3-array|d3-scale|d3-interpolate|d3-color|d3-format|d3-time|d3-time-format|d3-shape|internmap)/)",
  ],
  moduleNameMapper: {
    d3: "<rootDir>/node_modules/d3/dist/d3.min.js",
    "d3-array": "<rootDir>/node_modules/d3-array/dist/d3-array.min.js",
    "d3-scale": "<rootDir>/node_modules/d3-scale/dist/d3-scale.min.js",
  },
  testTimeout: 15000,
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/components/**/*.{ts,tsx}",
    "!src/components/**/*.d.ts",
    "!src/components/**/__tests__/**",
  ],
  verbose: true,
  testPathIgnorePatterns: ["<rootDir>/src/components/__tests__/setupTests.js"],
};
