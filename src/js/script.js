const baseCanvas = document.getElementById("baseCanvas");
const baseCtx = baseCanvas.getContext("2d");

const canvas = document.getElementById("paintCanvas");
const ctx = canvas.getContext("2d");

const colorOptions = document.getElementById("color-options");
const colorPicker = document.getElementById("customColor");
const colorPanel = document.getElementById("colorPanel");

const colors = ["#f44336", "#4caf50", "#2196f3", "#ffeb3b", "#9c27b0", "#000", "#fff"];
let currentTool = "pencil";
let currentColor = "#000";
let isDrawing = false;

canvas.width = canvas.height = baseCanvas.width = baseCanvas.height = 500;

const history = [];

function saveState() {
  history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  if (history.length > 20) history.shift(); // Limita o histórico
}

document.getElementById("undo-btn").addEventListener("click", () => {
  if (history.length > 0) {
    const prev = history.pop();
    ctx.putImageData(prev, 0, 0);
  }
});

function getImageFromURL() {
  const params = new URLSearchParams(window.location.search);
  const imgName = params.get("img") || "bobbie.jpg";
  return `src/images/${imgName}`;
}

const img = new Image();
img.crossOrigin = "anonymous";
img.src = getImageFromURL();
img.onload = () => {
  baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
  baseCtx.drawImage(img, 0, 0, baseCanvas.width, baseCanvas.height);
};

document.querySelectorAll(".tool-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    currentTool = btn.getAttribute("data-tool");
    updateBrushSize();
    showColorOptions();
  });
});

function updateBrushSize() {
  ctx.lineWidth = currentTool === "pencil" ? 1 : currentTool === "brush" ? 10 : 0;
}

function showColorOptions() {
  colorPanel.style.display = "flex";
  colorOptions.innerHTML = "";

  colors.forEach(color => {
    const div = document.createElement("div");
    div.className = "color-option";
    div.style.backgroundColor = color;
    div.addEventListener("click", () => {
      currentColor = color;
    });
    colorOptions.appendChild(div);
  });
}

colorPicker.addEventListener("change", () => {
  currentColor = colorPicker.value;
});

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mouseup", endDraw);
canvas.addEventListener("mousemove", draw);

function startDraw(e) {
  if (currentTool === "bucket") {
    saveState();
    fillArea(e.offsetX, e.offsetY);
    return;
  }
  saveState();
  isDrawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
}

function endDraw() {
  isDrawing = false;
  ctx.closePath();
}

function draw(e) {
  if (!isDrawing || currentTool === "bucket") return;
  ctx.strokeStyle = currentColor;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
}

function fillArea(x, y) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const targetColor = getPixel(imageData, x, y);
  const fillColor = hexToRgb(currentColor);
  if (!fillColor || colorsMatch(targetColor, fillColor)) return;

  floodFill(imageData, x, y, targetColor, fillColor);
  ctx.putImageData(imageData, 0, 0);
}

function getPixel(imageData, x, y) {
  const i = (y * imageData.width + x) * 4;
  return [imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]];
}

function colorsMatch(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

function floodFill(imageData, x, y, targetColor, fillColor) {
  const stack = [[x, y]];
  const { width, height, data } = imageData;

  while (stack.length) {
    const [px, py] = stack.pop();
    if (px < 0 || py < 0 || px >= width || py >= height) continue;

    const i = (py * width + px) * 4;
    const current = [data[i], data[i + 1], data[i + 2]];

    if (!colorsMatch(current, targetColor)) continue;
    if (colorsMatch(current, [0, 0, 0])) continue;

    data[i] = fillColor[0];
    data[i + 1] = fillColor[1];
    data[i + 2] = fillColor[2];

    stack.push([px + 1, py]);
    stack.push([px - 1, py]);
    stack.push([px, py + 1]);
    stack.push([px, py - 1]);
  }
}

function hexToRgb(hex) {
  if (!/^#?[0-9A-Fa-f]{6}$/.test(hex)) return null;
  hex = hex.replace("#", "");
  return [
    parseInt(hex.substr(0, 2), 16),
    parseInt(hex.substr(2, 2), 16),
    parseInt(hex.substr(4, 2), 16)
  ];
}

document.getElementById("save-btn").addEventListener("click", () => {
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = canvas.width;
  finalCanvas.height = canvas.height;
  const finalCtx = finalCanvas.getContext("2d");

  finalCtx.drawImage(canvas, 0, 0);
  finalCtx.drawImage(baseCanvas, 0, 0);

  const dataURL = finalCanvas.toDataURL();
  localStorage.setItem("paintedImage", dataURL);
  window.location.href = "save.html";
});
