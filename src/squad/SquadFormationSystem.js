// src/squad/SquadFormationSystem.js
// Hệ thống Sơ đồ Đội hình đồng bộ toàn game (Global Squad Formation System), Tủ đồ cá nhân (LockerAssignmentSystem),
// Đội trưởng (CaptainSystem) và Lịch sinh hoạt 60 phút trước giờ tập (PlayerScheduleSystem)

export const FORMATION_PRESETS = {
  '4-3-3': [
    { role: 'GK', x: 50, y: 89 },
    { role: 'LB', x: 16, y: 71 }, { role: 'CB', x: 38, y: 74 }, { role: 'CB', x: 62, y: 74 }, { role: 'RB', x: 84, y: 71 },
    { role: 'CM', x: 28, y: 50 }, { role: 'DM', x: 50, y: 55 }, { role: 'CM', x: 72, y: 50 },
    { role: 'LW', x: 18, y: 24 }, { role: 'ST', x: 50, y: 18 }, { role: 'RW', x: 82, y: 24 }
  ],
  '4-2-3-1': [
    { role: 'GK', x: 50, y: 89 },
    { role: 'LB', x: 16, y: 72 }, { role: 'CB', x: 38, y: 75 }, { role: 'CB', x: 62, y: 75 }, { role: 'RB', x: 84, y: 72 },
    { role: 'DM', x: 36, y: 56 }, { role: 'DM', x: 64, y: 56 },
    { role: 'LW', x: 18, y: 36 }, { role: 'AM', x: 50, y: 36 }, { role: 'RW', x: 82, y: 36 },
    { role: 'ST', x: 50, y: 17 }
  ],
  '4-4-2': [
    { role: 'GK', x: 50, y: 89 },
    { role: 'LB', x: 16, y: 72 }, { role: 'CB', x: 38, y: 75 }, { role: 'CB', x: 62, y: 75 }, { role: 'RB', x: 84, y: 72 },
    { role: 'LW', x: 16, y: 48 }, { role: 'CM', x: 39, y: 51 }, { role: 'CM', x: 61, y: 51 }, { role: 'RW', x: 84, y: 48 },
    { role: 'ST', x: 37, y: 20 }, { role: 'ST', x: 63, y: 20 }
  ],
  '3-5-2': [
    { role: 'GK', x: 50, y: 89 },
    { role: 'CB', x: 26, y: 74 }, { role: 'CB', x: 50, y: 76 }, { role: 'CB', x: 74, y: 74 },
    { role: 'LB', x: 14, y: 49 }, { role: 'CM', x: 34, y: 53 }, { role: 'DM', x: 50, y: 58 }, { role: 'CM', x: 66, y: 53 }, { role: 'RB', x: 86, y: 49 },
    { role: 'ST', x: 37, y: 20 }, { role: 'ST', x: 63, y: 20 }
  ],
  '3-4-3': [
    { role: 'GK', x: 50, y: 89 },
    { role: 'CB', x: 26, y: 74 }, { role: 'CB', x: 50, y: 76 }, { role: 'CB', x: 74, y: 74 },
    { role: 'LB', x: 16, y: 50 }, { role: 'CM', x: 39, y: 52 }, { role: 'CM', x: 61, y: 52 }, { role: 'RB', x: 84, y: 50 },
    { role: 'LW', x: 20, y: 23 }, { role: 'ST', x: 50, y: 17 }, { role: 'RW', x: 80, y: 23 }
  ],
  '4-1-4-1': [
    { role: 'GK', x: 50, y: 89 },
    { role: 'LB', x: 16, y: 72 }, { role: 'CB', x: 38, y: 75 }, { role: 'CB', x: 62, y: 75 }, { role: 'RB', x: 84, y: 72 },
    { role: 'DM', x: 50, y: 60 },
    { role: 'LW', x: 16, y: 41 }, { role: 'CM', x: 39, y: 43 }, { role: 'CM', x: 61, y: 43 }, { role: 'RW', x: 84, y: 41 },
    { role: 'ST', x: 50, y: 18 }
  ],
  '5-3-2': [
    { role: 'GK', x: 50, y: 89 },
    { role: 'LB', x: 13, y: 68 }, { role: 'CB', x: 31, y: 75 }, { role: 'CB', x: 50, y: 77 }, { role: 'CB', x: 69, y: 75 }, { role: 'RB', x: 87, y: 68 },
    { role: 'CM', x: 28, y: 50 }, { role: 'DM', x: 50, y: 54 }, { role: 'CM', x: 72, y: 50 },
    { role: 'ST', x: 37, y: 21 }, { role: 'ST', x: 63, y: 21 }
  ],
  '4-3-1-2': [
    { role: 'GK', x: 50, y: 89 },
    { role: 'LB', x: 16, y: 72 }, { role: 'CB', x: 38, y: 75 }, { role: 'CB', x: 62, y: 75 }, { role: 'RB', x: 84, y: 72 },
    { role: 'CM', x: 28, y: 54 }, { role: 'DM', x: 50, y: 58 }, { role: 'CM', x: 72, y: 54 },
    { role: 'AM', x: 50, y: 36 },
    { role: 'ST', x: 37, y: 19 }, { role: 'ST', x: 63, y: 19 }
  ]
};

