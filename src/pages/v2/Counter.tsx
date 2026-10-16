import {
	Avatar,
	Badge,
	Box,
	Collapse,
	DarkMode,
	Flex,
	Heading,
	Input,
	InputGroup,
	InputLeftElement,
	Select,
	Spinner,
	Stack,
	Text,
	useDisclosure,
} from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import {
	MdArrowDownward,
	MdArrowUpward,
	MdCheck,
	MdDragIndicator,
	MdEmojiEvents,
	MdExpandLess,
	MdExpandMore,
	MdHome,
	MdOpenInNew,
	MdSchedule,
	MdSearch,
	MdSensors,
	MdSwapVert,
} from "react-icons/md";
import { Reorder, useDragControls, useReducedMotion } from "framer-motion";
import { FaYoutube } from "react-icons/fa6";
import { SiYoutubemusic } from "react-icons/si";
import { useLocalStorage } from "usehooks-ts";
import { Link } from "../../components/Link";
import { ImageV2 } from "../../components/Image";
import { CustomModal } from "../../components/Modal";
import { ObservatoryButton } from "../../components/layout/Observatory";
import { USER_SETTING_STORAGE } from "../../lib/constant";
import { elapsedTimeText, parseV2Time } from "../../lib/functions/date";
import { avatarFallbackColor, numberToLocaleString } from "../../lib/functions/etc";
import { HOME_LIMITS, homeCount, homeDate, recentMilestone } from "../../lib/functions/homeV2";
import { stellarSymbol, stellarSymbolOpacity } from "../../lib/functions/stellarSymbol";
import {
	counterCategoryTagIds,
	counterChannels,
	counterGoal,
	counterGroupLabel,
	counterProfileImage,
	counterTagKey,
	counterValue,
	moveCounterGroup,
	orderCounterGroups,
	resolveCounterSort,
	selectCounterVideos,
	type CounterKind,
} from "../../lib/functions/counterV2";
import type { DefaultResponseData } from "../../lib/functions/fetch";
import { generateStandardThumbnail, naver, youtube, youtubeThumbnailImageProps } from "../../lib/functions/platforms";
import type { useObservatoryData } from "../../lib/hooks/useObservatoryData";
import { useServerQuery } from "../../lib/hooks/useServerApi";
import type { StellarV2State, Tag, TagV2, UserSettingStorage, YoutubeMusicDataV2 } from "../../lib/types";

interface CounterGroup {
	name: string;
	label: string;
	sortOrder: number;
	members: StellarV2State[];
}

