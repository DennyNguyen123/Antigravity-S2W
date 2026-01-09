const path = require('path');

/** @type {import('webpack').Configuration} */
const config = {
  target: 'node', 
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    library: {
      type: 'commonjs',
    },
    clean: true,
  },
  devtool: 'nosources-source-map',
  externals: {
    'vscode': 'commonjs vscode', 
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
    ],
  },
  plugins: [],
};

module.exports = config;
