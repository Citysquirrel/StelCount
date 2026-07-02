import { DateInput } from "../types";

type DateFormatType = "input" | "text" | "date" | "time" | "korean" | "iso";

/**
 * UTC 날짜 문자열을 KST 형식의 문자열로 변환합니다.
 * @param utcString - UTC 날짜 문자열 (예: '2026-06-22T05:17:55.000Z')
 * @param formatType - 반환할 날짜 문자열의 포맷 타입 (기본값: 'text')
 * @returns 포맷팅된 KST 날짜 문자열
 */
export function formatUtcToKst(utcString: string | null | undefined, formatType: DateFormatType = "text"): string {
	// 유효성 검사 (잘못된 날짜 문자열 방지)
	if (!utcString) return "";

	const date = new Date(utcString);
	if (isNaN(date.getTime())) {
		console.error(`Invalid date detected: ${utcString}`);
		return "";
	}

	// KST(UTC+9) 밀리초 계산
	const kstOffset = 9 * 60 * 60 * 1000;
	const kstDate = new Date(date.getTime() + kstOffset);

	// 브라우저 지역 설정과 무관하게 KST 값을 추출
	const year = kstDate.getUTCFullYear();
	const month = String(kstDate.getUTCMonth() + 1).padStart(2, "0");
	const day = String(kstDate.getUTCDate()).padStart(2, "0");
	const hours = String(kstDate.getUTCHours()).padStart(2, "0");
	const minutes = String(kstDate.getUTCMinutes()).padStart(2, "0");
	const seconds = String(kstDate.getUTCSeconds()).padStart(2, "0");

	// 요청된 포맷 타입에 따라 분기 처리
	switch (formatType) {
		case "input":
			// <input type="datetime-local"> 용도
			return `${year}-${month}-${day}T${hours}:${minutes}`;

		case "date":
			// <input type="date"> 용도 또는 날짜만 필요할 때
			return `${year}-${month}-${day}`;

		case "time":
			// <input type="time"> 용도 또는 시간만 필요할 때
			return `${hours}:${minutes}:${seconds}`;

		case "korean":
			// 사용자에게 보여주기 좋은 한국어 표기
			return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분 ${seconds}초`;

		case "iso":
			// KST 타임존 오프셋(+09:00)이 포함된 ISO 8601 포맷
			return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000+09:00`;

		case "text":
		default:
			// 일반적인 데이터베이스 저장용 및 텍스트 표현
			return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	}
}

/**
 * input(datetime-local)의 KST 값을 DB 저장용 UTC(ISO 8601) 문자열로 변환합니다.
 * ! throw Error를 주의: handler 내부에서 사용
 * @param inputValue - input 요소에서 꺼낸 값 (예: '2026-06-22T14:17')
 * @returns DB에 저장할 UTC 형식 문자열 (예: '2026-06-22T05:17:00.000Z')
 */
export function convertKstInputToUtc(inputValue: string): string {
	if (!inputValue) {
		throw new Error("값이 비어있습니다.");
	}

	// input type="datetime-local"은 기본적으로 초를 생략하므로
	// ISO 포맷을 맞추기 위해 초(:00)가 없다면 임의로 붙임
	const hasSeconds = inputValue.split(":").length === 3;
	const timeString = hasSeconds ? inputValue : `${inputValue}:00`;

	// 해당 문자열이 '한국 시간(KST)'임을 브라우저에 강제로 인지시키기 위해 타임존 오프셋(+09:00)을 붙임
	const kstStringWithTimezone = `${timeString}+09:00`;
	// 결과 예시: "2026-06-22T14:17:00+09:00"

	// Date 객체로 생성 (이 시점에서 브라우저 환경과 무관하게 정확한 절대 시간이 생성됨)
	const date = new Date(kstStringWithTimezone);

	if (isNaN(date.getTime())) {
		throw new Error("유효하지 않은 날짜 형식입니다.");
	}

	// UTC 기준의 ISO 8601 문자열로 반환하여 서버로 전송 준비
	return date.toISOString();
}

/**
 * 경과 시간을 사람이 읽기 쉬운 텍스트(상대 시간)로 변환합니다.
 * @param targetDate - 변환할 타겟 시간 (필수)
 * @param referenceDate - 기준이 되는 시간 (선택, 기본값: 현재 시간)
 * @returns '방금 전', 'n분 전', 'n일 전' 등의 문자열
 */
export function elapsedTimeText(targetDate: DateInput, referenceDate: DateInput = new Date()): string {
	// 입력된 다양한 타입을 Date 객체로 변환 후 타임스탬프(ms) 형태로 추출
	const start = new Date(targetDate).getTime();
	const end = new Date(referenceDate).getTime();

	// 유효하지 않은 날짜 처리
	if (Number.isNaN(start) || Number.isNaN(end)) {
		return "";
	}

	const diffInSeconds = Math.floor((end - start) / 1000);

	// 미래 시간이 입력된 경우의 예외 처리 (필요에 따라 수정 가능)
	if (diffInSeconds < 0) {
		return "방금 전";
	}

	// 60초 미만에 대한 처리
	if (diffInSeconds < 60) {
		return "방금 전";
	}

	const times = [
		{ name: "년", seconds: 60 * 60 * 24 * 365 },
		{ name: "개월", seconds: 60 * 60 * 24 * 30 },
		{ name: "일", seconds: 60 * 60 * 24 },
		{ name: "시간", seconds: 60 * 60 },
		{ name: "분", seconds: 60 },
	];

	for (const time of times) {
		const betweenTime = Math.floor(diffInSeconds / time.seconds);
		if (betweenTime > 0) {
			return `${betweenTime}${time.name} 전`;
		}
	}

	return ""; // 논리상 도달하지 않지만 fallback으로 빈 문자열 반환
}
