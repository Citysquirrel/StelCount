import { Button, Input, Stack } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { fetchServer } from "../lib/functions/fetch";

export function Admin() {
	const firstRef = useRef<HTMLInputElement | null>(null);

	const [inputValue, setInputValue] = useState<StellarInputValue>({ name: "", youtubeId: "", chzzkId: "", xId: "" });

	const handleInputValue = (key: keyof StellarInputValue) => (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setInputValue((prev) => ({ ...prev, [key]: value }));
	};

	const handleSubmit = (e: React.FormEvent<HTMLDivElement>) => {
		e.preventDefault();
		fetchServer("/stellar", "v1", { method: "POST", body: inputValue }).then((res) => {
			console.log(res.data);
		});
	};

	useEffect(() => {
		fetchServer("/stellars", "v1").then((res) => {
			console.log(res.data);
		});
		firstRef.current?.focus();
	}, []);
	return (
		<>
			<Stack as="form" onSubmit={handleSubmit}>
				<Input ref={firstRef} placeholder="스텔라 이름" value={inputValue.name} onChange={handleInputValue("name")} />
				<Input placeholder="유튜브 ID" value={inputValue.youtubeId} onChange={handleInputValue("youtubeId")} />
				<Input placeholder="치지직 ID" value={inputValue.chzzkId} onChange={handleInputValue("chzzkId")} />
				<Input placeholder="X ID" value={inputValue.xId} onChange={handleInputValue("xId")} />
				<Button type="submit">등록</Button>
			</Stack>
			<Stack></Stack>
		</>
	);
}

interface StellarInputValue {
	name: string;
	youtubeId: string;
	chzzkId: string;
	xId: string;
}