export default function Counter() {
	const { videos, live } = useOutletContext<ReturnType<typeof useObservatoryData>>();
	const [now, setNow] = useState(Date.now);
	useEffect(() => {
		const timer = window.setInterval(() => setNow(Date.now()), 60000);
		return () => window.clearInterval(timer);
	}, []);
	const tagCatalog = useServerQuery<DefaultResponseData<Omit<Tag, "count">[]>, "v2", TagV2[]>({
		version: "v2",
		api: "/tags",
		queryOptions: {
			select: (response) => {
				if (!Array.isArray(response?.data)) throw new Error("분류 정보를 불러오지 못했어요.");
				return response.data.map((tag) => ({
					i: tag.id,
					n: tag.name,
					cc: tag.colorCode,
					icv: tag.isCover,
					io: tag.isOriginal,
				}));
			},
			staleTime: 30000,
			refetchInterval: 60000,
			retry: 1,
		},
	});
	const categoryTagIds = useMemo(() => counterCategoryTagIds(tagCatalog.data || []), [tagCatalog.data]);
	const [params, setParams] = useSearchParams();
	const [settings, setSettings] = useLocalStorage<UserSettingStorage>(USER_SETTING_STORAGE, {});
	const members = useMemo(() => (videos.data || []).filter((member) => !member.jl), [videos.data]);
	const groups = useMemo(() => {
		const grouped = new Map<string, CounterGroup>();
		for (const member of members) {
			const memberships = member.gps?.filter((group) => group.n?.trim()) || [];
			for (const group of memberships.length ? memberships : [{ n: "", so: 0 }]) {
				const entry = grouped.get(group.n) || {
					name: group.n,
					label: counterGroupLabel(group),
					sortOrder: group.so,
					members: [],
				};
				entry.sortOrder = Math.max(entry.sortOrder, group.so);
				if (!entry.members.some((candidate) => candidate.uid === member.uid)) entry.members.push(member);
				grouped.set(group.n, entry);
			}
		}
		return [...grouped.values()].sort(
			(a, b) => Number(!a.name) - Number(!b.name) || b.sortOrder - a.sortOrder || a.name.localeCompare(b.name, "ko"),
		);
	}, [members]);
	const displayGroups = useMemo(
		() => orderCounterGroups(groups, settings.counterGroupOrder),
		[groups, settings.counterGroupOrder],
	);
	const requestedMember = members.find((member) => member.uid === params.get("member"));
	const requestedGroup = groups.find((group) => group.name === params.get("group"));
	const homeMember = members.find((member) => member.uid === settings.homeStellar) || groups[0]?.members[0];
	const selectedMember = requestedMember || requestedGroup?.members[0] || homeMember;
	const selectedGroup = requestedGroup?.members.some((member) => member.uid === selectedMember?.uid)
		? requestedGroup
		: groups.find((group) => group.members.some((member) => member.uid === selectedMember?.uid)) || groups[0];
	const allVideos = useMemo(() => (selectedMember?.ym || []).filter((video) => video.ia !== false), [selectedMember]);
	const query = params.get("q") || "";
	const kind: CounterKind =
		params.get("kind") === "cover"
			? "cover"
			: params.get("kind") === "original"
				? "original"
				: params.get("kind") === "other"
					? "other"
					: "all";
	const sort = resolveCounterSort(params.get("sort"), settings.counterSort);
	const tags = useMemo(() => params.getAll("tag"), [params]);
	const availableTags = useMemo(
		() => [...new Map(allVideos.flatMap((video) => video.tg || []).map((tag) => [counterTagKey(tag), tag])).values()],
		[allVideos],
	);
	const categoryUnavailable = kind !== "all" && !tagCatalog.data;
	const selectedVideos = useMemo(
		() => selectCounterVideos(allVideos, { query, kind, tags, sort }, categoryTagIds),
		[allVideos, query, kind, tags, sort, categoryTagIds],
	);
	const filtered = !!query || kind !== "all" || tags.length > 0;
	const updateFilter = (key: string, value: string) => {
		if ((params.get(key) || "") === value) return;
		const next = new URLSearchParams(params);
		if (value) next.set(key, value);
		else next.delete(key);
		setParams(next, { replace: true });
	};
	const clearFilters = () => {
		const next = new URLSearchParams(params);
		["q", "kind", "tag"].forEach((key) => next.delete(key));
		setParams(next, { replace: true });
	};
	const updateSort = (value: string) => {
		const nextSort = resolveCounterSort(value);
		setSettings((previous) => ({ ...previous, counterSort: nextSort }));
		updateFilter("sort", nextSort);
	};

	useEffect(() => {
		if (videos.isPending || videos.isError || !selectedMember || !selectedGroup) return;
		if (params.get("member") === selectedMember.uid && params.get("group") === selectedGroup.name) return;
		const next = new URLSearchParams(params);
		next.set("member", selectedMember.uid);
		next.set("group", selectedGroup.name);
		setParams(next, { replace: true });
	}, [params, selectedMember, selectedGroup, setParams, videos.isPending, videos.isError]);

	const select = (group: CounterGroup, member: StellarV2State) => {
		if (params.get("group") === group.name && params.get("member") === member.uid) return;
		const next = new URLSearchParams(params);
		next.set("group", group.name);
		next.set("member", member.uid);
		["q", "kind", "tag"].forEach((key) => next.delete(key));
		setParams(next);
		window.scrollTo({ top: 0, behavior: "instant" });
	};
	const liveStatus = live.data?.find((entry) => entry.uuid === selectedMember?.uid);

	return (
		<Flex
			maxW="1440px"
			mx="auto"
			px={{ base: 4, md: 8 }}
			pt={{ base: 5, lg: 7 }}
			pb={12}
			gap={{ lg: 7, xl: 10 }}
			align="flex-start"
		>
			{!!selectedMember && !!selectedGroup && (
				<CounterMembers
					groups={displayGroups}
					selectedId={selectedMember.uid}
					selectedGroup={selectedGroup.name}
					onSelect={select}
					hasCustomOrder={Array.isArray(settings.counterGroupOrder) && settings.counterGroupOrder.length > 0}
					onOrderChange={(order) => setSettings((previous) => ({ ...previous, counterGroupOrder: order }))}
				/>
			)}
			<Box flex={1} minW={0}>
				{videos.isPending ? (
					<Stack align="center" py={16} role="status">
						<Spinner color="var(--obs-accent)" />
						<Text>멤버와 영상 정보를 불러오고 있어요.</Text>
					</Stack>
				) : videos.isError && !videos.data ? (
					<Stack align="start" py={8} role="alert">
						<Text>멤버 정보를 불러오지 못했어요.</Text>
						<ObservatoryButton onClick={() => void videos.refetch()}>다시 불러오기</ObservatoryButton>
					</Stack>
				) : !selectedMember || !selectedGroup ? (
					<Text color="var(--obs-muted)" py={12}>
						표시할 멤버 정보가 없어요.
					</Text>
				) : (
					<>
						{videos.isError && (
							<Text role="status" color="var(--obs-muted)" mb={4}>
								최신 정보를 갱신하지 못해 이전 정보를 보여드리고 있어요.
							</Text>
						)}
						<CounterProfile
							member={selectedMember}
							isLive={!!liveStatus?.openLive}
							homeMember={homeMember}
							isHome={settings.homeStellar === selectedMember.uid}
							onSetHome={() => setSettings((previous) => ({ ...previous, homeStellar: selectedMember.uid }))}
						/>
						<Box as="section" aria-labelledby="counter-videos-title">
							<Flex align="baseline" justify="space-between" gap={4} mb={2}>
								<Heading as="h2" id="counter-videos-title" fontSize="21px" fontWeight="500">
									{selectedMember.ns}의 영상
								</Heading>
								<Text color="var(--obs-muted)" fontSize="12px" flexShrink={0} role="status">
									{categoryUnavailable
										? "분류 확인 필요"
										: filtered
											? `${selectedVideos.length} / ${allVideos.length}개`
											: `${allVideos.length}개`}
								</Text>
							</Flex>
							<Stack spacing={3} py={4} mb={2}>
								<Flex gap={3} wrap="wrap">
									<CounterSearchInput
										key={selectedMember.uid}
										query={query}
										onCommit={(value) => updateFilter("q", value)}
									/>
									<Select
										aria-label="영상 정렬"
										value={sort}
										onChange={(event) => updateSort(event.target.value)}
										w={{ base: "100%", sm: "186px" }}
										borderColor="var(--obs-line)"
										borderRadius="10px"
										fontSize="13px"
										sx={{ option: { bg: "#211a31" } }}
									>
										<option value="recommended">추천순</option>
										<option value="newest">최신 게시순</option>
										<option value="oldest">오래된 게시순</option>
										<option value="remaining-asc">목표까지 가까운 순</option>
										<option value="remaining-desc">목표까지 많이 남은 순</option>
									</Select>
								</Flex>
								<Flex gap={2} align="center" wrap="wrap" role="group" aria-label="영상 분류">
									{(
										[
											["all", "전체"],
											["cover", "커버"],
											["original", "오리지널"],
											["other", "기타·미분류"],
										] as const
									).map(([value, label]) => (
										<ObservatoryButton
											key={value}
											aria-pressed={kind === value}
											isDisabled={value !== "all" && !tagCatalog.data}
											onClick={() => updateFilter("kind", value === "all" ? "" : value)}
											bg={kind === value ? "#c1a4ef24" : "transparent"}
											borderColor={kind === value ? "#c1a4ef60" : "transparent"}
											px={3}
											py={1}
											fontSize="12px"
										>
											{label}
										</ObservatoryButton>
									))}
									{filtered && (
										<ObservatoryButton
											onClick={clearFilters}
											ml="auto"
											fontSize="12px"
											borderColor="transparent"
											bg="transparent"
											color="var(--obs-muted)"
										>
											필터 초기화
										</ObservatoryButton>
									)}
								</Flex>
								{tagCatalog.isPending && (
									<Text role="status" fontSize="12px" color="var(--obs-muted)">
										분류 정보를 불러오고 있어요.
									</Text>
								)}
								{tagCatalog.isError && (
									<Flex role="alert" align="center" gap={2} wrap="wrap">
										<Text fontSize="12px" color="var(--obs-muted)">
											{tagCatalog.data
												? "분류 정보를 갱신하지 못해 이전 기준을 사용하고 있어요."
												: "분류 정보를 불러오지 못했어요."}
										</Text>
										<ObservatoryButton fontSize="12px" onClick={() => void tagCatalog.refetch()}>
											다시 불러오기
										</ObservatoryButton>
									</Flex>
								)}
								{!!availableTags.length && (
									<Flex gap={2} wrap="wrap" align="center" role="group" aria-label="태그 필터">
										<Text fontSize="11px" color="var(--obs-muted)" mr={1}>
											태그 · 모두 포함
										</Text>
										{availableTags.map((tag) => {
											const key = counterTagKey(tag);
											const active = tags.includes(key);
											const colorScheme = tag.cc?.trim() || "gray";
											const tint = colorScheme === "gray"
												? "var(--chakra-colors-gray-400)"
												: `var(--chakra-colors-${colorScheme}-300, var(--chakra-colors-gray-400))`;
											return (
												<ObservatoryButton
													key={key}
													aria-pressed={active}
													onClick={() => {
														const next = new URLSearchParams(params);
														next.delete("tag");
														(active ? tags.filter((value) => value !== key) : [...tags, key]).forEach((value) =>
															next.append("tag", value),
														);
														setParams(next, { replace: true });
													}}
													leftIcon={active ? <MdCheck /> : undefined}
													colorScheme={colorScheme}
													// 중첩 CSS 함수를 손상시키는 Chakra의 sx 변수 파서를 우회한다.
													style={{ "--counter-tag-color": `color-mix(in srgb, ${tint} 75%, var(--chakra-colors-gray-500))` } as CSSProperties}
													color="var(--counter-tag-color)"
													bg={`color-mix(in srgb, var(--counter-tag-color) ${active ? 12 : 4}%, transparent)`}
													borderColor={`color-mix(in srgb, var(--counter-tag-color) ${active ? 36 : 16}%, transparent)`}
													_hover={{
														bg: `color-mix(in srgb, var(--counter-tag-color) ${active ? 16 : 8}%, transparent)`,
														borderColor: "color-mix(in srgb, var(--counter-tag-color) 40%, transparent)",
													}}
													_active={{ bg: "color-mix(in srgb, var(--counter-tag-color) 20%, transparent)", boxShadow: "none" }}
													minH={{ base: "42px", md: "34px" }}
													fontSize="11px"
													px={3}
													py={1}
												>
													{tag.n}
												</ObservatoryButton>
											);
										})}
									</Flex>
								)}
							</Stack>
							{categoryUnavailable ? null : selectedVideos.length ? (
								selectedVideos.map((video) => (
									<CounterVideo key={`${selectedMember.uid}-${video.vi}`} video={video} now={now} />
								))
							) : (
								<Stack align="center" py={12} color="var(--obs-muted)" textAlign="center">
									<Text>{allVideos.length ? "조건에 맞는 영상이 없어요." : "아직 등록된 영상이 없어요."}</Text>
									{!allVideos.length && <Text fontSize="13px">새로운 스텔라를 응원해 주세요!</Text>}
									{filtered && <ObservatoryButton onClick={clearFilters}>필터 초기화</ObservatoryButton>}
								</Stack>
							)}
						</Box>
					</>
				)}
			</Box>
		</Flex>
	);
}

