import React, { useState, ChangeEvent, useEffect } from "react";
import {
	Box,
	Button,
	FormControl,
	FormErrorMessage,
	FormLabel,
	HStack,
	Text,
	Textarea,
	VStack,
} from "@chakra-ui/react";

interface JsonEditorProps {
	value: string;
	onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
	name?: string;
	id?: string;
	minH?: string;
}

export const JsonEditor = ({ value, onChange, name, id, minH = "300px" }: JsonEditorProps) => {
	const [error, setError] = useState<string | null>(null);

	// value가 외부에서 변경될 때마다 유효성 검사 수행
	useEffect(() => {
		if (!value || value.trim() === "") {
			setError(null);
			return;
		}

		try {
			JSON.parse(value);
			setError(null);
		} catch (err: any) {
			setError(err.message);
		}
	}, [value]);

	// JSON 포맷팅 (Pretty Print)
	const formatJson = () => {
		if (!value || value.trim() === "") return;

		try {
			const parsedData = JSON.parse(value);
			const formattedJson = JSON.stringify(parsedData, null, 2);

			// 포맷팅 버튼 클릭 시, 부모의 onChange 규격을 깨지 않기 위해 가짜 Event 객체를 생성하여 전달
			const mockEvent = {
				target: {
					value: formattedJson,
					name: name || "",
					id: id || "",
				},
			} as ChangeEvent<HTMLTextAreaElement>;

			onChange(mockEvent);
			setError(null);
		} catch (err) {
			setError("유효하지 않은 JSON 형식이어서 포맷팅할 수 없습니다.");
		}
	};

	return (
		<VStack spacing={2} align="stretch" w="100%">
			<FormControl isInvalid={!!error}>
				<HStack justify="space-between" mb={2}>
					<FormLabel m={0} fontWeight="bold" fontSize="sm">
						JSON 입력
					</FormLabel>
					<Button size="xs" colorScheme="blue" onClick={formatJson}>
						포맷팅
					</Button>
				</HStack>

				<Textarea
					id={id}
					name={name}
					value={value}
					onChange={onChange} // Textarea의 기본 onChange를 그대로 부모로 전달
					placeholder='{"key": "value"}'
					minH={minH}
					fontFamily="monospace"
					fontSize="sm"
					bg="gray.50"
					_dark={{ bg: "whiteAlpha.50" }}
					resize="vertical"
				/>
				{error && <FormErrorMessage fontSize="xs">유효성 오류: {error}</FormErrorMessage>}
			</FormControl>

			<Box
				p={2}
				bg={error ? "red.50" : value ? "green.50" : "gray.50"}
				_dark={{
					bg: error ? "red.900" : value ? "green.900" : "whiteAlpha.100",
				}}
				borderRadius="md"
				borderWidth="1px"
				borderColor={error ? "red.200" : value ? "green.200" : "gray.200"}
			>
				<Text
					fontSize="xs"
					color={error ? "red.600" : value ? "green.600" : "gray.500"}
					_dark={{
						color: error ? "red.300" : value ? "green.300" : "gray.400",
					}}
					fontWeight="bold"
					textAlign="center"
				>
					{error
						? "❌ 유효하지 않은 JSON 형식입니다."
						: value
							? "✅ 유효한 JSON 형식입니다."
							: "데이터를 입력해주세요."}
				</Text>
			</Box>
		</VStack>
	);
};

export default JsonEditor;
