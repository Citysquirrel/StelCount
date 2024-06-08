const NAME_KANNA = "아이리 칸나";
const NAME_YUNI = "아야츠노 유니";
const NAME_TABI = "아라하시 타비";
const NAME_MASHIRO = "네네코 마시로";
const NAME_HINA = "시라유키 히나";
const NAME_LIZE = "아카네 리제";

const USER_SETTING_STORAGE = "user-setting";
const CAFE_WRITE_URL = "https://cafe.naver.com/ca-fe/cafes/29424353/menus/195/articles/write?boardType=L";
const TOAST_MESSAGE = {
	create: (target: string) => `새 ${target} 등록을 완료했습니다`,
	update: (target: string) => `${target} 수정을 완료했습니다`,
	edit: (target: string) => `${target} 수정을 완료했습니다`,
	delete: (target: string) => `${target} 삭제를 완료했습니다`,
	read: (target: string) => `${target} 데이터를 새로 불러왔습니다`,
	get: (target: string) => `${target} 데이터를 새로 불러왔습니다`,
};

const stellarGroupName = [
	["스텔라이브", "StelLive"],
	["미스틱", "Mystic"],
	["유니버스", "Universe"],
	["클리셰", "Cliché"],
	["미분류", "Unclassified"],
	["미분류", "Unclassified"],
	["미분류", "Unclassified"],
	["미분류", "Unclassified"],
	["미분류", "Unclassified"],
];

export {
	NAME_KANNA,
	NAME_YUNI,
	NAME_TABI,
	NAME_MASHIRO,
	NAME_HINA,
	NAME_LIZE,
	USER_SETTING_STORAGE,
	CAFE_WRITE_URL,
	stellarGroupName,
	TOAST_MESSAGE,
};
