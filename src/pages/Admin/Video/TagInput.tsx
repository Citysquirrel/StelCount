import React, { useState, useRef, KeyboardEvent, useEffect } from "react";
import {
	Box,
	Flex,
	Input,
	Tag,
	TagLabel,
	TagCloseButton,
	List,
	ListItem,
	useOutsideClick,
	InputProps,
	BoxProps,
} from "@chakra-ui/react";
import { Tag as TagType } from "@/lib/types";

interface TagInputAutocompleteProps extends InputProps {
	data: TagType[] | undefined;
	tagData: TagType[] | undefined;
	onChangeTags?: (tags: TagType[]) => void;
	wrapperProps?: BoxProps;
}

export default function TagInputAutocomplete({
	data = [],
	tagData = [],
	onChangeTags,
	wrapperProps,
	...props
}: TagInputAutocompleteProps) {
	const [selectedTags, setSelectedTags] = useState<TagType[]>([]);
	const [inputValue, setInputValue] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState(0);

	const wrapperRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLUListElement>(null);

	// 현재 입력값으로 필터링된 드롭다운 옵션 (이미 선택된 태그는 제외)
	const availableOptions = tagData.filter(
		(item) =>
			item.name.toLowerCase().includes(inputValue.toLowerCase()) &&
			!selectedTags.some((selected) => selected.id === item.id),
	);

	// 드롭다운 외부 클릭 시 닫기
	useOutsideClick({
		ref: wrapperRef,
		handler: () => setIsOpen(false),
	});

	// 입력값이 변경될 때마다 드롭다운 열고 하이라이트 인덱스 초기화
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
		setIsOpen(true);
		setHighlightedIndex(0);
	};

	const addTag = (tag: TagType) => {
		const nextTags = [...selectedTags, tag];
		setSelectedTags(nextTags);
		onChangeTags?.(nextTags); // 부모 컴포넌트에 알림
		setInputValue("");
		setIsOpen(false);
		inputRef.current?.focus();
	};

	const removeTag = (tagToRemove: TagType) => {
		const nextTags = selectedTags.filter((tag) => tag.id !== tagToRemove.id);
		setSelectedTags(nextTags);
		onChangeTags?.(nextTags); // 부모 컴포넌트에 알림
	};

	// 키보드 이벤트 핸들링 (방향키, 엔터, 백스페이스)
	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (!isOpen && inputValue) setIsOpen(true);

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setHighlightedIndex((prev) => Math.min(prev + 1, availableOptions.length - 1));
				break;
			case "ArrowUp":
				e.preventDefault();
				setHighlightedIndex((prev) => Math.max(prev - 1, 0));
				break;
			case "Enter":
				e.preventDefault();
				if (isOpen && availableOptions[highlightedIndex]) {
					addTag(availableOptions[highlightedIndex]);
				}
				break;
			case "Backspace":
				// 입력창이 비어있을 때 백스페이스 누르면 맨 마지막 태그 삭제
				if (!inputValue && selectedTags.length > 0) {
					const nextTags = [...selectedTags];
					nextTags.pop();
					setSelectedTags(nextTags);
					onChangeTags?.(nextTags);
				}
				break;
			case "Escape":
				setIsOpen(false);
				break;
			default:
				break;
		}
	};

	// 방향키를 누를 때마다 하이라이트된 아이템으로 스크롤 자동 이동
	useEffect(() => {
		if (isOpen && listRef.current) {
			// 현재 하이라이트된 DOM 요소를 찾음
			const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
			if (highlightedElement) {
				highlightedElement.scrollIntoView({
					block: "nearest", // 화면을 확 움직이지 않고, 요소가 보일 만큼만 최소한으로 스크롤
				});
			}
		}
	}, [highlightedIndex, isOpen]);

	useEffect(() => {
		if (data) {
			setSelectedTags(data);
		}
	}, [data]);

	return (
		<Box position="relative" w="100%" ref={wrapperRef} {...wrapperProps}>
			{/* 가짜 입력창 (Wrapper) */}
			<Flex
				alignItems="center"
				border="1px solid"
				borderColor="inherit"
				borderRadius="sm"
				p={2}
				cursor="text"
				overflowX="auto" // 내용이 많아지면 한 줄을 유지하며 스크롤되도록 설정
				css={{
					// 스크롤바 숨기기
					"&::-webkit-scrollbar": { display: "none" },
					msOverflowStyle: "none",
					scrollbarWidth: "none",
				}}
				onClick={() => inputRef.current?.focus()}
				_focusWithin={{
					borderColor: "blue.500",
					boxShadow: "0 0 0 1px #3182ce",
				}}
			>
				{/* 선택된 태그 렌더링 */}
				{selectedTags.map((tag) => (
					<Tag key={tag.id} size="md" colorScheme={tag.colorCode || "gray"} mr={2} flexShrink={0}>
						<TagLabel>{tag.name}</TagLabel>
						<TagCloseButton
							onClick={(e) => {
								e.stopPropagation();
								removeTag(tag);
							}}
						/>
					</Tag>
				))}

				{/* 실제 입력창 */}
				<Input
					ref={inputRef}
					variant="unstyled"
					placeholder={selectedTags.length === 0 ? "태그 검색하기..." : ""}
					value={inputValue}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					onFocus={() => setIsOpen(true)}
					minW="120px"
					flex="1"
					autoComplete="off"
					spellCheck="false"
					{...props}
				/>
			</Flex>

			{/* 커스텀 드롭다운 */}
			{isOpen && availableOptions.length > 0 && (
				<List
					ref={listRef}
					position="absolute"
					top="100%"
					left={0}
					right={0}
					mt={2}
					bg="white"
					boxShadow="md"
					borderRadius="md"
					maxH="200px"
					overflowY="auto"
					zIndex={10}
					border="1px solid"
					borderColor="gray.200"
				>
					{availableOptions.map((option, index) => (
						<ListItem
							key={option.id}
							p={3}
							cursor="pointer"
							bg={index === highlightedIndex ? "blue.50" : "transparent"}
							_hover={{ bg: "blue.50" }}
							onClick={() => addTag(option)}
						>
							<Tag colorScheme={option.colorCode || "gray"}>{option.name}</Tag>
						</ListItem>
					))}
				</List>
			)}
		</Box>
	);
}
