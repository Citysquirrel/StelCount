import { Image, Stack, StackProps } from "@chakra-ui/react";
import useColorModeValues from "../lib/hooks/useColorModeValues";

export function Loading({ options }: LoadingProps) {
	const values = useColorModeValues();
	return (
		<Stack
			sx={{
				position: "fixed",
				left: 0,
				top: 0,
				width: "100vw",
				height: "100vh",
				alignItems: "center",
				backgroundColor: options?.mode === "fullscreen" ? values.background : values.bgOpacity,
				justifyContent: "center",
				zIndex: 1001,
				"> img": {
					boxSize: "128px",
					animation: "rotate 1s ease infinite",
					transformOrigin: "50% 50%",
				},
			}}
		>
			<Image src={"/images/load_donut.png"} />
		</Stack>
	);
}

export function LoadingCircle({ sx, ...props }: StackProps) {
	return (
		<Stack
			sx={{
				width: "32px",
				height: "32px",
				alignItems: "center",
				justifyContent: "center",
				"> svg": {
					boxSize: "32px",
					animation: "rotate 1s ease infinite",
					transformOrigin: "50% 50%",
				},
				...sx,
			}}
			{...props}
		>
			<svg
				width="100"
				height="100"
				viewBox="0 0 100 100"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				stroke="#3498db"
				strokeWidth="10"
			>
				<circle cx="50" cy="50" r="40" strokeOpacity="0.3" />
				<circle
					cx="50"
					cy="50"
					r="40"
					strokeDasharray="62.83185307179586 62.83185307179586"
					strokeDashoffset="62.83185307179586"
				/>
			</svg>
		</Stack>
	);
}

export function LoadingThreeDot({ sx, ...props }: StackProps) {
	return (
		<Stack
			sx={{
				width: "32px",
				height: "32px",
				alignItems: "center",
				justifyContent: "center",
				"> svg": {
					boxSize: "32px",
				},
				...sx,
			}}
			{...props}
		>
			<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="#000">
				<circle cx="25" cy="50" r="10">
					<animate attributeName="cy" begin="0s" dur="0.6s" values="50;30;50" repeatCount="indefinite" />
				</circle>
				<circle cx="50" cy="50" r="10">
					<animate attributeName="cy" begin="0.2s" dur="0.6s" values="50;30;50" repeatCount="indefinite" />
				</circle>
				<circle cx="75" cy="50" r="10">
					<animate attributeName="cy" begin="0.4s" dur="0.6s" values="50;30;50" repeatCount="indefinite" />
				</circle>
			</svg>
		</Stack>
	);
}

export function LoadingAtCorner() {
	return (
		<Stack
			sx={{
				position: "fixed",
				right: "8px",
				top: "8px",
				width: "32px",
				height: "32px",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 1001,
				"> svg": {
					boxSize: "32px",
					animation: "rotate 1s ease infinite",
					transformOrigin: "50% 50%",
				},
			}}
		>
			<svg
				width="100"
				height="100"
				viewBox="0 0 100 100"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				stroke="#3498db"
				strokeWidth="10"
			>
				<circle cx="50" cy="50" r="40" strokeOpacity="0.3" />
				<circle
					cx="50"
					cy="50"
					r="40"
					strokeDasharray="62.83185307179586 62.83185307179586"
					strokeDashoffset="62.83185307179586"
				/>
			</svg>
		</Stack>
	);
}

interface LoadingProps {
	options?: { mode?: "overlay" | "fullscreen" };
}
