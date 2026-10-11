import {
	Box,
	Button,
	ButtonProps,
	useDisclosure,
	Flex,
	Text,
	HStack,
	Menu,
	MenuButton,
	MenuList,
	MenuItem,
	Heading,
} from "@chakra-ui/react";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "../Link";
import { CAFE_WRITE_URL } from "@/lib/constant";
import { NebulaGlow } from "./space/NebulaGlow";

export function ObservatoryShell({ children }: { children: ReactNode }) {
	return (
		<Box
			position="relative"
			isolation="isolate"
			minH="100svh"
			bg="#12101f"
			color="#f1edf8"
			lineHeight="1.6"
			overflowWrap="anywhere"
			sx={{
				"--obs-muted": "#b4aacb",
				"--obs-accent": "#c1a4ef",
				"--obs-line": "#3a3351",
				"--obs-header-height": "64px",
				colorScheme: "dark",
				"section[id]": { scrollMarginTop: "128px" },
				"a:focus-visible, button:focus-visible, [tabindex='0']:focus-visible": {
					outline: "2px solid #c1a4ef",
					outlineOffset: "4px",
				},
				"@keyframes obs-twinkle": { "0%, 100%": { opacity: 0.09 }, "50%": { opacity: 0.5 } },
				"@media (prefers-reduced-motion: reduce)": {
					"&, & *, & *::before, & *::after": {
						animation: "none !important",
						transition: "none !important",
						scrollBehavior: "auto !important",
					},
				},
			}}
			data-observatory
		>
			{children}
		</Box>
	);
}

interface ObservatoryButtonProps extends ButtonProps {
	href?: string;
	isExternal?: boolean;
	primary?: boolean;
}

export function ObservatoryButton({ href, isExternal, primary, ...props }: ObservatoryButtonProps) {
	return (
		<Button
			as={href ? Link : "button"}
			href={href}
			target={href && isExternal ? "_blank" : undefined}
			rel={href && isExternal ? "noopener noreferrer" : undefined}
			h="auto"
			minH={{ base: "44px", md: "36px" }}
			px="13px"
			py="6px"
			fontSize="13px"
			fontWeight="500"
			lineHeight="1.5"
			whiteSpace="normal"
			border="1px solid"
			borderColor={primary ? "var(--obs-accent)" : "var(--obs-line)"}
			borderRadius="7px"
			bg={primary ? "var(--obs-accent)" : "#1b192ce6"}
			color={primary ? "#20162e" : "#f1edf8"}
			_hover={{ bg: primary ? "#d2baf7" : "#2b2541", textDecoration: "none" }}
			_active={{ bg: primary ? "#d2baf7" : "#362c4c" }}
			{...props}
		/>
	);
}

export function ObservatoryBackground() {
	return (
		<Box
			position="absolute"
			inset={0}
			overflow="hidden"
			pointerEvents="none"
			zIndex={-1}
			aria-hidden="true"
			bgGradient="radial(ellipse at 8% 40%, #61439528, transparent 55%)"
		>
			<NebulaGlow />
			<Box
				position="absolute"
				inset={0}
				bg="linear-gradient(122deg, transparent 12%, #8a72bd08 26%, #b49be51a 33%, #ddd5f026 36%, #7e81bf1c 39%, #30213f12 41%, #bea3e01a 44%, transparent 59%)"
				filter="blur(18px)"
			/>
			{Array.from({ length: 220 }, (_, i) => (
				<Box
					key={i}
					position="absolute"
					left={`${(i * 61.8034 + 7) % 100}%`}
					top={`${(i * 37.193 + 3) % 100}%`}
					boxSize={i % 13 === 0 ? "3px" : i % 3 === 0 ? "2px" : "1px"}
					borderRadius="full"
					bg="#e7d9ff"
					boxShadow={i % 3 === 0 ? "0 0 7px #c1a4ef" : undefined}
					opacity={i % 3 === 0 ? 0.45 : 0.22}
					animation={i % 3 === 0 ? `obs-twinkle ${10 + (i % 9)}s ease-in-out ${-(i % 12)}s infinite` : undefined}
				/>
			))}
			{Array.from({ length: 100 }, (_, i) => {
				const y = (i * 23.617) % 100;
				return (
					<Box
						key={`dust-${i}`}
						position="absolute"
						left={`${82 - y * 0.66 + Math.sin(i * 7.13) * 8}%`}
						top={`${y}%`}
						boxSize={i % 7 === 0 ? "2px" : "1px"}
						borderRadius="full"
						bg="#e8ddff"
						opacity={0.18 + (i % 4) * 0.07}
					/>
				);
			})}
		</Box>
	);
}

