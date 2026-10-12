const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

const compile = (file) => ts.transpileModule(fs.readFileSync(path.join(__dirname, `../src/lib/functions/${file}.ts`), "utf8"), {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const searchExports = {};
vm.runInNewContext(compile("search"), { exports: searchExports });
const exported = {};
vm.runInNewContext(compile("counterV2"), { exports: exported, require: (name) => name === "./search" ? searchExports : require(name) });
const { counterValue, counterGoal, counterGroupLabel, counterChannels, counterCategoryTagIds, selectCounterVideos } = exported;
const video = (vi, fields = {}) => ({ vi, tl: vi, dt: [], st: [], ...fields });
const tagCatalog = [{ i: 1, n: "커버", icv: true }, { i: 3, n: "오리지널", io: true }];
const select = (videos, filters = {}, catalog = tagCatalog) => Array.from(selectCounterVideos(videos, { query: "", kind: "all", tags: [], sort: "newest", ...filters }, counterCategoryTagIds(catalog)), (item) => item.vi);

test("빈 값과 잘못된 수치는 숨기고 실제 0은 유지한다", () => {
	for (const value of [undefined, null, "", " ", "NaN", "-1", "2.5", "Infinity"]) assert.equal(counterValue(value), null);
	assert.equal(counterValue("0"), 0);
	assert.equal(counterValue(" 100 "), 100);
});

test("채널 정보와 수치가 모두 있는 플랫폼만 남기며 뮤직 채널 인덱스를 보존한다", () => {
	const channels = counterChannels({ yi: "main,,music,missing", ycu: ",@music-two", ysc: "0,123,456," });
	assert.deepEqual(Array.from(channels, (channel) => [channel.id, channel.handle, channel.count, channel.index]), [["main", "", 0, 0], ["", "@music-two", 123, 1], ["music", "", 456, 2]]);
	assert.equal(counterChannels({ yi: "", ysc: "12" }).length, 0);
});

test("화면 목표는 10만·100만·1000만 경계마다 단위를 키운다", () => {
	for (const [count, target] of [[0, 10000], [9999, 10000], [10000, 20000], [99999, 100000], [100000, 200000], [100001, 200000], [999999, 1000000], [1000000, 2000000], [9999999, 10000000], [10000000, 20000000], [100000000, 200000000]]) {
		const goal = counterGoal(String(count));
		assert.equal(goal.target, target);
		assert.equal(goal.remaining, target - count);
	}
});

test("그룹은 영문명과 기수를 표시하고 누락된 필드는 기존 이름으로 대체한다", () => {
	assert.equal(counterGroupLabel({ n: "미스틱", en: " Mystic ", nur: "1", so: 1 }), "1기 · Mystic");
	assert.equal(counterGroupLabel({ n: "유니버스", en: "Universe", nur: "2기", so: 2 }), "2기 · Universe");
	assert.equal(counterGroupLabel({ n: "그룹", en: " ", nur: "3", so: 3 }), "3기 · 그룹");
	assert.equal(counterGroupLabel({ n: "그룹", en: null, nur: null, so: 0 }), "그룹");
	assert.equal(counterGroupLabel({ n: "", so: 0 }), "미분류");
});

test("목표 정렬도 화면의 큰 목표 단위를 사용한다", () => {
	const items = [video("above", { vc: "109999" }), video("below", { vc: "99000" })];
	assert.deepEqual(select(items, { sort: "remaining-asc" }), ["below", "above"]);
	assert.deepEqual(select(items, { sort: "remaining-desc" }), ["above", "below"]);
});

test("남은 조회수 정렬은 본편만 사용하고 최초공개와 미집계는 양방향 모두 마지막이다", () => {
	const items = [video("near", { vc: "9999", pa: 2, dt: [{ vc: "9000000" }] }), video("far", { vc: "10001", pa: 1 }), video("waiting", { pa: 3 }), video("live", { vc: "9999", lbc: "live", pa: 4 }), video("upcoming", { vc: "0", lbc: "upcoming", pa: 5 })];
	assert.deepEqual(select(items, { sort: "remaining-asc" }), ["near", "far", "upcoming", "live", "waiting"]);
	assert.deepEqual(select(items, { sort: "remaining-desc" }), ["far", "near", "upcoming", "live", "waiting"]);
});

test("남은 조회수 동률은 최신순이며 모든 결과를 유지한다", () => {
	const items = Array.from({ length: 120 }, (_, index) => video(String(index), { vc: "9999", pa: index }));
	const result = select(items, { sort: "remaining-asc" });
	assert.equal(result.length, 120);
	assert.equal(result[0], "119");
	assert.equal(result[119], "0");
});

test("제목·별칭 검색, 명시적 Cover, 다중 태그 AND를 함께 적용한다", () => {
	const cover = { i: 1, n: "커버", icv: true };
	const live = { i: 2, n: "라이브", icv: false };
	const items = [video("match", { tl: "Song", ta: "별의 노래", tg: [cover, live] }), video("partial", { tl: "Song", tg: [cover] }), video("untagged", { tl: "Song" }), video("hidden", { tl: "Song", tg: [cover, live], ia: false })];
	assert.deepEqual(select(items, { query: " SONG ", kind: "cover", tags: ["id:1", "id:2"] }), ["match"]);
	assert.deepEqual(select(items, { query: "별의" }), ["match"]);
	assert.deepEqual(select(items, { kind: "other" }), ["untagged"]);
	assert.deepEqual(select(items, { tags: ["id:999"] }), []);
});

test("대분류는 전체 태그 목록에서 구한 ID와 음악의 연결 태그 ID를 비교한다", () => {
	const catalog = [{ i: 7, n: "커버", icv: true }, { i: 9, n: "오리지널", io: true }];
	const items = [
		video("cover", { tg: [{ i: 7, n: "다른 이름" }] }),
		video("original", { tg: [{ i: 9, n: "다른 이름" }] }),
		video("named-only", { tg: [{ i: 12, n: "오리지널" }] }),
		video("stale", { tg: [{ i: 13, n: "이전 태그", icv: true, io: true }] }),
		video("untagged"),
		video("hidden", { tg: [{ i: 9, n: "오리지널" }], ia: false }),
	];
	assert.deepEqual(select(items, { kind: "cover" }, catalog), ["cover"]);
	assert.deepEqual(select(items, { kind: "original" }, catalog), ["original"]);
	assert.deepEqual(select(items, { kind: "other" }, catalog), ["named-only", "stale", "untagged"]);
});

test("분류 태그 ID 변경을 반영하고 ID 없는 메타데이터는 음악과 매칭하지 않는다", () => {
	const items = [video("before", { tg: [{ i: 9, io: true }] }), video("after", { tg: [{ i: 10 }] }), video("missing", { tg: [{ io: true }] })];
	assert.deepEqual(select(items, { kind: "original" }, [{ i: 9, io: true }]), ["before"]);
	assert.deepEqual(select(items, { kind: "original" }, [{ i: 10, io: true }, { io: true }]), ["after"]);
	assert.deepEqual(select(items, { kind: "original" }, []), []);
});

test("오리지널 대분류에서도 검색·태그 AND·정렬을 함께 적용한다", () => {
	const original = { i: 3, n: "Original" };
	const live = { i: 2, n: "Live", icv: false };
	const items = [
		video("older", { tl: "별의 노래", tg: [original, live], pa: 1 }),
		video("newer", { tl: "별의 노래", tg: [original, live], pa: 2 }),
		video("partial", { tl: "별의 노래", tg: [original], pa: 3 }),
		video("unclassified", { tl: "별의 노래", tg: [live], pa: 4 }),
	];
	assert.deepEqual(select(items, { query: "ㅂㅇㄴㄹ", kind: "original", tags: ["id:3", "id:2"] }), ["newer", "older"]);
	assert.deepEqual(select(items, { query: "qjfdmlshfo", kind: "original", tags: ["id:3", "id:2"], sort: "oldest" }), ["older", "newer"]);
});

test("원제와 별칭을 초성 및 영문 키보드 입력으로 검색한다", () => {
	const items = [video("song", { tl: "별의 노래", ta: "달빛 여행" }), video("other", { tl: "두근두근" })];
	for (const query of ["ㅂㅇㄴㄹ", "ㄷㅂㅇㅎ", "qjfdmlshfo", "ekfqlddugod"]) {
		assert.deepEqual(select(items, { query }), ["song"], query);
	}
});

test("유사도 검색은 오타를 허용하고 띄어쓰기와 대소문자를 정규화한다", () => {
	const items = [video("song", { tl: "Starlight Melody" }), video("other", { tl: "두근두근" })];
	for (const query of ["starligt melody", "STAR LIGHT MELODY", "zzzzzzzz"]) {
		assert.deepEqual(select(items, { query }), query === "zzzzzzzz" ? [] : ["song"], query);
	}
});

test("확장 검색도 태그 AND·분류·선택 정렬을 함께 적용한다", () => {
	const cover = { i: 1, n: "커버", icv: true };
	const live = { i: 2, n: "라이브", icv: false };
	const items = [
		video("older", { tl: "별의 노래", tg: [cover, live], pa: 1 }),
		video("newer", { tl: "별의 노래 Live", tg: [cover, live], pa: 2 }),
		video("partial", { tl: "별의 노래", tg: [cover], pa: 3 }),
		video("other", { tl: "별의 노래", tg: [live], pa: 4 }),
		video("hidden", { tl: "별의 노래", tg: [cover, live], ia: false }),
	];
	assert.deepEqual(select(items, { query: "ㅂㅇㄴㄹ", kind: "cover", tags: ["id:1", "id:2"] }), ["newer", "older"]);
	assert.deepEqual(select(items, { query: "qjfdmlshfo", kind: "cover", tags: ["id:1", "id:2"], sort: "oldest" }), ["older", "newer"]);
});
