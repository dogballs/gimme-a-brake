/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/controls.ts":
/*!*************************!*\
  !*** ./src/controls.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"Keycodes\": () => (/* binding */ Keycodes),\n/* harmony export */   \"listenKeyboard\": () => (/* binding */ listenKeyboard)\n/* harmony export */ });\nvar Keycodes;\n(function (Keycodes) {\n    Keycodes[Keycodes[\"Up\"] = 87] = \"Up\";\n    Keycodes[Keycodes[\"Left\"] = 65] = \"Left\";\n    Keycodes[Keycodes[\"Right\"] = 68] = \"Right\";\n    Keycodes[Keycodes[\"Down\"] = 83] = \"Down\";\n})(Keycodes || (Keycodes = {}));\nlet keys = [];\nfunction listenKeyboard() {\n    document.addEventListener('keydown', (ev) => {\n        if (!keys.includes(ev.keyCode)) {\n            keys.push(ev.keyCode);\n        }\n    });\n    document.addEventListener('keyup', (ev) => {\n        keys = keys.filter((k) => k !== ev.keyCode);\n    });\n    return {\n        getKeys() {\n            return keys;\n        },\n        isDown(key) {\n            return keys.includes(key);\n        },\n    };\n}\n\n\n//# sourceURL=webpack:///./src/controls.ts?");

/***/ }),

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _controls__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./controls */ \"./src/controls.ts\");\nvar __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\n    return new (P || (P = Promise))(function (resolve, reject) {\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n};\n\nconst canvas = document.querySelector('canvas');\nconst context = canvas.getContext('2d');\nconst IMAGE_WIDTH = 320;\nconst IMAGE_HEIGHT = 240;\nconst HORIZON_Y = IMAGE_HEIGHT / 2;\nconst NEAR_TEX_HEIGHT = 32;\nconst ROAD_IMAGE_WIDTH = 192;\nconst ROAD_HEIGHT = IMAGE_HEIGHT - HORIZON_Y;\ncanvas.width = IMAGE_WIDTH;\ncanvas.height = IMAGE_HEIGHT;\nfunction loadImage(imagePath) {\n    return __awaiter(this, void 0, void 0, function* () {\n        return new Promise((resolve) => {\n            const image = new Image();\n            image.src = imagePath;\n            image.addEventListener('load', () => {\n                resolve(image);\n            });\n        });\n    });\n}\nconst { getKeys } = (0,_controls__WEBPACK_IMPORTED_MODULE_0__.listenKeyboard)();\nconst speed = 3;\nconst state = {\n    moveOffset: 0,\n};\nconst images = {\n    road2: undefined,\n};\nfunction main() {\n    return __awaiter(this, void 0, void 0, function* () {\n        images.road2 = yield loadImage('data/graphics/road2.png');\n        road();\n    });\n}\nfunction road() {\n    return __awaiter(this, void 0, void 0, function* () {\n        if (getKeys().includes(_controls__WEBPACK_IMPORTED_MODULE_0__.Keycodes.Up)) {\n            state.moveOffset += speed;\n        }\n        else if (getKeys().includes(_controls__WEBPACK_IMPORTED_MODULE_0__.Keycodes.Down)) {\n            state.moveOffset -= speed;\n        }\n        context.fillStyle = '#88a';\n        context.fillRect(0, 0, IMAGE_WIDTH, HORIZON_Y);\n        context.fillStyle = '#aa8';\n        context.fillRect(0, HORIZON_Y, IMAGE_WIDTH, IMAGE_HEIGHT - HORIZON_Y);\n        straight();\n        requestAnimationFrame(road);\n    });\n}\nfunction straight() {\n    const hors = getHors();\n    const vers = getVerts();\n    const getTextureIndex = (y) => {\n        for (let i = 0; i < vers.length; i++) {\n            if (vers[i][0] <= y && vers[i][1] >= y) {\n                return vers[i][3];\n            }\n        }\n    };\n    const textures = [\n        [0, 1],\n        [33, 1],\n    ];\n    let verIndex = 0;\n    for (let i = 0; i <= ROAD_HEIGHT; i++) {\n        const sourceX = 0;\n        const sourceW = ROAD_IMAGE_WIDTH;\n        const [destX, destW] = hors[i];\n        const ti = getTextureIndex(i);\n        const sourceY = textures[ti][0];\n        const sourceH = textures[ti][1];\n        const destY = IMAGE_HEIGHT - i;\n        const destH = 1;\n        context.drawImage(images.road2, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH);\n    }\n}\nfunction getHors() {\n    let dx = 0;\n    const dxx = 1.6;\n    const NEAR_WIDTH = 400;\n    const widths = [];\n    for (let i = 0; i <= ROAD_HEIGHT; i++) {\n        const x = IMAGE_WIDTH / 2 - NEAR_WIDTH / 2 + dx;\n        const w = NEAR_WIDTH - dx * 2;\n        widths.push([x, w]);\n        dx += dxx;\n    }\n    return widths;\n}\nfunction getVerts() {\n    const hs = [];\n    const vers = [];\n    let left = ROAD_HEIGHT;\n    let i = 1;\n    let y = 0;\n    const ofp = Math.abs(state.moveOffset % NEAR_TEX_HEIGHT) / NEAR_TEX_HEIGHT;\n    const ofps = 1 - ofp;\n    const p = Math.floor(Math.abs(state.moveOffset) / NEAR_TEX_HEIGHT) % 2;\n    let prim = !!p;\n    if (state.moveOffset < 0) {\n        prim = !prim;\n    }\n    while (left >= 0) {\n        const m = 1.3 / i;\n        const h = Math.round(m * NEAR_TEX_HEIGHT);\n        const t1 = h * (state.moveOffset < 0 ? ofp : ofps);\n        const t2 = h - t1;\n        if (t1 !== 0) {\n            hs.push([y, y + t1, t1, prim ? 1 : 0]);\n        }\n        if (t2 !== 0) {\n            hs.push([y + t1, y + h, t2, prim ? 0 : 1]);\n        }\n        left -= h;\n        y += h;\n        i++;\n        prim = !prim;\n        if (left <= 0) {\n            break;\n        }\n    }\n    return hs;\n}\nmain();\n\n\n//# sourceURL=webpack:///./src/main.ts?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/main.ts");
/******/ 	
/******/ })()
;