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

/***/ "./src/core/debug.ts":
/*!***************************!*\
  !*** ./src/core/debug.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"createButton\": () => (/* binding */ createButton),\n/* harmony export */   \"createLabel\": () => (/* binding */ createLabel),\n/* harmony export */   \"createNumberInput\": () => (/* binding */ createNumberInput),\n/* harmony export */   \"createSection\": () => (/* binding */ createSection)\n/* harmony export */ });\n// type DebugRangeItemConfig = {\n//   type: 'range';\n//   box: DebugBox;\n//   title?: string;\n//   initial?: number;\n//   min?: number;\n//   max?: number;\n//   step?: number;\n// };\n// export function createPanel({\n//   sections = [],\n//   parent = document.body,\n// }: DebugConfig) {\n//   const $container = document.createElement('div');\n//   sections.forEach((sectionConfig) => {\n//     const $section = createSection(sectionConfig);\n//     $container.appendChild($section);\n//   });\n//   parent.appendChild($container);\n//   const getValues = () => {};\n//   return {\n//     getValues,\n//   };\n// }\nfunction createSection({ title = '(section)', } = {}) {\n    const $section = document.createElement('fieldset');\n    const $title = document.createElement('legend');\n    $title.textContent = title;\n    $section.appendChild($title);\n    const addElement = ($element) => {\n        $section.appendChild($element);\n    };\n    return {\n        $element: $section,\n        addElement,\n    };\n}\n// function createRangeItem({\n//   title = '(range)',\n//   box,\n//   initial = 0,\n//   min = 0,\n//   max = 100,\n//   step = 1,\n// }: DebugRangeItemConfig) {\n//   const $container = document.createElement('div');\n//   const $title = document.createElement('span');\n//   $title.textContent = title;\n//   $container.appendChild($title);\n//   const $value = document.createElement('span');\n//   const updateValueText = () => {\n//     $value.textContent = $input.value;\n//   };\n//   const $input = document.createElement('input');\n//   $input.type = 'range';\n//   $input.min = min.toString();\n//   $input.max = max.toString();\n//   $input.step = step.toString();\n//   // $input.addEventListener('input', updateValueText);\n//   $container.appendChild($input);\n//   $container.appendChild($value);\n//   // box.attach($input, initial);\n//   // updateValueText();\n//   const getValue = () => {\n//     return $input.value;\n//   };\n//   return {\n//     $container,\n//     getValue,\n//   };\n// }\nfunction createButton({ title = '(button)', onClick = () => { }, }) {\n    const $button = document.createElement('button');\n    $button.style.marginRight = '5px';\n    $button.textContent = title;\n    $button.addEventListener('click', () => {\n        onClick();\n    });\n    return {\n        $element: $button,\n    };\n}\nfunction createNumberInput({ title = '(input)', value = 0, step = 1, onChange = () => { }, } = {}) {\n    const $container = document.createElement('span');\n    $container.style.marginRight = '10px';\n    const $title = document.createElement('span');\n    $title.textContent = title + ': ';\n    $container.appendChild($title);\n    const $input = document.createElement('input');\n    $input.type = 'number';\n    $input.value = value.toString();\n    $input.step = step.toString();\n    $input.style.width = '80px';\n    const getValue = () => {\n        return Number($input.value);\n    };\n    $input.addEventListener('input', () => {\n        onChange(getValue());\n    });\n    $container.appendChild($title);\n    $container.appendChild($input);\n    const getNumber = () => {\n        return $input.value;\n    };\n    return {\n        $element: $container,\n        getValue,\n    };\n}\nfunction createLabel({ title = '(text)' } = {}) {\n    const $container = document.createElement('span');\n    $container.style.marginRight = '10px';\n    const $title = document.createElement('span');\n    $title.textContent = `${title}: `;\n    $container.appendChild($title);\n    const $text = document.createElement('span');\n    $text.textContent = '(no value)';\n    $container.appendChild($text);\n    const update = (text) => {\n        $text.textContent = text;\n    };\n    return {\n        $element: $container,\n        update,\n    };\n}\n\n\n//# sourceURL=webpack:///./src/core/debug.ts?");

/***/ }),