const DEFAULT_PSG_NUMBERS = {
  'Gianluigi Donnarumma': 1, 'Achraf Hakimi': 2, 'Marquinhos': 5, 'Khvicha Kvaratskhelia': 7,
  'Fabián Ruiz': 8, 'Gonçalo Ramos': 9, 'Ousmane Dembélé': 10, 'Désiré Doué': 14,
  'Vitinha': 17, 'Lee Kang-in': 19, 'Lucas Hernández': 21, 'Senny Mayulu': 24,
  'Nuno Mendes': 25, 'Bradley Barcola': 29, 'Warren Zaïre-Emery': 33, 'Lucas Beraldo': 35,
  'Matvey Safonov': 39, 'Willian Pacho': 51, 'João Neves': 87
};

export class SquadFormationSystem {
  constructor(state) {
    this.state = state;
    this.listeners = [];
    this.formation = '4-3-3';
    this.tacticName = 'PSG Kiểm Soát Bóng (Mặc định)';
    this.captainId = null;
    this.starterIds = [];
    this.lockers = []; // LockerData[]
    this.schedules = {}; // playerId -> PlayerSchedule
    this.initFromSquad();
  }

  onChange(fn) {
    this.listeners.push(fn);
  }

  notify() {
    this.syncLockers();
    this.listeners.forEach((fn) => { try { fn(this); } catch (_) {} });
  }

  getDisplaySurname(fullName) {
    const parts = String(fullName || '').trim().split(/\s+/);
    return (parts[parts.length - 1] || fullName).toUpperCase();
  }

  ensureShirtNumbers() {
    const squad = this.state.getPsgSquad();
    const used = new Set();
    squad.forEach((p) => {
      if (p.shirtNumber) used.add(p.shirtNumber);
    });
    let nextFree = 3;
    squad.forEach((p) => {
      if (!p.shirtNumber) {
        const pref = DEFAULT_PSG_NUMBERS[p.name];
        if (pref && !used.has(pref)) {
          p.shirtNumber = pref;
          used.add(pref);
        } else {
          while (used.has(nextFree) || nextFree === 1) nextFree++;
          p.shirtNumber = nextFree;
          used.add(nextFree);
        }
      }
    });
  }

  initFromSquad() {
    this.ensureShirtNumbers();
    const squad = this.state.getPsgSquad();
    const cap = squad.find((p) => p.name === 'Marquinhos') || squad[0];
    this.captainId = cap ? cap.id : null;
    this.autoFillStarters();
    this.syncLockers();
    this.initSchedules();
  }

  autoFillStarters() {
    const squad = this.state.getPsgSquad().filter((p) => (p.injuryDays || 0) <= 0 && !p.suspended);
    const slots = FORMATION_PRESETS[this.formation] || FORMATION_PRESETS['4-3-3'];
    const picked = [];
    slots.forEach((slot) => {
      const exact = squad.find((p) => !picked.includes(p.id) && p.position === slot.role);
      if (exact) { picked.push(exact.id); return; }
      const near = squad.find((p) => !picked.includes(p.id) && (
        (slot.role === 'GK' && p.position === 'GK') ||
        (['CB', 'LB', 'RB'].includes(slot.role) && ['CB', 'LB', 'RB'].includes(p.position)) ||
        (['DM', 'CM', 'AM'].includes(slot.role) && ['DM', 'CM', 'AM'].includes(p.position)) ||
        (['LW', 'RW', 'ST'].includes(slot.role) && ['LW', 'RW', 'ST', 'AM'].includes(p.position))
      ));
      if (near) { picked.push(near.id); return; }
      const any = squad.find((p) => !picked.includes(p.id));
      if (any) picked.push(any.id);
    });
    this.starterIds = picked;
  }

