import { Button, Input, Stack } from "@chakra-ui/react";
import { useEffect, useRef } from "react";

export function Admin() {
	const firstRef = useRef<HTMLInputElement | null>(null);
	useEffect(() => {
		firstRef.current?.focus();
	}, []);
	return (
		<Stack>
			<Input ref={firstRef} placeholder="스텔라 이름" />
			<Input placeholder="유튜브 ID" />
			<Input placeholder="치지직 ID" />
			<Input placeholder="X ID" />
			<Button>등록</Button>
		</Stack>
	);
}