/***/ "./src/curved_segment_width.ts":
/*!*************************************!*\
  !*** ./src/curved_segment_width.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"getCurvedWidthList\": () => (/* binding */ getCurvedWidthList)\n/* harmony export */ });\nconst turnSize = 500;\nconst list = [\n    // [turnSize, 100, 0.2],\n    // [turnSize, 90, 0.2],\n    [turnSize, 80, 0.2],\n    // [turnSize, 70, 0.2],\n    // [turnSize, 60, 0.05],\n    // [turnSize, 60, 0.1],\n    // [turnSize, 50, 0.05],\n    // [turnSize, 40, 0.05],\n    // [turnSize, 30, 0.05],\n    [0, 120, 0],\n];\nfunction lerp(entryIndex, offset) {\n    const entry = list[entryIndex];\n    const nextEntry = list[entryIndex - 1] || list[0];\n    const into = offset - entry[0];\n    const size = nextEntry[0] - entry[0];\n    const percent = into / size;\n    return [\n        entry[0] + into,\n        entry[1] + (nextEntry[1] - entry[1]) * percent,\n        entry[2] + (nextEntry[2] - entry[2]) * percent,\n    ];\n}\nfunction getCurvedWidthList({ roadHeight, imageWidth, moveOffset, turnStart, turnEnd, }) {\n    // console.log({ moveOffset, turnStart, turnEnd });\n    const inTurn = moveOffset > turnStart && moveOffset < turnEnd;\n    const isEntering = inTurn && moveOffset - turnStart < turnSize;\n    const isExiting = inTurn && turnEnd - moveOffset < turnSize;\n    const isProgress = inTurn && !isEntering && !isExiting;\n    const inTurnStart = moveOffset - turnStart;\n    let curveTopStart = 120;\n    let curveTopOffsetMult = 0;\n    if (isEntering) {\n        console.log('isEntering');\n        const offset = Math.max(0, moveOffset - turnStart);\n        const entryIndex = list.findIndex((e) => e[0] < offset);\n        const entry = list[entryIndex];\n        const l = lerp(entryIndex, offset);\n        curveTopStart = l[1];\n        curveTopOffsetMult = l[2];\n    }\n    if (isProgress) {\n        console.log('isProgress');\n        curveTopStart = list[0][1];\n        curveTopOffsetMult = list[0][2];\n    }\n    if (isExiting) {\n        console.log('isExiting');\n        const offset = turnEnd - moveOffset;\n        const entryIndex = list.findIndex((e) => e[0] < offset);\n        const entry = list[entryIndex];\n        const l = lerp(entryIndex, offset);\n        curveTopStart = l[1];\n        curveTopOffsetMult = l[2];\n    }\n    // const curveTopStart = 70; //roadHeight - curveTopStartBox.get();\n    // const curveBottomStart = curveBottomStartValue.get();\n    // const curveTopOffsetMult = 0.2; //curveTopOffsetMultBox.get();\n    const NEAR_WIDTH = 600;\n    const perIterationReduce = 2.3; //widthPerLineReduceBox.get();\n    let topOffset = 0;\n    let perIterationTopOffset = 0;\n    let bottomOffset = 0;\n    let perIterationBottomOffset = 0;\n    const widthList = [];\n    for (let i = 0; i <= roadHeight; i++) {\n        const widthReduce = i * perIterationReduce;\n        const straightX = imageWidth / 2 - NEAR_WIDTH / 2 + widthReduce;\n        const width = NEAR_WIDTH - widthReduce * 2;\n        const topCurveX = straightX - topOffset;\n        const bottomCurveX = straightX - bottomOffset;\n        // if (i <= curveBottomStart) {\n        //   widthList.push({\n        //     x: straightX,\n        //     width,\n        //   });\n        // } else\n        if (i >= curveTopStart) {\n            widthList.push({\n                x: topCurveX,\n                width,\n            });\n            topOffset += perIterationTopOffset;\n            perIterationTopOffset += curveTopOffsetMult;\n        }\n        else {\n            widthList.push({\n                x: straightX,\n                width,\n            });\n        }\n    }\n    return widthList;\n}\n\n\n//# sourceURL=webpack:///./src/curved_segment_width.ts?");

/***/ }),

/***/ "./src/install_debug.ts":
/*!******************************!*\
  !*** ./src/install_debug.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"installDebug\": () => (/* binding */ installDebug)\n/* harmony export */ });\n/* harmony import */ var _core_debug__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./core/debug */ \"./src/core/debug.ts\");\n\nfunction installDebug({ onMove, onSpeedChange, onAddTurn, }) {\n    const moveSection = (0,_core_debug__WEBPACK_IMPORTED_MODULE_0__.createSection)({ title: 'Move' });\n    const moveButton = (0,_core_debug__WEBPACK_IMPORTED_MODULE_0__.createButton)({\n        title: '+1',\n        onClick: () => {\n            onMove(1);\n        },\n    });\n    const moveOffsetLabel = (0,_core_debug__WEBPACK_IMPORTED_MODULE_0__.createLabel)({ title: 'Offset' });\n    const speedInput = (0,_core_debug__WEBPACK_IMPORTED_MODULE_0__.createNumberInput)({\n        title: 'Speed',\n        value: 3,\n        onChange: onSpeedChange,\n    });\n    moveSection.addElement(moveButton.$element);\n    moveSection.addElement(moveOffsetLabel.$element);\n    moveSection.addElement(speedInput.$element);\n    document.body.appendChild(moveSection.$element);\n    const turnSection = (0,_core_debug__WEBPACK_IMPORTED_MODULE_0__.createSection)({ title: 'Turn' });\n    const turnSizeInput = (0,_core_debug__WEBPACK_IMPORTED_MODULE_0__.createNumberInput)({\n        title: 'Size',\n        value: 1000,\n        step: 100,\n    });\n    const turnAddButton = (0,_core_debug__WEBPACK_IMPORTED_MODULE_0__.createButton)({\n        title: 'Add turn in 100',\n        onClick: () => {\n            onAddTurn({ offset: 100, size: turnSizeInput.getValue() });\n        },\n    });\n    turnSection.addElement(turnSizeInput.$element);\n    turnSection.addElement(turnAddButton.$element);\n    document.body.appendChild(turnSection.$element);\n    return {\n        updateMoveOffsetLabel: moveOffsetLabel.update,\n    };\n}\n\n\n//# sourceURL=webpack:///./src/install_debug.ts?");

