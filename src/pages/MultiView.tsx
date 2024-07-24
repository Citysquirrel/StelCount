import { Box, CloseButton, HStack, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { Fragment, SetStateAction, useEffect, useLayoutEffect, useRef, useState } from "react";
import { naver } from "../lib/functions/platforms";
import { useMultiView } from "../lib/hooks/useMultiView";
import { MultiViewData } from "../lib/types";
import { MdKeyboardDoubleArrowRight } from "react-icons/md";
import { useConsole } from "../lib/hooks/useConsole";
import { useResponsive } from "../lib/hooks/useResponsive";
import { useAuth } from "../lib/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export function MultiView() {
	const navigate = useNavigate();
	const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
	const [isInnerChatOpen, setIsInnerChatOpen] = useState(false);
	const [streams, setStreams] = useState<Stream[]>([]);
	const { data } = useMultiView();
	const { windowWidth, windowHeight } = useResponsive();
	const { isAdmin } = useAuth();

	const handleFrameSize = () => {
		const width = windowWidth - 8 - (isInnerChatOpen ? 350 : 0);
		const height = windowHeight - 8;
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

	const handleAddStream = (streamId: string, type: StreamType) => () => {
		setStreams((prev) => [...prev, { streamId, type }]);
	};

	useEffect(() => {
		handleFrameSize();
	}, [windowWidth, windowHeight, streams]);

	useLayoutEffect(() => {
		if (!isAdmin) {
			alert("테스트 중인 페이지입니다.");
			navigate("/");
		}
	}, []);

	return (
		<HStack
			position="relative"
			width="100%"
			height="100dvh"
			backgroundColor="black"
			alignItems={"center"}
			justifyContent={"center"}
		>
			<SideMenu data={data} handleAddStream={handleAddStream} />
			<Stack
				id="streams"
				sx={{
					flexGrow: 1,
					flexWrap: "wrap",
					alignItems: "center",
					justifyContent: "center",
					alignContent: "center",
					width: "min-content",
					height: "100%",
				}}
			>
				{streams.length > 0
					? streams.map((stream, idx) => {
							// const ref = useRef<HTMLIFrameElement>(null);
							const { type, streamId } = stream;
							const src = createStreamSrc(type, streamId);

							if (!src) return <Fragment key={`${idx}-${streamId}`}></Fragment>;
							return (
								<Box
									key={`${idx}-${streamId}`}
									as="iframe"
									// ref={ref}
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
			</Stack>
		</HStack>
	);
}

function SideMenu({ data, handleAddStream }: SideMenuProps) {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<>
			<Stack
				sx={{
					position: "absolute",
					top: 0,
					left: 0,
					alignItems: "center",
					justifyContent: "center",
					width: "24px",
					height: "100%",
					color: "white",
					transition: "all .25s",
					opacity: 0,
					cursor: "pointer",
					":hover": { backgroundColor: "rgba(127,127,127,.5)", opacity: 1 },
				}}
				onClick={() => {
					setIsOpen(true);
				}}
			>
				<MdKeyboardDoubleArrowRight />
			</Stack>
			<Stack
				sx={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "240px",
					height: "100%",
					color: "white",
					backgroundColor: "rgb(7,7,7)",
					padding: "8px",
					transform: isOpen ? `translateX(0px)` : `translateX(-240px)`,
					transition: "all .3s",
				}}
			>
				<HStack>
					<Stack flexGrow={1}></Stack>
					<CloseButton
						size="sm"
						sx={{ ":hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
						onClick={() => {
							setIsOpen(false);
						}}
					/>
				</HStack>

				<Stack>
					{data.length > 0
						? data.map((item, idx) => {
								const {
									name,
									chzzkId,
									uuid,
									colorCode,
									channelName,
									channelImageUrl,
									liveCategoryValue,
									liveTitle,
									liveImageUrl,
									openLive,
									openDate,
									closeDate,
								} = item;
								if (!chzzkId) return <Fragment key={`${idx}-${chzzkId}`}></Fragment>;
								return (
									<Stack
										key={`${idx}-${chzzkId}`}
										sx={{
											borderRadius: ".25rem",
											background: `linear-gradient(115deg, #${colorCode}44, rgba(18,18,18,0.5) 55.71%)`,
										}}
										onClick={handleAddStream(chzzkId, "chzzk")}
									>
										<Text>{name}</Text>
									</Stack>
								);
						  })
						: null}
				</Stack>
			</Stack>
		</>
	);
}

//? Function

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

interface SideMenuProps {
	data: MultiViewData[];
	handleAddStream: (streamId: string, type: StreamType) => () => void;
}
