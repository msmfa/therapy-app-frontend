const expoPreset = require('jest-expo/jest-preset');

module.exports = {
  ...expoPreset,
  moduleNameMapper: {
    ...(expoPreset.moduleNameMapper ?? {}),
    '^designs/(.*)$': '<rootDir>/designs/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: [
    require.resolve('./jest.polyfills.js'),
    ...((expoPreset.setupFiles ?? []).filter((entry, index, array) => array.indexOf(entry) === index)),
  ],
  setupFilesAfterEnv: [
    ...((expoPreset.setupFilesAfterEnv ?? [])),
    '<rootDir>/jest.setup.js',
  ],
  // @noble/ciphers ships ES modules. Metro handles that natively, but Jest
  // skips node_modules unless the package is added to the preset's allowlist.
  transformIgnorePatterns: (expoPreset.transformIgnorePatterns ?? []).map((pattern) =>
    pattern.startsWith('/node_modules/(?!(')
      ? pattern.replace('/node_modules/(?!(', '/node_modules/(?!(@noble|')
      : pattern,
  ),
};
