const symbolNames: Record<string, string> = {
	스텔라이브: "stellive",
	"아이리 칸나": "kanna",
	"아야츠노 유니": "yuni",
	"아라하시 타비": "tabi",
	"네네코 마시로": "mashiro",
	"아카네 리제": "lize",
	"시라유키 히나": "hina",
	"텐코 시부키": "shibuki",
	"아오쿠모 린": "rin",
	"유즈하 리코": "riko",
	"하나코 나나": "nana",
	"사키하네 후야": "huya",
	"코가네 랑": "rang",
	"시즈키 토아": "toa",
	"하나요 히요리": "hiyori",
	"토키노 메리": "mary",
};

// 파일명만 수집하고 public 에셋은 루트 URL로 참조한다.
const symbolPaths = Object.keys(import.meta.glob("/public/images/symbol/symbol_*.{svg,png,webp,avif,jpg,jpeg,gif}"));
const symbols = new Map<string, { version: number; url: string }>();
for (const path of symbolPaths) {
	const match = path.match(/\/symbol_([a-z]+)(?:_v(\d+))?\.[^.]+$/);
	if (!match) continue;
	const [, name, suffix] = match;
	const version = suffix ? Number(suffix) : 1;
	if (!symbols.has(name) || version > symbols.get(name)!.version) {
		symbols.set(name, { version, url: path.replace(/^\/public\//, "/") });
	}
}

export function stellarSymbol(name: string) {
	return symbols.get(symbolNames[name])?.url;
}

export function stellarSymbolOpacity(name: string, opacity: number) {
	const needsContrast = symbolNames[name] === "lize" || symbolNames[name] === "mashiro" || symbolNames[name] === "toa";
	return Math.min(1, opacity * (needsContrast ? 2.5 : 1));
}

