import { css } from "@emotion/react";
import { useRecoilState } from "recoil";
import { useResponsive } from "../lib/hooks/useResponsive";
import { headerOffsetState } from "../lib/Atom";

interface HeaderProps {
	children?: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
	const [offsetY] = useRecoilState(headerOffsetState);
	const { width } = useResponsive();

	return (
		<header
			css={css`
				position: fixed;
				display: flex;
				top: 0;
				left: 0;
				width: calc(100%);
				align-items: center;
				border-bottom: 1px solid rgba(0, 0, 0, 0.12);
				background-color: rgba(255, 255, 255, 0.5);
				backdrop-filter: blur(1.5px);
				z-index: 999;
			`}
		>
			<div
				css={css`
					width: 100%;
					height: ${offsetY}px;
				`}
			>
				<div
					css={css`
						display: flex;
						max-width: ${width}px;
						max-height: 40px;
						padding: 12px;
						margin-inline: auto;
					`}
				>
					{children}
				</div>
			</div>
		</header>
	);
}
