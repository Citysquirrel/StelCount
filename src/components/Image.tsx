import { ImageProps as ChakraImageProps, Image as ChakraImage, AspectRatio, AspectRatioProps, Box } from "@chakra-ui/react";
import { useMemo, useState } from "react";

interface ImageV2Props extends Omit<AspectRatioProps, "ratio"> {
	src: string;
	ratio?: AspectRatioProps["ratio"] | null;
	alt?: string;
	loading?: "eager" | "lazy"; // 성능 최적화용
	objectFit?: ChakraImageProps["objectFit"];
	isDarkMode?: boolean;
	imageProps?: Omit<ChakraImageProps, "src" | "alt">;
}

const LIGHT_COLORS = ["gray.100", "orange.100", "green.100", "blue.100", "pink.100"];
const DARK_COLORS = ["gray.800", "orange.900", "green.900", "blue.900", "pink.900"];

export function ImageV2({
	src,
	ratio = 16 / 9,
	alt,
	loading = "lazy",
	objectFit = "cover",
	isDarkMode = false,
	imageProps,
	...wrapperProps
}: ImageV2Props) {
	const [loadedSrc, setLoadedSrc] = useState<string>();
	const isLoaded = loadedSrc === src;
	const Wrapper = ratio === null ? Box : AspectRatio;

	const colorIndex = useMemo(() => {
		return Math.floor(Math.random() * LIGHT_COLORS.length);
	}, []);

	const placeholderColor = isDarkMode ? DARK_COLORS[colorIndex] : LIGHT_COLORS[colorIndex];
	return (
		<Wrapper
			{...(ratio === null ? {} : { ratio })}
			w="100%"
			// 색상 삐져나옴 방지
			bg={isLoaded ? "transparent" : placeholderColor}
			// 브라우저 렌더링 버그 방지 (테두리 픽셀 번짐 억제)
			transform="translateZ(0)"
			overflow="hidden"
			{...wrapperProps}
		>
			<ChakraImage
				key={src}
				src={src}
				alt={alt}
				loading={loading}
				objectFit={objectFit}
				w="100%"
				h="100%"
				borderRadius="inherit"
				opacity={isLoaded ? 1 : 0}
				transition="opacity 0.3s ease-in-out"
				{...imageProps}
				onLoad={(e) => {
					const loadedUrl = e.currentTarget.src;
					imageProps?.onLoad?.(e);
					if (e.currentTarget.src === loadedUrl) setLoadedSrc(src);
				}}
			/>
		</Wrapper>
	);
}

interface ImageProps extends ChakraImageProps {}

/**
 * @deprecated
 */
export function Image({ ...props }: ImageProps) {
	return <ChakraImage fallbackSrc={"/images/transparent.png"} {...props} />;
}
