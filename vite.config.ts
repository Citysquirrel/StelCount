import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import ssl from "@vitejs/plugin-basic-ssl";
import { visualizer } from "rollup-plugin-visualizer";
import { compression } from "vite-plugin-compression2";

export default defineConfig(({ mode }) => {
	const isProd = mode === "production";

	return {
		plugins: [
			react(),
			!isProd && ssl(),
			// 정적 파일 Gzip 압축
			isProd &&
				compression({
					algorithms: ["gzip", "brotliCompress"],
					include: /\.(js|mjs|json|css|html|svg)$/i,
					threshold: 10240,
				}),

			// 빌드 시에만 번들 분석 리포트 생성 및 자동 열기
			isProd &&
				visualizer({
					filename: "./analysis/stats.html", // 분석 결과 파일 경로
					open: true, // 빌드 완료 시 브라우저에서 자동으로 열기
					gzipSize: true, // 실제 네트워크 전송 시 압축되는 사이즈로 보여주기
				}),
		].filter(Boolean),

		server: {},

		resolve: {
			tsconfigPaths: true,
		},
		build: {
			sourcemap: false,

			// 에셋 인라인 리밋 설정 (기본값 4096(4kb) -> 2048(2kb)로 낮춰서 JS 용량 확보)
			// HTTP/2에서 요청횟수보다 JS 번들 크기를 줄이는 것이 유리하다는 판단
			assetsInlineLimit: 2048,

			rollupOptions: {
				output: {
					minify: {
						compress: {
							// isProd가 true일 때(프로덕션 빌드 시) 모든 console.* 호출 삭제
							//? 기존 esbuild를 삭제하면서 exclude 대신 사용(최신 도입된 oxc 기능 편입)
							dropConsole: isProd,
						},
					},
					manualChunks: (id) => {
						if (id.includes("node_modules")) {
							if (id.includes("@chakra-ui")) {
								return "vendor-chakra";
							}
							if (id.includes("recharts")) {
								return "vendor-recharts";
							}
							if (id.includes("react-icons")) {
								return "vendor-icons";
							}
							if (id.includes("lodash")) {
								return "vendor-lodash";
							}

							// ⚠️ 중요: 그 외의 모든 패키지(React, Recoil, React-Query, React-DnD 등)는
							// 별도로 나누지 않고 Vite의 기본 설정(통합 처리)에 맡겨 Context 유실이나 모듈 꼬임을 방지
						}
					},
					entryFileNames: "[name].[hash].js",
					chunkFileNames: "chunks/[name].[hash].js",
					assetFileNames: "assets/[name].[hash].[ext]",
				},
			},
		},
	};
});
