const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

const source = ts.createSourceFile("HomeVideoPreview.tsx", fs.readFileSync(path.join(__dirname, "../src/components/layout/HomeVideoPreview.tsx"), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const component = source.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "HomeVideoPreview");
const compiled = ts.transpileModule(component.getText(source), {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function mount(props = {}) {
	let effect;
	let playing = false;
	let clock = 0;
	let options;
	let created = 0;
	let destroyed = 0;
	let cleared = 0;
	const intervals = new Map();
	const timeouts = new Map();
	const seeks = [];
	const calls = [];
	const player = {
		duration: 100, position: 0, state: 1,
		mute: () => calls.push("mute"), setVolume: (value) => calls.push(`volume:${value}`), playVideo: () => calls.push("play"),
		seekTo: (seconds) => { seeks.push(seconds); player.position = seconds; },
		getDuration: () => player.duration, getCurrentTime: () => player.position, getPlayerState: () => player.state,
		getIframe: () => ({}), destroy: () => destroyed++,
	};
	const host = { appendChild() {}, replaceChildren: () => cleared++ };
	const exported = {};
	vm.runInNewContext(compiled, {
		exports: exported, require, Box: () => null,
		useRef: () => ({ current: host }), useState: () => [playing, (value) => { playing = value; }],
		useScript: () => "ready", useEffect: (callback) => { effect = callback; },
		performance: { now: () => clock }, document: { createElement: () => ({}) },
		window: {
			location: { origin: "http://localhost" },
			YT: { Player: class { constructor(element, config) { options = config; created++; return player; } } },
			setInterval: (callback) => { intervals.set(1, callback); return 1; }, clearInterval: (id) => intervals.delete(id),
			setTimeout: (callback) => { timeouts.set(1, callback); return 1; }, clearTimeout: (id) => timeouts.delete(id),
		},
	});
	exported.HomeVideoPreview({ videoId: "tlCeLkw8Upc", ...props });
	const cleanup = effect();
	return {
		player, seeks, calls, intervals, timeouts, cleanup,
		get options() { return options; }, get created() { return created; }, get destroyed() { return destroyed; }, get cleared() { return cleared; }, get playing() { return playing; },
		ready: () => options.events.onReady({ target: player }),
		tick: (elapsed = 200) => { clock += elapsed; for (const callback of intervals.values()) callback(); },
	};
}

test("지정된 네 PV 구간은 음소거 상태로 시작하고 종료 지점에서 해당 시작점으로 반복한다", () => {
	for (const [start, end] of [[10, 20], [21, 31], [32, 42], [43, 53]]) {
		const preview = mount({ start, end });
		assert.equal(preview.options.playerVars.start, start);
		assert.equal(preview.options.playerVars.end, end);
		preview.ready();
		assert.deepEqual(preview.calls.slice(0, 3), ["mute", "volume:0", "play"]);
		preview.tick();
		assert.equal(preview.seeks.at(-1), start);
		preview.tick();
		assert.equal(preview.playing, false);
		preview.tick(1200);
		assert.equal(preview.playing, true);
		const seekCount = preview.seeks.length;
		preview.player.position = end - .8;
		preview.tick();
		assert.equal(preview.playing, false);
		assert.equal(preview.seeks.length, seekCount);
		preview.player.position = end;
		preview.tick(800);
		assert.equal(preview.seeks.length, seekCount + 1);
		assert.equal(preview.seeks.at(-1), start);
		assert.equal(preview.playing, false);
		preview.cleanup();
	}
});

test("구간을 지정하지 않은 기존 주요영상은 임의 시작점과 16초 미리보기를 유지한다", () => {
	const preview = mount();
	assert.equal(preview.options.playerVars.start, undefined);
	preview.ready();
	preview.tick();
	const start = preview.seeks.at(-1);
	assert.ok(start >= 30 && start <= 65);
	preview.player.position = start + 15.2;
	preview.tick();
	preview.player.position = start + 16;
	preview.tick(800);
	assert.equal(preview.seeks.at(-1), start);
	preview.cleanup();
});

test("PV 종료 전 페이드아웃 중에는 다시 나타나지 않고 반복 시작은 짧게 대기한 뒤 페이드인한다", () => {
	const preview = mount({ start: 10, end: 20 });
	preview.ready();
	preview.tick();
	preview.tick();
	preview.tick(1200);
	assert.equal(preview.playing, true);
	const seekCount = preview.seeks.length;
	preview.player.position = 19.2;
	preview.tick();
	assert.equal(preview.playing, false);
	preview.player.position = 19.5;
	preview.tick(300);
	assert.equal(preview.playing, false);
	assert.equal(preview.seeks.length, seekCount);
	preview.player.position = 20;
	preview.tick(500);
	assert.equal(preview.seeks.length, seekCount + 1);
	preview.tick();
	assert.equal(preview.playing, false);
	preview.tick();
	assert.equal(preview.playing, true);
	preview.cleanup();
});

test("종료 이벤트가 갑자기 와도 페이드아웃 시간이 지난 후에 되감는다", () => {
	const preview = mount({ start: 10, end: 20 });
	preview.ready();
	preview.tick();
	preview.tick();
	preview.tick(1200);
	const seekCount = preview.seeks.length;
	preview.player.state = 0;
	preview.tick();
	assert.equal(preview.playing, false);
	assert.equal(preview.seeks.length, seekCount);
	preview.tick(400);
	assert.equal(preview.seeks.length, seekCount);
	preview.tick(200);
	assert.equal(preview.seeks.length, seekCount + 1);
	preview.cleanup();
});

test("잘못된 구간은 재생하지 않고 영상 길이 밖의 구간은 정적 배경으로 복귀한다", () => {
	for (const props of [{ start: -1, end: 20 }, { start: 20, end: 10 }, { start: 10 }, { start: NaN, end: 20 }]) {
		assert.equal(mount(props).created, 0);
	}
	const preview = mount({ start: 100, end: 110 });
	preview.ready();
	preview.tick();
	assert.equal(preview.destroyed, 1);
	assert.equal(preview.playing, false);
	assert.equal(preview.intervals.size, 0);
});

test("멤버 변경·화면 이탈 시 플레이어와 타이머를 정리하고 자동재생 차단도 배경으로 복귀한다", () => {
	const preview = mount({ start: 10, end: 20 });
	preview.ready();
	preview.cleanup();
	assert.equal(preview.destroyed, 1);
	assert.equal(preview.cleared, 1);
	assert.equal(preview.intervals.size, 0);
	assert.equal(preview.timeouts.size, 0);
	const blocked = mount({ start: 21, end: 31 });
	blocked.options.events.onAutoplayBlocked();
	assert.equal(blocked.playing, false);
	assert.equal(blocked.destroyed, 1);
});
