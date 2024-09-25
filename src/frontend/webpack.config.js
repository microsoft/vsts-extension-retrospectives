const webpack = require('webpack');
const path = require('path');
const Dotenv = require('dotenv-webpack');

const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

const CompressionPlugin = require('compression-webpack-plugin');

const BUILD_DIR = path.resolve(__dirname, 'dist');
const APP_DIR = path.resolve(__dirname, '');

module.exports = (env, argv) => {
  const mode = argv.mode || 'production';
  const isProd = mode === 'production';

  return {
    devtool: isProd ? false : 'source-map',
    entry: `${APP_DIR}/index.tsx`,
    output: {
      path: BUILD_DIR,
      publicPath: './',
      filename: './reflect-bundle.js',
      clean: true,
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
          type: "asset",
          parser: {
            dataUrlCondition: {
              maxSize: 100000,
            },
          },
        }
      ]
    },
    optimization: {
      minimize: isProd,
      splitChunks: false,
      runtimeChunk: false,
    },
    performance: {
      hints: isProd ? 'warning' : false, // Only show performance hints in production
      maxAssetSize: 9512000, // 500 KiB, adjust as needed
      maxEntrypointSize: 9512000, // 500 KiB
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
      ...(isProd ? [new CompressionPlugin()] : [])
    ]
  };
}
