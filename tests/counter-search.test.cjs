const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const ts = require("typescript");

const source = ts.createSourceFile("Counter.tsx", fs.readFileSync(path.join(__dirname, "../src/pages/v2/Counter.tsx"), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const searchInput = source.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "CounterSearchInput");
const compiled = ts.transpileModule(`${searchInput.getText(source)}\nexport { CounterSearchInput };`, {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function renderSearch(query, onCommit) {
	let input;
	const exported = {};
	vm.runInNewContext(compiled, {
		exports: exported, require,
		useState: React.useState, useRef: React.useRef, useEffect: React.useEffect,
		InputGroup: ({ children }) => children,
		InputLeftElement: () => null,
		MdSearch: () => null,
		Input: (props) => { input = props; return null; },
	});
	renderToStaticMarkup(React.createElement(exported.CounterSearchInput, { query, onCommit }));
	return input;
}

test("한글 조합 중에는 URL에 중간 자모를 전달하지 않고 완성된 입력만 반영한다", () => {
	const committed = [];
	const input = renderSearch("", (value) => committed.push(value));
	input.onCompositionStart();
	for (const value of ["ㅎ", "하", "한"]) input.onChange({ target: { value } });
	assert.deepEqual(committed, []);
	input.onCompositionEnd({ currentTarget: { value: "한" } });
	assert.deepEqual(committed, ["한"]);
	input.onCompositionStart();
	for (const value of ["한ㄱ", "한그", "한글"]) input.onChange({ target: { value } });
	assert.deepEqual(committed, ["한"]);
	input.onCompositionEnd({ currentTarget: { value: "한글" } });
	assert.deepEqual(committed, ["한", "한글"]);
});

test("일반 입력과 검색어 삭제는 바로 반영하고 URL 검색어로 초기화한다", () => {
	const committed = [];
	const input = renderSearch("기존 검색어", (value) => committed.push(value));
	assert.equal(input.value, "기존 검색어");
	input.onChange({ target: { value: "song" } });
	input.onChange({ target: { value: "" } });
	assert.deepEqual(committed, ["song", ""]);
});
