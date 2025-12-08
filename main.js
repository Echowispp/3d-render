//=============
// DEFINITIONS
//=============

const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

const errorDiv = document.getElementById("errorDiv");
const errorParagraph = document.getElementById("errorParagraph");

const fullscreenButton = document.getElementById("fullscreenButton");

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

//================
// SPAWNING STUFF
//================

// Unit: 1/100th percent chance for a new shape to spawn each frame
const SPAWN_RATE = 0.08;

// Unit: seconds of lifetime
const MIN_SHAPE_TIME = 0.25;
const MAX_SHAPE_TIME = 6;

// Unit: canvas-pixels / second
const MIN_SHAPE_SPEED = 125;
const MAX_SHAPE_SPEED = 900;

const MIN_SHAPE_SIZE = 2;
const MAX_SHAPE_SIZE = 50;

// Unit: dimensionless, but it is just a hard limit on the amount of shapes in order not to crash any computers
const MAX_SHAPE_COUNT = 250;

function getRandomNumberInRange(max, min) {
	return Math.random() * (max - min) + min;
}

//===================
// CLASS DEFINITIONS
//===================

class MovingShape {
	// inputs:  Array     Array     Float Float     WebGL2Context (or smth like that)
	constructor(position, velocity, size, lifetime, vao) {
		this.position = position;
		this.velocity = velocity;
		this.size = size;
		this.timeRemaining = lifetime;

		this.vao = vao;
	}

	isAlive() {
		return this.timeRemaining > 0;
	}

	update(dt) {
		this.position[0] += this.velocity[0] * dt;
		this.position[1] += this.velocity[1] * dt;

		this.timeRemaining -= dt;
	}
}

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

//===================
// SCREENSAVER STUFF
//===================

fullscreenButton.addEventListener("click", () => {
	document.documentElement.requestFullscreen();
	document.body.style.cursor = "none";
	fullscreenButton.hidden = true;
});

document.addEventListener("mousemove", () => {
	if (document.fullscreenElement) {
		document.exitFullscreen();
		document.body.style.cursor = "auto";
		fullscreenButton.hidden = false;
	}
});

document.addEventListener("keydown", () => {
	if (document.fullscreenElement) {
		document.exitFullscreen();
		document.body.style.cursor = "auto";
		fullscreenButton.hidden = false;
	}
});

//==================================================
// CANVAS RESIZING & OTHER INITIALIZATION PROCESSES
//==================================================

window.addEventListener("load", () => {
	resizeCanvas();
	softRender();
});

function resizeCanvas() {
	const area = canvas.getBoundingClientRect();
	canvas.width = area.width;
	canvas.height = area.height;
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
		showError(`Error caught in createTriangleRenders(), error cause: ${e}`);
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

	let shapes = [];
	let timeToNextSpawn = SPAWN_RATE;

	let lastFrameT = performance.now();

	const frame = () => {
		//=============
		// DEFINITIONS
		//=============

		const thisFrameT = performance.now();
		const dt = (thisFrameT - lastFrameT) / 1000;
		lastFrameT = thisFrameT;

		timeToNextSpawn -= dt;

		while (timeToNextSpawn < 0) {
			// While loop in case of terrible framerate (or someone wanting to destroy their computer with huge spawnrate)
			timeToNextSpawn += SPAWN_RATE;

			const randomAngle = getRandomNumberInRange(0, 2 * Math.PI);
			const randomSpeed = getRandomNumberInRange(
				MAX_SHAPE_SPEED,
				MIN_SHAPE_SPEED
			);

			const position = [canvas.width / 2, canvas.height / 2];
			const velocity = [
				randomSpeed * Math.cos(randomAngle),
				randomSpeed * Math.sin(randomAngle),
			];

			const size = getRandomNumberInRange(MAX_SHAPE_SIZE, MIN_SHAPE_SIZE);

			const lifetime = getRandomNumberInRange(
				MAX_SHAPE_TIME,
				MIN_SHAPE_TIME
			);

			const vao =
				Math.random() < 0.5 ? rgbTriangleVAO : gradientTriangleVAO;

			const shape = new MovingShape(
				position,
				velocity,
				size,
				lifetime,
				vao
			);
			shapes.push(shape);
		}

		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		gl.viewport(0, 0, canvas.width, canvas.height);

		gl.useProgram(triangleShaderProgram);

		gl.uniform2f(canvasSizeUniform, canvas.width, canvas.height);

		// Update shapes
		for (let i = 0; i < shapes.length; i++) {
			shapes[i].update(dt);

			gl.uniform1f(shapeSizeUniform, shapes[i].size);
			gl.uniform2f(
				shapeLocationUniform,
				shapes[i].position[0],
				shapes[i].position[1]
			);

			gl.bindVertexArray(shapes[i].vao);
			gl.drawArrays(
				// tells the GPU what kind of thind to draw
				gl.TRIANGLES,

				// which vertex to start from, idk why this is needed since polygons anyways will always do every edge anyways
				0,

				// how many vertices the shape has in total, triangle has 3
				3
			);
		}

		shapes = shapes
			.filter((shape) => shape.isAlive())
			.slice(0, MAX_SHAPE_COUNT);

		requestAnimationFrame(frame);
	};
	requestAnimationFrame(frame);
}
