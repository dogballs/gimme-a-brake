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

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _controls__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./controls */ \"./src/controls.ts\");\n\nconst canvas = document.querySelector('canvas');\nconst ctx = canvas.getContext('2d');\nconst IW = 380;\nconst IH = 200;\nconst HW = IW / 2; // half = 190\nconst HH = IH / 2; // half = 100\ncanvas.width = IW;\ncanvas.height = IH;\ncanvas.addEventListener('click', (ev) => {\n    console.log(ev.clientX / 2, ev.clientY / 2);\n});\nconst { getKeys } = (0,_controls__WEBPACK_IMPORTED_MODULE_0__.listenKeyboard)();\nconst state = {\n    speed: 3,\n    moveOffset: 0,\n};\nconst straightFragment = {\n    left: [0, 150, 180, 100],\n    right: [380, 150, 200, 100],\n    end: 0,\n};\nconst config = {\n    sections: [\n        {\n            kind: 'uphill',\n            start: 100,\n            size: 700,\n            steepness: 30,\n        },\n        {\n            kind: 'turn-left',\n            start: 1000,\n            size: 600,\n        },\n        {\n            kind: 'turn-right',\n            start: 1500,\n            size: 1000,\n        },\n        {\n            kind: 'downhill',\n            start: 2600,\n            size: 700,\n            steepness: 50,\n        },\n    ],\n};\nfunction draw() {\n    ctx.clearRect(0, 0, IW, IH);\n    grid();\n    // drawPath({ ...straightFragment, color: 'yellow' });\n    // drawPath({ ...turn1Fragments[3], color: 'blue' });\n    // drawPath(turn1Fragments[4]);\n    // return;\n    // const path = transitionFragments(f1, f2, f1.end + state.moveOffset);\n    // const fragments = createUphill({\n    //   size: 500,\n    //   inOffset: state.moveOffset,\n    //   steepness: 30,\n    // });\n    // const fr = fragments[0];\n    // drawPath(fr);\n    // drawHorizon({ yOverride: fr.left[3] });\n    // drawInfo();\n    // return;\n    let activeSection = config.sections.find((s) => {\n        return state.moveOffset >= s.start && state.moveOffset <= s.start + s.size;\n    });\n    if (!activeSection || hasSectionEnded(activeSection)) {\n        activeSection = { start: state.moveOffset, kind: 'straight', size: 0 };\n    }\n    const inSectionOffset = state.moveOffset - activeSection.start;\n    drawInfo({ section: activeSection.kind });\n    if (activeSection.kind === 'straight') {\n        drawHorizon();\n        drawPath(straightFragment);\n        return;\n    }\n    if (activeSection.kind === 'turn-right' ||\n        activeSection.kind === 'turn-left') {\n        const fragments = createTurn({\n            size: activeSection.size,\n            direction: activeSection.kind === 'turn-right' ? 'right' : 'left',\n        });\n        const path = lerpSectionFragments({\n            fragments,\n            inSectionOffset,\n        });\n        drawHorizon();\n        drawPath(path);\n        return;\n    }\n    if (activeSection.kind === 'downhill') {\n        const fragments = createDownhill({\n            size: activeSection.size,\n            inOffset: inSectionOffset,\n            steepness: activeSection.steepness,\n        });\n        const path = lerpSectionFragments({ fragments, inSectionOffset });\n        const yOverride = path.left[3];\n        drawHorizon({ yOverride });\n        drawPath(path);\n        return;\n    }\n    if (activeSection.kind === 'uphill') {\n        const fragments = createUphill({\n            size: activeSection.size,\n            inOffset: inSectionOffset,\n            steepness: activeSection.steepness,\n        });\n        const path = lerpSectionFragments({ fragments, inSectionOffset });\n        const yOverride = path.left[3];\n        drawHorizon({ yOverride });\n        drawPath(path);\n        return;\n    }\n}\nfunction lerpSectionFragments({ fragments, inSectionOffset, }) {\n    const activeIndex = fragments.findIndex((fragment) => {\n        return inSectionOffset < fragment.end;\n    });\n    const prevIndex = activeIndex !== -1 ? activeIndex - 1 : -1;\n    const prevFragment = fragments[prevIndex] || straightFragment;\n    const activeFragment = fragments[activeIndex] || straightFragment;\n    let d = 0;\n    const fragmentSize = activeFragment.end - prevFragment.end;\n    const inFragmentOffset = inSectionOffset - prevFragment.end;\n    if (fragmentSize !== 0) {\n        d = inFragmentOffset / fragmentSize;\n    }\n    const path = lerpPath(prevFragment, activeFragment, d);\n    return path;\n}\nfunction hasSectionEnded(section) {\n    return section.start + section.size < state.moveOffset;\n}\nfunction createDownhill({ size, steepness, inOffset, }) {\n    const halfSize = size / 2;\n    const d = 1 - Math.abs((inOffset - halfSize) / halfSize);\n    const yOffset = -steepness * d;\n    const y = HH + yOffset;\n    const minY = HH - steepness;\n    return [\n        {\n            left: [180, 100, 180, y],\n            right: [200, 100, 200, y],\n            end: 100,\n        },\n        {\n            left: [180, 110, 180, minY],\n            right: [200, 110, 200, minY],\n            end: 200,\n        },\n        {\n            left: [180, 100, 180, minY],\n            right: [200, 100, 200, minY],\n            end: size - 200,\n        },\n        {\n            left: [120, 120, 180, y],\n            right: [260, 120, 200, y],\n            end: size,\n        },\n    ];\n}\nfunction createUphill({ size, steepness, inOffset, }) {\n    const halfSize = size / 2;\n    const d = 1 - Math.abs((inOffset - halfSize) / halfSize);\n    const yOffset = steepness * d;\n    const y = HH + yOffset;\n    const maxY = HH + steepness;\n    return [\n        {\n            left: [120, y, 140, y],\n            right: [260, y, 240, y],\n            end: 200,\n        },\n        {\n            left: [60, 130, 100, maxY],\n            right: [320, 130, 280, maxY],\n            end: 300,\n        },\n        {\n            left: [60, 130, 100, maxY],\n            right: [320, 130, 280, maxY],\n            end: size - 200,\n        },\n        Object.assign(Object.assign({}, straightFragment), { end: size }),\n    ];\n}\nfunction createTurn({ size, direction, }) {\n    console.assert(size >= 600, 'turn too quick: %d', size);\n    const fragments = [\n        {\n            left: [180, 95, 180, 100],\n            right: [380, 150, 200, 100],\n            end: 100,\n        },\n        {\n            left: [180, 95, 210, 100],\n            right: [170, 95, 220, 100],\n            end: 200,\n        },\n        {\n            left: [180, 95, 305, 100],\n            right: [220, 100, 305, 100],\n            end: 300,\n        },\n        {\n            left: [180, 100, 270, 100],\n            right: [200, 105, 305, 100],\n            end: size - 200,\n        },\n        {\n            left: [200, 100, 250, 100],\n            right: [270, 120, 290, 100],\n            end: size - 100,\n        },\n        Object.assign(Object.assign({}, straightFragment), { end: size }),\n    ];\n    if (direction === 'left') {\n        return mirrorFragments(fragments);\n    }\n    return fragments;\n}\nfunction mirrorFragments(fragments) {\n    return fragments.map((f) => {\n        const l = f.left;\n        const r = f.right;\n        return Object.assign(Object.assign({}, f), { left: [HW + (HW - r[0]), r[1], HW + (HW - r[2]), r[3]], right: [HW + (HW - l[0]), l[1], HW + (HW - l[2]), l[3]] });\n    });\n}\nfunction transitionFragments(f1, f2, inSectionOffset) {\n    const size = f2.end - f1.end;\n    const internalOffset = inSectionOffset - f1.end;\n    let d = 0;\n    if (size !== 0) {\n        d = internalOffset / size;\n    }\n    return lerpPath(f1, f2, d);\n}\nfunction lerpPath(p1, p2, d) {\n    return {\n        left: lerpLine(p1.left, p2.left, d),\n        right: lerpLine(p1.right, p2.right, d),\n    };\n}\nfunction lerpLine(l1, l2, d) {\n    console.assert(d >= 0 && d <= 1, 'd must be normalized: %d', d);\n    const cpx = l1[0] + (l2[0] - l1[0]) * d;\n    const cpy = l1[1] + (l2[1] - l1[1]) * d;\n    const x = l1[2] + (l2[2] - l1[2]) * d;\n    const y = l1[3] + (l2[3] - l1[3]) * d;\n    return [cpx, cpy, x, y];\n}\nfunction drawHorizon({ yOverride } = {}) {\n    ctx.strokeStyle = 'green';\n    ctx.setLineDash([]);\n    ctx.beginPath();\n    ctx.moveTo(0, yOverride !== null && yOverride !== void 0 ? yOverride : HH);\n    ctx.lineTo(IW, yOverride !== null && yOverride !== void 0 ? yOverride : HH);\n    ctx.stroke();\n}\nfunction grid() {\n    ctx.setLineDash([]);\n    ctx.strokeStyle = '#cccccc77';\n    ctx.moveTo(HW, 0);\n    ctx.lineTo(HW, IH);\n    ctx.stroke();\n}\nfunction drawInfo({ section } = {}) {\n    ctx.strokeStyle = '#000';\n    ctx.font = '8px serif';\n    ctx.strokeText(`move offset: ${state.moveOffset}`, 5, 10);\n    if (section) {\n        ctx.strokeText(`section kind: ${section}`, 5, 20);\n    }\n}\nfunction drawPath({ left, right, color = 'red', }) {\n    ctx.strokeStyle = color;\n    ctx.setLineDash([10]);\n    ctx.lineDashOffset = state.moveOffset;\n    ctx.beginPath();\n    ctx.moveTo(0, 150);\n    ctx.quadraticCurveTo(...left);\n    ctx.stroke();\n    ctx.beginPath();\n    ctx.moveTo(380, 150);\n    ctx.quadraticCurveTo(...right);\n    ctx.stroke();\n}\nfunction main() {\n    loop();\n}\nfunction loop() {\n    if (getKeys().includes(_controls__WEBPACK_IMPORTED_MODULE_0__.Keycodes.Up)) {\n        state.moveOffset += state.speed;\n    }\n    else if (getKeys().includes(_controls__WEBPACK_IMPORTED_MODULE_0__.Keycodes.Down)) {\n        state.moveOffset -= state.speed;\n    }\n    draw();\n    requestAnimationFrame(loop);\n}\nmain();\n\n\n//# sourceURL=webpack:///./src/main.ts?");

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