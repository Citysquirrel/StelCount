import { Header } from "./components/Header";
import { Button } from "./components/Button";
import { css } from "@emotion/react";
import { Outlet } from "react-router-dom";
import { useNavigateEvent } from "./lib/hooks/useNavigateEvent";
import { Container } from "./components/Container";
import { Footer } from "./components/Footer";

function App() {
	const nav = useNavigateEvent();
	return (
		<>
			<Header>
				<div
					css={css`
						display: flex;
						align-items: center;
						font-size: 1.15rem;
						margin-right: 8px;
						height: 40px;
					`}
				>
					유튜브 카운터
				</div>
				<Button onClick={nav("/")}>Home</Button>
				<Button onClick={nav("/counter")}>Counter</Button>
				<Button
					wrapperCss={css`
						display: none;
						margin-inline-start: auto;
					`}
				>
					TEST
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

