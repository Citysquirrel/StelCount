import { useColorModeValue } from "@chakra-ui/react";

export default function useColorModeValues() {
	const values = useColorModeValue(
		{
			background: "#ffffff",
			bgOpacity: "#ffffffcc",
			bgFooter: "#949fe6cc",
			bgHover: "gray.200",
			bgSelected: "gray.100",
		},
		{
			background: "#1a202c",
			bgOpacity: "#1a202ccc",
			bgFooter: "#616cb3cc",
			bgHover: "gray.500",
			bgSelected: "gray.600",
		}
	);
	return values;
}
