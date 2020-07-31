import consts from '@nickkaramoff/rollup-plugin-consts';
import license from 'rollup-plugin-license';
import postcss from 'rollup-plugin-postcss';
import postcssPluginBanner from 'postcss-banner';
import postcssPluginCalc from 'postcss-calc';
import postcssPluginCssnano from 'cssnano';
import postcssPluginMixins from 'postcss-mixins';
import postcssPluginVariables from 'postcss-css-variables';
import strip from '@rollup/plugin-strip';
import { terser } from 'rollup-plugin-terser';

import { urlBuilderMap } from './src/networks';
import networksMixin from './src/networksMixin';

const isDev = process.env.ROLLUP_WATCH || process.env.NODE_ENV === 'development';

const pkg = require('./package.json');

const outputDir = isDev ? './dev/' : './dist/';

const bannerText = `${pkg.name} v${pkg.version} by Nikita Karamov\n${pkg.homepage}`;

/**
 * Plugins to build the project
 *
 * @type {Plugin[]}
 */
const plugins = [
  consts({
    urlBuilderMap,
  }),
];

if (!isDev) {
  plugins.push(strip({
    debugger: true,
    include: ['**/*.js', '**/*.ts'],
    functions: ['console.log', 'console.debug', 'assert.*'],
    sourceMap: false,
  }));

  plugins.push(license({
    banner: {
      commentStyle: 'ignored',
      content: bannerText,
    },
  }));
}

plugins.push(postcss({
  extract: `${pkg.name}.min.css`,
  plugins: [
    postcssPluginMixins({
      mixins: {
        networks: networksMixin,
      },
    }),
    postcssPluginVariables(),
    postcssPluginCalc(),
    (!isDev) && postcssPluginCssnano({
      preset: 'default',
    }),
    postcssPluginBanner({
      banner: bannerText,
      important: true,
    }),
  ],
}));

/**
 * @typedef {import('rollup').OutputOptions} OutputOptions
 */

/**
 *
 * @param {string} baseDir base directory for the output files
 * @return {OutputOptions[]} array of outputs
 */
const getOutputs = (baseDir) => {
  const defaultParameters = {
    name: pkg.name,
    exports: 'default',
  };
  const result = [];

  if (isDev) {
    result.push({
      ...defaultParameters,
      format: 'iife',
      file: `${baseDir}${pkg.name}.js`,
    });
  } else {
    result.push({
      ...defaultParameters,
      format: 'cjs',
      file: `${baseDir}${pkg.name}.cjs`,
    });
    result.push({
      ...defaultParameters,
      format: 'esm',
      file: `${baseDir}${pkg.name}.mjs`,
    });
    result.push({
      ...defaultParameters,
      format: 'iife',
      file: `${baseDir}${pkg.name}.min.js`,
      plugins: [terser({ output: { comments: false } })],
    });
  }

  return result;
};

const config = [
  {
    input: './src/autoinit.js',
    output: getOutputs(`${outputDir}`),
    plugins,
  },
  {
    input: './src/shareon.js',
    output: getOutputs(`${outputDir}noinit/`),
    plugins: plugins.slice(0, -1),
  },
];

export default config;
