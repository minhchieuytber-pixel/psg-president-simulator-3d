// src/core/TextureFactory.js
// Tạo vật liệu PBR thủ tục (gỗ trầm, đá cẩm thạch, cỏ sân bóng, huy hiệu PSG, áo đấu, màn hình)
export class TextureFactory {
  constructor() {
    this.cache = new Map();
  }

  get(key, generator) {
    if (this.cache.has(key)) return this.cache.get(key);
    const tex = generator();
    this.cache.set(key, tex);
    return tex;
  }

  makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return [c, c.getContext('2d')];
  }

  woodTexture(base = '#4a2f23', grain = '#2f1b13') {
    return this.get(`wood_${base}_${grain}`, () => {
      const [c, ctx] = this.makeCanvas(256, 256);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = grain;
      for (let i = 0; i < 65; i++) {
        ctx.globalAlpha = 0.12 + (i % 5) * 0.04;
        ctx.lineWidth = 1 + (i % 3);
        ctx.beginPath();
        const y = (i / 65) * 256;
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(85, y + Math.sin(i) * 6, 170, y - Math.cos(i) * 6, 256, y);
        ctx.stroke();
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  marbleTexture(base = '#e6e2d8', vein = '#c7c1b5') {
    return this.get(`marble_${base}_${vein}`, () => {
      const [c, ctx] = this.makeCanvas(256, 256);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, 256, 256);
      // Tile seams
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 126, 126);
      ctx.strokeRect(129, 1, 126, 126);
      ctx.strokeRect(1, 129, 126, 126);
      ctx.strokeRect(129, 129, 126, 126);
      // Veins
      ctx.strokeStyle = vein;
      for (let i = 0; i < 18; i++) {
        ctx.globalAlpha = 0.18;
        ctx.lineWidth = 1 + (i % 2);
        ctx.beginPath();
        ctx.moveTo((i * 37) % 256, 0);
        ctx.quadraticCurveTo(((i * 91) % 256), 128, ((i * 53 + 80) % 256), 256);
        ctx.stroke();
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(8, 5);
      return tex;
    });
  }

  grassPitchTexture(withMarkings = true) {
    return this.get(`pitch_${withMarkings}`, () => {
      const [c, ctx] = this.makeCanvas(1024, 640);
      const stripes = 14;
      const sw = 1024 / stripes;
      for (let i = 0; i < stripes; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#2b6f38' : '#256130';
        ctx.fillRect(i * sw, 0, sw + 1, 640);
      }
      // Subtle grass grain
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let i = 0; i < 1200; i++) {
        ctx.fillRect((i * 73) % 1024, (i * 41) % 640, 2, 2);
      }
      if (withMarkings) {
        ctx.strokeStyle = 'rgba(255,255,255,0.92)';
        ctx.lineWidth = 5;
        ctx.strokeRect(36, 36, 952, 568);
        // Halfway line
        ctx.beginPath();
        ctx.moveTo(512, 36);
        ctx.lineTo(512, 604);
        ctx.stroke();
        // Center circle
        ctx.beginPath();
        ctx.arc(512, 320, 82, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(512, 320, 6, 0, Math.PI * 2);
        ctx.fill();
        // Penalty boxes
        ctx.strokeRect(36, 148, 152, 344);
        ctx.strokeRect(36, 224, 54, 192);
        ctx.strokeRect(836, 148, 152, 344);
        ctx.strokeRect(934, 224, 54, 192);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.anisotropy = 4;
      return tex;
    });
  }

  psgCrestTexture() {
    return this.get('psg_crest', () => {
      const [c, ctx] = this.makeCanvas(256, 256);
      ctx.clearRect(0, 0, 256, 256);
      // Outer navy circle
      ctx.fillStyle = '#00205b';
      ctx.beginPath();
      ctx.arc(128, 128, 120, 0, Math.PI * 2);
      ctx.fill();
      // White/silver ring
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(128, 128, 112, 0, Math.PI * 2);
      ctx.stroke();
      // Inner blue circle
      ctx.fillStyle = '#003876';
      ctx.beginPath();
      ctx.arc(128, 128, 92, 0, Math.PI * 2);
      ctx.fill();
      // Stylized Eiffel Tower in PSG Red
      ctx.fillStyle = '#da291c';
      ctx.beginPath();
      ctx.moveTo(128, 56);
      ctx.lineTo(148, 134);
      ctx.lineTo(172, 184);
      ctx.lineTo(146, 184);
      ctx.quadraticCurveTo(128, 146, 110, 184);
      ctx.lineTo(84, 184);
      ctx.lineTo(108, 134);
      ctx.closePath();
      ctx.fill();
      // Gold Fleur-de-lis dot
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(128, 168, 10, 0, Math.PI * 2);
      ctx.fill();
      // Text PARIS
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PARIS', 128, 44);
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText('SAINT-GERMAIN', 128, 224);
      return new THREE.CanvasTexture(c);
    });
  }

  screenTexture(title = 'PSG EXECUTIVE OS', subtitle = 'PARC DES PRINCES · LIGUE 1') {
    return this.get(`screen_${title}`, () => {
      const [c, ctx] = this.makeCanvas(512, 288);
      const grad = ctx.createLinearGradient(0, 0, 512, 288);
      grad.addColorStop(0, '#07142b');
      grad.addColorStop(1, '#0f2547');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 288);
      ctx.fillStyle = '#da291c';
      ctx.fillRect(0, 0, 512, 8);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px Inter, sans-serif';
      ctx.fillText(title, 28, 56);
      ctx.fillStyle = '#93c5fd';
      ctx.font = '15px Inter, sans-serif';
      ctx.fillText(subtitle, 28, 84);
      // Mini KPI cards
      const stats = [
        ['NGÂN SÁCH', '€245M', '#38bdf8'],
        ['LIGUE 1', 'HẠNG 1', '#4ade80'],
        ['UY TÍN', '88/100', '#fbbf24']
      ];
      stats.forEach((s, idx) => {
        const x = 28 + idx * 156;
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(x, 110, 142, 74);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(s[0], x + 12, 134);
        ctx.fillStyle = s[2];
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.fillText(s[1], x + 12, 168);
      });
      // Mini bar chart
      for (let i = 0; i < 8; i++) {
        const bh = 28 + ((i * 19) % 46);
        ctx.fillStyle = i % 2 === 0 ? '#2563eb' : '#da291c';
        ctx.fillRect(28 + i * 58, 260 - bh, 38, bh);
      }
      return new THREE.CanvasTexture(c);
    });
  }

  signTexture(text, bg = '#0f172a', fg = '#f8fafc', accent = '#da291c') {
    return this.get(`sign_${text}_${bg}`, () => {
      const [c, ctx] = this.makeCanvas(512, 112);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 512, 112);
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, 14, 112);
      ctx.fillStyle = fg;
      ctx.font = 'bold 30px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 262, 58);
      return new THREE.CanvasTexture(c);
    });
  }

  tacticalBoardTexture() {
    return this.get('tactical_board', () => {
      const [c, ctx] = this.makeCanvas(512, 320);
      ctx.fillStyle = '#1b5e20';
      ctx.fillRect(0, 0, 512, 320);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(18, 18, 476, 284);
      ctx.beginPath();
      ctx.moveTo(256, 18);
      ctx.lineTo(256, 302);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(256, 160, 44, 0, Math.PI * 2);
      ctx.stroke();
      // 4-3-3 PSG magnets
      const pts = [[52,160],[130,68],[125,130],[125,190],[130,252],[225,95],[210,160],[225,225],[340,74],[365,160],[340,246]];
      pts.forEach((p, idx) => {
        ctx.fillStyle = idx === 0 ? '#facc15' : '#00205b';
        ctx.beginPath();
        ctx.arc(p[0], p[1], 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      return new THREE.CanvasTexture(c);
    });
  }

  framedJerseyTexture(num = '10') {
    return this.get(`jersey_${num}`, () => {
      const [c, ctx] = this.makeCanvas(256, 320);
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, 256, 320);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 10;
      ctx.strokeRect(8, 8, 240, 304);
      // Jersey silhouette
      ctx.fillStyle = '#00205b';
      ctx.beginPath();
      ctx.moveTo(86, 56);
      ctx.lineTo(170, 56);
      ctx.lineTo(212, 108);
      ctx.lineTo(186, 134);
      ctx.lineTo(170, 118);
      ctx.lineTo(170, 256);
      ctx.lineTo(86, 256);
      ctx.lineTo(86, 118);
      ctx.lineTo(70, 134);
      ctx.lineTo(44, 108);
      ctx.closePath();
      ctx.fill();
      // Center Hechter red stripe
      ctx.fillStyle = '#da291c';
      ctx.fillRect(114, 56, 28, 200);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(110, 56, 4, 200);
      ctx.fillRect(142, 56, 4, 200);
      // Number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(num, 128, 182);
      return new THREE.CanvasTexture(c);
    });
  }
}
