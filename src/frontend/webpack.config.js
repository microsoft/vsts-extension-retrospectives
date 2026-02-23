import webpack from "webpack";
import { resolve as _resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import TerserPlugin from "terser-webpack-plugin";

import CompressionPlugin from "compression-webpack-plugin";

import { codecovWebpackPlugin } from "@codecov/webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BUILD_DIR = _resolve(__dirname, "dist");
const APP_DIR = _resolve(__dirname, "");

export default (_, argv) => {
  const mode = argv.mode || "production";

  return {
    devtool: mode === "production" ? false : "source-map",
    entry: `${APP_DIR}/index.tsx`,
    output: {
      path: BUILD_DIR,
      publicPath: "./",
      filename: "./reflect-bundle.js",
      clean: true,
    },
    resolve: {
      fallback: {
        assert: false,
        buffer: false,
        crypto: false,
        process: "process/browser",
        stream: false,
      },
      extensions: [".ts", ".js", ".jsx", ".tsx"],
    },
    module: {
      rules: [
        {
          test: /\.ts|.js|.tsx$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: "ts-loader",
          },
        },
        { test: /(\.css$)/, use: ["style-loader", "css-loader"] },
        {
          test: /.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
          type: "asset",
          parser: {
            dataUrlCondition: {
              maxSize: 100000,
            },
          },
        },
      ],
    },
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: mode === "production",
              pure_funcs: mode === "production" ? ["console.info", "console.debug", "console.warn"] : [],
              passes: 2,
              dead_code: true,
              unused: true,
            },
            mangle: {
              safari10: true,
            },
            output: {
              comments: false,
            },
          },
          extractComments: false,
        }),
      ],
      usedExports: true,
      sideEffects: true,
      providedExports: true,
      innerGraph: true,
      concatenateModules: true,
      splitChunks: false,
      runtimeChunk: false,
    },
    performance: {
      hints: "warning",
      maxAssetSize: 1600000, // 1.6 MB
      maxEntrypointSize: 1600000, // 1.6 MB
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: "process/browser",
      }),
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(mode),
        "process.env.BUILD_BUILDNUMBER": JSON.stringify(process.env.BUILD_BUILDNUMBER),
        "process.env.REACT_APP_APP_INSIGHTS_INSTRUMENTATION_KEY": JSON.stringify(process.env.REACT_APP_APP_INSIGHTS_INSTRUMENTATION_KEY),
        "process.env.REACT_APP_COLLABORATION_STATE_SERVICE_URL": JSON.stringify(process.env.REACT_APP_COLLABORATION_STATE_SERVICE_URL),
      }),
      new CompressionPlugin(),
      codecovWebpackPlugin({
        enableBundleAnalysis: Boolean(process.env.CODECOV_TOKEN),
        bundleName: "retrospective-extension-webpack-bundle",
        uploadToken: process.env.CODECOV_TOKEN,
      }),
    ],
  };
};
