import { stellarV2State } from "@/lib/Atom";
import { Tag as TagType } from "@/lib/types";
import {
	Avatar,
	Button,
	Checkbox,
	CheckboxGroup,
	Flex,
	Popover,
	PopoverArrow,
	PopoverBody,
	PopoverCloseButton,
	PopoverContent,
	PopoverTrigger,
	Stack,
	Tag,
	Text,
} from "@chakra-ui/react";
import { Fragment, useState } from "react";
import { useRecoilState } from "recoil";

interface FilterPanelProps {
	tags: TagType[] | undefined;
	onChangeStellars?: (playlistIds: (string | number)[]) => void;
	onChangeTags?: (tagIds: (string | number)[]) => void;
}

export default function FilterPanel({ tags = [], onChangeStellars, onChangeTags }: FilterPanelProps) {
	const [stellarData] = useRecoilState(stellarV2State);

	// 상태
	const [selectedStellar, setSelectedStellar] = useState<(string | number)[]>([]);
	const [selectedTag, setSelectedTag] = useState<(string | number)[]>([]);

	return (
		<Flex gap={2}>
			{/* 스텔라 필터 */}
			<Popover placement="bottom-start">
				<PopoverTrigger>
					<Button variant="outline" size="sm">
						스텔라 필터
						<Text as={"span"} fontSize="xs" color="gray" fontWeight={"400"} display="inline-block">
							{selectedStellar.length > 0 ? `(${selectedStellar.length} 항목 선택됨)` : null}
						</Text>
					</Button>
				</PopoverTrigger>

				<PopoverContent width="320px" _focus={{ boxShadow: "none" }}>
					<PopoverArrow />

					<PopoverCloseButton />

					<PopoverBody padding="4">
						<Stack spacing={2}>
							<Stack spacing="2">
								<CheckboxGroup
									colorScheme="blue"
									value={selectedStellar}
									onChange={(value) => {
										onChangeStellars?.(value);
										setSelectedStellar(value);
									}}
								>
									<Stack direction="row" wrap="wrap" spacing={3}>
										{stellarData.map((s) => (
											<Fragment key={s.n}>
												{s.plm && (
													<Checkbox size="md" value={s.plm} cursor="pointer">
														<Avatar size="sm" src={`${s.pi}?type=f60_60_na`} name={s.n} />
													</Checkbox>
												)}
											</Fragment>
										))}
									</Stack>
								</CheckboxGroup>
							</Stack>
						</Stack>
					</PopoverBody>
				</PopoverContent>
			</Popover>

			{/* 태그 필터 */}
			<Popover placement="bottom-start">
				<PopoverTrigger>
					<Button variant="outline" size="sm">
						태그 필터
						<Text as={"span"} fontSize="xs" color="gray" fontWeight={"400"} display="inline-block">
							{selectedTag.length > 0 ? `(${selectedTag.length} 항목 선택됨)` : null}
						</Text>
					</Button>
				</PopoverTrigger>

				<PopoverContent width="320px" _focus={{ boxShadow: "none" }}>
					<PopoverArrow />

					<PopoverCloseButton />

					<PopoverBody padding="4">
						<Stack spacing={2}>
							<Stack spacing="2">
								<CheckboxGroup
									colorScheme="blue"
									value={selectedTag}
									onChange={(value) => {
										onChangeTags?.(value);
										setSelectedTag(value);
									}}
								>
									<Stack direction="row" wrap="wrap" spacing={3}>
										{tags.map((tag) => (
											<Checkbox key={tag.id} size="md" value={String(tag.id)} cursor="pointer">
												<Tag colorScheme={tag.colorCode || undefined}>{tag.name}</Tag>
											</Checkbox>
										))}
									</Stack>
								</CheckboxGroup>
							</Stack>
						</Stack>
					</PopoverBody>
				</PopoverContent>
			</Popover>
		</Flex>
	);
}
