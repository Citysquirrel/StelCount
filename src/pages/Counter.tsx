import { useEffect, useState } from "react";
import { naver, youtube } from "../lib/functions/platforms";
import styled from "@emotion/styled";

export function Counter() {
	return (
		<div>
			<section>
				<SubscriberCount />
			</section>
		</div>
	);
}

const Card = styled.div`
	font-family: roboto;
	display: flex;
	flex-direction: column;
	font-size: 2.25rem;
	font-weight: bold;
	width: 400px;
	height: 180px;
	border: 1px solid grey;
	border-radius: 12px;
	overflow: hidden;
`;

const ChzzkStatus = styled.div`
	display: flex;
	flex: 1;
	/* background-color: #00ffa3; */
	justify-content: center;
	align-items: center;
`;

const YoutubeStatus = styled.div`
	display: flex;
	flex: 1;
	/* background-color: #c4302b; */
	justify-content: center;
	align-items: center;
`;

interface CountState {
	youtube: number;
	chzzk: number;
}
interface NameState {
	youtube: string;
	chzzk: string;
}

function SubscriberCount() {
	const [name, setName] = useState<NameState>({ youtube: "", chzzk: "" });
	const [count, setCount] = useState<CountState>({ youtube: 0, chzzk: 0 });
	useEffect(() => {
		//! 반드시 백엔드로 옮겨야함
		// youtube
		// 	.channels({
		// 		part: ["statistics", "snippet"],
		// 		id: "UCAHVQ44O81aehLWfy9O6Elw",
		// 		key: import.meta.env.VITE_YOUTUBE_API_KEY,
		// 	})
		// 	.then(async (res) => {
		// 		setCount((prev) => ({ ...prev, youtube: res.data.items[0].statistics.subscriberCount }));
		// 		setName((prev) => ({ ...prev, youtube: res.data.items[0].snippet.title }));
		// 	});
		// naver.chzzk.channels("a6c4ddb09cdb160478996007bff35296").then((res) => {
		// 	setCount((prev) => ({ ...prev, chzzk: res.data.content.followerCount }));
		// });
	}, []);

	// items[0].statistics.subscriberCount;

	return (
		<Card>
			<YoutubeStatus>{count.youtube} </YoutubeStatus>
			<ChzzkStatus>{count.chzzk}</ChzzkStatus>
		</Card>
	);
}
