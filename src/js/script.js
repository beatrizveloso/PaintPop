const baseCanvas = document.getElementById("baseCanvas");
const baseCtx = baseCanvas.getContext("2d");

const canvas = document.getElementById("paintCanvas");
const ctx = canvas.getContext("2d");

const colorOptions = document.getElementById("color-options");
const colorPicker = document.getElementById("customColor");
const colorPanel = document.getElementById("colorPanel");

const toolButtons = document.querySelectorAll(".tool-btn");
const toolPanel = document.getElementById("toolPanel");

const clearBtn = document.getElementById("clear-btn");
const brushRange = document.getElementById("brushRange");
const brushIndicator = document.getElementById("brushIndicator");
const eyedropperBtn = document.getElementById("eyedropper-btn");
const eraserBtn = document.getElementById("eraser-btn");
const undoBtn = document.getElementById("undo-btn");
const redoBtn = document.getElementById("redo-btn");
const saveBtn = document.getElementById("save-btn");

const colors = ["#f44336", "#4caf50", "#2196f3", "#ffeb3b", "#9c27b0", "#000000", "#ffffff"];

let currentTool = "pencil";
let currentColor = "#000000";
let selectedColor = "#000000";
let isDrawing = false;
let brushSize = 5;

canvas.width = canvas.height = baseCanvas.width = baseCanvas.height = 500;

const history = [];
const redoHistory = [];

function saveState() {
    if (history.length >= 20) history.shift();
    history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    redoHistory.length = 0;
    updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
    undoBtn.disabled = history.length === 0;
    redoBtn.disabled = redoHistory.length === 0;
}

undoBtn.addEventListener("click", () => {
    if (history.length > 0) {
        redoHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        const prev = history.pop();
        ctx.putImageData(prev, 0, 0);
        updateUndoRedoButtons();
    }
});

redoBtn.addEventListener("click", () => {
    if (redoHistory.length > 0) {
        history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        const redoState = redoHistory.pop();
        ctx.putImageData(redoState, 0, 0);
        updateUndoRedoButtons();
    }
});

clearBtn.addEventListener("click", () => {
    const confirmed = confirm("Tem certeza que deseja limpar a tela? Esta ação não pode ser desfeita.");
    if (confirmed) {
        saveState();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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

function updateBrushSize() {
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    brushIndicator.style.width = brushIndicator.style.height = brushSize + "px";
}
updateBrushSize();

brushRange.addEventListener("input", () => {
    brushSize = parseInt(brushRange.value);
    updateBrushSize();
});

function showColorOptions() {
    colorPanel.style.display = "flex";
    colorOptions.innerHTML = "";

    colors.forEach(color => {
        const div = document.createElement("div");
        div.className = "color-option";
        div.style.backgroundColor = color;
        div.addEventListener("click", () => {
            currentColor = color;
            selectedColor = color;
            colorPicker.value = color;
            if (currentTool !== "eraser") ctx.strokeStyle = currentColor;
        });
        colorOptions.appendChild(div);
    });
}
showColorOptions();

colorPicker.addEventListener("input", () => {
    currentColor = colorPicker.value;
    selectedColor = colorPicker.value;
    if (currentTool !== "eraser") ctx.strokeStyle = currentColor;
});

toolButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        toolButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        currentTool = btn.dataset.tool;

        if (currentTool === "eraser") {
            ctx.strokeStyle = "#ffffff";
        } else {
            ctx.strokeStyle = currentColor;
        }

        updateBrushSize();
        showToolOptions(currentTool);

        if (currentTool === "pencil" || currentTool === "brush") {
            colorPanel.style.display = "flex";
        } else {
            colorPanel.style.display = "none";
        }
    });
});

eraserBtn.addEventListener("click", function() {
    currentTool = "eraser";
    toolButtons.forEach(b => b.classList.remove("active"));
    this.classList.add("active");
    ctx.strokeStyle = "#ffffff";
    colorPanel.style.display = "none";
    updateBrushSize();
});

eyedropperBtn.addEventListener("click", function() {
    currentTool = "eyedropper";
    toolButtons.forEach(b => b.classList.remove("active"));
    this.classList.add("active");
    colorPanel.style.display = "none";
    canvas.style.cursor = "crosshair";
});

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mouseup", endDraw);
canvas.addEventListener("mouseout", endDraw);
canvas.addEventListener("mousemove", handleDraw);

canvas.addEventListener("touchstart", startDraw);
canvas.addEventListener("touchend", endDraw);
canvas.addEventListener("touchcancel", endDraw);
canvas.addEventListener("touchmove", handleDraw);

