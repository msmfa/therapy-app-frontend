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
  // Git worktrees are created inside the repo, under .claude/worktrees/, so
  // Jest walks into them and runs another branch's tests against this branch's
  // source, reporting failures that have nothing to do with the working tree.
  // Ignored for module resolution too, otherwise every file duplicated in a
  // worktree shows up as a haste collision.
  testPathIgnorePatterns: [
    ...(expoPreset.testPathIgnorePatterns ?? ['/node_modules/']),
    '/\\.claude/worktrees/',
  ],
  modulePathIgnorePatterns: [
    ...(expoPreset.modulePathIgnorePatterns ?? []),
    '<rootDir>/\\.claude/worktrees/',
  ],
  // @noble/ciphers ships ES modules. Metro handles that natively, but Jest
  // skips node_modules unless the package is added to the preset's allowlist.
  transformIgnorePatterns: (expoPreset.transformIgnorePatterns ?? []).map((pattern) =>
    pattern.startsWith('/node_modules/(?!(')
      ? pattern.replace('/node_modules/(?!(', '/node_modules/(?!(@noble|')
      : pattern,
  ),
};
