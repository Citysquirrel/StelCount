import { css } from "@emotion/react";
import { HTMLAttributes } from "react";
import { useRecoilState } from "recoil";
import { headerOffsetState } from "../lib/Atom";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {}

export function Container({ children, ...props }: ContainerProps) {
	const [offsetY] = useRecoilState(headerOffsetState);
	return (
		<main
			css={css`
				display: flex;
				flex-direction: column;
				max-width: 100%;
				min-height: 100dvh;
				padding: 0 12px;
			`}
			{...props}
		>
			<div
				className="space"
				css={css`
					height: ${offsetY + 24}px;
				`}
			></div>
			{children}
		</main>
	);
}
