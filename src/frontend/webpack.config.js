const webpack = require('webpack');
const path = require('path');
const Dotenv = require('dotenv-webpack');

const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

const CompressionPlugin = require('compression-webpack-plugin');

const { codecovWebpackPlugin } = require("@codecov/webpack-plugin");

const BUILD_DIR = path.resolve(__dirname, 'dist');
const APP_DIR = path.resolve(__dirname, '');

module.exports = (env, argv) => {
  const mode = argv.mode || 'production';

  return {
    devtool: mode === 'production' ? false : 'source-map',
    entry: `${APP_DIR}/index.tsx`,
    output: {
      path: BUILD_DIR,
      publicPath: './',
      filename: mode === 'production' ? '[name].[contenthash].js' : './reflect-bundle.js',
      chunkFilename: mode === 'production' ? '[name].[contenthash].chunk.js' : '[name].chunk.js',
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
      minimize: true,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
          },
          fabric: {
            test: /[\\/]node_modules[\\/](office-ui-fabric-react)[\\/]/,
            name: 'fabric',
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true,
          },
          azure: {
            test: /[\\/]node_modules[\\/](azure-devops-)[\\/]/,
            name: 'azure',
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
      runtimeChunk: 'single',
    },
    performance: {
      hints: 'warning',
      maxAssetSize: 1600000, // 1.6 MB
      maxEntrypointSize: 1600000, // 1.6 MB
    },
    plugins: [
      new MomentLocalesPlugin({
        localesToKeep: [], // Keep only default (English) locale
      }),
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
      new CompressionPlugin(),
      codecovWebpackPlugin({
        enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
        bundleName: "retrospective-extension-webpack-bundle",
        uploadToken: process.env.CODECOV_TOKEN,
      }),
    ]
  };
}
