import { PluginOption, defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { dependencies } from "./package.json";
import ssl from "@vitejs/plugin-basic-ssl";

const vendor = ["react", "react-router-dom", "react-dom"];
const libs = ["uuid", "recoil", "is-mobile", "usehooks-ts", "immutability-helper", "react-icons"];
const excludes = [...vendor, ...libs];

function renderChunks(deps: Record<string, string>) {
	let chunks: { [key: string]: string[] } = {};
	Object.keys(deps).forEach((key) => {
		if (excludes.includes(key)) return;
		// const uuidKey = uuidv4();
		chunks[key] = [key];
	});
	return chunks;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	if (mode === "production")
		return {
			plugins: [react()],
			build: {
				rollupOptions: {
					output: {
						manualChunks: {
							vendor,
							libs,
							...renderChunks(dependencies),
						},
					},
				},
			},
		};
	else
		return {
			plugins: [react(), ssl()],
			server: {
				https: true,
			},
			build: {
				rollupOptions: {
					output: {
						manualChunks: {
							vendor,
							libs,
							...renderChunks(dependencies),
						},
					},
				},
			},
		};
});

