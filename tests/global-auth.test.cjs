const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const React = require("react");
const ts = require("typescript");

const read = file => fs.readFileSync(path.join(__dirname, "../src", file), "utf8");
const compile = source => ts.transpileModule(source, {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;

test("공통 루트에서 팝업 로그인과 인증 완료 처리를 한 번 등록한다", () => {
	let tree, shortcut, messages = 0, focused = 0;
	const opened = [];
	vm.runInNewContext(compile(read("main.tsx").replaceAll("import.meta.env.DEV", "false")), {
		exports: {}, document: { getElementById: () => ({}) },
		window: { innerWidth: 1200, innerHeight: 900, open: (...args) => { opened.push(args); return { focus: () => focused++ }; } },
		require: name => {
			if (name === "react-dom/client") return { createRoot: () => ({ render: value => { tree = value; } }) };
			if (name === "react-router-dom") return { RouterProvider: "RouterProvider" };
			if (name === "react-hotkeys-hook") return { useHotkeys: (keys, callback, options) => { assert.equal(shortcut, undefined); shortcut = { keys, callback, options }; } };
			if (name === "./lib/hooks/useMessage") return { useMessage: () => messages++ };
			if (name === "./lib/Provider") return { MainProvider: "MainProvider" };
			if (name === "./_router") return { router: {} };
			if (name.endsWith(".css")) return {};
			return require(name);
		},
	});
	assert.equal(tree.type, "MainProvider");
	const children = React.Children.toArray(tree.props.children);
	assert.ok(children.some(node => node.type === "RouterProvider"));
	const auth = children.filter(node => typeof node.type === "function");
	assert.equal(auth.length, 1);
	auth[0].type();
	assert.equal(messages, 1);
	assert.equal(shortcut.keys, "ctrl+shift+l");
	assert.equal(shortcut.options.preventDefault, true);
	assert.equal(shortcut.options.enableOnFormTags, true);
	shortcut.callback({ repeat: false });
	shortcut.callback({ repeat: true });
	assert.equal(opened.length, 1);
	assert.deepEqual(opened[0], ["/login", "LoginPopup", "width=500,height=600,top=150,left=350,scrollbars=yes"]);
	assert.equal(focused, 1);
});

test("관리자에게만 데스크톱 헤더와 모바일 메뉴의 관리자 링크를 표시한다", () => {
	const source = ts.createSourceFile("Observatory.tsx", read("components/layout/Observatory.tsx"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
	const header = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "ObservatoryHeader");
	for (const isAdmin of [false, true]) {
		const exported = {};
		vm.runInNewContext(compile(header.getText(source)), {
			exports: exported, require, isAdminState: {}, useRecoilValue: () => isAdmin,
			useLocation: () => ({ pathname: "/home" }), useState: initial => [initial, () => {}],
			useRef: () => ({ current: null }), useEffect() {}, useDisclosure: () => ({ isOpen: false }), CAFE_WRITE_URL: "/cafe",
			...Object.fromEntries(["Box", "Button", "Flex", "Text", "HStack", "Menu", "MenuButton", "MenuList", "MenuItem", "Portal", "Divider", "Link", "ObservatoryButton", "MdHome", "MdBarChart", "MdGridView", "MdSettings", "MdClose", "MdMenu", "MdOpenInNew", "MdEdit"].map(name => [name, name])),
		});
		const links = [];
		function visit(node) {
			if (!React.isValidElement(node)) return;
			if (node.props.href === "/admin") links.push(node);
			React.Children.forEach(node.props.children, visit);
		}
		visit(exported.ObservatoryHeader());
		assert.equal(links.length, isAdmin ? 2 : 0);
		if (isAdmin) assert.deepEqual(links.map(node => node.type), ["ObservatoryButton", "MenuItem"]);
	}
});
