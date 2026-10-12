const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const ts = require("typescript");

const compile = (source) => ts.transpileModule(source, {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const read = (file) => fs.readFileSync(path.join(__dirname, "../src", file), "utf8");
const search = {};
vm.runInNewContext(compile(read("lib/functions/search.ts")), { exports: search });
const functions = {};
vm.runInNewContext(compile(read("lib/functions/counterV2.ts")), { exports: functions, require: (name) => name === "./search" ? search : require(name) });
const source = ts.createSourceFile("Counter.tsx", read("pages/v2/Counter.tsx"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const counter = source.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "Counter");
const compiled = compile(counter.getText(source));
const video = (vi, tg) => ({ vi, tl: "별의 노래", tg, dt: [], st: [] });
const member = (uid, ym) => ({ uid, n: uid, ym, gps: [{ n: "그룹", so: 1 }] });

function renderCounter(data, query, catalog = [], queryState = {}) {
	const exported = {};
	const shown = [];
	const buttons = [];
	const requests = [];
	const children = ({ children }) => children;
	const noop = () => {};
	vm.runInNewContext(compiled, {
		exports: exported, require, ...functions, URLSearchParams, USER_SETTING_STORAGE: "settings",
		useOutletContext: () => ({ videos: { data }, live: {} }),
		useSearchParams: () => [new URLSearchParams(`member=selected&${query}`), noop],
		useLocalStorage: () => [{}, noop], useState: () => [0, noop], useEffect: noop, useMemo: (fn) => fn(),
		useServerQuery: (options) => {
			requests.push(options);
			assert.equal(options.version, "v2");
			assert.equal(options.api, "/tags");
			return { data: options.queryOptions.select({ msg: "태그 데이터를 성공적으로 불러왔습니다.", data: catalog }), refetch: noop, ...queryState };
		},
		Flex: children, Box: children, Text: children, Heading: children, Stack: children, Select: children,
		CounterMembers: () => null, CounterProfile: () => null, CounterSearchInput: () => null, MdCheck: () => null,
		ObservatoryButton: (props) => { buttons.push(props); return null; },
		CounterVideo: ({ video }) => { shown.push(video.vi); return null; },
	});
	const markup = renderToStaticMarkup(React.createElement(exported.default));
	return { shown, buttons, requests, markup };
}

test("count 없는 공개 v2 태그 API로 분류 ID를 구하고 current 영상의 태그 ID와 비교한다", () => {
	const catalog = [{ id: 7, name: "Cover", isCover: true, isOriginal: false }, { id: 9, name: "Original", isCover: false, isOriginal: true }];
	const data = [
		member("selected", [video("cover", [{ i: 7, n: "다른 이름" }]), video("original", [{ i: 9, n: "다른 이름" }]), video("other", [{ i: 12, n: "Original", io: true }])]),
	];
	for (const kind of ["cover", "original", "other"]) {
		const { shown, buttons, requests } = renderCounter(data, `kind=${kind}`, catalog);
		assert.deepEqual(shown, [kind]);
		assert.equal(requests.length, 1);
		assert.equal(buttons.filter((button) => ["전체", "커버", "오리지널", "기타·미분류"].includes(button.children)).length, 4);
		assert.ok(buttons.every((button) => !button.isDisabled));
	}
});

test("태그 API 갱신으로 분류 ID가 바뀌면 검색·태그 필터와 함께 새 기준을 적용한다", () => {
	const catalog = (id) => [{ id, name: "Original", isOriginal: true, isCover: false }];
	const data = [
		member("selected", [video("before", [{ i: 9, n: "곡" }, { i: 2, n: "라이브" }]), video("after", [{ i: 10, n: "곡" }, { i: 2, n: "라이브" }])]),
	];
	const query = "kind=original&q=ㅂㅇㄴㄹ&tag=id:2";
	assert.deepEqual(renderCounter(data, query, catalog(9)).shown, ["before"]);
	assert.deepEqual(renderCounter(data, query, catalog(10)).shown, ["after"]);
});

test("태그 조회 중이거나 실패하면 대분류를 잠그고 전체 목록은 유지한다", () => {
	const data = [member("selected", [video("song", [{ i: 9, n: "Original", io: true }])])];
	let retried = 0;
	for (const queryState of [{ data: undefined, isPending: true }, { data: undefined, isError: true, refetch: () => retried++ }]) {
		for (const kind of ["cover", "original", "other"]) {
			const result = renderCounter(data, `kind=${kind}`, [], queryState);
			assert.deepEqual(result.shown, []);
			assert.equal(result.buttons.filter((button) => button.isDisabled).length, 3);
			assert.match(result.markup, /분류 확인 필요/);
			assert.doesNotMatch(result.markup, /조건에 맞는 영상이 없어요/);
		}
		const result = renderCounter(data, "", [], queryState);
		assert.deepEqual(result.shown, ["song"]);
		if (queryState.isPending) assert.match(result.markup, /분류 정보를 불러오고 있어요/);
		if (queryState.isError) result.buttons.find((button) => button.children === "다시 불러오기").onClick();
	}
	assert.equal(retried, 1);
});

test("태그 갱신 실패 시 마지막 성공 기준을 유지하고 잘못된 응답은 오류로 처리한다", () => {
	const data = [member("selected", [video("song", [{ i: 9, n: "곡" }])])];
	const catalog = [{ id: 9, name: "Original", isOriginal: true, isCover: false }];
	const result = renderCounter(data, "kind=original", catalog, { isError: true });
	assert.deepEqual(result.shown, ["song"]);
	assert.match(result.markup, /이전 기준을 사용하고 있어요/);
	assert.ok(result.buttons.every((button) => !button.isDisabled));
	assert.throws(() => result.requests[0].queryOptions.select({ data: {} }), /분류 정보를 불러오지 못했어요/);
});

test("분류 메타데이터나 태그가 없으면 이름으로 추측하지 않고 기타로 분류한다", () => {
	const data = [member("selected", [video("named", [{ i: 9, n: "Original" }]), video("untagged")])];
	assert.deepEqual(renderCounter(data, "kind=original").shown, []);
	assert.deepEqual(renderCounter(data, "kind=other").shown, ["named", "untagged"]);
	assert.deepEqual(renderCounter([member("selected", [])], "kind=cover").shown, []);
});
