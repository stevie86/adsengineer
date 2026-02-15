import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

export default {
  // https://astro.build/config
  output: 'static',
  adapter: cloudflare(),
  integrations: [tailwind()],
};