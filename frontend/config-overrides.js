const CopyPlugin = require('copy-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = function override(config) {
  const overridden = config;

  // These are required by sql.js for the build to succeed. However, we do not use the corresponding
  // functionality of sql.js, hence we can provide empty modules.
  overridden.resolve.fallback = {
    fs: false, path: false, crypto: false,
  };
  overridden.plugins.push(new CopyPlugin({
    patterns: [
      // These wasm files will be fetched dynamically when we initialize sql.js.
      // sql.js 1.14.x resolves its browser entry point to sql-wasm-browser.js which
      // requests sql-wasm-browser.wasm, so we must copy BOTH the default and the
      // browser wasm variants. Their names must not be changed, and they must stay
      // in the same folder as the js.
      { from: 'node_modules/sql.js/dist/sql-wasm.wasm', to: 'static/js/' },
      { from: 'node_modules/sql.js/dist/sql-wasm-browser.wasm', to: 'static/js/' },
    ],
  }));

  // These are required by csv-stringify
  overridden.plugins.push(new NodePolyfillPlugin({ includeAliases: ['Buffer', 'process', 'stream'] }));

  return overridden;
};
