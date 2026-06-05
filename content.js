(() => {
  // Prevent double injection
  if (window.__annotatorInjected__) return;
  window.__annotatorInjected__ = true;

  // ========== STATE ==========
  let isActive = false;
  let currentTool = 'mouse';
  let currentColor = '#ffffff';
  let currentSize = 4;
  let isDrawing = false;
  let lastX = 0, lastY = 0;

  // ========== CREATE CANVAS ==========
  const canvas = document.createElement('canvas');
  canvas.id = '__annotator_canvas__';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  window.addEventListener('resize', () => {
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.putImageData(img, 0, 0);
  });

  // ========== BUILD TOOLBAR ==========
  const toolbar = document.createElement('div');
  toolbar.id = '__annotator_toolbar__';
  toolbar.classList.add('ann-hidden');

  toolbar.innerHTML = `
    <div class="__ann_drag_handle__" id="__ann_drag__"></div>
    <div class="__ann_label__">Tools</div>

    <button class="__ann_tool_btn__ ann-active-tool" data-tool="mouse" title="Mouse (M)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 3l14 9-7 1-4 7L5 3z"/>
      </svg>
      <span class="__ann_tool_lbl__">MOUSE</span>
    </button>

    <button class="__ann_tool_btn__" data-tool="pencil" title="Pencil (P)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
      </svg>
      <span class="__ann_tool_lbl__">PENCIL</span>
    </button>

    <button class="__ann_tool_btn__" data-tool="marker" title="Marker (K)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="m12 19 7-7 3 3-7 7-3-3z"/>
        <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
        <path d="m2 2 7.586 7.586"/>
        <circle cx="11" cy="11" r="2"/>
      </svg>
      <span class="__ann_tool_lbl__">MARKER</span>
    </button>

    <button class="__ann_tool_btn__" data-tool="eraser" title="Eraser (E)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/>
        <path d="M22 21H7"/>
        <path d="m5 11 9 9"/>
      </svg>
      <span class="__ann_tool_lbl__">ERASER</span>
    </button>

    <div class="__ann_divider__"></div>
    <div class="__ann_label__">Color</div>

    <div class="__ann_color_row__">
      <div class="__ann_color_dot__ ann-color-active" style="background:#ffffff" data-color="#ffffff"></div>
      <div class="__ann_color_dot__" style="background:#ff5f5f" data-color="#ff5f5f"></div>
      <div class="__ann_color_dot__" style="background:#ffd166" data-color="#ffd166"></div>
      <div class="__ann_color_dot__" style="background:#06d6a0" data-color="#06d6a0"></div>
      <div class="__ann_color_dot__" style="background:#7c6aff" data-color="#7c6aff"></div>
      <div class="__ann_color_dot__" style="background:#ff6a9e" data-color="#ff6a9e"></div>
      <div class="__ann_color_dot__" style="background:#00c8ff" data-color="#00c8ff"></div>
      <div class="__ann_color_dot__" style="background:#ff9500" data-color="#ff9500"></div>
    </div>

    <div class="__ann_divider__"></div>

    <div class="__ann_size_wrap__">
      <div class="__ann_size_label__">
        <span>SIZE</span>
        <span id="__ann_size_val__">4px</span>
      </div>
      <input class="__ann_slider__" id="__ann_slider__" type="range" min="1" max="40" value="4">
    </div>

    <div class="__ann_divider__"></div>

    <button class="__ann_tool_btn__" id="__ann_clear__" title="Clear all">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
      </svg>
      <span class="__ann_tool_lbl__">CLEAR</span>
    </button>

    <button class="__ann_off_btn__" id="__ann_off__">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
        <line x1="12" y1="2" x2="12" y2="12"/>
      </svg>
      <span>OFF</span>
    </button>
  `;

  document.body.appendChild(toolbar);

  // ========== STATUS CHIP ==========
  const chip = document.createElement('div');
  chip.className = '__ann_status_chip__';
  chip.textContent = '● ANNOTATOR ACTIVE';
  document.body.appendChild(chip);

  // ========== ACTIVATE / DEACTIVATE ==========
  function activate() {
    isActive = true;
    toolbar.classList.remove('ann-hidden');
    toolbar.classList.add('ann-visible');
    chip.classList.add('ann-chip-show');
    setTool('mouse');
  }

  function deactivate() {
    isActive = false;
    toolbar.classList.remove('ann-visible');
    toolbar.classList.add('ann-hidden');
    chip.classList.remove('ann-chip-show');
    canvas.classList.remove('ann-draw-active');
    canvas.style.cursor = '';
  }

  // ========== TOOL LOGIC ==========
  function setTool(tool) {
    currentTool = tool;
    toolbar.querySelectorAll('.__ann_tool_btn__[data-tool]').forEach(btn => {
      btn.classList.toggle('ann-active-tool', btn.dataset.tool === tool);
    });

    canvas.classList.remove('ann-draw-active');
    canvas.style.cursor = '';

    if (tool !== 'mouse') {
      canvas.classList.add('ann-draw-active');
      canvas.style.cursor = tool === 'eraser' ? 'cell' : 'crosshair';
    }
  }

  // Tool buttons
  toolbar.querySelectorAll('.__ann_tool_btn__[data-tool]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setTool(btn.dataset.tool);
    });
  });

  // Color dots
  toolbar.querySelectorAll('.__ann_color_dot__').forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      toolbar.querySelectorAll('.__ann_color_dot__').forEach(d => d.classList.remove('ann-color-active'));
      dot.classList.add('ann-color-active');
      currentColor = dot.dataset.color;
    });
  });

  // Size slider
  const slider = document.getElementById('__ann_slider__');
  const sizeVal = document.getElementById('__ann_size_val__');
  slider.addEventListener('input', (e) => {
    e.stopPropagation();
    currentSize = parseInt(slider.value);
    sizeVal.textContent = currentSize + 'px';
  });

  // Clear
  document.getElementById('__ann_clear__').addEventListener('click', (e) => {
    e.stopPropagation();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  // Off
  document.getElementById('__ann_off__').addEventListener('click', (e) => {
    e.stopPropagation();
    deactivate();
  });

  // ========== DRAWING ==========
  function getPos(e) {
    if (e.touches && e.touches.length) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function getLineWidth() {
    if (currentTool === 'marker') return currentSize * 3;
    if (currentTool === 'eraser') return currentSize * 5;
    return currentSize;
  }

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  canvas.addEventListener('mousedown', (e) => {
    if (!isActive || currentTool === 'mouse') return;
    e.preventDefault();
    e.stopPropagation();
    isDrawing = true;
    const pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;
    // dot on click
    if (currentTool !== 'eraser') {
      ctx.beginPath();
      ctx.arc(lastX, lastY, getLineWidth() / 2, 0, Math.PI * 2);
      ctx.fillStyle = currentTool === 'marker' ? hexToRgba(currentColor, 0.45) : hexToRgba(currentColor, 0.92);
      ctx.fill();
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing || !isActive) return;
    e.preventDefault();
    const pos = getPos(e);
    const x = pos.x, y = pos.y;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);

    if (currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = getLineWidth();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    } else if (currentTool === 'marker') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = hexToRgba(currentColor, 0.45);
      ctx.lineWidth = getLineWidth();
      ctx.lineCap = 'square';
      ctx.lineJoin = 'bevel';
      ctx.stroke();
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = hexToRgba(currentColor, 0.92);
      ctx.lineWidth = getLineWidth();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    lastX = x;
    lastY = y;
  });

  const stopDraw = () => {
    isDrawing = false;
    ctx.globalCompositeOperation = 'source-over';
  };

  canvas.addEventListener('mouseup', stopDraw);
  canvas.addEventListener('mouseleave', stopDraw);
  canvas.addEventListener('touchstart', (e) => {
    if (!isActive || currentTool === 'mouse') return;
    e.preventDefault();
    isDrawing = true;
    const pos = getPos(e);
    lastX = pos.x; lastY = pos.y;
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: pos.x, clientY: pos.y }));
  }, { passive: false });
  canvas.addEventListener('touchend', stopDraw);

  // ========== DRAG TOOLBAR ==========
  const dragHandle = document.getElementById('__ann_drag__');
  let dragging = false;
  let dragOffX = 0, dragOffY = 0;

  dragHandle.addEventListener('mousedown', (e) => {
    dragging = true;
    const rect = toolbar.getBoundingClientRect();
    dragOffX = e.clientX - rect.left;
    dragOffY = e.clientY - rect.top;
    toolbar.style.transition = 'none';
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const x = Math.max(0, Math.min(window.innerWidth - toolbar.offsetWidth, e.clientX - dragOffX));
    const y = Math.max(0, Math.min(window.innerHeight - toolbar.offsetHeight, e.clientY - dragOffY));
    toolbar.style.right = 'auto';
    toolbar.style.left = x + 'px';
    toolbar.style.top = y + 'px';
  });

  document.addEventListener('mouseup', () => {
    dragging = false;
    toolbar.style.transition = '';
  });

  // ========== KEYBOARD SHORTCUTS ==========
  document.addEventListener('keydown', (e) => {
    if (!isActive) return;
    const tag = document.activeElement.tagName.toLowerCase();
    if (['input','textarea','select'].includes(tag)) return;
    if (e.key === 'm' || e.key === 'M') setTool('mouse');
    if (e.key === 'p' || e.key === 'P') setTool('pencil');
    if (e.key === 'k' || e.key === 'K') setTool('marker');
    if (e.key === 'e' || e.key === 'E') setTool('eraser');
    if (e.key === 'Escape') deactivate();
  });

  // ========== MESSAGE LISTENER (from popup) ==========
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'TOGGLE') {
      if (isActive) deactivate(); else activate();
      sendResponse({ active: isActive });
      return true;
    }
    if (msg.type === 'GET_STATE') {
      sendResponse({ active: isActive });
      return true;
    }
  });

})();
