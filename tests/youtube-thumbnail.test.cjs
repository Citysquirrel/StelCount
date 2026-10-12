const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const compile = (source) => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const exported = {};
vm.runInNewContext(compile(fs.readFileSync(path.join(__dirname, "../src/lib/functions/platforms.ts"), "utf8")), { exports: exported, URL });
const { youtubeThumbnailImageProps: handlers } = exported;
const thumbnail = (quality, width = 120, height = 90) => ({ src: `https://i.ytimg.com/vi/video/${quality}.jpg`, naturalWidth: width, naturalHeight: height });

test("120×90 기본 응답은 해상도를 순서대로 낮추고 마지막 default에서 멈춘다", () => {
	const image = thumbnail("maxresdefault");
	for (const next of ["sddefault", "hqdefault", "mqdefault", "default", "default"]) {
		handlers.onLoad({ currentTarget: image });
		assert.ok(image.src.endsWith(`/${next}.jpg`));
	}
});

test("정상 썸네일과 다른 출처의 작은 이미지는 교체하지 않는다", () => {
	for (const image of [thumbnail("sddefault", 640, 480), thumbnail("hqdefault", 480, 360), thumbnail("default"), { ...thumbnail("hqdefault"), src: "https://example.com/vi/video/hqdefault.jpg" }]) {
		const original = image.src;
		handlers.onLoad({ currentTarget: image });
		assert.equal(image.src, original);
	}
});

test("로드 오류도 대체 경로를 사용하고 마지막 해상도에서 무한 재시도하지 않는다", () => {
	const image = thumbnail("sddefault", 0, 0);
	handlers.onError({ currentTarget: image });
	assert.ok(image.src.endsWith("/hqdefault.jpg"));
	for (let i = 0; i < 10; i++) handlers.onError({ currentTarget: image });
	assert.ok(image.src.endsWith("/default.jpg"));
});

test("ImageV2는 기본 이미지 대신 대체 썸네일이 로드된 후에 표시한다", () => {
	let props;
	const loaded = [];
	const components = {};
	vm.runInNewContext(compile(fs.readFileSync(path.join(__dirname, "../src/components/Image.tsx"), "utf8")), {
		exports: components,
		require: (name) => name === "@chakra-ui/react" ? {
			AspectRatio: ({ children }) => children,
			Box: ({ children }) => children,
			Image: (imageProps) => { props = imageProps; return null; },
		} : name === "react" ? { ...React, useState: () => [undefined, (src) => loaded.push(src)] } : require(name),
	});
	const image = thumbnail("sddefault");
	const original = image.src;
	renderToStaticMarkup(React.createElement(components.ImageV2, { src: original, imageProps: handlers }));
	props.onLoad({ currentTarget: image });
	assert.deepEqual(loaded, []);
	assert.ok(image.src.endsWith("/hqdefault.jpg"));
	image.naturalWidth = 480;
	image.naturalHeight = 360;
	props.onLoad({ currentTarget: image });
	assert.deepEqual(loaded, [original]);
});
