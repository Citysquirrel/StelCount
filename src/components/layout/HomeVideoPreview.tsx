import { Box } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useScript } from "usehooks-ts";

interface PreviewPlayer {
	mute: () => void;
	setVolume: (volume: number) => void;
	playVideo: () => void;
	seekTo: (seconds: number, allowSeekAhead: boolean) => void;
	getDuration: () => number;
	getCurrentTime: () => number;
	getPlayerState: () => number;
	getIframe: () => HTMLIFrameElement;
	destroy: () => void;
}

interface PreviewPlayerApi {
	Player: new (element: HTMLElement, options: {
		videoId: string;
		host: string;
		width: string;
		height: string;
		playerVars: Record<string, string | number>;
		events: {
			onReady: (event: { target: PreviewPlayer }) => void;
			onStateChange: (event: { data: number }) => void;
			onError: () => void;
			onAutoplayBlocked: () => void;
		};
	}) => PreviewPlayer;
}

export function HomeVideoPreview({ videoId, start: requestedStart, end: requestedEnd }: { videoId: string; start?: number; end?: number }) {
	const hostRef = useRef<HTMLDivElement>(null);
	const [playing, setPlaying] = useState(false);
	const scriptStatus = useScript("https://www.youtube.com/iframe_api", { removeOnUnmount: false });

	useEffect(() => {
		const host = hostRef.current;
		if (!host || scriptStatus !== "ready") return;
		let disposed = false;
		let failed = false;
		let player: PreviewPlayer | undefined;
		let ready = false;
		let start: number | undefined;
		let end: number | undefined;
		let playbackSince: number | undefined;
		let fadeStartedAt: number | undefined;
		let hasPlayed = false;
		let timeout: number | undefined;
		setPlaying(false);
		const hasSegment = requestedStart !== undefined || requestedEnd !== undefined;
		if (hasSegment && (!Number.isFinite(requestedStart) || !Number.isFinite(requestedEnd) || requestedStart! < 0 || requestedEnd! <= requestedStart!)) return;

		const destroy = () => {
			const previous = player;
			player = undefined;
			try {
				previous?.destroy();
			} finally {
				host.replaceChildren();
			}
		};
		const fallback = () => {
			if (disposed || failed) return;
			failed = true;
			setPlaying(false);
			window.clearTimeout(timeout);
			window.clearInterval(poll);
			destroy();
		};
		const waitForPlayback = () => {
			if (timeout === undefined) timeout = window.setTimeout(fallback, 6000);
		};
		const update = () => {
			if (disposed || failed) return;
			try {
				if (!player) {
					// iframe_api 스크립트 이후 로드되는 실제 Player 모듈까지 기다린다.
					const api = (window as Window & { YT?: PreviewPlayerApi }).YT;
					if (!api?.Player) return;
					const mount = document.createElement("div");
					host.appendChild(mount);
					player = new api.Player(mount, {
						videoId,
						host: "https://www.youtube-nocookie.com",
						width: "100%",
						height: "100%",
						playerVars: { autoplay: 0, controls: 0, disablekb: 1, playsinline: 1, fs: 0, rel: 0, origin: window.location.origin,
							...(hasSegment ? { start: requestedStart!, end: requestedEnd! } : {}) },
						events: {
							onReady: ({ target }) => {
								if (disposed || failed) return;
								ready = true;
								target.mute();
								target.setVolume(0);
								if (hasSegment) target.seekTo(requestedStart!, true);
								target.playVideo();
							},
							onStateChange: ({ data }) => {
								if (disposed || failed) return;
								if (data !== 1) {
									playbackSince = undefined;
									setPlaying(false);
									waitForPlayback();
								}
							},
							onError: fallback,
							onAutoplayBlocked: fallback,
						},
					});
					const iframe = player.getIframe();
					iframe.tabIndex = -1;
					iframe.title = "음소거 영상 미리보기";
					iframe.allow = "autoplay; encrypted-media";
					iframe.referrerPolicy = "strict-origin-when-cross-origin";
				}
				if (!ready) return;
				const duration = player.getDuration();
				if (!Number.isFinite(duration) || duration <= 0) return;
				if (start === undefined) {
					start = hasSegment ? requestedStart! : duration * (.3 + Math.random() * .35);
					end = Math.min(hasSegment ? requestedEnd! : start + 16, duration - .25);
					if (end <= start) { fallback(); return; }
					player.seekTo(start, true);
					return;
				}
				const position = player.getCurrentTime();
				const state = player.getPlayerState();
				const reachedEnd = state === 0 || position >= end!;
				if (fadeStartedAt === undefined && (reachedEnd || state === 1 && position >= end! - .9)) {
					fadeStartedAt = performance.now();
					playbackSince = undefined;
					setPlaying(false);
				}
				if (fadeStartedAt !== undefined) {
					// 영상이 보이지 않게 된 뒤 탐색해 반복 경계의 검은 프레임을 가린다.
					if (reachedEnd && performance.now() - fadeStartedAt >= 600) {
						fadeStartedAt = undefined;
						player.mute();
						player.seekTo(start, true);
						player.playVideo();
						waitForPlayback();
					}
					return;
				}
				if (hasSegment && state === 1 && position < start) {
					playbackSince = undefined;
					setPlaying(false);
					player.mute();
					player.seekTo(start, true);
					player.playVideo();
					waitForPlayback();
				} else if (state === 1 && position >= (hasSegment ? start : Math.max(0, start - 2))) {
					playbackSince ??= performance.now();
					// 탐색 직후의 재생 안내 UI가 사라진 뒤 영상을 드러낸다.
					if (performance.now() - playbackSince >= (hasPlayed ? 200 : 1200)) {
						window.clearTimeout(timeout);
						timeout = undefined;
						setPlaying(true);
						hasPlayed = true;
					}
				}
			} catch {
				fallback();
			}
		};
		waitForPlayback();
		const poll = window.setInterval(update, 200);
		update();
		return () => {
			disposed = true;
			window.clearInterval(poll);
			window.clearTimeout(timeout);
			destroy();
		};
	}, [videoId, scriptStatus, requestedStart, requestedEnd]);

	return (
		<Box position="absolute" inset={0} overflow="hidden" pointerEvents="none" aria-hidden="true"
			opacity={playing ? 1 : 0} transition="opacity .6s ease-in-out" filter="saturate(.7)" sx={{ containerType: "size" }}>
			<Box ref={hostRef} position="absolute" left="50%" top="50%" transform="translate(-50%, -50%)"
				w="max(100cqw, calc((100cqh + 160px) * 16 / 9))" h="max(calc(100cqh + 160px), 56.25cqw)"
				sx={{ "& iframe": { width: "100%", height: "100%", border: 0, pointerEvents: "none" } }} />
		</Box>
	);
}
