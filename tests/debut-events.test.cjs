const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const ts = require("typescript");

function load(name, dependencies = {}) {
	const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, `../src/lib/functions/${name}.ts`), "utf8"), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
	}).outputText;
	const exported = {};
	vm.runInNewContext(compiled, { exports: exported, require: (id) => dependencies[id] || require(id) });
	return exported;
}
const { selectDebutEvents, debutPvSegment } = load("debut", { "./date": load("date") });
const debutAt = Date.parse("2026-11-01T19:00:00+09:00");
const day = 86400000;
const profile = (fields = {}) => ({ uuid: "new-member", name: "새 멤버", debut: "2026-11-01T19:00:00.000Z", ...fields });
const song = (vi, fields = {}) => ({ vi, tl: vi, pa: (debutAt - day) / 1000, ...fields });
const member = (ym, fields = {}) => ({ uid: "new-member", ym, ...fields });

test("데뷔 PV는 멤버별 고정 구간을 사용하며 전체 이름·이름만·공백 차이를 인식한다", () => {
	for (const [name, start, end] of [["시즈키 토아", 10, 20], ["코가네 랑", 21, 31], ["하나요 히요리", 32, 42], ["토키노 메리", 43, 53]]) {
		for (const alias of [name, name.replaceAll(" ", ""), name.split(" ").at(-1)]) {
			const pv = debutPvSegment(alias);
			assert.equal(pv.videoId, "tlCeLkw8Upc");
			assert.equal(pv.start, start);
			assert.equal(pv.end, end);
		}
	}
	assert.equal(debutPvSegment(undefined, "토아").start, 10);
	assert.equal(debutPvSegment("다른 멤버"), undefined);
	assert.equal(debutPvSegment(""), undefined);
});

test("current에 없는 비활성 신규 멤버도 multiview 정보만으로 안내하고 사전 노출 기간을 제한하지 않는다", () => {
	const result = selectDebutEvents([profile()], [], debutAt - 60 * day);
	assert.equal(result.length, 1);
	assert.equal(result[0].profile.name, "새 멤버");
	assert.equal(result[0].member, undefined);
	assert.equal(result[0].video, undefined);
	assert.equal(result[0].debutAt, debutAt);
});

test("기존 KST 저장 형식으로 데뷔 후 7일 경계를 계산하고 누락·오류 날짜를 제외한다", () => {
	assert.equal(selectDebutEvents([profile()], [], debutAt + 7 * day - 1).length, 1);
	assert.equal(selectDebutEvents([profile()], [], debutAt + 7 * day).length, 0);
	for (const debut of [undefined, null, "", "invalid", "0000-00-00T00:00:00.000Z"]) {
		assert.equal(selectDebutEvents([profile({ debut })], [], debutAt).length, 0);
	}
});

test("영상이 도착하면 UUID로 연결하고 이름이 같은 다른 멤버 영상은 연결하지 않는다", () => {
	const profiles = [profile()];
	assert.equal(selectDebutEvents(profiles, [member([song("wrong")], { uid: "other", n: "새 멤버" })], debutAt)[0].video, undefined);
	const video = song("first-song");
	const result = selectDebutEvents(profiles, [member([video])], debutAt);
	assert.equal(result[0].video, video);
	assert.equal(result[0].profile, profiles[0]);
});

test("게시·최초공개 예정 시각으로 첫 노래를 고르고 배열 순서나 예정 영상 등록 시각에 영향받지 않는다", () => {
	const first = song("first", { pa: (debutAt - 3 * day) / 1000 });
	const scheduled = song("scheduled", { pa: (debutAt - 10 * day) / 1000, lbc: "upcoming", sst: (debutAt - day) / 1000 });
	const videos = [scheduled, song("later"), first];
	assert.equal(selectDebutEvents([profile()], [member(videos)], debutAt - 4 * day)[0].video, first);
	assert.equal(videos[0], scheduled);
	assert.equal(selectDebutEvents([profile()], [member([scheduled])], debutAt - 4 * day)[0].video, scheduled);
});

test("비활성·다시보기·시각 없는 영상과 이벤트 종료 이후의 노래는 제외한다", () => {
	const videos = [song("hidden", { ia: false }), song("replay", { t: "replay" }), song("unknown", { pa: undefined }), song("late", { pa: (debutAt + 7 * day) / 1000 })];
	assert.equal(selectDebutEvents([profile()], [member(videos)], debutAt)[0].video, undefined);
});

test("동시 데뷔 멤버를 모두 유지하고 같은 UUID는 중복 노출하지 않는다", () => {
	const profiles = [profile({ uuid: "b" }), profile({ uuid: "a" }), profile({ uuid: "a" })];
	const result = selectDebutEvents(profiles, [], debutAt);
	assert.deepEqual(Array.from(result, ({ profile }) => profile.uuid), ["a", "b"]);
});

test("타임라인은 API 응답 순서·이름·UUID와 관계없이 DB 데뷔 시각 오름차순으로 정렬한다", () => {
	const profiles = [
		profile({ uuid: "a", debut: "2026-11-02T19:00:00.000Z" }),
		profile({ uuid: "z", debut: "2026-11-01T20:00:00.000Z" }),
		profile({ uuid: "b", debut: "2026-11-01T19:00:00.000Z" }),
	];
	const result = selectDebutEvents(profiles, [], debutAt - day);
	assert.deepEqual(Array.from(result, ({ profile }) => profile.uuid), ["b", "z", "a"]);
	assert.equal(profiles[0].uuid, "a");
});

test("current 로딩·오류 중에도 multiview의 데뷔 안내를 렌더링한다", () => {
	const source = ts.createSourceFile("Home.tsx", fs.readFileSync(path.join(__dirname, "../src/pages/v2/Home.tsx"), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
	const component = source.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "Home");
	const compiled = ts.transpileModule(component.getText(source), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
	}).outputText;
	for (const status of ["loading", "error"]) {
		const exported = {};
		let shown;
		vm.runInNewContext(compiled, {
			exports: exported, require,
			useEffect: React.useEffect, useMemo: React.useMemo, useState: () => [debutAt - day, () => {}],
			useOutletContext: () => ({ videos: { isPending: status === "loading", isError: status === "error", refetch() {} }, live: { data: [profile()] } }),
			selectHomeVideos: () => ({ hero: [] }), selectDebutEvents,
			ObservatoryExplore: () => null,
			HomeDebutHero: ({ events }) => { shown = events; return React.createElement("h1", null, events[0].profile.name); },
			HomeState: ({ title }) => React.createElement("p", null, title),
		});
		const html = renderToStaticMarkup(React.createElement(exported.default));
		assert.match(html, /새 멤버/);
		assert.equal(shown[0].video, undefined);
		assert.match(html, status === "loading" ? /영상 정보를 불러오고 있어요/ : /영상 정보를 불러오지 못했어요/);
	}
});
