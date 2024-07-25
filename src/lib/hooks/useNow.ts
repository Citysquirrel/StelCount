import { useEffect } from "react";
import { useRecoilState } from "recoil";
import { nowState } from "../Atom";

export function useNow(timeout?: number) {
	const [, setNow] = useRecoilState(nowState);
	useEffect(() => {
		const i = setInterval(() => {
			let ms = new Date().getMilliseconds();
			if (ms) setNow(new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })));
		}, timeout || 1000);

		return () => {
			clearInterval(i);
		};
	}, []);
}
