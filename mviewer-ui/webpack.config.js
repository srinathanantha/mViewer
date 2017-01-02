var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var BrowserSyncPlugin = require('browser-sync-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var DefinePlugin = require('webpack/lib/DefinePlugin');
var failPlugin = require('webpack-fail-plugin');

var BUILD_DIR = path.resolve(__dirname + '/build');
var APP_DIR = path.resolve(__dirname + '/src');

var HTMLWebpackPluginConfig = new HtmlWebpackPlugin({
  template: __dirname + '/src/index.html',
  filename: 'index.html',
  inject: 'body'
});

var npmEvent = process.env.npm_lifecycle_event;
var ENV;
if (npmEvent == 'start') {
  ENV =  'development';
}

var config = {
    entry: APP_DIR + '/index.jsx',
    output: {
        path: BUILD_DIR,
        filename: 'site.js',
        libraryTarget: 'umd',
        publicPath: '/'
    },
    devServer: {
      inline:true,
      port: 3000,
      historyApiFallback: true
    },

    module: {
      preLoaders: [{
           test: /\.jsx?$/,
           loaders: ['eslint'],
           include: APP_DIR
         }
      ],
      loaders: [{
            test: /\.jsx?/,
            include: APP_DIR,
            loaders: ['react-hot', 'babel', 'babel-loader']
          },{
            test: /\.css$/,
            loader: ExtractTextPlugin.extract('css?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]'),
            include: APP_DIR
          },{
            test: /\.json$/, loader: 'json-loader'
          },{
            test: /\.(otf|woff|woff2|eot|ttf|svg)$/,
            exclude: /node_modules/,
            loader: 'url-loader?limit=1024&name=fonts/[name].[ext]'
          }
        ]
    },
    plugins: [
        new DefinePlugin({
          'ENV': JSON.stringify(ENV)
        }),
        new ExtractTextPlugin('styles.css'),
        HTMLWebpackPluginConfig,
        new CopyWebpackPlugin([
            { from: APP_DIR + '/vendors/css/grid.css', to: BUILD_DIR  + '/grid.css'}
        ]),
        new CopyWebpackPlugin([
            { from: APP_DIR + '/assets', to: BUILD_DIR  + '/'}
        ]),
        new CopyWebpackPlugin([
            { from: APP_DIR + '/vendors/css/bootstrap', to: BUILD_DIR  + '/bootstrap'}
        ]),
        failPlugin
    ]
};

module.exports = config;
