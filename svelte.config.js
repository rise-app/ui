import autoPreprocess from "svelte-preprocess";
import svelte from "rollup-plugin-svelte";

import { sass } from "svelte-preprocess-sass";

// and inside the svelte plugin, add autoPreprocess:
export default {
  /* ... */
  plugins: [
    svelte({
      preprocess: {
        style: sass({}, { all: true })
      }
    }),
    svelte({
      preprocess: {
        style: autoPreprocess()
      }
    })
  ]
};
