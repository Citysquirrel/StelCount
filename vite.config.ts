import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { dependencies } from "./package.json";

const vendor = ["react", "react-router-dom", "react-dom"];
const libs = ["uuid", "recoil"];
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
export default defineConfig({
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
});

