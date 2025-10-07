const expoPreset = require('jest-expo/jest-preset');

module.exports = {
  ...expoPreset,
  setupFiles: [
    require.resolve('./jest.polyfills.js'),
    ...((expoPreset.setupFiles ?? []).filter((entry, index, array) => array.indexOf(entry) === index)),
  ],
  setupFilesAfterEnv: [
    ...((expoPreset.setupFilesAfterEnv ?? [])),
    '<rootDir>/jest.setup.js',
  ],
};
