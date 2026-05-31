import { useEffect, useRef } from "react";

const Cursor: React.FC = () => {
	// DOM 요소에 직접 접근하기 위한 ref
	const cursorRef = useRef<SVGSVGElement>(null);

	// 좌표 및 회전 값을 저장하기 위한 ref (리렌더링 방지)
	const coordsRef = useRef({
		targetX: 0, // 마우스의 목표 위치
		targetY: 0,
		currentX: 0, // 별의 현재 위치 (Lerp로 따라감)
		currentY: 0,
		rotation: 0, // 현재 회전 각도
		rotationSpeed: 0, // 현재 회전 속도 (움직임에 비례)
		lastMoveTime: 0, // 마지막 움직임 시간 (멈춤 감지용)
	});

	// 애니메이션 프레임 ID 저장
	const animationFrameIdRef = useRef<number>(0);

	useEffect(() => {
		// 마우스 움직임 이벤트 리스너
		const handleMouseMove = (e: MouseEvent) => {
			const { clientX, clientY } = e;
			coordsRef.current.targetX = clientX;
			coordsRef.current.targetY = clientY;
			coordsRef.current.lastMoveTime = Date.now(); // 움직임 시간 기록
		};

		window.addEventListener("mousemove", handleMouseMove);

		// 💡 핵심: requestAnimationFrame 애니메이션 루프
		const animateCursor = () => {
			const { targetX, targetY, currentX, currentY, rotation, rotationSpeed, lastMoveTime } = coordsRef.current;

			// 1. Lerp (Linear Interpolation)를 이용한 부드러운 위치 추적
			const easeFactorPos = 0.05; // 위치 부드러움 조절
			const nextX = currentX + (targetX - currentX) * easeFactorPos;
			const nextY = currentY + (targetY - currentY) * easeFactorPos;

			// 2. 뱅글뱅글 회전 로직 (관성 감속 추가)
			const timeSinceLastMove = Date.now() - lastMoveTime;
			const isMoving = timeSinceLastMove < 50; // 마지막 움직임 후 50ms 이내면 움직이는 중으로 판단

			// 마우스 속도 계산
			const mouseSpeed = Math.sqrt(Math.pow(targetX - currentX, 2) + Math.pow(targetY - currentY, 2));

			// 목표 회전 속도 결정
			let targetRotationSpeed = 0.5;
			if (isMoving) {
				targetRotationSpeed = mouseSpeed * 0.15; // 움직일 때 속도
			}

			// 회전 속도 lerp (가속 및 감속 모두 부드럽게)
			// 💡 핵심: 감속 계수를 0.1에서 0.02로 낮춰 관성을 대폭 늘림
			// 마우스가 멈추면 targetRotationSpeed는 0이 되지만, 0.02 비율로 감소하므로 더 서서히 멈춥니다.
			let nextRotationSpeed = rotationSpeed + (targetRotationSpeed - rotationSpeed) * 0.02; // 이전 값: 0.1

			// 회전 속도 제한 (너무 빠르면 안되니까)
			nextRotationSpeed = Math.max(-15, Math.min(15, nextRotationSpeed));

			// 현재 회전 각도 업데이트 (부드럽게 누적)
			const nextRotation = rotation + nextRotationSpeed;

			// 3. ref 값 업데이트 (렌더링 없이 값만 변경)
			coordsRef.current.currentX = nextX;
			coordsRef.current.currentY = nextY;
			coordsRef.current.rotation = nextRotation;
			coordsRef.current.rotationSpeed = nextRotationSpeed;

			// 4. 🔥 DOM 직접 업데이트
			if (cursorRef.current) {
				// translate3d를 사용하여 하드웨어 가속 유도
				cursorRef.current.style.transform = `translate3d(-50%, -50%, 0) translate3d(${nextX}px, ${nextY}px, 0) rotate(${nextRotation}deg)`;
			}

			// 다음 프레임 요청
			animationFrameIdRef.current = requestAnimationFrame(animateCursor);
		};

		// 애니메이션 루프 시작
		animateCursor();

		// 클린업 함수
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			if (animationFrameIdRef.current) {
				cancelAnimationFrame(animationFrameIdRef.current);
			}
		};
	}, []);

	// 초기 인라인 스타일 (크기 감소: 너비 30px, 높이 약 36px)
	const cursorStyle: React.CSSProperties = {
		position: "fixed",
		top: 0,
		left: 0,
		width: "30px",
		height: "36px",
		pointerEvents: "none",
		zIndex: 9999,
		willChange: "transform",
		opacity: 0.8, // 💡 글로우가 생겨서 0.8로 살짝 올렸습니다 (은은함 유지)
		filter: "drop-shadow(0px 0px 4px rgba(0, 0, 0, 0.4))",
	};

	return (
		<svg
			ref={cursorRef} // ref 연결
			style={cursorStyle}
			viewBox="0 0 100 100"
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				{/* 구글 스타일 그라데이션 (유지) */}
				<linearGradient id="google-grad" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="25%" stopColor="#857AFF" />
					<stop offset="75%" stopColor="#A8B6FF" />
				</linearGradient>

				{/* 💡 새로운: 은은하게 빛나는 효과를 위한 필터 정의 */}
				<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
					{/* 가우시안 블러로 별 모양을 흐리게 만듦 (stdDeviation이 빛의 크기) */}
					<feGaussianBlur stdDeviation="4" result="coloredBlur" />
					<feMerge>
						{/* 흐릿한 모양 위에 원래 모양을 겹침 */}
						<feMergeNode in="coloredBlur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>

			{/* 얄쌍하고 점대칭인 별 형태의 Path */}
			{/* 💡 핵심: filter="url(#glow)" 속성을 추가하여 빛나는 효과 적용 */}
			<path
				d="M 50 0 C 50 40 60 50 100 50 C 60 50 50 60 50 100 C 50 60 40 50 0 50 C 40 50 50 40 50 0 Z"
				fill="url(#google-grad)"
				filter="url(#glow)"
			/>
		</svg>
	);
};
export default Cursor;