function startDraw(e) {
    e.preventDefault();
    const { x, y } = getXY(e);

    if (currentTool === "bucket") {
        saveState();
        fillArea(x, y);
        return;
    }

    if (currentTool === "eyedropper") {
        const pixelData = ctx.getImageData(x, y, 1, 1).data;
        if (pixelData[3] > 0) {
            const hexColor = rgbToHex(pixelData[0], pixelData[1], pixelData[2]);
            currentColor = selectedColor = hexColor;
            colorPicker.value = hexColor;
            ctx.strokeStyle = hexColor;
            currentTool = "pencil";
            toolButtons.forEach(b => b.classList.remove("active"));
            document.querySelector('.tool-btn[data-tool="pencil"]').classList.add("active");
            colorPanel.style.display = "flex";
            canvas.style.cursor = "";
        }
        return;
    }

    saveState();
    isDrawing = true;
    ctx.strokeStyle = currentTool === "eraser" ? "#ffffff" : currentColor;
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function endDraw() {
    if (isDrawing) {
        isDrawing = false;
        ctx.closePath();
    }
}

function handleDraw(e) {
    e.preventDefault();
    if (!isDrawing) return;

    const { x, y } = getXY(e);
    if (currentTool === "bucket" || currentTool === "eyedropper") return;

    ctx.lineTo(x, y);
    ctx.stroke();
}

function getXY(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length) {
        return {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top,
        };
    }
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
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
        if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;

        const idx = cy * width + cx;
        if (visited.has(idx)) continue;
        visited.add(idx);

        const curr = getColorAtPixel(data, cx, cy, width);
        const wall = getColorAtPixel(base, cx, cy, width);

        if (!colorsMatch(curr, targetColor)) continue;
        if (colorsMatch(wall, [0, 0, 0])) continue;

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
        parseInt(hex.substr(4, 2), 16),
    ];
}

function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");
}

function showToolOptions(tool) {
    toolPanel.innerHTML = "";
    toolPanel.classList.add("active");

    if (tool === "bucket") {
      const palette = [
          "#CC001A", "#FF0114", "#F73E6F", "#F77C9C", "#FFA2B9",
          "#F97316", "#FF7F50", "#FFA07A", "#FFBCB3", "#FFD1BA",
          "#FCD34D", "#FDE68A", "#FFF1B6", "#FFF8D6", "#D4AF37",
          "#A3E635", "#22AE55", "#88E291", "#4B9217", "#506219",
          "#22D3EE", "#99F6E4", "#CFFAFE", "#0F766E", "#2DD4BF",
          "#3B82F6", "#93C5FD", "#C7D2FE", "#A5B4FC", "#1E3A8A",
          "#8B5CF6", "#C4B5FD", "#E9D5FF", "#D8B4FE", "#7C3AED",
          "#B5651D", "#D97706", "#6F4E37", "#937B5F", "#D0AD89",
          "#D1D5DB", "#9CA3AF", "#6B7280", "#F3F4F6", "#1F2937",
          "#FFFFFF", "#FFDAE9", "#E0BBE4", "#A2D2FF", "#7EEFAA"
      ];
  
      palette.forEach(color => {
          const img = document.createElement("img");
          img.src = `src/images/bucket_${color.replace("#", "")}.png`;
          img.alt = `bucket ${color}`;
          img.dataset.color = color;
          img.addEventListener("click", () => {
              currentColor = selectedColor = color;
          });
          toolPanel.appendChild(img);
      });
  
      const colorInput = document.createElement("input");
      colorInput.type = "color";
      colorInput.className = "color-picker";
      colorInput.value = currentColor;
      colorInput.addEventListener("input", () => {
          currentColor = selectedColor = colorInput.value;
      });
      toolPanel.appendChild(colorInput);
  }
  
    else if (tool === "pencil" || tool === "brush") {
        const palette = [
            "#CC001A", "#FF0114", "#F73E6F", "#F77C9C", "#FFA2B9",
            "#F97316", "#FF7F50", "#FFA07A", "#FFBCB3", "#FFD1BA",
            "#FCD34D", "#FDE68A", "#FFF1B6", "#FFF8D6", "#D4AF37",
            "#A3E635", "#22AE55", "#88E291", "#4B9217", "#506219",
            "#22D3EE", "#99F6E4", "#CFFAFE", "#0F766E", "#2DD4BF",
            "#3B82F6", "#93C5FD", "#C7D2FE", "#A5B4FC", "#1E3A8A",
            "#8B5CF6", "#C4B5FD", "#E9D5FF", "#D8B4FE", "#7C3AED",
            "#B5651D", "#D97706", "#6F4E37", "#937B5F", "#D0AD89",
            "#D1D5DB", "#9CA3AF", "#6B7280", "#F3F4F6", "#1F2937",
            "#FFFFFF", "#FFDAE9", "#E0BBE4", "#A2D2FF", "#7EEFAA"
        ];

        palette.forEach(color => {
            const img = document.createElement("img");
            img.src = `src/images/${tool}_${color.replace("#", "")}.png`;
            img.alt = `${tool} ${color}`;
            img.dataset.color = color;
            img.addEventListener("click", () => {
                currentColor = selectedColor = color;
                ctx.strokeStyle = currentColor;
            });
            toolPanel.appendChild(img);
        });

        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.className = "color-picker";
        colorInput.value = currentColor;
        colorInput.addEventListener("input", () => {
            currentColor = selectedColor = colorInput.value;
            ctx.strokeStyle = currentColor;
        });
        toolPanel.appendChild(colorInput);
    }
    else {
        toolPanel.classList.remove("active");
    }
}

saveBtn.addEventListener("click", () => {
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

document.querySelector('.tool-btn[data-tool="pencil"]').click();
updateUndoRedoButtons();