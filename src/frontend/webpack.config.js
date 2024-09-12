const webpack = require('webpack');
const path = require('path');
const Dotenv = require('dotenv-webpack');

const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

const BUILD_DIR = path.resolve(__dirname, 'dist');
const APP_DIR = path.resolve(__dirname, '');

module.exports = (env, argv) => {
  const mode = argv.mode || 'production';
  return {
    devtool: 'source-map',
    entry: `${APP_DIR}/index.tsx`,
    output: {
      path: BUILD_DIR,
      publicPath: './',
      filename: './reflect-bundle.js',
    },
    resolve: {
      fallback: {
        assert: require.resolve('assert'),
        buffer: require.resolve('buffer'),
        crypto: require.resolve('crypto-browserify'),
        process: 'process/browser',
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util'),
      },
      extensions: ['.ts', '.js', '.jsx', '.tsx']
    },
    module: {
      rules: [
        {
          test: /\.ts|.js|.tsx$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'ts-loader'
          }
        },
        { test: /(\.css$)/, use: ['style-loader', 'css-loader'] },
        {
          test: /\.scss$/,
          use: ['style-loader', 'css-loader', 'sass-loader']
        },
        {
          test: /.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
          use: 'url-loader?limit=100000'
        }
      ]
    },
    plugins: [
      new MomentLocalesPlugin(),
      new ESLintPlugin(),
      new Dotenv({
        systemvars: true
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(mode)
      }),
      new webpack.DefinePlugin({
        'process.env.BUILD_BUILDNUMBER': JSON.stringify(process.env.BUILD_BUILDNUMBER)
      }),
    ]
  };
}
