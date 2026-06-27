module.exports = {
  presets: ['@react-native/babel-preset'],
  plugins: [
    ['module-resolver', { root: ['.'], alias: { '@': '.' } }],
    'react-native-reanimated/plugin',
  ],
};
