const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");
const { matchRoutes } = require("react-router-dom");

const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/_router.tsx"), "utf8"), {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const exported = {};
const pages = new Map();
let location = {};
vm.runInNewContext(compiled, {
	exports: exported,
	require: (name) => {
		if (name === "react-router-dom") return { ...require(name), createBrowserRouter: (routes) => routes, useLocation: () => location };
		if (name.startsWith("react")) return require(name);
		const component = () => null;
		pages.set(name, component);
		return new Proxy({ __esModule: true, default: component }, { get: (object, key) => key in object ? object[key] : component });
	},
});
const routes = exported.routeObj;

test("기본 Home과 Counter 경로는 새 화면과 공통 레이아웃으로 연결된다", () => {
	for (const [pathname, page] of [["/home", "Home"], ["/counter", "Counter"], ["/counter/", "Counter"]]) {
		const matches = matchRoutes(routes, pathname);
		assert.equal(matches[0].route.element.type, pages.get("./AppV2"));
		assert.equal(matches.at(-1).route.element.type, pages.get(`@page/v2/${page}`));
	}
	assert.equal(pages.has("./pages/Home"), false);
	assert.equal(pages.has("./pages/Counter"), false);
});

test("루트와 기존 v2 링크는 쿼리·해시를 보존하고 기본 경로로 대체 이동한다", () => {
	for (const [pathname, target] of [["/", "/home"], ["/v2", "/home"], ["/v2/counter", "/counter"]]) {
		location = { search: "?member=uni&kind=cover&q=별", hash: "#records" };
		const element = matchRoutes(routes, pathname).at(-1).route.element;
		const redirect = element.type(element.props);
		assert.equal(redirect.props.to.pathname, target);
		assert.equal(redirect.props.to.search, location.search);
		assert.equal(redirect.props.to.hash, location.hash);
		assert.equal(redirect.props.replace, true);
	}
});

test("관리자·로그인·멀티뷰 경로는 공개 페이지 전환의 영향을 받지 않는다", () => {
	assert.equal(matchRoutes(routes, "/admin/dashboard")[0].route.element.type, pages.get("./App"));
	for (const [pathname, page] of [["/login", "Login"], ["/multiview", "MultiView"], ["/oauth", "OAuth"]]) {
		assert.equal(matchRoutes(routes, pathname).at(-1).route.element.type, pages.get(`./pages/${page}`));
	}
});