  // Đồng bộ 100% tủ đồ cá nhân theo danh sách cầu thủ PSG hiện tại (thêm mới -> cấp tủ, rời đi -> giải phóng tủ, đổi số -> cập nhật tủ)
  syncLockers() {
    this.ensureShirtNumbers();
    const squad = this.state.getPsgSquad();
    const totalLockers = Math.max(20, squad.length);
    const nextLockers = [];
    for (let i = 0; i < totalLockers; i++) {
      const p = squad[i] || null;
      nextLockers.push({
        lockerId: `locker_${i + 1}`,
        playerId: p ? p.id : null,
        shirtNumber: p ? p.shirtNumber : null,
        displayName: p ? this.getDisplaySurname(p.name) : 'TRỐNG',
        fullName: p ? p.name : 'Tủ trống',
        position: p ? p.position : '',
        isCaptain: p ? p.id === this.captainId : false,
        isAssigned: !!p
      });
    }
    this.lockers = nextLockers;
  }

  initSchedules() {
    const squad = this.state.getPsgSquad();
    squad.forEach((p, idx) => {
      if (!this.schedules[p.id]) {
        // Quy định bắt buộc: có mặt trước giờ tập 10:00 đúng 60 phút (09:00)
        const late = idx === 4 && Math.random() < 0.25;
        this.schedules[p.id] = {
          playerId: p.id,
          trainingStartTime: '10:00',
          requiredArrivalTime: '09:00',
          actualArrivalTime: late ? '09:12' : `08:${50 + (idx % 9)}`,
          currentActivity: 'Có mặt tại phòng thay đồ chuẩn bị tập',
          attendanceStatus: late ? 'late' : 'on_time'
        };
      }
    });
  }

  getRoutinePhase(clockHour) {
    // Buổi sáng: Tập 10:00-11:30 → Đến phòng thay đồ lúc 09:00 (trước 60 phút!)
    if (clockHour < 9.0) return { key: 'home', label: 'Đang ở nhà / Di chuyển tới CLB', loc: 'off_campus' };
    if (clockHour < 9.25) return { key: 'arrive', label: '09:00–09:15 · Đến phòng thay đồ & chào đồng đội', loc: 'dressing_room' };
    if (clockHour < 9.5) return { key: 'change', label: '09:15–09:30 · Thay trang phục tập & chuẩn bị giày tại tủ', loc: 'dressing_room' };
    if (clockHour < 9.75) return { key: 'rest_pre', label: '09:30–09:45 · Nghỉ ngơi, uống nước & trò chuyện', loc: 'dressing_room' };
    if (clockHour < 10.0) return { key: 'briefing', label: '09:45–10:00 · HLV Luis Enrique phổ biến giáo án tại Phòng Thay Đồ', loc: 'dressing_room_table' };
    if (clockHour < 11.5) return { key: 'training', label: '10:00–11:30 · Tập luyện trên sân tập chính dưới sự chỉ đạo của HLV', loc: 'pitch' };
    if (clockHour < 12.5) return { key: 'cooldown', label: '11:30–12:30 · Trở lại phòng thay đồ, tắm & phục hồi', loc: 'dressing_room' };
    if (clockHour < 14.0) return { key: 'lunch', label: '12:30–14:00 · Nghỉ trưa / Sinh hoạt tự do', loc: 'lobby' };
    if (clockHour < 15.0) return { key: 'briefing_pm', label: '14:00–15:00 · Tập trung phòng thay đồ trước ca tập chiều (trước 60 phút)', loc: 'dressing_room_table' };
    if (clockHour < 16.5) return { key: 'training_pm', label: '15:00–16:30 · Tập chiến thuật chiều trên sân tập', loc: 'pitch' };
    return { key: 'leave', label: '16:30+ · Kết thúc lịch CLB & trở về nhà', loc: 'off_campus' };
  }

