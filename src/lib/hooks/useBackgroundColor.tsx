import { useRecoilState } from "recoil";
import { backgroundColorState } from "../Atom";
import { useLayoutEffect } from "react";

export default function useBackgroundColor(color?: string) {
	const [backgroundColor, setBackgroundColor] = useRecoilState(backgroundColorState);
	useLayoutEffect(() => {
		if (color) setBackgroundColor(color);
		return () => {
			setBackgroundColor("white");
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [color]);
	return { backgroundColor, setBackgroundColor };
}