function CounterSearchInput({ query, onCommit }: { query: string; onCommit: (value: string) => void }) {
	const [draft, setDraft] = useState(query);
	const composing = useRef(false);
	useEffect(() => {
		if (!composing.current) setDraft(query);
	}, [query]);
	return (
		<InputGroup flex="1 1 220px">
			<InputLeftElement pointerEvents="none" color="var(--obs-muted)">
				<MdSearch />
			</InputLeftElement>
			<Input
				aria-label="영상 제목 검색"
				placeholder="어떤 노래를 찾고 있나요?"
				value={draft}
				onCompositionStart={() => {
					composing.current = true;
				}}
				onCompositionEnd={(event) => {
					composing.current = false;
					setDraft(event.currentTarget.value);
					onCommit(event.currentTarget.value);
				}}
				onChange={(event) => {
					setDraft(event.target.value);
					if (!composing.current) onCommit(event.target.value);
				}}
				bg="#ffffff04"
				borderColor="var(--obs-line)"
				borderRadius="10px"
				fontSize="13px"
				_placeholder={{ color: "var(--obs-muted)" }}
			/>
		</InputGroup>
	);
}

function CounterMembers({
	groups,
	selectedId,
	selectedGroup,
	onSelect,
	hasCustomOrder,
	onOrderChange,
}: {
	groups: CounterGroup[];
	selectedId: string;
	selectedGroup: string;
	onSelect: (group: CounterGroup, member: StellarV2State) => void;
	hasCustomOrder: boolean;
	onOrderChange: (order: string[] | undefined) => void;
}) {
	const railRef = useRef<HTMLDivElement>(null);
	const drag = useRef({ start: 0, scroll: 0, pointer: -1, moved: false });
	const orderEditor = useDisclosure();
	const [browsingGroup, setBrowsingGroup] = useState<string | null>(null);
	const visibleGroups = browsingGroup === null ? groups : groups.filter((group) => group.name === browsingGroup);
	useEffect(() => {
		const rail = railRef.current;
		if (!rail) return;
		const revealSelection = () => {
			const active = rail.querySelector<HTMLElement>('[data-current-selection="true"]');
			if (!active?.getClientRects().length) return;
			const viewport = rail.getBoundingClientRect();
			const button = active.getBoundingClientRect();
			const left =
				button.left < viewport.left
					? button.left - viewport.left - 8
					: button.right > viewport.right
						? button.right - viewport.right + 8
						: 0;
			const top =
				button.top < viewport.top
					? button.top - viewport.top - 8
					: button.bottom > viewport.bottom
						? button.bottom - viewport.bottom + 8
						: 0;
			if (left || top) rail.scrollBy({ left, top, behavior: "auto" });
		};
		revealSelection();
		const observer = new ResizeObserver(revealSelection);
		observer.observe(rail);
		return () => observer.disconnect();
	}, [groups, selectedId, selectedGroup, browsingGroup]);
	const finishDrag = () => {
		drag.current.pointer = -1;
		if (railRef.current) railRef.current.dataset.dragging = "false";
	};
	return (
		<Box
			as="nav"
			aria-label="그룹별 멤버 선택"
			position={{ base: "fixed", lg: "sticky" }}
			bottom={{ base: 0, lg: "auto" }}
			insetX={{ base: 0, lg: "auto" }}
			top={{ lg: "96px" }}
			w={{ base: "100%", lg: "196px" }}
			flexShrink={0}
			zIndex={90}
			pb={{ base: "env(safe-area-inset-bottom, 0px)", lg: 0 }}
			bg={{ base: "#171320f5", lg: "transparent" }}
			borderTop={{ base: "1px solid #ffffff12", lg: "none" }}
			borderRight={{ lg: "1px solid #ffffff0f" }}
			pr={{ lg: 4 }}
			backdropFilter={{ base: "blur(24px)", lg: "none" }}
		>
			<Box display={{ base: "none", lg: "block" }} px={2} pt={2} pb={4}>
				<Flex align="center" justify="space-between" mb={3}>
					<Text fontSize="10px" letterSpacing=".16em" color="var(--obs-muted)">
						ARTISTS
					</Text>
					<ObservatoryButton
						onClick={orderEditor.onOpen}
						aria-label="그룹 순서 편집"
						title="그룹 순서 편집"
						isDisabled={groups.length < 2}
						p={1}
						minH="28px"
						minW="28px"
						borderColor="transparent"
						bg="transparent"
					>
						<MdSwapVert size={18} />
					</ObservatoryButton>
				</Flex>
				<Select
					aria-label="탐색할 그룹"
					value={browsingGroup ?? "__all"}
					onChange={(event) => setBrowsingGroup(event.target.value === "__all" ? null : event.target.value)}
					size="sm"
					fontSize="12px"
					borderColor="#ffffff18"
					borderRadius="8px"
					sx={{ option: { bg: "#211a31" } }}
				>
					<option value="__all">모든 그룹</option>
					{groups.map((group) => (
						<option key={group.name} value={group.name}>
							{group.label}
						</option>
					))}
				</Select>
				{browsingGroup !== null && browsingGroup !== selectedGroup && (
					<Text fontSize="11px" color="var(--obs-muted)" mt={2}>
						현재 선택 · {groups.flatMap((group) => group.members).find((member) => member.uid === selectedId)?.n}
					</Text>
				)}
			</Box>
			<Flex
				ref={railRef}
				direction={{ base: "row", lg: "column" }}
				gap={{ base: 2, lg: 0 }}
				h={{ base: "80px", lg: "auto" }}
				maxH={{ lg: "calc(100dvh - 240px)" }}
				px={2}
				py={{ base: 0.5, lg: 1 }}
				overflowX={{ base: "auto", lg: "hidden" }}
				overflowY={{ base: "hidden", lg: "auto" }}
				tabIndex={0}
				aria-label="멤버 목록"
				overscrollBehavior="contain"
				sx={{
					scrollbarWidth: "none",
					scrollbarColor: "#67517d #171320",
					scrollPadding: "8px",
					"&::-webkit-scrollbar": { width: 0, height: 0 },
					"@media (hover: hover) and (pointer: fine)": {
						scrollbarWidth: "thin",
						cursor: { base: "grab", lg: "auto" },
						"&::-webkit-scrollbar": { width: "6px", height: "6px" },
					},
					"&[data-dragging=true], &[data-dragging=true] button": { cursor: "grabbing", userSelect: "none" },
				}}
				onPointerDown={(event) => {
					drag.current.moved = false;
					const rail = event.currentTarget;
					if (
						event.pointerType !== "mouse" ||
						event.button !== 0 ||
						window.getComputedStyle(rail).flexDirection !== "row" ||
						rail.scrollWidth <= rail.clientWidth
					)
						return;
					drag.current = { start: event.clientX, scroll: rail.scrollLeft, pointer: event.pointerId, moved: false };
				}}
				onPointerMove={(event) => {
					if (drag.current.pointer !== event.pointerId) return;
					const delta = event.clientX - drag.current.start;
					if (!drag.current.moved && Math.abs(delta) > 6) {
						drag.current.moved = true;
						event.currentTarget.dataset.dragging = "true";
						event.currentTarget.setPointerCapture(event.pointerId);
					}
					if (drag.current.moved) {
						event.preventDefault();
						event.currentTarget.scrollLeft = drag.current.scroll - delta;
					}
				}}
				onPointerUp={finishDrag}
				onPointerCancel={finishDrag}
				onLostPointerCapture={finishDrag}
				onPointerLeave={() => {
					if (!drag.current.moved) finishDrag();
				}}
				onDragStart={(event) => {
					if (drag.current.pointer !== -1) event.preventDefault();
				}}
				onClickCapture={(event) => {
					if (drag.current.moved && event.detail !== 0) {
						event.preventDefault();
						event.stopPropagation();
					}
				}}
			>
				<ObservatoryButton
					display={{ base: "inline-flex", lg: "none" }}
					alignSelf="center"
					flexShrink={0}
					onClick={orderEditor.onOpen}
					aria-label="그룹 순서 편집"
					title="그룹 순서 편집"
					isDisabled={groups.length < 2}
					boxSize="36px"
					minH="44px"
					minW="36px"
					p={0}
					borderColor="transparent"
					bg="transparent"
				>
					<MdSwapVert size={20} />
				</ObservatoryButton>
				{groups.map((group, groupIndex) => (
					<Box
						key={group.name}
						role="group"
						aria-label={`${group.label} 멤버`}
						flexShrink={0}
						display={{ base: "block", lg: visibleGroups.includes(group) ? "block" : "none" }}
						pl={groupIndex ? { base: 2, lg: 0 } : 0}
						pt={{ base: 0, lg: 2 }}
						pb={{ base: 0, lg: 2 }}
						borderLeft={groupIndex ? { base: "1px solid #c1a4ef26", lg: "none" } : undefined}
						borderTop="none"
					>
						<Text
							px={2}
							mb={{ base: 0, lg: 2 }}
							fontSize="10px"
							letterSpacing=".03em"
							color="#9488ab"
							noOfLines={1}
							title={group.label}
						>
							{group.label}
						</Text>
						<Flex direction={{ base: "row", lg: "column" }} gap={1}>
							{group.members.map((member) => (
								<ObservatoryButton
									key={member.uid}
									onClick={() => onSelect(group, member)}
									aria-pressed={member.uid === selectedId}
									data-current-selection={
										member.uid === selectedId && group.name === selectedGroup ? "true" : undefined
									}
									aria-label={member.n}
									title={member.n}
									position="relative"
									flexShrink={0}
									flexDirection={{ base: "column", lg: "row" }}
									justifyContent={{ base: "center", lg: "flex-start" }}
									borderRadius="8px"
									px={{ base: 1, lg: 2 }}
									py={1}
									gap={{ base: 0.5, lg: 2.5 }}
									minW={0}
									w={{ base: "88px", lg: "100%" }}
									h={{ base: "54px", lg: "42px" }}
									minH={0}
									fontSize={{ base: "11px", lg: "12px" }}
									boxShadow="none"
									backdropFilter="none"
									fontWeight={member.uid === selectedId ? "600" : "400"}
									color={member.uid === selectedId ? "#f3edf9" : "#a99ebc"}
									bg={member.uid === selectedId ? "#c1a4ef12" : "transparent"}
									borderColor="transparent"
									_hover={{ bg: "#ffffff08", color: "#f3edf9" }}
								>
									<Avatar
										src={naver.chzzk.profileImageUrl(counterProfileImage(member), 40)}
										name={member.n}
										getInitials={() => ""}
										boxSize={{ base: "26px", lg: "24px" }}
										flexShrink={0}
										bg={avatarFallbackColor(member.uid)}
									/>
									<Text noOfLines={1} minW={0} maxW="100%">
										{member.n}
									</Text>
									{member.uid === selectedId && (
										<Box
											position="absolute"
											left={{ lg: "-1px" }}
											bottom={{ base: "0", lg: "auto" }}
											w={{ base: "16px", lg: "2px" }}
											h={{ base: "2px", lg: "16px" }}
											borderRadius="full"
											bg="var(--obs-accent)"
											aria-hidden="true"
										/>
									)}
								</ObservatoryButton>
							))}
						</Flex>
					</Box>
				))}
			</Flex>
			<CounterGroupOrderEditor
				groups={groups}
				isOpen={orderEditor.isOpen}
				onClose={orderEditor.onClose}
				hasCustomOrder={hasCustomOrder}
				onOrderChange={onOrderChange}
			/>
		</Box>
	);
}

