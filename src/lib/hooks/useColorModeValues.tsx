import { useColorModeValue } from "@chakra-ui/react";

export default function useColorModeValues() {
	const values = useColorModeValue(
		{ background: "#ffffffcc", bgOpacity: "#ffffff" },
		{ background: "#1a202c", bgOpacity: "#1a202ccc" }
	);
	return values;
}
