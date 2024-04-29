import { Header } from "./components/Header";
import { css } from "@emotion/react";
import { Outlet } from "react-router-dom";
import { useNavigateEvent } from "./lib/hooks/useNavigateEvent";
import { Container } from "./components/Container";
import { Footer } from "./components/Footer";
import { useStellar } from "./lib/hooks/useStellar";
import { Button, Stack, useColorMode } from "@chakra-ui/react";

function App() {
	const nav = useNavigateEvent();
	const { toggleColorMode } = useColorMode();
	useStellar();
	return (
		<>
			<Header>
				<Stack alignItems={"center"} fontSize="1.15rem" marginRight="8px" height="40px">
					유튜브 카운터
				</Stack>
				<Button as="button" onClick={nav("/")}>
					Home
				</Button>
				<Button as="button" onClick={nav("/counter")}>
					Counter
				</Button>
				<Button as="button" onClick={nav("/admin")}>
					ADMIN
				</Button>
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
					`}
					onClick={toggleColorMode}
				>
					ㅇㅅㅇ
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

