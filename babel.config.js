// Babel transforms the app's modern TypeScript/JavaScript into code Expo can run.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