function CounterGroupOrderEditor({
	groups,
	isOpen,
	onClose,
	hasCustomOrder,
	onOrderChange,
}: {
	groups: CounterGroup[];
	isOpen: boolean;
	onClose: () => void;
	hasCustomOrder: boolean;
	onOrderChange: (order: string[] | undefined) => void;
}) {
	const reduceMotion = useReducedMotion();
	const [order, setOrder] = useState(() => groups.map((group) => group.name));
	const pendingOrder = useRef(order);
	useEffect(() => {
		const next = groups.map((group) => group.name);
		pendingOrder.current = next;
		setOrder(next);
	}, [groups]);
	const orderedGroups = useMemo(() => orderCounterGroups(groups, order), [groups, order]);
	const updateOrder = (next: string[]) => {
		pendingOrder.current = next;
		setOrder(next);
	};
	const saveOrder = () => {
		const next = pendingOrder.current;
		if (next.some((name, index) => groups[index]?.name !== name)) onOrderChange(next);
	};
	const close = () => {
		saveOrder();
		onClose();
	};
	return (
		<DarkMode>
			<CustomModal
				isOpen={isOpen}
				onClose={close}
				customProps={{
					Modal: { size: "sm", isCentered: true },
					ModalContent: { bg: "#171320", color: "#f3edf9", border: "1px solid #c1a4ef33", borderRadius: "16px", mx: 4 },
					ModalHeader: { fontSize: "17px" },
				}}
				properties={{
					title: "그룹 순서",
					body: (
						<>
							<Text fontSize="12px" color="#b4aacb" mb={3}>
								손잡이를 끌어 놓으면 자동으로 저장돼요.
							</Text>
							<Reorder.Group
								axis="y"
								values={order}
								onReorder={updateOrder}
								layoutScroll
								aria-label="그룹 순서 편집 목록"
								style={{ listStyle: "none", margin: 0, padding: "4px", maxHeight: "50dvh", overflowY: "auto" }}
							>
								{orderedGroups.map((group, index) => (
									<CounterGroupOrderItem
										key={group.name}
										group={group}
										index={index}
										count={groups.length}
										reduceMotion={!!reduceMotion}
										onDragEnd={saveOrder}
										onMove={(offset) => {
											updateOrder(moveCounterGroup(pendingOrder.current, group.name, offset));
											saveOrder();
										}}
									/>
								))}
							</Reorder.Group>
						</>
					),
					footer: (
						<Flex w="100%" justify="space-between" gap={3}>
							<ObservatoryButton isDisabled={!hasCustomOrder} onClick={() => onOrderChange(undefined)}>
								기본 순서
							</ObservatoryButton>
							<ObservatoryButton primary onClick={close}>
								완료
							</ObservatoryButton>
						</Flex>
					),
				}}
			/>
		</DarkMode>
	);
}

