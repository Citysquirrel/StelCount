const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

const read = (name) => ts.createSourceFile(name, fs.readFileSync(path.join(__dirname, `../src/lib/functions/${name}.ts`), "utf8"), ts.ScriptTarget.Latest, true);
const home = read("homeV2");
const etc = read("etc");
const source = [
	...etc.statements.filter((node) => ts.isFunctionDeclaration(node) && ["sortStatsByUnit", "sortStatsByUnitForBigNews"].includes(node.name?.text)).map((node) => node.getText(etc)),
	...home.statements.filter((node) => !ts.isImportDeclaration(node)).map((node) => node.getText(home)),
].join("\n");
const exported = {};
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: exported });
const { recentMilestone, selectHomeVideos } = exported;
const now = Date.UTC(2026, 9, 12);
const seconds = now / 1000;
const day = 86400;
const record = (u, at, extra = {}) => ({ u, at, v: u, ...extra });
const video = (vi, fields = {}) => ({ vi, tl: vi, dt: [], st: [], ...fields });

test("최근 달성은 5일 경계를 포함하고 만료·미래·잘못된 기록은 제외한다", () => {
	const boundary = record("100000", seconds - 5 * day);
	assert.equal(recentMilestone([boundary], now), boundary);
	assert.equal(recentMilestone([boundary], now + 1), undefined);
	for (const invalid of [record("100000", seconds + 1), record("100000", 0), record("0", seconds), record("-1000000", seconds), record("100000bad", seconds), record("100000", NaN)]) {
		assert.equal(recentMilestone([invalid], now), undefined);
	}
});

test("배열 순서와 갱신 시각에 관계없이 실제 달성 시각의 최신 기록 하나를 고른다", () => {
	const latest = record("200000", seconds - 3600);
	const records = [latest, record("100000", seconds - day, { ua: seconds }), record("150000", seconds - 3600)];
	assert.equal(recentMilestone(records, now), latest);
	assert.equal(records[0], latest);
	assert.equal(recentMilestone([record("100000", seconds - 6 * day, { ua: seconds })], now), undefined);
});

test("기존 달성 단위 필터를 유지하고 서버의 자잘한 단위는 제외한다", () => {
	const milestone = record("100000", seconds - 3600);
	assert.equal(recentMilestone([record("101000", seconds), milestone], now), milestone);
});

test("본편과 연결 영상의 최신 기록을 각각 유지하고 오래된 전체 이력을 노출하지 않는다", () => {
	const main = record("100000", seconds - 3600);
	const detail = record("200000", seconds - 7200);
	const data = selectHomeVideos([{ uid: "member", ym: [video("main", {
		st: [record("50000", seconds - 10 * day), main],
		dt: [{ t: "뮤직비디오", vi: "detail", st: [detail] }],
	})] }], now);
	assert.equal(data.milestones.length, 2);
	assert.equal(data.milestones[0].milestone.record, main);
	assert.equal(data.milestones[1].milestone.record, detail);
	assert.equal(data.milestones[1].milestone.source, "뮤직비디오");
});

test("최초공개 안내는 캐러셀 개수 제한과 무관하게 유지하고 종료·비활성 영상을 제외한다", () => {
	const upcoming = Array.from({ length: 9 }, (_, index) => video(`upcoming-${index}`, { lbc: "upcoming", sst: seconds + index * 3600 }));
	const data = selectHomeVideos([{ uid: "member", ym: [
		...upcoming, video("live", { lbc: "live" }), video("ended", { lbc: "none" }), video("hidden", { lbc: "live", ia: false }),
	] }], now);
	assert.equal(data.hero.length, 8);
	assert.equal(data.premiere.length, 10);
	assert.equal(data.premiere[0].video.vi, "live");
	assert.equal(data.premiere[1].video.vi, "upcoming-0");
	assert.equal(data.milestones.length, 0);
});
