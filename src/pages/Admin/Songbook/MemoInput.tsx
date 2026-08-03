import React, { useState, useRef } from "react";
import { Box, Input, List, ListItem, useOutsideClick, useColorModeValue, InputProps } from "@chakra-ui/react";

interface MemoInputAutocompleteProps extends InputProps {
	options: string[];
	placeholder?: string;
	memoData: string[] | undefined;
	onChangeMemos?: (tags: string[]) => void;
}

export const MemoInputAutocomplete = ({
	options,
	placeholder,
	memoData,
	onChangeMemos,
	...props
}: MemoInputAutocompleteProps) => {
	const [inputValue, setInputValue] = useState("");
	const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState(-1); // 키보드 이동용 상태

	const wrapperRef = useRef<HTMLDivElement>(null);

	// 다크/라이트 모드 대응 색상
	const listBg = useColorModeValue("white", "gray.700");
	const hoverBg = useColorModeValue("gray.100", "gray.600");
	const highlightBg = useColorModeValue("blue.50", "blue.900");

	// 1. 바깥 영역 클릭 시 드롭다운 닫기
	useOutsideClick({
		ref: wrapperRef,
		handler: () => setIsOpen(false),
	});

	// 2. 타이핑 핸들러
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setInputValue(value);

		if (value.trim() === "") {
			setFilteredOptions([]);
			setIsOpen(false);
		} else {
			// 대소문자 구분 없이 포함된 단어 필터링
			const filtered = options.filter((option) => option.toLowerCase().includes(value.toLowerCase()));
			setFilteredOptions(filtered);
			setIsOpen(true);
		}
		setHighlightedIndex(-1); // 필터링 되면 포커스 초기화
	};

	// 3. 리스트 항목 선택 핸들러
	const handleSelect = (option: string) => {
		setInputValue(option);
		setIsOpen(false);
		setHighlightedIndex(-1);
	};

	// 4. 키보드 접근성 (위, 아래 화살표 및 엔터)
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (!isOpen) return;

		if (e.key === "ArrowDown") {
			e.preventDefault();
			setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
		} else if (e.key === "Enter") {
			e.preventDefault();
			if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
				handleSelect(filteredOptions[highlightedIndex]);
			}
		} else if (e.key === "Escape") {
			setIsOpen(false);
		}
	};

	return (
		// Box에 relative를 주어 하위 List가 Input 바로 아래에 붙도록 설정
		<Box ref={wrapperRef} position="relative" w="100%">
			<Input
				value={inputValue}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
				onFocus={() => {
					if (filteredOptions.length > 0) setIsOpen(true);
				}}
				placeholder={placeholder || "검색어를 입력하세요..."}
				{...props}
			/>

			{/* 검색 결과 드롭다운 */}
			{isOpen && filteredOptions.length > 0 && (
				<List
					position="absolute"
					top="100%"
					left={0}
					right={0}
					mt={1}
					zIndex="popover" // 다른 요소들 위로 뜨도록
					bg={listBg}
					borderWidth="1px"
					borderRadius="md"
					boxShadow="md"
					maxH="200px" // 리스트가 길어지면 스크롤 생성
					overflowY="auto"
				>
					{filteredOptions.map((option, index) => (
						<ListItem
							key={option}
							px={4}
							py={2}
							cursor="pointer"
							bg={highlightedIndex === index ? highlightBg : "transparent"}
							_hover={{ bg: hoverBg }}
							onClick={() => handleSelect(option)}
							// 💡 핵심 팁: mousedown에서 기본 동작을 막지 않으면,
							// 클릭하는 순간 Input이 블러(blur) 처리되어 onClick이 실행되기도 전에 리스트가 닫히는 버그가 생깁니다.
							onMouseDown={(e) => e.preventDefault()}
						>
							{option}
						</ListItem>
					))}
				</List>
			)}
		</Box>
	);
};
