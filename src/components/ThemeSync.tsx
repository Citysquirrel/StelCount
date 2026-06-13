import { useColorMode } from "@chakra-ui/react";
import { useEffect } from "react";

export function ThemeSync() {
	const { colorMode } = useColorMode();

	useEffect(() => {
		const root = window.document.documentElement;

		// Chakra의 상태가 dark면 Tailwind의 dark 클래스를 추가, 아니면 제거
		if (colorMode === "dark") {
			root.classList.add("dark");
		} else {
			root.classList.remove("dark");
		}
	}, [colorMode]);

	return null;
}
