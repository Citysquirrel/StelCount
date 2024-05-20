import { Header } from "./components/Header";
import { css } from "@emotion/react";
import { Outlet, useNavigate } from "react-router-dom";
import { useNavigateEvent } from "./lib/hooks/useNavigateEvent";
import { Container } from "./components/Container";
import { Footer } from "./components/Footer";
import { useStellar } from "./lib/hooks/useStellar";
import { Button, Divider, HStack, Heading, IconButton, Stack, Text, Tooltip, useColorMode } from "@chakra-ui/react";
import { MdDarkMode, MdLightMode, MdOndemandVideo, MdSettings } from "react-icons/md";
import { useRecoilState } from "recoil";
import { isLoadingState, isLoginState, isServerErrorState, isStellarLoadingState } from "./lib/Atom";
import { ServerErrorPage } from "./pages/ServerError";
import { Loading } from "./components/Loading";
import { ImListNumbered } from "react-icons/im";
import { IoReload } from "react-icons/io5";

function App() {
	const nav = useNavigateEvent();
	const { colorMode, toggleColorMode } = useColorMode();
	const [isLoading] = useRecoilState(isLoadingState);
	const [isStellarLoading] = useRecoilState(isStellarLoadingState);
	const [isServerError] = useRecoilState(isServerErrorState);
	const { refetch } = useStellar();

	const handleReload = () => {
		refetch(true);
	};

	if (isServerError) return <ServerErrorPage />;
	return (
		<Stack>
			{isLoading ? <Loading /> : null}
			<Header>
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
				{import.meta.env.DEV ? (
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

				{/* <Button
					wrapperCss={css`
						display: none;
						margin-inline-start: auto;
					`}
				>
					TEST
				</Button> */}
				<IconButton
					fontSize="1.125rem"
					isRound
					onClick={toggleColorMode}
					colorScheme={colorMode === "light" ? "blackAlpha" : undefined}
					icon={colorMode === "light" ? <MdLightMode /> : <MdDarkMode />}
					aria-label="color-mode"
				/>
			</Header>
			<Container>
				<Outlet />
			</Container>
			<Footer />
		</Stack>
	);
}

export default App;

