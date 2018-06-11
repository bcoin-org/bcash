'use strict';

const Path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const str = JSON.stringify;
const env = process.env;

module.exports = {
  target: 'web',
  entry: {
    'app': './browser/src/app',
    'worker': './lib/workers/worker'
  },
  output: {
    path: Path.join(__dirname, 'browser'),
    filename: '[name].js'
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['-browser.js', '.js', '.json']
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.BCASH_NETWORK':
        str(env.BCASH_NETWORK || 'main'),
      'process.env.BCASH_WORKER_FILE':
        str(env.BCASH_WORKER_FILE || '/bcash-worker.js')
    }),
    new UglifyJsPlugin()
  ]
};
