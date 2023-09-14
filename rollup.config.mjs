import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default {
  input: './src/svgo.js',
  output: {
    file: './dist/svgo.js',
    format: 'esm',
  },
  onwarn(warning) {
    throw Error(warning.toString());
  },
  plugins: [
    nodeResolve({ browser: true, preferBuiltins: false }),
    commonjs(),
    // Whitespaces and comments removal makes the browser bundle lighter
    // while retaining the ability to debug errors
    terser({
      compress: true,
      mangle: false,
      format: {
        comments: false,
        indent_level: 2,
        quote_style: 0,
        max_line_len: 90,
        keep_quoted_props: true,
        keep_numbers: true,
        semicolons: false,
        ecma: 2020,
        beautify: true,
      },
    }),
  ],
};