/***/ }),

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _controls__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./controls */ \"./src/controls.ts\");\n/* harmony import */ var _segment_height__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./segment_height */ \"./src/segment_height.ts\");\n/* harmony import */ var _curved_segment_width__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./curved_segment_width */ \"./src/curved_segment_width.ts\");\n/* harmony import */ var _install_debug__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./install_debug */ \"./src/install_debug.ts\");\nvar __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\n    return new (P || (P = Promise))(function (resolve, reject) {\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n};\n\n\n\n\nconst canvas = document.querySelector('canvas');\nconst context = canvas.getContext('2d');\nconst IMAGE_WIDTH = 320;\nconst IMAGE_HEIGHT = 240;\nconst ROAD_IMAGE_WIDTH = 192;\ncanvas.width = IMAGE_WIDTH;\ncanvas.height = IMAGE_HEIGHT;\nconst { getKeys } = (0,_controls__WEBPACK_IMPORTED_MODULE_0__.listenKeyboard)();\nconst state = {\n    speed: 3,\n    moveOffset: 0,\n    nextTurn: undefined,\n};\nconst images = {\n    road2: undefined,\n};\nconst { updateMoveOffsetLabel } = (0,_install_debug__WEBPACK_IMPORTED_MODULE_3__.installDebug)({\n    onMove: move,\n    onAddTurn: addTurn,\n    onSpeedChange: (speed) => {\n        state.speed = speed;\n    },\n});\nfunction loadImage(imagePath) {\n    return __awaiter(this, void 0, void 0, function* () {\n        return new Promise((resolve) => {\n            const image = new Image();\n            image.src = imagePath;\n            image.addEventListener('load', () => {\n                resolve(image);\n            });\n        });\n    });\n}\nfunction main() {\n    return __awaiter(this, void 0, void 0, function* () {\n        images.road2 = yield loadImage('data/graphics/road2.png');\n        loop();\n    });\n}\nconst turnStart = 100;\nconst turnEnd = 1100;\nfunction loop() {\n    if (getKeys().includes(_controls__WEBPACK_IMPORTED_MODULE_0__.Keycodes.Up)) {\n        state.moveOffset += state.speed;\n    }\n    else if (getKeys().includes(_controls__WEBPACK_IMPORTED_MODULE_0__.Keycodes.Down)) {\n        state.moveOffset -= state.speed;\n    }\n    updateMoveOffsetLabel(state.moveOffset.toString());\n    draw();\n    requestAnimationFrame(loop);\n}\nfunction draw() {\n    const horizonY = IMAGE_HEIGHT / 2;\n    // Sky\n    context.fillStyle = '#88a';\n    context.fillRect(0, 0, IMAGE_WIDTH, horizonY);\n    // Ground\n    context.fillStyle = '#aa8';\n    context.fillRect(0, horizonY, IMAGE_WIDTH, IMAGE_HEIGHT - horizonY);\n    drawRoad();\n}\nfunction drawRoad() {\n    const horizonY = IMAGE_HEIGHT / 2;\n    const roadHeight = IMAGE_HEIGHT - horizonY;\n    const { moveOffset, nextTurn } = state;\n    const widthList = (0,_curved_segment_width__WEBPACK_IMPORTED_MODULE_2__.getCurvedWidthList)({\n        roadHeight,\n        imageWidth: IMAGE_WIDTH,\n        moveOffset,\n        turnStart: nextTurn === null || nextTurn === void 0 ? void 0 : nextTurn.start,\n        turnEnd: nextTurn === null || nextTurn === void 0 ? void 0 : nextTurn.end,\n    });\n    const heightList = (0,_segment_height__WEBPACK_IMPORTED_MODULE_1__.getSegmentHeightList)({\n        roadHeight,\n        moveOffset,\n    });\n    const getTextureIndexForY = (y) => {\n        for (let i = 0; i < heightList.length; i++) {\n            const heightEntry = heightList[i];\n            if (heightEntry.y <= y && heightEntry.y2 >= y) {\n                return heightEntry.textureIndex;\n            }\n        }\n        throw new Error(`Could not find height entry for y=${y}`);\n    };\n    const groundColors = ['#aa8', '#aa8'];\n    const textureSources = [\n        { y: 0, height: 1 },\n        { y: 33, height: 1 },\n    ];\n    for (let y = 0; y <= roadHeight; y++) {\n        const sourceX = 0;\n        const sourceW = ROAD_IMAGE_WIDTH;\n        const { x: destX, width: destW } = widthList[y];\n        const textureIndex = getTextureIndexForY(y);\n        const sourceY = textureSources[textureIndex].y;\n        const sourceH = textureSources[textureIndex].height;\n        const destY = IMAGE_HEIGHT - y;\n        const destH = 1;\n        context.fillStyle = groundColors[textureIndex];\n        context.fillRect(0, IMAGE_HEIGHT - y, IMAGE_WIDTH, 1);\n        context.drawImage(images.road2, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH);\n    }\n}\nfunction move(moveOffset) {\n    state.moveOffset += moveOffset;\n    draw();\n}\nfunction addTurn({ offset, size }) {\n    state.nextTurn = {\n        start: state.moveOffset + offset,\n        end: state.moveOffset + offset + size,\n    };\n}\nmain();\n// @ts-ignore\nwindow.move = (moveOffset) => {\n    move(moveOffset);\n};\n\n\n//# sourceURL=webpack:///./src/main.ts?");