function CounterGroupOrderItem({
	group,
	index,
	count,
	reduceMotion,
	onMove,
	onDragEnd,
}: {
	group: CounterGroup;
	index: number;
	count: number;
	reduceMotion: boolean;
	onMove: (offset: -1 | 1) => void;
	onDragEnd: () => void;
}) {
	const controls = useDragControls();
	return (
		<Reorder.Item
			value={group.name}
			dragListener={false}
			dragControls={controls}
			onDragEnd={onDragEnd}
			transition={{ duration: reduceMotion ? 0 : 0.15 }}
			style={{
				position: "relative",
				marginBottom: "8px",
				borderRadius: "10px",
				background: "#211a31",
				border: "1px solid #c1a4ef26",
			}}
			whileDrag={{ boxShadow: "0 8px 24px #00000066", borderColor: "#c1a4ef" }}
		>
			<Flex align="center" gap={1} pr={1}>
				<ObservatoryButton
					aria-label={`${group.label} 순서 이동. 위아래 방향키로도 이동할 수 있어요.`}
					title="끌어서 이동 · ↑↓ 키로 이동"
					onPointerDown={(event) => {
						if (event.button === 0) controls.start(event);
					}}
					onKeyDown={(event) => {
						if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
						event.preventDefault();
						onMove(event.key === "ArrowUp" ? -1 : 1);
					}}
					cursor="grab"
					sx={{ touchAction: "none" }}
					userSelect="none"
					boxSize="44px"
					minW="44px"
					minH="44px"
					p={0}
					bg="transparent"
					borderColor="transparent"
					_active={{ cursor: "grabbing" }}
				>
					<MdDragIndicator size={20} aria-hidden="true" />
				</ObservatoryButton>
				<Text flex={1} minW={0} fontSize="12px" isTruncated title={group.label}>
					{group.label}
				</Text>
				<ObservatoryButton
					aria-label={`${group.label} 위로 이동`}
					isDisabled={index === 0}
					onClick={() => onMove(-1)}
					boxSize="32px"
					minH="32px"
					minW="32px"
					p={0}
					bg="transparent"
					borderColor="transparent"
				>
					<MdArrowUpward aria-hidden="true" />
				</ObservatoryButton>
				<ObservatoryButton
					aria-label={`${group.label} 아래로 이동`}
					isDisabled={index === count - 1}
					onClick={() => onMove(1)}
					boxSize="32px"
					minH="32px"
					minW="32px"
					p={0}
					bg="transparent"
					borderColor="transparent"
				>
					<MdArrowDownward aria-hidden="true" />
				</ObservatoryButton>
			</Flex>
		</Reorder.Item>
	);
}

