/* eslint-disable @typescript-eslint/no-explicit-any */
import { formatDateToYYYYMMDD } from "@/lib/functions/etc";
import VALIDATION from "@/lib/functions/validation";
import { useServerMutation } from "@/lib/hooks/useServerApi";
import { SongHistory } from "@/lib/types";
import {
	Box,
	Button,
	Flex,
	FormControl,
	FormHelperText,
	FormLabel,
	Input,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Text,
	useToast,
	VStack,
} from "@chakra-ui/react";
import { Fragment } from "react";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";

interface BulkUpdateModalProps {
	isModalOpen: boolean;
	setIsModalOpen: Dispatch<SetStateAction<boolean>>;
	bulkIndex: number[];
	data: SongHistory[] | null;
	onSave?: () => void;
}

interface Updates {
	sungAt: string;
	youtubeVideoId: string;
	memo: string;
}

export default function BulkUpdateModal({
	isModalOpen,
	setIsModalOpen,
	bulkIndex,
	data,
	onSave,
}: BulkUpdateModalProps) {
	const toast = useToast();
	const [updates, setUpdates] = useState<Updates>({
		sungAt: "",
		youtubeVideoId: "",
		memo: "",
	});

	const editHistory = useServerMutation<void, { ids: number[]; updates: Updates }, "admin">({
		version: "admin",
		api: "/histories",
		method: "PATCH",
	});

	const isSungAtEmpty = updates.sungAt === "";

	const handleClose = () => setIsModalOpen(false);

	const handleInputValue = (key: keyof Updates, value?: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
		setUpdates((prev) => ({ ...prev, [key]: value || e.target.value }));
	};
	const handleSave = () => {
		if (isSungAtEmpty) return;
		editHistory.mutate(
			{ ids: bulkIndex, updates },
			{
				onSuccess: () => {
					handleClose();
					onSave && onSave();
				},
				onError: () => {
					toast({ description: "데이터 등록 중 서버 에러 발생" });
				},
			},
		);
	};

	const groupByKeys = <T extends object>(
		data: T[],
		whitelist: Extract<keyof T, string>[],
	): { [key: string]: any[] } => {
		return data.reduce(
			(acc, curr) => {
				for (const [key, value] of Object.entries(curr)) {
					if ((whitelist as string[]).includes(key)) {
						if (!acc[key]) {
							acc[key] = [];
						}
						acc[key].push(value);
					}
				}
				return acc;
			},
			{} as { [key: string]: any[] },
		);
	};

	const group = useMemo(() => groupByKeys(data || [], ["sungAt", "youtubeVideoId", "memo"]), [data]) as {
		sungAt: any[];
		youtubeVideoId: any[];
		memo: any[];
	};

	const renderHelperText = (set: Set<any>) => [...set].filter(Boolean).join(", ");

	useEffect(() => {
		setUpdates((prev) => ({ ...prev, sungAt: formatDateToYYYYMMDD(group?.sungAt?.[0]) }));
	}, [group]);

	return (
		<Modal isOpen={isModalOpen} onClose={handleClose}>
			<ModalOverlay />
			<ModalContent>
				<ModalHeader>
					묶음 편집
					<Text fontSize="xs" color="gray" fontWeight="400">
						{bulkIndex.join(", ")}
					</Text>
				</ModalHeader>

				<ModalCloseButton />
				<ModalBody>
					<Flex gap={3} flexDir={"column"}>
						<VStack flex={1}>
							<FormControl flex={1} isInvalid={isSungAtEmpty}>
								<FormLabel fontSize="sm">날짜</FormLabel>
								<Input size="sm" type="date" value={updates.sungAt || ""} onChange={handleInputValue("sungAt")} />
								<FormHelperText fontSize="xs" fontStyle={"italic"}>
									{[...new Set(group.sungAt?.map((s) => formatDateToYYYYMMDD(s)))].filter(Boolean).map((s, i, arr) => (
										<Fragment key={s}>
											<Box
												as="span"
												cursor="pointer"
												onClick={() => {
													setUpdates((prev) => ({ ...prev, sungAt: s }));
												}}
											>
												{s}
											</Box>
											{arr.length - 1 === i ? null : <Box as="span">, </Box>}
										</Fragment>
									))}
								</FormHelperText>
							</FormControl>
							<FormControl
								flex={1}
								isInvalid={updates.youtubeVideoId.length > 0 && !VALIDATION.youtubeId(updates.youtubeVideoId)}
							>
								<FormLabel fontSize="sm">유튜브 Video ID</FormLabel>
								<Input size="sm" value={updates.youtubeVideoId || ""} onChange={handleInputValue("youtubeVideoId")} />
								<FormHelperText fontSize="xs" fontStyle={"italic"}>
									{renderHelperText(new Set(group.youtubeVideoId))}
								</FormHelperText>
							</FormControl>
							<FormControl flex={1}>
								<FormLabel fontSize="sm">메모</FormLabel>
								<Input size="sm" value={updates.memo || ""} onChange={handleInputValue("memo")} />
								<FormHelperText fontSize="xs" fontStyle={"italic"}>
									{renderHelperText(new Set(group.memo))}
								</FormHelperText>
							</FormControl>
						</VStack>
					</Flex>
				</ModalBody>
				<ModalFooter>
					<Button variant="ghost" mr={3} onClick={handleClose}>
						취소
					</Button>
					<Button colorScheme="blue" onClick={handleSave} disabled={editHistory.isPending || isSungAtEmpty}>
						적용하기
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
