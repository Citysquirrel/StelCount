import { Interpolation, Theme, css } from "@emotion/react";
import { HTMLAttributes } from "react";

interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
	wrapperCss?: Interpolation<Theme>;
}

export function Button({ wrapperCss, children, ...props }: ButtonProps) {
	return (
		<div css={wrapperCss}>
			<button
				css={css`
					user-select: none;
				`}
				{...props}
			>
				{children}
			</button>
		</div>
	);
}
