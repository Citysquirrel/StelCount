import { useEffect, useState } from "react";

export function useWebSocket() {
	const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
	const [messages, setMessages] = useState<SocketMessage[]>([]);
	//TODO: 로컬스토리지를 통해 웹소켓의 중복 소통을 방지
	//TODO: useMultiView, useStellar와의 소통:
	//TODO: 웹소켓이 정상 연결상태일 때는 setInterval을 멈춤춤

	const sendMessage = (msg: string) => {
		if (webSocket && webSocket.readyState === WebSocket.OPEN) {
			webSocket.send(msg);
		}
	};

	useEffect(() => {
		const ws = new WebSocket(import.meta.env.VITE_WS_URL);

		setWebSocket(ws);

		ws.onopen = () => {
			// console.log("웹소켓 연결성공");
			ws.send(JSON.stringify({ type: "message", data: "클라이언트 연결 완료" } as SocketMessage));
		};

		ws.onmessage = (e) => {
			const msg: SocketMessage = JSON.parse(e.data);
			// console.log(msg);

			setMessages((prev) => {
				const STANDARD_TIME_SECOND = 30;
				const recentThreshold = new Date().getTime() - STANDARD_TIME_SECOND * 1000;
				return [...prev.filter((p) => new Date(p.timestamp).getTime() > recentThreshold), msg];
			});
		};

		return () => {
			ws.close();
		};
	}, []);

	return { sendMessage, messages, setMessages };
}

interface SocketMessage {
	type: "message" | "data" | "multiview" | (string & {});
	data: any;
	timestamp: string;
}
