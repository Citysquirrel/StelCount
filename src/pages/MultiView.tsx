import {
	Box,
	Button,
	Card,
	CardBody,
	CloseButton,
	HStack,
	IconButton,
	Link,
	SimpleGrid,
	Stack,
	Text,
} from "@chakra-ui/react";
import { Dispatch, Fragment, SetStateAction, createRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { naver } from "../lib/functions/platforms";
import { useMultiView } from "../lib/hooks/useMultiView";
import { MultiViewData } from "../lib/types";
import { MdKeyboardDoubleArrowRight } from "react-icons/md";
import { CiStreamOff, CiImageOff } from "react-icons/ci";
import { useResponsive } from "../lib/hooks/useResponsive";
import { useAuth } from "../lib/hooks/useAuth";
import { Image } from "../components/Image";
import { IoReload } from "react-icons/io5";
import { useRecoilState } from "recoil";
import { nowState } from "../lib/Atom";
import { COLOR_CHZZK } from "../lib/constant";

export function MultiView() {
	const refs = useRef(Array.from({ length: 12 }, () => true).map(() => createRef<HTMLIFrameElement>()));
	const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
	const [isInnerChatOpen, setIsInnerChatOpen] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(true);
	const [chatStream, setChatStream] = useState({ streamId: "", name: "" });
	const [streams, setStreams] = useState<Stream[]>([]);
	const { data, isLoading, refetch } = useMultiView();
	const { windowWidth, windowHeight } = useResponsive();
	const len = streams.length;

	const handleFrameSize = () => {
		const WIDTH_PADDING = 4;
		const HEIGHT_PADDING = 4;
		const width = windowWidth - WIDTH_PADDING - (isInnerChatOpen ? 350 : 0);
		const height = windowHeight - HEIGHT_PADDING;

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
		// if (len === 2) fitWidth = fitWidth - 38;
		setFrameSize({ width: fitWidth, height: fitHeight });
	};

	const handleAddStream = (streamId: string | undefined, type: StreamType, uuid: string, name: string) => () => {
		if (!streamId) return;
		setStreams((prev) => [...prev, { streamId, type, uuid, name }]);
	};

	const handleDeleteStream = (uuid: string) => () => {
		setStreams((prev) => {
			const arr = [...prev];
			const idx = arr.findIndex((a) => a.uuid === uuid);
			arr.splice(idx, 1);
			return arr;
		});
	};

	const handleOpenChat = (streamId: string, name: string) => () => {
		setIsInnerChatOpen(true);
		setChatStream({ streamId, name });
	};

	const calcColumns = (len: number) => {
		if (len <= 1) return 1;
		else if (len <= 4) {
			if (isInnerChatOpen && len === 2) return 1;
			return 2;
		} else if (len <= 9) {
			if (isInnerChatOpen && (len === 5 || len === 6)) return 2;
			return 3;
		} else {
			if (isInnerChatOpen && (len === 10 || len === 11 || len === 12)) return 3;
			return 4;
		}
	};

	useEffect(() => {
		handleFrameSize();
	}, [windowWidth, windowHeight, streams, isInnerChatOpen]);

	useEffect(() => {
		if (streams.length === 0) {
			setIsInnerChatOpen(false);
		}
	}, [streams]);

	useEffect(() => {
		document.title = "StelCount - Multiview";
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
			<SideMenu
				isOpen={isMenuOpen}
				setIsOpen={setIsMenuOpen}
				data={data}
				handleAddStream={handleAddStream}
				handleDeleteStream={handleDeleteStream}
				refetch={refetch}
				isLoading={isLoading}
				streams={streams}
			/>
			<HStack alignItems={"center"} justifyContent={"center"} gap={0}>
				<SimpleGrid
					id="streams"
					columns={calcColumns(len)}
					sx={{
						flexGrow: 1,
						height: "100%",
						gap: 0,
					}}
				>
					{streams.length > 0 ? (
						streams.map((stream, idx) => {
							const { type, streamId, uuid, name } = stream;
							const ref = refs.current[idx];
							const src = createStreamSrc(type, streamId);
							const handleRefresh = () => {
								if (ref.current) {
									ref.current.src = ref.current.src;
								}
							};

							if (!src) return <Fragment key={`${idx}-${streamId}`}></Fragment>;
							return (
								<Box position="relative" key={`${streamId}`}>
									<Box
										as="iframe"
										ref={ref}
										src={src}
										width={`${frameSize.width}px`}
										height={`${frameSize.height}px`}
										aspectRatio={"16 / 9"}
										allowFullScreen
										scrolling="no"
										frameBorder={"0"}
									/>
									<Stack
										position="absolute"
										bottom={"48px"}
										right={"20px"}
										backgroundColor={"gray.900"}
										borderRadius={".5rem"}
										padding="12px 24px"
										outline={"1px solid white"}
										transition="all .2s"
										opacity={isMenuOpen ? 1 : 0}
										_hover={{ opacity: 1 }}
									>
										<Button size="sm" colorScheme="green" onClick={handleOpenChat(streamId, name)}>
											채팅 열기
										</Button>
										<Button size="sm" colorScheme="blue" onClick={handleRefresh}>
											새로고침
										</Button>
										<Button size="sm" colorScheme="red" onClick={handleDeleteStream(uuid)}>
											방송 끄기
										</Button>
									</Stack>
								</Box>
							);
						})
					) : (
						<Stack color="white" alignItems={"center"} justifyContent={"center"} width="100%">
							<Text>
								<Box as="span" fontWeight={"bold"}>
									좌측 메뉴
								</Box>
								에서 스텔라를 선택해주세요
							</Text>
							<Text>인증용 확장 프로그램은 준비중이니 조금만 기다려주세요 :&#41;</Text>
							{/* <Text>
								네이버 계정으로 인증 및 을 원하시면{" "}
								<Link href="" isExternal color="blue.500">
									확장 프로그램
								</Link>
								을 이용해보세요
							</Text> */}
						</Stack>
					)}
				</SimpleGrid>
				{isInnerChatOpen ? (
					<Box position="relative">
						<HStack
							position="absolute"
							top={"6px"}
							left={0}
							// backgroundColor={"rgba(7,7,7,0.9)"}
							zIndex={1}
							padding="4px 12px"
						>
							<CloseButton
								size="sm"
								sx={{ color: "white", ":hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
								onClick={() => {
									setIsInnerChatOpen(false);
								}}
							/>
							<Stack flexGrow={1}>
								<Text color={COLOR_CHZZK} fontWeight={"bold"}>
									{chatStream.name}
								</Text>
							</Stack>
						</HStack>
						<Box
							as="iframe"
							src={`${naver.chzzk.liveChatUrl(chatStream.streamId)}`}
							width="350px"
							height="100dvh"
							scrolling="no"
							frameBorder={"0"}
						/>
					</Box>
				) : null}
			</HStack>
		</HStack>
	);
}

function SideMenu({
	isOpen,
	setIsOpen,
	data,
	handleAddStream,
	handleDeleteStream,
	refetch,
	isLoading,
	streams,
}: SideMenuProps) {
	const WIDTH = 320;
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
					zIndex: 10,
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
					// padding: "0px 12px 12px 12px",
					transform: isOpen ? `translateX(0px)` : `translateX(-${WIDTH}px)`,
					transition: "all .3s",
					overflowY: "auto",
					zIndex: 11,
				}}
			>
				<HStack position="sticky" top={0} left={0} backgroundColor={"rgba(7,7,7,0.9)"} zIndex={1} padding="4px 12px">
					<Stack flexGrow={1}>
						<Text fontSize="0.875rem" fontWeight={"bold"} userSelect={"none"}>
							멀티뷰(Beta)
						</Text>
					</Stack>
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
				<Stack gap="12px" padding="0 12px 24px 12px">
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
			onClick={
				isSelected ? handleDeleteStream(uuid) : handleAddStream(chzzkId, "chzzk", uuid, channelName || "알 수 없음")
			}
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
						<Text color={COLOR_CHZZK} fontWeight={"bold"} fontSize={"0.75em"}>
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
	const d = String(date.getDate()).padStart(2, "0");

	return `${mon}-${d} ${h}:${m}`;
}

type StreamType = "chzzk" | (string & {});
type ImageSize = "160" | "320" | "480" | "640" | "720" | "1280" | "1920" | (string & {});
interface Stream {
	type: StreamType;
	name: string;
	streamId: string;
	uuid: string;
}

interface SideMenuProps {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	data: MultiViewData[];
	handleAddStream: (streamId: string | undefined, type: StreamType, uuid: string, name: string) => () => void;
	handleDeleteStream: (uuid: string) => () => void;
	refetch: (isTimer?: boolean) => void;
	isLoading: boolean;
	streams: Stream[];
}

interface MenuCardProps {
	item: MultiViewData;
	itemIdx: number;
	handleAddStream: (streamId: string | undefined, type: StreamType, uuid: string, name: string) => () => void;
	handleDeleteStream: (uuid: string) => () => void;
}

interface MenuCardImageProps {
	liveImageUrl: string | undefined;
	openLive: boolean | undefined;
}
