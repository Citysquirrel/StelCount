import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export function useObservatoryScroll() {
	const { pathname } = useLocation();
	const [visible, setVisible] = useState(false);
	const [footerOffset, setFooterOffset] = useState(0);
	useEffect(() => {
		const footer = document.getElementById("obs-footer");
		const main = document.getElementById("obs-main");
		const update = () => {
			setVisible(window.scrollY > 300);
			setFooterOffset(footer ? Math.max(0, window.innerHeight - footer.getBoundingClientRect().top + 16) : 0);
		};
		update();
		window.addEventListener("scroll", update, { passive: true });
		window.addEventListener("resize", update);
		const observer = new ResizeObserver(update);
		if (footer) observer.observe(footer);
		if (main) observer.observe(main);
		return () => {
			window.removeEventListener("scroll", update);
			window.removeEventListener("resize", update);
			observer.disconnect();
		};
	}, [pathname]);
	return { visible, footerOffset };
}
