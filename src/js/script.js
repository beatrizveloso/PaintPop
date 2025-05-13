const baseCanvas = document.getElementById("baseCanvas");
const baseCtx = baseCanvas.getContext("2d");

const canvas = document.getElementById("paintCanvas");
const ctx = canvas.getContext("2d");

const colorOptions = document.getElementById("color-options");
const colorPicker = document.getElementById("customColor");
const colorPanel = document.getElementById("colorPanel");

const colors = ["#f44336", "#4caf50", "#2196f3", "#ffeb3b", "#9c27b0", "#000000", "#ffffff"];
let currentTool = "pencil";
let currentColor = "#000000";
let isDrawing = false;

canvas.width = canvas.height = baseCanvas.width = baseCanvas.height = 500;
const history = [];

function saveState() {
  history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  if (history.length > 20) history.shift();
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
  if (currentTool === "pencil") {
    ctx.lineWidth = 5;
  } else if (currentTool === "brush") {
    ctx.lineWidth = 20;
  } else {
    ctx.lineWidth = 0;
  }
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
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
      colorPicker.value = color;
    });
    colorOptions.appendChild(div);
  });
}

colorPicker.addEventListener("change", () => {
  currentColor = colorPicker.value;
});

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mouseup", endDraw);
canvas.addEventListener("mousemove", handleDraw);
canvas.addEventListener("touchstart", startDraw);
canvas.addEventListener("touchend", endDraw);
canvas.addEventListener("touchmove", handleDraw);

function startDraw(e) {
  const { x, y } = getXY(e);
  if (currentTool === "bucket") {
    saveState();
    fillArea(x, y);
    return;
  }
  saveState();
  isDrawing = true;
  ctx.strokeStyle = currentColor;
  ctx.beginPath();
  ctx.moveTo(x, y);
}

function endDraw() {
  isDrawing = false;
  ctx.closePath();
}

function handleDraw(e) {
  e.preventDefault();
  const { x, y } = getXY(e);
  if (isDrawing && currentTool !== "bucket") {
    ctx.strokeStyle = currentColor;
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

function getXY(e) {
  const rect = canvas.getBoundingClientRect();
  if (e.touches) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  }
  return {
    x: e.offsetX,
    y: e.offsetY
  };
}

function fillArea(x, y) {
  const width = canvas.width;
  const height = canvas.height;

  const paintData = ctx.getImageData(0, 0, width, height);
  const baseData = baseCtx.getImageData(0, 0, width, height);
  const data = paintData.data;
  const base = baseData.data;

  const targetColor = getColorAtPixel(data, x, y, width);
  const wallColor = getColorAtPixel(base, x, y, width);
  const fillColor = hexToRgb(currentColor);

  if (!fillColor || colorsMatch(targetColor, fillColor)) return;

  const stack = [{ x, y }];
  const visited = new Set();

  while (stack.length) {
    const { x: cx, y: cy } = stack.pop();
    const idx = cy * width + cx;

    if (cx < 0 || cy < 0 || cx >= width || cy >= height || visited.has(idx)) continue;
    visited.add(idx);

    const curr = getColorAtPixel(data, cx, cy, width);
    const wall = getColorAtPixel(base, cx, cy, width);

    if (!colorsMatch(curr, targetColor)) continue;
    if (colorsMatch(wall, [0, 0, 0])) continue; // bloqueia em preto

    setColorAtPixel(data, cx, cy, width, fillColor);

    stack.push({ x: cx + 1, y: cy });
    stack.push({ x: cx - 1, y: cy });
    stack.push({ x: cx, y: cy + 1 });
    stack.push({ x: cx, y: cy - 1 });
  }

  ctx.putImageData(paintData, 0, 0);
}

function getColorAtPixel(data, x, y, width) {
  const index = (y * width + x) * 4;
  return [data[index], data[index + 1], data[index + 2]];
}

function setColorAtPixel(data, x, y, width, color) {
  const index = (y * width + x) * 4;
  data[index] = color[0];
  data[index + 1] = color[1];
  data[index + 2] = color[2];
  data[index + 3] = 255;
}

function colorsMatch(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

function hexToRgb(hex) {
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

  finalCtx.drawImage(baseCanvas, 0, 0);
  finalCtx.drawImage(canvas, 0, 0);

  const dataURL = finalCanvas.toDataURL();
  localStorage.setItem("paintedImage", dataURL);
  window.location.href = "save.html";
});
