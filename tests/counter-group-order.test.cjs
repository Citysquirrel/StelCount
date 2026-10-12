const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const ts = require("typescript");

const source = ts.createSourceFile("Counter.tsx", fs.readFileSync(path.join(__dirname, "../src/pages/v2/Counter.tsx"), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const item = source.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "CounterGroupOrderItem");
const compiled = ts.transpileModule(`${item.getText(source)}\nexport { CounterGroupOrderItem };`, {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function renderItem(index = 1) {
	const exported = {};
	const buttons = [];
	const moves = [];
	const drags = [];
	let reorder;
	vm.runInNewContext(compiled, {
		exports: exported, require,
		useDragControls: () => ({ start: (event) => drags.push(event) }),
		Reorder: { Item: (props) => { reorder = props; return props.children; } },
		Flex: ({ children }) => children, Text: ({ children }) => children,
		ObservatoryButton: (props) => { buttons.push(props); return null; },
		MdDragIndicator: () => null, MdArrowUpward: () => null, MdArrowDownward: () => null,
	});
	renderToStaticMarkup(React.createElement(exported.CounterGroupOrderItem, {
		group: { name: "Mystic", label: "1기 · Mystic" }, index, count: 3, reduceMotion: true, onMove: (offset) => moves.push(offset),
	}));
	return { buttons, moves, drags, reorder };
}

test("그룹은 손잡이에서만 드래그를 시작하고 터치 제스처를 스크롤과 분리한다", () => {
	const { buttons, drags, reorder } = renderItem();
	assert.equal(reorder.value, "Mystic");
	assert.equal(reorder.dragListener, false);
	assert.equal(buttons[0].sx.touchAction, "none");
	const pointer = { button: 0, pointerType: "touch" };
	buttons[0].onPointerDown(pointer);
	buttons[0].onPointerDown({ button: 2 });
	assert.deepEqual(drags, [pointer]);
});

test("방향키와 이동 버튼으로도 같은 그룹 순서를 변경할 수 있다", () => {
	const { buttons, moves } = renderItem();
	let prevented = 0;
	for (const key of ["ArrowUp", "ArrowDown", "Tab"]) buttons[0].onKeyDown({ key, preventDefault: () => prevented++ });
	buttons[1].onClick();
	buttons[2].onClick();
	assert.deepEqual(moves, [-1, 1, -1, 1]);
	assert.equal(prevented, 2);
	assert.equal(renderItem(0).buttons[1].isDisabled, true);
	assert.equal(renderItem(2).buttons[2].isDisabled, true);
});

const editor = source.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "CounterGroupOrderEditor");
const editorCompiled = ts.transpileModule(`${editor.getText(source)}\nexport { CounterGroupOrderEditor };`, {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const helpers = ts.createSourceFile("counterV2.ts", fs.readFileSync(path.join(__dirname, "../src/lib/functions/counterV2.ts"), "utf8"), ts.ScriptTarget.Latest, true);
const orderHelpers = helpers.statements.filter((node) => ts.isFunctionDeclaration(node) && ["orderCounterGroups", "moveCounterGroup"].includes(node.name?.text)).map((node) => node.getText(helpers)).join("\n");

function mountEditor() {
	const exported = {};
	let state;
	const pending = {};
	const saves = [];
	let props = { groups: ["a", "b", "c"].map((name) => ({ name, label: name })), isOpen: true, hasCustomOrder: true, onClose: () => {}, onOrderChange: (order) => saves.push(order) };
	let reorder;
	let modal;
	let items;
	let buttons;
	let changedGroups;
	vm.runInNewContext(ts.transpileModule(orderHelpers, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText + editorCompiled, {
		exports: exported, require,
		useReducedMotion: () => false,
		useMemo: (fn) => fn(),
		useState: (initial) => { state ??= initial(); return [state, (next) => { state = next; }]; },
		useRef: (initial) => { pending.current ??= initial; return pending; },
		useEffect: (fn, deps) => { if (changedGroups !== deps[0]) { changedGroups = deps[0]; fn(); } },
		DarkMode: ({ children }) => children, Flex: ({ children }) => children, Text: () => null,
		CustomModal: (value) => { modal = value; return React.createElement(React.Fragment, null, value.properties.body, value.properties.footer); },
		Reorder: { Group: (value) => { reorder = value; return value.children; } },
		CounterGroupOrderItem: (value) => { items.push(value); return null; },
		ObservatoryButton: (value) => { buttons.push(value); return null; },
	});
	const render = () => {
		items = []; buttons = [];
		renderToStaticMarkup(React.createElement(exported.CounterGroupOrderEditor, props));
		return { reorder, modal, items, buttons };
	};
	return { render, saves, setGroups: (names) => { props = { ...props, groups: names.map((name) => ({ name, label: name })) }; } };
}

test("드래그 중에는 편집 목록만 갱신하고 놓을 때 최종 순서를 한 번 저장한다", () => {
	const editor = mountEditor();
	editor.render().reorder.onReorder(["b", "a", "c"]);
	editor.render().reorder.onReorder(["b", "c", "a"]);
	const view = editor.render();
	assert.deepEqual(view.items.map((item) => item.group.name), ["b", "c", "a"]);
	assert.equal(editor.saves.length, 0);
	view.items[2].onDragEnd();
	assert.deepEqual(editor.saves, [["b", "c", "a"]]);
});

test("방향키 이동은 즉시 저장하고 창 닫기는 아직 저장하지 않은 순서를 반영한다", () => {
	const editor = mountEditor();
	editor.render().items[1].onMove(-1);
	assert.deepEqual(Array.from(editor.saves[0]), ["b", "a", "c"]);
	editor.setGroups(["b", "a", "c"]);
	editor.render();
	editor.render().reorder.onReorder(["b", "c", "a"]);
	editor.render().modal.onClose();
	assert.deepEqual(editor.saves[1], ["b", "c", "a"]);
});

test("원래 위치에 놓으면 저장하지 않고 기본 순서는 기존 초기화 동작을 사용한다", () => {
	const editor = mountEditor();
	editor.render().reorder.onReorder(["b", "a", "c"]);
	editor.render().reorder.onReorder(["a", "b", "c"]);
	editor.render().items[0].onDragEnd();
	assert.equal(editor.saves.length, 0);
	editor.render().buttons[0].onClick();
	assert.deepEqual(editor.saves, [undefined]);
});
