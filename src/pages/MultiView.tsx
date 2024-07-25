import { Box, Card, CardBody, CloseButton, HStack, IconButton, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { Fragment, SetStateAction, useEffect, useLayoutEffect, useRef, useState } from "react";
import { naver } from "../lib/functions/platforms";
import { useMultiView } from "../lib/hooks/useMultiView";
import { MultiViewData } from "../lib/types";
import { MdKeyboardDoubleArrowRight } from "react-icons/md";
import { CiStreamOff, CiImageOff } from "react-icons/ci";
import { useResponsive } from "../lib/hooks/useResponsive";
import { useAuth } from "../lib/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Image } from "../components/Image";
import { IoReload } from "react-icons/io5";
import { useRecoilState } from "recoil";
import { nowState } from "../lib/Atom";

export function MultiView() {
	const navigate = useNavigate();
	const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
	const [isInnerChatOpen, setIsInnerChatOpen] = useState(false);
	const [streams, setStreams] = useState<Stream[]>([]);
	const { data, isLoading, refetch } = useMultiView();
	const { windowWidth, windowHeight } = useResponsive();
	const { isAdmin } = useAuth();
	const len = streams.length;

	const handleFrameSize = () => {
		const width = windowWidth - 4 - (isInnerChatOpen ? 350 : 0);
		const height = windowHeight - 4;

		let fitWidth = 0;
		let fitHeight = 0;

		for (let frame = 1; frame <= len; frame++) {
			const row = Math.ceil(len / frame);
			let maxWidth = Math.floor(width / frame);
			let maxHeight = Math.floor(height / row);

			// aspect-ratio: 16 / 9
			if ((maxWidth * 9) / 16 < maxHeight) {
				maxHeight = Math.floor((maxWidth * 9) / 16);
			} else {
				maxWidth = Math.floor((maxHeight * 16) / 9);
			}
			if (maxWidth > fitWidth) {
				fitWidth = maxWidth;
				fitHeight = maxHeight;
			}
		}
		setFrameSize({ width: fitWidth, height: fitHeight });
	};

	const handleAddStream = (streamId: string | undefined, type: StreamType, uuid: string) => () => {
		if (!streamId) return;
		setStreams((prev) => [...prev, { streamId, type, uuid }]);
	};

	const handleDeleteStream = (uuid: string) => () => {
		setStreams((prev) => {
			const arr = [...prev];
			const idx = arr.findIndex((a) => a.uuid === uuid);
			arr.splice(idx, 1);
			return arr;
		});
	};

	const calcColumns = (len: number) => {
		if (len <= 1) return 1;
		else if (len <= 4) return 2;
		else if (len <= 9) return 3;
		else return 4;
	};

	useEffect(() => {
		handleFrameSize();
	}, [windowWidth, windowHeight, streams]);

	if (!isAdmin) return <></>;
	return (
		<HStack
			position="relative"
			width="100%"
			height="100dvh"
			backgroundColor="black"
			alignItems={"center"}
			justifyContent={"center"}
		>
			<SideMenu
				data={data}
				handleAddStream={handleAddStream}
				handleDeleteStream={handleDeleteStream}
				refetch={refetch}
				isLoading={isLoading}
				streams={streams}
			/>
			<Stack alignItems={"center"} justifyContent={"center"}>
				<SimpleGrid
					id="streams"
					columns={calcColumns(len)}
					sx={{
						flexGrow: 1,
						flexWrap: "wrap",
						height: "100%",
						placeItems: "center",
						gap: 0,
					}}
				>
					{streams.length > 0 ? (
						streams.map((stream, idx) => {
							// const ref = useRef<HTMLIFrameElement>(null);
							const { type, streamId } = stream;
							const src = createStreamSrc(type, streamId);

							if (!src) return <Fragment key={`${idx}-${streamId}`}></Fragment>;
							return (
								<Box
									key={`${streamId}`}
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
					) : (
						<Stack alignItems={"center"} justifyContent={"center"} width="100%">
							<Text color="white">
								<Box as="span" fontWeight={"bold"}>
									좌측 메뉴
								</Box>
								에서 스텔라를 선택해주세요
							</Text>
						</Stack>
					)}
				</SimpleGrid>
			</Stack>
		</HStack>
	);
}

function SideMenu({ data, handleAddStream, handleDeleteStream, refetch, isLoading, streams }: SideMenuProps) {
	const WIDTH = 320;
	const [isOpen, setIsOpen] = useState(true);
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
					width: `${WIDTH}px`,
					height: "100%",
					color: "white",
					backgroundColor: "rgb(7,7,7)",
					padding: "0px 12px 12px 12px",
					transform: isOpen ? `translateX(0px)` : `translateX(-${WIDTH}px)`,
					transition: "all .3s",
					overflowY: "auto",
				}}
			>
				<HStack position="sticky" top={0} left={0} backgroundColor={"rgb(7,7,7)"} zIndex={1} paddingBlock={"4px"}>
					<Stack flexGrow={1}></Stack>
					<IconButton
						boxSize={"24px"}
						minWidth="auto"
						padding="0"
						fontSize={"0.825rem"}
						variant={"ghost"}
						icon={<IoReload />}
						aria-label="reload"
						isDisabled={isLoading}
						onClick={() => {
							refetch(true);
						}}
						sx={{ color: "white", ":hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
					/>
					<CloseButton
						size="sm"
						sx={{ ":hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
						onClick={() => {
							setIsOpen(false);
						}}
					/>
				</HStack>

				<Stack gap="12px">
					{data.length > 0
						? data.map((item, idx) => {
								const chzzkId = item.chzzkId;
								const uuid = item.uuid;
								const itemIdx = streams.findIndex((a) => a.uuid === uuid);
								if (!chzzkId) return <Fragment key={`${idx}-${chzzkId}`}></Fragment>;
								return (
									<MenuCard
										key={`${idx}-${chzzkId}`}
										item={item}
										itemIdx={itemIdx}
										handleAddStream={handleAddStream}
										handleDeleteStream={handleDeleteStream}
									/>
								);
						  })
						: null}
				</Stack>
			</Stack>
		</>
	);
}

function MenuCard({ item, itemIdx, handleAddStream, handleDeleteStream }: MenuCardProps) {
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

	const isSelected = itemIdx !== -1;

	return (
		<Card
			sx={{
				borderRadius: ".25rem",
				background: `linear-gradient(115deg, ${colorCode ? `#${colorCode}77` : "#aaaaaa77"}, rgba(18,18,18,.5) 45.71%)`,
				cursor: "pointer",
				transition: "all .3s",
				userSelect: "none",
				outline: isSelected ? "1px solid white" : undefined,
				":hover": {
					background: `linear-gradient(115deg, ${colorCode ? `#${colorCode}` : "#aaaaaa"}, rgba(18,18,18,1) 45.71%)`,
				},
			}}
			onClick={isSelected ? handleDeleteStream(uuid) : handleAddStream(chzzkId, "chzzk", uuid)}
		>
			<CardBody display={"flex"} padding="12px" color="white" fontSize="1rem" flexDir={"column"} gap="8px">
				<HStack>
					<MenuCardImage liveImageUrl={liveImageUrl} openLive={openLive} />
					<Stack flex="1 0 50%" height="100%">
						<HStack>
							<Image
								src={`${channelImageUrl}?type=f60_60_na` || ""}
								objectFit={"cover"}
								boxSize="24px"
								borderRadius={"full"}
								filter={openLive ? undefined : "grayscale(1)"}
							/>
							<Text fontSize="0.75em" fontWeight={"bold"} color={openLive ? undefined : "gray.400"}>
								{channelName}
							</Text>
						</HStack>
						<Text color="#00ffa3" fontWeight={"bold"} fontSize={"0.75em"}>
							{liveCategoryValue || "　"}
						</Text>
						<Text color="gray.500" fontSize="0.65em">
							{openLive ? modDateText(openDate) + " 시작" : modDateText(closeDate) + " 종료"}
						</Text>
					</Stack>
				</HStack>
				<Stack>
					<Text fontSize="0.825em" color={openLive ? undefined : "gray.500"}>
						{openLive ? liveTitle : "방송 종료됨"}
					</Text>
				</Stack>
			</CardBody>
		</Card>
	);
}

function MenuCardImage({ liveImageUrl, openLive }: MenuCardImageProps) {
	const [now] = useRecoilState(nowState);

	return (
		<Stack flex="1 0 50%">
			{openLive ? (
				<Image
					src={modImageUrl(liveImageUrl + `?t=${now.getTime()}`, "320")}
					height="72px"
					objectFit={"cover"}
					borderRadius={".5rem"}
					transition="all .3s"
					_hover={{ transform: "scale(1.5) translate(20px,9px)" }}
				/>
			) : (
				<Stack
					height={"72px"}
					borderRadius={".5rem"}
					backgroundColor={"black"}
					fontSize="1.25em"
					alignItems={"center"}
					justifyContent={"center"}
				>
					<CiStreamOff />
				</Stack>
			)}
		</Stack>
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

function modImageUrl(liveImageUrl: string | undefined, size?: ImageSize) {
	if (!liveImageUrl) return "";
	return liveImageUrl.replace("{type}", size || "160");
}

function modDateText(streamDate: string | undefined) {
	if (!streamDate) return "";
	const date = new Date(streamDate);
	const h = String(date.getHours()).padStart(2, "0");
	const m = String(date.getMinutes()).padStart(2, "0");
	const mon = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDay()).padStart(2, "0");

	return `${mon}-${day} ${h}:${m}`;
}

type StreamType = "chzzk" | (string & {});
type ImageSize = "160" | "320" | "480" | "640" | "720" | "1280" | "1920" | (string & {});
interface Stream {
	type: StreamType;
	streamId: string;
	uuid: string;
}

interface SideMenuProps {
	data: MultiViewData[];
	handleAddStream: (streamId: string | undefined, type: StreamType, uuid: string) => () => void;
	handleDeleteStream: (uuid: string) => () => void;
	refetch: (isTimer?: boolean) => void;
	isLoading: boolean;
	streams: Stream[];
}

interface MenuCardProps {
	item: MultiViewData;
	itemIdx: number;
	handleAddStream: (streamId: string | undefined, type: StreamType, uuid: string) => () => void;
	handleDeleteStream: (uuid: string) => () => void;
}

interface MenuCardImageProps {
	liveImageUrl: string | undefined;
	openLive: boolean | undefined;
}
