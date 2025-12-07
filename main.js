//=============
// DEFINITIONS
//=============

const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

const errorDiv = document.getElementById("errorDiv");
const errorParagraph = document.getElementById("errorParagraph");

const triangleVertices = new Float32Array([
	// Top middle
	0.0, 1.0,

	// Bottom left
	-1.0, -1.0,

	// Bottom right
	1.0, -1.0,
]);

const rgbTriangleColors = new Uint8Array([
	// red vertex
	255, 0, 0,

	// green vertex
	0, 255, 0,

	// blue vertex
	0, 0, 255,
]);
const orangeGradientTriangleColors = new Uint8Array([
	// idk just a pretty orange color
	233, 154, 26,

	// same, but red
	229, 47, 15,

	// again the same, but yellow
	246, 206, 29,
]);

//=====================
// SHADER SOURCE CODES
//=====================

const vertexShaderSourceCodeGLSL = `#version 300 es
	precision mediump float; 

	in vec2 vertex_position;
	in vec3 vertex_color;

	out vec3 fragment_color;

	uniform vec2 shape_location;
	uniform float shape_size;
	uniform vec2 canvas_size;

	void main(){
		fragment_color = vertex_color;

		vec2 final_vertex_position = vertex_position * shape_size + shape_location;
		vec2 clip_position = (final_vertex_position / canvas_size) * 2.0 - 1.0;

		gl_Position = vec4(clip_position.x, clip_position.y, 0.0, 1.0);
	}`;
const fragmentShaderSourceCodeGLSL = `#version 300 es
	precision mediump float;

	in vec3 fragment_color;
	out vec4 output_color;

	void main() {

	output_color = vec4(fragment_color, 1.0);

	}`;

//======
//  2D
//======

// 2d canvas for 2d demo testing for ratation math
const canv2 = document.getElementById("secondaryCanvas");
const ctx = canv2.getContext("2d");

const rotationAmount = 0.1;

let polygonVertices;
let polarVertices;
let polygonCenter;

//==================================================
// CANVAS RESIZING & OTHER INITIALIZATION PROCESSES
//==================================================

window.addEventListener("load", () => {
	resizeCanvas();
	softRender();
	loop();
});

function resizeCanvas() {
	const area = canvas.getBoundingClientRect();
	canvas.width = area.width;
	canvas.height = area.height;
	const area2 = canv2.getBoundingClientRect();
	canv2.width = area2.width;
	canv2.height = area2.height;
}

//=========
// LOOPING
//=========

function loop() {
	requestAnimationFrame(loop);

	drawOnSecondCanvas();
}

//================
// ERROR HANDLING
//================

function showError(err) {
	if (!(typeof err === "string" || err instanceof String)) {
		err = str(err);
	}

	if (errorDiv.hidden == true) {
		errorDiv.hidden = false;
	}

	errorParagraph.textContent = err;
	console.error(err);
}

//===========
// RENDERING
//===========

