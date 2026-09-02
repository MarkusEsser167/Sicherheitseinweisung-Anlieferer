/**
 * Unterschriftenfeld auf einem Canvas (Finger oder Stift).
 *
 * Das Papierformular sieht eine Unterschrift vor - die App bildet sie deshalb
 * ebenfalls ab. Gezeichnet wird ueber Pointer-Events, damit Touch, Stift und
 * Maus ohne Sonderfaelle funktionieren.
 */

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {{isEmpty: () => boolean, clear: () => void, toDataURL: () => string|null, destroy: () => void}}
 */
export function attachSignaturePad(canvas) {
  const ctx = canvas.getContext("2d");
  let drawing = false;
  let empty = true;
  let last = null;

  /**
   * Canvas auf die tatsaechliche Anzeigegroesse bringen. Ohne diese Skalierung
   * waere die Unterschrift auf hochaufloesenden Displays verzerrt und unscharf.
   */
  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    const snapshot = empty ? null : canvas.toDataURL("image/png");
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    if (snapshot) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = snapshot;
    }
  }

  function pos(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function onDown(event) {
    event.preventDefault();
    drawing = true;
    last = pos(event);
    canvas.setPointerCapture(event.pointerId);
  }

  function onMove(event) {
    if (!drawing) return;
    event.preventDefault();
    const p = pos(event);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
    empty = false;
  }

  function onUp(event) {
    if (!drawing) return;
    drawing = false;
    // Ein einzelner Tipp ohne Bewegung soll auch als Strich sichtbar sein.
    if (last) {
      ctx.beginPath();
      ctx.arc(last.x, last.y, 1.1, 0, Math.PI * 2);
      ctx.fillStyle = "#111827";
      ctx.fill();
      empty = false;
    }
    last = null;
    if (event && canvas.hasPointerCapture && canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  }

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("pointerleave", onUp);
  window.addEventListener("resize", resize);
  resize();

  return {
    isEmpty: () => empty,
    clear() {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      empty = true;
    },
    /** Weisser Hintergrund statt Transparenz - sonst wird die Unterschrift im PDF schwarz. */
    toDataURL() {
      if (empty) return null;
      const out = document.createElement("canvas");
      out.width = canvas.width;
      out.height = canvas.height;
      const octx = out.getContext("2d");
      octx.fillStyle = "#ffffff";
      octx.fillRect(0, 0, out.width, out.height);
      octx.drawImage(canvas, 0, 0);
      return out.toDataURL("image/png");
    },
    destroy() {
      window.removeEventListener("resize", resize);
    },
  };
}
