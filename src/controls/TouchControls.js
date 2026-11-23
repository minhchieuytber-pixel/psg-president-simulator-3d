// src/controls/TouchControls.js
// Điều khiển đa chạm độc lập trên iPhone Landscape: Tay trái di chuyển bằng Joystick đồng thời tay phải vuốt xoay màn hình không xung đột
export class TouchControls {
  constructor(cameraController, canvasEl, onInteract) {
    this.cam = cameraController;
    this.canvas = canvasEl;
    this.onInteract = onInteract;
    this.moveVec = { x: 0, y: 0 };
    this.sprint = false;
    this.keys = new Set();

    this.joyTouchId = null;
    this.camTouchId = null;
    this.lastCamPt = { x: 0, y: 0 };
    this.mouseDragging = false;

    this.bindKeyboard();
    this.bindMultiTouch();
  }

  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      this.keys.add(e.code);
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.sprint = true;
      if (e.code === 'KeyE' && this.onInteract) this.onInteract();
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.sprint = false;
    });
  }

  bindMultiTouch() {
    const zone = document.getElementById('joy-zone');
    const knob = document.getElementById('joy-knob');
    const maxR = 38;

    const updateKnob = (clientX, clientY) => {
      if (!zone || !knob) return;
      const rect = zone.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > maxR) {
        dx = (dx / dist) * maxR;
        dy = (dy / dist) * maxR;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.moveVec.x = dx / maxR;
      this.moveVec.y = dy / maxR;
    };

    const resetKnob = () => {
      this.joyTouchId = null;
      if (knob) knob.style.transform = 'translate(0px, 0px)';
      this.moveVec.x = 0;
      this.moveVec.y = 0;
    };

    // Ngón tay trái trên vùng Joystick
    if (zone) {
      zone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        for (const t of e.changedTouches) {
          if (this.joyTouchId === null && t.identifier !== this.camTouchId) {
            this.joyTouchId = t.identifier;
            updateKnob(t.clientX, t.clientY);
          }
        }
      }, { passive: false });

      let mouseJoy = false;
      zone.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        mouseJoy = true;
        updateKnob(e.clientX, e.clientY);
      });
      window.addEventListener('mousemove', (e) => {
        if (mouseJoy) updateKnob(e.clientX, e.clientY);
      });
      window.addEventListener('mouseup', () => {
        if (mouseJoy) { mouseJoy = false; resetKnob(); }
      });
    }

    // Lắng nghe đa chạm toàn cục trên window để tay trái giữ joystick vẫn cho phép tay phải vuốt xoay camera tự do
    window.addEventListener('touchstart', (e) => {
      const target = e.target;
      if (target && target.closest && (target.closest('#modal-backdrop.open') || target.closest('button') || target.closest('#joy-zone'))) {
        return;
      }
      for (const t of e.changedTouches) {
        if (t.identifier !== this.joyTouchId && this.camTouchId === null) {
          this.camTouchId = t.identifier;
          this.lastCamPt = { x: t.clientX, y: t.clientY };
        }
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this.joyTouchId) {
          updateKnob(t.clientX, t.clientY);
        } else if (t.identifier === this.camTouchId) {
          const dx = t.clientX - this.lastCamPt.x;
          const dy = t.clientY - this.lastCamPt.y;
          this.cam.rotate(dx, dy);
          this.lastCamPt = { x: t.clientX, y: t.clientY };
        }
      }
    }, { passive: true });

    const onEnd = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this.joyTouchId) resetKnob();
        if (t.identifier === this.camTouchId) this.camTouchId = null;
      }
    };
    window.addEventListener('touchend', onEnd, { passive: true });
    window.addEventListener('touchcancel', onEnd, { passive: true });

    // Chuột xoay camera + cuộn zoom trên máy tính
    if (this.canvas) {
      this.canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
          this.mouseDragging = true;
          this.lastCamPt = { x: e.clientX, y: e.clientY };
        }
      });
      window.addEventListener('mousemove', (e) => {
        if (!this.mouseDragging) return;
        this.cam.rotate(e.clientX - this.lastCamPt.x, e.clientY - this.lastCamPt.y);
        this.lastCamPt = { x: e.clientX, y: e.clientY };
      });
      window.addEventListener('mouseup', () => { this.mouseDragging = false; });
      this.canvas.addEventListener('wheel', (e) => {
        this.cam.zoom(e.deltaY);
      }, { passive: true });
    }
  }

  getInputVector() {
    let x = this.moveVec.x;
    let y = this.moveVec.y;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    const mag = Math.hypot(x, y);
    if (mag > 1) { x /= mag; y /= mag; }
    return { x, y, moving: mag > 0.08 };
  }
}
