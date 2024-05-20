import {
	AbsoluteCenter,
	Alert,
	AlertIcon,
	Box,
	Button,
	Divider,
	HStack,
	Heading,
	IconButton,
	Input,
	InputGroup,
	InputLeftElement,
	InputRightElement,
	Link,
	Stack,
	Table,
	TableContainer,
	Tbody,
	Td,
	Text,
	Th,
	Thead,
	Tr,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { fetchServer } from "../lib/functions/fetch";
import { MdColorLens, MdDelete, MdEdit, MdGroup, MdOpenInNew, MdPerson, MdPlaylistPlay } from "react-icons/md";
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
import { stellarGroupName } from "../lib/constant";

export function Admin() {
	const firstRef = useRef<HTMLInputElement | null>(null);
	const nav = useNavigate();
	const [offsetY] = useRecoilState(headerOffsetState);
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
	const [stellarData, setStellarData] = useState<StellarData[]>([]);
	const { isLoading, isLogin, isAdmin } = useAuth();

	const getStellarData = () => {
		fetchServer("/stellars", "v1").then((res) => {
			if (res) {
				if (res.status === 200) setStellarData(res.data);
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
			return alert("스텔라 이름을 입력해주세요");
		}
		fetchServer("/stellar", "v1", { method: "POST", body: JSON.stringify(inputValue) }).then((res) => {
			// console.log(res.data);
			getStellarData();
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
				alert("올바르지 않은 채널명입니다.");
			}
		});
	};

	const handleEdit = (id: number) => () => {
		nav(`/admin/${id}`);
	};

	const handleDelete = (id: number) => (e: React.MouseEvent<HTMLButtonElement>) => {
		// const name = checkConsonantAtLast(`${stellarData.find(s => s.id === id)?.name}`,"o")
		if (!confirm(`${stellarData.find((s) => s.id === id)?.name} 항목을 삭제하시겠습니까?`)) {
		} else {
			fetchServer(`/stellar/${id}`, "v1", { method: "DELETE", body: JSON.stringify({ id }) }).then((res) => {
				getStellarData();
			});
		}
	};

	useEffect(() => {
		getStellarData();
		firstRef.current?.focus();
	}, []);

	if (isLoading) return <Loading options={{ mode: "fullscreen" }} />;
	return (
		<Stack padding="0 12px">
			<Spacing size={24 + offsetY} />
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
							<Image boxSize={"16px"} src="/src/assets/i_chzzk_1.png" />
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
									{Number(s.group) > 0 && Number(s.group) < stellarGroupName.length
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
			<Spacing size={48} />
		</Stack>
	);
}

export function AdminEdit() {
	const nav = useNavigate();
	const { id } = useParams();
	const [stellarData, setStellarData] = useRecoilState(stellarState);
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
						const { name, group, chzzkId, youtubeId, xId, colorCode, playlistIdForMusic } = res.data;
						const obj = { name, group, chzzkId, youtubeId, xId, colorCode, playlistIdForMusic };
						setInputValue((prev) => ({
							...prev,
							...objectNullCheck(obj),
						}));
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

	return (
		<Stack padding="0 12px" paddingTop={"12px"}>
			<Spacing size={offsetY} />
			<Stack
			// position="sticky"
			// top={`${offsetY + 24}px`}
			// left="0"
			// zIndex={1}
			// backgroundColor="var(--chakra-colors-chakra-body-bg)"
			>
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
						<Input
							placeholder="유튜브 ID"
							value={inputValue.youtubeId}
							onChange={handleInputValue("youtubeId")}
							isDisabled={isLoading}
						/>
					</InputGroup>
					<InputGroup>
						<InputLeftElement>
							<Image boxSize={"16px"} src="/src/assets/i_chzzk_1.png" />
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
				<HeadedDivider>재생목록</HeadedDivider>
			</Stack>
		</Stack>
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
