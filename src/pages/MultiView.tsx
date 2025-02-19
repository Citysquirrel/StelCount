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
	NumberInput,
	NumberInputField,
	NumberInputStepper,
	NumberIncrementStepper,
	NumberDecrementStepper,
	Stack,
	Switch,
	Text,
	useDisclosure,
	Slider,
	SliderTrack,
	SliderFilledTrack,
	SliderThumb,
	Tooltip,
	InputGroup,
	Input,
	Avatar,
	AvatarBadge,
	IconButtonProps,
	BoxProps,
	SimpleGrid,
	SimpleGridProps,
	BackgroundProps,
	StackProps,
	RadioGroup,
	Radio,
	StackDivider,
} from "@chakra-ui/react";
import { Dispatch, Fragment, SetStateAction, createRef, useEffect, useRef, useState } from "react";
import { naver } from "../lib/functions/platforms";
import { useMultiView } from "../lib/hooks/useMultiView";
import { CustomStreamsForUS, MultiViewData, UserSettingStorage } from "../lib/types";
import { MdClear, MdKeyboardDoubleArrowRight, MdOpenInNew, MdRefresh, MdSearch, MdStar } from "react-icons/md";
import { CiExport, CiImport, CiStreamOff } from "react-icons/ci";
import { TbForbid, TbResize } from "react-icons/tb";
import { useResponsive } from "../lib/hooks/useResponsive";
import { Image } from "../components/Image";
import { IoHome, IoList, IoPeople, IoReload, IoSettings } from "react-icons/io5";
import { useRecoilState } from "recoil";
import { nowState } from "../lib/Atom";
import {
	COLOR_CHZZK,
	PRIVACY_POLICY_URL,
	CHROME_EXTENSION_URL,
	CHROME_EXTENSION_ID,
	CHROME_EXTENSION_GITHUB_URL,
	USER_SETTING_STORAGE,
	FIREFOX_EXTENSION_URL,
} from "../lib/constant";
import { useKeyBind } from "../lib/hooks/useKeyBind";
import { useExtensionCheck } from "../lib/hooks/useExtensionCheck";
import { Spacing } from "../components/Spacing";
import { useLocalStorage } from "usehooks-ts";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getBrowserInfo, lightenColor } from "../lib/functions/etc";
import { LoadingCircle } from "../components/Loading";
import { fetchServer } from "../lib/functions/fetch";
import { createComponentMap } from "../lib/functions/createComponent";
import { v4 } from "uuid";
import { useAuth } from "../lib/hooks/useAuth";
import { useHotkeys } from "react-hotkeys-hook";
import { useConfirmOnExit } from "../lib/hooks/useConfirmOnExit";
import * as Hangul from "hangul-js";
import { UserSettingModal } from "./MultiView/UserSetting";
import { useConsoleAdmin } from "../lib/hooks/useConsole";
import { useWebSocket } from "../lib/hooks/useWebSocket";

