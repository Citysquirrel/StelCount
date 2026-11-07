import { useColorModeValue } from "@chakra-ui/react";

export default function useColor() {
	const bgCard = useColorModeValue("white", "#1b1629");
	const borderColor = useColorModeValue("gray.200", "#3a3351");
	const headerBg = useColorModeValue("gray.100", "#2b223d");
	const greenColor = useColorModeValue("green.50", "#1e3632");
	const redColor = useColorModeValue("red.50", "#3c2336");
	const blueColor = useColorModeValue("blue.50", "#252e48");
	const grayColor = useColorModeValue("gray.100", "#302a3f");
	const yellowColor = useColorModeValue("yellow.50", "#3b3225");
	const fieldHoverBgColor = useColorModeValue("blue.50", "#392d4d");
	const alternateRowBg = useColorModeValue("gray.50", "#251e35");
	const selectedRowBg = useColorModeValue("orange.100", "#483126");
	const selectedRowHoverBg = useColorModeValue("orange.200", "#573a2b");
	const mutedColor = useColorModeValue("gray.600", "#b4aacb");

	return { bgCard, borderColor, headerBg, greenColor, redColor, blueColor, grayColor, yellowColor, fieldHoverBgColor, alternateRowBg, selectedRowBg, selectedRowHoverBg, mutedColor };
}
