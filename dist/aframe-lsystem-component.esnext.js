/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	if (typeof AFRAME === 'undefined') {
	  throw new Error('Component attempted to register before AFRAME was available.');
	}

	var LSystem;

	// As we use webpack for compiling the source, it's used to bundle the
	// web worker into a blob via: https://github.com/webpack/worker-loader
	// Which works without additional changes, besides using `require` inside
	// the worker instead of importScripts().
	var LSystemWorker = __webpack_require__(1);

	function stripLeadingEnding(s) {
	  let start = 0;
	  let end = s.length - 1;
	  while(/\s/g.test(s[start])) {start++}
	  while(/\s/g.test(s[end])) {end--}
	  return s.substring(start, end + 1);
	}

	/**
	 * Lindenmayer-System component for A-Frame.
	 */
	AFRAME.registerComponent('lsystem', {
	  schema: {

	    axiom: {
	      type: 'string',
	      default: 'F'
	    },

	    productions: {
	      default: 'F:FF',
	      // return an array of production tuples ([[from, to], ['F', 'F+F']])
	      parse: function (value) {
	        return value.split(' ').map(function (splitValue) {
	          return splitValue.split(':');
	        })
	      }
	    },

	    // A: [blue line, red line, yellow line] B: red line

	    segmentMixins: {
	      type: 'string',
	      parse: function (value) {

	        let fromIndex = 0;
	        let currentIndex = value.indexOf(':', fromIndex);
	        let mixinsForSymbol = new Map();
	        while(currentIndex !== -1) {
	        	fromIndex = currentIndex+1;
	        	let newCurrentIndex = value.indexOf(':', fromIndex);
	        	let symbol = value.slice(currentIndex-1, currentIndex);
	        	let mixinlist = value.slice(currentIndex+1, newCurrentIndex === -1 ? value.length : newCurrentIndex-1).replace(/[\[\]]/g, '').split(',').map(stripLeadingEnding);
	        	mixinsForSymbol.set(symbol, mixinlist)
	        	currentIndex = newCurrentIndex;
	        }
	        return mixinsForSymbol;
	      }
	    },

	    iterations: {
	      type: 'int',
	      default: 1
	    },

	    angle: {
	      default: 90.0
	    },

	    translateAxis: {
	      type: 'string',
	      default: 'y',
	      parse: function(value) {
	        value = value.toLowerCase();
	        if (value === 'x') {
	          return new THREE.Vector3(1, 0, 0);
	        } else if (value === 'y') {
	          return new THREE.Vector3(0, 1, 0);
	        } else if (value === 'z') {
	          return new THREE.Vector3(0, 0, 1);
	        } else {
	          throw new Error('translateAxis has to be a string: "x", "y" or "z"');
	        }
	      }
	    },
	    
	    scaleFactor: {
	      default: 1.0
	    },

	    dynamicSegmentLength: {
	      default: true
	    },

	    mergeGeometries: {
	      type: 'boolean',
	      default: true
	    },

	    functionsInProductions: {
	      type: 'boolean',
	      default: true
	    }
	  },

	  /**
	   * Called once when component is attached. Generally for initial setup.
	   */
	  init: function () {
	    if(LSystem === undefined) {
	      LSystem = __webpack_require__(3);
	    }

	    this.sceneEl = document.querySelector('a-scene');

	    let self = this;

	    this.initWorker();

	    this.X = new THREE.Vector3(1, 0, 0);
	    this.Y = new THREE.Vector3(0, 1, 0);
	    this.Z = new THREE.Vector3(0, 0, 1);
	    this.xPosRotation = new THREE.Quaternion();
	    this.xNegRotation = new THREE.Quaternion();
	    this.yPosRotation = new THREE.Quaternion();
	    this.yNegRotation = new THREE.Quaternion();
	    this.zPosRotation = new THREE.Quaternion();
	    this.zNegRotation = new THREE.Quaternion();
	    this.yReverseRotation = new THREE.Quaternion();
	    this.xPosRotation = new THREE.Quaternion();
	    this.xNegRotation = new THREE.Quaternion();
	    this.yPosRotation = new THREE.Quaternion();
	    this.yNegRotation = new THREE.Quaternion();
	    this.zPosRotation = new THREE.Quaternion();
	    this.zNegRotation = new THREE.Quaternion();
	    this.yReverseRotation = new THREE.Quaternion();
	    this.segmentLengthFactor = 1.0;
	    
	    let scaleFactor = self.data.scaleFactor;
	    
	    this.LSystem = new LSystem({
	      axiom: 'F',
	      productions: {'F': 'F'},
	      finals: {
	        /* As a default F is already defined as final, new ones get added automatically
	          by parsing the segment mixins. If no segment mixin for any symbol is defined
	          it wont get a final function and therefore not render.
	         */
	        '+': () => { self.transformationSegment.quaternion.multiply(self.yPosRotation)},
	        '-': () => { self.transformationSegment.quaternion.multiply(self.yNegRotation)},
	        '&': () => { self.transformationSegment.quaternion.multiply(self.zNegRotation)},
	        '^': () => { self.transformationSegment.quaternion.multiply(self.zPosRotation)},
	        '\\': () =>{ self.transformationSegment.quaternion.multiply(self.xNegRotation)},
	        '<': () => { self.transformationSegment.quaternion.multiply(self.xNegRotation)},
	        '/': () => { self.transformationSegment.quaternion.multiply(self.xPosRotation)},
	        '>': () => { self.transformationSegment.quaternion.multiply(self.xPosRotation)},
	        '|': () => { self.transformationSegment.quaternion.multiply(self.yReverseRotation)},
	        '!': () => {
	          self.segmentLengthFactor *= scaleFactor;
	          self.transformationSegment.scale.set(
	          self.transformationSegment.scale.x *= scaleFactor, self.transformationSegment.scale.y *= scaleFactor, self.transformationSegment.scale.z *= scaleFactor
	        );
	          self.colorIndex++;
	        },
	        '\'': () => {
	          self.segmentLengthFactor *= (1.0 / scaleFactor);
	          self.transformationSegment.scale.set(
	          self.transformationSegment.scale.x *= (1.0 / scaleFactor), self.transformationSegment.scale.y *= (1.0 / scaleFactor), self.transformationSegment.scale.z *= (1.0 / scaleFactor)
	          );
	          self.colorIndex = Math.max(0, self.colorIndex - 1);
	        },
	        '[': () => { self.stack.push(self.transformationSegment.clone()) },
	        ']': () => { self.transformationSegment = self.stack.pop() }
	      }
	    });

	  },

	  /**
	   * Called when component is attached and when component data changes.
	   * Generally modifies the entity based on the data.
	   */
	  update: function (oldData) {
	    // var diffData = diff(data, oldData || {});
	    // console.log(diffData);

	    // TODO: Check if only angle changed or axiom or productions
	    //
	    let self = this;


	    if(this.data.mergeGeometries === false && this.segmentElementGroupsMap !== undefined) {
	      for (let segmentElGroup of this.segmentElementGroupsMap.values()) {
	        segmentElGroup.removeObject3D('mesh');
	        segmentElGroup.innerHTML = '';
	      }
	    }

	    if(Object.keys(oldData).length === 0) {
	      this.updateLSystem();
	      this.updateSegmentMixins();
	      this.updateTurtleGraphics();

	    } else {

	      let visualChange = false;

	      if((oldData.axiom && oldData.axiom !== this.data.axiom) || (oldData.iterations && oldData.iterations !== this.data.iterations) || (oldData.productions && JSON.stringify(oldData.productions) !== JSON.stringify(this.data.productions))) {

	        this.updateLSystem();
	        visualChange = true;

	      }

	      if (oldData.segmentMixins !== undefined && JSON.stringify(Array.from(oldData.segmentMixins.entries())) !== JSON.stringify(Array.from(this.data.segmentMixins.entries())) ) {
	        this.updateSegmentMixins();
	        visualChange = true;


	      }

	     if(visualChange || oldData.angle && oldData.angle !== this.data.angle) {

	      this.updateTurtleGraphics();

	    } else {
	      // console.log('nothing changed in update?');
	      // this.updateLSystem();
	      // this.updateSegmentMixins();
	    }
	  }

	  },

	  // if this.dynamicSegmentLength===true use this function to set the length
	  // depending on segments geometries bbox
	  calculateSegmentLength: function (mixin, geometry) {
	    if(this.segmentLengthMap.has(mixin)) return this.segmentLengthMap.get(mixin);
	    geometry.computeBoundingBox();
	    let segmentLength;
	    if (this.data.translateAxis.equals(this.X) ) {
	      segmentLength = Math.abs(geometry.boundingBox.min.x - geometry.boundingBox.max.x);
	    } else if (this.data.translateAxis.equals(this.Y)) {
	      segmentLength = Math.abs(geometry.boundingBox.min.y - geometry.boundingBox.max.y);
	    } else if (this.data.translateAxis.equals(this.Z)) {
	      segmentLength = Math.abs(geometry.boundingBox.min.z - geometry.boundingBox.max.z);
	    }
	    this.segmentLengthMap.set(mixin, segmentLength);
	    return segmentLength;

	  },

	  initWorker: function() {
	    this.worker = new LSystemWorker();
	  },

	  pushSegment: function(symbol) {

	    let self = this;
	    let currentQuaternion = self.transformationSegment.quaternion.clone();
	    let currentPosition = self.transformationSegment.position.clone();
	    let currentScale = self.transformationSegment.scale.clone();

	    // Cap colorIndex to maximum mixins defined for the symbol.
	    let cappedColorIndex = Math.min(this.colorIndex, this.data.segmentMixins.get(symbol).length - 1);

	    let mixin = this.mixinMap.get(symbol + cappedColorIndex);

	    if(this.data.mergeGeometries === false) {
	      let newSegment = document.createElement('a-entity');
	      newSegment.setAttribute('mixin', mixin);

	      newSegment.addEventListener('loaded', function (e) {
	        // Offset child element of object3D, to rotate around end point
	        // IMPORTANT: It may change that A-Frame puts objects into a group

	        let segmentLength = self.segmentLengthMap.get(mixin);

	        newSegment.object3D.children[0].translateOnAxis(self.data.translateAxis, (segmentLength * self.segmentLengthFactor) / 2);
	        newSegment.object3D.quaternion.copy(currentQuaternion);
	        newSegment.object3D.position.copy(currentPosition);
	        newSegment.object3D.scale.copy(currentScale);
	      });
	      this.segmentElementGroupsMap.get(symbol + cappedColorIndex).appendChild(newSegment);

	    } else {
	      let segmentObject3D = this.segmentObjects3DMap.get(symbol + cappedColorIndex);
	      let newSegmentObject3D = segmentObject3D.clone();
	      newSegmentObject3D.quaternion.copy(currentQuaternion);
	      newSegmentObject3D.position.copy(currentPosition);
	      newSegmentObject3D.scale.copy(currentScale);
	      newSegmentObject3D.matrixAutoUpdate = false;
	      newSegmentObject3D.updateMatrix();
	      this.mergeGroups.get(symbol + cappedColorIndex).geometry.merge(newSegmentObject3D.geometry, newSegmentObject3D.matrix);
	    }
	    let segmentLength = this.segmentLengthMap.get(mixin);
	    this.transformationSegment.translateOnAxis(this.data.translateAxis, segmentLength * this.segmentLengthFactor);
	  },

	  updateLSystem: function () {
	    let self = this;

	    // post params to worker
	    let params = {
	      axiom: this.data.axiom,
	      productions: this.data.productions,
	      iterations: this.data.iterations
	    };

	    if(Date.now() - this.worker.startTime > 1000 ) {
	      // if we got user input, but worker is running for over a second
	      // terminate old worker and start new one.
	      this.worker.terminate();
	      this.initWorker();
	    }

	    this.worker.startTime = Date.now();

	    this.workerPromise = new Promise((resolve, reject) => {

	      this.worker.onmessage = (e) => {
	        console.log(e);
	        self.LSystem.setAxiom(e.data.result);
	        resolve();
	      }
	    });

	    this.worker.postMessage(params);
	    return this.workerPromise;
	  },

	  updateSegmentMixins: function () {
	    console.log('update mixins');
	    let self = this;

	    this.el.innerHTML = '';

	    // Map for remembering the elements holding differnt segment types
	    this.segmentElementGroupsMap = new Map();


	    this.mixinMap = new Map();
	    // Construct a map with keys = `symbol + colorIndex` from data.segmentMixins
	    for (let [symbol, mixinList] of this.data.segmentMixins) {
	      for (let i = 0; i < mixinList.length; i++) {
	        this.mixinMap.set(symbol + i, mixinList[i]);
	      }
	    }

	    // Map for buffering geometries for use in pushSegments()
	    // when merging geometries ourselves and not by appending a `mixin` attributes,
	    // as done with `mergeGeometry = false`.
	    this.segmentObjects3DMap = new Map();

	    this.segmentLengthMap = new Map();
	    this.mergeGroups = new Map();

	    this.mixinPromises = [];


	    // Collect mixin info by pre-appending segment elements with their mixin
	    // Then use the generated geometry etc.
	    if(this.data.segmentMixins && this.data.segmentMixins.length !== 0) {

	      // Go through every symbols segmentMixins as defined by user
	      for (let el of this.data.segmentMixins) {
	        let [symbol, mixinList] = el;
	        // Set final functions for each symbol that has a mixin defined
	        this.LSystem.setFinal(symbol, () => {self.pushSegment.bind(self, symbol)()});

	        // And iterate the MixinList to buffer the segments or calculate segment lengths…
	        for (let i = 0; i < mixinList.length; i++) {
	          let mixinColorIndex = i;
	          let mixin = mixinList[mixinColorIndex];
	          
	          self.mixinPromises.push(new Promise((resolve, reject) => {
	            // Save mixinColorIndex for async promise below.

	            let segmentElGroup = document.createElement('a-entity');
	            segmentElGroup.setAttribute('id', mixin + '-group-' + mixinColorIndex + Math.floor(Math.random() * 10000));

	            // TODO: Put it all under this.mergeData
	            segmentElGroup.setAttribute('geometry', 'buffer', false);
	            segmentElGroup.setAttribute('mixin', mixin);
	            segmentElGroup.addEventListener('loaded', function (e) {
	              let segmentObject = segmentElGroup.getObject3D('mesh').clone();

	              // Make sure the geometry is actually unique
	              // AFrame sets the same geometry for multiple entities. As we modify
	              // the geometry per entity we need to have unique geometry instances.
	              segmentElGroup.getObject3D('mesh').geometry.dispose();
	              segmentObject.geometry = (segmentObject.geometry.clone());

	              let segmentLength = self.calculateSegmentLength(mixin, segmentObject.geometry);

	              // Do some additional stuff like buffering 3D objects / geometry
	              // if we want to merge geometries.
	              if(self.data.mergeGeometries === true) {

	                // Offset geometry by half segmentLength to get the rotation point right.

	                let translation = self.data.translateAxis.clone().multiplyScalar((segmentLength * self.segmentLengthFactor)/2);
	                segmentObject.geometry.applyMatrix( new THREE.Matrix4().makeTranslation( translation.x, translation.y, translation.z ) );
	                self.segmentObjects3DMap.set(symbol + mixinColorIndex, segmentObject );

	              }

	              segmentElGroup.removeObject3D('mesh');
	              resolve();
	            });


	            if(this.segmentElementGroupsMap.has(symbol + mixinColorIndex)) {
	              let previousElGroup = this.segmentElementGroupsMap.get(symbol + mixinColorIndex);
	              this.segmentElementGroupsMap.delete(symbol + mixinColorIndex);
	              this.el.removeChild(previousElGroup);
	            }

	            this.segmentElementGroupsMap.set(symbol + mixinColorIndex, segmentElGroup);
	            this.el.appendChild(segmentElGroup);


	          }));
	        }
	      }
	    }
	  },

	  updateTurtleGraphics: function() {
	      // console.log(...this.mixinPromises);
	    Promise.all([...this.mixinPromises, this.workerPromise]).then(() => {
	      // console.log('update turtle graphics graphics');
	    //  this.el.removeObject3D('mesh');
	      // The main segment used for saving transformations (rotation, translation, scale(?))
	      this.transformationSegment = new THREE.Object3D();

	      // set merge groups
	      if(this.data.mergeGeometries === true)
	      for (let [id, segmentObject] of this.segmentObjects3DMap) {
	        this.mergeGroups.set(id, new THREE.Mesh(
	          new THREE.Geometry(), segmentObject.material
	        ));

	      }


	      // We push copies of this.transformationSegment on branch symbols inside this array.
	      this.stack = [];

	      this.colorIndex = 0;
	      this.lineWidth = 0.0005;
	      this.lineLength = 0.125;

	      let angle = this.data.angle;

	      // Set quaternions based on angle slider
	      this.xPosRotation.setFromAxisAngle( this.X, (Math.PI / 180) * angle );
	      this.xNegRotation.setFromAxisAngle( this.X, (Math.PI / 180) * -angle );

	      this.yPosRotation.setFromAxisAngle( this.Y, (Math.PI / 180) * angle );
	      this.yNegRotation.setFromAxisAngle( this.Y, (Math.PI / 180) * -angle );
	      this.yReverseRotation.setFromAxisAngle( this.Y, (Math.PI / 180) * 180 );

	      this.zPosRotation.setFromAxisAngle( this.Z, (Math.PI / 180) * angle );
	      this.zNegRotation.setFromAxisAngle( this.Z, (Math.PI / 180) * -angle );
	      //
	      // this.geometry = new THREE.CylinderGeometry(this.lineWidth, this.lineWidth, self.data.lineLength, 3);
	      // this.geometry.rotateZ((Math.PI / 180) * 90);
	      // this.geometry.translate( -(this.data.segmentLength/2), 0, 0 );
	      // for (let face of this.geometry.faces) {
	      // 	face.color.setHex(this.colors[colorIndex]);
	      // }
	      // this.geometry.colorsNeedUpdate = true;

	      this.LSystem.final();
	      // finally set the merged meshes to be visible.
	      if(this.data.mergeGeometries === true) {
	        for (let tuple of this.segmentElementGroupsMap) {
	          let [symbolWithColorIndex, elGroup] = tuple;

	          let mergeGroup = this.mergeGroups.get(symbolWithColorIndex);
	          // Remove unused element groups inside our element
	          if(mergeGroup.geometry.vertices.length === 0) {
	            this.el.removeChild(elGroup);
	          } else {
	            elGroup.setObject3D('mesh', this.mergeGroups.get(symbolWithColorIndex));
	            elGroup.setAttribute('mixin', this.mixinMap.get(symbolWithColorIndex));
	          }
	        }
	      }

	    });
	  },
	  /**
	   * Called when a component is removed (e.g., via removeAttribute).
	   * Generally undoes all modifications to the entity.
	   */
	  remove: function () {

	  },

	  /**
	   * Called on each scene tick.
	   */
	   tick: function (t) {
	    //  console.log(this.parentEl === undefined);
	    //  console.log('\nTICK\n', t);
	   },

	  /**
	   * Called when entity pauses.
	   * Use to stop or remove any dynamic or background behavior such as events.
	   */
	  pause: function () {
	  },

	  /**
	   * Called when entity resumes.
	   * Use to continue or add any dynamic or background behavior such as events.
	   */
	  play: function () {
	  },
	});


	__webpack_require__(4);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = function() {
		return __webpack_require__(2)("/******/ (function(modules) { // webpackBootstrap\n/******/ \t// The module cache\n/******/ \tvar installedModules = {};\n\n/******/ \t// The require function\n/******/ \tfunction __webpack_require__(moduleId) {\n\n/******/ \t\t// Check if module is in cache\n/******/ \t\tif(installedModules[moduleId])\n/******/ \t\t\treturn installedModules[moduleId].exports;\n\n/******/ \t\t// Create a new module (and put it into the cache)\n/******/ \t\tvar module = installedModules[moduleId] = {\n/******/ \t\t\texports: {},\n/******/ \t\t\tid: moduleId,\n/******/ \t\t\tloaded: false\n/******/ \t\t};\n\n/******/ \t\t// Execute the module function\n/******/ \t\tmodules[moduleId].call(module.exports, module, module.exports, __webpack_require__);\n\n/******/ \t\t// Flag the module as loaded\n/******/ \t\tmodule.loaded = true;\n\n/******/ \t\t// Return the exports of the module\n/******/ \t\treturn module.exports;\n/******/ \t}\n\n\n/******/ \t// expose the modules object (__webpack_modules__)\n/******/ \t__webpack_require__.m = modules;\n\n/******/ \t// expose the module cache\n/******/ \t__webpack_require__.c = installedModules;\n\n/******/ \t// __webpack_public_path__\n/******/ \t__webpack_require__.p = \"\";\n\n/******/ \t// Load entry module and return exports\n/******/ \treturn __webpack_require__(0);\n/******/ })\n/************************************************************************/\n/******/ ([\n/* 0 */\n/***/ function(module, exports, __webpack_require__) {\n\n\t// Require instead of importScripts because we use webpack\n\t// with worker-loader for compiling source: https://github.com/webpack/worker-loader\n\tlet LSystem = __webpack_require__(1);\n\tlet lsystem = new LSystem({});\n\tlet timeout = {};\n\n\tonmessage = function(e) {\n\t  // wait a few ms to start thread, to be able to cancel old tasks\n\t  clearTimeout(timeout);\n\t  timeout = setTimeout(function() {\n\t    \n\t      lsystem.setAxiom(e.data.axiom);\n\t      \n\t      lsystem.clearProductions();\n\t      for (let p of e.data.productions) {\n\t        lsystem.setProduction(p[0], p[1]);\n\t      }\n\t      lsystem.iterate(e.data.iterations);\n\t      \n\t      postMessage({\n\t        result: lsystem.getString(),\n\t        initial: e.data\n\t      });\n\t      \n\t  }, 20);\n\n\t};\n\n\n/***/ },\n/* 1 */\n/***/ function(module, exports) {\n\n\t'use strict';\n\n\t// Get a list of productions that have identical initiators,\n\t// Output a single stochastic production. Probability per production\n\t// is defined by amount of input productions (4 => 25% each, 2 => 50% etc.)\n\n\tfunction transformClassicStochasticProductions(productions) {\n\n\t  return function transformedProduction() {\n\t    var resultList = productions; // the parser for productions shall create this list\n\t    var count = resultList.length;\n\n\t    var r = Math.random();\n\t    for (var i = 0; i < count; i++) {\n\t      var range = (i + 1) / count;\n\t      if (r <= range) return resultList[i];\n\t    }\n\n\t    console.error('Should have returned a result of the list, something is wrong here with the random numbers?.');\n\t  };\n\t};\n\n\t// TODO: Scaffold classic parametric and context sensitive stuff out of main file\n\t// And simply require it here, eg:\n\t// this.testClassicParametricSyntax = require(classicSyntax.testParametric)??\n\tfunction testClassicParametricSyntax(axiom) {\n\t  return (/\\(.+\\)/.test(axiom)\n\t  );\n\t};\n\n\t// transforms things like 'A(1,2,5)B(2.5)' to\n\t// [ {symbol: 'A', params: [1,2,5]}, {symbol: 'B', params:[25]} ]\n\t// strips spaces\n\tfunction transformClassicParametricAxiom(axiom) {\n\n\t  // Replace whitespaces, then split between square brackets.\n\t  var splitAxiom = axiom.replace(/\\s+/g, '').split(/[\\(\\)]/);\n\t  // console.log('parts:', splitAxiom)\n\t  var newAxiom = [];\n\t  // Construct new axiom by getting the params and symbol.\n\t  for (var i = 0; i < splitAxiom.length - 1; i += 2) {\n\t    var params = splitAxiom[i + 1].split(',').map(Number);\n\t    newAxiom.push({ symbol: splitAxiom[i], params: params });\n\t  }\n\t  // console.log('parsed axiom:', newAxiom)\n\t};\n\n\t// transform a classic syntax production into valid JS production\n\t// TODO: Only work on first part pf production P[0]\n\t// -> this.transformClassicCSCondition\n\tfunction transformClassicCSProduction(p, ignoredSymbols) {\n\t  var _this = this;\n\n\t  // before continuing, check if classic syntax actually there\n\t  // example: p = ['A<B>C', 'Z']\n\n\t  // left should be ['A', 'B']\n\t  var left = p[0].match(/(.+)<(.)/);\n\n\t  // right should be ['B', 'C']\n\t  var right = p[0].match(/(.)>(.+)/);\n\n\t  // Not a CS-Production (no '<' or '>'),\n\t  //return original production.\n\t  if (left === null && right === null) {\n\t    return p;\n\t  }\n\n\t  // indexSymbol should be 'B' in A<B>C\n\t  // get it either from left side or right side if left is nonexistent\n\t  var indexSymbol = left !== null ? left[2] : right[1];\n\n\t  // double check: make sure that the right and left match got the same indexSymbol (B)\n\t  if (left !== null && right !== null && left[2] !== right[1]) {\n\t    throw new Error('index symbol differs in context sensitive production from left to right check.', left[2], '!==', right[1]);\n\t  }\n\n\t  // finally build the new (valid JS) production\n\t  // (that is being executed instead of the classic syntax,\n\t  //  which can't be interpreted by the JS engine)\n\t  var transformedFunction = function transformedFunction(_ref) {\n\t    var _index = _ref.index;\n\t    var _part = _ref.part;\n\t    var _axiom = _ref.currentAxiom;\n\t    var _params = _ref.params;\n\n\n\t    var leftMatch = { result: true };\n\t    var rightMatch = { result: true };\n\n\t    // this can possibly be optimized (see: https://developers.google.com/speed/articles/optimizing-javascript#avoiding-pitfalls-with-closures)\n\t    //\n\n\t    if (left !== null) {\n\t      leftMatch = _this.match({ direction: 'left', match: left[1], index: _index, branchSymbols: '[]', ignoredSymbols: ignoredSymbols });\n\t    }\n\n\t    // don't match with right side if left already false or no right match necessary\n\t    if (leftMatch.result === false || leftMatch.result === true && right === null) return leftMatch.result ? p[1] : false;\n\n\t    // see left!== null. could be optimized. Creating 3 variations of function\n\t    // so left/right are not checked here, which improves speed, as left/right\n\t    // are in a scope above.\n\t    if (right !== null) {\n\t      rightMatch = _this.match({ direction: 'right', match: right[2], index: _index, branchSymbols: '[]', ignoredSymbols: ignoredSymbols });\n\t    }\n\n\t    // Match! On a match return either the result of given production function\n\t    // or simply return the symbol itself if its no function.\n\t    if (leftMatch.result && rightMatch.result) {\n\t      return typeof p[1] === 'function' ? p[1]({ index: _index, part: _part, currentAxiom: _axiom, params: _params, leftMatchIndices: leftMatch.matchIndices, rightMatchIndices: rightMatch.matchIndices, ignoredSymbols: ignoredSymbols }) : p[1];\n\t    } else {\n\t      return false;\n\t    }\n\t  };\n\n\t  var transformedProduction = [indexSymbol, transformedFunction];\n\n\t  return transformedProduction;\n\t};\n\n\tvar _typeof = typeof Symbol === \"function\" && typeof Symbol.iterator === \"symbol\" ? function (obj) {\n\t  return typeof obj;\n\t} : function (obj) {\n\t  return obj && typeof Symbol === \"function\" && obj.constructor === Symbol ? \"symbol\" : typeof obj;\n\t};\n\n\tvar slicedToArray = function () {\n\t  function sliceIterator(arr, i) {\n\t    var _arr = [];\n\t    var _n = true;\n\t    var _d = false;\n\t    var _e = undefined;\n\n\t    try {\n\t      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {\n\t        _arr.push(_s.value);\n\n\t        if (i && _arr.length === i) break;\n\t      }\n\t    } catch (err) {\n\t      _d = true;\n\t      _e = err;\n\t    } finally {\n\t      try {\n\t        if (!_n && _i[\"return\"]) _i[\"return\"]();\n\t      } finally {\n\t        if (_d) throw _e;\n\t      }\n\t    }\n\n\t    return _arr;\n\t  }\n\n\t  return function (arr, i) {\n\t    if (Array.isArray(arr)) {\n\t      return arr;\n\t    } else if (Symbol.iterator in Object(arr)) {\n\t      return sliceIterator(arr, i);\n\t    } else {\n\t      throw new TypeError(\"Invalid attempt to destructure non-iterable instance\");\n\t    }\n\t  };\n\t}();\n\n\tfunction LSystem(_ref) {\n\t\tvar axiom = _ref.axiom;\n\t\tvar productions = _ref.productions;\n\t\tvar finals = _ref.finals;\n\t\tvar branchSymbols = _ref.branchSymbols;\n\t\tvar ignoredSymbols = _ref.ignoredSymbols;\n\t\tvar classicParametricSyntax = _ref.classicParametricSyntax;\n\n\t\t// faking default values until better support lands in all browser\n\t\taxiom = typeof axiom !== 'undefined' ? axiom : '';\n\t\tbranchSymbols = typeof branchSymbols !== 'undefined' ? branchSymbols : \"\";\n\t\tignoredSymbols = typeof ignoredSymbols !== 'undefined' ? ignoredSymbols : \"\";\n\t\tclassicParametricSyntax = typeof classicParametricSyntax !== 'undefined' ? classicParametricSyntax : 'false';\n\n\t\t// if using objects in axioms, as used in parametric L-Systems\n\t\tthis.getString = function () {\n\t\t\tvar onlySymbols = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];\n\n\t\t\tif (typeof this.axiom === 'string') return this.axiom;\n\t\t\tif (onlySymbols === true) {\n\t\t\t\treturn this.axiom.reduce(function (prev, current) {\n\t\t\t\t\tif (current.symbol === undefined) {\n\t\t\t\t\t\tconsole.log('found:', current);\n\t\t\t\t\t\tthrow new Error('L-Systems that use only objects as symbols (eg: {symbol: \\'F\\', params: []}), cant use string symbols (eg. \\'F\\')! Check if you always return objects in your productions and no strings.');\n\t\t\t\t\t}\n\t\t\t\t\treturn prev + current.symbol;\n\t\t\t\t}, '');\n\t\t\t} else {\n\t\t\t\treturn JSON.stringify(this.axiom);\n\t\t\t}\n\t\t};\n\n\t\tthis.setAxiom = function (axiom) {\n\t\t\tthis.axiom = axiom;\n\t\t};\n\n\t\tthis.setProduction = function (A, B) {\n\t\t\tvar doAppend = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];\n\n\t\t\tvar newProduction = [A, B];\n\t\t\tif (newProduction === undefined) throw new Error('no production specified.');\n\n\t\t\tif (this.parameters.allowClassicSyntax === true) {\n\t\t\t\tnewProduction = transformClassicCSProduction.bind(this)(newProduction, this.ignoredSymbols);\n\t\t\t}\n\t\t\tvar symbol = newProduction[0];\n\n\t\t\tif (doAppend === true && this.productions.has(symbol)) {\n\n\t\t\t\tvar existingProduction = this.productions.get(symbol);\n\t\t\t\t// If existing production results already in an array use this, otherwise\n\t\t\t\t// create new array to append to.\n\t\t\t\tvar productionList = existingProduction[Symbol.iterator] !== undefined && typeof existingProduction !== 'string' && !(existingProduction instanceof String) ? this.productions.get(symbol) : [this.productions.get(symbol)];\n\t\t\t\tproductionList.push(newProduction[1]);\n\t\t\t\tthis.productions.set(symbol, productionList);\n\t\t\t} else {\n\t\t\t\tthis.productions.set(newProduction[0], newProduction[1]);\n\t\t\t}\n\t\t};\n\n\t\t// set multiple productions from name:value Object\n\t\tthis.setProductions = function (newProductions) {\n\t\t\tif (newProductions === undefined) throw new Error('no production specified.');\n\t\t\tthis.clearProductions();\n\n\t\t\t// TODO: once Object.entries() (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries) is stable, use that in combo instead of awkward for…in.\n\t\t\tfor (var condition in newProductions) {\n\t\t\t\tif (newProductions.hasOwnProperty(condition)) {\n\t\t\t\t\tthis.setProduction(condition, newProductions[condition], true);\n\t\t\t\t}\n\t\t\t}\n\t\t};\n\n\t\tthis.clearProductions = function () {\n\t\t\tthis.productions = new Map();\n\t\t};\n\n\t\tthis.setFinal = function (symbol, final) {\n\t\t\tvar newFinal = [symbol, final];\n\t\t\tif (newFinal === undefined) {\n\t\t\t\tthrow new Error('no final specified.');\n\t\t\t}\n\t\t\tthis.finals.set(newFinal[0], newFinal[1]);\n\t\t};\n\n\t\t// set multiple finals from name:value Object\n\t\tthis.setFinals = function (newFinals) {\n\t\t\tif (newFinals === undefined) throw new Error('no finals specified.');\n\t\t\tthis.finals = new Map();\n\t\t\tfor (var symbol in newFinals) {\n\t\t\t\tif (newFinals.hasOwnProperty(symbol)) {\n\t\t\t\t\tthis.setFinal(symbol, newFinals[symbol]);\n\t\t\t\t}\n\t\t\t}\n\t\t};\n\n\t\tthis.getProductionResult = function (p, index, part, params) {\n\n\t\t\tvar result = void 0;\n\n\t\t\t// if p is a function, execute function and append return value\n\t\t\tif (typeof p === 'function') {\n\t\t\t\tresult = p({ index: index, currentAxiom: this.axiom, part: part, params: params });\n\n\t\t\t\t/* if p is no function and no iterable, then\n\t   it should be a string (regular) or object\n\t   directly return it then as result */\n\t\t\t} else if (typeof p === 'string' || p instanceof String || (typeof p === 'undefined' ? 'undefined' : _typeof(p)) === 'object' && p[Symbol.iterator] === undefined) {\n\t\t\t\t\tresult = p;\n\n\t\t\t\t\t// if p is a list/iterable\n\t\t\t\t} else if (p[Symbol.iterator] !== undefined && typeof p !== 'string' && !(p instanceof String)) {\n\t\t\t\t\t\t/*\n\t     go through the list and use\n\t     the first valid production in that list. (that returns true)\n\t     This assumes, it's a list of functions.\n\t     */\n\t\t\t\t\t\tvar _iteratorNormalCompletion = true;\n\t\t\t\t\t\tvar _didIteratorError = false;\n\t\t\t\t\t\tvar _iteratorError = undefined;\n\n\t\t\t\t\t\ttry {\n\t\t\t\t\t\t\tfor (var _iterator = p[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {\n\t\t\t\t\t\t\t\tvar _p = _step.value;\n\n\t\t\t\t\t\t\t\tvar _result = void 0;\n\t\t\t\t\t\t\t\tif (_p[Symbol.iterator] !== undefined && typeof _p !== 'string' && !(_p instanceof String)) {\n\t\t\t\t\t\t\t\t\t// If _p is itself also an Array, recursively get the result.\n\t\t\t\t\t\t\t\t\t_result = this.getProductionResult(_p);\n\t\t\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\t\t\t_result = typeof _p === 'function' ? _p({ index: index, currentAxiom: this.axiom, part: part, params: params }) : _p;\n\t\t\t\t\t\t\t\t}\n\n\t\t\t\t\t\t\t\tif (_result !== undefined && _result !== false) {\n\t\t\t\t\t\t\t\t\tresult = _result;\n\t\t\t\t\t\t\t\t\tbreak;\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t} catch (err) {\n\t\t\t\t\t\t\t_didIteratorError = true;\n\t\t\t\t\t\t\t_iteratorError = err;\n\t\t\t\t\t\t} finally {\n\t\t\t\t\t\t\ttry {\n\t\t\t\t\t\t\t\tif (!_iteratorNormalCompletion && _iterator.return) {\n\t\t\t\t\t\t\t\t\t_iterator.return();\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t} finally {\n\t\t\t\t\t\t\t\tif (_didIteratorError) {\n\t\t\t\t\t\t\t\t\tthrow _iteratorError;\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\n\t\t\treturn result === false ? part : result;\n\t\t};\n\n\t\tthis.applyProductions = function () {\n\t\t\t// a axiom can be a string or an array of objects that contain the key/value 'symbol'\n\t\t\tvar newAxiom = typeof this.axiom === 'string' ? '' : [];\n\t\t\tvar index = 0;\n\t\t\t// iterate all symbols/characters of the axiom and lookup according productions\n\t\t\tvar _iteratorNormalCompletion2 = true;\n\t\t\tvar _didIteratorError2 = false;\n\t\t\tvar _iteratorError2 = undefined;\n\n\t\t\ttry {\n\t\t\t\tfor (var _iterator2 = this.axiom[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {\n\t\t\t\t\tvar part = _step2.value;\n\n\t\t\t\t\tvar symbol = part;\n\n\t\t\t\t\t// Stuff for classic parametric L-Systems: get actual symbol and possible parameters\n\t\t\t\t\t// params will be given the production function, if applicable.\n\t\t\t\t\tvar params = [];\n\t\t\t\t\tif ((typeof part === 'undefined' ? 'undefined' : _typeof(part)) === 'object' && part.symbol) symbol = part.symbol;\n\t\t\t\t\tif ((typeof part === 'undefined' ? 'undefined' : _typeof(part)) === 'object' && part.params) params = part.params;\n\n\t\t\t\t\tvar result = part;\n\t\t\t\t\tif (this.productions.has(symbol)) {\n\t\t\t\t\t\tvar p = this.productions.get(symbol);\n\t\t\t\t\t\tresult = this.getProductionResult(p, index, part, params);\n\t\t\t\t\t}\n\n\t\t\t\t\t// finally add result to new axiom\n\t\t\t\t\tif (typeof newAxiom === 'string') {\n\t\t\t\t\t\tnewAxiom += result;\n\t\t\t\t\t} else {\n\t\t\t\t\t\t// If result is an array, merge result into new axiom instead of pushing.\n\t\t\t\t\t\tif (result.constructor === Array) {\n\t\t\t\t\t\t\tArray.prototype.push.apply(newAxiom, result);\n\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\tnewAxiom.push(result);\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tindex++;\n\t\t\t\t}\n\n\t\t\t\t// finally set new axiom and also return for convenience\n\t\t\t} catch (err) {\n\t\t\t\t_didIteratorError2 = true;\n\t\t\t\t_iteratorError2 = err;\n\t\t\t} finally {\n\t\t\t\ttry {\n\t\t\t\t\tif (!_iteratorNormalCompletion2 && _iterator2.return) {\n\t\t\t\t\t\t_iterator2.return();\n\t\t\t\t\t}\n\t\t\t\t} finally {\n\t\t\t\t\tif (_didIteratorError2) {\n\t\t\t\t\t\tthrow _iteratorError2;\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\n\t\t\tthis.axiom = newAxiom;\n\t\t\treturn newAxiom;\n\t\t};\n\n\t\t// iterate n times\n\t\tthis.iterate = function () {\n\t\t\tvar n = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];\n\n\t\t\tthis.iterations = n;\n\t\t\tvar lastIteration = void 0;\n\t\t\tfor (var iteration = 0; iteration < n; iteration++, this.iterationCount++) {\n\t\t\t\tlastIteration = this.applyProductions();\n\t\t\t}\n\t\t\treturn lastIteration;\n\t\t};\n\n\t\tthis.final = function () {\n\t\t\tvar _iteratorNormalCompletion3 = true;\n\t\t\tvar _didIteratorError3 = false;\n\t\t\tvar _iteratorError3 = undefined;\n\n\t\t\ttry {\n\t\t\t\tfor (var _iterator3 = this.axiom[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {\n\t\t\t\t\tvar part = _step3.value;\n\n\n\t\t\t\t\t// if we have objects for each symbol, (when using parametric L-Systems)\n\t\t\t\t\t// get actual identifiable symbol character\n\t\t\t\t\tvar symbol = part;\n\t\t\t\t\tif ((typeof part === 'undefined' ? 'undefined' : _typeof(part)) === 'object' && part.symbol) symbol = part.symbol;\n\n\t\t\t\t\tif (this.finals.has(symbol)) {\n\t\t\t\t\t\tvar finalFunction = this.finals.get(symbol);\n\t\t\t\t\t\tvar typeOfFinalFunction = typeof finalFunction === 'undefined' ? 'undefined' : _typeof(finalFunction);\n\t\t\t\t\t\tif (typeOfFinalFunction !== 'function') {\n\t\t\t\t\t\t\tthrow Error('\\'' + symbol + '\\'' + ' has an object for a final function. But it is __not a function__ but a ' + typeOfFinalFunction + '!');\n\t\t\t\t\t\t}\n\t\t\t\t\t\t// execute symbols function\n\t\t\t\t\t\tfinalFunction();\n\t\t\t\t\t} else {\n\t\t\t\t\t\t// symbol has no final function\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t} catch (err) {\n\t\t\t\t_didIteratorError3 = true;\n\t\t\t\t_iteratorError3 = err;\n\t\t\t} finally {\n\t\t\t\ttry {\n\t\t\t\t\tif (!_iteratorNormalCompletion3 && _iterator3.return) {\n\t\t\t\t\t\t_iterator3.return();\n\t\t\t\t\t}\n\t\t\t\t} finally {\n\t\t\t\t\tif (_didIteratorError3) {\n\t\t\t\t\t\tthrow _iteratorError3;\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t};\n\n\t\t/*\n\t \thow to use match():\n\t  \t-----------------------\n\t \tIt is mainly a helper function for context sensitive productions.\n\t \tIf you use the classic syntax, it will by default be automatically transformed to proper\n\t \tJS-Syntax.\n\t \tHowerver, you can use the match helper function in your on productions:\n\t \n\t \tindex is the index of a production using `match`\n\t \teg. in a classic L-System\n\t \n\t \tLSYS = ABCDE\n\t \tB<C>DE -> 'Z'\n\t \n\t \tthe index of the `B<C>D -> 'Z'` production would be the index of C (which is 2) when the\n\t \tproduction would perform match(). so (if not using the ClassicLSystem class) you'd construction your context-sensitive production from C to Z like so:\n\t \n\t \tLSYS.setProduction('C', (index, axiom) => {\n\t \t\t(LSYS.match({index, match: 'B', direction: 'left'}) &&\n\t \t\t LSYS.match({index, match: 'DE', direction: 'right'}) ? 'Z' : 'C')\n\t \t})\n\t \n\t \tYou can just write match({index, ...} instead of match({index: index, ..}) because of new ES6 Object initialization, see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#New_notations_in_ECMAScript_6\n\t \t*/\n\n\t\tthis.match = function (_ref2) {\n\t\t\tvar axiom_ = _ref2.axiom_;\n\t\t\tvar match = _ref2.match;\n\t\t\tvar ignoredSymbols = _ref2.ignoredSymbols;\n\t\t\tvar branchSymbols = _ref2.branchSymbols;\n\t\t\tvar index = _ref2.index;\n\t\t\tvar direction = _ref2.direction;\n\n\t\t\tvar branchCount = 0;\n\t\t\tvar explicitBranchCount = 0;\n\t\t\taxiom_ = axiom || this.axiom;\n\t\t\tif (branchSymbols === undefined) branchSymbols = this.branchSymbols !== undefined ? this.branchSymbols : [];\n\t\t\tif (ignoredSymbols === undefined) ignoredSymbols = this.ignoredSymbols !== undefined ? this.ignoredSymbols : [];\n\t\t\tvar returnMatchIndices = [];\n\n\t\t\tvar branchStart = void 0,\n\t\t\t    branchEnd = void 0,\n\t\t\t    axiomIndex = void 0,\n\t\t\t    loopIndexChange = void 0,\n\t\t\t    matchIndex = void 0,\n\t\t\t    matchIndexChange = void 0,\n\t\t\t    matchIndexOverflow = void 0;\n\t\t\t// set some variables depending on the direction to match\n\t\t\tif (direction === 'right') {\n\t\t\t\tloopIndexChange = matchIndexChange = +1;\n\t\t\t\taxiomIndex = index + 1;\n\t\t\t\tmatchIndex = 0;\n\t\t\t\tmatchIndexOverflow = match.length;\n\t\t\t\tif (branchSymbols.length > 0) {\n\t\t\t\t\t;\n\t\t\t\t\tvar _branchSymbols = branchSymbols;\n\n\t\t\t\t\tvar _branchSymbols2 = slicedToArray(_branchSymbols, 2);\n\n\t\t\t\t\tbranchStart = _branchSymbols2[0];\n\t\t\t\t\tbranchEnd = _branchSymbols2[1];\n\t\t\t\t}\n\t\t\t} else if (direction === 'left') {\n\t\t\t\tloopIndexChange = matchIndexChange = -1;\n\t\t\t\taxiomIndex = index - 1;\n\t\t\t\tmatchIndex = match.length - 1;\n\t\t\t\tmatchIndexOverflow = -1;\n\t\t\t\tif (branchSymbols.length > 0) {\n\t\t\t\t\t;\n\t\t\t\t\tvar _branchSymbols3 = branchSymbols;\n\n\t\t\t\t\tvar _branchSymbols4 = slicedToArray(_branchSymbols3, 2);\n\n\t\t\t\t\tbranchEnd = _branchSymbols4[0];\n\t\t\t\t\tbranchStart = _branchSymbols4[1];\n\t\t\t\t}\n\t\t\t} else {\n\t\t\t\tthrow Error(direction, 'is not a valid direction for matching.');\n\t\t\t}\n\n\t\t\tfor (; axiomIndex < axiom_.length && axiomIndex >= 0; axiomIndex += loopIndexChange) {\n\t\t\t\t// FIXME: what about objects with .symbol\n\n\t\t\t\tvar axiomSymbol = axiom_[axiomIndex];\n\t\t\t\t// For objects match for objects `symbol`\n\t\t\t\tif ((typeof axiomSymbol === 'undefined' ? 'undefined' : _typeof(axiomSymbol)) === 'object') axiomSymbol = axiomSymbol.symbol;\n\t\t\t\tvar matchSymbol = match[matchIndex];\n\n\t\t\t\t// compare current symbol of axiom with current symbol of match\n\t\t\t\tif (axiomSymbol === matchSymbol) {\n\n\t\t\t\t\tif (branchCount === 0 || explicitBranchCount > 0) {\n\t\t\t\t\t\t// if its a match and previously NOT inside branch (branchCount===0) or in explicitly wanted branch (explicitBranchCount > 0)\n\n\t\t\t\t\t\t// if a bracket was explicitly stated in match axiom\n\t\t\t\t\t\tif (axiomSymbol === branchStart) {\n\t\t\t\t\t\t\texplicitBranchCount++;\n\t\t\t\t\t\t\tbranchCount++;\n\t\t\t\t\t\t\tmatchIndex += matchIndexChange;\n\t\t\t\t\t\t} else if (axiomSymbol === branchEnd) {\n\t\t\t\t\t\t\texplicitBranchCount = Math.max(0, explicitBranchCount - 1);\n\t\t\t\t\t\t\tbranchCount = Math.max(0, branchCount - 1);\n\t\t\t\t\t\t\t// only increase match if we are out of explicit branch\n\n\t\t\t\t\t\t\tif (explicitBranchCount === 0) {\n\n\t\t\t\t\t\t\t\tmatchIndex += matchIndexChange;\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\treturnMatchIndices.push(axiomIndex);\n\t\t\t\t\t\t\tmatchIndex += matchIndexChange;\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\n\t\t\t\t\t// overflowing matchIndices (matchIndex + 1 for right match, matchIndexEnd for left match )?\n\t\t\t\t\t// -> no more matches to do. return with true, as everything matched until here\n\t\t\t\t\t// *yay*\n\t\t\t\t\tif (matchIndex === matchIndexOverflow) {\n\t\t\t\t\t\treturn { result: true, matchIndices: returnMatchIndices };\n\t\t\t\t\t}\n\t\t\t\t} else if (axiomSymbol === branchStart) {\n\t\t\t\t\tbranchCount++;\n\t\t\t\t\tif (explicitBranchCount > 0) explicitBranchCount++;\n\t\t\t\t} else if (axiomSymbol === branchEnd) {\n\t\t\t\t\tbranchCount = Math.max(0, branchCount - 1);\n\t\t\t\t\tif (explicitBranchCount > 0) explicitBranchCount = Math.max(0, explicitBranchCount - 1);\n\t\t\t\t} else if ((branchCount === 0 || explicitBranchCount > 0 && matchSymbol !== branchEnd) && ignoredSymbols.includes(axiomSymbol) === false) {\n\t\t\t\t\t// not in branchSymbols/branch? or if in explicit branch, and not at the very end of\n\t\t\t\t\t// condition (at the ]), and symbol not in ignoredSymbols ? then false\n\t\t\t\t\treturn { result: false, matchIndices: returnMatchIndices };\n\t\t\t\t}\n\t\t\t}\n\n\t\t\treturn { result: false, matchIndices: returnMatchIndices };\n\t\t};\n\n\t\t// finally init stuff\n\t\tthis.parameters = {\n\t\t\tallowClassicSyntax: true\n\t\t};\n\n\t\tthis.ignoredSymbols = ignoredSymbols;\n\t\tthis.setAxiom(axiom);\n\t\tthis.productions = new Map();\n\n\t\tthis.branchSymbols = branchSymbols;\n\n\t\tthis.classicParametricSyntax = classicParametricSyntax;\n\n\t\tif (productions) this.setProductions(productions);\n\t\tif (finals) this.setFinals(finals);\n\n\t\tthis.iterationCount = 0;\n\t\treturn this;\n\t}\n\n\t// Set classic syntax helpers to library scope to be used outside of library context\n\t// for users eg.\n\tLSystem.transformClassicStochasticProductions = transformClassicStochasticProductions;\n\tLSystem.transformClassicCSProduction = transformClassicCSProduction;\n\tLSystem.transformClassicParametricAxiom = transformClassicParametricAxiom;\n\tLSystem.testClassicParametricSyntax = testClassicParametricSyntax;\n\n\tmodule.exports = LSystem;\n\n/***/ }\n/******/ ]);", __webpack_require__.p + "9a6862ca63ab20299d4f.worker.js");
	};

