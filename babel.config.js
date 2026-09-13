/**
 * Expo's default preset, plus one transform.
 *
 * There was no babel config here before: Expo supplies `babel-preset-expo`
 * on its own. This file exists only to add the static-class-block transform,
 * which `@formatjs/intl-pluralrules` needs. Without it Babel refuses to parse
 * that package ("Static class blocks are not enabled"), and the plural polyfill
 * cannot be loaded under Jest.
 */
module.exports = function babelConfig(api) {
    api.cache(true);

    return {
        presets: ['babel-preset-expo'],
        plugins: ['@babel/plugin-transform-class-static-block'],
    };
};