/***/ }),

/***/ "./src/segment_height.ts":
/*!*******************************!*\
  !*** ./src/segment_height.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"getSegmentHeightList\": () => (/* binding */ getSegmentHeightList)\n/* harmony export */ });\nfunction getSegmentHeightList({ roadHeight, moveOffset, nearTextureHeight = 32, }) {\n    const heightList = [];\n    // const { moveOffset } = state;\n    const isNegativeMoveOffset = moveOffset < 0;\n    // Will be used in a function to calculate how much the next road segment will\n    // be downscaled compared to the previous one because next segment is further\n    // into the road.\n    let downscaleIndex = 1;\n    // Based on the nearest segment and global offset calculate how much thi\n    //  nearest segment is offset from zero position. We are going to offset\n    // all of the following segments based on the same percentages.\n    let restFillPercent = Math.abs(moveOffset % nearTextureHeight) / nearTextureHeight;\n    let primFillPercent = 1 - restFillPercent;\n    // If we are going below zero swap the percentages because the other texture\n    // will be rendered first\n    if (isNegativeMoveOffset) {\n        primFillPercent = 1 - primFillPercent;\n        restFillPercent = 1 - restFillPercent;\n    }\n    // Figure out which texture is rendered first in the current loop based on the\n    // global offset\n    let primTextureIndex = Math.floor(Math.abs(moveOffset) / nearTextureHeight) % 2;\n    // If we are going negative choose the other texture\n    if (isNegativeMoveOffset) {\n        primTextureIndex = 1 - primTextureIndex;\n    }\n    let currentY = 0;\n    let roadLeftToParse = roadHeight;\n    while (roadLeftToParse >= 0) {\n        const downscaleMultiplier = 1.3 / downscaleIndex;\n        const segmentHeight = Math.round(downscaleMultiplier * nearTextureHeight);\n        // Segment is split into two sub-segments based on the global offset.\n        // Each segment has it's own texture.\n        const primTextureHeight = segmentHeight * primFillPercent;\n        const restTextureHeight = segmentHeight - primTextureHeight;\n        // Add both sub-segments as separate entries of their own height with\n        // corresponding texture indexes\n        if (primTextureHeight !== 0) {\n            heightList.push({\n                y: currentY,\n                y2: currentY + primTextureHeight,\n                height: primTextureHeight,\n                textureIndex: primTextureIndex,\n            });\n        }\n        if (restTextureHeight !== 0) {\n            heightList.push({\n                y: currentY + primTextureHeight,\n                y2: currentY + segmentHeight,\n                height: restTextureHeight,\n                textureIndex: 1 - primTextureIndex,\n            });\n        }\n        roadLeftToParse -= segmentHeight;\n        currentY += segmentHeight;\n        downscaleIndex++;\n        // Alernate to the other texture and make it primary\n        primTextureIndex = 1 - primTextureIndex;\n    }\n    return heightList;\n}\n\n\n//# sourceURL=webpack:///./src/segment_height.ts?");

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