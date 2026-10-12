const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const React = require("react");
const ts = require("typescript");

const read = file => fs.readFileSync(path.join(__dirname, "../src", file), "utf8");
const compile = source => ts.transpileModule(source, {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const helpers = {};
vm.runInNewContext(compile(read("lib/functions/etc.ts")), { exports: helpers, require });
const source = ts.createSourceFile("Counter.tsx", read("pages/v2/Counter.tsx"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const components = source.statements.filter(node => ts.isFunctionDeclaration(node) && ["CounterMembers", "CounterProfile"].includes(node.name?.text));
const exported = {};
vm.runInNewContext(compile(`${components.map(node => node.getText(source)).join("\n")}\nexport { CounterMembers, CounterProfile };`), {
	exports: exported, require, avatarFallbackColor: helpers.avatarFallbackColor,
	useRef: initial => ({ current: initial }), useState: initial => [initial, () => {}], useEffect() {}, useDisclosure: () => ({ isOpen: false }),
	counterProfileImage: member => member.pi, naver: { chzzk: { profileImageUrl: url => url } }, counterChannels: () => [], counterValue: () => null,
	...Object.fromEntries(["Box", "Flex", "Text", "Select", "ObservatoryButton", "Avatar", "Heading", "MdSwapVert", "MdHome", "CounterGroupOrderEditor"].map(name => [name, name])),
});

test("Counter 멤버 목록과 프로필은 같은 파스텔색을 사용하고 대체 이니셜을 표시하지 않는다", () => {
	for (const pi of [undefined, "https://example.com/missing-image.png"]) {
		const member = { uid: "member-a", n: "멤버 이름", pi };
		const group = { name: "group", label: "그룹", members: [member] };
		const trees = [exported.CounterMembers({ groups: [group] }), exported.CounterProfile({ member })];
		const avatars = [];
		function visit(node) {
			if (!React.isValidElement(node)) return;
			if (node.type === "Avatar") avatars.push(node.props);
			React.Children.forEach(node.props.children, visit);
		}
		trees.forEach(visit);
		assert.equal(avatars.length, 2);
		for (const avatar of avatars) {
			assert.equal(avatar.getInitials(member.n), "");
			assert.equal(avatar.bg, helpers.avatarFallbackColor(member.uid));
			assert.match(avatar.bg, /^hsl\(\d+, 65%, 80%\)$/);
			assert.equal(avatar.src, pi);
			assert.equal(avatar.name, member.n);
		}
	}
});
