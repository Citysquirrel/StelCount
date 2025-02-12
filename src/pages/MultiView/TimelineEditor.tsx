//TODO: 타임라인 기록하는 에디터. 표 형식으로 디자인.
//TODO: 표의 첫번째 칸에는 각각의 시간을 찍어 표시. 두번째 칸에는 원하는 텍스트를 기입.
//TODO: 표의 하나의 줄은 줄바꿈하지 않은 한 줄의 텍스트이며, 칸 사이는 빈 칸으로 구분됨.
//TODO: 미리보기를 원본 형식으로 제공. 추출 후 붙여넣을 수 있도록 클립보드 제어.
//TODO: 시간 칸은 초 단위로 가감할 수 있도록 기능 구성.
//TODO: 본 에디터는 새 창으로 작동할 것임.
//TODO: 변경 사항은 로컬 스토리지에 원본 형식으로 저장

export function TimelineEditor() {
	return <></>;
}

interface Temp {
	timeline: string; // (hh)hh:mm:ss 형식.
	text: string;
}
