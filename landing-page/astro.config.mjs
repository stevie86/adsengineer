import tailwind from '@astrojs/tailwind';

export default {
  // https://astro.build/config
  output: 'static',
  integrations: [tailwind()],
};