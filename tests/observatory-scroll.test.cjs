const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

const source = ts.createSourceFile("Observatory.tsx", fs.readFileSync(path.join(__dirname, "../src/components/layout/Observatory.tsx"), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const component = source.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "ObservatoryBackToTop");
const hook = ts.createSourceFile("useObservatoryScroll.ts", fs.readFileSync(path.join(__dirname, "../src/lib/hooks/useObservatoryScroll.ts"), "utf8"), ts.ScriptTarget.Latest, true);
const hookSource = hook.statements.filter((node) => !ts.isImportDeclaration(node)).map((node) => node.getText(hook)).join("\n");
const home = ts.createSourceFile("ObservatoryPremieres.tsx", fs.readFileSync(path.join(__dirname, "../src/components/layout/ObservatoryPremieres.tsx"), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const premieres = home.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "ObservatoryPremieres");
const compiled = ts.transpileModule(`${hookSource}\n${component.getText(source)}\n${premieres.getText(home)}`, {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function mount(pathname = "/home", showPremieres = false) {
	const state = [];
	let cursor = 0;
	let effect;
	let observeResize;
	let disconnected = false;
	let footerTop = 1200;
	let isOpen = false;
	const observed = [];
	const listeners = new Map();
	const footer = { getBoundingClientRect: () => ({ top: footerTop }) };
	const main = {};
	const window = {
		scrollY: 500, innerHeight: 800,
		addEventListener: (name, handler) => listeners.set(name, handler),
		removeEventListener: (name) => listeners.delete(name),
	};
	const exported = {};
	vm.runInNewContext(compiled, {
		exports: exported, require, window,
		document: { getElementById: (id) => id === "obs-footer" ? footer : main },
		useLocation: () => ({ pathname }),
		useDisclosure: () => ({ isOpen, onOpen: () => { isOpen = true; }, onClose: () => { isOpen = false; } }),
		useState: (initial) => {
			const index = cursor++;
			if (!(index in state)) state[index] = initial;
			return [state[index], (value) => { state[index] = value; }];
		},
		useEffect: (callback) => { effect = callback; },
		ResizeObserver: class {
			constructor(callback) { observeResize = callback; }
			observe(target) { observed.push(target); }
			disconnect() { disconnected = true; }
		},
		ObservatoryButton: () => null, MdArrowUpward: () => null,
		Box: () => null, Flex: () => null, Text: () => null, Stack: () => null, Link: () => null,
		ImageV2: () => null, generateStandardThumbnail: (id) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, youtubeThumbnailImageProps: {},
		DarkMode: () => null, Drawer: () => null, DrawerContent: () => null, DrawerHeader: () => null, DrawerBody: () => null, DrawerCloseButton: () => null,
		MdSensors: () => null, MdSchedule: () => null, MdExpandLess: () => null, MdPlayArrow: () => null,
		youtube: { videoUrl: (id) => `https://www.youtube.com/watch?v=${id}` }, homeDate: () => "2026.10.12",
	});
	const render = () => {
		cursor = 0;
		return showPremieres ? exported.ObservatoryPremieres({ items: [
			{ video: { vi: "live", lbc: "live", tl: "진행 중" }, member: { n: "멤버" } },
			{ video: { vi: "upcoming", lbc: "upcoming", tl: "예정" }, member: { n: "멤버" } },
		] }) : exported.ObservatoryBackToTop();
	};
	render();
	const cleanup = effect();
	return {
		render, window, observed, listeners, cleanup,
		setFooterTop: (value) => { footerTop = value; },
		resizeContent: () => observeResize(),
		isDisconnected: () => disconnected,
	};
}

test("푸터가 나타나면 버튼 하단을 푸터 위 16px로 올리고 멀어지면 기본 위치로 복귀한다", () => {
	const page = mount();
	assert.equal(page.render().props.bottom.lg, "max(0px, calc(24px + env(safe-area-inset-bottom, 0px)))");
	page.setFooterTop(700);
	page.listeners.get("scroll")();
	assert.equal(page.render().props.bottom.lg, "max(116px, calc(24px + env(safe-area-inset-bottom, 0px)))");
	page.setFooterTop(1000);
	page.listeners.get("scroll")();
	assert.equal(page.render().props.bottom.lg, "max(0px, calc(24px + env(safe-area-inset-bottom, 0px)))");
	page.window.scrollY = 0;
	page.listeners.get("scroll")();
	assert.equal(page.render(), null);
});

test("모바일 Counter 하단 메뉴 여백을 유지하며 화면·본문 크기 변경에도 푸터를 피한다", () => {
	const page = mount("/counter/");
	page.setFooterTop(650);
	page.resizeContent();
	assert.equal(page.render().props.bottom.base, "max(166px, calc(97px + env(safe-area-inset-bottom, 0px)))");
	page.window.innerHeight = 900;
	page.listeners.get("resize")();
	assert.equal(page.render().props.bottom.base, "max(266px, calc(97px + env(safe-area-inset-bottom, 0px)))");
	assert.equal(page.observed.length, 2);
});

test("컴포넌트가 해제되면 스크롤·크기 변경 감시를 정리한다", () => {
	const page = mount();
	page.cleanup();
	assert.equal(page.listeners.size, 0);
	assert.equal(page.isDisconnected(), true);
});

test("최초공개 버튼도 푸터 위 16px를 유지하고 푸터가 멀어지면 기본 위치로 돌아온다", () => {
	const page = mount("/home", true);
	const button = () => page.render().props.children[0];
	page.setFooterTop(700);
	page.listeners.get("scroll")();
	assert.equal(button().props.bottom.base, "max(116px, calc(24px + env(safe-area-inset-bottom, 0px)))");
	page.window.innerHeight = 900;
	page.resizeContent();
	assert.equal(button().props.bottom.base, "max(216px, calc(24px + env(safe-area-inset-bottom, 0px)))");
	page.setFooterTop(1200);
	page.listeners.get("resize")();
	assert.equal(button().props.bottom.base, "max(0px, calc(24px + env(safe-area-inset-bottom, 0px)))");
});

test("Counter 최초공개 버튼은 모바일 멤버 메뉴와 푸터를 모두 피한다", () => {
	const page = mount("/counter/", true);
	const button = () => page.render().props.children[0];
	assert.equal(button().props.bottom.base, "max(0px, calc(97px + env(safe-area-inset-bottom, 0px)))");
	assert.equal(button().props.bottom.lg, "max(0px, calc(24px + env(safe-area-inset-bottom, 0px)))");
	page.setFooterTop(650);
	page.listeners.get("scroll")();
	assert.equal(button().props.bottom.base, "max(166px, calc(97px + env(safe-area-inset-bottom, 0px)))");
});

test("진행·예정 영상 모두 링크를 유지하며 선택하면 Drawer가 닫힌다", () => {
	const page = mount("/home", true);
	const drawer = () => page.render().props.children[1].props.children;
	for (const index of [0, 1]) {
		page.render().props.children[0].props.onClick();
		assert.equal(drawer().props.isOpen, true);
		const content = drawer().props.children;
		const links = content.props.children[2].props.children.props.children;
		assert.equal(links[index].props.isExternal, true);
		assert.equal(links[index].props.href, `https://www.youtube.com/watch?v=${index ? "upcoming" : "live"}`);
		links[index].props.onClick();
		assert.equal(drawer().props.isOpen, false);
	}
});