  getFormationData() {
    this.ensureShirtNumbers();
    const squad = this.state.getPsgSquad();
    const slots = FORMATION_PRESETS[this.formation] || FORMATION_PRESETS['4-3-3'];

    // Tự động loại cầu thủ chấn thương/treo giò khỏi đội hình chính nếu vừa phát sinh chấn thương
    this.starterIds = this.starterIds.filter((id) => {
      const p = squad.find((x) => x.id === id);
      return p && (p.injuryDays || 0) <= 0 && !p.suspended;
    });
    if (this.starterIds.length < 11) {
      for (const p of squad) {
        if (this.starterIds.length >= 11) break;
        if (!this.starterIds.includes(p.id) && (p.injuryDays || 0) <= 0 && !p.suspended) {
          this.starterIds.push(p.id);
        }
      }
    }

    const starters = slots.map((slot, idx) => {
      const pid = this.starterIds[idx];
      const p = squad.find((x) => x.id === pid);
      if (!p) return null;
      return {
        slotIndex: idx,
        playerId: p.id,
        shirtNumber: p.shirtNumber,
        displayName: this.getDisplaySurname(p.name),
        fullName: p.name,
        position: slot.role,
        naturalPosition: p.position,
        formationX: slot.x,
        formationY: slot.y,
        isCaptain: p.id === this.captainId,
        isStarter: true,
        availability: p.injuryDays > 0 ? 'injured' : p.suspended ? 'suspended' : 'available',
        player: p
      };
    }).filter(Boolean);

    const bench = squad.filter((p) => !this.starterIds.includes(p.id)).map((p) => ({
      playerId: p.id,
      shirtNumber: p.shirtNumber,
      displayName: this.getDisplaySurname(p.name),
      fullName: p.name,
      position: p.position,
      isCaptain: p.id === this.captainId,
      isStarter: false,
      availability: p.injuryDays > 0 ? 'injured' : p.suspended ? 'suspended' : 'available',
      player: p
    }));

    return { formation: this.formation, tacticName: this.tacticName, captainId: this.captainId, starters, bench };
  }

  setFormation(name) {
    if (!FORMATION_PRESETS[name]) return false;
    this.formation = name;
    this.state.coach.formation = `${name} · ${this.tacticName}`;
    this.notify();
    return true;
  }

  setTacticName(name) {
    this.tacticName = name.trim() || 'Chiến thuật PSG';
    this.state.coach.formation = `${this.formation} · ${this.tacticName}`;
    this.notify();
  }

  setCaptain(playerId) {
    const p = this.state.getPsgSquad().find((x) => x.id === playerId);
    if (!p) return false;
    this.captainId = playerId;
    this.notify();
    return true;
  }

  setShirtNumber(playerId, newNum) {
    const n = Math.max(1, Math.min(99, Math.round(Number(newNum))));
    const squad = this.state.getPsgSquad();
    const target = squad.find((x) => x.id === playerId);
    if (!target || !n) return false;
    const holder = squad.find((x) => x.id !== playerId && x.shirtNumber === n);
    if (holder) holder.shirtNumber = target.shirtNumber; // Đổi số cho nhau để không bao giờ trùng số áo!
    target.shirtNumber = n;
    this.notify();
    return true;
  }

  swapStarter(slotIndex, replacementPlayerId) {
    const rep = this.state.getPsgSquad().find((x) => x.id === replacementPlayerId);
    if (!rep) return { ok: false, reason: 'Không tìm thấy cầu thủ.' };
    if ((rep.injuryDays || 0) > 0) return { ok: false, reason: `${rep.name} đang chấn thương (${rep.injuryDays} ngày), không thể vào đội hình chính!` };
    if (rep.suspended) return { ok: false, reason: `${rep.name} đang bị treo giò!` };

    const existingIdx = this.starterIds.indexOf(replacementPlayerId);
    if (existingIdx !== -1) {
      // Hoán đổi 2 vị trí ngay trên sân
      const tmp = this.starterIds[slotIndex];
      this.starterIds[slotIndex] = replacementPlayerId;
      this.starterIds[existingIdx] = tmp;
    } else {
      this.starterIds[slotIndex] = replacementPlayerId;
    }
    this.notify();
    return { ok: true };
  }