function CounterProfile({
	member,
	isLive,
	homeMember,
	isHome,
	onSetHome,
}: {
	member: StellarV2State;
	isLive: boolean;
	homeMember?: StellarV2State;
	isHome: boolean;
	onSetHome: () => void;
}) {
	const channels = counterChannels(member);
	const followers = counterValue(member.cfc);
	const symbol = stellarSymbol(member.n);
	return (
		<Box
			as="section"
			aria-label="선택한 멤버 정보"
			position="relative"
			isolation="isolate"
			pt={{ base: 2, md: 3 }}
			pb={{ base: 8, md: 10 }}
		>
			{symbol && (
				<Box
					aria-hidden="true"
					position="absolute"
					inset={0}
					zIndex={-1}
					pointerEvents="none"
					backgroundImage={`url("${symbol}")`}
					backgroundRepeat="no-repeat"
					backgroundPosition="right center"
					backgroundSize={{ base: "240px", md: "380px", xl: "440px" }}
					opacity={{ base: stellarSymbolOpacity(member.n, 0.08), md: stellarSymbolOpacity(member.n, 0.12) }}
					sx={{
						maskImage: "linear-gradient(to right, transparent, #000 65%), linear-gradient(to bottom, transparent, #000 15%, #000 75%, transparent)",
						maskComposite: "intersect",
					}}
				/>
			)}
			<Flex align="center" gap={4}>
				<Avatar
					src={naver.chzzk.profileImageUrl(counterProfileImage(member), 120)}
					name={member.n}
					getInitials={() => ""}
					boxSize={{ base: "60px", md: "72px" }}
					bg={avatarFallbackColor(member.uid)}
				/>
				<Box minW={0}>
					<Text color="var(--obs-accent)" fontSize="11px">
						{member.gps?.map(counterGroupLabel).join(" / ") || "미분류"}
					</Text>
					<Heading as="h1" fontSize={{ base: "26px", md: "34px" }} letterSpacing="-.04em" fontWeight="500" mt={1}>
						{member.n}
					</Heading>
					<Flex gap={2} align="center" wrap="wrap" mt={2}>
						<Flex align="center" gap={1} color="var(--obs-muted)" fontSize="11px">
							<MdHome aria-hidden="true" />
							<Text role="status">첫화면 · {homeMember?.n || "미지정"}</Text>
						</Flex>
						<ObservatoryButton
							onClick={onSetHome}
							isDisabled={isHome}
							leftIcon={isHome ? <MdCheck aria-hidden="true" /> : undefined}
							fontSize="11px"
							px={2}
							py={1}
							minH="28px"
							borderRadius="8px"
							bg="transparent"
							aria-label={isHome ? `${member.n}, 첫화면으로 지정됨` : `${member.n}, 첫화면으로 지정`}
						>
							{isHome ? "지정됨" : "첫화면으로 지정"}
						</ObservatoryButton>
					</Flex>
					<Flex gap={2} align="center" mt={2}>
						{member.czi && isLive && (
							<Link href={naver.chzzk.liveUrl(member.czi)!} isExternal fontSize="12px" color="#85f3c8">
								● 치지직 방송 중 ↗
							</Link>
						)}
						{!!member.gd && parseV2Time(member.gd) <= Date.now() && (
							<Text fontSize="12px" color="var(--obs-muted)">
								졸업 멤버
							</Text>
						)}
					</Flex>
				</Box>
			</Flex>
			{(channels.length > 0 || (!!member.czi?.trim() && followers !== null)) && (
				<Flex gap={{ base: 5, md: 8 }} wrap="wrap" mt={7}>
					{channels.map(({ id, handle, count, index }) => (
						<Link
							key={`${id}-${index}`}
							href={(youtube.channelUrl(handle) || youtube.channelUrlByYoutubeId(id))!}
							isExternal
							pl={4}
							borderLeft="1px solid #c1a4ef40"
							_hover={{ color: "var(--obs-accent)", textDecoration: "none" }}
						>
							<Flex align="center" gap={2} fontSize="11px" color="var(--obs-muted)">
								<Box as={index ? SiYoutubemusic : FaYoutube} boxSize="16px" color="#ed949e" aria-hidden="true" />
								<Text>YouTube {index ? `뮤직 채널${index > 1 ? ` ${index}` : ""}` : "채널"}</Text>
								<MdOpenInNew aria-hidden="true" />
							</Flex>
							<Flex align="baseline" gap={2} mt={1}>
								<Text
									fontSize={{ base: "22px", md: "26px" }}
									fontWeight="500"
									sx={{ fontVariantNumeric: "tabular-nums" }}
								>
									{numberToLocaleString(count!)}
								</Text>
								<Text fontSize="10px" color="var(--obs-muted)">
									구독자
								</Text>
							</Flex>
						</Link>
					))}
					{!!member.czi?.trim() && followers !== null && (
						<Link
							href={naver.chzzk.channelUrl(member.czi)!}
							isExternal
							pl={4}
							borderLeft="1px solid #c1a4ef40"
							_hover={{ color: "var(--obs-accent)", textDecoration: "none" }}
						>
							<Flex align="center" gap={2} fontSize="11px" color="var(--obs-muted)">
								<ImageV2
									src="/images/i_chzzk_1.png"
									boxSize="16px"
									ratio={1}
									flexShrink={0}
									alt=""
									bg="transparent"
									isDarkMode
								/>
								<Text>치지직</Text>
								<MdOpenInNew aria-hidden="true" />
							</Flex>
							<Flex align="baseline" gap={2} mt={1}>
								<Text
									fontSize={{ base: "22px", md: "26px" }}
									fontWeight="500"
									sx={{ fontVariantNumeric: "tabular-nums" }}
								>
									{numberToLocaleString(followers)}
								</Text>
								<Text fontSize="10px" color="var(--obs-muted)">
									팔로워
								</Text>
							</Flex>
						</Link>
					)}
				</Flex>
			)}
		</Box>
	);
}

