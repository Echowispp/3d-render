//=============
// DEFINITIONS
//=============

const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

const errorDiv = document.getElementById("errorDiv");
const errorParagraph = document.getElementById("errorParagraph");

//=================
// CANVAS RESIZING
//=================

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
	console.log(err);
}

//===========
// RENDERING
//===========

function softRender() {
	try {
		renderTriangle();
	} catch (e) {
		showError(`Error caught in renderTriangle(), error cause: ${e}`);
	}
}

function renderTriangle() {
	if (!canvas) {
		showError("Error: canvas not found at renderTriangle()");
		return;
	}
	if (!gl) {
		showError(
			"Error: WebGL2 context not found, this liekly means your browser doesn't support it - this demo will not work, you can try another browser"
		);
		return;
	}

	const triangleVertices = [
		// Top middle
		0.0, 0.5,

		// Bottom left
		-0.5, -0.5,

		// Bottom right
		0.5, -0.5,
	];
	const triangleVerticesCPUBuffer = new Float32Array(triangleVertices);

	const triangleGeoBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, triangleVerticesCPUBuffer, gl.STATIC_DRAW);

	const vertexShaderSourceCodeGLSL = `#version 300 es
	precision mediump float; 

	in vec2 vertex_position;

	void main(){

	gl_Position = vec4(vertex_position.x, vertex_position.y, 0.0, 1.0);
	
	}`;

	const vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vertexShaderSourceCodeGLSL);
	gl.compileShader(vertexShader);

	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		const compileError = gl.getShaderInfoLog(vertexShader);

		showError(`Failed to compile vertex shader - ${compileError}`);
		return;
	}

	const fragmentShaderSourceCodeGLSL = `#version 300 es
	precision mediump float;

	out vec4 output_color;

	void main() {

	output_color = vec4(0.294, 0.0, 0.51, 1.0);

	}`;

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

	if (vertexPositionAttributeLocation < 0) {
		showError("Failed to get attribute location for vertex_position");
		return;
	}

	gl.clearColor(1, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.viewport(0, 0, canvas.width, canvas.height);

	gl.useProgram(triangleShaderProgram);
	gl.enableVertexAttribArray(vertexPositionAttributeLocation);

	// This is here for redundancy, I'm pretty good at forgetting stuff so this is here such that the program will be less error-prone
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
	gl.vertexAttribPointer(
		/** these comments aren't really needed, but if I need to debug at some point, these will be necessary for my forgetful brain */

		/** index: which attribute to use */
		vertexPositionAttributeLocation,
		/** size: how many components does said attribute have? */
		2,
		/** type: what is this data's type? */
		gl.FLOAT,
		/** normalized: makes ints into floats, I don't need that */
		false,
		/** stride: how many bytes to move forward to find the next vertex's attributes */
		0,
		/** offset: how many bytes should be skipped before looking at attributes (it's always the first one since there is only 1 option for it, so skip 0) */
		0
	);

	gl.drawArrays(
		/** tells the GPU what kind of thind to draw */
		gl.TRIANGLES,
		/** which vertex to start from, idk why this is needed since polygons anyways will always do every edge anyways */
		0,
		/** how many vertices the shape has in total, triangle has 3 */
		3
	);
}
