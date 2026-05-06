import react from '@vitejs/plugin-react';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), sveltekit()]
});
