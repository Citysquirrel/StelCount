import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

const root = path.resolve(__dirname, "..");
const homeSource = ts.createSourceFile(
	"homeV2.ts",
	fs.readFileSync(path.join(root, "src/lib/functions/homeV2.ts"), "utf8"),
	ts.ScriptTarget.Latest,
	true,
);
const source = homeSource.statements
	.filter((node) => !ts.isImportDeclaration(node))
	.map((node) => node.getFullText(homeSource))
	.join("\n");
const existing = ts.createSourceFile(
	"etc.ts",
	fs.readFileSync(path.join(root, "src/lib/functions/etc.ts"), "utf8"),
	ts.ScriptTarget.Latest,
	true,
);
const unitFilter = existing.statements
	.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "sortStatsByUnit")
	.getText(existing);
const compiled = ts.transpileModule(`${unitFilter}\n${source}`, {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exported = {};
// 실제 프로젝트의 달성 단위 필터와 선택 함수를 같은 VM에서 검증한다.
vm.runInNewContext(compiled, { exports: exported, Intl, Date, Map, Number });
const { selectHomeVideos, homeCount, homeDate } = exported;
const now = Date.UTC(2026, 9, 11, 3);
const seconds = now / 1000;
const day = 86400;
const video = (vi, fields = {}) => ({
	vi,
	tl: vi,
	ci: "channel",
	lbc: "none",
	st: [],
	dt: [],
	mp: -1,
	mpm: -1,
	...fields,
});
const member = (ym) => ({ uid: "member", n: "멤버", ym });
const select = (ym) => selectHomeVideos([member(ym)], now);
const ids = (items) => Array.from(items, (item) => item.video.vi);

test("최초공개가 없어도 최신 영상과 달성 영상으로 히어로를 구성한다", () => {
	const result = select([
		video("release", { pa: seconds - day }),
		video("record", { pa: seconds - 100 * day, st: [{ u: "1000000", v: "1000100", at: seconds - 10 }] }),
	]);
	assert.deepEqual(ids(result.hero), ["record", "release"]);
});

test("최초공개 중, 예정, 일반 이벤트 순으로 배치한다", () => {
	const result = select([
		video("release", { pa: seconds - 1 }),
		video("later", { lbc: "upcoming", sst: seconds + 3600 }),
		video("live", { lbc: "live", sst: seconds - 100 }),
		video("soon", { lbc: "upcoming", sst: seconds + 100 }),
	]);
	assert.deepEqual(ids(result.hero), ["live", "soon", "later", "release"]);
	assert.deepEqual(ids(result.recent), ["release"]);
});

test("동일 영상은 히어로에서 합치고 새 영상·달성 배지를 함께 유지한다", () => {
	const song = video("both", { pa: seconds - day, st: [{ u: "100000", at: seconds - 20 }] });
	const result = selectHomeVideos([member([song]), { ...member([song]), uid: "collaborator" }], now);
	assert.equal(result.hero.length, 1);
	assert.deepEqual(Array.from(result.hero[0].labels), ["새 영상", "조회수 달성"]);
});

test("갱신 시각이 아닌 실제 달성 시각으로 기간과 순서를 판단한다", () => {
	const result = select([
		video("old", { st: [{ u: "100000", at: seconds - 6 * day, ua: seconds }] }),
		video("valid", { st: [{ u: "100000", at: seconds - day, ua: seconds - 10 * day }] }),
	]);
	assert.deepEqual(ids(result.milestones), ["valid"]);
});

test("본편과 연결 영상의 기록·조회수·출처를 분리한다", () => {
	const result = select([
		video("main", {
			vc: "150001",
			st: [{ u: "150000", at: seconds - 100 }],
			dt: [{ t: "music", vi: "music-id", vc: "50001", st: [{ u: "50000", at: seconds - 10 }] }],
		}),
	]);
	assert.equal(result.milestones.length, 2);
	assert.equal(result.milestones[0].milestone.videoId, "music-id");
	assert.equal(result.milestones[0].milestone.views, "50001");
	assert.equal(result.milestones[1].milestone.source, "Main");
	assert.equal(result.hero.length, 1);
	assert.equal(result.hero[0].milestone.source, "music");
});

test("60일·5일 경계는 포함하고 미래 기록과 비활성 영상은 제외한다", () => {
	const result = select([
		video("boundary", { pa: seconds - 60 * day, st: [{ u: "50000", at: seconds - 5 * day }] }),
		video("expired", { pa: seconds - 60 * day - 1, st: [{ u: "50000", at: seconds - 5 * day - 1 }] }),
		video("future", { pa: seconds + 1, st: [{ u: "50000", at: seconds + 1 }] }),
		video("inactive", { ia: false, pa: seconds - 1 }),
	]);
	assert.deepEqual(ids(result.hero), ["boundary"]);
});

test("일반 영상 목록은 게시일로, 히어로는 최신 이벤트로 정렬한다", () => {
	const result = select([
		video("older", { pa: seconds - 2 * day, st: [{ u: "50000", at: seconds - 1 }] }),
		video("newer", { pa: seconds - day }),
	]);
	assert.deepEqual(ids(result.recent), ["newer", "older"]);
	assert.deepEqual(ids(result.hero), ["older", "newer"]);
});

test("각 목록과 히어로는 최대 20개이고 입력 객체를 변경하지 않는다", () => {
	const input = Array.from({ length: 25 }, (_, i) =>
		video(`v${i}`, { pa: seconds - i, st: [{ u: "100000", at: seconds - i }] }),
	);
	const before = JSON.stringify(input);
	const result = select(input);
	assert.equal(result.recent.length, 20);
	assert.equal(result.milestones.length, 20);
	assert.equal(result.hero.length, 20);
	assert.equal(JSON.stringify(input), before);
});

test("정상 0건과 기간 밖의 영상에는 빈 목록을 반환한다", () => {
	assert.equal(select([]).hero.length, 0);
	assert.equal(select([video("old", { pa: seconds - 100 * day })]).hero.length, 0);
});

test("0회와 집계 대기를 구분하고 날짜는 KST로 표시한다", () => {
	assert.equal(homeCount("0"), "0회");
	assert.equal(homeCount(undefined), "집계 대기");
	assert.equal(homeCount("invalid"), "집계 대기");
	assert.match(homeDate(seconds), /12:00.*KST/);
});

