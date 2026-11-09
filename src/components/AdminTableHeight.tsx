import { Flex, FormLabel, NumberInput, NumberInputField, Text } from "@chakra-ui/react";
import { useEffect, useId, useState } from "react";
import { useLocalStorage } from "usehooks-ts";

export function AdminTableHeight({ value, onChange }: { value: number; onChange: (value: number) => void }) {
	const id = useId();
	const [draft, setDraft] = useState(String(value));
	useEffect(() => setDraft(String(value)), [value]);
	return (
		<Flex align="center" gap={2} flexShrink={0}>
			<FormLabel htmlFor={id} m={0} fontSize="sm" whiteSpace="nowrap">표 높이</FormLabel>
			<NumberInput size="sm" w="90px" min={300} max={800} value={draft}
				onChange={(text, number) => {
					setDraft(text);
					if (Number.isFinite(number) && number >= 300 && number <= 800) onChange(number);
				}}
				onBlur={() => {
					const next = Math.min(800, Math.max(300, Number(draft) || 500));
					setDraft(String(next));
					onChange(next);
				}}>
				<NumberInputField id={id} px={3} />
			</NumberInput>
			<Text fontSize="sm">px</Text>
		</Flex>
	);
}

// 기존 페이지별 높이 설정을 유지하면서 신규 기본값을 공유한다.
export function useAdminTableHeight(page: string) {
	const [stored, setHeight] = useLocalStorage<number>(`table-height_${page}`, 500);
	const height = Number.isFinite(stored) ? Math.min(800, Math.max(300, stored)) : 500;
	return [height, setHeight] as const;
}
