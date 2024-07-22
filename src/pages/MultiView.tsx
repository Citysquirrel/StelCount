import { Box, HStack, SimpleGrid, Stack } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { naver } from "../lib/functions/platforms";

export function MultiView() {
	const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
	const [isInnerChatOpen, setIsInnerChatOpen] = useState(false);
	const [streams, setStreams] = useState<Stream[]>([{ type: "chzzk", streamId: "45e71a76e949e16a34764deb962f9d9f" }]);

	const handleFrameSize = () => {
		const width = window.innerWidth - 8 - (isInnerChatOpen ? 350 : 0);
		const height = window.innerHeight - 8;
		for (let frame = 1; frame <= streams.length; frame++) {
			const row = Math.ceil(streams.length / frame);
			let maxWidth = Math.floor(width / frame);
			let maxHeight = Math.floor(height / row);

			// aspect-ratio: 16 / 9
			if ((maxWidth * 9) / 16 < maxHeight) {
				maxHeight = Math.floor((maxWidth * 9) / 16);
			} else {
				maxWidth = Math.floor((maxHeight * 16) / 9);
			}
			if (maxWidth > frameSize.width) {
				setFrameSize({ width: maxWidth, height: maxHeight });
			}
		}
	};

	useEffect(() => {
		handleFrameSize();

		window.addEventListener("resize", handleFrameSize);
		return () => {
			window.removeEventListener("resize", handleFrameSize);
		};
	}, []);
	return (
		<HStack width="100%" height="100dvh" backgroundColor="black" alignItems={"center"} justifyContent={"center"}>
			<SimpleGrid id="streams">
				{streams.length > 0
					? streams.map((stream) => {
							const ref = useRef<HTMLIFrameElement>(null);
							const { type, streamId } = stream;
							const src = createStreamSrc(type, streamId);

							if (!src) return <></>;
							return (
								<Box
									as="iframe"
									ref={ref}
									src={src}
									width={`${frameSize.width}px`}
									height={`${frameSize.height}px`}
									aspectRatio={"16 / 9"}
									allowFullScreen
									// scrolling="no"
									// frameBorder={"0"}
								/>
							);
					  })
					: null}
			</SimpleGrid>
		</HStack>
	);
}

function createStreamSrc(type: StreamType, streamId: string) {
	switch (type) {
		case "chzzk":
			return naver.chzzk.liveUrl(streamId);

		default:
			return undefined;
	}
}

type StreamType = "chzzk" | (string & {});

interface Stream {
	type: StreamType;
	streamId: string;
}
