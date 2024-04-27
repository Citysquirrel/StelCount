import { useEffect, useState } from "react";

export function useResponsive() {
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);
	const [width, setWidth] = useState(() => {
		if (window.innerWidth > 1440) {
			return 1440;
		} else if (window.innerWidth > 1440) {
			return 1440;
		} else if (window.innerWidth > 1280) {
			return 1200;
		} else if (window.innerWidth > 768) {
			return 900;
		} else return 640;
	});

	const handleWindowSize = () => {
		setWindowWidth(window.innerWidth);
		if (window.innerWidth > 1440) {
			setWidth(1440);
		} else if (window.innerWidth > 1440) {
			setWidth(1440);
		} else if (window.innerWidth > 1280) {
			setWidth(1200);
		} else if (window.innerWidth > 768) {
			setWidth(900);
		} else {
			setWidth(640);
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

// ultra: 3440,
// 		wide: 2560,
// 		full: 1920,
// 		basic: 1280,
// 		tablet: 720,
// 		mobile: 480,