  exportState() {
    return {
      formation: this.formation,
      tacticName: this.tacticName,
      captainId: this.captainId,
      starterIds: [...this.starterIds],
      schedules: this.schedules
    };
  }

  importState(snap) {
    if (!snap) return;
    if (snap.formation && FORMATION_PRESETS[snap.formation]) this.formation = snap.formation;
    if (snap.tacticName) this.tacticName = snap.tacticName;
    if (snap.captainId) this.captainId = snap.captainId;
    if (Array.isArray(snap.starterIds)) this.starterIds = [...snap.starterIds];
    if (snap.schedules) this.schedules = snap.schedules;
    this.notify();
  }

  // Render SVG áo đấu PSG thật có số áo, tên cầu thủ, vị trí & chữ C đội trưởng (KHÔNG dùng chấm tròn!)
  static renderJerseyCardHTML(slot, isSelected = false) {
    const isGK = slot.position === 'GK';
    const bodyCol = isGK ? '#eab308' : '#00205b';
    const stripeCol = isGK ? '#ca8a04' : '#da291c';
    const textCol = isGK ? '#0f172a' : '#ffffff';
    return `
      <button class="pitch-jersey ${isSelected ? 'selected' : ''}" data-slot="${slot.slotIndex}" data-pid="${slot.playerId}" style="left:${slot.formationX}%;top:${slot.formationY}%;" title="${slot.fullName} (#${slot.shirtNumber})">
        <svg viewBox="0 0 64 62" class="jersey-svg">
          <path d="M18,6 L46,6 L60,19 L51,29 L46,24 L46,58 L18,58 L18,24 L13,29 L4,19 Z" fill="${bodyCol}" stroke="#ffffff" stroke-width="2.2"/>
          <rect x="27" y="6" width="10" height="52" fill="${stripeCol}"/>
          <text x="32" y="38" text-anchor="middle" fill="${textCol}" font-size="18" font-weight="900" font-family="sans-serif">${slot.shirtNumber}</text>
        </svg>
        ${slot.isCaptain ? `<span class="cap-badge">C</span>` : ''}
        <span class="jersey-name">${slot.displayName}</span>
        <span class="jersey-pos">${slot.position}</span>
      </button>`;
  }

  // Vẽ Canvas Texture động cho Màn hình Chiến thuật 3D trong Phòng Thay Đồ (cập nhật thật theo sơ đồ hiện tại!)
  drawTacticalScreenCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#07142b';
    ctx.fillRect(0, 0, w, h);
    // Mặt sân cỏ xanh tự nhiên nhìn từ trên xuống
    ctx.fillStyle = '#1b5e20';
    ctx.fillRect(18, 48, w - 36, h - 66);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 54, w - 48, h - 78);
    ctx.beginPath(); ctx.moveTo(24, 54 + (h - 78) / 2); ctx.lineTo(w - 24, 54 + (h - 78) / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(w / 2, 54 + (h - 78) / 2, 36, 0, Math.PI * 2); ctx.stroke();

    const data = this.getFormationData();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`PSG · SƠ ĐỒ ${data.formation} · ${data.tacticName}`, 20, 32);

    // Vẽ 11 áo đấu thật trên màn hình 3D Phòng Thay Đồ
    data.starters.forEach((s) => {
      const px = 24 + (s.formationX / 100) * (w - 48);
      const py = 54 + (s.formationY / 100) * (h - 78);
      ctx.fillStyle = s.position === 'GK' ? '#eab308' : '#00205b';
      ctx.fillRect(px - 14, py - 14, 28, 26);
      ctx.fillStyle = s.position === 'GK' ? '#ca8a04' : '#da291c';
      ctx.fillRect(px - 4, py - 14, 8, 26);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px - 14, py - 14, 28, 26);
      ctx.fillStyle = s.position === 'GK' ? '#0f172a' : '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(s.shirtNumber), px, py + 4);
      if (s.isCaptain) {
        ctx.fillStyle = '#facc15';
        ctx.fillRect(px + 10, py - 18, 13, 13);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('C', px + 16.5, py - 8);
      }
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(s.displayName, px, py + 23);
    });
  }
}
