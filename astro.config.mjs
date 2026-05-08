// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  image: {
    domains: ["s3.us-west-2.amazonaws.com", "prod-files-secure.s3.us-west-2.amazonaws.com"],
  },
});