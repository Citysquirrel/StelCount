import React from "react";

/**
 * 비네팅(Vignette) 효과 컴포넌트 Props
 */
export interface VignetteProps {
	/**
	 * 비네팅에 적용할 색상입니다.
	 * @default '#000000'
	 */
	color?: string;

	/**
	 * 비네팅 효과의 투명도를 조절하는 강도입니다. (0 ~ 1 사이의 값)
	 * @default 0.6
	 */
	intensity?: number;

	/**
	 * 중앙에서부터 효과가 0%인(완전히 투명한) 포커스 영역의 크기입니다.
	 * (예: '40%', '200px' 등 CSS 단위 사용 가능)
	 * @default '40%'
	 */
	focus?: string;

	/**
	 * 포커스 영역 끝에서부터 색상이 최대치로 진해지는 스프레드 지점까지의 거리입니다.
	 * (예: '100%', '80vw' 등 CSS 단위 사용 가능)
	 * @default '100%'
	 */
	spread?: string;

	/**
	 * 비네팅 효과를 적용할 타겟 컨텐츠입니다.
	 * 값이 주어지지 않으면 100vw, 100vh 크기의 전체 화면 비네팅으로 동작합니다.
	 */
	children?: React.ReactNode;

	/**
	 * 외부에서 추가적인 래퍼(Wrapper) 스타일링을 주입할 수 있는 클래스명입니다.
	 */
	className?: string;

	/**
	 * 외부에서 추가적인 래퍼(Wrapper) 스타일링을 주입할 수 있는 인라인 스타일입니다.
	 */
	style?: React.CSSProperties;
}

const Vignette: React.FC<VignetteProps> = ({
	color = "#000000",
	intensity = 0.6,
	focus = "40%",
	spread = "100%",
	children,
	className = "",
	style,
}) => {
	const overlayStyle: React.CSSProperties = {
		position: children ? "absolute" : "fixed",
		top: 0,
		left: 0,
		width: children ? "100%" : "100vw",
		height: children ? "100%" : "100vh",
		pointerEvents: "none",
		zIndex: children ? 10 : 9999,
		opacity: intensity,
		background: `radial-gradient(circle, transparent ${focus}, ${color} ${spread})`,
	};

	if (!children) {
		return <div className={className} style={{ ...overlayStyle, ...style }} aria-hidden="true" />;
	}

	return (
		<div
			className={className}
			style={{
				position: "relative",
				display: "inline-block",
				width: "fit-content",
				height: "fit-content",
				...style,
			}}
		>
			{children}
			<div style={overlayStyle} aria-hidden="true" />
		</div>
	);
};

export default Vignette;