function createStaticvertexBuffer(data) {
	const buffer = gl.createBuffer();
	if (!buffer) {
		showError("Failed to allocate buffer");
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return buffer;
}

function createTwoBufferArrayVAO(
	positionBuffer,
	colorBuffer,
	positionAttributeLocation,
	colorAttributeLocation
) {
	const vao = gl.createVertexArray();
	if (!vao) {
		showError("Failed to allocate VAO for two buffers");
		return null;
	}

	gl.bindVertexArray(vao);

	gl.enableVertexAttribArray(positionAttributeLocation);
	gl.enableVertexAttribArray(colorAttributeLocation);

	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.vertexAttribPointer(
		colorAttributeLocation,
		3,
		gl.UNSIGNED_BYTE,
		true,
		0,
		0
	);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	gl.bindVertexArray(null);

	return vao;
}

function softRender() {
	try {
		createTriangleRenders();
	} catch (e) {
		showError(`Error caught in renderTriangle(), error cause: ${e}`);
	}
}

class MovingShape {
	constructor(position, velocity, size, vao) {
		this.position = position;
		this.velocity = velocity;
		this.size = size;
		this.vao = vao;
	}

	update(dt) {
		this.position[0] += this.velocity[0] * dt;
		this.position[1] += this.velocity[1] * dt;
	}
}
function createTriangleRenders() {
	if (!canvas) {
		showError("Error: canvas not found at renderTriangle()");
		return;
	}
	if (!gl) {
		showError(
			"Error: WebGL2 context not found, this likely means your browser doesn't support it - this demo will not work, you can try another browser"
		);
		return;
	}

	const triangleGeoBuffer = createStaticvertexBuffer(triangleVertices);
	const rgbTriangleColorBuffer = createStaticvertexBuffer(rgbTriangleColors);
	const gradientTriangleColorBuffer = createStaticvertexBuffer(
		orangeGradientTriangleColors
	);

	if (
		!triangleGeoBuffer ||
		!rgbTriangleColorBuffer ||
		!gradientTriangleColorBuffer
	) {
		showError(`Failed to create vertex buffers:
			triangleGeoBuffer: ${triangleGeoBuffer},
			rgbTriangleColorBuffer: ${rgbTriangleColorBuffer},
			gradientRtiangleColorBuffer: ${gradientTriangleColorBuffer}`);
		return;
	}

	const vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vertexShaderSourceCodeGLSL);
	gl.compileShader(vertexShader);

	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		const compileError = gl.getShaderInfoLog(vertexShader);

		showError(`Failed to compile vertex shader - ${compileError}`);
		return;
	}

	const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fragmentShaderSourceCodeGLSL);
	gl.compileShader(fragmentShader);

	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		const compileError = gl.getShaderInfoLog(fragmentShader);

		showError(`Failed to compile fragment shader - ${compileError}`);
		return;
	}

	const triangleShaderProgram = gl.createProgram();

	gl.attachShader(triangleShaderProgram, vertexShader);
	gl.attachShader(triangleShaderProgram, fragmentShader);
	gl.linkProgram(triangleShaderProgram);

	if (!gl.getProgramParameter(triangleShaderProgram, gl.LINK_STATUS)) {
		const linkError = gl.getProgramInfoLog(triangleShaderProgram);

		showError(`Failed to link shaders, ${linkError}`);
		return;
	}

	const vertexPositionAttributeLocation = gl.getAttribLocation(
		triangleShaderProgram,
		"vertex_position"
	);

	const vertexColorAttributeLocation = gl.getAttribLocation(
		triangleShaderProgram,
		"vertex_color"
	);

	if (
		vertexPositionAttributeLocation < 0 ||
		vertexColorAttributeLocation < 0
	) {
		showError(`Failed to get attribute location: 
			vertex_position: ${vertexPositionAttributeLocation}, 
			vertex_color: ${vertexColorAttributeLocation}`);
		return;
	}

	const shapeLocationUniform = gl.getUniformLocation(
		triangleShaderProgram,
		"shape_location"
	);
	const shapeSizeUniform = gl.getUniformLocation(
		triangleShaderProgram,
		"shape_size"
	);
	const canvasSizeUniform = gl.getUniformLocation(
		triangleShaderProgram,
		"canvas_size"
	);
	if (
		shapeLocationUniform === null ||
		shapeSizeUniform === null ||
		canvasSizeUniform === null
	) {
		showError(`vertex shader uniform location not found 
			shape_location = ${!!shapeLocationUniform},
			shape_size = ${!!shapeSizeUniform},
			canvas_size = ${!!canvasSizeUniform}`);
	}

	const rgbTriangleVAO = createTwoBufferArrayVAO(
		triangleGeoBuffer,
		rgbTriangleColorBuffer,
		vertexPositionAttributeLocation,
		vertexColorAttributeLocation
	);
	const gradientTriangleVAO = createTwoBufferArrayVAO(
		triangleGeoBuffer,
		gradientTriangleColorBuffer,
		vertexPositionAttributeLocation,
		vertexColorAttributeLocation
	);

	if (!rgbTriangleVAO || !gradientTriangleVAO) {
		showError(`Failed to create VAOs
			rgbTriangleVAO: ${rgbTriangleVAO},
			gradientTriangleVAO: ${gradientTriangleVAO}`);
		return;
	}

	const triangle1 = new MovingShape(
		[1300, 500],
		[10, 5],
		100,
		gradientTriangleVAO
	);
	const triangle2 = new MovingShape([300, 600], [30, 3], 300, rgbTriangleVAO);

	let lastFrameT = performance.now();

	const frame = () => {
		const thisFrameT = performance.now();
		const dt = (thisFrameT - lastFrameT) / 1000;
		lastFrameT = thisFrameT;

		triangle1.update(dt);
		triangle2.update(dt);

		const area = canvas.getBoundingClientRect();
		canvas.width = area.width;
		canvas.height = area.height;

		gl.clearColor(0.5, 0.5, 0.5, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		gl.viewport(0, 0, canvas.width, canvas.height);

		gl.useProgram(triangleShaderProgram);

		// This is here for redundancy, I'm pretty good at forgetting stuff so this is here such that the program/demo will be less error-prone
		gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
		gl.vertexAttribPointer(
			// these comments aren't really needed, but if I need to debug at some point, these will be necessary for my forgetful brain

			// index: which attribute to use
			vertexPositionAttributeLocation,

			// size: how many components does said attribute have?
			2,

			// type: what is this data's type?
			gl.FLOAT,

			// normalized: makes ints into floats, I don't need that
			false,

			// stride: how many bytes to move forward to find the next vertex's attributes
			0,

			// offset: how many bytes should be skipped before looking at attributes (it's always the first one since there is only 1 option for it, so skip 0)
			0
		);

		gl.uniform2f(canvasSizeUniform, canvas.width, canvas.height);

		// triangle1
		gl.uniform1f(shapeSizeUniform, triangle1.size);
		gl.uniform2f(
			shapeLocationUniform,
			triangle1.position[0],
			triangle1.position[1]
		);
		gl.bindVertexArray(triangle1.vao);
		gl.drawArrays(gl.TRIANGLES, 0, 3);

		// triangle2
		gl.uniform1f(shapeSizeUniform, triangle2.size);
		gl.uniform2f(
			shapeLocationUniform,
			triangle2.position[0],
			triangle2.position[1]
		);
		gl.bindVertexArray(triangle2.vao);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		requestAnimationFrame(frame);
	};
	requestAnimationFrame(frame);
}

