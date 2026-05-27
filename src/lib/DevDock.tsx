import React, { useEffect, useState, useRef } from "react";
import {
	Box,
	Flex,
	Text,
	Button,
	Badge,
	VStack,
	HStack,
	Accordion,
	AccordionItem,
	AccordionButton,
	AccordionPanel,
	AccordionIcon,
	useToast,
} from "@chakra-ui/react";
import { NetworkLog } from "./functions/fetch"; // 본인의 API 파일 경로로 수정

const STORAGE_KEY__NETWORK_DOCK = "network_dock_position";

export const NetworkDock: React.FC = () => {
	const [logs, setLogs] = useState<NetworkLog[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const toast = useToast();
	const dockRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleNetworkLog = (event: Event) => {
			const customEvent = event as CustomEvent<NetworkLog>;
			const newLog = customEvent.detail;
			setLogs((prev) => {
				const existingIndex = prev.findIndex((log) => log.id === newLog.id);
				if (existingIndex > -1) {
					const updatedLogs = [...prev];
					updatedLogs[existingIndex] = { ...updatedLogs[existingIndex], ...newLog };
					return updatedLogs;
				}
				return [newLog, ...prev];
			});
		};
		window.addEventListener("network-log", handleNetworkLog);
		return () => window.removeEventListener("network-log", handleNetworkLog);
	}, []);

	// 🔥 완벽하게 독립된 바닐라 JS 이벤트 핸들러
	useEffect(() => {
		const dock = dockRef.current;
		const consoleDock = document.getElementById("console-dock");
		if (!dock) return;

		const savedPos = JSON.parse(localStorage.getItem(STORAGE_KEY__NETWORK_DOCK) || '{"x": 0, "y": 0}');
		let currentX = savedPos.x;
		let currentY = savedPos.y;
		dock.style.transform = `translate(${currentX}px, ${currentY}px)`;

		let isDragging = false;
		let hasMoved = false; // 🔥 클릭인지 드래그인지 판별할 플래그
		let startMouseX = 0;
		let startMouseY = 0;
		let lastClickTime = 0; // 🔥 더블클릭 감지용

		const onPointerDown = (e: PointerEvent) => {
			if (consoleDock) {
				dock.style.zIndex = "1501";
				consoleDock.style.zIndex = "1500";
			}
			const target = e.target as HTMLElement;
			if (!target.closest("#network-drag-handle")) return;
			if (target.closest("button") && target.id !== "network-drag-handle") return;

			// ⚡ 바닐라 JS 더블클릭 감지 로직 (0.3초 안에 두 번 누르면 초기화)
			const currentTime = new Date().getTime();
			if (currentTime - lastClickTime < 300) {
				currentX = 0;
				currentY = 0;
				dock.style.transform = `translate(0px, 0px)`;
				localStorage.setItem(STORAGE_KEY__NETWORK_DOCK, JSON.stringify({ x: 0, y: 0 }));
				isDragging = false;
				return;
			}
			lastClickTime = currentTime;

			isDragging = true;
			hasMoved = false; // 누를 때마다 이동 상태 초기화
			startMouseX = e.clientX - currentX;
			startMouseY = e.clientY - currentY;

			dock.setPointerCapture(e.pointerId);
			dock.style.transition = "none";
		};

		const onPointerMove = (e: PointerEvent) => {
			if (!isDragging) return;

			// 🔥 마우스가 3px 이상 움직였을 때만 '드래그'로 인정
			const moveX = Math.abs(e.clientX - startMouseX - currentX);
			const moveY = Math.abs(e.clientY - startMouseY - currentY);
			if (moveX > 3 || moveY > 3) {
				hasMoved = true;
			}

			// 드래그 중일 때만 화면 이동
			if (hasMoved) {
				e.preventDefault();
				currentX = e.clientX - startMouseX;
				currentY = e.clientY - startMouseY;
				dock.style.transform = `translate(${currentX}px, ${currentY}px)`;
			}
		};

		const onPointerUp = (e: PointerEvent) => {
			if (!isDragging) return;
			isDragging = false;
			dock.releasePointerCapture(e.pointerId);
			localStorage.setItem(STORAGE_KEY__NETWORK_DOCK, JSON.stringify({ x: currentX, y: currentY }));

			// 🔥 드래그하지 않고 제자리에서 마우스를 뗐다면 = '클릭'으로 간주하고 Dock 열기!
			if (!hasMoved) {
				setIsOpen(true);
			}
		};

		dock.addEventListener("pointerdown", onPointerDown);
		dock.addEventListener("pointermove", onPointerMove);
		dock.addEventListener("pointerup", onPointerUp);
		dock.addEventListener("pointercancel", onPointerUp);

		return () => {
			dock.removeEventListener("pointerdown", onPointerDown);
			dock.removeEventListener("pointermove", onPointerMove);
			dock.removeEventListener("pointerup", onPointerUp);
			dock.removeEventListener("pointercancel", onPointerUp);
		};
	}, []);

	const getJsonString = (data: any) => {
		if (typeof data === "string") {
			try {
				return JSON.stringify(JSON.parse(data), null, 2);
			} catch {
				return data;
			}
		}
		return JSON.stringify(data, null, 2) || "";
	};

	const formatForDisplay = (data: any, maxLength = 2000) => {
		const str = getJsonString(data);
		if (str.length > maxLength) {
			return (
				str.slice(0, maxLength) +
				`\n\n... ⚠️ [데이터가 너무 깁니다 (${str.length} bytes). 우측 상단의 'Copy' 버튼을 사용하세요.]`
			);
		}
		return str;
	};

	const handleCopy = (e: React.MouseEvent, data: any) => {
		e.stopPropagation();
		navigator.clipboard.writeText(getJsonString(data));
		toast({ title: "복사 완료", status: "success", duration: 2000, isClosable: true, position: "top-right" });
	};

	return (
		<Box
			id="network-dock"
			ref={dockRef}
			position="fixed"
			top="24px"
			right="24px"
			zIndex="popover"
			w={isOpen ? "420px" : "auto"}
			maxH={isOpen ? "85vh" : "auto"}
			bg={isOpen ? "gray.900" : "transparent"}
			boxShadow={isOpen ? "dark-lg" : "none"}
			borderRadius={isOpen ? "md" : "full"}
			color="gray.100"
			display="flex"
			flexDirection="column"
			fontFamily="mono"
		>
			{!isOpen ? (
				<Flex
					id="network-drag-handle"
					align="center"
					justify="center"
					px="5"
					py="2.5"
					bg="blue.500"
					color="white"
					borderRadius="full"
					boxShadow="lg"
					cursor="grab"
					fontWeight="bold"
					fontSize="sm"
					_active={{ cursor: "grabbing" }}
					style={{ touchAction: "none", userSelect: "none" }}
					// ❌ React의 onClick과 onDoubleClick은 이벤트 충돌을 위해 완전히 삭제
				>
					📡 Network {logs.length > 0 && `(${logs.length})`}
				</Flex>
			) : (
				<>
					<Flex
						id="network-drag-handle"
						justify="space-between"
						align="center"
						p="3"
						bg="gray.800"
						borderBottom="1px solid"
						borderColor="gray.700"
						borderTopRadius="md"
						cursor="grab"
						_active={{ cursor: "grabbing" }}
						style={{ touchAction: "none", userSelect: "none" }}
					>
						<Text fontWeight="bold" fontSize="sm" pointerEvents="none" color="gray.300">
							📡 Network Monitor
							<Text as="span" fontSize="10px" fontWeight="normal" ml="2" color="gray.500">
								(Drag or Double-Click)
							</Text>
						</Text>
						<HStack spacing="2">
							<Button size="xs" colorScheme="whiteAlpha" onClick={() => setLogs([])}>
								Clear
							</Button>
							{/* 닫기 버튼은 network-drag-handle 구역 안의 버튼이라 드래그 무시 로직에 의해 정상 작동 */}
							<Button size="xs" colorScheme="whiteAlpha" onClick={() => setIsOpen(false)}>
								Hide
							</Button>
						</HStack>
					</Flex>

					<VStack
						p="3"
						overflowY="auto"
						flex="1"
						spacing="3"
						align="stretch"
						sx={{
							"&::-webkit-scrollbar": { width: "6px" },
							"&::-webkit-scrollbar-track": { bg: "gray.800" },
							"&::-webkit-scrollbar-thumb": { bg: "gray.600", borderRadius: "full" },
						}}
					>
						{logs.length === 0 ? (
							<Text textAlign="center" color="gray.500" mt="6" fontSize="xs">
								대기 중인 네트워크 요청이 없습니다.
							</Text>
						) : (
							logs.map((log) => {
								const isPostLike = ["POST", "PUT", "PATCH"].includes(log.method);
								const statusColor =
									log.status === "pending" ? "yellow.400" : log.status === "success" ? "green.400" : "red.400";
								const methodColor = log.method === "GET" ? "blue" : log.method === "POST" ? "teal" : "orange";

								return (
									<Box
										key={log.id}
										bg="gray.800"
										p="3"
										borderRadius="md"
										borderLeft="4px solid"
										borderLeftColor={statusColor}
									>
										<Flex justify="space-between" align="center" mb="1">
											<Badge colorScheme={methodColor} fontSize="xs" px="1.5">
												{log.method}
											</Badge>
											<Text fontSize="xs" color="gray.400">
												{log.time} {log.duration ? `(${log.duration}ms)` : ""}
											</Text>
										</Flex>

										<Text fontSize="xs" color="blue.300" wordBreak="break-all" mb="3">
											{log.url}
										</Text>

										<VStack spacing="2" align="stretch">
											{isPostLike && log.reqBody && (
												<Accordion allowToggle defaultIndex={[0]}>
													<AccordionItem border="none" bg="transparent">
														<Flex bg="gray.700" borderRadius="md" overflow="hidden" align="stretch">
															<AccordionButton flex="1" p="2" _hover={{ bg: "gray.600" }}>
																<Box flex="1" textAlign="left" fontSize="xs" fontWeight="bold" color="gray.300">
																	📥 Request Body
																</Box>
																<AccordionIcon color="gray.400" />
															</AccordionButton>
															<Flex align="center" px="2" borderLeft="1px solid" borderColor="gray.600">
																<Button
																	size="xs"
																	h="1.2rem"
																	fontSize="10px"
																	colorScheme="gray"
																	variant="solid"
																	onClick={(e) => handleCopy(e, log.reqBody)}
																>
																	Copy
																</Button>
															</Flex>
														</Flex>
														<AccordionPanel p="2" mt="1" bg="gray.700" borderRadius="md">
															<Box
																as="pre"
																fontSize="11px"
																color="orange.200"
																maxH="150px"
																overflowY="auto"
																whiteSpace="pre-wrap"
															>
																{formatForDisplay(log.reqBody)}
															</Box>
														</AccordionPanel>
													</AccordionItem>
												</Accordion>
											)}

											{log.status !== "pending" && (
												<Accordion allowToggle defaultIndex={log.status === "error" ? [0] : undefined}>
													<AccordionItem border="none" bg="transparent">
														<Flex bg="gray.700" borderRadius="md" overflow="hidden" align="stretch">
															<AccordionButton flex="1" p="2" _hover={{ bg: "gray.600" }}>
																<Box flex="1" textAlign="left" fontSize="xs" fontWeight="bold" color="gray.300">
																	📤 Response Data
																	<Text as="span" ml="2" color={log.status === "success" ? "green.300" : "red.300"}>
																		[{log.statusCode}]
																	</Text>
																</Box>
																<AccordionIcon color="gray.400" />
															</AccordionButton>
															<Flex align="center" px="2" borderLeft="1px solid" borderColor="gray.600">
																<Button
																	size="xs"
																	h="1.2rem"
																	fontSize="10px"
																	colorScheme="gray"
																	variant="solid"
																	onClick={(e) => handleCopy(e, log.resBody)}
																>
																	Copy
																</Button>
															</Flex>
														</Flex>
														<AccordionPanel p="2" mt="1" bg="gray.700" borderRadius="md">
															<Box
																as="pre"
																fontSize="11px"
																color="green.200"
																maxH="250px"
																overflowY="auto"
																whiteSpace="pre-wrap"
															>
																{formatForDisplay(log.resBody)}
															</Box>
														</AccordionPanel>
													</AccordionItem>
												</Accordion>
											)}
										</VStack>
									</Box>
								);
							})
						)}
					</VStack>
				</>
			)}
		</Box>
	);
};

