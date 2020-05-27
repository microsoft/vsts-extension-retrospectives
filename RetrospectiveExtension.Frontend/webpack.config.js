const webpack = require('webpack');
const path = require('path');

const BUILD_DIR = path.resolve(__dirname, 'dist');
const APP_DIR = path.resolve(__dirname, '');

module.exports = {
  devtool: 'source-map',
  entry: `${APP_DIR}/index.tsx`,
  output: {
    path: BUILD_DIR,
    filename: './reflect-bundle.js',
    libraryTarget: 'amd'
  },
  externals: [
    /^VSS\/.*/, /^TFS\/.*/
  ],
  resolve: {
    extensions: ['.Webpack.js', '.web.js', '.ts', '.js', '.jsx', '.tsx']
  },
  module: {
    rules: [
      {
        test: /\.ts|.tsx$/,
        enforce: 'pre',
        loader:'eslint-loader'
      },
      {
        test: /\.ts|.tsx$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'ts-loader'
        }
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader'
        }
      },
      { test: /(\.css$)/, loaders: ['style-loader', 'css-loader'] },
      {
        test: /\.scss$/,
        loaders: ['style-loader', 'css-loader', 'sass-loader']
      },
      { 
        test: /.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
        use: 'url-loader?limit=100000'
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        BUILD_BUILDNUMBER: JSON.stringify(process.env.BUILD_BUILDNUMBER),
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
      }
    })]
}