const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const ts = require("typescript");

const source = ts.createSourceFile("Counter.tsx", fs.readFileSync(path.join(__dirname, "../src/pages/v2/Counter.tsx"), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const component = source.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "CounterMembers");
const compiled = ts.transpileModule(`${component.getText(source)}\nexport { CounterMembers };`, {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function mount(direction = "row") {
	let handlers;
	const captured = [];
	const rail = { scrollWidth: 1000, clientWidth: 400, scrollLeft: 100, dataset: {}, setPointerCapture: (id) => captured.push(id) };
	const exported = {};
	vm.runInNewContext(compiled, {
		exports: exported, require,
		useRef: React.useRef, useState: React.useState, useEffect: React.useEffect,
		useDisclosure: () => ({ isOpen: false, onOpen() {}, onClose() {} }),
		window: { getComputedStyle: () => ({ flexDirection: direction }) },
		Flex: React.forwardRef((props, ref) => {
			if (props["aria-label"] === "멤버 목록") { handlers = props; ref.current = rail; }
			return props.children;
		}),
		Box: ({ children }) => children, Text: ({ children }) => children,
		Select: () => null, ObservatoryButton: () => null, MdSwapVert: () => null, CounterGroupOrderEditor: () => null,
	});
	renderToStaticMarkup(React.createElement(exported.CounterMembers, { groups: [], selectedId: "", selectedGroup: "", onSelect() {}, onOrderChange() {} }));
	const pointer = (x, fields = {}) => ({ currentTarget: rail, clientX: x, button: 0, pointerType: "mouse", pointerId: 1, preventDefault() {}, ...fields });
	return { handlers, rail, pointer, captured };
}

test("가로 멤버 바는 마우스 드래그로 스크롤하고 드래그 뒤 멤버 클릭을 차단한다", () => {
	const { handlers, rail, pointer, captured } = mount();
	handlers.onPointerDown(pointer(200));
	handlers.onPointerMove(pointer(160));
	assert.equal(rail.scrollLeft, 140);
	assert.equal(rail.dataset.dragging, "true");
	assert.deepEqual(captured, [1]);
	handlers.onPointerUp();
	assert.equal(rail.dataset.dragging, "false");
	let blocked = 0;
	handlers.onClickCapture({ detail: 1, preventDefault: () => blocked++, stopPropagation: () => blocked++ });
	assert.equal(blocked, 2);
});

test("짧은 흔들림은 클릭으로 유지하고 키보드 클릭은 드래그 이후에도 허용한다", () => {
	const { handlers, rail, pointer } = mount();
	const click = { detail: 1, preventDefault: () => assert.fail("일반 클릭을 차단하면 안 된다"), stopPropagation() {} };
	handlers.onPointerDown(pointer(200));
	handlers.onPointerMove(pointer(195));
	handlers.onPointerUp();
	assert.equal(rail.scrollLeft, 100);
	handlers.onClickCapture(click);
	handlers.onPointerDown(pointer(200));
	handlers.onPointerMove(pointer(150));
	handlers.onPointerUp();
	handlers.onClickCapture({ ...click, detail: 0 });
	handlers.onPointerDown(pointer(200));
	handlers.onPointerUp();
	handlers.onClickCapture(click);
});

test("터치 스와이프·세로 사이드바·우클릭·넘치지 않는 목록은 가로 드래그가 가로채지 않는다", () => {
	for (const kind of ["touch", "column", "right", "fits"]) {
		const { handlers, rail, pointer, captured } = mount(kind === "column" ? "column" : "row");
		if (kind === "fits") rail.scrollWidth = rail.clientWidth;
		handlers.onPointerDown(pointer(200, { pointerType: kind === "touch" ? "touch" : "mouse", button: kind === "right" ? 2 : 0 }));
		handlers.onPointerMove(pointer(120));
		assert.equal(rail.scrollLeft, 100);
		assert.deepEqual(captured, []);
	}
});

test("포인터 취소·캡처 해제 이후에는 추가 이동을 처리하지 않는다", () => {
	for (const finish of ["onPointerCancel", "onLostPointerCapture"]) {
		const { handlers, rail, pointer } = mount();
		handlers.onPointerDown(pointer(200));
		handlers.onPointerMove(pointer(160));
		handlers[finish]();
		handlers.onPointerMove(pointer(120));
		assert.equal(rail.scrollLeft, 140);
		assert.equal(rail.dataset.dragging, "false");
	}
});
