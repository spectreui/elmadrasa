module.exports = function (api) {
  api.cache(true);

  return {
    presets: [['babel-preset-expo'], 'nativewind/babel'],
    plugins: [
      ['module-resolver', {
        root: ['./'],
        alias: {
          "~": "./src",
          'tailwind.config': './tailwind.config.js',
        },
      }],
      'react-native-worklets/plugin',
    ],
    env: {
      production: {
        plugins: ["transform-remove-console"],     //removing consoles.log from app during release (production) versions
      },
    }
  };
};