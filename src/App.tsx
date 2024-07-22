import { Header } from "./components/Header";
import { Outlet } from "react-router-dom";
import { useNavigateEvent } from "./lib/hooks/useNavigateEvent";
import { Container } from "./components/Container";
import { Footer } from "./components/Footer";
import { useStellar } from "./lib/hooks/useStellar";
import { Button, Divider, IconButton, Link, Stack, Text, Tooltip, useColorMode } from "@chakra-ui/react";
import { MdCreate, MdDarkMode, MdHome, MdLightMode, MdOndemandVideo, MdQuestionMark, MdSettings } from "react-icons/md";
import { GrMultiple } from "react-icons/gr";
import { useRecoilState } from "recoil";
import { serverErrorState, isStellarLoadingState, backgroundColorState, fetchInfoState, nowState } from "./lib/Atom";
import { ServerErrorPage } from "./pages/ServerErrorPage";
import { LoadingAtCorner } from "./components/Loading";
import { ImListNumbered } from "react-icons/im";
import { IoReload } from "react-icons/io5";
import { useAuth } from "./lib/hooks/useAuth";
import { CAFE_WRITE_URL } from "./lib/constant";
import { useEffect } from "react";
import { elapsedTimeText } from "./lib/functions/etc";

function App() {
	const nav = useNavigateEvent();
	const { colorMode, toggleColorMode } = useColorMode();
	const [isStellarLoading] = useRecoilState(isStellarLoadingState);
	const [serverError] = useRecoilState(serverErrorState);
	const [backgroundColor] = useRecoilState(backgroundColorState);
	const [fetchInfo] = useRecoilState(fetchInfoState);
	const [now, setNow] = useRecoilState(nowState);
	const { refetch, intervalRef } = useStellar();
	const { isAdmin, isLoading } = useAuth();

	const handleReload = () => {
		refetch(true);
		clearInterval(intervalRef.current);
		intervalRef.current = setInterval(() => {
			let second = new Date().getSeconds();
			if (second === 0 && import.meta.env.PROD) refetch(true);
		}, 1000);
	};

	useEffect(() => {
		const i = setInterval(() => {
			let ms = new Date().getMilliseconds();
			if (ms) setNow(new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })));
		}, 1000);

		return () => {
			clearInterval(i);
		};
	}, []);

	const [timeGap, timeText] = elapsedTimeText(new Date(fetchInfo.stellar?.date || "1000-01-01T09:00:00.000Z"), now);

	if (serverError.isError) return <ServerErrorPage />;
	return (
		<Stack backgroundColor={backgroundColor} gap="0" transition="background-color .3s">
			{isLoading ? <LoadingAtCorner /> : null}
			<Header>
				<Tooltip label="메인화면">
					<IconButton
						fontSize="1.375rem"
						isRound
						icon={<MdHome />}
						colorScheme={colorMode === "light" ? "blackAlpha" : undefined}
						onClick={nav("/home")}
						aria-label="home"
					/>
				</Tooltip>
				<Tooltip label="카운터">
					<IconButton
						fontSize="1.125rem"
						isRound
						icon={<ImListNumbered />}
						colorScheme={colorMode === "light" ? "blackAlpha" : undefined}
						onClick={nav("/counter")}
						aria-label="counter"
					/>
				</Tooltip>

				{isAdmin ? (
					<>
						<Tooltip label="멀티뷰">
							<IconButton
								fontSize="1.125rem"
								isRound
								icon={<GrMultiple />}
								colorScheme={colorMode === "light" ? "blackAlpha" : undefined}
								onClick={() => {
									window.open("/multiview", "_blank");
								}}
								aria-label="multiview"
							/>
						</Tooltip>
					</>
				) : null}
				<Tooltip label="사이트 설명">
					<IconButton
						fontSize="1.125rem"
						isRound
						icon={<MdQuestionMark />}
						colorScheme={colorMode === "light" ? "blackAlpha" : undefined}
						onClick={nav("/about")}
						aria-label="about"
					/>
				</Tooltip>
				{isAdmin ? (
					<Tooltip label="관리자">
						<IconButton
							fontSize="1.125rem"
							isRound
							icon={<MdSettings />}
							colorScheme={colorMode === "light" ? "blackAlpha" : undefined}
							onClick={nav("/admin")}
							aria-label="admin"
						/>
					</Tooltip>
				) : null}
				<Divider orientation="vertical" height="32px" margin="4px" />
				<Tooltip label="새로고침">
					<Button
						fontSize="1.125rem"
						borderRadius={"full"}
						padding="0"
						colorScheme={colorMode === "light" ? "blackAlpha" : undefined}
						onClick={handleReload}
						aria-label="reload"
						isLoading={isStellarLoading}
					>
						<IoReload />
					</Button>
				</Tooltip>
				<Tooltip label="축하 글쓰러 가기">
					<Button
						fontSize="1.125rem"
						borderRadius={"full"}
						padding="0"
						colorScheme={colorMode === "light" ? "blackAlpha" : undefined}
						aria-label="write_"
						onClick={(e) => {
							window.open(CAFE_WRITE_URL);
						}}
					>
						<MdCreate />
					</Button>
				</Tooltip>
				{import.meta.env.DEV ? (
					<IconButton
						fontSize="1.125rem"
						isRound
						onClick={toggleColorMode}
						colorScheme={colorMode === "light" ? "blackAlpha" : undefined}
						icon={colorMode === "light" ? <MdLightMode /> : <MdDarkMode />}
						aria-label="color-mode"
					/>
				) : null}
				{timeGap > 30 && timeGap < 12345678900 ? (
					<Text position="absolute" right="2px" bottom="2px" fontSize="0.75rem" color="gray.500">
						{timeText} 데이터
					</Text>
				) : null}
			</Header>
			<Container>
				<Outlet />
			</Container>
			<Footer />
		</Stack>
	);
}

export default App;

