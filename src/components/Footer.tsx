import { css } from "@emotion/react";
import Logo from "../assets/logo.png";
import { useState } from "react";
import { FaGithub } from "react-icons/fa6";
import { ImMail4 } from "react-icons/im";

export function Footer() {
	const [isOpen, setIsOpen] = useState(false);
	const handleOpen = () => {
		setIsOpen(true);
	};
	const handleClose = () => {
		setIsOpen(false);
	};
	return (
		<>
			<div
				css={css`
					position: fixed;
					display: flex;
					left: 12px;
					bottom: 12px;
					width: 40px;
					height: 40px;
					border-radius: 99px;
					background-color: ${isOpen ? "transparent" : "rgba(154, 218, 255, 0.75)"};
					align-items: center;
					justify-content: center;
					padding: 0;
					margin: 0;
					transition: all 0.3s;
					user-select: none;
					z-index: 1000;
				`}
				onMouseOver={handleOpen}
				onMouseLeave={handleClose}
			>
				<img
					title="도시다람쥐"
					css={css`
						display: block;
						width: 32px;
						height: 32px;
						border-radius: 99px;
						transition: all 0.3s;
						transform: ${isOpen ? "translateY(6px)" : ""};
						z-index: 1000;
					`}
					src={Logo}
					alt="도시다람쥐"
				/>

				<div
					css={css`
						position: fixed;
						display: flex;
						left: 0;
						bottom: 0;
						max-width: ${isOpen ? 100 : 0}dvw;
						/* width: 50dvw; */
						height: 48px;
						background-color: rgba(154, 218, 255, 0.75);
						border: none;
						outline: none;
						justify-content: center;
						align-items: center;
						transition: all 0.3s;
						transition-timing-function: ease-in-out;
						z-index: 999;
					`}
				>
					<div
						css={css`
							width: 100dvw;
							height: 30px;
							overflow: hidden;
							padding: auto;
						`}
					>
						<a
							href="#"
							target="_blank"
							css={css`
								margin-left: calc(50dvw - 38px);
								margin-right: 24px;
								transition: all 0.25s;
								cursor: pointer;
								:hover {
									color: rgb(13, 13, 13);
								}
							`}
						>
							<FaGithub
								css={css`
									width: 26px;
									height: 26px;
									transform: translateY(2px);
								`}
							/>
						</a>
						<a
							href="mailto:tok1324@naver.com"
							css={css`
								transition: all 0.25s;
								cursor: pointer;
								:hover {
									color: rgb(13, 13, 13);
								}
							`}
						>
							<ImMail4
								css={css`
									width: 26px;
									height: 26px;
									transform: translateY(2px);
								`}
							/>
						</a>
					</div>
				</div>
			</div>
		</>
	);
}
