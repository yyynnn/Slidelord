var path = require('path')
var HtmlWebpackPlugin = require('html-webpack-plugin')
var env = require('yargs').argv.env
var pkg = require('./package.json')

var libraryName = pkg.name
var libPath = './example'
var libEntry = './example/index.js'
var outputFile, mode

if (env === 'builddocs') {
  mode = 'development'
  outputFile = libraryName + '.js'
  libPath = './example'
}
if (env === 'build') {
  mode = 'production'
  outputFile = libraryName + '.min.js'
  libPath = './build'
  libEntry = './lib/index.js'
} else {
  mode = 'development'
  outputFile = libraryName + '.js'
  libPath = './example'
}

var optionsHTML = {
  template: path.resolve(__dirname, './example/index.html'),
  filename: 'index.html',
  inject: false
}
var config = {
  mode: mode,
  devtool: 'source-map',
  entry: path.resolve(__dirname, libEntry),
  output: {
    path: path.resolve(__dirname, libPath),
    filename: outputFile,
    library: libraryName,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader'
      }
    ]
  },
  plugins: [],
  resolve: {
    alias: {
      slidelord: path.resolve(__dirname, 'lib/')
    }
  }
}

if (mode === 'development') {
  config.plugins.push(new HtmlWebpackPlugin(optionsHTML))
}
if (env === 'build') {
  config.externals = { react: 'react' }
}

module.exports = config