const STORAGE_KEY__CONSOLE_DOCK = "console_dock_position";

type LogMethod = "log" | "info" | "warn" | "error";

interface ConsoleLogItem {
	id: string;
	method: LogMethod;
	args: any[];
	time: string;
}

export const ConsoleDock: React.FC = () => {
	const [logs, setLogs] = useState<ConsoleLogItem[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const toast = useToast();
	const dockRef = useRef<HTMLDivElement>(null);

	// ==========================================
	// 1. Console 가로채기 (Hijacking) 로직
	// ==========================================
	useEffect(() => {
		// 기존 순수 console 메서드들 백업
		const originalConsole = {
			log: console.log,
			info: console.info,
			warn: console.warn,
			error: console.error,
		};

		// 가로채기 함수 생성
		const interceptConsole = (method: LogMethod) => {
			return (...args: any[]) => {
				// 1. 원래 콘솔창에도 똑같이 출력 (기능 유지)
				originalConsole[method](...args);

				// 2. 우리 Dock UI를 위한 상태 업데이트
				setLogs((prev) => [
					{
						id: Math.random().toString(36).substring(7),
						method,
						args,
						time: new Date().toLocaleTimeString(),
					},
					...prev, // 최신 로그가 위로 오게
				]);
			};
		};

		// 브라우저 전역 console 덮어쓰기
		console.log = interceptConsole("log");
		console.info = interceptConsole("info");
		console.warn = interceptConsole("warn");
		console.error = interceptConsole("error");

		// 컴포넌트 언마운트 시 원상복구 (클린업)
		return () => {
			console.log = originalConsole.log;
			console.info = originalConsole.info;
			console.warn = originalConsole.warn;
			console.error = originalConsole.error;
		};
	}, []);

	// ==========================================
	// 2. 바닐라 JS 드래그 & 토글 로직 (NetworkDock과 동일)
	// ==========================================
	useEffect(() => {
		const dock = dockRef.current;
		const networkDock = document.getElementById("network-dock");

		if (!dock) return;

		const savedPos = JSON.parse(localStorage.getItem(STORAGE_KEY__CONSOLE_DOCK) || '{"x": 0, "y": 0}');
		let currentX = savedPos.x;
		let currentY = savedPos.y;
		dock.style.transform = `translate(${currentX}px, ${currentY}px)`;

		let isDragging = false;
		let hasMoved = false;
		let startMouseX = 0;
		let startMouseY = 0;
		let lastClickTime = 0;

		const onPointerDown = (e: PointerEvent) => {
			if (networkDock) {
				dock.style.zIndex = "1501";
				networkDock.style.zIndex = "1500";
			}
			const target = e.target as HTMLElement;
			if (!target.closest("#console-drag-handle")) return;
			if (target.closest("button") && target.id !== "console-drag-handle") return;

			const currentTime = new Date().getTime();
			if (currentTime - lastClickTime < 300) {
				currentX = 0;
				currentY = 0;
				dock.style.transform = `translate(0px, 0px)`;
				localStorage.setItem(STORAGE_KEY__CONSOLE_DOCK, JSON.stringify({ x: 0, y: 0 }));
				isDragging = false;
				return;
			}
			lastClickTime = currentTime;

			isDragging = true;
			hasMoved = false;
			startMouseX = e.clientX - currentX;
			startMouseY = e.clientY - currentY;

			dock.setPointerCapture(e.pointerId);
			dock.style.transition = "none";
		};

		const onPointerMove = (e: PointerEvent) => {
			if (!isDragging) return;
			const moveX = Math.abs(e.clientX - startMouseX - currentX);
			const moveY = Math.abs(e.clientY - startMouseY - currentY);
			if (moveX > 3 || moveY > 3) hasMoved = true;

			if (hasMoved) {
				e.preventDefault();
				currentX = e.clientX - startMouseX;
				currentY = e.clientY - startMouseY;
				dock.style.transform = `translate(${currentX}px, ${currentY}px)`;
			}
		};

		const onPointerUp = (e: PointerEvent) => {
			if (!isDragging) return;
			isDragging = false;
			dock.releasePointerCapture(e.pointerId);
			localStorage.setItem(STORAGE_KEY__CONSOLE_DOCK, JSON.stringify({ x: currentX, y: currentY }));
			if (!hasMoved) setIsOpen(true);
		};

		dock.addEventListener("pointerdown", onPointerDown);
		dock.addEventListener("pointermove", onPointerMove);
		dock.addEventListener("pointerup", onPointerUp);
		dock.addEventListener("pointercancel", onPointerUp);

		return () => {
			dock.removeEventListener("pointerdown", onPointerDown);
			dock.removeEventListener("pointermove", onPointerMove);
			dock.removeEventListener("pointerup", onPointerUp);
			dock.removeEventListener("pointercancel", onPointerUp);
		};
	}, []);

	const handleResetPosition = () => {
		if (dockRef.current) {
			dockRef.current.style.transform = `translate(0px, 0px)`;
			localStorage.setItem(STORAGE_KEY__CONSOLE_DOCK, JSON.stringify({ x: 0, y: 0 }));
		}
	};

	// 객체 렌더링 헬퍼 함수
	const safeStringify = (obj: any) => {
		try {
			if (typeof obj === "string") return obj;
			if (obj instanceof Error) return obj.stack || obj.message;
			return JSON.stringify(obj, null, 2);
		} catch {
			return "[Circular Structure or Un-serializable Object]";
		}
	};

	const handleCopy = (e: React.MouseEvent, data: any) => {
		e.stopPropagation();
		navigator.clipboard.writeText(safeStringify(data));
		toast({ title: "로그 복사 완료", status: "success", duration: 2000, position: "top-left" });
	};

	// ==========================================
	// 3. UI 렌더링
	// ==========================================
	return (
		<Box
			id="console-dock"
			ref={dockRef}
			position="fixed"
			top="72px"
			right="24px"
			zIndex="popover"
			w={isOpen ? "400px" : "auto"}
			maxH={isOpen ? "80vh" : "auto"}
			bg={isOpen ? "gray.900" : "transparent"}
			boxShadow={isOpen ? "dark-lg" : "none"}
			borderRadius={isOpen ? "md" : "full"}
			color="gray.100"
			display="flex"
			flexDirection="column"
			fontFamily="mono"
		>
			{!isOpen ? (
				<Flex
					id="console-drag-handle"
					align="center"
					justify="center"
					px="5"
					py="2.5"
					bg="purple.500" // 👈 콘솔은 보라색 뱃지
					color="white"
					borderRadius="full"
					boxShadow="lg"
					cursor="grab"
					fontWeight="bold"
					fontSize="sm"
					_active={{ cursor: "grabbing" }}
					style={{ touchAction: "none", userSelect: "none" }}
				>
					💻 Console {logs.length > 0 && `(${logs.length})`}
				</Flex>
			) : (
				<>
					<Flex
						id="console-drag-handle"
						justify="space-between"
						align="center"
						p="3"
						bg="gray.800"
						borderBottom="1px solid"
						borderColor="gray.700"
						borderTopRadius="md"
						cursor="grab"
						_active={{ cursor: "grabbing" }}
						onDoubleClick={handleResetPosition}
						style={{ touchAction: "none", userSelect: "none" }}
					>
						<Text fontWeight="bold" fontSize="sm" pointerEvents="none" color="purple.300">
							💻 Console Monitor
							<Text as="span" fontSize="10px" fontWeight="normal" ml="2" color="gray.500">
								(Drag or D-Click)
							</Text>
						</Text>
						<HStack spacing="2">
							<Button size="xs" colorScheme="whiteAlpha" onClick={() => setLogs([])}>
								Clear
							</Button>
							<Button size="xs" colorScheme="whiteAlpha" onClick={() => setIsOpen(false)}>
								Hide
							</Button>
						</HStack>
					</Flex>

					<VStack
						p="3"
						overflowY="auto"
						flex="1"
						spacing="2"
						align="stretch"
						sx={{
							"&::-webkit-scrollbar": { width: "6px" },
							"&::-webkit-scrollbar-track": { bg: "gray.800" },
							"&::-webkit-scrollbar-thumb": { bg: "gray.600", borderRadius: "full" },
						}}
					>
						{logs.length === 0 ? (
							<Text textAlign="center" color="gray.500" mt="6" fontSize="xs">
								콘솔 로그가 없습니다.
							</Text>
						) : (
							logs.map((log) => {
								const badgeColor =
									log.method === "error"
										? "red"
										: log.method === "warn"
											? "orange"
											: log.method === "info"
												? "cyan"
												: "gray";

								return (
									<Box
										key={log.id}
										bg="gray.800"
										p="2"
										borderRadius="md"
										borderLeft="3px solid"
										borderLeftColor={`${badgeColor}.400`}
									>
										<Flex justify="space-between" align="center" mb="1">
											<Badge colorScheme={badgeColor} fontSize="10px" px="1">
												{log.method.toUpperCase()}
											</Badge>
											<Text fontSize="10px" color="gray.500">
												{log.time}
											</Text>
										</Flex>

										{/* console.log("a", "b", {c: 1}) 처럼 여러 인자가 넘어오는 경우 처리 */}
										<VStack align="stretch" spacing="1" mt="1">
											{log.args.map((arg, idx) => {
												const isObject = typeof arg === "object" && arg !== null;

												return isObject ? (
													<Accordion allowToggle key={idx}>
														<AccordionItem border="none" bg="transparent">
															<Flex bg="gray.700" borderRadius="sm" overflow="hidden" align="stretch">
																<AccordionButton flex="1" p="1" px="2" _hover={{ bg: "gray.600" }}>
																	<Box flex="1" textAlign="left" fontSize="11px" color="gray.300">
																		{Array.isArray(arg) ? `Array(${arg.length})` : "Object"}
																	</Box>
																	<AccordionIcon color="gray.400" w={3} h={3} />
																</AccordionButton>
																<Flex align="center" px="2" borderLeft="1px solid" borderColor="gray.600">
																	<Button
																		size="xs"
																		h="1rem"
																		fontSize="9px"
																		colorScheme="gray"
																		variant="solid"
																		onClick={(e) => handleCopy(e, arg)}
																	>
																		Copy
																	</Button>
																</Flex>
															</Flex>
															<AccordionPanel p="2" mt="1" bg="gray.900" borderRadius="sm">
																<Box
																	as="pre"
																	fontSize="10px"
																	color="gray.300"
																	maxH="150px"
																	overflowY="auto"
																	whiteSpace="pre-wrap"
																>
																	{safeStringify(arg)}
																</Box>
															</AccordionPanel>
														</AccordionItem>
													</Accordion>
												) : (
													<Text
														key={idx}
														fontSize="12px"
														color={log.method === "error" ? "red.300" : "gray.300"}
														wordBreak="break-word"
													>
														{String(arg)}
													</Text>
												);
											})}
										</VStack>
									</Box>
								);
							})
						)}
					</VStack>
				</>
			)}
		</Box>
	);
};
