// @ts-nocheck
import { defineConfig } from "astro/config";
import mdx from '@astrojs/mdx';
import icon from "astro-icon";
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://newhorizonsimmigrationlaw.org',
  base: '/',
  output: 'static',

  integrations: [
    icon({
       include: {
        // Include Bootstrap icons used in the project
        bi: ['*'],
      }
    }),
    mdx(),
  ],

  vite: {
    resolve: {
      alias: {
        '@img': '/src/img',
      },
    },
    plugins: [tailwindcss()]
  }
});