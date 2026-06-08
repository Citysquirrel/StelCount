import { useEffect, useRef, useState } from "react";
import { fetchServer } from "../../lib/functions/fetch";
import { Badge, Box, Flex, HStack, Heading, IconButton, Stack, Text } from "@chakra-ui/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import useColor from "../../lib/hooks/useColor";

interface StellarInputValue {
	name: string;
	nameShort: string;
	group: string;
	formerGroups: string[];
	youtubeId: string;
	chzzkId: string;
	xId: string;
	colorCode: string;
	playlistIdForMusic: string;
	justLive: boolean;
	debut: string;
	graduation: string;
}

interface StellarData extends StellarInputValue {
	id: number;
	youtubeCustomUrl: string;
}

export function Stellar() {
	const [stellarData, setStellarData] = useState<StellarData[]>([]);

	const { bgCard, borderColor, headerBg, greenColor, redColor, blueColor, grayColor, yellowColor, fieldHoverBgColor } =
		useColor();

	const parentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		fetchServer("admin", "/stellars").then((res) => {
			setStellarData(res.data.data);
		});
		// fetchServer("v1", "/tags").then(() => {});
	}, []);
	// --- [가상화 스크롤 설정] ---
	const rowVirtualizer = useVirtualizer({
		count: stellarData.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 64, // 행의 대략적인 높이(px)
		overscan: 10, // 보이지 않는 영역에 미리 렌더링할 개수 (부드러운 스크롤링)
	});
	return (
		<Box p={8}>
			<Box mb={8}>
				<Heading size="lg" mb={2}>
					스텔라 데이터 관리
				</Heading>
				<Text color="gray.500" fontSize="sm">
					스텔라들의 상세 데이터를 관리합니다.
				</Text>
			</Box>
			<Stack>
				<Box
					bg={bgCard}
					rounded="xl"
					shadow="sm"
					border={`1px solid ${borderColor}`}
					overflow="hidden" // 헤더나 아이템의 배경색이 둥근 모서리를 삐져나가지 않게 막아줍니다.
				>
					{/* 💡 2. 테이블 헤더 (스크롤 컨테이너 바깥으로 완전 분리) */}
					{/* 더 이상 스크롤 안에 있지 않으므로 position="sticky", top={0}, zIndex 속성이 필요 없어 삭제했습니다. */}
					<Flex bg={headerBg} borderBottom={`1px solid ${borderColor}`} px={4} py={3} fontWeight="bold" fontSize="sm">
						<Box w="60px">행</Box>
						<Box w="100px">상태</Box>
						<Box w="60px" textAlign="center">
							공식
						</Box>
						<Box w="60px" textAlign="center">
							가사
						</Box>
						<Box flex={1}>곡 제목 / 아티스트</Box>
						<Box w="100px" textAlign="center">
							조작
						</Box>
					</Flex>

					{/* 💡 3. 실제 스크롤이 발생하는 가상화 컨테이너 */}
					{/* 헤더 바로 아래에 배치되며, ref={parentRef}가 여기에 들어옵니다. */}
					<Box ref={parentRef} h="600px" overflowY="auto">
						<Box position="relative" h={`${rowVirtualizer.getTotalSize()}px`} w="100%">
							{/* 가상화된 행 렌더링 */}
							{rowVirtualizer.getVirtualItems().map((virtualRow) => {
								const song = stellarData[virtualRow.index];
								// const isFaded = song.actionStatus === "DELETED" || song.actionStatus === "DISABLED";
								const rowColorMap = {
									NEW: greenColor,
									MODIFIED: yellowColor,
									UNCHANGED: "transparent",
								};
								const borderColorMap = {
									ACTIVE: blueColor,
									DELETED: redColor,
									DISABLED: grayColor,
								};

								return (
									<Flex
										key={virtualRow.key}
										position="absolute"
										top={0}
										left={0}
										w="100%"
										transform={`translateY(${virtualRow.start}px)`}
										h={`${virtualRow.size}px`}
										px={4}
										align="center"
										// bg={bgColor}
										borderBottom={`1px solid ${borderColor}`}
										// outline={song.actionStatus === "ACTIVE" ? undefined : "1px solid"}
										// outlineColor={borderColorMap[song.actionStatus] || undefined}
										cursor="pointer"
										_hover={{ bg: fieldHoverBgColor }}
										// onClick={() => handleRowClick(virtualRow.index)} // 행 클릭 시 수정 모달 오픈
									>
										{/* <Box w="60px">{song.columnData}</Box>
										<Stack w="100px" alignItems={"flex-start"}>
											<Badge
												colorScheme={
													song.syncStatus === "NEW" ? "green" : song.syncStatus === "MODIFIED" ? "yellow" : "gray"
												}
											>
												{song.syncStatus}
											</Badge>
											<Badge
												colorScheme={
													song.actionStatus === "ACTIVE"
														? "blue"
														: song.actionStatus === "DELETED"
															? "red"
															: song.actionStatus === "DISABLED"
																? "orange"
																: "gray"
												}
											>
												{song.actionStatus}
											</Badge>
										</Stack>
										<Box w="60px" textAlign="center">
											{song.isOfficial && <Icon as={FiCheckCircle} color="blue.500" boxSize={5} />}
										</Box>
										<Box w="60px" textAlign="center">
											{!!song.lyric && <Icon as={FiCheckCircle} color="blue.500" boxSize={5} />}
										</Box>
										<Box
											flex={1}
											opacity={isFaded ? 0.5 : 1}
											textDecoration={song.actionStatus === "DELETED" ? "line-through" : "none"}
										>
											<Text fontWeight="bold">
												{song.title}{" "}
												<Badge
													ml={1}
													colorScheme={song.genre === "K-POP" ? "green" : song.genre === "J-POP" ? "blue" : "yellow"}
												>
													{song.genre}
												</Badge>
											</Text>
											<Text fontSize="sm" color="gray.500">
												{song.artist}
											</Text>
										</Box> */}

										{/* 조작 버튼 구역 */}
										{/* <Box w="100px" textAlign="center">
											<HStack spacing={1} justify="center">
												{song.actionStatus === "ACTIVE" ? null : (
													<IconButton
														aria-label="Active"
														icon={<FiCheckCircle />}
														size="md"
														variant="ghost"
														colorScheme="green"
														onClick={(e) => toggleStatus(e, song.syncId, "ACTIVE")}
													/>
												)}
												<>
													{song.actionStatus === "DISABLED" ? null : (
														<IconButton
															aria-label="Disable"
															icon={<FiEyeOff />}
															size="md"
															variant="ghost"
															colorScheme="orange"
															onClick={(e) => toggleStatus(e, song.syncId, "DISABLED")}
														/>
													)}
													{song.actionStatus === "DELETED" ? null : (
														<IconButton
															aria-label="Delete"
															icon={<FiTrash2 />}
															size="md"
															variant="ghost"
															colorScheme="red"
															onClick={(e) => toggleStatus(e, song.syncId, "DELETED")}
														/>
													)}
												</>
											</HStack>
										</Box> */}
									</Flex>
								);
							})}
						</Box>
					</Box>
				</Box>
			</Stack>
		</Box>
	);
}
