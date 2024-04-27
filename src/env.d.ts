interface ImportMetaEnv {
	readonly VITE_SERVER_URL: string;
	readonly VITE_YOUTUBE_API_KEY: string;
}
interface ImportMeta {
	readonly env: ImportMetaEnv;
}
