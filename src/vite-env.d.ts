/// <reference types="vite/client" />
interface ImportMetaEnv {
	readonly VITE_SERVER_URL: string;
	readonly VITE_NAVER_CLIENT_ID: string;
	readonly VITE_REDIRECT_URL: string;
}
interface ImportMeta {
	readonly env: ImportMetaEnv;
}

