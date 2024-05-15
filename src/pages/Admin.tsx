import {
	Box,
	Button,
	IconButton,
	Input,
	Spacer,
	Stack,
	Table,
	TableContainer,
	Tbody,
	Td,
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

export function Admin() {
	const firstRef = useRef<HTMLInputElement | null>(null);

	const [inputValue, setInputValue] = useState<StellarInputValue>({
		name: "",
		youtubeId: "",
		chzzkId: "",
		xId: "",
		colorCode: "",
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

	const handleDelete = (id: number) => (e: React.MouseEvent<HTMLButtonElement>) => {
		fetchServer(`/stellar`, "v1", { method: "DELETE", body: JSON.stringify({ id }) }).then((res) => {
			getStellarData();
		});
	};

	useEffect(() => {
		// console.log(stellarData);
		getStellarData();
		firstRef.current?.focus();
	}, []);

	if (isLoading) return <Loading />;
	return (
		<>
			<Box as="section">
				<Stack as="form" onSubmit={handleSubmit}>
					<Input ref={firstRef} placeholder="스텔라 이름" value={inputValue.name} onChange={handleInputValue("name")} />
					<Input placeholder="유튜브 ID" value={inputValue.youtubeId} onChange={handleInputValue("youtubeId")} />
					<Input placeholder="치지직 ID" value={inputValue.chzzkId} onChange={handleInputValue("chzzkId")} />
					<Input placeholder="X ID" value={inputValue.xId} onChange={handleInputValue("xId")} />
					<Input placeholder="컬러코드 HEX" value={inputValue.xId} onChange={handleInputValue("colorCode")} />
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
		</>
	);
}

interface StellarInputValue {
	name: string;
	youtubeId: string;
	chzzkId: string;
	xId: string;
	colorCode: string;
}

interface StellarData extends StellarInputValue {
	id: number;
}
