import { useEffect, useRef, useState } from "react";

export function useWebSocket() {
	const socketRef = useRef<WebSocket | null>(null);
	const [socketMessages, setSocketMessages] = useState<SocketMessage[]>([]);
	//!: 메시지 상태를 전역상태로 바꾸는 방안 검토 => 예상치 못한 렌더링 발생 예상. 바람직하지 않음

	//TODO: 로컬스토리지를 통해 웹소켓의 중복 소통을 방지
	//TODO: useMultiView, useStellar와의 소통:
	//TODO: 웹소켓이 정상 연결상태일 때는 setInterval을 멈춤

	//TODO: reconnectWebsocket 메서드 추가

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
			// console.log("웹소켓 연결성공");
			ws.send(JSON.stringify({ type: "message", data: "클라이언트 연결 완료" } as SocketMessage));
		};

		ws.onmessage = (e) => {
			const msg: SocketMessage = JSON.parse(e.data);
			// console.log(msg);

			setMessages(msg);
		};

		ws.onclose = () => {
			reconnectWebSocket();
		};

		function reconnectWebSocket() {
			const newWs = new WebSocket(import.meta.env.VITE_WS_URL);
			socketRef.current = newWs;

			newWs.onopen = () => {
				newWs.send(JSON.stringify({ type: "message", data: "클라이언트 연결 완료" } as SocketMessage));
			};

			newWs.onmessage = (e) => {
				const msg: SocketMessage = JSON.parse(e.data);
				// console.log(msg);

				setMessages(msg);
			};

			newWs.onclose = () => {
				reconnectWebSocket();
			};
		}

		return () => {
			ws.close();
		};
	}, []);

	return { socketRef, sendMessage, messages: socketMessages, setMessages };
}

interface SocketMessage {
	type: "message" | "data" | "multiview" | (string & {});
	data: any;
	timestamp: string;
}
