import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { ReactNode } from "react";
import useColor from "@/lib/hooks/useColor";

interface AdminPageHeaderProps {
	title: string;
	description?: ReactNode;
	actions?: ReactNode;
	children?: ReactNode;
}

export function AdminPageHeader({ title, description, actions, children }: AdminPageHeaderProps) {
	const { bgCard, borderColor, mutedColor } = useColor();
	return (
		<Box as="section" aria-label={`${title} 도구`} bg={bgCard} borderWidth="1px" borderColor={borderColor} rounded="xl" mb={6} sx={{
			"button, input, select": { minH: { base: "40px", md: "32px" } },
			".chakra-input__right-element": { h: { base: "40px", md: "32px" } },
		}}>
			<Flex p={{ base: 4, md: 5 }} gap={4} align="center" justify="space-between" wrap="wrap">
				<Box flex="1 1 240px" minW={0}>
					<Heading as="h1" size="lg" mb={description ? 2 : 0}>{title}</Heading>
					{description && <Box color={mutedColor} fontSize="sm">{typeof description === "string" ? <Text>{description}</Text> : description}</Box>}
				</Box>
				{actions && <Flex gap={2} wrap="wrap" align="center" justify={{ base: "flex-start", md: "flex-end" }}>{actions}</Flex>}
			</Flex>
			{children && <Box p={{ base: 4, md: 5 }} borderTopWidth="1px" borderColor={borderColor}>
				{children}
			</Box>}
		</Box>
	);
}
