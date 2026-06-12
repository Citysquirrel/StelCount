import { useColorModeValue } from "@chakra-ui/react";

export default function useColor() {
	const bgCard = useColorModeValue("white", "gray.700");
	const borderColor = useColorModeValue("gray.200", "gray.600");
	const headerBg = useColorModeValue("gray.100", "gray.800");
	const greenColor = useColorModeValue("green.50", "rgba(72, 187, 120, 0.1)");
	const redColor = useColorModeValue("red.50", "rgba(245, 101, 101, 0.1)");
	const blueColor = useColorModeValue("blue.50", "rgb(101, 101, 245,0.1)");
	const grayColor = useColorModeValue("gray.100", "rgba(160, 174, 192, 0.2)");
	const yellowColor = useColorModeValue("yellow.50", "rgba(236, 201, 75, 0.1)");
	const fieldHoverBgColor = useColorModeValue("blue.50", "blue.600");

	return { bgCard, borderColor, headerBg, greenColor, redColor, blueColor, grayColor, yellowColor, fieldHoverBgColor };
}
