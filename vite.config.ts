import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
// import mkcert from "vite-plugin-mkcert"; // Temporarily disabled for Surge compatibility
import ssrPlugin from "vite-ssr-components/plugin";

export default defineConfig({
	plugins: [
		cloudflare({
			configPath: "./wrangler.jsonc",
			experimental: {
				remoteBindings: false, // 禁用远程绑定，使用本地开发
			},
		}),
		ssrPlugin(),
		// mkcert(), // Temporarily disabled for Surge compatibility
	],
	dev: {},
	server: {
		port: 8008,
		host: true, // Allow external connections
		allowedHosts: [
			".pagen.test", // Allow all *.pagen.test subdomains
			"localhost",
			"127.0.0.1",
		],
	},
	assetsInclude: ['.md'],
	optimizeDeps: {
		exclude: ['@cloudflare/workers-types']
	}
});
