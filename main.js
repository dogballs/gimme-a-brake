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

/***/ "./src/debug.ts":
/*!**********************!*\
  !*** ./src/debug.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"createRangeValue\": () => (/* binding */ createRangeValue)\n/* harmony export */ });\nfunction createRangeValue({ initialValue = 0, min = 0, max = 100, step = 1, title = '', parent = document.body, }) {\n    const container = document.createElement('div');\n    const titleElement = document.createElement('span');\n    titleElement.textContent = title;\n    container.appendChild(titleElement);\n    const input = document.createElement('input');\n    input.type = 'range';\n    input.min = min.toString();\n    input.max = max.toString();\n    input.step = step.toString();\n    input.value = initialValue.toString();\n    container.appendChild(input);\n    parent.appendChild(container);\n    const rangeValue = {\n        get() {\n            return Number(input.value);\n        },\n        set(value) {\n            input.value = value.toString();\n        },\n    };\n    return rangeValue;\n}\n\n\n//# sourceURL=webpack:///./src/debug.ts?");

/***/ }),

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _controls__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./controls */ \"./src/controls.ts\");\n/* harmony import */ var _debug__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./debug */ \"./src/debug.ts\");\nvar __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\n    return new (P || (P = Promise))(function (resolve, reject) {\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n};\n\n\nconst canvas = document.querySelector('canvas');\nconst context = canvas.getContext('2d');\nconst IMAGE_WIDTH = 320;\nconst IMAGE_HEIGHT = 240;\nconst NEAR_TEX_HEIGHT = 32;\nconst ROAD_IMAGE_WIDTH = 192;\ncanvas.width = IMAGE_WIDTH;\ncanvas.height = IMAGE_HEIGHT;\nconst curveTopStartValue = (0,_debug__WEBPACK_IMPORTED_MODULE_1__.createRangeValue)({\n    title: 'curveTopStart',\n    initialValue: 40,\n    min: 0,\n    max: IMAGE_HEIGHT,\n});\nconst curveTopOffsetMultValue = (0,_debug__WEBPACK_IMPORTED_MODULE_1__.createRangeValue)({\n    title: 'cureveTopOffsetMult',\n    initialValue: 0.05,\n    min: 0,\n    max: 1,\n    step: 0.01,\n});\n// const curveBottomStartValue = createRangeValue({\n//   title: 'curveBottomStart',\n//   initialValue: 0,\n//   min: 0,\n//   max: IMAGE_HEIGHT,\n// });\n// const curveBottomOffsetMultValue = createRangeValue({\n//   title: 'cureveBottomOffsetMult',\n//   initialValue: 0.05,\n//   min: 0,\n//   max: 3,\n//   step: 0.01,\n// });\nconst widthPerLineReduceValue = (0,_debug__WEBPACK_IMPORTED_MODULE_1__.createRangeValue)({\n    title: 'widthPerLineReduce',\n    initialValue: 1.6,\n    min: 0,\n    max: 3,\n    step: 0.05,\n});\nconst horizonYValue = (0,_debug__WEBPACK_IMPORTED_MODULE_1__.createRangeValue)({\n    title: 'horizonY',\n    initialValue: IMAGE_HEIGHT / 2,\n    min: 0,\n    max: IMAGE_HEIGHT,\n});\nfunction loadImage(imagePath) {\n    return __awaiter(this, void 0, void 0, function* () {\n        return new Promise((resolve) => {\n            const image = new Image();\n            image.src = imagePath;\n            image.addEventListener('load', () => {\n                resolve(image);\n            });\n        });\n    });\n}\nconst { getKeys } = (0,_controls__WEBPACK_IMPORTED_MODULE_0__.listenKeyboard)();\nconst speed = 3;\nconst state = {\n    moveOffset: 0,\n};\nconst images = {\n    road2: undefined,\n};\nfunction main() {\n    return __awaiter(this, void 0, void 0, function* () {\n        images.road2 = yield loadImage('data/graphics/road2.png');\n        draw();\n    });\n}\nfunction draw() {\n    return __awaiter(this, void 0, void 0, function* () {\n        if (getKeys().includes(_controls__WEBPACK_IMPORTED_MODULE_0__.Keycodes.Up)) {\n            state.moveOffset += speed;\n        }\n        else if (getKeys().includes(_controls__WEBPACK_IMPORTED_MODULE_0__.Keycodes.Down)) {\n            state.moveOffset -= speed;\n        }\n        const horizonY = horizonYValue.get();\n        // Sky\n        context.fillStyle = '#88a';\n        context.fillRect(0, 0, IMAGE_WIDTH, horizonY);\n        // Ground\n        context.fillStyle = '#aa8';\n        context.fillRect(0, horizonY, IMAGE_WIDTH, IMAGE_HEIGHT - horizonY);\n        drawRoad();\n        requestAnimationFrame(draw);\n    });\n}\nfunction drawRoad() {\n    // const widthList = getStraightWidthList();\n    const widthList = getCurvedWidthList();\n    const heightList = getSegmentHeightList();\n    const getTextureIndexForY = (y) => {\n        for (let i = 0; i < heightList.length; i++) {\n            const heightEntry = heightList[i];\n            if (heightEntry.y <= y && heightEntry.y2 >= y) {\n                return heightEntry.textureIndex;\n            }\n        }\n        throw new Error(`Could not find height entry for y=${y}`);\n    };\n    const textureSources = [\n        { y: 0, height: 1 },\n        { y: 33, height: 1 },\n    ];\n    const roadHeight = IMAGE_HEIGHT - horizonYValue.get();\n    for (let y = 0; y <= roadHeight; y++) {\n        const sourceX = 0;\n        const sourceW = ROAD_IMAGE_WIDTH;\n        const { x: destX, width: destW } = widthList[y];\n        const textureIndex = getTextureIndexForY(y);\n        const sourceY = textureSources[textureIndex].y;\n        const sourceH = textureSources[textureIndex].height;\n        const destY = IMAGE_HEIGHT - y;\n        const destH = 1;\n        context.drawImage(images.road2, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH);\n    }\n}\nfunction getStraightWidthList() {\n    let dx = 0;\n    const dxx = 1.6;\n    const NEAR_WIDTH = 400;\n    const roadHeight = IMAGE_HEIGHT - horizonYValue.get();\n    const widthList = [];\n    for (let i = 0; i <= roadHeight; i++) {\n        const x = IMAGE_WIDTH / 2 - NEAR_WIDTH / 2 + dx;\n        const width = NEAR_WIDTH - dx * 2;\n        widthList.push({\n            x,\n            width,\n        });\n        dx += dxx;\n    }\n    return widthList;\n}\nfunction getCurvedWidthList() {\n    const roadHeight = IMAGE_HEIGHT - horizonYValue.get();\n    const curveTopStart = roadHeight - curveTopStartValue.get();\n    // const curveBottomStart = curveBottomStartValue.get();\n    const curveTopOffsetMult = curveTopOffsetMultValue.get();\n    const NEAR_WIDTH = 400;\n    const perIterationReduce = widthPerLineReduceValue.get();\n    let topOffset = 0;\n    let perIterationTopOffset = 0;\n    let bottomOffset = 0;\n    let perIterationBottomOffset = 0;\n    const widthList = [];\n    for (let i = 0; i <= roadHeight; i++) {\n        const widthReduce = i * perIterationReduce;\n        const straightX = IMAGE_WIDTH / 2 - NEAR_WIDTH / 2 + widthReduce;\n        const width = NEAR_WIDTH - widthReduce * 2;\n        const topCurveX = straightX - topOffset;\n        const bottomCurveX = straightX - bottomOffset;\n        // if (i <= curveBottomStart) {\n        //   widthList.push({\n        //     x: straightX,\n        //     width,\n        //   });\n        // } else\n        if (i >= curveTopStart) {\n            widthList.push({\n                x: topCurveX,\n                width,\n            });\n            topOffset += perIterationTopOffset;\n            perIterationTopOffset += curveTopOffsetMult;\n        }\n        else {\n            widthList.push({\n                x: straightX,\n                width,\n            });\n        }\n    }\n    return widthList;\n}\nfunction getSegmentHeightList() {\n    const roadHeight = IMAGE_HEIGHT - horizonYValue.get();\n    const heightList = [];\n    const { moveOffset } = state;\n    const isNegativeMoveOffset = moveOffset < 0;\n    // Will be used in a function to calculate how much the next road segment will\n    // be downscaled compared to the previous one because next segment is further\n    // into the road.\n    let downscaleIndex = 1;\n    // Based on the nearest segment and global offset calculate how much thi\n    //  nearest segment is offset from zero position. We are going to offset\n    // all of the following segments based on the same percentages.\n    let restFillPercent = Math.abs(moveOffset % NEAR_TEX_HEIGHT) / NEAR_TEX_HEIGHT;\n    let primFillPercent = 1 - restFillPercent;\n    // If we are going below zero swap the percentages because the other texture\n    // will be rendered first\n    if (isNegativeMoveOffset) {\n        primFillPercent = 1 - primFillPercent;\n        restFillPercent = 1 - restFillPercent;\n    }\n    // Figure out which texture is rendered first in the current loop based on the\n    // global offset\n    let primTextureIndex = Math.floor(Math.abs(state.moveOffset) / NEAR_TEX_HEIGHT) % 2;\n    // If we are going negative choose the other texture\n    if (isNegativeMoveOffset) {\n        primTextureIndex = 1 - primTextureIndex;\n    }\n    let currentY = 0;\n    let roadLeftToParse = roadHeight;\n    while (roadLeftToParse >= 0) {\n        const downscaleMultiplier = 1.3 / downscaleIndex;\n        const segmentHeight = Math.round(downscaleMultiplier * NEAR_TEX_HEIGHT);\n        // Segment is split into two sub-segments based on the global offset.\n        // Each segment has it's own texture.\n        const primTextureHeight = segmentHeight * primFillPercent;\n        const restTextureHeight = segmentHeight - primTextureHeight;\n        // Add both sub-segments as separate entries of their own height with\n        // corresponding texture indexes\n        if (primTextureHeight !== 0) {\n            heightList.push({\n                y: currentY,\n                y2: currentY + primTextureHeight,\n                height: primTextureHeight,\n                textureIndex: primTextureIndex,\n            });\n        }\n        if (restTextureHeight !== 0) {\n            heightList.push({\n                y: currentY + primTextureHeight,\n                y2: currentY + segmentHeight,\n                height: restTextureHeight,\n                textureIndex: 1 - primTextureIndex,\n            });\n        }\n        roadLeftToParse -= segmentHeight;\n        currentY += segmentHeight;\n        downscaleIndex++;\n        // Alernate to the other texture and make it primary\n        primTextureIndex = 1 - primTextureIndex;\n    }\n    return heightList;\n}\nmain();\n// @ts-ignore\nwindow.move = (moveOffset) => {\n    state.moveOffset = moveOffset;\n    draw();\n};\n\n\n//# sourceURL=webpack:///./src/main.ts?");

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