/** 	/** tells the GPU what kind of thind to draw 
gl.TRIANGLES,
	/** which vertex to start from, idk why this is needed since polygons anyways will always do every edge anyways 
	0,
	/** how many vertices the shape has in total, triangle has 3 
			3 */

//======================
// SPINNING 2D TRIANGLE
//======================

// I will be keeping this code here as reference until the submitting commit

function drawOnSecondCanvas() {
	if (!polygonVertices) {
		polygonVertices = [
			{
				x: canv2.width / 2,
				y: canv2.height / 4,
			},
			{
				x: canv2.width / 4,
				y: (canv2.height / 4) * 3,
			},
			{
				x: (canv2.width / 4) * 3,
				y: (canv2.height / 4) * 3,
			},
		];
	}

	polygonCenter = getPolygonCenter(polygonVertices);

	if (!polarVertices) {
		polarVertices = cartesianShapeToPolarShape(polygonVertices);
	}

	rotatePolygon(polarVertices);
	polygonVertices = polarShapeToCartesianShape(polarVertices);

	draw2dPolygon(polygonVertices);

	// draw the polygonCenter's location
	ctx.fillStyle = "#f00";
	ctx.fillRect(polygonCenter[0] - 5, polygonCenter[1] - 5, 10, 10);
}

function cartesianShapeToPolarShape(polygon) {
	/* Assumes that 
	vertex == objLit{
		x: value,
		y: value,
		}
	*/
	polarPolygon = [];
	for (let vertex of polygon) {
		relativeVertexX = vertex.x - polygonCenter[0];
		relativeVertexY = vertex.y - polygonCenter[1];
		const theta = Math.atan2(relativeVertexY, relativeVertexX);
		const r = Math.sqrt(relativeVertexX ** 2 + relativeVertexY ** 2);
		polarPolygon.push({
			theta: theta,
			r: r,
		});
	}
	return polarPolygon;
}

function getPolygonCenter(polygon) {
	// assumes that shape == Array
	let vertexCount = 0;
	let totalVertexX = 0.0;
	let totalVertexY = 0.0;

	for (let vertex of polygon) {
		totalVertexX += vertex.x;
		totalVertexY += vertex.y;
		vertexCount += 1;
	}

	return [totalVertexX / vertexCount, totalVertexY / vertexCount];
}

function polarShapeToCartesianShape(polygon) {
	/* Assumes that 
	vertex == objLit{
		theta: value,
		r: value,
		}
	*/
	cartesianPolygon = [];
	for (let vertex of polygon) {
		const x = vertex.r * Math.cos(vertex.theta) + polygonCenter[0];
		const y = vertex.r * Math.sin(vertex.theta) + polygonCenter[1];
		cartesianPolygon.push({
			x: x,
			y: y,
		});
	}
	return cartesianPolygon;
}

function draw2dPolygon(polygonVertices) {
	ctx.clearRect(0, 0, canv2.width, canv2.height);

	ctx.fillStyle = "#00f";

	ctx.beginPath();

	ctx.moveTo(polygonVertices[0].x, polygonVertices[0].y);

	let index = 0;

	for (let vertex of polygonVertices) {
		ctx.lineTo(polygonVertices[index].x, polygonVertices[index].y);
		index++;
	}

	ctx.fill();
}

function rotatePolygon(polarVertices) {
	for (vertex of polarVertices) {
		vertex.theta += rotationAmount;
	}
}
