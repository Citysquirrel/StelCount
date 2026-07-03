import { useEffect, useRef, useState } from "react";
import { LiteralUnion } from "../types";

/**
 * @deprecated 웹소켓을 굳이 사용할 이유가 없다고 판단
 */
export function useWebSocket() {
	const socketRef = useRef<WebSocket | null>(null);
	const [socketMessages, setSocketMessages] = useState<SocketMessage[]>([]);

	const sendMessage = (msg: string) => {
		if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
			socketRef.current.send(msg);
		}
	};

	function setMessages(msg: SocketMessage) {
		setSocketMessages((prev) => {
			const STANDARD_TIME_SECOND = 30;
			const recentThreshold = new Date().getTime() - STANDARD_TIME_SECOND * 1000;
			return [...prev.filter((p) => new Date(p.timestamp).getTime() > recentThreshold), msg];
		});
	}

	useEffect(() => {
		const ws = new WebSocket(import.meta.env.VITE_WS_URL);
		socketRef.current = ws;

		ws.onopen = () => {
			ws.send(JSON.stringify({ type: "message", data: "클라이언트 연결 완료" } as SocketMessage));
		};

		ws.onmessage = (e) => {
			const msg: SocketMessage = JSON.parse(e.data);

			setMessages(msg);
		};

		ws.onclose = () => {
			setTimeout(() => {
				reconnectWebSocket();
			}, 1000);
		};

		function reconnectWebSocket() {
			const newWs = new WebSocket(import.meta.env.VITE_WS_URL);
			socketRef.current = newWs;

			newWs.onopen = () => {
				newWs.send(JSON.stringify({ type: "message", data: "클라이언트 연결 완료" } as SocketMessage));
			};

			newWs.onmessage = (e) => {
				const msg: SocketMessage = JSON.parse(e.data);

				setMessages(msg);
			};

			newWs.onclose = () => {
				setTimeout(() => {
					reconnectWebSocket();
				}, 1000);
			};
		}

		return () => {
			socketRef.current && socketRef.current.close();
		};
	}, []);

	return { socketRef, sendMessage, messages: socketMessages, setMessages };
}

interface SocketMessage {
	type: LiteralUnion<"message" | "data" | "multiview">;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: any;
	timestamp: string;
}
