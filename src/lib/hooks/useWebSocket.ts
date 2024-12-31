import { useEffect, useState } from "react";

export function useWebSocket() {
	const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
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
			console.log("웹소켓 연결성공");
		};

		return () => {
			ws.close();
		};
	}, []);

	return { sendMessage };
}
