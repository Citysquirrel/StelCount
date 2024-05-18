import { Header } from "./components/Header";
import { css } from "@emotion/react";
import { Outlet } from "react-router-dom";
import { useNavigateEvent } from "./lib/hooks/useNavigateEvent";
import { Container } from "./components/Container";
import { Footer } from "./components/Footer";
import { useStellar } from "./lib/hooks/useStellar";
import { Button, HStack, Heading, Stack, Text, useColorMode } from "@chakra-ui/react";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import { useRecoilState } from "recoil";
import { isLoadingState, isLoginState, isServerErrorState } from "./lib/Atom";
import { ServerErrorPage } from "./pages/ServerError";
import { Loading } from "./components/Loading";

function App() {
	const nav = useNavigateEvent();
	const { colorMode, toggleColorMode } = useColorMode();
	const [isLoading] = useRecoilState(isLoadingState);
	const [isServerError] = useRecoilState(isServerErrorState);
	useStellar();
	if (isServerError) return <ServerErrorPage />;
	return (
		<>
			{isLoading ? <Loading /> : null}
			<Header>
				<Text fontSize="2xl" marginRight="8px">
					제목이 들어갈 란
				</Text>
				<Button as="button" onClick={nav("/")}>
					Home
				</Button>
				<Button as="button" onClick={nav("/counter")}>
					Counter
				</Button>
				<Button as="button" onClick={nav("/video-count")}>
					Video
				</Button>
				{import.meta.env.DEV ? (
					<Button as="button" onClick={nav("/admin")}>
						ADMIN
					</Button>
				) : null}

				{/* <Button
					wrapperCss={css`
						display: none;
						margin-inline-start: auto;
					`}
				>
					TEST
				</Button> */}
				<Button
					css={css`
						margin-inline-start: auto;
						font-size: 1.25rem;
						padding: 0;
						border-radius: 99px;
					`}
					onClick={toggleColorMode}
				>
					{colorMode === "light" ? <MdLightMode /> : <MdDarkMode />}
				</Button>
			</Header>
			<Container>
				<Outlet />
			</Container>
			<Footer />
		</>
	);
}

export default App;

