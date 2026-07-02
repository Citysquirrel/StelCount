import { ImageProps as ChakraImageProps, Image as ChakraImage, AspectRatio, AspectRatioProps } from "@chakra-ui/react";
import { useMemo, useState } from "react";

interface ImageProps extends ChakraImageProps {
	wrapperProps?: AspectRatioProps;
}

const SOFT_COLORS = ["gray.100", "orange.100", "green.100", "blue.100", "pink.100"];

export function Image({ wrapperProps, ...props }: ImageProps) {
	const [isLoaded, setIsLoaded] = useState(false);

	const bgColor = useMemo(() => {
		return SOFT_COLORS[Math.floor(Math.random() * SOFT_COLORS.length)];
	}, []);

	return (
		<AspectRatio ratio={16 / 9} w="100%" bg={bgColor} overflow="hidden" {...wrapperProps}>
			<ChakraImage
				objectFit="cover"
				onLoad={() => setIsLoaded(true)}
				opacity={isLoaded ? 1 : 0}
				transition="opacity 0.3s ease-in-out"
				{...props}
			/>
		</AspectRatio>
	);
}
