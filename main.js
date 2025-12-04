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

	gl.clearColor(1, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}