export function ObservatoryHeader({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) {
	const [compact, setCompact] = useState(false);
	const [hidden, setHidden] = useState(false);
	const headerRef = useRef<HTMLElement>(null);
	const menu = useDisclosure();
	useEffect(() => {
		let previous = window.scrollY;
		const update = () => {
			const y = Math.max(0, window.scrollY);
			const small = y > 24;
			const hide = y > 100 && y > previous && !menu.isOpen && !headerRef.current?.contains(document.activeElement);
			setCompact(small);
			if (Math.abs(y - previous) > 4 || y <= 24) {
				setHidden(hide);
				headerRef.current
					?.closest<HTMLElement>("[data-observatory]")
					?.style.setProperty("--obs-header-height", hide ? "0px" : small ? "60px" : "64px");
				previous = y;
			}
		};
		update();
		window.addEventListener("scroll", update, { passive: true });
		return () => window.removeEventListener("scroll", update);
	}, [menu.isOpen]);
	const links = [
		{ label: "Home", href: "/v2" },
		{ label: "Counter", href: "/counter" },
		{ label: "멀티뷰 ↗", href: "/multiview", external: true },
	];
	return (
		<>
			<Link
				href="#obs-main"
				position="fixed"
				top="-100px"
				left="12px"
				zIndex={110}
				p={3}
				bg="var(--obs-accent)"
				color="#20162e"
				_focus={{ top: "10px" }}
				onClick={(event) => {
					event.preventDefault();
					document.getElementById("obs-main")?.focus();
				}}
			>
				본문 바로가기
			</Link>
			<Box h={{ base: "64px", md: "80px" }} />
			<Box
				as="header"
				ref={headerRef}
				position="fixed"
				top={0}
				insetX={0}
				zIndex={100}
				bg={compact ? "#17122280" : "#141120f5"}
				borderBottom={compact ? "1px solid #c1a4ef24" : "1px solid #40345370"}
				backdropFilter={compact ? "blur(24px) saturate(145%)" : "blur(12px)"}
				boxShadow={compact ? "0 8px 32px #09061226" : "none"}
				transition="transform .2s, background-color .3s, box-shadow .3s, backdrop-filter .3s"
				transform={{ base: hidden ? "translateY(-100%)" : "none", md: "none" }}
				onFocusCapture={() => {
					setHidden(false);
					headerRef.current
						?.closest<HTMLElement>("[data-observatory]")
						?.style.setProperty("--obs-header-height", compact ? "60px" : "64px");
				}}
			>
				<Flex
					maxW="1440px"
					mx="auto"
					minH={compact ? { base: "60px", md: "56px" } : { base: "64px", md: "80px" }}
					px={{ base: 4, md: "30px" }}
					py={compact ? 2 : 3}
					gap={3}
					align="center"
					justify="space-between"
					transition="min-height .2s, padding .2s"
				>
					<Link
						href="/v2"
						fontSize={{ base: "20px", md: "22px" }}
						fontWeight="700"
						letterSpacing="-1px"
						whiteSpace="nowrap"
						_hover={{ textDecoration: "none" }}
						aria-label="StelCount Home"
					>
						<Text as="span" color="var(--obs-accent)">
							✦
						</Text>{" "}
						stelcount
						<Text as="span" color="var(--obs-accent)">
							.
						</Text>
					</Link>
					<HStack spacing={2}>
						<HStack as="nav" aria-label="주 메뉴" display={{ base: "none", md: "flex" }} spacing={2}>
							{links.map((link) => (
								<ObservatoryButton
									key={link.href}
									href={link.href}
									primary={link.href === "/v2"}
									isExternal={link.external}
								>
									{link.label}
								</ObservatoryButton>
							))}
						</HStack>
						<ObservatoryButton
							isLoading={refreshing}
							onClick={onRefresh}
							aria-label="데이터 새로고침"
							minW="40px"
							px={2}
						>
							↻
						</ObservatoryButton>
						<ObservatoryButton href={CAFE_WRITE_URL} isExternal display={{ base: "none", lg: "inline-flex" }}>
							축하 글쓰기 ↗
						</ObservatoryButton>
						<Box display={{ base: "block", md: "none" }}>
							<Menu isOpen={menu.isOpen} onOpen={menu.onOpen} onClose={menu.onClose}>
								<MenuButton
									as={Button}
									aria-label="메뉴 열기"
									minW="44px"
									h="44px"
									p={0}
									bg="#1b192c"
									border="1px solid var(--obs-line)"
									color="inherit"
									_hover={{ bg: "#2b2541" }}
									_active={{ bg: "#2b2541" }}
								>
									☰
								</MenuButton>
								<MenuList bg="#1b192c" color="#f1edf8" borderColor="var(--obs-line)" minW="180px">
									{links.map((link) => (
										<MenuItem
											key={link.href}
											as={Link}
											href={link.href}
											isExternal={link.external}
											bg="transparent"
											minH="44px"
											_focus={{ bg: "#2b2541" }}
										>
											{link.label}
										</MenuItem>
									))}
									<MenuItem
										as={Link}
										href={CAFE_WRITE_URL}
										isExternal
										bg="transparent"
										minH="44px"
										_focus={{ bg: "#2b2541" }}
									>
										축하 글쓰기 ↗
									</MenuItem>
								</MenuList>
							</Menu>
						</Box>
					</HStack>
				</Flex>
			</Box>
		</>
	);
}

export function ObservatoryExplore({ hasHero }: { hasHero: boolean }) {
	const [active, setActive] = useState(hasHero ? "featured" : "recent");
	useEffect(() => {
		const ids = [...(hasHero ? ["featured"] : []), "recent", "milestones", "live"];
		const update = () => {
			let current = ids[0];
			for (const id of ids) {
				const element = document.getElementById(`obs-${id}`);
				if (element && element.getBoundingClientRect().top <= 150) current = id;
			}
			setActive(current);
		};
		update();
		window.addEventListener("scroll", update, { passive: true });
		return () => window.removeEventListener("scroll", update);
	}, [hasHero]);
	const items = [
		...(hasHero ? [["featured", "주요 영상"]] : []),
		["recent", "새 영상"],
		["milestones", "기록"],
		["live", "라이브"],
	];
	return (
		<Box
			as="nav"
			aria-label="Explore 섹션 이동"
			position="sticky"
			top={{ base: "var(--obs-header-height)", md: "72px" }}
			h={{ base: "48px", md: 0 }}
			zIndex={30}
			maxW="1440px"
			mx="auto"
			bg={{ base: "#161021f2", md: "transparent" }}
			transition="top .2s"
		>
			<Flex
				position={{ base: "static", md: "absolute" }}
				right="14px"
				top="28px"
				direction={{ base: "row", md: "column" }}
				justify="center"
				gap={1}
				p={{ base: "2px 6px", md: "7px" }}
				border={{ base: 0, md: "1px solid #59477570" }}
				borderRadius={{ base: 0, md: "28px" }}
				bg={{ base: "transparent", md: "#211a31ed" }}
				backdropFilter="blur(14px)"
			>
				{items.map(([id, label]) => (
					<Link
						key={id}
						href={`#obs-${id}`}
						aria-current={active === id ? "location" : undefined}
						display="flex"
						alignItems="center"
						justifyContent="center"
						minH={{ base: "44px", md: "40px" }}
						px={{ base: 3, md: 2 }}
						borderRadius="22px"
						fontSize="11px"
						bg={active === id ? "#2b2541" : "transparent"}
						color={active === id ? "#f1edf8" : "var(--obs-muted)"}
						_hover={{ bg: "#2b2541", textDecoration: "none" }}
						onClick={(event) => {
							event.preventDefault();
							document.getElementById(`obs-${id}`)?.scrollIntoView({
								behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
							});
						}}
					>
						{label}
					</Link>
				))}
			</Flex>
		</Box>
	);
}

export function ObservatoryFooter() {
	return (
		<Flex
			as="footer"
			position="relative"
			px={{ base: 4, md: "30px" }}
			py={7}
			borderTop="1px solid var(--obs-line)"
			justify="space-between"
			gap={4}
			wrap="wrap"
			fontSize="12px"
			color="var(--obs-muted)"
		>
			<Text>Made with love, for Stellive.</Text>
			<HStack as="nav" aria-label="제작자 정보" spacing={5}>
				<Text>도시다람쥐</Text>
				<Link href="https://github.com/citysquirrel" isExternal>
					GitHub ↗
				</Link>
				<Link href="mailto:tok1324@naver.com">문의</Link>
			</HStack>
		</Flex>
	);
}

interface ObservatoryShelfProps {
	id: string;
	title: string;
	eyebrow: string;
	description: string;
	count: number;
	children: ReactNode;
}

export function ObservatoryShelf({ id, title, eyebrow, description, count, children }: ObservatoryShelfProps) {
	const railRef = useRef<HTMLDivElement>(null);
	const drag = useRef({ start: 0, scroll: 0, pointer: -1, moved: false });
	const [edges, setEdges] = useState({ start: true, end: true });
	const updateEdges = useCallback(() => {
		const rail = railRef.current;
		if (rail)
			setEdges({ start: rail.scrollLeft <= 1, end: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2 });
	}, []);
	useEffect(() => {
		const rail = railRef.current;
		if (!rail) return;
		updateEdges();
		const observer = new ResizeObserver(updateEdges);
		observer.observe(rail);
		return () => observer.disconnect();
	}, [count, updateEdges]);
	const move = (step: number) => {
		const rail = railRef.current;
		if (rail)
			rail.scrollBy({
				left: step * rail.clientWidth * 0.85,
				behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
			});
	};
	const finish = () => {
		drag.current.pointer = -1;
		if (railRef.current) railRef.current.dataset.dragging = "false";
	};
	return (
		<Box
			as="section"
			id={`obs-${id}`}
			py={{ base: 7, md: 8 }}
			borderBottom="1px solid #3a335180"
			aria-labelledby={`obs-${id}-title`}
		>
			<Flex align="center" justify="space-between" gap={4} mb={5}>
				<Box minW={0}>
					<Text color="var(--obs-accent)" fontSize="11px" letterSpacing=".16em" fontWeight="600">
						{eyebrow}
					</Text>
					<Heading as="h2" id={`obs-${id}-title`} fontSize={{ base: "19px", md: "21px" }} fontWeight="600" mt={1}>
						{title}
					</Heading>
					<Text color="var(--obs-muted)" fontSize="12px" mt={2}>
						{description} · {count}개
					</Text>
				</Box>
				<HStack spacing={2} flexShrink={0}>
					<ObservatoryButton
						isDisabled={edges.start}
						aria-label={`${title} 왼쪽으로`}
						onClick={() => move(-1)}
						borderRadius="full"
						w={{ base: "44px", md: "36px" }}
						minW={0}
						p={0}
					>
						←
					</ObservatoryButton>
					<ObservatoryButton
						isDisabled={edges.end}
						aria-label={`${title} 오른쪽으로`}
						onClick={() => move(1)}
						borderRadius="full"
						w={{ base: "44px", md: "36px" }}
						minW={0}
						p={0}
					>
						→
					</ObservatoryButton>
				</HStack>
			</Flex>
			<Flex
				ref={railRef}
				gap={{ base: "14px", md: "18px" }}
				overflowX="auto"
				overscrollBehaviorX="contain"
				p="5px 4px 18px"
				tabIndex={count ? 0 : undefined}
				role="region"
				aria-label={`${title} 가로 스크롤`}
				cursor={count ? "grab" : "auto"}
				sx={{
					scrollSnapType: "x proximity",
					scrollbarWidth: "thin",
					scrollbarColor: "#67517d #201a30",
					"&[data-dragging=true]": { scrollSnapType: "none", cursor: "grabbing", userSelect: "none" },
				}}
				onScroll={updateEdges}
				onPointerDown={(event) => {
					drag.current.moved = false;
					if (event.pointerType !== "mouse" || event.button !== 0) return;
					drag.current = {
						start: event.clientX,
						scroll: event.currentTarget.scrollLeft,
						pointer: event.pointerId,
						moved: false,
					};
				}}
				onPointerMove={(event) => {
					if (drag.current.pointer !== event.pointerId) return;
					const delta = event.clientX - drag.current.start;
					if (Math.abs(delta) > 6) {
						drag.current.moved = true;
						event.currentTarget.dataset.dragging = "true";
						event.currentTarget.setPointerCapture(event.pointerId);
					}
					if (drag.current.moved) {
						event.preventDefault();
						event.currentTarget.scrollLeft = drag.current.scroll - delta;
					}
				}}
				onPointerUp={finish}
				onPointerCancel={finish}
				onLostPointerCapture={finish}
				onPointerLeave={() => {
					if (!drag.current.moved) finish();
				}}
				onDragStart={(event) => event.preventDefault()}
				onClickCapture={(event) => {
					if (drag.current.moved && event.detail !== 0) {
						event.preventDefault();
						event.stopPropagation();
					}
				}}
				onKeyDown={(event) => {
					if (event.target !== event.currentTarget) return;
					if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
						event.preventDefault();
						move(event.key === "ArrowRight" ? 1 : -1);
					}
				}}
			>
				{children}
			</Flex>
		</Box>
	);
}

