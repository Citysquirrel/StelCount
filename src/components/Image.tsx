import { ImageProps as ChakraImageProps, Image as ChakraImage, Skeleton } from "@chakra-ui/react";
import SQ from "../assets/logo.png";

interface ImageProps extends ChakraImageProps {}

export function Image({ ...props }: ImageProps) {
	return <ChakraImage fallbackSrc={SQ} {...props} />;
}
