import {
	AbsoluteCenter,
	Alert,
	AlertIcon,
	Box,
	Button,
	Card,
	CardBody,
	Checkbox,
	CloseButton,
	Divider,
	Drawer,
	DrawerBody,
	DrawerCloseButton,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerOverlay,
	HStack,
	Heading,
	IconButton,
	Input,
	InputGroup,
	InputLeftElement,
	InputRightElement,
	Link,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Select,
	Stack,
	Table,
	TableContainer,
	Tag,
	TagCloseButton,
	TagLabel,
	Tbody,
	Td,
	Text,
	Th,
	Thead,
	Tr,
	useDisclosure,
	useToast,
} from "@chakra-ui/react";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { fetchServer } from "../lib/functions/fetch";
import {
	MdAdd,
	MdCalendarMonth,
	MdColorLens,
	MdDelete,
	MdEdit,
	MdGroup,
	MdOpenInNew,
	MdOutlineVideocam,
	MdPerson,
	MdPlaylistPlay,
	MdTitle,
} from "react-icons/md";
import { CopyText } from "../components/CopyText";
import { useAuth } from "../lib/hooks/useAuth";
import { Loading } from "../components/Loading";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilState } from "recoil";
import { headerOffsetState, stellarState } from "../lib/Atom";
import { Spacing } from "../components/Spacing";
import { Image } from "../components/Image";
import { FaXTwitter, FaYoutube } from "react-icons/fa6";
import VALIDATION from "../lib/functions/validation";
import { objectNullCheck, stringNullCheck } from "../lib/functions/etc";
import { TOAST_MESSAGE, stellarGroupName } from "../lib/constant";
import { NotExist } from "./NotExist";
import { useConsole } from "../lib/hooks/useConsole";
import useColorModeValues from "../lib/hooks/useColorModeValues";
import { useResponsive } from "../lib/hooks/useResponsive";
import { Tag as TagType } from "../lib/types";
import useBackgroundColor from "../lib/hooks/useBackgroundColor";
import Wrapper from "../components/Wrapper";