/***/ },
/* 2 */
/***/ function(module, exports) {

	// http://stackoverflow.com/questions/10343913/how-to-create-a-web-worker-from-a-string

	var URL = window.URL || window.webkitURL;
	module.exports = function(content, url) {
		try {
			try {
				var blob;
				try { // BlobBuilder = Deprecated, but widely implemented
					var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
					blob = new BlobBuilder();
					blob.append(content);
					blob = blob.getBlob();
				} catch(e) { // The proposed API
					blob = new Blob([content]);
				}
				return new Worker(URL.createObjectURL(blob));
			} catch(e) {
				return new Worker('data:application/javascript,' + encodeURIComponent(content));
			}
		} catch(e) {
			return new Worker(url);
		}
	}

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';

	// Get a list of productions that have identical initiators,
	// Output a single stochastic production. Probability per production
	// is defined by amount of input productions (4 => 25% each, 2 => 50% etc.)

	function transformClassicStochasticProductions(productions) {

	  return function transformedProduction() {
	    var resultList = productions; // the parser for productions shall create this list
	    var count = resultList.length;

	    var r = Math.random();
	    for (var i = 0; i < count; i++) {
	      var range = (i + 1) / count;
	      if (r <= range) return resultList[i];
	    }

	    console.error('Should have returned a result of the list, something is wrong here with the random numbers?.');
	  };
	};

	// TODO: Scaffold classic parametric and context sensitive stuff out of main file
	// And simply require it here, eg:
	// this.testClassicParametricSyntax = require(classicSyntax.testParametric)??
	function testClassicParametricSyntax(axiom) {
	  return (/\(.+\)/.test(axiom)
	  );
	};

	// transforms things like 'A(1,2,5)B(2.5)' to
	// [ {symbol: 'A', params: [1,2,5]}, {symbol: 'B', params:[25]} ]
	// strips spaces
	function transformClassicParametricAxiom(axiom) {

	  // Replace whitespaces, then split between square brackets.
	  var splitAxiom = axiom.replace(/\s+/g, '').split(/[\(\)]/);
	  // console.log('parts:', splitAxiom)
	  var newAxiom = [];
	  // Construct new axiom by getting the params and symbol.
	  for (var i = 0; i < splitAxiom.length - 1; i += 2) {
	    var params = splitAxiom[i + 1].split(',').map(Number);
	    newAxiom.push({ symbol: splitAxiom[i], params: params });
	  }
	  // console.log('parsed axiom:', newAxiom)
	};

	// transform a classic syntax production into valid JS production
	// TODO: Only work on first part pf production P[0]
	// -> this.transformClassicCSCondition
	function transformClassicCSProduction(p, ignoredSymbols) {
	  var _this = this;

	  // before continuing, check if classic syntax actually there
	  // example: p = ['A<B>C', 'Z']

	  // left should be ['A', 'B']
	  var left = p[0].match(/(.+)<(.)/);

	  // right should be ['B', 'C']
	  var right = p[0].match(/(.)>(.+)/);

	  // Not a CS-Production (no '<' or '>'),
	  //return original production.
	  if (left === null && right === null) {
	    return p;
	  }

	  // indexSymbol should be 'B' in A<B>C
	  // get it either from left side or right side if left is nonexistent
	  var indexSymbol = left !== null ? left[2] : right[1];

	  // double check: make sure that the right and left match got the same indexSymbol (B)
	  if (left !== null && right !== null && left[2] !== right[1]) {
	    throw new Error('index symbol differs in context sensitive production from left to right check.', left[2], '!==', right[1]);
	  }

	  // finally build the new (valid JS) production
	  // (that is being executed instead of the classic syntax,
	  //  which can't be interpreted by the JS engine)
	  var transformedFunction = function transformedFunction(_ref) {
	    var _index = _ref.index;
	    var _part = _ref.part;
	    var _axiom = _ref.currentAxiom;
	    var _params = _ref.params;


	    var leftMatch = { result: true };
	    var rightMatch = { result: true };

	    // this can possibly be optimized (see: https://developers.google.com/speed/articles/optimizing-javascript#avoiding-pitfalls-with-closures)
	    //

	    if (left !== null) {
	      leftMatch = _this.match({ direction: 'left', match: left[1], index: _index, branchSymbols: '[]', ignoredSymbols: ignoredSymbols });
	    }

	    // don't match with right side if left already false or no right match necessary
	    if (leftMatch.result === false || leftMatch.result === true && right === null) return leftMatch.result ? p[1] : false;

	    // see left!== null. could be optimized. Creating 3 variations of function
	    // so left/right are not checked here, which improves speed, as left/right
	    // are in a scope above.
	    if (right !== null) {
	      rightMatch = _this.match({ direction: 'right', match: right[2], index: _index, branchSymbols: '[]', ignoredSymbols: ignoredSymbols });
	    }

	    // Match! On a match return either the result of given production function
	    // or simply return the symbol itself if its no function.
	    if (leftMatch.result && rightMatch.result) {
	      return typeof p[1] === 'function' ? p[1]({ index: _index, part: _part, currentAxiom: _axiom, params: _params, leftMatchIndices: leftMatch.matchIndices, rightMatchIndices: rightMatch.matchIndices, ignoredSymbols: ignoredSymbols }) : p[1];
	    } else {
	      return false;
	    }
	  };

	  var transformedProduction = [indexSymbol, transformedFunction];

	  return transformedProduction;
	};

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
	  return typeof obj;
	} : function (obj) {
	  return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
	};

	var slicedToArray = function () {
	  function sliceIterator(arr, i) {
	    var _arr = [];
	    var _n = true;
	    var _d = false;
	    var _e = undefined;

	    try {
	      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
	        _arr.push(_s.value);

	        if (i && _arr.length === i) break;
	      }
	    } catch (err) {
	      _d = true;
	      _e = err;
	    } finally {
	      try {
	        if (!_n && _i["return"]) _i["return"]();
	      } finally {
	        if (_d) throw _e;
	      }
	    }

	    return _arr;
	  }

	  return function (arr, i) {
	    if (Array.isArray(arr)) {
	      return arr;
	    } else if (Symbol.iterator in Object(arr)) {
	      return sliceIterator(arr, i);
	    } else {
	      throw new TypeError("Invalid attempt to destructure non-iterable instance");
	    }
	  };
	}();

	function LSystem(_ref) {
		var axiom = _ref.axiom;
		var productions = _ref.productions;
		var finals = _ref.finals;
		var branchSymbols = _ref.branchSymbols;
		var ignoredSymbols = _ref.ignoredSymbols;
		var classicParametricSyntax = _ref.classicParametricSyntax;

		// faking default values until better support lands in all browser
		axiom = typeof axiom !== 'undefined' ? axiom : '';
		branchSymbols = typeof branchSymbols !== 'undefined' ? branchSymbols : "";
		ignoredSymbols = typeof ignoredSymbols !== 'undefined' ? ignoredSymbols : "";
		classicParametricSyntax = typeof classicParametricSyntax !== 'undefined' ? classicParametricSyntax : 'false';

		// if using objects in axioms, as used in parametric L-Systems
		this.getString = function () {
			var onlySymbols = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

			if (typeof this.axiom === 'string') return this.axiom;
			if (onlySymbols === true) {
				return this.axiom.reduce(function (prev, current) {
					if (current.symbol === undefined) {
						console.log('found:', current);
						throw new Error('L-Systems that use only objects as symbols (eg: {symbol: \'F\', params: []}), cant use string symbols (eg. \'F\')! Check if you always return objects in your productions and no strings.');
					}
					return prev + current.symbol;
				}, '');
			} else {
				return JSON.stringify(this.axiom);
			}
		};

		this.setAxiom = function (axiom) {
			this.axiom = axiom;
		};

		this.setProduction = function (A, B) {
			var doAppend = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

			var newProduction = [A, B];
			if (newProduction === undefined) throw new Error('no production specified.');

			if (this.parameters.allowClassicSyntax === true) {
				newProduction = transformClassicCSProduction.bind(this)(newProduction, this.ignoredSymbols);
			}
			var symbol = newProduction[0];

			if (doAppend === true && this.productions.has(symbol)) {

				var existingProduction = this.productions.get(symbol);
				// If existing production results already in an array use this, otherwise
				// create new array to append to.
				var productionList = existingProduction[Symbol.iterator] !== undefined && typeof existingProduction !== 'string' && !(existingProduction instanceof String) ? this.productions.get(symbol) : [this.productions.get(symbol)];
				productionList.push(newProduction[1]);
				this.productions.set(symbol, productionList);
			} else {
				this.productions.set(newProduction[0], newProduction[1]);
			}
		};

		// set multiple productions from name:value Object
		this.setProductions = function (newProductions) {
			if (newProductions === undefined) throw new Error('no production specified.');
			this.clearProductions();

			// TODO: once Object.entries() (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries) is stable, use that in combo instead of awkward for…in.
			for (var condition in newProductions) {
				if (newProductions.hasOwnProperty(condition)) {
					this.setProduction(condition, newProductions[condition], true);
				}
			}
		};

		this.clearProductions = function () {
			this.productions = new Map();
		};

		this.setFinal = function (symbol, final) {
			var newFinal = [symbol, final];
			if (newFinal === undefined) {
				throw new Error('no final specified.');
			}
			this.finals.set(newFinal[0], newFinal[1]);
		};

		// set multiple finals from name:value Object
		this.setFinals = function (newFinals) {
			if (newFinals === undefined) throw new Error('no finals specified.');
			this.finals = new Map();
			for (var symbol in newFinals) {
				if (newFinals.hasOwnProperty(symbol)) {
					this.setFinal(symbol, newFinals[symbol]);
				}
			}
		};

		this.getProductionResult = function (p, index, part, params) {

			var result = void 0;

			// if p is a function, execute function and append return value
			if (typeof p === 'function') {
				result = p({ index: index, currentAxiom: this.axiom, part: part, params: params });

				/* if p is no function and no iterable, then
	   it should be a string (regular) or object
	   directly return it then as result */
			} else if (typeof p === 'string' || p instanceof String || (typeof p === 'undefined' ? 'undefined' : _typeof(p)) === 'object' && p[Symbol.iterator] === undefined) {
					result = p;

					// if p is a list/iterable
				} else if (p[Symbol.iterator] !== undefined && typeof p !== 'string' && !(p instanceof String)) {
						/*
	     go through the list and use
	     the first valid production in that list. (that returns true)
	     This assumes, it's a list of functions.
	     */
						var _iteratorNormalCompletion = true;
						var _didIteratorError = false;
						var _iteratorError = undefined;

						try {
							for (var _iterator = p[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
								var _p = _step.value;

								var _result = void 0;
								if (_p[Symbol.iterator] !== undefined && typeof _p !== 'string' && !(_p instanceof String)) {
									// If _p is itself also an Array, recursively get the result.
									_result = this.getProductionResult(_p);
								} else {
									_result = typeof _p === 'function' ? _p({ index: index, currentAxiom: this.axiom, part: part, params: params }) : _p;
								}

								if (_result !== undefined && _result !== false) {
									result = _result;
									break;
								}
							}
						} catch (err) {
							_didIteratorError = true;
							_iteratorError = err;
						} finally {
							try {
								if (!_iteratorNormalCompletion && _iterator.return) {
									_iterator.return();
								}
							} finally {
								if (_didIteratorError) {
									throw _iteratorError;
								}
							}
						}
					}

			return result === false ? part : result;
		};

		this.applyProductions = function () {
			// a axiom can be a string or an array of objects that contain the key/value 'symbol'
			var newAxiom = typeof this.axiom === 'string' ? '' : [];
			var index = 0;
			// iterate all symbols/characters of the axiom and lookup according productions
			var _iteratorNormalCompletion2 = true;
			var _didIteratorError2 = false;
			var _iteratorError2 = undefined;

			try {
				for (var _iterator2 = this.axiom[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
					var part = _step2.value;

					var symbol = part;

					// Stuff for classic parametric L-Systems: get actual symbol and possible parameters
					// params will be given the production function, if applicable.
					var params = [];
					if ((typeof part === 'undefined' ? 'undefined' : _typeof(part)) === 'object' && part.symbol) symbol = part.symbol;
					if ((typeof part === 'undefined' ? 'undefined' : _typeof(part)) === 'object' && part.params) params = part.params;

					var result = part;
					if (this.productions.has(symbol)) {
						var p = this.productions.get(symbol);
						result = this.getProductionResult(p, index, part, params);
					}

					// finally add result to new axiom
					if (typeof newAxiom === 'string') {
						newAxiom += result;
					} else {
						// If result is an array, merge result into new axiom instead of pushing.
						if (result.constructor === Array) {
							Array.prototype.push.apply(newAxiom, result);
						} else {
							newAxiom.push(result);
						}
					}
					index++;
				}

				// finally set new axiom and also return for convenience
			} catch (err) {
				_didIteratorError2 = true;
				_iteratorError2 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion2 && _iterator2.return) {
						_iterator2.return();
					}
				} finally {
					if (_didIteratorError2) {
						throw _iteratorError2;
					}
				}
			}

			this.axiom = newAxiom;
			return newAxiom;
		};

		// iterate n times
		this.iterate = function () {
			var n = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];

			this.iterations = n;
			var lastIteration = void 0;
			for (var iteration = 0; iteration < n; iteration++, this.iterationCount++) {
				lastIteration = this.applyProductions();
			}
			return lastIteration;
		};

		this.final = function () {
			var _iteratorNormalCompletion3 = true;
			var _didIteratorError3 = false;
			var _iteratorError3 = undefined;

			try {
				for (var _iterator3 = this.axiom[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
					var part = _step3.value;


					// if we have objects for each symbol, (when using parametric L-Systems)
					// get actual identifiable symbol character
					var symbol = part;
					if ((typeof part === 'undefined' ? 'undefined' : _typeof(part)) === 'object' && part.symbol) symbol = part.symbol;

					if (this.finals.has(symbol)) {
						var finalFunction = this.finals.get(symbol);
						var typeOfFinalFunction = typeof finalFunction === 'undefined' ? 'undefined' : _typeof(finalFunction);
						if (typeOfFinalFunction !== 'function') {
							throw Error('\'' + symbol + '\'' + ' has an object for a final function. But it is __not a function__ but a ' + typeOfFinalFunction + '!');
						}
						// execute symbols function
						finalFunction();
					} else {
						// symbol has no final function
					}
				}
			} catch (err) {
				_didIteratorError3 = true;
				_iteratorError3 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion3 && _iterator3.return) {
						_iterator3.return();
					}
				} finally {
					if (_didIteratorError3) {
						throw _iteratorError3;
					}
				}
			}
		};

		/*
	 	how to use match():
	  	-----------------------
	 	It is mainly a helper function for context sensitive productions.
	 	If you use the classic syntax, it will by default be automatically transformed to proper
	 	JS-Syntax.
	 	Howerver, you can use the match helper function in your on productions:
	 
	 	index is the index of a production using `match`
	 	eg. in a classic L-System
	 
	 	LSYS = ABCDE
	 	B<C>DE -> 'Z'
	 
	 	the index of the `B<C>D -> 'Z'` production would be the index of C (which is 2) when the
	 	production would perform match(). so (if not using the ClassicLSystem class) you'd construction your context-sensitive production from C to Z like so:
	 
	 	LSYS.setProduction('C', (index, axiom) => {
	 		(LSYS.match({index, match: 'B', direction: 'left'}) &&
	 		 LSYS.match({index, match: 'DE', direction: 'right'}) ? 'Z' : 'C')
	 	})
	 
	 	You can just write match({index, ...} instead of match({index: index, ..}) because of new ES6 Object initialization, see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#New_notations_in_ECMAScript_6
	 	*/

		this.match = function (_ref2) {
			var axiom_ = _ref2.axiom_;
			var match = _ref2.match;
			var ignoredSymbols = _ref2.ignoredSymbols;
			var branchSymbols = _ref2.branchSymbols;
			var index = _ref2.index;
			var direction = _ref2.direction;

			var branchCount = 0;
			var explicitBranchCount = 0;
			axiom_ = axiom || this.axiom;
			if (branchSymbols === undefined) branchSymbols = this.branchSymbols !== undefined ? this.branchSymbols : [];
			if (ignoredSymbols === undefined) ignoredSymbols = this.ignoredSymbols !== undefined ? this.ignoredSymbols : [];
			var returnMatchIndices = [];

			var branchStart = void 0,
			    branchEnd = void 0,
			    axiomIndex = void 0,
			    loopIndexChange = void 0,
			    matchIndex = void 0,
			    matchIndexChange = void 0,
			    matchIndexOverflow = void 0;
			// set some variables depending on the direction to match
			if (direction === 'right') {
				loopIndexChange = matchIndexChange = +1;
				axiomIndex = index + 1;
				matchIndex = 0;
				matchIndexOverflow = match.length;
				if (branchSymbols.length > 0) {
					;
					var _branchSymbols = branchSymbols;

					var _branchSymbols2 = slicedToArray(_branchSymbols, 2);

					branchStart = _branchSymbols2[0];
					branchEnd = _branchSymbols2[1];
				}
			} else if (direction === 'left') {
				loopIndexChange = matchIndexChange = -1;
				axiomIndex = index - 1;
				matchIndex = match.length - 1;
				matchIndexOverflow = -1;
				if (branchSymbols.length > 0) {
					;
					var _branchSymbols3 = branchSymbols;

					var _branchSymbols4 = slicedToArray(_branchSymbols3, 2);

					branchEnd = _branchSymbols4[0];
					branchStart = _branchSymbols4[1];
				}
			} else {
				throw Error(direction, 'is not a valid direction for matching.');
			}

			for (; axiomIndex < axiom_.length && axiomIndex >= 0; axiomIndex += loopIndexChange) {
				// FIXME: what about objects with .symbol

				var axiomSymbol = axiom_[axiomIndex];
				// For objects match for objects `symbol`
				if ((typeof axiomSymbol === 'undefined' ? 'undefined' : _typeof(axiomSymbol)) === 'object') axiomSymbol = axiomSymbol.symbol;
				var matchSymbol = match[matchIndex];

				// compare current symbol of axiom with current symbol of match
				if (axiomSymbol === matchSymbol) {

					if (branchCount === 0 || explicitBranchCount > 0) {
						// if its a match and previously NOT inside branch (branchCount===0) or in explicitly wanted branch (explicitBranchCount > 0)

						// if a bracket was explicitly stated in match axiom
						if (axiomSymbol === branchStart) {
							explicitBranchCount++;
							branchCount++;
							matchIndex += matchIndexChange;
						} else if (axiomSymbol === branchEnd) {
							explicitBranchCount = Math.max(0, explicitBranchCount - 1);
							branchCount = Math.max(0, branchCount - 1);
							// only increase match if we are out of explicit branch

							if (explicitBranchCount === 0) {

								matchIndex += matchIndexChange;
							}
						} else {
							returnMatchIndices.push(axiomIndex);
							matchIndex += matchIndexChange;
						}
					}

					// overflowing matchIndices (matchIndex + 1 for right match, matchIndexEnd for left match )?
					// -> no more matches to do. return with true, as everything matched until here
					// *yay*
					if (matchIndex === matchIndexOverflow) {
						return { result: true, matchIndices: returnMatchIndices };
					}
				} else if (axiomSymbol === branchStart) {
					branchCount++;
					if (explicitBranchCount > 0) explicitBranchCount++;
				} else if (axiomSymbol === branchEnd) {
					branchCount = Math.max(0, branchCount - 1);
					if (explicitBranchCount > 0) explicitBranchCount = Math.max(0, explicitBranchCount - 1);
				} else if ((branchCount === 0 || explicitBranchCount > 0 && matchSymbol !== branchEnd) && ignoredSymbols.includes(axiomSymbol) === false) {
					// not in branchSymbols/branch? or if in explicit branch, and not at the very end of
					// condition (at the ]), and symbol not in ignoredSymbols ? then false
					return { result: false, matchIndices: returnMatchIndices };
				}
			}

			return { result: false, matchIndices: returnMatchIndices };
		};

		// finally init stuff
		this.parameters = {
			allowClassicSyntax: true
		};

		this.ignoredSymbols = ignoredSymbols;
		this.setAxiom(axiom);
		this.productions = new Map();

		this.branchSymbols = branchSymbols;

		this.classicParametricSyntax = classicParametricSyntax;

		if (productions) this.setProductions(productions);
		if (finals) this.setFinals(finals);

		this.iterationCount = 0;
		return this;
	}

	// Set classic syntax helpers to library scope to be used outside of library context
	// for users eg.
	LSystem.transformClassicStochasticProductions = transformClassicStochasticProductions;
	LSystem.transformClassicCSProduction = transformClassicCSProduction;
	LSystem.transformClassicParametricAxiom = transformClassicParametricAxiom;
	LSystem.testClassicParametricSyntax = testClassicParametricSyntax;

	module.exports = LSystem;

/***/ },
/* 4 */
/***/ function(module, exports) {

	AFRAME.registerPrimitive('a-lsystem', {
	  defaultComponents: {
	    lsystem: {
	      axiom: 'F',
	      productions: 'F:F++F++F++F',
	      iterations: 3,
	      angle: 60
	    }
	  },

	  mappings: {
	    axiom: 'lsystem.axiom',
	    productions: 'lsystem.productions',
	    segmentMixins: 'lsystem.segmentMixins',
	    iterations: 'lsystem.iterations',
	    angle: 'lsystem.angle'
	  }
	});


/***/ }
/******/ ]);