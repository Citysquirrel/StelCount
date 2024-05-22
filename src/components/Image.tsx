import { ImageProps as ChakraImageProps, Image as ChakraImage, Skeleton } from "@chakra-ui/react";
import SQ from "../assets/logo.png";
import TP from "../assets/transparent.png";

interface ImageProps extends ChakraImageProps {}

export function Image({ ...props }: ImageProps) {
	return <ChakraImage fallbackSrc={TP} {...props} />;
}
