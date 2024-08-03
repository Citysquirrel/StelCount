import {
	Box,
	Button,
	ButtonGroup,
	Card,
	CardBody,
	CloseButton,
	FormControl,
	FormLabel,
	HStack,
	IconButton,
	Link,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	SimpleGrid,
	Stack,
	Switch,
	Text,
	useDisclosure,
} from "@chakra-ui/react";
import { Dispatch, Fragment, SetStateAction, createRef, useEffect, useRef, useState } from "react";
import { naver } from "../lib/functions/platforms";
import { useMultiView } from "../lib/hooks/useMultiView";
import { MultiViewData, UserSettingStorage } from "../lib/types";
import { MdKeyboardDoubleArrowRight, MdOpenInNew } from "react-icons/md";
import { CiStreamOff } from "react-icons/ci";
import { useResponsive } from "../lib/hooks/useResponsive";
import { Image } from "../components/Image";
import { IoHome, IoList, IoReload, IoSettings } from "react-icons/io5";
import { useRecoilState } from "recoil";
import { nowState } from "../lib/Atom";
import {
	COLOR_CHZZK,
	PRIVACY_POLICY_URL,
	CHROME_EXTENSION_URL,
	CHROME_EXTENSION_ID,
	CHROME_EXTENSION_GITHUB_URL,
	USER_SETTING_STORAGE,
} from "../lib/constant";
import { useKeyBind } from "../lib/hooks/useKeyBind";
import { useExtensionCheck } from "../lib/hooks/useExtensionCheck";
import { Spacing } from "../components/Spacing";
import { useLocalStorage } from "usehooks-ts";
import { useConsole } from "../lib/hooks/useConsole";
import { useSearchParams } from "react-router-dom";

