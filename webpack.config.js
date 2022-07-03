const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',

  entry: {
    main: './src/main.ts',
  },

  output: {
    filename: '[name].js',
  },

  resolve: {
    extensions: ['.js', '.ts'],
  },

  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loader: 'ts-loader' },
    ],
  },

  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: 'public/' }, { from: 'data/graphics/*.png' }],
    }),
  ],
};
