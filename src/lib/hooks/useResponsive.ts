import { useEffect, useState } from "react";

export function useResponsive() {
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);
	const [width, setWidth] = useState(() => {
		if (window.innerWidth > 1440) {
			return 1440;
		} else if (window.innerWidth > 1200) {
			return 1200;
		} else if (window.innerWidth > 900) {
			return 900;
		} else if (window.innerWidth > 720) {
			return 720;
		} else return 480;
	});

	const handleWindowSize = () => {
		setWindowWidth(window.innerWidth);
		if (window.innerWidth > 1440) {
			setWidth(1440);
		} else if (window.innerWidth > 1280) {
			setWidth(1200);
		} else if (window.innerWidth > 900) {
			setWidth(900);
		} else if (window.innerWidth > 720) {
			setWidth(720);
		} else {
			setWidth(480);
		}
	};

	useEffect(() => {
		window.addEventListener("resize", handleWindowSize);
		return () => {
			window.removeEventListener("resize", handleWindowSize);
		};
	}, []);

	return { windowWidth, width };
}