export function MultiView() {
	const refs = useRef(Array.from({ length: 12 }, () => true).map(() => createRef<HTMLIFrameElement>()));
	const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
	const [isInnerChatOpen, setIsInnerChatOpen] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(true);
	const [chatStream, setChatStream] = useState({ streamId: "", name: "" });
	const [streams, setStreams] = useState<Stream[]>([]);
	const [configState, setConfigState] = useState<ConfigState>({ chatToLeft: false });
	const { data, isLoading, refetch, intervalRef } = useMultiView();
	const { windowWidth, windowHeight } = useResponsive();
	const { isExtensionInstalled, isLatestVersion } = useExtensionCheck(CHROME_EXTENSION_ID, "1.1.0");
	const [searchParams] = useSearchParams();
	const query = searchParams.get("query");
	const { isOpen: isSettingOpen, onToggle: handleToggleSetting, onClose: handleCloseSetting } = useDisclosure();
	const len = streams.length;

	const handleQuery = (query: string | null) => {
		if (!query) return;
		if (data.length === 0) return;

		let storage: Stream[] = [];
		const streamIds = query.split(",");
		for (let streamId of streamIds) {
			const idx = data.findIndex((s) => s.chzzkId === streamId);
			if (idx !== -1) {
				const { channelName, uuid } = data[idx];
				storage.push({ type: "chzzk", streamId, name: channelName || "", uuid });
			}
		}

		setStreams(storage);
	};

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

	const handleOpenChat = (streamId: string, name: string, openInNewWindow?: boolean) => () => {
		if (openInNewWindow) {
			openChatInNewWindow(streamId);
		} else {
			setIsInnerChatOpen(true);
			setChatStream({ streamId, name });
		}
	};

	const handleOpenMenu = () => {
		setIsMenuOpen(true);
		// clearInterval(intervalRef.current);
		refetch();
		intervalRef.current = setInterval(() => {
			refetch(true);
		}, 30000);
	};

	const handleCloseMenu = () => {
		setIsMenuOpen(false);
		clearInterval(intervalRef.current);
		// intervalRef.current = setInterval(() => {
		// 	refetch(true);
		// }, 60000);
		handleCloseSetting();
	};

	const handleOpenChatInNewWindow = (streamId: string | undefined) => () => {
		openChatInNewWindow(streamId);
		setIsInnerChatOpen(false);
		setChatStream({ streamId: "", name: "" });
	};

	const handleChangeChatStream = (streamId: string, name: string) => () => {
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

	useKeyBind({
		Escape: handleCloseMenu,
	});

	useEffect(() => {
		document.title = "StelCount - Multiview";
	}, []);

	useEffect(() => {
		if (query) handleQuery(query);
	}, [data]);

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
				data={data}
				handleAddStream={handleAddStream}
				handleDeleteStream={handleDeleteStream}
				handleOpen={handleOpenMenu}
				handleClose={handleCloseMenu}
				configState={configState}
				setConfigState={setConfigState}
				isSettingOpen={isSettingOpen}
				handleToggleSetting={handleToggleSetting}
				handleCloseSetting={handleCloseSetting}
				refetch={refetch}
				isLoading={isLoading}
				streams={streams}
			/>
			<HStack
				alignItems={"center"}
				justifyContent={"center"}
				gap={0}
				flexDirection={configState.chatToLeft ? "row-reverse" : "row"}
			>
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
										<ButtonGroup size="sm" isAttached colorScheme="green">
											<Button onClick={handleOpenChat(streamId, name)}>채팅</Button>
											<IconButton
												onClick={handleOpenChat(streamId, name, true)}
												icon={<MdOpenInNew />}
												aria-label="open-chat-in-new-tab"
											/>
										</ButtonGroup>
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
						<Stack color="white" justifyContent={"center"} width="100%">
							<Text>
								<Box as="span" fontWeight={"bold"}>
									좌측 메뉴
								</Box>
								에서 스텔라를 선택해주세요
							</Text>
							<Text>스텔라 이외의 타 스트리머에 대한 멀티뷰는 지원하지 않습니다!</Text>
							{isExtensionInstalled ? (
								isLatestVersion ? (
									<Text>확장 프로그램이 성공적으로 실행되었습니다</Text>
								) : (
									<Text>확장 프로그램을 최신버전으로 업데이트 해주세요</Text>
								)
							) : (
								<Text>
									네이버 계정으로 인증 및 채팅을 원하시면{" "}
									<Link href={CHROME_EXTENSION_URL} isExternal color="blue.500">
										확장 프로그램
									</Link>
									을 이용해보세요
								</Text>
							)}
							<Spacing size={4} />
							<Text fontSize="sm">
								<Link href={CHROME_EXTENSION_GITHUB_URL} isExternal>
									Extension Github
								</Link>
								&nbsp;|&nbsp;
								<Link href={PRIVACY_POLICY_URL} isExternal>
									개인정보처리방침
								</Link>
							</Text>
						</Stack>
					)}
				</SimpleGrid>
				{isInnerChatOpen ? (
					<Box position="relative" userSelect={"none"} overflow="hidden">
						{/* 채팅 컨트롤러 */}
						<HStack
							flexDir={"row-reverse"}
							position="absolute"
							top={"6px"}
							left={"24px"}
							width="280px"
							justifyContent={"center"}
							backgroundColor={"#141517"}
							borderRadius={".5rem"}
							padding="4px 12px"
							zIndex={1}
							gap="2px"
						>
							<CloseButton
								size="sm"
								sx={{ color: "white", ":hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
								onClick={() => {
									setIsInnerChatOpen(false);
								}}
							/>
							<IconButton
								boxSize={"24px"}
								minWidth="auto"
								padding="0"
								fontSize={"0.825rem"}
								variant={"ghost"}
								icon={<MdOpenInNew />}
								aria-label="chat-open-in-new"
								onClick={handleOpenChatInNewWindow(chatStream.streamId)}
								sx={{
									color: "white",
									_hover: { backgroundColor: "rgba(255,255,255,0.1)" },
								}}
							/>
							<Spacing size={8} direction="horizontal" />
							<Stack>
								<Text color={COLOR_CHZZK} fontWeight={"bold"}>
									{chatStream.name}
								</Text>
							</Stack>
							<Spacing size={8} direction="horizontal" />
							{data.length > 0 ? (
								<Menu>
									<MenuButton
										as={IconButton}
										aria-label="chat-list-menu"
										icon={<IoList />}
										variant={"ghost"}
										boxSize={"24px"}
										minWidth="auto"
										padding="0"
										fontSize={"0.825rem"}
										sx={{
											color: "white",
											_hover: { backgroundColor: "rgba(255,255,255,0.1)" },
											_active: { backgroundColor: "rgba(255,255,255,0.5)" },
										}}
									/>
									<MenuList
										sx={{
											minWidth: "120px",
											padding: "4px 0",
											fontSize: "sm",
											color: "white",
											backgroundColor: "rgba(35,35,35,0.9)",
											borderColor: "rgba(0,0,0,0.9)",
										}}
									>
										{data
											.filter((s) => s.chzzkId && s.chzzkId !== chatStream.streamId)
											.sort(sortByChannelName)
											.map((s) => (
												<MenuItem
													key={s.chzzkId}
													sx={{
														color: s.openLive ? `#${s.colorCode}` : "rgba(147,147,147)",
														backgroundColor: "rgba(35,35,35,0.5)",
														_hover: { backgroundColor: "rgba(0,0,0,0.5)" },
													}}
													onClick={handleChangeChatStream(s.chzzkId || "", s.channelName || "")}
												>
													{s.channelName}
												</MenuItem>
											))}
									</MenuList>
								</Menu>
							) : null}
						</HStack>
						{/* 채팅 IFRAME 시작 */}
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
	data,
	handleAddStream,
	handleDeleteStream,
	handleOpen,
	handleClose,
	configState,
	setConfigState,
	isSettingOpen,
	handleToggleSetting,
	handleCloseSetting,
	refetch,
	isLoading,
	streams,
}: SideMenuProps) {
	const WIDTH = 320;
	const CONFIG_HEIGHT = 92;
	const [userSetting, setUserSetting] = useLocalStorage<UserSettingStorage>(USER_SETTING_STORAGE, {});

	const configDict: ConfigDict[] = [
		{
			name: "chatToLeft",
			label: "채팅창 위치 좌측으로",
		},
	];

	const handleRefresh = () => {
		refetch(true);
	};

	const handleConfig = (name: keyof ConfigState) => (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.checked;
		setConfigState((prev) => ({ ...prev, [name]: value }));
		setUserSetting((prev) => ({ ...prev, [name]: value }));
	};

	const handleOpenHome = () => {
		window.open("/home", "_blank");
	};

	useEffect(() => {
		if (userSetting.chatToLeft) {
			const { chatToLeft } = userSetting;
			setConfigState((prev) => ({ ...prev, chatToLeft }));
		}
	}, []);

	return (
		<>
			<Stack
				sx={{
					position: "absolute",
					top: 0,
					left: 0,
					alignItems: "center",
					justifyContent: "center",
					width: "32px",
					height: "100%",
					color: "white",
					transition: "all .25s",
					opacity: 0,
					cursor: "pointer",
					zIndex: 10,
					":hover": { backgroundColor: "rgba(127,127,127,.5)", opacity: 1 },
				}}
				onClick={handleOpen}
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
					gap: "0",
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
						icon={<IoHome />}
						aria-label="home"
						onClick={handleOpenHome}
						sx={{
							color: "white",
							_hover: { backgroundColor: "rgba(255,255,255,0.1)" },
						}}
					/>
					<IconButton
						boxSize={"24px"}
						minWidth="auto"
						padding="0"
						fontSize={"0.825rem"}
						variant={"ghost"}
						icon={<IoSettings />}
						aria-label="setting"
						onClick={handleToggleSetting}
						isActive={isSettingOpen}
						sx={{
							color: "white",
							_hover: { backgroundColor: "rgba(255,255,255,0.1)" },
							_active: { backgroundColor: "rgba(255,255,255,0.5)" },
						}}
					/>
					<IconButton
						boxSize={"24px"}
						minWidth="auto"
						padding="0"
						fontSize={"0.825rem"}
						variant={"ghost"}
						icon={<IoReload />}
						aria-label="reload"
						isDisabled={isLoading}
						onClick={handleRefresh}
						sx={{ color: "white", ":hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
					/>
					<CloseButton
						size="sm"
						sx={{ ":hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
						onClick={handleClose}
					/>
				</HStack>
				<Stack gap="12px" padding="8px 12px 24px 12px" overflowY="auto">
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
				<Stack
					position="relative"
					backgroundColor={"rgba(7,7,7,0.9)"}
					zIndex={1}
					width="100%"
					minHeight={isSettingOpen ? `${CONFIG_HEIGHT}px` : "0px"}
					maxHeight={isSettingOpen ? `${CONFIG_HEIGHT}px` : "0px"}
					gap={0}
					transition="all .3s"
					overflowY="hidden"
				>
					<HStack padding="4px" position="relative">
						<Stack flexGrow={1} alignItems={"center"} padding="4px">
							<Text fontSize={"sm"}>설정</Text>
						</Stack>

						<CloseButton position="absolute" top={0} right={0} onClick={handleCloseSetting} />
					</HStack>
					<Stack padding="12px">
						{configDict.map((c) => {
							const { label, name } = c;
							return (
								<FormControl key={name} display="flex" alignItems="center" justifyContent={"space-between"} gap={0}>
									<FormLabel htmlFor={name} mb="0" flexGrow={1} margin={0} paddingRight="8px">
										{label}
									</FormLabel>
									<Switch id={name} isChecked={configState[name]} onChange={handleConfig(name)} />
								</FormControl>
							);
						})}
					</Stack>
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
				{isSelected ? <MenuCardNumber number={itemIdx + 1} /> : null}
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

function MenuCardNumber({ number }: { number: number }) {
	return (
		<Stack
			position="absolute"
			top={"4px"}
			right="4px"
			boxSize="18px"
			borderRadius={"full"}
			color={"black"}
			backgroundColor={"white"}
			alignItems={"center"}
			justifyContent={"center"}
		>
			<Text fontSize="xs" fontWeight={"bold"}>
				{number}
			</Text>
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

function openChatInNewWindow(streamId: string | undefined) {
	if (!streamId) return;
	return window.open(naver.chzzk.liveChatUrl(streamId), "_blank", "width=400, height=580");
}

const sortOrderDict = [
	"아이리 칸나",
	"아야츠노 유니",
	"시라유키 히나",
	"네네코 마시로",
	"아카네 리제",
	"아라하시 타비",
	"텐코 시부키",
	"아오쿠모 린",
	"하나코 나나",
	"유즈하 리코",
	"강지",
	"이브",
];

function sortByChannelName(a: MultiViewData, b: MultiViewData): number {
	const A = sortOrderDict.findIndex((k) => k === a.channelName);
	const B = sortOrderDict.findIndex((k) => k === b.channelName);
	return A - B;
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
	data: MultiViewData[];
	handleAddStream: (streamId: string | undefined, type: StreamType, uuid: string, name: string) => () => void;
	handleDeleteStream: (uuid: string) => () => void;
	handleOpen: () => void;
	handleClose: () => void;
	configState: ConfigState;
	setConfigState: Dispatch<SetStateAction<ConfigState>>;
	isSettingOpen: boolean;
	handleToggleSetting: () => void;
	handleCloseSetting: () => void;
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

interface ConfigState {
	chatToLeft: boolean;
}

interface ConfigDict {
	name: keyof ConfigState;
	label: string;
}