function CounterVideo({ video, now }: { video: YoutubeMusicDataV2; now: number }) {
	const details = useDisclosure();
	const title = video.ta || video.tl;
	const premiere = video.lbc === "upcoming" || video.lbc === "live";
	const milestones = premiere
		? []
		: [
				{ source: "", videoId: video.vi, record: recentMilestone(video.st, now) },
				...video.dt.map((detail) => ({
					source: detail.t,
					videoId: detail.vi,
					record: recentMilestone(detail.st, now),
				})),
			].filter((entry) => entry.record);
	const highlight = premiere || milestones.length > 0;
	const accent = premiere ? (video.lbc === "live" ? "#ffabba" : "#aedbff") : "#edc78f";
	const counts = [video.vc, ...video.dt.map((detail) => detail.vc)].map(counterValue);
	const total = counts.every((count) => count !== null)
		? counts.reduce<number>((sum, count) => sum + (count ?? 0), 0)
		: null;
	const milestoneSummary = milestones.length > 0 && (
		<Stack as="section" aria-label={`최근 ${HOME_LIMITS.milestoneDays}일 달성 기록`} spacing={1} mt={2}>
			{milestones.map(({ source, videoId, record }, index) => (
				<Flex
					key={`${videoId}-${index}`}
					align="start"
					justify={{ base: "flex-start", md: "flex-end" }}
					gap={1.5}
					color="#edc78f"
					fontSize="11px"
					title={`${source ? `${source} · ` : ""}${homeDate(record!.at)}`}
				>
					<Box flexShrink={0} pt="2px">
						<MdEmojiEvents aria-hidden="true" />
					</Box>
					<Box minW={0}>
						{source && <Text isTruncated>{source}</Text>}
						<Text>
							<Text as="span" whiteSpace="nowrap">
								{elapsedTimeText(parseV2Time(record!.at), now)}
							</Text>{" "}
							<Text as="span" fontWeight="600" whiteSpace="nowrap">
								{homeCount(record!.u)} 달성
							</Text>
						</Text>
					</Box>
				</Flex>
			))}
		</Stack>
	);
	return (
		<Flex
			as="article"
			direction={{ base: "column", sm: "row" }}
			gap={{ base: 4, md: 5 }}
			py={6}
			px={highlight ? 4 : 0}
			my={highlight ? 3 : 0}
			borderRadius={highlight ? "16px" : 0}
			borderTop={`1px solid ${highlight ? `${accent}55` : "var(--obs-line)"}`}
			borderLeft={highlight ? `3px solid ${accent}` : undefined}
			bg={highlight ? `linear-gradient(110deg, ${accent}12, ${accent}03)` : undefined}
		>
			<Box flexShrink={0} w={{ base: "100%", sm: "160px", md: "208px" }} alignSelf="start">
				<Link
					href={youtube.videoUrl(video.vi)!}
					isExternal
					display="block"
					borderRadius="14px"
					overflow="hidden"
					aria-label={`${title} 영상 보기`}
				>
					<ImageV2
						src={generateStandardThumbnail(video.vi)}
						alt=""
						w="100%"
						ratio={16 / 9}
						objectFit="cover"
						loading="lazy"
						bg="#211a31"
						isDarkMode
						imageProps={youtubeThumbnailImageProps}
					/>
				</Link>
				<Box display={{ base: "block", md: "none" }}>{milestoneSummary}</Box>
			</Box>
			<Box flex={1} minW={0}>
				<Flex gap={1.5} wrap="wrap" mb={2}>
					<DarkMode>
						{premiere && (
							<Badge
								display="inline-flex"
								alignItems="center"
								gap={1.5}
								color="#241b2e"
								bg={accent}
								borderRadius="full"
								px={3}
								py={1}
							>
								{video.lbc === "live" ? <MdSensors aria-hidden="true" /> : <MdSchedule aria-hidden="true" />}
								{video.lbc === "live" ? "지금 최초공개 중" : "최초공개 예정"}
							</Badge>
						)}
						{video.tg?.map((tag) => (
							<Badge
								key={tag.i ?? tag.n}
								colorScheme={tag.cc || "purple"}
								borderRadius="full"
								px={2}
								py={0.5}
								fontWeight="500"
								textTransform="none"
								whiteSpace="normal"
							>
								{tag.n}
							</Badge>
						))}
					</DarkMode>
				</Flex>
				<Flex direction={{ base: "column", md: "row" }} gap={3} justify="space-between">
					<Box minW={0} flex={1}>
						<Link
							href={youtube.videoUrl(video.vi)!}
							isExternal
							title={title}
							_hover={{ color: "var(--obs-accent)", textDecoration: "none" }}
						>
							<Heading
								as="h3"
								fontSize={{ base: "18px", md: "20px" }}
								fontWeight="500"
								noOfLines={2}
								lineHeight="1.5"
								minH="3em"
							>
								{title}
							</Heading>
						</Link>
						<Text fontSize="12px" color="var(--obs-muted)" mt={2}>
							{homeDate(premiere ? video.sst : video.pa)} · {premiere ? "공개" : "게시"}
						</Text>
						{!premiere && !!video.pa && (
							<Text fontSize="12px" color="var(--obs-muted)">
								{elapsedTimeText(parseV2Time(video.pa))}
							</Text>
						)}
					</Box>
					<Box flexShrink={0} maxW={{ md: "210px" }} textAlign={{ base: "left", md: "right" }}>
						<Flex
							align="center"
							gap={1.5}
							justify={{ base: "flex-start", md: "flex-end" }}
							fontSize="11px"
							color="var(--obs-muted)"
						>
							<FaYoutube aria-hidden="true" />
							<Text>조회수</Text>
						</Flex>
						<Text fontSize="24px" fontWeight="500" color="#e2cef9" sx={{ fontVariantNumeric: "tabular-nums" }}>
							{premiere ? (video.lbc === "live" ? "최초공개 중" : "공개 대기") : homeCount(video.vc)}
						</Text>
						<Box display={{ base: "none", md: "block" }}>{milestoneSummary}</Box>
					</Box>
				</Flex>
				{!premiere && <CounterMetrics count={video.vc} likes={video.lc} updatedAt={video.cua} />}
				<Flex gap={4} mt={3} fontSize="11px" color="var(--obs-muted)" wrap="wrap">
					<Link href={youtube.musicUrl(video.vi)!} isExternal display="inline-flex" alignItems="center" gap={1.5}>
						<SiYoutubemusic aria-hidden="true" />
						YouTube Music
						<MdOpenInNew aria-hidden="true" />
					</Link>
					{!premiere && video.dt.length > 0 && (
						<Text>본편 + 연결 영상 합계 {total === null ? "집계 대기" : homeCount(String(total))}</Text>
					)}
				</Flex>
				{video.dt.length > 0 && (
					<Box mt={4}>
						<ObservatoryButton
							onClick={details.onToggle}
							aria-expanded={details.isOpen}
							aria-controls={`counter-details-${video.vi}`}
							fontSize="12px"
							py={1}
							px={3}
							rightIcon={details.isOpen ? <MdExpandLess /> : <MdExpandMore />}
						>
							연결 영상 {video.dt.length}개 {details.isOpen ? "접기" : "보기"}
						</ObservatoryButton>
						<Collapse in={details.isOpen}>
							<Stack id={`counter-details-${video.vi}`} mt={3} spacing={3} pl={3} borderLeft="1px solid #c1a4ef40">
								{video.dt.map((detail, index) => (
									<Box key={`${detail.t}-${detail.vi}-${index}`} py={2} fontSize="13px">
										<Flex align="center" justify="space-between" gap={3} wrap="wrap">
											{detail.vi ? (
												<Link
													href={youtube.videoUrl(detail.vi)!}
													isExternal
													display="inline-flex"
													alignItems="center"
													gap={1.5}
												>
													<FaYoutube aria-hidden="true" />
													{detail.t}
													<MdOpenInNew aria-hidden="true" />
												</Link>
											) : (
												<Text>{detail.t}</Text>
											)}
											<Text color="#e2cef9">{homeCount(detail.vc)}</Text>
										</Flex>
										<CounterMetrics count={detail.vc} likes={detail.lc} updatedAt={detail.cua} />
									</Box>
								))}
							</Stack>
						</Collapse>
					</Box>
				)}
			</Box>
		</Flex>
	);
}

