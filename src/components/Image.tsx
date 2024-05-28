import { ImageProps as ChakraImageProps, Image as ChakraImage } from "@chakra-ui/react";

interface ImageProps extends ChakraImageProps {}

export function Image({ ...props }: ImageProps) {
	return <ChakraImage fallbackSrc={"/images/transparent.png"} {...props} />;
}
