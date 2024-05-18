import {
	AbsoluteCenter,
	Alert,
	AlertIcon,
	AlertTitle,
	Box,
	Button,
	Divider,
	HStack,
	Heading,
	IconButton,
	Input,
	Spacer,
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
import { MdDelete, MdEdit } from "react-icons/md";
import { CopyText } from "../components/CopyText";
import { useAuth } from "../lib/hooks/useAuth";
import { Loading } from "../components/Loading";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilState } from "recoil";
import { headerOffsetState, stellarState } from "../lib/Atom";
import { checkConsonantAtLast } from "../lib/functions/consonant";
import { Spacing } from "../components/Spacing";

export function Admin() {
	const firstRef = useRef<HTMLInputElement | null>(null);
	const nav = useNavigate();

	const [inputValue, setInputValue] = useState<StellarInputValue>({
		name: "",
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

	if (isLoading) return <Loading />;
	return (
		<Stack padding="0 12px">
			<Spacing size={24} />
			<Box as="section">
				<Stack as="form" onSubmit={handleSubmit}>
					<Input ref={firstRef} placeholder="스텔라 이름" value={inputValue.name} onChange={handleInputValue("name")} />
					<Input placeholder="유튜브 ID" value={inputValue.youtubeId} onChange={handleInputValue("youtubeId")} />
					<Input placeholder="치지직 ID" value={inputValue.chzzkId} onChange={handleInputValue("chzzkId")} />
					<Input placeholder="X ID" value={inputValue.xId} onChange={handleInputValue("xId")} />
					<Input placeholder="컬러코드 HEX" value={inputValue.colorCode} onChange={handleInputValue("colorCode")} />
					<Input
						placeholder="음악 재생목록 ID"
						value={inputValue.playlistIdForMusic}
						onChange={handleInputValue("playlistIdForMusic")}
					/>
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
							<Th>치지직 ID</Th>
							<Th>유튜브 ID</Th>
							<Th>X ID</Th>
							<Th>컬러코드 HEX</Th>
							<Th>설정</Th>
						</Tr>
					</Thead>
					<Tbody>
						{stellarData.map((s, idx) => (
							<Tr key={`${s.id}-${idx}`}>
								<Td isNumeric>{s.id}</Td>
								<Td>{s.name}</Td>
								<Td>
									<CopyText>{s.chzzkId}</CopyText>
								</Td>
								<Td>
									<CopyText>{s.youtubeId}</CopyText>
								</Td>
								<Td>
									<CopyText>{s.xId}</CopyText>
								</Td>
								<Td>
									<CopyText>{s.colorCode}</CopyText>
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
							</Tr>
						))}
					</Tbody>
				</Table>
			</TableContainer>
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
		fetchServer("/stellar", "v1", { method: "PATCH", body: JSON.stringify(inputValue) })
			.then((res) => {
				if (res) {
					if (res.status === 200) {
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
						const { name, chzzkId, youtubeId, xId, colorCode } = res.data;
						setInputValue((prev) => ({ ...prev, name, chzzkId, youtubeId, xId, colorCode }));
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
					<Input
						placeholder="유튜브 ID"
						value={inputValue.youtubeId}
						onChange={handleInputValue("youtubeId")}
						isDisabled={isLoading}
					/>
					<Input
						placeholder="치지직 ID"
						value={inputValue.chzzkId}
						onChange={handleInputValue("chzzkId")}
						isDisabled={isLoading}
					/>
					<Input placeholder="X ID" value={inputValue.xId} onChange={handleInputValue("xId")} isDisabled={isLoading} />
					<Input
						placeholder="컬러코드 HEX"
						value={inputValue.colorCode}
						onChange={handleInputValue("colorCode")}
						isDisabled={isLoading}
					/>
					<Input
						placeholder="음악 재생목록 ID"
						value={inputValue.playlistIdForMusic}
						onChange={handleInputValue("playlistIdForMusic")}
						isDisabled={isLoading}
					/>
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
	youtubeId: string;
	chzzkId: string;
	xId: string;
	colorCode: string;
	playlistIdForMusic: string;
}

interface StellarData extends StellarInputValue {
	id: number;
}