export function Admin() {
	useBackgroundColor(`white`);
	const firstRef = useRef<HTMLInputElement | null>(null);
	const nav = useNavigate();
	const toast = useToast();
	const [inputValue, setInputValue] = useState<StellarInputValue>({
		name: "",
		group: "",
		youtubeId: "",
		chzzkId: "",
		xId: "",
		colorCode: "",
		playlistIdForMusic: "",
	});
	const [inputValueY, setInputValueY] = useState<string>("");
	const [tagInputValue, setTagInputValue] = useState<TagData>({ id: -1, name: "", colorCode: "" });
	const [stellarData, setStellarData] = useState<StellarData[]>([]);
	const [tagData, setTagData] = useState<TagData[]>([]);
	const { isLoading, isLogin, isAdmin } = useAuth();
	const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();

	const getStellarData = () => {
		fetchServer("/stellars", "v1").then((res) => {
			if (res) {
				if (res.status === 200) setStellarData(res.data);
			}
		});
	};

	const getTagData = () => {
		fetchServer("/tags", "v1").then((res) => {
			if (res) {
				if (res.status === 200) {
					setTagData(res.data.map((t) => objectNullCheck(t)));
				}
			}
		});
	};

	const handleInputValue = (key: keyof StellarInputValue) => (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setInputValue((prev) => ({ ...prev, [key]: value }));
	};

	const handleInputValueY = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setInputValueY(value);
	};

	const handleSubmit = (e: React.FormEvent<HTMLDivElement>) => {
		e.preventDefault();
		if (!inputValue.name) {
			toast({ description: "스텔라 이름을 입력해주세요", status: "error" });
			return;
		}
		fetchServer("/stellar", "v1", { method: "POST", body: JSON.stringify(inputValue) }).then((res) => {
			getStellarData();

			toast({ description: `새 스텔라 등록을 완료했습니다`, status: "success" });
			setInputValue({
				name: "",
				group: "",
				youtubeId: "",
				chzzkId: "",
				xId: "",
				colorCode: "",
				playlistIdForMusic: "",
			});
		});
	};

	const handleGetYoutubeId = (e: React.FormEvent<HTMLDivElement>) => {
		e.preventDefault();
		if (inputValueY === "") {
			alert("빈값");
			return;
		}
		fetchServer(`/yid?username=${inputValueY}`, "v1").then((res) => {
			if (res && res.data.items) {
				if (inputValue.youtubeId.length === 0) {
					setInputValue((prev) => ({ ...prev, youtubeId: res.data.items[0].id }));
				} else {
					setInputValue((prev) => ({ ...prev, youtubeId: prev.youtubeId + "," + res.data.items[0].id }));
				}
			} else {
				toast({ description: "올바르지 않은 채널명입니다", status: "error" });
			}
		});
	};

	const handleEdit = (id: number) => () => {
		nav(`/admin/${id}`);
	};

	const handleDelete = (id: number) => (e: React.MouseEvent<HTMLButtonElement>) => {
		if (!confirm(`${stellarData.find((s) => s.id === id)?.name} 항목을 삭제하시겠습니까?`)) {
		} else {
			fetchServer(`/stellar/${id}`, "v1", { method: "DELETE", body: JSON.stringify({ id }) }).then((res) => {
				getStellarData();
			});
		}
	};

	const handleYoutubeData = () => {
		fetchServer("/renew", "v1")
			.then((res) => {
				if (res.status === 200) toast({ description: "데이터 갱신에 성공했습니다", status: "success" });
				else toast({ description: "데이터 갱신 중 오류가 발생했습니다", status: "error" });
			})
			.catch(() => {
				toast({ description: "데이터 갱신 중 오류가 발생했습니다", status: "error" });
			});
	};

	const handleClickTag = (id: number) => () => {
		const t: TagData = tagData.find((t) => t.id === id) || { id: -1, name: "", colorCode: "" };
		setTagInputValue({ ...t });
		onModalOpen();
	};

	useEffect(() => {
		getStellarData();
		getTagData();
		firstRef.current?.focus();
	}, []);

	if (isLoading) return <Loading options={{ mode: "fullscreen" }} />;
	if (!isLogin) return <NotExist />;
	if (!isAdmin) return <NotExist />;
	return (
		<>
			<TagModal
				isOpen={isModalOpen}
				onClose={onModalClose}
				inputValue={tagInputValue}
				setInputValue={setTagInputValue}
				refetch={getTagData}
			/>
			<Stack padding="12px">
				<Button onClick={handleYoutubeData}>유튜브 데이터 불러오기</Button>
				<Box as="section">
					<Stack as="form" onSubmit={handleSubmit}>
						<InputGroup>
							<InputLeftElement>
								<MdPerson />
							</InputLeftElement>
							<Input
								ref={firstRef}
								placeholder="스텔라 이름"
								value={inputValue.name}
								onChange={handleInputValue("name")}
							/>
						</InputGroup>
						<InputGroup>
							<InputLeftElement>
								<MdGroup />
							</InputLeftElement>
							<InputRightElement width="72px" fontSize="0.875rem">
								{Number(inputValue.group) > 0 && Number(inputValue.group) < stellarGroupName.length ? (
									<Text>{stellarGroupName[inputValue.group][0]}</Text>
								) : null}
							</InputRightElement>
							<Input
								type="number"
								placeholder="스텔라 기수"
								value={inputValue.group}
								onChange={handleInputValue("group")}
							/>
						</InputGroup>
						<InputGroup>
							<InputLeftElement>
								<FaYoutube />
							</InputLeftElement>
							<Input placeholder="유튜브 ID" value={inputValue.youtubeId} onChange={handleInputValue("youtubeId")} />
						</InputGroup>
						<InputGroup>
							<InputLeftElement>
								<Image boxSize={"16px"} src="/images/i_chzzk_1.png" />
							</InputLeftElement>
							<Input placeholder="치지직 ID" value={inputValue.chzzkId} onChange={handleInputValue("chzzkId")} />
						</InputGroup>
						<InputGroup>
							<InputLeftElement>
								<FaXTwitter />
							</InputLeftElement>
							<Input placeholder="X ID" value={inputValue.xId} onChange={handleInputValue("xId")} />
						</InputGroup>
						<InputGroup>
							<InputLeftElement>
								<MdColorLens />
							</InputLeftElement>
							<Input
								placeholder="컬러코드 HEX"
								value={inputValue.colorCode}
								onChange={handleInputValue("colorCode")}
								isInvalid={inputValue.colorCode.length > 0 && !VALIDATION.hexCode(inputValue.colorCode)}
							/>
						</InputGroup>
						<InputGroup>
							<InputLeftElement>
								<MdPlaylistPlay />
							</InputLeftElement>
							<Input
								placeholder="음악 재생목록 ID"
								value={inputValue.playlistIdForMusic}
								onChange={handleInputValue("playlistIdForMusic")}
							/>
						</InputGroup>
						<Button type="submit">등록</Button>
					</Stack>
				</Box>
				<Box as="section">
					<Stack as="form" onSubmit={handleGetYoutubeId}>
						<Input placeholder="채널명 검색" value={inputValueY} onChange={handleInputValueY} />
						<Button type="submit">검색</Button>
					</Stack>
				</Box>
				<TableContainer>
					<Table variant="simple" size="sm">
						<Thead>
							<Tr>
								<Th isNumeric>ID</Th>
								<Th>이름</Th>
								<Th>기수</Th>
								<Th>컬러코드 HEX</Th>
								<Th>재생목록</Th>
								<Th>설정</Th>
								<Th>치지직 ID</Th>
								<Th>유튜브 ID</Th>
								<Th>X ID</Th>
							</Tr>
						</Thead>
						<Tbody>
							{stellarData.map((s, idx) => (
								<Tr key={`${s.id}-${idx}`}>
									<Td isNumeric>{s.id}</Td>
									<Td>{s.name}</Td>
									<Td>
										{Number(s.group) < stellarGroupName.length
											? `${s.group}기 - ${stellarGroupName[s.group][0]}`
											: null}
									</Td>
									<Td>
										<CopyText>{s.colorCode}</CopyText>
									</Td>
									<Td>
										{s.playlistIdForMusic ? (
											<Link
												href={`https://www.youtube.com/playlist?list=${s.playlistIdForMusic}`}
												isExternal
												sx={{ display: "flex", justifyContent: "center" }}
											>
												<MdOpenInNew />
											</Link>
										) : null}
									</Td>
									<Td>
										<IconButton
											aria-label="edit"
											icon={<MdEdit />}
											isRound
											size={"sm"}
											fontSize={"1.125rem"}
											marginRight={"2px"}
											onClick={handleEdit(s.id)}
										/>
										<IconButton
											aria-label="delete"
											icon={<MdDelete />}
											isRound
											size={"sm"}
											fontSize={"1.125rem"}
											onClick={handleDelete(s.id)}
										/>
									</Td>
									<Td>
										<CopyText>{s.chzzkId}</CopyText>
									</Td>
									<Td>
										<CopyText>{s.youtubeId}</CopyText>
									</Td>
									<Td>
										<CopyText>{s.xId}</CopyText>
									</Td>
								</Tr>
							))}
						</Tbody>
					</Table>
				</TableContainer>
				<HeadedDivider>태그</HeadedDivider>
				<TableContainer>
					<Table variant="simple" size="sm">
						<Thead>
							<Tr>
								<Th isNumeric width="80px">
									ID
								</Th>
								<Th width="240px">이름</Th>
								<Th width="240px">색상코드</Th>
								<Th></Th>
							</Tr>
						</Thead>
						<Tbody>
							{tagData.length === 0 ? (
								<Tr>
									<Td colSpan={4} textAlign={"center"} fontWeight={"bold"} height="120px">
										No Data
									</Td>
								</Tr>
							) : (
								tagData.map((t) => (
									<Tr key={t.id} _hover={{ backgroundColor: "gray.100" }} onClick={handleClickTag(t.id)}>
										<Td isNumeric>{t.id}</Td>
										<Td>{t.name}</Td>
										<Td>{t.colorCode}</Td>
										<Td></Td>
									</Tr>
								))
							)}
						</Tbody>
					</Table>
				</TableContainer>
			</Stack>
		</>
	);
}

