import { css } from "@emotion/react";
import Logo from "../assets/logo.png";
import { useState } from "react";
import { FaGithub } from "react-icons/fa6";
import { ImMail4 } from "react-icons/im";
import { Box, HStack, Image, Link } from "@chakra-ui/react";

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
			<HStack
				sx={{
					position: "fixed",
					left: "12px",
					bottom: "12px",
					width: "40px",
					height: "40px",
					borderRadius: "99px",
					backgroundColor: `${isOpen ? "transparent" : "rgba(154, 218, 255, 0.75)"}`,
					alignItems: "center",
					justifyContent: "center",
					padding: 0,
					margin: 0,
					transition: "all .3s",
					userSelect: "none",
					zIndex: 1000,
				}}
				onMouseOver={handleOpen}
				onMouseLeave={handleClose}
			>
				<Image
					title="도시다람쥐"
					boxSize={"32px"}
					src={Logo}
					alt="도시다람쥐"
					sx={{
						borderRadius: "99px",
						transition: "all .3s",
						transform: `${isOpen ? "translateY(6px)" : ""}`,
						zIndex: 1000,
					}}
				/>

				<HStack
					sx={{
						position: "fixed",
						left: 0,
						bottom: 0,
						maxWidth: `${isOpen ? 100 : 0}dvw`,
						height: "48px",
						backgroundColor: "rgba(154, 218, 255, 0.75)",
						border: "none",
						outline: "none",
						justifyContent: "center",
						alignItems: "center",
						transition: "all .3s",
						transitionTimingFunction: "ease-in-out",
						zIndex: 999,
					}}
				>
					<Box sx={{ width: "100dvw", height: "30px", overflow: "hidden", padding: "auto" }}>
						<Link
							href="#"
							isExternal
							sx={{
								marginLeft: "calc(50dvw - 38px)",
								marginRight: "24px",
								transition: "all .25s",
								cursor: "pointer",
								":hover": { color: "rgb(13,13,13)" },
							}}
						>
							<FaGithub width="26px" height="26px" transform="translateY(2px)" />
						</Link>
						<Link
							href="mailto:tok1324@naver.com"
							sx={{ transition: "all .25s", cursor: "pointer", ":hover": { color: "rgb(13,13,13)" } }}
						>
							<ImMail4 width="26px" height="26px" transform="translateY(2px)" />
						</Link>
					</Box>
				</HStack>
			</HStack>
		</>
	);
}
