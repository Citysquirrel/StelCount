import Wrapper from "@/components/Wrapper";
import { VideoDetail } from "@/lib/types";
import {
	Box,
	Button,
	CloseButton,
	Flex,
	Grid,
	Heading,
	Input,
	InputGroup,
	InputLeftElement,
	Text,
	VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { MdAdd, MdOutlineVideocam, MdTitle } from "react-icons/md";

export interface AdditionalInputValue {
	type: string;
	videoId: string;
}

interface DetailsEditorProps {
	data: VideoDetail[] | undefined;
	onChangeDetails?: (details: AdditionalInputValue[]) => void;
}

export default function DetailsEditor({ data = [], onChangeDetails }: DetailsEditorProps) {
	const [additionalInputValue, setAdditionalInputValue] = useState<AdditionalInputValue[]>([{ type: "", videoId: "" }]);

	const handleAdditionalInputValue =
		(key: keyof AdditionalInputValue, idx: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			setAdditionalInputValue((prev) => {
				const next = [...prev];
				next[idx][key] = value;
				onChangeDetails?.(next);
				return next;
			});
		};

	const handleCreateAdditionalInput = () => {
		setAdditionalInputValue((prev) => {
			const next = [...prev];
			next.push({ type: "", videoId: "" });
			onChangeDetails?.(next);
			return next;
		});
	};

	const handleDeleteAdditionalInput = (idx: number) => () => {
		setAdditionalInputValue((prev) => {
			const next = prev.filter((_, itemIndex) => itemIndex !== idx);
			onChangeDetails?.(next);
			return next;
		});
	};

	useEffect(() => {
		if (data) {
			setAdditionalInputValue(data.map((d) => ({ type: d.type, videoId: d.videoId })));
		}
	}, [data]);

	return (
		<VStack w="100%" align="flex-start" gap={0}>
			<Flex w="100%" align="center" justify={"space-between"} gap={2}>
				<Heading size="md">부가 영상</Heading>
				<Button leftIcon={<MdAdd />} size="sm" onClick={handleCreateAdditionalInput}>
					영상 추가하기
				</Button>
			</Flex>
			{additionalInputValue.length > 0 && (
				<Grid
					gap={1}
					mt={2}
					templateColumns="repeat(2, 1fr)"
					maxH="176px"
					overflowY="auto"
					pr={additionalInputValue.length > 4 ? 1 : undefined}
				>
					{additionalInputValue.map((add, idx) => {
						const { type, videoId } = add;
						return (
							<Wrapper key={idx} position="relative" p={2} gap={1}>
								<InputGroup size="sm">
									<InputLeftElement>
										<MdTitle />
									</InputLeftElement>
									<Input value={type} placeholder="표시될 타입" onChange={handleAdditionalInputValue("type", idx)} />
									<CloseButton transform={"translateX(5px)"} onClick={handleDeleteAdditionalInput(idx)} />
								</InputGroup>
								<InputGroup size="sm">
									<InputLeftElement>
										<MdOutlineVideocam />
									</InputLeftElement>
									<Input
										value={videoId}
										placeholder="유튜브 영상 ID"
										onChange={handleAdditionalInputValue("videoId", idx)}
									/>
									<Box boxSize="28px"></Box>
									<Text color="gray" fontSize="xs" position="absolute" right={0} bottom={"-4px"}>
										{idx + 1}
									</Text>
								</InputGroup>
							</Wrapper>
						);
					})}
				</Grid>
			)}
		</VStack>
	);
}
