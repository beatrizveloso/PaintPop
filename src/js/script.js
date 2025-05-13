const canvas = document.getElementById("paintCanvas");
const ctx = canvas.getContext("2d");
const colorOptions = document.getElementById("color-options");
const colorPicker = document.getElementById("customColor");
const colorPanel = document.getElementById("colorPanel");

const colors = ["#f44336", "#4caf50", "#2196f3", "#ffeb3b", "#9c27b0", "#000", "#fff"];
let currentTool = "pencil";
let currentColor = "#000";
let isDrawing = false;

canvas.width = 500;
canvas.height = 500;

function getImageFromURL() {
  const params = new URLSearchParams(window.location.search);
  const imgName = params.get("img") || "bobbie.jpg";
  return `src/images/${imgName}`;
}

const img = new Image();
img.crossOrigin = "anonymous"; // necessário se usar imagens externas
img.src = getImageFromURL();
img.onload = () => {
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
};

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mouseup", endDraw);
canvas.addEventListener("mousemove", draw);

document.querySelectorAll(".tool-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    currentTool = btn.getAttribute("data-tool");
    updateBrushSize();
    showColorOptions();
  });
});

function updateBrushSize() {
  switch (currentTool) {
    case "pencil":
      ctx.lineWidth = 1;
      break;
    case "brush":
      ctx.lineWidth = 10;
      break;
    case "bucket":
      ctx.lineWidth = 0;
      break;
  }
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

function startDraw(e) {
  if (currentTool === "bucket") {
    fillArea(e.offsetX, e.offsetY);
    return;
  }
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
    const i = (py * width + px) * 4;
    const current = [data[i], data[i + 1], data[i + 2]];

    if (!colorsMatch(current, targetColor)) continue;
    if (colorsMatch(current, [0, 0, 0])) continue; // Impede pintar linhas pretas

    data[i] = fillColor[0];
    data[i + 1] = fillColor[1];
    data[i + 2] = fillColor[2];
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
  const dataURL = canvas.toDataURL();
  localStorage.setItem("paintedImage", dataURL);
  window.location.href = "save.html";
});