function CounterMetrics({ count, likes, updatedAt }: { count?: string; likes?: string; updatedAt?: number }) {
	const goal = counterGoal(count);
	return (
		<Box mt={3}>
			{goal && (
				<Box maxW="460px">
					<Flex justify="space-between" align="baseline" gap={3} fontSize="11px" mb={1.5} wrap="wrap">
						<Text color="var(--obs-muted)">다음 목표 {numberToLocaleString(goal.target)}회</Text>
						<Text color="#d4bce9">{numberToLocaleString(goal.remaining)}회 남음</Text>
					</Flex>
					<Box
						role="progressbar"
						aria-label="다음 조회수 목표"
						aria-valuenow={goal.count}
						aria-valuemin={0}
						aria-valuemax={goal.target}
						h="3px"
						bg="#c1a4ef18"
						borderRadius="full"
					>
						<Box h="100%" w={`${(goal.count / goal.target) * 100}%`} bg="#a88fc2" borderRadius="full" />
					</Box>
				</Box>
			)}
			<Flex gap={3} mt={2} wrap="wrap" fontSize="10px" color="var(--obs-muted)">
				{counterValue(likes) !== null && <Text>좋아요 {numberToLocaleString(counterValue(likes)!)}</Text>}
				{!!updatedAt && <Text>집계 {homeDate(updatedAt)}</Text>}
			</Flex>
		</Box>
	);
}