export function MultiView() {
	const navigate = useNavigate();
	const refs = useRef(Array.from({ length: 12 }, () => true).map(() => createRef<HTMLIFrameElement>()));
	const chatRef = useRef<HTMLIFrameElement>(null);
	const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
	const [frameColumns, setFrameColumns] = useState(1);
	const [isInnerChatOpen, setIsInnerChatOpen] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(true);
	const [chatStream, setChatStream] = useState({ streamId: "", name: "" });
	const [streams, setStreams] = useState<Stream[]>([]);
	const [configState, setConfigState] = useState<ConfigState>({
		chatToLeft: false,
		listOpenerWidth: "32",
		controllerPos: "right-bottom",
	});
	const [isBukiUsingFirefox, setIsBukiUsingFirefox] = useState(true);
	const {
		data,
		customStreams,
		setCustomStreams,
		isLoading,
		isCustomLoading,
		refetch,
		intervalRef,
		refetchCustom,
		customIntervalRef,
	} = useMultiView();
	const { enableConfirmOnExit, disableConfirmOnExit } = useConfirmOnExit(true);
	const { windowWidth, windowHeight } = useResponsive();
	const { isExtensionInstalled, isLatestVersion } = useExtensionCheck(CHROME_EXTENSION_ID, "1.1.0");
	const [searchParams, setSearchParams] = useSearchParams();
	const STREAMS_PARAM_NAME = "streams";
	const PARAMS_DELIMITER = "--";
	const INNER_CHAT_WIDTH = 350;
	const streamsParam = searchParams.get(STREAMS_PARAM_NAME);
	const {
		isOpen: isSettingOpen,
		onToggle: handleToggleSetting,
		onClose: handleCloseSetting,
		onOpen: handleOpenSetting,
	} = useDisclosure();
	const len = streams.length;

	const [userSetting, setUserSetting] = useLocalStorage<UserSettingStorage>(USER_SETTING_STORAGE, {});
	const [remotePos, setRemotePos] = useState({ x: 0, y: 0 });

	const handleStreamsParam = (params: string | null) => {
		if (!params) return;
		if (data.length === 0) return;

		let storage: Stream[] = [];
		const streamIds = params.split(PARAMS_DELIMITER).filter((s) => s);
		const mergedData = [...data, ...customStreams];
		for (let streamId of streamIds) {
			const idx = mergedData.findIndex((s) => s.chzzkId === streamId);
			if (idx !== -1) {
				const { channelName, uuid } = mergedData[idx];
				if (storage.findIndex((stream) => stream.streamId === streamId) === -1) {
					// 중복검사
					storage.push({ type: "chzzk", streamId, name: channelName || "", uuid });
				}
			} else {
				if (storage.findIndex((stream) => stream.streamId === streamId) === -1) {
					// 중복검사
					storage.push({ type: "chzzk", streamId, name: "", uuid: v4() });
				}
			}
		}
		setStreams(storage);
	};

	const handleFrameSize = () => {
		//TODO: iframe에 영향을 덜 주기 위해 직접 크기를 조정하는 방식을 버리고
		//TODO: grid를 이용해 자동으로 크기 조절이 되도록 하는 방식 고려
		//TODO: custom grid 방식을 이용해 각 화면 크기가 통일되지 않고 자유자재로 변할 수 있도록 하는 방식 고려
		const WIDTH_PADDING = 4; // padding은 그대로 유지
		const HEIGHT_PADDING = 4; // padding은 그대로 유지
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
		setFrameSize({ width: fitWidth, height: fitHeight });
	};

	const handleAddStream = (streamId: string | undefined, type: StreamType, uuid: string, name: string) => () => {
		if (!streamId) return;
		setStreams((prev) => {
			const result = [...prev, { streamId, type, uuid, name }];
			const value = result.reduce((a, c) => {
				return !a ? c.streamId : a + PARAMS_DELIMITER + c.streamId;
			}, "");
			setSearchParams((prev) => ({ ...prev, [STREAMS_PARAM_NAME]: value }));
			return result;
		});
	};

	const handleDeleteStream = (uuid: string) => () => {
		setStreams((prev) => {
			const arr = prev.filter((a) => a.uuid !== uuid);
			const value = arr.map((c) => c.streamId).join(PARAMS_DELIMITER);
			setSearchParams((prev) => ({ ...prev, [STREAMS_PARAM_NAME]: value }));
			return arr;
		});
	};

	const handleOpenNewWindow = (uuid: string) => () => {
		setStreams((prev) => {
			const arr = prev.filter((a) => {
				if (a.uuid === uuid) {
					window.open(naver.chzzk.liveUrl(a.streamId), "_blank");
					return false;
				}
				return true;
			});
			const value = arr.map((c) => c.streamId).join(PARAMS_DELIMITER);

			setSearchParams((prev) => ({ ...prev, [STREAMS_PARAM_NAME]: value }));
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
		refetch(true);
		refetchCustom(true);
		intervalRef.current = setInterval(() => {
			refetch(true);
		}, 30000);
		customIntervalRef.current = setInterval(() => {
			refetchCustom(true);
		}, 60000);
	};

	const handleCloseMenu = () => {
		setIsMenuOpen(false);
		clearInterval(intervalRef.current);
		clearInterval(customIntervalRef.current);
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

	const handleChatRefresh = () => {
		if (chatRef.current) {
			chatRef.current.src = chatRef.current.src;
		}
	};

	const handleRemoteDragStart = (e: React.DragEvent<HTMLDivElement>) => {
		const { offsetX, offsetY } = e.nativeEvent;
		e.dataTransfer.setData("text/plain", JSON.stringify({ offsetX, offsetY }));
	};
	const handleRemoteDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	};
	const handleRemoteDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		const { offsetX, offsetY } = JSON.parse(e.dataTransfer.getData("text/plain"));
		const x = e.clientX - offsetX;
		const y = e.clientY - offsetY;
		setRemotePos({ x, y });
	};

	useEffect(() => {
		handleFrameSize();
		const columnCount = calculateColumnCount(isInnerChatOpen, INNER_CHAT_WIDTH);
		setFrameColumns(columnCount);
	}, [windowWidth, windowHeight, streams, isInnerChatOpen]);

	useEffect(() => {
		if (streams.length === 0) {
			setIsInnerChatOpen(false);
			disableConfirmOnExit();
		} else {
			enableConfirmOnExit();
		}
	}, [streams]);

	useEffect(() => {
		document.title = "StelCount - Multiview";
		if (streamsParam) setIsMenuOpen(false);

		if (userSetting.isFoxUsingFirefox !== undefined) {
			const { isFoxUsingFirefox } = userSetting;
			setIsBukiUsingFirefox(isFoxUsingFirefox);
		}

		return () => {
			clearInterval(intervalRef.current);
			clearInterval(customIntervalRef.current);
		};
	}, []);

	useEffect(() => {
		if (streamsParam) handleStreamsParam(streamsParam);
	}, [data, streamsParam]);

	useHotkeys("ctrl+alt+l", () => {
		navigate("/login");
	});

	const streamContainerWidth = isInnerChatOpen ? `calc(100vw - 350px)` : "100vw";
	const browser = getBrowserInfo();
	const isFirefox = browser === "Firefox";
	const extensionUrl = isFirefox ? FIREFOX_EXTENSION_URL : CHROME_EXTENSION_URL;

	return (
		<HStack
			position="relative"
			width="100%"
			height="100dvh"
			backgroundColor="black"
			alignItems={"center"}
			justifyContent={"center"}
		>
			{isBukiUsingFirefox ? (
				<Stack
					animation="fadeIn 0.3s .25s both"
					position="fixed"
					left={0}
					top={"4px"}
					width="100%"
					alignItems={"center"}
				>
					<Text color="gray.400">
						부키가 파폭을 사용해서 효과를 봤다니 기념으로 파폭{" "}
						<Link href={FIREFOX_EXTENSION_URL} isExternal color="blue.500">
							부가 기능
						</Link>
						도 추가했습니다
						<CloseButton
							color="red.400"
							float="right"
							boxSize="22px"
							marginLeft="2px"
							onClick={() => {
								setIsBukiUsingFirefox(false);
								setUserSetting((prev) => ({ ...prev, isFoxUsingFirefox: false }));
							}}
						/>
					</Text>
				</Stack>
			) : null}

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
				customStreams={customStreams}
				setCustomStreams={setCustomStreams}
				handleToggleSetting={handleToggleSetting}
				handleCloseSetting={handleCloseSetting}
				handleOpenSetting={handleOpenSetting}
				refetch={refetch}
				refetchCustom={refetchCustom}
				customIntervalRef={customIntervalRef}
				isLoading={isLoading}
				isCustomLoading={isCustomLoading}
				streams={streams}
				userSetting={userSetting}
				setUserSetting={setUserSetting}
			/>
			<HStack
				alignItems={"center"}
				justifyContent={"center"}
				gap={0}
				flexDirection={configState.chatToLeft ? "row-reverse" : "row"}
			>
				<HStack
					id="streams"
					sx={{
						flexGrow: 1,
						flexWrap: "wrap",
						justifyContent: "center",
						alignItems: "center",
						alignContent: "center",
						width: streamContainerWidth,
						height: "100vh",
						boxSizing: "border-box",
						gap: "0",
					}}
				>
					{streams.length > 0 ? (
						streams.map((stream, idx) => {
							const { type, streamId, uuid, name } = stream;
							const ref = refs.current[idx];
							const src = createStreamSrc(type, streamId);
							const handleRefresh = (isAll?: boolean) => () => {
								if (isAll) {
									refs.current.forEach((ref) => {
										if (ref.current) ref.current.src = ref.current.src;
									});
									return;
								}
								if (ref.current) ref.current.src = ref.current.src;
							};

							if (!src) return <Fragment key={`${idx}-${streamId}`}></Fragment>;
							return (
								<Box
									position="relative"
									key={`${streamId}`}
									// onDragOver={handleRemoteDragOver}
									// onDrop={handleRemoteDrop}
								>
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
										// draggable
										position="absolute"
										// top={remotePos.y}
										// left={remotePos.x}
										bottom={"48px"}
										right={"20px"}
										backgroundColor={"rgb(255,255,255,0.3)"}
										borderRadius={".5rem"}
										padding="8px 12px 8px 12px"
										gap="4px"
										// outline={"1px solid white"}
										transition="all .2s"
										backdropFilter="blur(1px)"
										opacity={isMenuOpen ? 1 : 0}
										_hover={{ opacity: 1 }}
									>
										{/* <RemoteControlClicker
											dotColor="gray.300"
											alignSelf={"center"}
											// onDragStart={handleRemoteDragStart}
										/> */}
										<ButtonGroup size="sm" isAttached colorScheme="green">
											<Button onClick={handleOpenChat(streamId, name)}>채팅</Button>
											<IconButton
												onClick={handleOpenChat(streamId, name, true)}
												icon={<MdOpenInNew />}
												aria-label="open-chat-in-new-tab"
											/>
										</ButtonGroup>
										<ButtonGroup size="sm" isAttached colorScheme="blue">
											<Button onClick={handleRefresh()}>갱신</Button>
											<IconButton
												onClick={handleRefresh(true)}
												icon={<RefreshAllIconSVG color="white" width="18px" height="18px" />}
												aria-label="refresh-all-streams"
											/>
										</ButtonGroup>

										<Button size="sm" colorScheme="red" onClick={handleDeleteStream(uuid)}>
											방송 끄기
										</Button>
										<Button size="sm" colorScheme="orange" onClick={handleOpenNewWindow(uuid)}>
											새탭으로
										</Button>
									</Stack>
								</Box>
							);
						})
					) : (
						<Stack color="white" justifyContent={"center"} alignItems="center" width="100%" transition="all .3s">
							<Stack>
								<Text>
									<Box as="span" fontWeight={"bold"}>
										좌측 메뉴
									</Box>
									에서 스텔라를 선택해주세요
								</Text>
								{isExtensionInstalled ? (
									isLatestVersion ? (
										<Text>확장 프로그램이 성공적으로 실행되었습니다</Text>
									) : (
										<Text>확장 프로그램을 최신버전으로 업데이트 해주세요</Text>
									)
								) : (
									<Text>
										네이버 계정으로 인증 및 채팅을 원하시면{" "}
										<Link href={extensionUrl} isExternal color="blue.500">
											{isFirefox ? "부가 기능" : "확장 프로그램"}
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
						</Stack>
					)}
				</HStack>
				{/* <SimpleGrid
					id="streams"
					columns={calcColumns(len)}
					sx={{
						flexGrow: 1,
						height: "100%",
						gap: 0,
					}}
				>
					
				</SimpleGrid> */}
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
														color: s.openLive ? `${lightenColor(s.colorCode || "", 60)}` : "rgba(70,70,70)",
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
							<IconButton
								boxSize={"24px"}
								minWidth="auto"
								padding="0"
								fontSize={"0.825rem"}
								variant={"ghost"}
								icon={<MdRefresh />}
								aria-label="chat-refresh"
								onClick={handleChatRefresh}
								sx={{
									color: "white",
									_hover: { backgroundColor: "rgba(255,255,255,0.1)" },
								}}
							/>
						</HStack>
						{/* 채팅 IFRAME 시작 */}
						<Box
							as="iframe"
							ref={chatRef}
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
	customStreams,
	setCustomStreams,
	handleToggleSetting,
	handleCloseSetting,
	handleOpenSetting,
	refetch,
	refetchCustom,
	customIntervalRef,
	isLoading,
	isCustomLoading,
	streams,
	userSetting,
	setUserSetting,
}: SideMenuProps) {
	const WIDTH = 320;
	const OPENER_WIDTH = 32;
	const CONFIG_HEIGHT = 180;
	const listRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const { isAdmin, isLoading: isAuthLoading } = useAuth();

	const [currentMode, setCurrentMode] = useState(0);
	const [searchInputValue, setSearchInputValue] = useState<string>("");
	const [selectedStreamer, setSelectedStreamer] = useState<Streamer>({
		name: "",
		imageUrl: "",
		streamId: "",
		platform: "",
	});
	const [searchResult, setSearchResult] = useState<SearchData[]>([]);
	const [isCardCompact, setIsCardCompact] = useState<boolean>(false);
	const [filteredData, setFilteredData] = useState<FilteredData[]>([]);

	const configDict: ConfigDict[] = [
		{
			name: "chatToLeft",
			label: "채팅창 위치 좌측으로",
			type: "switch",
		},
		{
			name: "listOpenerWidth",
			label: "방송 리스트 버튼 너비",
			type: "slider",
			suffix: "px",
			defaultValue: 32,
			min: 24,
			max: 120,
		},
		{
			name: "controllerPos",
			label: "컨트롤러 위치",
			type: "radio",
			defaultValue: "right-bottom",
			radioList: [
				{ name: "우측 하단", value: "right-bottom" },
				{ name: "좌측 하단", value: "left-bottom" },
				{ name: "우측 상단", value: "right-top" },
				{ name: "좌측 상단", value: "left-top" },
			],
		},
	];

	const onSearch = () => {
		fetchServer("/search-streamer", "v1", { body: JSON.stringify({ keyword: searchInputValue }), method: "POST" }).then(
			(res) => {
				const data: SearchData[] = res.data;
				setSearchResult(data);
			}
		);
	};

	const handleChangeSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setSearchInputValue(value);

		const results = customStreams
			.map((item) => {
				const { liveTitle, channelName, liveCategoryValue } = item;
				const liveTitleRange = Hangul.rangeSearch(liveTitle || "", value);
				const channelNameRange = Hangul.rangeSearch(channelName || "", value);
				const categoryRange = Hangul.rangeSearch(liveCategoryValue || "", value);

				return {
					...item,
					liveTitleRange,
					channelNameRange,
					categoryRange,
				};
			})
			.filter(
				(item) => item.liveTitleRange.length > 0 || item.channelNameRange.length > 0 || item.categoryRange.length > 0
			);

		setFilteredData(results);
	};

	const handleOpenRedefine = () => {
		listRef.current?.scrollTo({ top: 0 });
		handleOpen();
	};

	const handleRefresh = () => {
		refetch(true);
		refetchCustom(true);
	};

	const handleResize = () => {
		setIsCardCompact((prev) => {
			setUserSetting((prevUS) => ({ ...prevUS, isCardCompact: !prev }));
			return !prev;
		});
	};

	const handleConfig = (name: keyof ConfigState, type: ConfigType) => (e: React.ChangeEvent<HTMLInputElement>) => {
		let value: string | boolean;
		if (type === "switch") {
			value = e.target.checked;
		} else if (type === "number") {
			value = e.target.value;
		}
		setConfigState((prev) => ({ ...prev, [name]: value }));
		setUserSetting((prev) => ({ ...prev, [name]: value }));
	};

	const handleCloseMenu = () => {
		handleClose();
		setCurrentMode(0);
		setSearchInputValue("");
		setFilteredData([]);

		setSelectedStreamer({ name: "", imageUrl: "", streamId: "", platform: "" });
		setSearchResult([]);
	};

	const handleOpenHome = () => {
		window.open("/home", "_blank");
	};

	const handleCurrentMode = (mode: number) => () => {
		setCurrentMode(mode);
	};

	const handleClickSearchResult = (streamer: Streamer) => () => {
		setSelectedStreamer(streamer);
	};

	const handleAddCustomStream = () => {
		const { name, imageUrl, streamId, platform, liveCategoryValue, liveTitle, liveImageUrl, openLive, openDate } =
			selectedStreamer;
		const uuid = v4();
		handleAddStream(streamId, "chzzk", uuid, name || "알 수 없음")();
		setCustomStreams((prev) => {
			if (prev.length >= 50) {
				return prev;
			}
			return [
				...prev,
				{
					name,
					channelName: name,
					channelImageUrl: imageUrl,
					chzzkId: streamId,
					uuid,
					liveTitle,
					liveImageUrl,
					liveCategoryValue,
					openLive,
					openDate,
					isCustom: true,
				},
			].sort((a, b) => Number(!!b.openLive) - Number(!!a.openLive));
		});
		setSearchInputValue("");

		setUserSetting((prev) => {
			const newItem: CustomStreamsForUS = { name, platform, streamId, isBookmarked: false };
			const arr = prev.customStreams ? [...prev.customStreams, newItem] : [newItem];
			return { ...prev, customStreams: arr };
		});

		clearInterval(customIntervalRef.current);
		customIntervalRef.current = setInterval(() => {
			refetchCustom(true);
		}, 60000);
	};

	const handleDeleteCustomStream = (uuid: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		setCustomStreams((prev) => prev.filter((s) => s.uuid !== uuid));
		const currentStreamId = customStreams.find((s) => s.uuid === uuid)?.chzzkId;

		setUserSetting((prev) => {
			const arr = prev.customStreams;
			if (arr) {
				return { ...prev, customStreams: arr.filter((s) => s.streamId !== currentStreamId) };
			}
			return prev;
		});

		clearInterval(customIntervalRef.current);
		customIntervalRef.current = setInterval(() => {
			refetchCustom(true);
		}, 60000);
	};

	useEffect(() => {
		if (userSetting.isCardCompact) {
			const { isCardCompact } = userSetting;
			setIsCardCompact(isCardCompact);
		}
		if (userSetting.chatToLeft) {
			const { chatToLeft } = userSetting;
			setConfigState((prev) => ({ ...prev, chatToLeft }));
		}
		if (userSetting.listOpenerWidth) {
			const { listOpenerWidth } = userSetting;
			setConfigState((prev) => ({ ...prev, listOpenerWidth }));
		}
		if (userSetting.controllerPos) {
			const { controllerPos } = userSetting;
			setConfigState((prev) => ({ ...prev, controllerPos }));
		}
		if (userSetting.customStreams) {
			const { customStreams } = userSetting;
			const temp: MultiViewData[] = customStreams.map((s) => ({
				name: s.name,
				channelName: s.name,
				chzzkId: s.streamId,
				uuid: v4(),
				isCustom: true,
				isBookmarked: !!s.isBookmarked,
			}));
			setCustomStreams(temp);
			fetchServer(`/multiview`, "v1", { method: "POST", body: JSON.stringify({ customStreams: temp }) }).then((res) => {
				if (res.status === 200) {
					const data: MultiViewData[] = res.data;
					setCustomStreams(data.sort((a, b) => Number(!!b.openLive) - Number(!!a.openLive)));
				}
			});
		}
	}, []);

	const getCurrentStreams = (currentMode: number): FilteredData[] => {
		switch (currentMode) {
			case 0:
				return data;
			case 1:
				if (filteredData.length > 0) return filteredData;
				else return customStreams;
			default:
				return [];
		}
	};

	useKeyBind({
		Escape: handleCloseMenu,
		"1": () => {
			setCurrentMode(0);
		},
		"2": () => {
			setCurrentMode(1);
		},
		r: () => {
			handleRefresh();
		},
		h: () => {
			handleOpenHome();
		},
		c: () => {
			handleToggleSetting();
		},
		v: () => {
			handleResize();
		},
		// f: (e) => {
		// 	if (document.activeElement !== searchInputRef.current) {
		// 		// e.preventDefault();
		// 		searchInputRef.current?.focus();
		// 	}
		// },
	});

	// useWebSocket();

	const currentStreams = getCurrentStreams(currentMode);

	const { streamsBookmarked, streamsOrdinary } = currentStreams.reduce<{
		streamsBookmarked: FilteredData[];
		streamsOrdinary: FilteredData[];
	}>(
		(acc, cur) => {
			if (cur.isBookmarked) {
				acc.streamsBookmarked.push(cur);
			} else {
				acc.streamsOrdinary.push(cur);
			}
			return acc;
		},
		{ streamsBookmarked: [], streamsOrdinary: [] }
	);

	return (
		<>
			<UserSettingModal
				isOpen={isSettingOpen}
				onClose={handleCloseSetting}
				body={
					<Stack spacing={2} paddingBottom="4px" divider={<StackDivider borderColor="gray.600" />}>
						{configDict.map((config) => {
							return createConfigComponent(config, configState, setConfigState, handleConfig, setUserSetting);
						})}
					</Stack>
				}
			/>
			<Stack
				sx={{
					position: "absolute",
					top: 0,
					left: 0,
					alignItems: "center",
					justifyContent: "center",
					width: `${userSetting.listOpenerWidth || OPENER_WIDTH}px`,
					height: "100%",
					color: "white",
					transition: "all .25s",
					opacity: 0,
					cursor: "pointer",
					zIndex: 10,
					":hover": { backgroundColor: "rgba(127,127,127,.5)", opacity: 1 },
				}}
				onClick={handleOpenRedefine}
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
					transform: isOpen ? `translateX(0px)` : `translateX(-${WIDTH}px)`,
					transition: "all .3s",
					gap: "0",
					zIndex: 11,
				}}
			>
				<HStack
					position="sticky"
					top={0}
					left={0}
					backgroundColor={"rgba(7,7,7,0.9)"}
					zIndex={1}
					padding="4px 12px"
					gap="4px"
				>
					<Stack flexGrow={1}>
						{isLoading ? (
							<LoadingCircle sx={{ boxSize: "24px", marginLeft: "12px" }} />
						) : (
							<Text fontSize="0.875rem" fontWeight={"bold"} userSelect={"none"}>
								멀티뷰
							</Text>
						)}
					</Stack>
					<HStack gap="2px" border="1px solid gray" padding="1px 2px" borderRadius={"4px"}>
						<Tooltip label="스텔라 방송(1)">
							<IconButton
								boxSize={"24px"}
								minWidth="auto"
								padding="0"
								fontSize={"0.825rem"}
								variant={"ghost"}
								icon={<MdStar color={"#8d97ef"} />}
								aria-label="home"
								onClick={handleCurrentMode(0)}
								isActive={currentMode === 0}
								sx={{
									color: "white",
									_hover: { backgroundColor: "rgba(255,255,255,0.1)" },
									_active: { backgroundColor: "rgba(255,255,255,0.5)" },
								}}
							/>
						</Tooltip>
						<Tooltip label={"사용자 설정 방송(2)"}>
							<IconButton
								boxSize={"24px"}
								minWidth="auto"
								padding="0"
								fontSize={"0.825rem"}
								variant={"ghost"}
								icon={<IoPeople />}
								aria-label="home"
								onClick={handleCurrentMode(1)}
								isActive={currentMode === 1}
								sx={{
									color: "white",
									_hover: { backgroundColor: "rgba(255,255,255,0.1)" },
									_active: { backgroundColor: "rgba(255,255,255,0.5)" },
								}}
							/>
						</Tooltip>
					</HStack>
					<Spacing size={1} direction="horizontal" />
					<Tooltip label="스텔카운트 홈(H)">
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
					</Tooltip>
					<Tooltip label="멀티뷰 설정(C)">
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
					</Tooltip>
					<Tooltip label="새로고침(R)">
						<IconButton
							boxSize={"24px"}
							minWidth="auto"
							padding="0"
							fontSize={"0.825rem"}
							variant={"ghost"}
							icon={<IoReload />}
							aria-label="reload"
							isDisabled={isLoading || isCustomLoading}
							onClick={handleRefresh}
							sx={{ color: "white", ":hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
						/>
					</Tooltip>
					<Tooltip label={isCardCompact ? "카드 크게(V)" : "카드 작게(V)"}>
						<IconButton
							boxSize={"24px"}
							minWidth="auto"
							padding="0"
							fontSize={"0.825rem"}
							variant={"ghost"}
							icon={<TbResize />}
							aria-label="resize"
							onClick={handleResize}
							isActive={isCardCompact}
							sx={{
								color: "white",
								_hover: { backgroundColor: "rgba(255,255,255,0.1)" },
								_active: { backgroundColor: "rgba(255,255,255,0.5)" },
							}}
						/>
					</Tooltip>
					<Tooltip label="목록 닫기(ESC)">
						<CloseButton
							size="sm"
							sx={{ ":hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
							onClick={handleCloseMenu}
						/>
					</Tooltip>
				</HStack>
				<Stack ref={listRef} gap="8px" padding="8px 12px 24px 12px" overflowY="auto" flex={1}>
					{currentMode === 1 ? (
						<Stack
							width="100%"
							height="fit-content"
							border="1px solid white"
							borderRadius={".25rem"}
							p="4px 8px 8px 8px"
							gap="2px"
						>
							{isAdmin ? (
								<HStack justifyContent={"flex-end"} gap="2px">
									<Tooltip label="리스트 저장하기">
										<IconButton
											boxSize={"24px"}
											minWidth="auto"
											padding="0"
											fontSize={"0.825rem"}
											variant={"ghost"}
											icon={<CiExport />}
											aria-label="export-list"
											onClick={() => {}}
											sx={{
												color: "white",
												_hover: { backgroundColor: "rgba(255,255,255,0.1)" },
											}}
										/>
									</Tooltip>
									<Tooltip label="리스트 불러오기">
										<IconButton
											boxSize={"24px"}
											minWidth="auto"
											padding="0"
											fontSize={"0.825rem"}
											variant={"ghost"}
											icon={<CiImport />}
											aria-label="import-list"
											onClick={() => {}}
											sx={{
												color: "white",
												_hover: { backgroundColor: "rgba(255,255,255,0.1)" },
											}}
										/>
									</Tooltip>
								</HStack>
							) : null}

							<InputGroup gap="4px">
								<Input
									ref={searchInputRef}
									size="sm"
									value={searchInputValue}
									onChange={handleChangeSearchInput}
									onKeyDown={(e) => {
										if (e.key === "Enter") onSearch();
										if (e.key === "Escape") searchInputRef.current?.blur();
									}}
								/>
								{searchInputValue.length > 0 ? (
									<Stack
										sx={{
											position: "absolute",
											right: "39px",
											bottom: "3px",
											boxSize: "26px",
											borderRadius: "2px",
											alignItems: "center",
											justifyContent: "center",
											cursor: "pointer",
											zIndex: 1,
										}}
										onClick={(e) => {
											setSearchInputValue("");
											setFilteredData([]);
										}}
									>
										<IconButton
											variant={"ghost"}
											icon={<MdClear />}
											colorScheme="white"
											sx={{
												boxSize: "16px",
												minW: 0,
												borderRadius: "full",
												backgroundColor: "gray.700",
											}}
											aria-label="delete-input"
										/>
									</Stack>
								) : null}

								<IconButton
									icon={<MdSearch />}
									aria-label="search-chzzk-stream"
									colorScheme="green"
									size="sm"
									onClick={() => {
										onSearch();
									}}
								/>
							</InputGroup>
							<Spacing size={2} />
							<Stack
								border="1px solid gray"
								borderRadius={".5rem"}
								minHeight="24px"
								maxHeight="120px"
								p="4px 0"
								gap={0}
								overflow={"auto"}
							>
								{createComponentMap(
									// 검색 결과 창
									searchResult,
									(data, idx) => {
										const { channel, live } = data;
										const { channelId, channelImageUrl, channelName, channelDescription, openLive } = channel;
										return (
											<Tooltip label={channelDescription || ""} placement="right-start">
												<HStack
													padding="2px 8px"
													_hover={{ backgroundColor: "gray.700" }}
													cursor={"pointer"}
													onClick={handleClickSearchResult({
														name: channelName,
														imageUrl: channelImageUrl,
														streamId: channelId,
														platform: "chzzk",
														openLive,
														openDate: live ? live.openDate : "",
														liveTitle: live ? live.liveTitle : "",
														liveCategoryValue: live ? live.liveCategoryValue : "",
														liveImageUrl: live ? live.liveImageUrl : "",
													})}
												>
													<Avatar boxSize="24px" src={`${channelImageUrl}?type=f40_40_na`}>
														<AvatarBadge
															bg={openLive ? "green.500" : "red.500"}
															border="1px"
															boxSize="8px"
															right="1px"
															bottom="1px"
														/>
													</Avatar>
													<Text
														key={`${channelId}-${idx}`}
														fontSize="sm"
														textOverflow={"ellipsis"}
														overflow="hidden"
														whiteSpace={"nowrap"}
													>
														{channelName}
													</Text>
												</HStack>
											</Tooltip>
										);
									},

									<Text fontSize={"sm"} textAlign={"center"} color="gray.400" userSelect={"none"}>
										검색결과없음
									</Text>
								)}
							</Stack>
							{/* <Spacing size={2} />
							<Stack>
								<Text size="xs" color="gray.600">
									0명
								</Text>
							</Stack> */}
							<Spacing size={2} />
							<HStack justifyContent={"space-between"} gap="4px">
								<HStack paddingLeft="4px" gap={"4px"}>
									{selectedStreamer.platform === "chzzk" ? <Image boxSize="18px" src="/images/i_chzzk_1.png" /> : null}
									<Avatar boxSize="24px" src={`${selectedStreamer.imageUrl}?type=f40_40_na`} />
									<Box />
									<Text
										maxWidth="172px"
										fontSize="sm"
										color={selectedStreamer.name ? undefined : "gray"}
										textOverflow={"ellipsis"}
										overflow="hidden"
										whiteSpace={"nowrap"}
									>
										{selectedStreamer.name || "미선택"}
									</Text>
								</HStack>
								<Button
									minWidth="40px"
									colorScheme="blue"
									size="xs"
									isDisabled={
										!selectedStreamer.streamId ||
										currentStreams.findIndex((s) => s.chzzkId === selectedStreamer.streamId) !== -1 ||
										data.findIndex((s) => s.chzzkId === selectedStreamer.streamId) !== -1 ||
										customStreams.length >= 50
									}
									onClick={handleAddCustomStream}
								>
									{customStreams.length >= 50 ? "개수 초과" : "추가"}
								</Button>
							</HStack>
						</Stack>
					) : null}
					{/* 여기에 이름이 '즐겨찾기'인 Divider 추가 */}
					{streamsBookmarked.length > 0
						? streamsBookmarked.map((item, idx) => {
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
										handleDeleteCustomStream={handleDeleteCustomStream}
										isCompact={isCardCompact}
										isFiltered={filteredData.length > 0}
									/>
								);
						  })
						: null}
					{/* 여기에 Divider 추가 */}
					{streamsOrdinary.length > 0
						? streamsOrdinary.map((item, idx) => {
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
										handleDeleteCustomStream={handleDeleteCustomStream}
										isCompact={isCardCompact}
										isFiltered={filteredData.length > 0}
									/>
								);
						  })
						: null}
				</Stack>
				{/* 여기부터 사용자 설정 */}
				{/* <Stack
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
						{configDict.map((config) => {
							return createConfigComponent(config, configState, setConfigState, handleConfig, setUserSetting);
						})}
					</Stack>
				</Stack> */}
			</Stack>
		</>
	);
}

function MenuCard({
	item,
	itemIdx,
	handleAddStream,
	handleDeleteStream,
	handleDeleteCustomStream,
	isCompact,
	isFiltered,
}: MenuCardProps) {
	const {
		name,
		chzzkId,
		uuid,
		categoryRange,
		colorCode,
		channelName,
		channelNameRange,
		channelImageUrl,
		liveCategoryValue,
		liveTitle,
		liveTitleRange,
		liveImageUrl,
		openLive,
		openDate,
		closeDate,
		adult,
		isCustom,
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
				{isCustom && !isFiltered ? (
					<MenuCardCloseButton onClick={handleDeleteCustomStream(uuid)} aria-label="custom-stream-delete-button" />
				) : null}
				<HStack>
					{isCompact ? null : <MenuCardImage liveImageUrl={liveImageUrl} openLive={openLive} adult={adult} />}

					<Stack
						flex="1 0 50%"
						height="100%"
						direction={isCompact ? "row" : "column"}
						justifyContent={isCompact ? "space-between" : undefined}
					>
						<HStack>
							<Image
								src={`${channelImageUrl}?type=f60_60_na` || ""}
								objectFit={"cover"}
								boxSize="24px"
								borderRadius={"full"}
								filter={openLive ? undefined : "grayscale(1)"}
							/>
							<Text fontSize="0.75em" fontWeight={"bold"} color={openLive ? undefined : "gray.400"}>
								{applySearchHighlight(channelName, channelNameRange)}
							</Text>
						</HStack>

						<Text color={COLOR_CHZZK} fontWeight={"bold"} fontSize={"0.75em"}>
							{openLive ? applySearchHighlight(liveCategoryValue, categoryRange) : "　"}
						</Text>
						{isCompact ? null : (
							<Text color="gray.500" fontSize="0.65em" paddingRight={isCompact ? "12px" : undefined}>
								{openLive ? modDateText(openDate) + " 시작" : modDateText(closeDate) + " 종료"}
							</Text>
						)}
					</Stack>
				</HStack>
				<Stack>
					<Text
						fontSize="0.825em"
						color={openLive ? undefined : "gray.500"}
						sx={
							isCompact
								? {
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
								  }
								: undefined
						}
					>
						{openLive ? applySearchHighlight(liveTitle, liveTitleRange) : "방송 종료됨"}
					</Text>
				</Stack>
			</CardBody>
		</Card>
	);
}

function MenuCardImage({ liveImageUrl, openLive, adult }: MenuCardImageProps) {
	const [now] = useRecoilState(nowState);

	return (
		<Stack flex="1 0 50%">
			{openLive ? (
				adult ? (
					<Stack
						height={"72px"}
						borderRadius={".5rem"}
						backgroundColor={"#333"}
						fontSize="1.25em"
						alignItems={"center"}
						justifyContent={"center"}
						sx={{
							"> svg": {
								boxSize: "32px",
							},
						}}
					>
						<AdultIcon />
					</Stack>
				) : liveImageUrl ? (
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
						backgroundColor={"#333"}
						fontSize="1.25em"
						alignItems={"center"}
						justifyContent={"center"}
						sx={{
							"> svg": {
								boxSize: "32px",
							},
						}}
					>
						<TbForbid />
					</Stack>
				)
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

function MenuCardCloseButton({ ...props }: MenuCardCloseButtonProps) {
	return (
		<IconButton
			variant={"ghost"}
			icon={<MdClear />}
			colorScheme="red"
			sx={{ position: "absolute", right: "4px", bottom: "4px", boxSize: "18px", minW: 0, borderRadius: "full" }}
			{...props}
		/>
	);
}

function AdultIcon() {
	return (
		<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle cx="100" cy="100" r="76" stroke="#707070" strokeWidth="8" />
			<path
				d="M79.344 59.312V142.128H61.936V59.312H79.344ZM114.901 109.36H108.501C97.9197 109.36 92.629 103.728 92.629 92.464V74.8C92.629 63.536 97.9197 57.904 108.501 57.904H123.605C134.186 57.904 139.477 63.536 139.477 74.8V126.384C139.477 137.648 134.186 143.28 123.605 143.28H109.781C99.1997 143.28 93.909 137.648 93.909 126.384V120.24H110.293V126.768C110.293 127.451 110.506 128.048 110.933 128.56C111.445 129.072 112.042 129.328 112.725 129.328H121.045C121.728 129.328 122.282 129.072 122.709 128.56C123.221 128.048 123.477 127.451 123.477 126.768V107.696C121.173 108.805 118.314 109.36 114.901 109.36ZM108.501 76.208V91.056C108.501 91.7387 108.714 92.336 109.141 92.848C109.653 93.36 110.25 93.616 110.933 93.616H121.045C121.728 93.616 122.282 93.36 122.709 92.848C123.221 92.336 123.477 91.7387 123.477 91.056V76.208C123.477 75.5253 123.221 74.928 122.709 74.416C122.282 73.904 121.728 73.648 121.045 73.648H110.933C110.25 73.648 109.653 73.904 109.141 74.416C108.714 74.928 108.501 75.5253 108.501 76.208Z"
				fill="#707070"
			/>
		</svg>
	);
}

function createConfigComponent(
	config: ConfigDict,
	configState: ConfigState,
	setConfigState: Dispatch<SetStateAction<ConfigState>>,
	handleConfig: (name: keyof ConfigState, type: ConfigType) => (e: React.ChangeEvent<HTMLInputElement>) => void,
	setUserSetting: Dispatch<SetStateAction<UserSettingStorage>>
) {
	const { type, name, label, suffix } = config;
	if (type === "switch") {
		const isChecked = configState[name] as boolean;
		return (
			<FormControl key={name} display="flex" alignItems="center" justifyContent={"space-between"} gap={0}>
				<FormLabel htmlFor={name} mb="0" flexGrow={1} margin={0} paddingRight="8px" cursor={"pointer"}>
					{label}
				</FormLabel>
				<Switch id={name} isChecked={isChecked} onChange={handleConfig(name, type)} />
			</FormControl>
		);
	} else if (type === "number") {
		const value = configState[name] as string;
		const format = (val: string) => (suffix ? `${val}${suffix}` : `${val}`);
		const parse = (val: string) => (suffix ? val.replace(suffix, "") : val);
		const { defaultValue, min, max } = config as ConfigDict<"number">;
		return (
			<FormControl key={name} display="flex" alignItems="center" justifyContent={"space-between"} gap={0}>
				<FormLabel htmlFor={name} mb="0" flexGrow={1} margin={0} paddingRight="8px">
					{label}
				</FormLabel>
				<NumberInput
					size="xs"
					maxW={20}
					defaultValue={defaultValue}
					min={min}
					max={max}
					onChange={(val) => {
						setConfigState((prev) => ({ ...prev, [name]: parse(val) }));
						setUserSetting((prev) => ({ ...prev, [name]: val }));
					}}
					value={format(value)}
				>
					<NumberInputField />
					<NumberInputStepper>
						<NumberIncrementStepper />
						<NumberDecrementStepper />
					</NumberInputStepper>
				</NumberInput>
			</FormControl>
		);
	} else if (type === "slider") {
		const value = configState[name] as string;
		const numVal = parseInt(value);
		const { defaultValue, min, max } = config as ConfigDict<"slider">;
		return (
			<FormControl key={name}>
				<FormLabel htmlFor={name} mb="0" flexGrow={1} margin={0} paddingRight="8px">
					{label}
					<Text as="span" float={"right"} fontSize="sm">
						{numVal}px
					</Text>
				</FormLabel>
				<Box pt={0}>
					<Slider
						defaultValue={defaultValue}
						min={min}
						max={max}
						value={numVal}
						onChange={(val) => {
							setConfigState((prev) => ({ ...prev, [name]: val }));
							setUserSetting((prev) => ({ ...prev, [name]: val }));
						}}
					>
						<SliderTrack bg="blue.50">
							<SliderFilledTrack bg="blue.300" />
						</SliderTrack>
						<SliderThumb borderColor="blue.500" />
					</Slider>
				</Box>
			</FormControl>
		);
	} else if (type === "list") {
		// const value = configState[name] as number; // default: 1, 1 ~ 4

		return <Fragment key={name}></Fragment>;
	} else if (type === "radio") {
		const value = configState[name] as string;
		const { defaultValue, radioList } = config as ConfigDict<"radio">;
		//TODO: ConfigDict에 새로운 값 지정 필요 -- 구조? structure?
		if (!radioList) {
			useConsoleAdmin(`개발자 경고: ${name}항목에 대해 radioList가 지정되지 않음`);
			return <Fragment key={name}></Fragment>;
		}
		return (
			<FormControl key={name}>
				<FormLabel htmlFor={name} mb="0" flexGrow={1} margin={0} paddingRight="8px">
					{label}
				</FormLabel>
				<RadioGroup
					onChange={(val) => {
						setConfigState((prev) => ({ ...prev, [name]: val }));
						setUserSetting((prev) => ({ ...prev, [name]: val }));
					}}
					value={value}
					defaultValue={defaultValue}
				>
					<HStack>
						{radioList.map((s, idx) => (
							<Radio key={idx} value={s.value}>
								{s.name}
							</Radio>
						))}
					</HStack>
				</RadioGroup>
			</FormControl>
		);
	} else return <Fragment key={name}></Fragment>;
}

function RemoteControlClicker({ dotColor, ...props }: StackProps & { dotColor?: BackgroundProps["backgroundColor"] }) {
	return (
		<Stack alignItems={"center"} width="100%" paddingBlock={"6px 4px"} cursor="move" {...props}>
			<SimpleGrid width={"fit-content"} columns={4} spacing={1} justifyItems={"center"}>
				{Array.from({ length: 8 }, (_, i) => i).map((n, i) => (
					<Dot key={i} backgroundColor={dotColor}></Dot>
				))}
			</SimpleGrid>
		</Stack>
	);
}

function Dot({ ...props }: BoxProps) {
	return <Box boxSize="4px" borderRadius={"full"} backgroundColor="black" {...props}></Box>;
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

function RefreshAllIconSVG({ ...props }) {
	return (
		<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<mask id="path-1-inside-1_20_2" fill="white">
				<path d="M142.186 162.011C143.739 164.294 146.86 164.898 149.042 163.205C159.472 155.113 167.759 144.547 173.131 132.432C179.181 118.79 181.295 103.728 179.233 88.9476C177.171 74.1676 171.016 60.2589 161.464 48.7933C151.912 37.3278 139.344 28.7626 125.179 24.0657C111.014 19.3688 95.8183 18.7275 81.3082 22.2143C66.7981 25.701 53.5525 33.1768 43.0685 43.7968C32.5844 54.4168 25.2797 67.7575 21.9801 82.3113C19.0497 95.2362 19.3818 108.66 22.9101 121.381C23.6482 124.042 26.5118 125.423 29.1214 124.52L38.9146 121.132C41.5243 120.229 42.8861 117.385 42.205 114.709C39.885 105.593 39.7484 96.0332 41.8387 86.8136C44.2985 75.9643 49.7439 66.0192 57.5594 58.1024C65.375 50.1855 75.2491 44.6126 86.0659 42.0133C96.8827 39.4141 108.211 39.8921 118.77 43.3935C129.329 46.8949 138.699 53.2799 145.82 61.8271C152.94 70.3743 157.529 80.7428 159.065 91.7608C160.602 102.779 159.027 114.007 154.517 124.177C150.685 132.819 144.863 140.403 137.556 146.327C135.411 148.066 134.804 151.16 136.357 153.443L142.186 162.011Z" />
			</mask>
			<path
				d="M142.186 162.011C143.739 164.294 146.86 164.898 149.042 163.205C159.472 155.113 167.759 144.547 173.131 132.432C179.181 118.79 181.295 103.728 179.233 88.9476C177.171 74.1676 171.016 60.2589 161.464 48.7933C151.912 37.3278 139.344 28.7626 125.179 24.0657C111.014 19.3688 95.8183 18.7275 81.3082 22.2143C66.7981 25.701 53.5525 33.1768 43.0685 43.7968C32.5844 54.4168 25.2797 67.7575 21.9801 82.3113C19.0497 95.2362 19.3818 108.66 22.9101 121.381C23.6482 124.042 26.5118 125.423 29.1214 124.52L38.9146 121.132C41.5243 120.229 42.8861 117.385 42.205 114.709C39.885 105.593 39.7484 96.0332 41.8387 86.8136C44.2985 75.9643 49.7439 66.0192 57.5594 58.1024C65.375 50.1855 75.2491 44.6126 86.0659 42.0133C96.8827 39.4141 108.211 39.8921 118.77 43.3935C129.329 46.8949 138.699 53.2799 145.82 61.8271C152.94 70.3743 157.529 80.7428 159.065 91.7608C160.602 102.779 159.027 114.007 154.517 124.177C150.685 132.819 144.863 140.403 137.556 146.327C135.411 148.066 134.804 151.16 136.357 153.443L142.186 162.011Z"
				stroke="currentColor"
				strokeWidth="48"
				mask="url(#path-1-inside-1_20_2)"
			/>
			<path
				d="M42.648 137.952C47.9387 137.952 50.584 140.768 50.584 146.4V180H41.624V166.112H35.16V180H26.2V146.4C26.2 140.768 28.8453 137.952 34.136 137.952H42.648ZM35.16 159.2H41.624V145.312C41.624 144.971 41.496 144.672 41.24 144.416C41.0267 144.16 40.7493 144.032 40.408 144.032H36.376C36.0347 144.032 35.736 144.16 35.48 144.416C35.2667 144.672 35.16 144.971 35.16 145.312V159.2ZM66.2225 172.448H76.0145V180H57.2625V138.592H66.2225V172.448ZM89.2225 172.448H99.0145V180H80.2625V138.592H89.2225V172.448Z"
				fill="currentColor"
			/>
			<path
				d="M126.653 137.651C128.569 134.278 133.431 134.278 135.347 137.651L153.602 169.78C155.496 173.113 153.089 177.25 149.255 177.25H112.745C108.911 177.25 106.504 173.113 108.398 169.78L126.653 137.651Z"
				fill="currentColor"
			/>
		</svg>
	);
}

function applySearchHighlight(text: string | null | undefined, ranges: number[][] | undefined): JSX.Element {
	if (!text) return <></>;
	if (!ranges || ranges.length === 0) return <>{text}</>;
	const elements: JSX.Element[] = [];
	let lastIndex = 0;

	//TODO: 찾은 검색어가 특정 상황에서 문자가 복사되는 문제 발생
	//TODO: 원인 분석 필요

	ranges.forEach(([start, end], idx) => {
		elements.push(<span key={`${idx}-normal`}>{text.slice(lastIndex, start)}</span>);
		// 하이라이트된 텍스트
		elements.push(
			<Box as="span" key={`${idx}-highlight`} backgroundColor="yellow.600">
				{text.slice(start, end + 1)}
			</Box>
		);
		lastIndex = end + 1;
	});

	elements.push(<span key="remaining">{text.slice(lastIndex)}</span>);

	return <>{elements}</>;
}

//! 아마 앞으로 미사용
function customRangeSearch(text: string, search: string): number[][] {
	const disassembledText = Hangul.disassemble(text); // 결과는 배열
	const disassembledSearch = Hangul.disassemble(search).join("");

	const ranges: number[][] = [];
	let startIndex = 0;

	while (startIndex < disassembledText.length) {
		// 배열을 문자열로 변환 후 검색
		const index = disassembledText.join("").indexOf(disassembledSearch, startIndex);
		if (index === -1) break;

		const endIndex = index + disassembledSearch.length - 1;

		// 원래 배열에서 범위를 가져옴
		const originalStart = Hangul.assemble(disassembledText.slice(0, index)).length;
		const originalEnd = Hangul.assemble(disassembledText.slice(0, endIndex + 1)).length - 1;

		ranges.push([originalStart, originalEnd]);
		startIndex = index + 1;
	}

	return ranges;
}

function calculateColumnCount(isInnerChatOpen: boolean, chatWidth: number) {
	const viewportWidth = window.innerWidth;
	const viewportHeight = window.innerHeight;
	const ASPECT_RATIO = 16 / 9; // 스트리밍 화면 비율 지정

	const availableWidth = isInnerChatOpen ? viewportWidth - chatWidth : viewportWidth; // 채팅창 여부에 따른 가용 너비
	const maxColumn = Math.floor(availableWidth / (viewportHeight / ASPECT_RATIO)); // 칼럼수 계산
	const columns = Math.max(1, maxColumn); // 칼럼수를 최소 1개로 지정함

	return columns;
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
	customStreams: MultiViewData[];
	setCustomStreams: Dispatch<SetStateAction<MultiViewData[]>>;
	handleToggleSetting: () => void;
	handleCloseSetting: () => void;
	handleOpenSetting: () => void;
	refetch: (isTimer?: boolean) => void;
	refetchCustom: (isTimer?: boolean) => void;
	customIntervalRef: React.MutableRefObject<number | undefined>;
	isLoading: boolean;
	isCustomLoading: boolean;
	streams: Stream[];
	userSetting: UserSettingStorage;
	setUserSetting: Dispatch<SetStateAction<UserSettingStorage>>;
}

interface MenuCardProps {
	item: FilteredData;
	itemIdx: number;
	handleAddStream: (streamId: string | undefined, type: StreamType, uuid: string, name: string) => () => void;
	handleDeleteStream: (uuid: string) => () => void;
	handleDeleteCustomStream: (uuid: string) => (e: React.MouseEvent<HTMLButtonElement>) => void;
	isCompact: boolean;
	isFiltered: boolean;
}

interface MenuCardImageProps {
	liveImageUrl?: string | null;
	openLive: boolean | undefined;
	adult?: boolean;
}

interface MenuCardCloseButtonProps extends IconButtonProps {}

interface ConfigState {
	chatToLeft: boolean;
	listOpenerWidth: string;
	controllerPos: ConfigStateControllerPos;
}

type ConfigStateControllerPos = "right-bottom" | "left-bottom" | "right-top" | "left-top" | (string & {});

interface ConfigDict<T extends ConfigType = ConfigType> {
	name: keyof ConfigState;
	label: string;
	type: ConfigType;
	suffix?: string;
	defaultValue?: DefaultValueType<T>;
	min?: number;
	max?: number;
	radioList?: ConfigDictRadioList[];
	hoverComponent?: () => React.ReactNode;
}

interface ConfigDictRadioList {
	name: string;
	value: string;
}

type ConfigType = "switch" | "number" | "slider" | "list" | "radio" | (string & {});
type DefaultValueType<T> = T extends "list" | "radio"
	? string
	: T extends "number" | "slider"
	? number
	: T extends "switch"
	? boolean
	: never;

interface Streamer {
	name: string;
	streamId: string;
	imageUrl: string;
	platform: "chzzk" | (string & {});
	liveCategoryValue?: string;
	liveTitle?: string;
	liveImageUrl?: string;
	openLive?: boolean;
	openDate?: string;
}

interface SearchData {
	channel: SearchDataChannel;
	live?: SearchDataLive;
}

type FilteredData = MultiViewData & {
	liveTitleRange?: number[][];
	channelNameRange?: number[][];
	categoryRange?: number[][];
};

interface SearchDataChannel {
	channelId: string;
	channelName: string;
	channelImageUrl: string;
	channelDescription: string;
	openLive: boolean;
}

interface SearchDataLive {
	liveTitle: string;
	liveImageUrl: string;
	defaultThumbnailImageUrl: string;
	openDate: string;
	liveCategoryValue: string;
	channelId: string;
	livePlaybackJson: string;
}