export function AdminEdit() {
	useBackgroundColor(`white`);
	const nav = useNavigate();
	const { id } = useParams();
	const [offsetY] = useRecoilState(headerOffsetState);
	const [isLoading, setIsLoading] = useState(true);
	const [alertStatus, setAlertStatus] = useState<"error" | "info" | "warning" | "success" | "loading">("loading");
	const alertText = {
		loading: "데이터를 불러오는 중입니다.",
		error: "데이터를 불러오는 중 에러가 발생했습니다.",
		warning: "데이터가 변경되었습니다.",
		success: "데이터를 불러오는데 성공했습니다.",
	};
	const [inputValue, setInputValue] = useState<StellarInputValue>({
		name: "",
		group: "",
		youtubeId: "",
		chzzkId: "",
		xId: "",
		colorCode: "",
		playlistIdForMusic: "",
	});
	const [videoData, setVideoData] = useState<VideoData[]>([]);
	const { isLogin, isAdmin, isLoading: isAuthLoading } = useAuth();

	const handleInputValue = (key: keyof StellarInputValue) => (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setInputValue((prev) => ({ ...prev, [key]: value }));
	};

	const handleSubmit = (e: React.FormEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsLoading(true);
		setAlertStatus("loading");
		fetchServer(`/stellar/${id}`, "v1", { method: "PATCH", body: JSON.stringify(inputValue) })
			.then((res) => {
				if (res) {
					if (res.status === 204) {
						setAlertStatus("success");
					}
				}
			})
			.catch((err) => {
				setAlertStatus("error");
			})
			.finally(() => {
				setIsLoading(false);
			});
	};

	useEffect(() => {
		fetchServer(`/stellar/${id}`, "v1")
			.then((res) => {
				if (res) {
					if (res.status === 200) {
						if (!res.data) {
							nav("/admin");
						}
						const { name, group, chzzkId, youtubeId, xId, colorCode, playlistIdForMusic, video } = res.data;
						const obj = { name, group, chzzkId, youtubeId, xId, colorCode, playlistIdForMusic, video };
						setInputValue((prev) => ({
							...prev,
							...objectNullCheck(obj),
						}));
						setVideoData(video);
						setAlertStatus("success");
					} else {
						setAlertStatus("error");
					}
				}
			})
			.catch((err) => {
				setIsLoading(false);
				setAlertStatus("error");
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, []);

	if (isAuthLoading) return <Loading options={{ mode: "fullscreen" }} />;
	if (!isLogin) return <NotExist />;
	if (!isAdmin) return <NotExist />;
	return (
		<Stack padding="0 12px" paddingTop={"12px"}>
			<Stack>
				<Heading>{inputValue.name}</Heading>
				<Divider />
				<Alert status={alertStatus} variant="left-accent">
					<AlertIcon />
					{alertText[alertStatus]}
				</Alert>
			</Stack>
			<Stack as="section">
				<HeadedDivider>채널 정보</HeadedDivider>
				<Stack as="form" onSubmit={handleSubmit}>
					<InputGroup>
						<InputLeftElement>
							<MdGroup />
						</InputLeftElement>
						<InputRightElement width="72px" fontSize="0.875rem">
							{typeof inputValue.group === "string" &&
							Number(inputValue.group) > 0 &&
							Number(inputValue.group) < stellarGroupName.length ? (
								<Text>{stellarGroupName[inputValue.group] ? stellarGroupName[inputValue.group][0] : ""}</Text>
							) : null}
						</InputRightElement>
						<Input
							type="number"
							placeholder="스텔라 기수"
							value={inputValue.group}
							onChange={handleInputValue("group")}
						/>
					</InputGroup>
					<InputGroup>
						<InputLeftElement>
							<FaYoutube />
						</InputLeftElement>
						<Input
							placeholder="유튜브 ID"
							value={inputValue.youtubeId}
							onChange={handleInputValue("youtubeId")}
							isDisabled={isLoading}
						/>
					</InputGroup>
					<InputGroup>
						<InputLeftElement>
							<Image boxSize={"16px"} src="/images/i_chzzk_1.png" />
						</InputLeftElement>
						<Input
							placeholder="치지직 ID"
							value={inputValue.chzzkId}
							onChange={handleInputValue("chzzkId")}
							isDisabled={isLoading}
						/>
					</InputGroup>
					<InputGroup>
						<InputLeftElement>
							<FaXTwitter />
						</InputLeftElement>
						<Input
							placeholder="X ID"
							value={inputValue.xId}
							onChange={handleInputValue("xId")}
							isDisabled={isLoading}
						/>
					</InputGroup>
					<InputGroup>
						<InputLeftElement>
							<MdColorLens />
						</InputLeftElement>
						<Input
							placeholder="컬러코드 HEX"
							value={inputValue.colorCode}
							onChange={handleInputValue("colorCode")}
							isDisabled={isLoading}
							isInvalid={inputValue.colorCode.length > 0 && !VALIDATION.hexCode(inputValue.colorCode)}
						/>
					</InputGroup>
					<InputGroup>
						<InputLeftElement>
							<MdPlaylistPlay />
						</InputLeftElement>
						<Input
							placeholder="음악 재생목록 ID"
							value={inputValue.playlistIdForMusic}
							onChange={handleInputValue("playlistIdForMusic")}
							isDisabled={isLoading}
						/>
					</InputGroup>
					<HStack width="100%" justifyContent={"space-between"}>
						<Button flex={1} type="submit" colorScheme="blue">
							등록
						</Button>
						<Button
							flex={1}
							type="button"
							onClick={() => {
								nav("/admin");
							}}
						>
							이전으로
						</Button>
					</HStack>
				</Stack>
			</Stack>
			<Stack as="section">
				<HeadedDivider>음악 재생목록</HeadedDivider>
				<MusicPlaylist data={videoData} setData={setVideoData} />
			</Stack>
			<Spacing size={64} />
		</Stack>
	);
}

function MusicPlaylist({ data, setData }: MusicPlaylistProps) {
	const values = useColorModeValues();
	const { windowWidth } = useResponsive();
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [inputValue, setInputValue] = useState<MPLInputValue>({
		id: "",
		title: "",
		titleAlias: "",
		tags: [],
		publishedAt: "",
		isActive: true,
	});
	const [currentId, setCurrentId] = useState(-1);

	const handleClickCard = (givenId: number) => () => {
		setCurrentId(givenId);
		const idx = data.findIndex((m) => m.id === givenId);
		const { id, title, titleAlias, tags, publishedAt, isActive } = data[idx];

		//2024-04-10T08:30:39.000Z"  "yyyy-MM-ddThh:mm
		setInputValue({
			id: id.toString(),
			title: title || "",
			titleAlias: titleAlias || "",
			tags,
			publishedAt: publishedAt.slice(0, -1),
			isActive,
		});
		onOpen();
	};

	const handleClose = () => {
		setCurrentId(-1);
		setInputValue({ id: "", title: "", titleAlias: "", tags: [], publishedAt: "", isActive: true });
		onClose();
	};

	return (
		<>
			<MusicDrawer
				placement={windowWidth <= 720 ? "bottom" : "right"}
				isOpen={isOpen}
				onClose={handleClose}
				inputValue={inputValue}
				setInputValue={setInputValue}
				setData={setData}
			/>
			<Stack height="360px" overflowY={"scroll"} paddingRight="4px">
				{data.map((v) => {
					return (
						<Card
							key={v.id}
							cursor="pointer"
							transition={"all .3s"}
							_hover={{ backgroundColor: values.bgHover }}
							backgroundColor={currentId === v.id ? values.bgSelected : undefined}
							onClick={handleClickCard(v.id)}
						>
							<CardBody
								display={"flex"}
								padding="12px"
								alignItems={"center"}
								justifyContent={"space-between"}
								gap="8px"
							>
								<Text fontSize="0.75rem">{v.id}</Text>
								<Text flex="1" textOverflow={"ellipsis"} whiteSpace={"nowrap"} overflow="hidden">
									{v.titleAlias || v.title}
								</Text>
								<Box>
									{v.tags.map((t) => (
										<Tag key={t.id} marginLeft="2px">
											{t.name}
										</Tag>
									))}
								</Box>
							</CardBody>
						</Card>
					);
				})}
			</Stack>
		</>
	);
}

function MusicDrawer({ inputValue, setInputValue, placement, isOpen, onClose, setData }: MusicDrawerProps) {
	const toast = useToast();

	const [tags, setTags] = useState<TagType[]>([]);
	const [isSaveLoading, setIsSaveLoading] = useState(false);

	const { isOpen: isTagOpen, onOpen: onTagOpen, onClose: onTagClose } = useDisclosure();
	const [tagName, setTagName] = useState<string>("");
	const [colorCode, setColorCode] = useState<string>("");
	const [additionalInputValue, setAdditionalInputValue] = useState<AdditionalInputValue[]>([
		{ id: -1, type: "", videoId: "" },
	]);

	const handleInputValue = (key: keyof MPLInputValue) => (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		const type = e.target.type;
		if (type === "checkbox") {
			const checked = e.target.checked;
			setInputValue((prev) => ({ ...prev, [key]: checked }));
		} else setInputValue((prev) => ({ ...prev, [key]: value }));
	};

	const handleCloseTagModal = () => {
		onTagClose();
		setTagName("");
	};

	const handleSaveTag = (e: React.FormEvent<HTMLElement>) => {
		e.preventDefault();
		if (tagName === "") {
			toast({ description: "태그 이름을 입력해주세요", status: "warning" });
		} else {
			setIsSaveLoading(true);
			fetchServer("/tag", "v1", { method: "POST", body: JSON.stringify({ name: tagName, colorCode }) })
				.then((res) => {
					if (res.status === 200) {
						onTagClose();
						setTagName("");
						setColorCode("");
						setTags((prev) => [...prev, res.data]);
					} else if (res.status === 409) {
						toast({ description: "중복된 태그 이름입니다", status: "warning" });
					}
				})
				.catch((err) => {
					toast({ description: "태그 생성 중 에러가 발생했습니다", status: "error" });
				})
				.finally(() => {
					setIsSaveLoading(false);
				});
		}
	};

	const handleSaveMusic = (e: React.FormEvent<HTMLElement>) => {
		e.preventDefault();
		// if (inputValue.title === "") {
		// 	toast({ description: "제목을 입력해 주세요", status: "warning" });
		// } else
		fetchServer(`/y/${inputValue.id}`, "v1", {
			method: "POST",
			body: JSON.stringify({
				titleAlias: inputValue.titleAlias,
				tags: inputValue.tags,
				details: additionalInputValue,
				isActive: inputValue.isActive,
			}),
		})
			.then((res) => {
				if (res.status === 200) {
					onClose();
				} else if (res.status === 500) {
					toast({ description: "음악 수정 중 에러가 발생했습니다", status: "error" });
				}
			})
			.catch((err) => {
				toast({ description: "음악 수정 중 에러가 발생했습니다", status: "error" });
			});
	};

	const handleChangeTag = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		const numVal = parseInt(value);
		e.target.value = "";
		if (value === "") {
			return;
		} else if (value === "new") {
			onTagOpen();
		} else {
			setInputValue((prev) => {
				const newTags = [...prev.tags];
				if (newTags.find((t) => t.id === numVal)) {
					return prev;
				}
				newTags.push({ id: numVal, name: tags.find((t) => t.id === numVal)?.name || "" });
				return { ...prev, tags: newTags };
			});
		}
	};

	const handleAdditionalInputValue =
		(key: keyof Omit<AdditionalInputValue, "id">, idx: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			setAdditionalInputValue((prev) => {
				const arr = [...prev];
				arr[idx][key] = value;
				return arr;
			});
		};

	const handleCreateAdditionalInput = () => {
		setAdditionalInputValue((prev) => {
			const arr = [...prev];
			arr.push({ id: -1, type: "", videoId: "" });
			return arr;
		});
	};

	const handleDeleteAdditionalInput = (idx: number) => () => {
		setAdditionalInputValue((prev) => {
			const arr = [...prev];
			arr.splice(idx, 1);
			return arr;
		});
	};

	useEffect(() => {
		fetchServer("/tags", "v1").then((res) => {
			if (res.status === 200) setTags(res.data);
		});
	}, []);

	useConsole(additionalInputValue);

	return (
		<>
			<Modal isOpen={isTagOpen} onClose={handleCloseTagModal} isCentered>
				<ModalOverlay />
				<ModalContent as="form" onSubmit={handleSaveTag}>
					<ModalHeader>새 태그 만들기</ModalHeader>
					<ModalBody>
						<InputGroup marginBottom={"4px"}>
							<InputLeftElement>
								<MdTitle />
							</InputLeftElement>
							<Input
								value={tagName}
								onChange={(e) => {
									setTagName(e.target.value);
								}}
							/>
						</InputGroup>
						<InputGroup>
							<InputLeftElement>
								<MdColorLens />
							</InputLeftElement>
							<Input
								value={colorCode}
								onChange={(e) => {
									setColorCode(e.target.value);
								}}
							/>
						</InputGroup>
					</ModalBody>
					<ModalFooter gap="4px">
						<Button type="submit" colorScheme="blue">
							저장
						</Button>
						<Button type="button" onClick={handleCloseTagModal}>
							취소
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
			<Drawer isOpen={isOpen} onClose={onClose} placement={placement} size="sm">
				<DrawerOverlay />
				<DrawerContent>
					<DrawerCloseButton />
					<DrawerHeader>{inputValue.id ? `${inputValue.id}번 항목` : "..."}</DrawerHeader>
					<Box as="form" onSubmit={handleSaveMusic} overflow={"auto"}>
						<DrawerBody>
							<Stack gap="4px">
								<InputGroup>
									<InputLeftElement>
										<MdTitle />
									</InputLeftElement>
									<Input value={inputValue.title} isDisabled />
								</InputGroup>
								<InputGroup>
									<InputLeftElement>
										<MdTitle />
									</InputLeftElement>
									<Input
										value={inputValue.titleAlias}
										placeholder="대체 타이틀"
										onChange={handleInputValue("titleAlias")}
									/>
								</InputGroup>
								<InputGroup>
									<Select placeholder="태그" onChange={handleChangeTag}>
										{tags.map((t) => (
											<option key={t.id} value={t.id}>
												{t.name}
											</option>
										))}
										<option value="new">+ 새 태그 만들기</option>
									</Select>
								</InputGroup>
								<Box>
									{inputValue.tags.map((tag) => (
										<Tag key={tag.id} colorScheme="blue" marginRight="2px">
											<TagLabel>{tag.name}</TagLabel>
											<TagCloseButton
												onClick={() => {
													const numVal = tag.id;
													setInputValue((prev) => {
														const newTags = [...prev.tags];
														const idx = prev.tags.findIndex((t) => t.id === numVal);
														newTags.splice(idx, 1);
														return { ...prev, tags: newTags };
													});
												}}
											/>
										</Tag>
									))}
								</Box>
								<InputGroup>
									<InputLeftElement>
										<MdCalendarMonth />
									</InputLeftElement>
									<Input
										type="datetime-local"
										value={inputValue.publishedAt}
										onChange={handleInputValue("publishedAt")}
										isDisabled
									/>
								</InputGroup>
								<InputGroup paddingLeft="12px">
									<Checkbox isChecked={inputValue.isActive} onChange={handleInputValue("isActive")}>
										활성화
									</Checkbox>
								</InputGroup>
								<Wrapper marginTop="8px">
									<Heading size="md">부가 영상</Heading>
									{/* 이 리스트는 길이가 1 이상 */}
									{additionalInputValue.map((add, idx) => {
										const { type, videoId } = add;
										return (
											<Wrapper key={`${add.id}-${idx}`} position="relative">
												<InputGroup>
													<InputLeftElement>
														<MdTitle />
													</InputLeftElement>
													<Input
														value={type}
														placeholder="표시될 타입"
														onChange={handleAdditionalInputValue("type", idx)}
													/>
													{idx !== 0 ? (
														<CloseButton transform={"translateX(5px)"} onClick={handleDeleteAdditionalInput(idx)} />
													) : null}
												</InputGroup>
												<InputGroup>
													<InputLeftElement>
														<MdOutlineVideocam />
													</InputLeftElement>
													<Input
														value={videoId}
														placeholder="유튜브 영상 ID"
														onChange={handleAdditionalInputValue("videoId", idx)}
													/>
												</InputGroup>
											</Wrapper>
										);
									})}
									<Button leftIcon={<MdAdd />} size="sm" onClick={handleCreateAdditionalInput}>
										영상 추가하기
									</Button>
								</Wrapper>
							</Stack>
						</DrawerBody>
						<DrawerFooter gap="4px" position="sticky" bottom={0} right={0} bg="white">
							<Button type="submit" colorScheme="blue" isLoading={isSaveLoading}>
								변경사항 저장
							</Button>
							<Button type="button" onClick={onClose}>
								취소
							</Button>
						</DrawerFooter>
					</Box>
				</DrawerContent>
			</Drawer>
		</>
	);
}

function TagModal({ isOpen, onClose, inputValue, setInputValue, refetch }: TagModalProps) {
	const toast = useToast();
	const handleInputValue = (key: keyof TagData) => (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setInputValue((prev) => ({ ...prev, [key]: value }));
	};
	const handleSubmit = (e: React.FormEvent<HTMLDivElement>) => {
		e.preventDefault();
		if (inputValue.name.trim() === "") {
			toast({ status: "error", description: "이름 값이 비었습니다." });
			return;
		}

		fetchServer(`/tag/${inputValue.id}`, "v1", { method: "PATCH", body: JSON.stringify(inputValue) })
			.then((res) => {
				if (res.status === 200) {
					toast({ description: TOAST_MESSAGE.edit("태그"), status: "success" });
					onClose();
					refetch();
				} else if (res.status === 500) {
					toast({ status: "error", description: "예기치 못한 문제가 발생했습니다" });
				}
			})
			.catch((err: any) => {
				toast({ status: "error", description: err.stack });
			});
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} isCentered>
			<ModalOverlay onClick={onClose} />
			<ModalContent as="form" onSubmit={handleSubmit}>
				<ModalHeader>{inputValue.id}번 항목</ModalHeader>
				<ModalBody>
					<Stack gap={"4px"}>
						<InputGroup>
							<InputLeftElement>
								<MdTitle />
							</InputLeftElement>
							<Input value={inputValue.name} onChange={handleInputValue("name")} />
						</InputGroup>
						<InputGroup>
							<InputLeftElement>
								<MdColorLens />
							</InputLeftElement>
							<Input
								value={inputValue.colorCode}
								onChange={handleInputValue("colorCode")}
								isInvalid={inputValue.colorCode.length > 0 && !VALIDATION.hexCode(inputValue.colorCode)}
							/>
						</InputGroup>
					</Stack>
				</ModalBody>
				<ModalFooter gap="4px">
					<Button type="submit">등록</Button>
					<Button
						type="button"
						onClick={() => {
							onClose();
						}}
					>
						취소
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

function HeadedDivider({ children }) {
	return (
		<Box position="relative" padding="32px 16px 16px 16px">
			<Divider />
			<AbsoluteCenter
				bg="var(--chakra-colors-chakra-body-bg)"
				px="4"
				fontSize={"1.25rem"}
				fontWeight={"bold"}
				paddingTop="12px"
			>
				{children}
			</AbsoluteCenter>
		</Box>
	);
}

interface VideoData {
	id: number;
	type: "music";
	title: string;
	titleAlias: string;
	thumbnail: string;
	videoId: string;
	channelId: string;
	viewCount: string;
	likeCount: string;
	isOriginal: boolean | null;
	isCollaborated: boolean | null;
	tags: TagType[];
	publishedAt: string;
	isActive: boolean;
}

interface StellarInputValue {
	name: string;
	group: string;
	youtubeId: string;
	chzzkId: string;
	xId: string;
	colorCode: string;
	playlistIdForMusic: string;
}

interface StellarData extends StellarInputValue {
	id: number;
}

interface MPLInputValue {
	id: string;
	title: string;
	titleAlias: string;
	tags: TagType[];
	publishedAt: string;
	isActive: boolean;
}

interface MusicPlaylistProps {
	data: VideoData[];
	setData: Dispatch<SetStateAction<VideoData[]>>;
}

interface MusicDrawerProps {
	inputValue: MPLInputValue;
	setInputValue: Dispatch<SetStateAction<MPLInputValue>>;
	placement?: "top" | "left" | "bottom" | "right";
	isOpen: boolean;
	onClose: () => void;
	setData: Dispatch<SetStateAction<VideoData[]>>;
}

interface TagModalProps {
	isOpen: boolean;
	onClose: () => void;
	inputValue: TagData;
	setInputValue: Dispatch<SetStateAction<TagData>>;
	refetch: () => void;
}

interface TagData {
	id: number;
	name: string;
	colorCode: string;
}

interface AdditionalInputValue {
	id: number;
	type: string;
	videoId: string;
}
