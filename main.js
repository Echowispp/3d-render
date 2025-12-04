const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

window.addEventListener("load", () => {
	resizeCanvas();
	exampleDrawFunc();
});

function resizeCanvas() {
	const area = canvas.getBoundingClientRect();
	canvas.width = area.width;
	canvas.height = area.height;
}

// this is here purely for checking that all the files are connected and that the canvas actually draws when prompted, I will actually change the cnavas context to webgl later
function exampleDrawFunc() {
	ctx.fillStyle = "#f00";
	ctx.fillRect(100, 100, 150, 150);
}
