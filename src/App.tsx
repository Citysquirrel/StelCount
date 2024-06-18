import { Header } from "./components/Header";
import { Outlet } from "react-router-dom";
import { useNavigateEvent } from "./lib/hooks/useNavigateEvent";
import { Container } from "./components/Container";
import { Footer } from "./components/Footer";
import { useStellar } from "./lib/hooks/useStellar";
import { Button, Divider, IconButton, Link, Stack, Tooltip, useColorMode } from "@chakra-ui/react";
import { MdCreate, MdDarkMode, MdHome, MdLightMode, MdOndemandVideo, MdQuestionMark, MdSettings } from "react-icons/md";
import { useRecoilState } from "recoil";
import { serverErrorState, isStellarLoadingState, isAdminState, backgroundColorState } from "./lib/Atom";
import { ServerErrorPage } from "./pages/ServerErrorPage";
import { Loading } from "./components/Loading";
import { ImListNumbered } from "react-icons/im";
import { IoReload } from "react-icons/io5";
import { useConsole } from "./lib/hooks/useConsole";
import { useAuth } from "./lib/hooks/useAuth";
import { CAFE_WRITE_URL } from "./lib/constant";

function App() {
	const nav = useNavigateEvent();
	const { colorMode, toggleColorMode } = useColorMode();
	const [isStellarLoading] = useRecoilState(isStellarLoadingState);
	const [serverError] = useRecoilState(serverErrorState);
	const [backgroundColor] = useRecoilState(backgroundColorState);
	const { refetch } = useStellar();
	const { isAdmin, isLoading } = useAuth();

	const handleReload = () => {
		refetch(true);
	};

	useConsole(isAdmin, "isAdmin");

	if (serverError.isError) return <ServerErrorPage />;
	return (
		<Stack backgroundColor={backgroundColor} gap="0" transition="background-color .3s">
			{isLoading ? <Loading /> : null}
			<Header>
				{/* <Tooltip label="메인화면">
					<IconButton
						fontSize="1.125rem"
						isRound
						icon={<MdHome />}
						colorScheme={colorMode === "light" ? "blackAlpha" : undefined}
						onClick={nav("/home")}
						aria-label="home"
					/>
				</Tooltip> */}
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

				{import.meta.env.DEV ? (
					<>
						<Tooltip label="영상모음">
							<IconButton
								fontSize="1.125rem"
								isRound
								icon={<MdOndemandVideo />}
								colorScheme={colorMode === "light" ? "blackAlpha" : undefined}
								onClick={nav("/video")}
								aria-label="video"
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
						as={Link}
						fontSize="1.125rem"
						borderRadius={"full"}
						padding="0"
						colorScheme={colorMode === "light" ? "blackAlpha" : undefined}
						onClick={handleReload}
						aria-label="reload"
						href={CAFE_WRITE_URL}
						isExternal
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
			</Header>
			<Container>
				<Outlet />
			</Container>
			<Footer />
		</Stack>
	);
}

export default App;

