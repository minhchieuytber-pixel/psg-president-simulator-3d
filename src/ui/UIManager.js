import { SquadFormationSystem, FORMATION_PRESETS } from '../squad/SquadFormationSystem.js';
import { MatchSimulationEngine } from '../matches/MatchSimulationEngine.js';
import { PressNewsSystem } from '../media/PressNewsSystem.js';
import { RoleDialogueDatabase, NPCPersonalitySystem, TaskAssignmentSystem } from '../dialogue/DialogueSystem.js';
// src/ui/UIManager.js
// Giao diện cảm ứng iPhone Landscape: Ẩn nút thừa bên phải (chỉ giữ Điện thoại & Chạy, Tương tác chỉ hiện khi trỏ vào vật thể), mục Báo cáo hằng ngày & duyệt tự biến mất trên macOS, hội thoại & giao nhiệm vụ phong phú
export class UIManager {
  constructor(state, audio, saveManager, callbacks) {
    this.state = state;
    this.audio = audio;
    this.saveManager = saveManager;
    this.cb = callbacks;
    this.activeTab = 'reports';
    this.macMinimized = false;
    this.macMaximized = false;
    this.academyFilter = 'U19';
    this.transferSearch = '';
    this.transferPos = 'ALL';
    this.transferTier = 'ALL';
    this.newsCategory = 'ALL';
    this.activeArticleId = null;
    this.selectedSlotIdx = null;
    this.pitchZoom = 1.0;
    this.bindStaticButtons();
  }

  toast(msg, type = 'info') {
    const el = document.getElementById('toast-box');
    if (!el) return;
    el.textContent = msg;
    el.className = `toast-box show ${type}`;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => { el.className = 'toast-box'; }, 3500);
  }

  bindStaticButtons() {
    const on = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', (e) => { e.stopPropagation(); this.audio.playClick(); fn(e); });
    };

    on('btn-phone', () => this.openPhone());
    on('btn-next-week', () => this.handleAdvanceWeek());
    on('hud-match-alert', () => this.cb.startMatch());
    on('btn-mute', () => {
      const muted = this.audio.toggleMute();
      const b = document.getElementById('btn-mute');
      if (b) b.textContent = muted ? '🔇' : '🔊';
      this.saveManager.saveSettings({ quality: this.currentQuality || 'Medium', muted });
    });
    on('btn-quality', () => {
      const order = ['Low', 'Medium', 'High'];
      const cur = this.currentQuality || 'Medium';
      const next = order[(order.indexOf(cur) + 1) % order.length];
      this.currentQuality = next;
      const b = document.getElementById('btn-quality');
      if (b) b.textContent = next;
      this.cb.setQuality(next);
      this.saveManager.saveSettings({ quality: next, muted: this.audio.muted });
      this.toast(`Đã chuyển chất lượng đồ họa sang mức ${next}`, 'success');
    });
    on('btn-sprint', () => {
      const active = this.cb.toggleSprint();
      const b = document.getElementById('btn-sprint');
      if (b) b.classList.toggle('active', active);
    });
    on('btn-interact', () => this.cb.interact());
    on('btn-dismiss-rotate', () => {
      const ov = document.getElementById('portrait-warning');
      if (ov) ov.classList.add('dismissed');
    });
    on('modal-close', () => this.closeModal());

    document.querySelectorAll('[data-cam]').forEach((btn) => {
      btn.addEventListener('click', () => { this.audio.playClick(); this.cb.setMatchCam(btn.dataset.cam); });
    });
    document.querySelectorAll('[data-tactic]').forEach((btn) => {
      btn.addEventListener('click', () => { this.audio.playClick(); this.cb.setMatchTactic(btn.dataset.tactic); });
    });
    on('btn-match-speed', () => this.cb.toggleMatchSpeed());
    on('btn-match-pause', () => this.cb.toggleMatchPause());
    on('btn-match-exit', () => this.cb.exitMatch());
    on('btn-match-stats', () => this.openMatchStatsModal());
    on('btn-match-sub', () => {
      const sub = this.cb.makeImpactSub();
      if (sub) { this.audio.playSuccess(); this.toast(`🔄 Thay người: ${sub.inName} vào thay ${sub.oldName}!`, 'success'); }
      else this.toast('Đã hết lượt thay người hoặc cầu thủ dự bị.', 'warn');
    });
    on('btn-match-replay', () => this.openReplayModal());
  }

  formatClock(hFloat) {
    const h = Math.floor(hFloat) % 24;
    const m = Math.floor((hFloat - Math.floor(hFloat)) * 60);
    const training = (hFloat >= 9 && hFloat < 11.5) || (hFloat >= 15 && hFloat < 17);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} · ${training ? '⚽ Tập luyện' : '☕ Nghỉ ngơi'}`;
  }

  updateTopHUD(fps, aimedPrompt) {
    const s = this.state;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('hud-season', `${s.season} · T${s.week}`);
    set('hud-clock', this.formatClock(s.clockHour));
    set('hud-budget', `€${s.finance.budget.toFixed(1)}M`);
    set('hud-fps', `${fps} FPS`);

    // Thông báo trận đấu trong tuần trên thanh trạng thái
    const weekFx = s.getCurrentWeekFixture();
    const matchPill = document.getElementById('hud-match-alert');
    if (matchPill) {
      if (weekFx) {
        const opp = weekFx.home === 'Paris Saint-Germain' ? weekFx.away : weekFx.home;
        matchPill.textContent = `⚽ Tuần ${s.week}: vs ${opp} (Chưa đá)`;
        matchPill.classList.remove('hidden');
      } else {
        matchPill.classList.add('hidden');
      }
    }

    const unread = s.phoneInbox.filter((m) => !m.read).length + (s.incomingCall ? 1 : 0);
    const badge = document.getElementById('phone-badge');
    if (badge) {
      badge.textContent = unread > 0 ? String(unread) : '';
      badge.style.display = unread > 0 ? 'flex' : 'none';
    }

    // Nút tương tác CHỈ HIỆN LÊN khi tâm ngắm đang trỏ vào vật thể/NPC/cửa/ghế
    const interactBtn = document.getElementById('btn-interact');
    const hintPill = document.getElementById('interact-hint');
    if (interactBtn && hintPill) {
      if (aimedPrompt) {
        interactBtn.classList.remove('hidden');
        interactBtn.classList.add('ready');
        hintPill.textContent = aimedPrompt;
        hintPill.classList.add('show');
      } else {
        interactBtn.classList.add('hidden');
        interactBtn.classList.remove('ready');
        hintPill.classList.remove('show');
      }
    }
  }

  handleAdvanceWeek() {
    const res = this.state.advanceWeek((evt) => {
      this.toast(`⚡ ${evt.slice(0, 90)}...`, 'warn');
    });
    if (res && res.blocked) {
      this.audio.playAlert();
      const fx = res.fixture;
      this.openModal('⚠️ KHÔNG THỂ QUA TUẦN — TRẬN ĐẤU CHƯA DIỄN RA', `
        <div class="card-item urgent">
          <h4>⚽ ${fx.comp} · ${fx.round}</h4>
          <p>Tuần ${this.state.week} có trận đấu giữa <b>${fx.home}</b> và <b>${fx.away}</b> chưa diễn ra. Chủ tịch Phạm Minh Chiêu không thể tua qua tuần trước khi hoàn thành trận đấu này.</p>
          <div class="btn-row" style="margin-top:10px;">
            <button class="btn-primary" id="wk-go-match">🏟️ Ra SVĐ Parc des Princes thi đấu ngay</button>
            <button class="btn-secondary" id="wk-stay">Ở lại Trụ sở PSG</button>
          </div>
        </div>`, 'normal');
      document.getElementById('wk-go-match')?.addEventListener('click', () => { this.closeModal(); this.cb.startMatch(); });
      document.getElementById('wk-stay')?.addEventListener('click', () => this.closeModal());
      return;
    }

    this.audio.playSuccess();
    this.toast(`Đã sang Tuần ${this.state.week} (${this.state.dayName}) · Bản tin hằng ngày đã cập nhật!`, 'success');
    if (this.state.incomingCall) {
      this.audio.playPhoneRing();
      this.showIncomingCall(this.state.incomingCall);
    }
  }

  openModal(title, html, mode = 'normal') {
    const wrap = document.getElementById('modal-backdrop');
    const box = document.getElementById('modal-box');
    const head = document.getElementById('modal-head-bar');
    const tEl = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    if (!wrap || !box || !body) return;
    tEl.textContent = title;
    body.innerHTML = html;
    if (mode === 'macos') {
      box.className = 'modal-box macos-shell';
      if (head) head.style.display = 'none';
      body.style.padding = '0';
    } else {
      box.className = mode === 'wide' ? 'modal-box wide' : 'modal-box';
      if (head) head.style.display = 'flex';
      body.style.padding = '12px 14px';
    }
    wrap.classList.add('open');
  }

  closeModal() {
    const wrap = document.getElementById('modal-backdrop');
    if (wrap) wrap.classList.remove('open');
    this.cb.endBoard();
    this.cb.dismissPlayer();
  }

  // --- 1. ĐIỆN THOẠI CHỦ TỊCH ---
  showIncomingCall(call) {
    const html = `
      <div class="call-card">
        <div class="call-pulse">📞</div>
        <h3>${call.caller}</h3>
        <p class="call-text">"${call.summary}"</p>
        <div class="btn-row">
          <button class="btn-primary" id="call-accept">✅ ${call.acceptLabel}</button>
          <button class="btn-danger" id="call-reject">❌ ${call.rejectLabel}</button>
        </div>
      </div>`;
    this.openModal('📱 CUỘC GỌI KHẨN ĐẾN CHỦ TỊCH PHẠM MINH CHIÊU', html, 'normal');
    document.getElementById('call-accept')?.addEventListener('click', () => {
      call.onAccept(); this.state.incomingCall = null; this.audio.playSuccess();
      this.toast('Đã phê duyệt qua điện thoại.', 'success'); this.closeModal();
    });
    document.getElementById('call-reject')?.addEventListener('click', () => {
      call.onReject(); this.state.incomingCall = null; this.audio.playClick();
      this.toast('Đã từ chối và kết thúc cuộc gọi.', 'info'); this.closeModal();
    });
  }

  openPhone() {
    if (this.state.incomingCall) { this.showIncomingCall(this.state.incomingCall); return; }
    this.state.phoneInbox.forEach((m) => (m.read = true));
    const weekFx = this.state.getCurrentWeekFixture();
    const msgsHtml = this.state.phoneInbox.map((m) => `
      <div class="card-item ${m.urgent ? 'urgent' : ''}">
        <div class="card-head"><strong>${m.from}</strong><span class="tag">${m.urgent ? 'KHẨN' : 'Tin nhắn'}</span></div>
        <div class="card-sub">${m.title}</div>
        <p>${m.body}</p>
      </div>`).join('');

    const html = `
      <div class="phone-quick-actions">
        <button class="btn-primary" id="ph-board">🏛️ Họp Ban Lãnh Đạo</button>
        <button class="btn-accent" id="ph-player">🗣️ Họp Riêng Cầu Thủ</button>
        <button class="btn-secondary" id="ph-map">🗺️ Đi nhanh phòng ban</button>
        <button class="btn-danger" id="ph-match">⚽ ${weekFx ? `Ngày thi đấu Tuần ${this.state.week}` : 'Lịch thi đấu'}</button>
        <button class="btn-secondary" id="ph-press">📰 Báo chí</button>
        <button class="btn-primary" id="ph-form">👕 Sơ đồ đội hình</button>
      </div>
      <div class="section-label">Hộp thư & Thông báo Chủ tịch</div>
      <div class="scroll-list">${msgsHtml}</div>`;
    this.openModal('📱 ĐIỆN THOẠI CHỦ TỊCH PHẠM MINH CHIÊU', html, 'normal');
    document.getElementById('ph-board')?.addEventListener('click', () => this.openBoardMeeting());
    document.getElementById('ph-player')?.addEventListener('click', () => this.openPlayerMeetingSelector());
    document.getElementById('ph-map')?.addEventListener('click', () => this.openFastTravel());
    document.getElementById('ph-match')?.addEventListener('click', () => { this.openMatchdayFlow(); });
    document.getElementById('ph-press')?.addEventListener('click', () => { this.openComputer('media'); });
    document.getElementById('ph-form')?.addEventListener('click', () => { this.openComputer('formation'); });
  }

  openFastTravel() {
    const places = [
      ['president', '🏢 Phòng Chủ tịch Phạm Minh Chiêu'],
      ['boardroom', '🏛️ Phòng Họp Ban Lãnh Đạo'],
      ['lobby', '✨ Sảnh Lễ Tân PSG'],
      ['sporting', '🎯 Phòng Giám Đốc Thể Thao'],
      ['coach', '📋 Phòng HLV Trưởng'],
      ['finance', '💶 Phòng Tài Chính'],
      ['medical', '🏥 Trung Tâm Y Tế PSG'],
      ['dressing_room', '👕 Tòa Nhà Phòng Thay Đồ Cầu Thủ PSG'],
      ['pitch', '⚽ Sân Tập Chính Ngoài Trời'],
      ['parking', '🚘 Bãi Đỗ Xe & Xe Buýt Đội Bóng']
    ];
    const html = `<div class="grid-2">${places.map(([k, label]) =>
      `<button class="btn-secondary nav-jump" data-room="${k}">${label}</button>`
    ).join('')}</div>`;
    this.openModal('🗺️ ĐI NHANH TRỤ SỞ & KHUÔN VIÊN PSG', html, 'normal');
    document.querySelectorAll('.nav-jump').forEach((b) => {
      b.addEventListener('click', () => {
        this.audio.playDoor(); this.cb.teleport(b.dataset.room); this.closeModal();
        this.toast(`Đã di chuyển đến ${b.textContent}`, 'info');
      });
    });
  }

  // --- 2. HỘI THOẠI CHUYÊN SÂU THEO TỪNG CHỨC VỤ, TÍNH CÁCH & GIAO NHIỆM VỤ THỰC TẾ ---
  openNpcDialogue(npc, lastReply = null) {
    const menu = RoleDialogueDatabase.buildMenu(npc, this.state);
    const quote = lastReply || menu.greeting;
    const npcTasks = (this.state.assignedTasks || []).filter((t) => t.ownerId === npc.id);
    const memHtml = npc.memory.length > 0
      ? npc.memory.slice(0, 4).map((m) => `<li>${m}</li>`).join('')
      : '<li>Chưa có quyết định riêng nào được ghi nhận tuần này.</li>';

    const tasksHtml = npcTasks.length > 0 ? npcTasks.slice(0, 3).map((t) => `
      <div class="card-item" style="padding:7px 10px;">
        <div class="card-head"><strong>${t.title}</strong><span class="tag ${t.status === 'Hoàn thành' ? 'ok' : ''}">${t.status} (${t.progress}%)</span></div>
        <div class="muted">Phối hợp: ${t.collaborators} · Ưu tiên: ${t.priority}</div>
        ${t.finalReport ? `<p style="color:#86efac;">📄 ${t.finalReport}</p>` : ''}
      </div>`).join('') : '<div class="muted">Chưa có nhiệm vụ nào đang giao cho nhân vật này.</div>';

    const html = `
      <div class="npc-header">
        <div>
          <h3>${npc.name}</h3>
          <div class="muted">${npc.role} · ${npc.dept} · Tính cách: <b>${npc.personality}</b></div>
        </div>
        <div class="kpi-mini">
          <span>Chuyên môn: <b>${npc.skill}</b></span>
          <span>Thái độ: <b>${npc.morale}%</b></span>
          <span>Quan hệ: <b>${npc.relation}/100</b></span>
        </div>
      </div>
      <div class="dialogue-bubble">"${quote}"</div>
      <div class="section-label">Mệnh lệnh & Hội thoại dành riêng cho ${npc.role}</div>
      <div class="scroll-list" style="max-height:195px;">
        ${menu.options.map((o, idx) => `
          <button class="${o.type === 'task' ? 'btn-primary' : o.type === 'challenge' ? 'btn-danger' : o.type === 'praise' ? 'btn-accent' : 'btn-secondary'} role-opt" data-oidx="${idx}" style="width:100%;text-align:left;margin-bottom:5px;">
            ${o.label}
          </button>`).join('')}
      </div>
      <div class="section-label">📌 Nhiệm vụ Chủ tịch đã giao cho ${npc.name}</div>
      ${tasksHtml}
      <div class="section-label">Ký ức hội thoại gần đây</div>
      <ul class="mem-list">${memHtml}</ul>`;

    this.openModal(`💬 ${npc.name.toUpperCase()} · ${npc.role.toUpperCase()}`, html, 'wide');

    document.querySelectorAll('.role-opt').forEach((b) => {
      b.addEventListener('click', () => {
        const opt = menu.options[Number(b.dataset.oidx)];
        if (!opt) return;
        if (opt.type === 'task') {
          const task = TaskAssignmentSystem.createTask(this.state, npc, opt);
          const destInfo = this.cb.dispatchNpcTask ? this.cb.dispatchNpcTask(npc.id, opt.resultKey) : null;
          const reaction = NPCPersonalitySystem.getReaction(npc.personality, 'accept_task');
          npc.relation = Math.min(100, npc.relation + 3);
          npc.memory.unshift(`Tuần ${this.state.week}: Tiếp nhận nhiệm vụ "${task.title}" (${task.collaborators}).`);
          this.audio.playSuccess();
          this.toast(`📌 ${npc.name} đang tự tìm đường đến ${destInfo ? destInfo.label : "phòng phối hợp"} để thực hiện nhiệm vụ!`, 'success');
          this.openNpcDialogue(npc, `${reaction} (Đã tạo nhiệm vụ: "${task.title}" · Phối hợp: ${task.collaborators})`);
        } else if (opt.type === 'challenge') {
          npc.morale = Math.max(25, npc.morale - 4);
          npc.memory.unshift(`Tuần ${this.state.week}: Chủ tịch chất vấn thẳng thắn về tiến độ.`);
          this.audio.playAlert();
          const react = opt.reply || NPCPersonalitySystem.getReaction(npc.personality, 'challenge');
          this.openNpcDialogue(npc, react);
        } else if (opt.type === 'praise') {
          npc.morale = Math.min(100, npc.morale + 7);
          npc.relation = Math.min(100, npc.relation + 6);
          npc.memory.unshift(`Tuần ${this.state.week}: Chủ tịch khen ngợi đóng góp.`);
          this.audio.playSuccess();
          this.openNpcDialogue(npc, opt.reply);
        } else {
          npc.relation = Math.min(100, npc.relation + 2);
          this.audio.playClick();
          this.openNpcDialogue(npc, opt.reply);
        }
      });
    });
  }

  // --- 3. HỌP BAN LÃNH ĐẠO & HỌP RIÊNG CẦU THỦ ---
  openBoardMeeting(topicIdx = 0) {
    this.cb.summonBoard();
    const agendas = [
      {
        title: 'Phê duyệt gói đầu tư Chuyển nhượng €40M bổ sung',
        opinions: [
          ['Victoriano Melero (CEO)', 'Ủng hộ', 'Cần giữ cân đối dòng tiền nhưng sẽ tăng doanh thu thương mại.'],
          ['Luís Campos (GĐ Thể Thao)', 'Ủng hộ', 'Đội hình cần thêm 1 ngôi sao đẳng cấp thế giới để vô địch UCL.'],
          ['Luis Enrique (HLV Trưởng)', 'Ủng hộ', 'Chiều sâu đội hình là yếu tố sống còn cho lịch thi đấu dày đặc.'],
          ['Jean-Baptiste Laurent (CFO)', 'Phản đối', 'Cảnh báo rủi ro áp lực quỹ lương theo Luật FFP của UEFA.']
        ],
        applyApprove: () => {
          this.state.finance.transferBudget = +(this.state.finance.transferBudget + 40).toFixed(1);
          this.state.president.fanSupport = Math.min(100, this.state.president.fanSupport + 5);
        },
        applyReject: () => { this.state.president.boardTrust = Math.min(100, this.state.president.boardTrust + 4); }
      },
      {
        title: 'Đầu tư €12M nâng cấp Học viện PSG & Trung tâm Y tế',
        opinions: [
          ['Yohan Cabaye (GĐ Học Viện)', 'Ủng hộ', 'Giúp 100 cầu thủ trẻ phát triển nhanh hơn và tạo bản sắc Paris.'],
          ['BS. Christophe Baudot (Y Tế)', 'Ủng hộ', 'Giảm mạnh chấn thương cơ bắp cho trụ cột.'],
          ['Jean-Baptiste Laurent (CFO)', 'Trắng', 'Chi phí €12M chấp nhận được nếu phân bổ hợp lý.']
        ],
        applyApprove: () => {
          this.state.addLedger('Đầu tư nâng cấp Học viện & Y tế', -12);
          this.state.academy.forEach((y) => { if (y.ovr < y.pot) y.ovr = Math.min(y.pot, y.ovr + 1); });
        },
        applyReject: () => {}
      }
    ];
    const ag = agendas[topicIdx] || agendas[0];
    const approveCnt = ag.opinions.filter((o) => o[1] === 'Ủng hộ').length;
    const rejectCnt = ag.opinions.filter((o) => o[1] === 'Phản đối').length;
    const absCnt = ag.opinions.filter((o) => o[1] === 'Trắng').length;

    const html = `
      <div class="tab-strip">
        ${agendas.map((_, i) => `<button class="tab-btn ${i === topicIdx ? 'active' : ''}" data-ag="${i}">Chủ đề ${i + 1}</button>`).join('')}
      </div>
      <div class="card-item"><h4>📌 ${ag.title}</h4></div>
      <div class="scroll-list">${ag.opinions.map(([w, v, t]) => `<div class="card-item"><div class="card-head"><strong>${w}</strong><span class="tag ${v === 'Ủng hộ' ? 'ok' : v === 'Phản đối' ? 'bad' : ''}">${v}</span></div><p>"${t}"</p></div>`).join('')}</div>
      <div class="vote-bar">Biểu quyết: <b>${approveCnt} Đồng ý</b> · <b>${rejectCnt} Phản đối</b> · <b>${absCnt} Trắng</b></div>
      <div class="grid-2">
        <button class="btn-primary" id="bm-approve">✅ Chủ tịch Phê duyệt</button>
        <button class="btn-danger" id="bm-reject">❌ Chủ tịch Bác bỏ</button>
      </div>`;
    this.openModal('🏛️ HỌP BAN LÃNH ĐẠO PARIS SAINT-GERMAIN', html, 'wide');
    document.querySelectorAll('[data-ag]').forEach((b) => b.addEventListener('click', () => this.openBoardMeeting(Number(b.dataset.ag))));
    const done = (label, ok) => {
      if (ok) ag.applyApprove(); else ag.applyReject();
      this.state.meetingMinutes.unshift({ id: `mm_${Date.now()}`, date: `Tuần ${this.state.week} · ${this.state.season}`, topic: ag.title, attendees: ag.opinions.map((o) => o[0]), votes: { approve: approveCnt, reject: rejectCnt, abstain: absCnt }, decision: `${label} (Chủ tịch Phạm Minh Chiêu)`, owner: 'Ban Điều Hành PSG' });
      this.audio.playSuccess(); this.toast(`Đã lưu Biên bản họp: ${label}`, 'success'); this.closeModal();
    };
    document.getElementById('bm-approve')?.addEventListener('click', () => done('PHÊ DUYỆT', true));
    document.getElementById('bm-reject')?.addEventListener('click', () => done('BÁC BỎ', false));
  }

  openPlayerMeetingSelector(preselectedId = null) {
    const squad = this.state.getPsgSquad();
    const chosen = squad.find((p) => p.id === preselectedId) || squad[0];
    if (!chosen) return;
    this.cb.summonPlayer(chosen.name);
    const topics = [
      ['motivate', '🔥 Động viên tinh thần (+8 Tinh thần, +4 Trung thành)'],
      ['praise', '⭐ Khen ngợi phong độ (+6 Hài lòng)'],
      ['contract', '✍️ Gia hạn hợp đồng (+2 năm, +10% lương)'],
      ['captain', '©️ Giao vai trò thủ lĩnh phòng thay đồ (+10 Trung thành)'],
      ['discipline', '⚠️ Nhắc nhở phong độ & thái độ tập luyện']
    ];
    const html = `
      <div class="card-item">
        <select id="pm-select" class="input-ctrl">${squad.map((p) => `<option value="${p.id}" ${p.id === chosen.id ? 'selected' : ''}>${p.name} (${p.position} · OVR ${p.ovr})</option>`).join('')}</select>
        <div class="kpi-mini" style="margin-top:8px;"><span>Lương: <b>€${chosen.wage}k</b></span><span>HĐ: <b>${chosen.contractYears} năm</b></span><span>Hài lòng: <b>${chosen.satisfaction}%</b></span></div>
      </div>
      <div class="scroll-list">${topics.map(([k, txt]) => `<button class="btn-secondary pm-topic" data-topic="${k}" style="width:100%;text-align:left;margin-bottom:5px;">${txt}</button>`).join('')}</div>`;
    this.openModal(`🗣️ HỌP RIÊNG CẦU THỦ · ${chosen.name.toUpperCase()}`, html, 'normal');
    document.getElementById('pm-select')?.addEventListener('change', (e) => this.openPlayerMeetingSelector(e.target.value));
    document.querySelectorAll('.pm-topic').forEach((b) => {
      b.addEventListener('click', () => {
        const t = b.dataset.topic;
        if (t === 'motivate') { chosen.morale = Math.min(100, chosen.morale + 8); chosen.loyalty = Math.min(100, chosen.loyalty + 4); }
        else if (t === 'praise') chosen.satisfaction = Math.min(100, chosen.satisfaction + 6);
        else if (t === 'contract') { chosen.contractYears += 2; chosen.wage = Math.round(chosen.wage * 1.1); chosen.satisfaction = 95; }
        else if (t === 'captain') chosen.loyalty = Math.min(100, chosen.loyalty + 10);
        else chosen.form = Math.min(99, chosen.form + 5);
        this.audio.playSuccess();
        this.toast(`${chosen.name} đã ghi nhận trao đổi riêng với Chủ tịch!`, 'success');
        this.closeModal();
      });
    });
  }

  // --- 4. MÁY TÍNH macOS (CÓ MỤC BÁO CÁO HẰNG NGÀY & BÁO CÁO CHỜ DUYỆT TỰ BIẾN MẤT) ---
  openComputer(tab = this.activeTab) {
    this.activeTab = tab;
    const pendingCnt = this.state.pendingReports.length;
    const apps = [
      { id: 'reports', icon: '📋', name: `Báo cáo${pendingCnt > 0 ? ` (${pendingCnt})` : ''}`, bg: 'linear-gradient(135deg,#e11d48,#881337)' },
      { id: 'overview', icon: '🏢', name: 'Tổng quan', bg: 'linear-gradient(135deg,#2563eb,#1e3a8a)' },
      { id: 'departments', icon: '🏛️', name: '12 Phòng ban', bg: 'linear-gradient(135deg,#7c3aed,#4c1d95)' },
      { id: 'formation', icon: '👕', name: 'Sơ đồ đội hình', bg: 'linear-gradient(135deg,#0284c7,#00205b)' },
      { id: 'squad', icon: '⚽', name: 'Danh sách cầu thủ', bg: 'linear-gradient(135deg,#1d4ed8,#0f172a)' },
      { id: 'academy', icon: '🎓', name: 'Học viện', bg: 'linear-gradient(135deg,#16a34a,#14532d)' },
      { id: 'transfers', icon: '🤝', name: 'Chuyển nhượng', bg: 'linear-gradient(135deg,#ea580c,#9a3412)' },
      { id: 'coach', icon: '🎯', name: 'HLV & Chiến thuật', bg: 'linear-gradient(135deg,#0891b2,#164e63)' },
      { id: 'finance', icon: '💶', name: 'Tài chính', bg: 'linear-gradient(135deg,#ca8a04,#713f12)' },
      { id: 'leagues', icon: '🏆', name: 'Lịch & BXH', bg: 'linear-gradient(135deg,#dc2626,#7f1d1d)' },
      { id: 'media', icon: '📰', name: 'Truyền thông', bg: 'linear-gradient(135deg,#db2777,#831843)' },
      { id: 'history', icon: '💾', name: 'Lưu & Biên bản', bg: 'linear-gradient(135deg,#475569,#1e293b)' }
    ];
    const currentApp = apps.find((a) => a.id === tab) || apps[0];

    let content = '';
    if (tab === 'reports') content = this.renderReportsTab();
    else if (tab === 'overview') content = this.renderOverviewTab();
    else if (tab === 'departments') content = this.renderDepartmentsTab();
    else if (tab === 'formation') content = this.renderFormationTab();
    else if (tab === 'squad') content = this.renderSquadTab();
    else if (tab === 'academy') content = this.renderAcademyTab();
    else if (tab === 'transfers') content = this.renderTransfersTab();
    else if (tab === 'coach') content = this.renderCoachTab();
    else if (tab === 'finance') content = this.renderFinanceTab();
    else if (tab === 'leagues') content = this.renderLeaguesTab();
    else if (tab === 'media') content = this.renderMediaTab();
    else content = this.renderHistorySaveTab();

    const html = `
      <div class="macos-desktop ${this.macMaximized ? 'maximized' : ''}">
        <div class="macos-menubar">
          <div class="mac-menu-left">
            <span class="mac-apple"></span>
            <b>${currentApp.name}</b>
            <span class="mac-menu-item">PSG OS</span>
            <span class="mac-menu-item">Hồ sơ</span>
          </div>
          <div class="mac-menu-right">
            <span>€${this.state.finance.budget.toFixed(1)}M</span>
            <span>${this.formatClock(this.state.clockHour)}</span>
            <button class="mac-exit-btn" id="mac-top-exit">Thoát</button>
          </div>
        </div>
        <div class="macos-workspace">
          ${this.macMinimized ? `
            <div class="macos-desktop-hint">
              <div class="mac-desktop-badge">PARIS SAINT-GERMAIN · macOS EXECUTIVE</div>
              <p>Chọn biểu tượng trên thanh Dock bên dưới để mở ứng dụng quản lý.</p>
            </div>
          ` : `
            <div class="macos-window">
              <div class="macos-titlebar">
                <div class="traffic-lights">
                  <button class="tl red" id="mac-close" title="Đóng máy tính"></button>
                  <button class="tl yellow" id="mac-min" title="Thu nhỏ xuống Desktop"></button>
                  <button class="tl green" id="mac-max" title="Phóng to / Thu gọn"></button>
                </div>
                <div class="macos-win-title">${currentApp.icon} ${currentApp.name} — Paris Saint-Germain</div>
                <div style="width:48px;"></div>
              </div>
              <div class="macos-body">
                <aside class="macos-sidebar">
                  ${apps.map((a) => `<button class="mac-side-item ${a.id === tab ? 'active' : ''}" data-pctab="${a.id}"><span>${a.icon}</span><span>${a.name}</span></button>`).join('')}
                </aside>
                <main class="macos-main">${content}</main>
              </div>
            </div>
          `}
        </div>
        <div class="macos-dock-wrap">
          <div class="macos-dock">
            ${apps.map((a) => `
              <button class="dock-item ${a.id === tab && !this.macMinimized ? 'active' : ''}" data-pctab="${a.id}" title="${a.name}">
                <span class="dock-icon" style="background:${a.bg}">${a.icon}</span>
                <span class="dock-dot"></span>
              </button>`).join('')}
          </div>
        </div>
      </div>`;

    this.openModal('', html, 'macos');

    document.getElementById('mac-close')?.addEventListener('click', () => { this.audio.playClick(); this.closeModal(); });
    document.getElementById('mac-top-exit')?.addEventListener('click', () => { this.audio.playClick(); this.closeModal(); });
    document.getElementById('mac-min')?.addEventListener('click', () => { this.audio.playClick(); this.macMinimized = true; this.openComputer(this.activeTab); });
    document.getElementById('mac-max')?.addEventListener('click', () => { this.audio.playClick(); this.macMaximized = !this.macMaximized; this.openComputer(this.activeTab); });
    document.querySelectorAll('[data-pctab]').forEach((b) => {
      b.addEventListener('click', () => { this.audio.playClick(); this.macMinimized = false; this.openComputer(b.dataset.pctab); });
    });
    if (!this.macMinimized) this.bindComputerTabEvents(tab);
  }

  renderReportsTab() {
    const pending = this.state.pendingReports;
    const briefings = this.state.dailyBriefings;
    return `
      <div class="section-label">📅 Thông báo tình hình mỗi ngày cho Giám đốc / Chủ tịch</div>
      <div class="scroll-list" style="max-height:190px;margin-bottom:10px;">
        ${briefings.map((b) => `
          <div class="card-item">
            <div class="card-head"><strong>🗓️ ${b.date}</strong><span class="tag ok">Bản tin ngày</span></div>
            <p>${b.matchAlert}</p>
            <p>${b.trainingNote}</p>
            <p>${b.healthNote}</p>
            <p class="muted">${b.financeNote}</p>
          </div>`).join('')}
      </div>
      <div class="section-label">📨 Báo cáo & Đề xuất chờ duyệt (${pending.length}) — Sẽ biến mất sau khi duyệt</div>
      ${pending.length === 0 ? `<div class="card-item"><p class="muted">✅ Tất cả báo cáo phòng ban đã được Chủ tịch xử lý xong!</p></div>` : `
        <div class="scroll-list" style="max-height:220px;">
          ${pending.map((r) => `
            <div class="card-item urgent">
              <div class="card-head"><strong>${r.title}</strong><span class="tag">${r.dept}</span></div>
              <div class="muted">Người trình: <b>${r.author}</b> · Tác động tài chính: <b>${r.cost >= 0 ? '+' : ''}€${r.cost}M</b></div>
              <p>${r.detail}</p>
              <div class="btn-row">
                <button class="btn-primary rep-approve" data-rid="${r.id}">✅ Phê duyệt</button>
                <button class="btn-danger rep-reject" data-rid="${r.id}">❌ Từ chối</button>
              </div>
            </div>`).join('')}
        </div>`}
      <div class="section-label">📌 Theo dõi Nhiệm vụ Chủ tịch đã giao (${(this.state.assignedTasks || []).length})</div>
      ${(this.state.assignedTasks || []).length === 0 ? `<div class="card-item"><p class="muted">Chưa có nhiệm vụ nào được giao. Hãy gặp trực tiếp các giám đốc/trưởng phòng để giao nhiệm vụ!</p></div>` : `
        <div class="scroll-list" style="max-height:180px;">
          ${this.state.assignedTasks.map((t) => `
            <div class="card-item">
              <div class="card-head"><strong>${t.title}</strong><span class="tag ${t.status === 'Hoàn thành' ? 'ok' : ''}">${t.status} (${t.progress}%)</span></div>
              <div class="muted">Phụ trách: <b>${t.owner}</b> · Phối hợp: ${t.collaborators} · Hạn: Tuần ${t.deadlineWeek}</div>
              ${t.finalReport ? `<p style="color:#86efac;">✅ Kết quả: ${t.finalReport}</p>` : ''}
            </div>`).join('')}
        </div>`}`;
  }

  renderOverviewTab() {
    const s = this.state;
    const weekFx = s.getCurrentWeekFixture();
    const ligue1 = s.clubs.filter((c) => c.league === 'Ligue 1').sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga));
    const rank = ligue1.findIndex((c) => c.name === 'Paris Saint-Germain') + 1;
    return `
      <div class="kpi-grid">
        <div class="kpi-card"><span>Ngân sách CLB</span><strong>€${s.finance.budget.toFixed(1)}M</strong></div>
        <div class="kpi-card"><span>Quỹ chuyển nhượng</span><strong>€${s.finance.transferBudget.toFixed(1)}M</strong></div>
        <div class="kpi-card"><span>Ligue 1</span><strong>Hạng ${rank || 1}</strong></div>
        <div class="kpi-card"><span>Uy tín / CĐV</span><strong>${s.president.prestige} / ${s.president.fanSupport}%</strong></div>
      </div>
      <div class="card-item ${weekFx ? 'urgent' : ''}">
        <div class="card-head"><strong>⚽ Lịch thi đấu Tuần ${s.week}</strong><span class="tag">${weekFx ? weekFx.comp : 'Đã hoàn thành'}</span></div>
        <p>${weekFx ? `${weekFx.round}: <b>${weekFx.home}</b> vs <b>${weekFx.away}</b> (Chưa thi đấu — không thể tua qua tuần)` : 'Bạn đã hoàn thành trận đấu tuần này và có thể qua tuần mới.'}</p>
        <div class="btn-row">
          <button class="btn-primary" id="ov-play-match">🏟️ Ra SVĐ Parc des Princes · Thi đấu 3D</button>
          <button class="btn-accent" id="ov-board">🏛️ Họp Ban Lãnh Đạo</button>
          <button class="btn-secondary" id="ov-player-meet">🗣️ Họp riêng cầu thủ</button>
        </div>
      </div>`;
  }

  renderDepartmentsTab() {
    return `<div class="scroll-list">${this.state.departments.map((d) => `
      <div class="card-item">
        <div class="card-head"><strong>${d.name}</strong><span class="tag ok">Hiệu suất ${d.performance}% · Hài lòng ${d.morale}%</span></div>
        <div class="muted">Trưởng phòng: <b>${d.head}</b> · Nhân sự: ${d.staffCount} · Ngân sách: €${d.budget}M/năm</div>
        <p>Đang làm: ${d.activeTask}</p>
        ${d.proposalApproved ? '' : `
          <p class="proposal-txt">💡 Đề xuất chờ duyệt: ${d.proposal}</p>
          <div class="btn-row">
            <button class="btn-primary dept-approve" data-dept="${d.id}">✅ Phê duyệt (-€1.2M, +5%)</button>
            <button class="btn-secondary dept-boost" data-dept="${d.id}">📌 Giao KPI (+3%)</button>
          </div>`}
      </div>`).join('')}</div>`;
  }

  renderFormationTab() {
    const fs = this.state.formationSystem;
    const data = fs.getFormationData();
    const sel = this.selectedSlotIdx !== null ? data.starters.find((s) => s.slotIndex === this.selectedSlotIdx) : null;
    const phase = fs.getRoutinePhase(this.state.clockHour);

    return `
      <div class="filter-bar" style="align-items:center;">
        <select id="fm-preset" class="input-ctrl" style="max-width:130px;">
          ${Object.keys(FORMATION_PRESETS).map((k) => `<option value="${k}" ${k === data.formation ? 'selected' : ''}>Sơ đồ ${k}</option>`).join('')}
        </select>
        <input id="fm-name" class="input-ctrl" value="${data.tacticName}" placeholder="Tên chiến thuật..." />
        <button class="btn-xs btn-primary" id="fm-save-name">💾 Lưu tên</button>
        <button class="btn-xs btn-secondary" id="fm-zoom-in">🔍+</button>
        <button class="btn-xs btn-secondary" id="fm-zoom-out">🔍-</button>
      </div>
      <div class="muted" style="margin-bottom:6px;">📅 Lịch phòng thay đồ hiện tại: <b style="color:#fde68a;">${phase.label}</b> · Đồng bộ 100% với Tủ đồ 3D & Màn hình Phòng Thay Đồ</div>
      <div class="formation-layout">
        <div class="pitch-container">
          <div class="pitch-board" style="transform:scale(${this.pitchZoom});transform-origin:top center;">
            <div class="pitch-midline"></div>
            <div class="pitch-circle"></div>
            <div class="pitch-box-top"></div>
            <div class="pitch-box-bot"></div>
            ${data.starters.map((s) => SquadFormationSystem.renderJerseyCardHTML(s, this.selectedSlotIdx === s.slotIndex)).join('')}
          </div>
        </div>
        <div class="formation-side">
          ${sel ? `
            <div class="card-item urgent">
              <div class="card-head"><strong>#${sel.shirtNumber} ${sel.fullName} ${sel.isCaptain ? '©️' : ''}</strong><span class="tag ok">OVR ${sel.player.ovr}</span></div>
              <div class="muted">${sel.player.age} tuổi · ${sel.player.nationality} · Sở trường: ${sel.naturalPosition} · Đang đá: ${sel.position}</div>
              <div class="kpi-mini" style="margin:6px 0;">
                <span>Phong độ: <b>${sel.player.form}</b></span>
                <span>Tinh thần: <b>${sel.player.morale}%</b></span>
                <span>HĐ: <b>${sel.player.contractYears} năm</b></span>
              </div>
              <div class="btn-row">
                <button class="btn-xs btn-accent" id="fm-set-cap" data-pid="${sel.playerId}">©️ Chọn làm Đội trưởng (C)</button>
                <input id="fm-num-inp" type="number" min="1" max="99" value="${sel.shirtNumber}" class="input-ctrl" style="max-width:66px;padding:4px 6px;" />
                <button class="btn-xs btn-secondary" id="fm-set-num" data-pid="${sel.playerId}">👕 Đổi số áo</button>
              </div>
              <div class="section-label">Thay bằng cầu thủ dự bị / đổi vị trí</div>
              <div class="scroll-list" style="max-height:150px;">
                ${data.bench.map((b) => `
                  <button class="btn-secondary fm-swap" data-rep="${b.playerId}" ${b.availability !== 'available' ? 'disabled' : ''} style="width:100%;text-align:left;margin-bottom:4px;padding:5px 8px;font-size:11px;opacity:${b.availability !== 'available' ? '0.45' : '1'};">
                    #${b.shirtNumber} <b>${b.fullName}</b> (${b.position} · OVR ${b.player.ovr}) ${b.availability === 'injured' ? '🏥 Chấn thương' : b.availability === 'suspended' ? '🟥 Treo giò' : '→ Thay vào'}
                  </button>`).join('')}
              </div>
            </div>
          ` : `
            <div class="card-item">
              <strong>👕 Chạm vào một áo đấu trên sân</strong>
              <p class="muted">Xem đầy đủ chỉ số, đổi số áo (tự cập nhật Tủ đồ 3D), chọn Đội trưởng (chữ C tự cập nhật toàn game) hoặc thay cầu thủ dự bị.</p>
            </div>
            <div class="section-label">Danh sách dự bị (${data.bench.length})</div>
            <div class="scroll-list" style="max-height:210px;">
              ${data.bench.map((b) => `<div class="card-item" style="padding:6px 9px;">#${b.shirtNumber} <b>${b.fullName}</b> (${b.position} · OVR ${b.player.ovr}) ${b.availability === 'injured' ? '<span class="tag bad">🏥 Chấn thương</span>' : ''}</div>`).join('')}
            </div>
          `}
        </div>
      </div>`;
  }

  renderSquadTab() {
    const squad = this.state.getPsgSquad();
    return `<div class="table-wrap"><table class="data-table">
      <thead><tr><th>Cầu thủ</th><th>VT</th><th>Tuổi</th><th>OVR/POT</th><th>Giá trị</th><th>Lương</th><th>Hài lòng</th><th>Thao tác</th></tr></thead>
      <tbody>${squad.map((p) => `<tr><td><b>${p.name}</b> ${p.injuryDays > 0 ? `<span class="tag bad">🏥 ${p.injuryDays}n</span>` : ''}</td><td>${p.position}</td><td>${p.age}</td><td><b>${p.ovr}</b>/${p.pot}</td><td>€${p.value}M</td><td>€${p.wage}k</td><td>${p.satisfaction}%</td><td><button class="btn-xs sq-meet" data-pid="${p.id}">🗣️ Họp riêng</button></td></tr>`).join('')}</tbody>
    </table></div>`;
  }

  renderAcademyTab() {
    const groups = ['U15', 'U17', 'U19', 'Đội dự bị'];
    const list = this.state.academy.filter((y) => y.squad === this.academyFilter && !y.promoted);
    return `
      <div class="btn-row" style="margin-bottom:8px;">${groups.map((g) => `<button class="tab-btn ${this.academyFilter === g ? 'active' : ''}" data-acgrp="${g}">${g} (${this.state.academy.filter((y) => y.squad === g && !y.promoted).length})</button>`).join('')}</div>
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th>Cầu thủ trẻ</th><th>VT</th><th>Tuổi</th><th>OVR</th><th>POT</th><th>Tính cách</th><th>Quyết định</th></tr></thead>
        <tbody>${list.map((y) => `<tr><td><b>${y.name}</b></td><td>${y.position}</td><td>${y.age}</td><td>${y.ovr}</td><td><b style="color:${y.pot >= 85 ? '#4ade80' : '#cbd5e1'}">${y.pot}</b></td><td>${y.personality}</td><td><button class="btn-xs ac-promote" data-yid="${y.id}">⬆️ Đôn Đội 1</button> <button class="btn-xs ac-train" data-yid="${y.id}">⚡ Tập Đội 1</button></td></tr>`).join('')}</tbody>
      </table></div>`;
  }

  renderTransfersTab() {
    const q = this.transferSearch.toLowerCase();
    const list = this.state.players.filter((p) =>
      p.club !== 'Paris Saint-Germain' &&
      (this.transferPos === 'ALL' || p.position === this.transferPos) &&
      (this.transferTier === 'ALL' || p.tier === this.transferTier) &&
      (!q || p.name.toLowerCase().includes(q) || p.club.toLowerCase().includes(q))
    ).slice(0, 60);
    return `
      <div class="filter-bar">
        <input id="tr-search" class="input-ctrl" placeholder="Tìm trong 200 cầu thủ thật..." value="${this.transferSearch}" />
        <select id="tr-pos" class="input-ctrl"><option value="ALL">Mọi vị trí</option>${['GK','CB','LB','RB','DM','CM','AM','LW','RW','ST'].map((pos) => `<option value="${pos}" ${this.transferPos === pos ? 'selected' : ''}>${pos}</option>`).join('')}</select>
        <select id="tr-tier" class="input-ctrl"><option value="ALL">Mọi phân khúc</option>${['Siêu sao','Đẳng cấp cao','Triển vọng','Chất lượng tốt','Ít tên tuổi hơn'].map((t) => `<option value="${t}" ${this.transferTier === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
      </div>
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th>Cầu thủ</th><th>CLB</th><th>VT</th><th>OVR/POT</th><th>Giá</th><th>Phân khúc</th><th>Đàm phán</th></tr></thead>
        <tbody>${list.map((p) => `<tr><td><b>${p.name}</b></td><td>${p.club}</td><td>${p.position}</td><td><b>${p.ovr}</b>/${p.pot}</td><td>€${p.value}M</td><td><span class="tag">${p.tier}</span></td><td><button class="btn-xs tr-neg" data-pid="${p.id}">✍️ Đàm phán</button></td></tr>`).join('')}</tbody>
      </table></div>`;
  }

  openTransferNegotiation(playerId) {
    const p = this.state.players.find((x) => x.id === playerId);
    if (!p) return;
    const askFee = Math.round(p.value * 1.12);
    const askWage = Math.round(p.wage * 1.15);
    const html = `
      <div class="card-item"><h4>📋 ${p.name} (${p.club}) · OVR ${p.ovr}/${p.pot}</h4><p class="muted">Định giá: €${askFee}M · Kỳ vọng lương: €${askWage}k/tuần</p></div>
      <div class="form-row"><label>Hình thức:</label><select id="neg-type" class="input-ctrl"><option value="buy">Mua đứt</option><option value="loan">Cho mượn (18% phí)</option><option value="loan_buy">Mượn kèm mua đứt</option></select></div>
      <div class="form-row"><label>Phí đề nghị (€M):</label><input id="neg-fee" type="number" class="input-ctrl" value="${askFee}" /></div>
      <div class="form-row"><label>Lương (k€/tuần):</label><input id="neg-wage" type="number" class="input-ctrl" value="${askWage}" /></div>
      <div class="btn-row" style="margin-top:10px;"><button class="btn-primary" id="neg-submit">✅ Phê duyệt & Ký</button><button class="btn-secondary" id="neg-back">↩️ Quay lại</button></div>`;
    this.openModal(`🤝 ĐÀM PHÁN · ${p.name.toUpperCase()}`, html, 'normal');
    document.getElementById('neg-back')?.addEventListener('click', () => this.openComputer('transfers'));
    document.getElementById('neg-submit')?.addEventListener('click', () => {
      const type = document.getElementById('neg-type')?.value || 'buy';
      const rawFee = Number(document.getElementById('neg-fee')?.value || askFee);
      const offerWage = Number(document.getElementById('neg-wage')?.value || askWage);
      const fee = type === 'buy' ? rawFee : Math.max(2, Math.round(rawFee * 0.18));
      if (fee > this.state.finance.transferBudget) { this.audio.playAlert(); this.toast('Không đủ quỹ chuyển nhượng!', 'error'); return; }
      if (type === 'buy' && rawFee < p.value * 0.92) { this.audio.playAlert(); this.toast(`${p.club} từ chối mức giá quá thấp!`, 'error'); return; }
      const oldClub = p.club;
      p.club = 'Paris Saint-Germain'; p.wage = offerWage; p.contractYears = type === 'buy' ? 5 : 1;
      this.state.addLedger(`${type === 'buy' ? 'Mua' : 'Mượn'} ${p.name} từ ${oldClub}`, -fee);
      PressNewsSystem.generateTransferNews(this.state, p.name, oldClub, fee, true);
      this.state.formationSystem.notify();
      this.audio.playSuccess(); this.toast(`🎉 Chào mừng ${p.name} gia nhập PSG!`, 'success');
      this.openComputer('squad');
    });
  }

  renderCoachTab() {
    const c = this.state.coach;
    return `
      <div class="card-item">
        <div class="card-head"><strong>👔 HLV Trưởng: ${c.name}</strong><span class="tag ok">HĐ còn ${c.contractYears} năm · €${c.wage}k/tuần</span></div>
        <p>Sơ đồ: <b>${c.formation}</b> · Lịch duy trì sân tập: <b>09:00–11:30 & 15:00–17:00</b></p>
        <div class="btn-row" style="margin-top:8px;">
          <button class="btn-primary" id="coach-extend">✍️ Gia hạn +2 năm</button>
          <button class="btn-danger" id="coach-replace">🔄 Bổ nhiệm Xabi Alonso (€8M)</button>
        </div>
      </div>`;
  }

  renderFinanceTab() {
    const f = this.state.finance;
    return `
      <div class="kpi-grid">
        <div class="kpi-card"><span>Ngân sách</span><strong>€${f.budget.toFixed(1)}M</strong></div>
        <div class="kpi-card"><span>Chuyển nhượng</span><strong>€${f.transferBudget.toFixed(1)}M</strong></div>
        <div class="kpi-card"><span>Lương / tuần</span><strong>€${f.weeklyWages}M</strong></div>
        <div class="kpi-card"><span>FFP</span><strong>${f.ffpStatus}</strong></div>
      </div>
      <div class="scroll-list">${f.ledger.map((l) => `<div class="card-item"><div class="card-head"><span>${l.date} — ${l.desc}</span><b style="color:${l.amount >= 0 ? '#4ade80' : '#f87171'}">${l.amount >= 0 ? '+' : ''}€${l.amount}M</b></div></div>`).join('')}</div>`;
  }

  renderLeaguesTab() {
    const ligue1 = this.state.clubs.filter((c) => c.league === 'Ligue 1').sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga));
    const upcoming = this.state.fixtures.filter((f) => !f.played).slice(0, 4);
    return `
      <div class="grid-2" style="margin-bottom:8px;">${upcoming.map((f, i) => `<div class="card-item"><div class="card-head"><span class="tag">${f.comp}</span><span class="muted">Tuần ${f.week}</span></div><div><b>${f.home}</b> vs <b>${f.away}</b></div>${i === 0 ? `<button class="btn-xs btn-primary" id="lg-play-now" style="margin-top:6px;">⚽ Thi đấu 3D</button>` : ''}</div>`).join('')}</div>
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th>#</th><th>CLB</th><th>Trận</th><th>T</th><th>H</th><th>B</th><th>HS</th><th>Điểm</th></tr></thead>
        <tbody>${ligue1.map((c, i) => `<tr class="${c.name === 'Paris Saint-Germain' ? 'highlight-row' : ''}"><td>${i + 1}</td><td><b>${c.name}</b></td><td>${c.played}</td><td>${c.won}</td><td>${c.drawn}</td><td>${c.lost}</td><td>${c.gf - c.ga}</td><td><b>${c.pts}</b></td></tr>`).join('')}</tbody>
      </table></div>`;
  }

  renderMediaTab() {
    const cats = ['ALL', 'Tin PSG', 'Trước trận', 'Sau trận', 'Chuyển nhượng', 'Champions League', 'Nội bộ', 'SAVED'];
    const labels = { ALL: 'Tất cả', SAVED: '🔖 Đã lưu' };
    const articles = (this.state.newsArchive || []).filter((a) =>
      this.newsCategory === 'ALL' ? true : this.newsCategory === 'SAVED' ? a.saved : a.category === this.newsCategory
    );

    if (this.activeArticleId) {
      const art = (this.state.newsArchive || []).find((x) => x.id === this.activeArticleId);
      if (art) {
        art.read = true;
        return `
          <div class="btn-row" style="margin-bottom:8px;">
            <button class="btn-secondary" id="news-back">← Quay lại Tòa soạn</button>
            <button class="btn-accent" id="news-save" data-nid="${art.id}">${art.saved ? '🔖 Đã lưu' : '📑 Lưu bài viết'}</button>
          </div>
          <div class="card-item">
            <img src="${art.image}" alt="${art.title}" style="width:100%;max-height:210px;object-fit:cover;border-radius:10px;margin-bottom:8px;" />
            <div class="card-head"><span class="tag">${art.outlet} · ${art.category}</span><span class="tag ok">${art.tagType}</span></div>
            <h3 style="margin:6px 0;font-size:16px;">${art.title}</h3>
            <div class="muted" style="margin-bottom:8px;">${art.date} · ❤️ ${art.likes.toLocaleString('vi-VN')} lượt quan tâm</div>
            <p style="line-height:1.6;">${art.body}</p>
          </div>
          <div class="section-label">💬 Bình luận người hâm mộ PSG (${art.comments.length})</div>
          ${art.comments.map((c) => `<div class="card-item"><b>${c.user}</b>: ${c.text}</div>`).join('')}`;
      }
    }

    return `
      <div class="tab-strip">
        ${cats.map((c) => `<button class="tab-btn ${this.newsCategory === c ? 'active' : ''}" data-ncat="${c}">${labels[c] || c}</button>`).join('')}
      </div>
      <div class="kpi-mini" style="margin-bottom:8px;">
        <span>Uy tín CLB: <b>${this.state.president.prestige}/100</b></span>
        <span>Ủng hộ CĐV: <b>${this.state.president.fanSupport}%</b></span>
        <span>Niềm tin Ban LĐ: <b>${this.state.president.boardTrust}%</b></span>
        <span>Kho lưu trữ: <b>${(this.state.newsArchive || []).length} bài</b></span>
      </div>
      <div class="grid-2">
        ${articles.slice(0, 12).map((a) => `
          <div class="card-item news-card" data-open-news="${a.id}" style="cursor:pointer;">
            <img src="${a.image}" alt="${a.title}" loading="lazy" style="width:100%;height:112px;object-fit:cover;border-radius:8px;margin-bottom:6px;" />
            <div class="card-head"><span class="tag">${a.outlet} · ${a.category}</span><span class="muted">${a.tagType}</span></div>
            <div style="font-weight:700;font-size:12.5px;margin:4px 0;color:#fff;">${a.title}</div>
            <p class="muted">${a.summary}</p>
          </div>`).join('')}
      </div>`;
  }

  renderHistorySaveTab() {
    return `
      <div class="section-label">💾 Lưu / Tải Game (IndexedDB — 3 Ô lưu)</div>
      <div class="grid-3">${['slot_1', 'slot_2', 'slot_3'].map((id, i) => `<div class="card-item"><strong>Ô lưu ${i + 1}</strong><div class="muted" id="meta-${id}">Đang kiểm tra...</div><div class="btn-row" style="margin-top:6px;"><button class="btn-xs btn-primary sv-save" data-slot="${id}">💾 Lưu</button><button class="btn-xs btn-secondary sv-load" data-slot="${id}">📂 Tải</button></div></div>`).join('')}</div>
      <div class="section-label">🏛️ Biên bản Họp Ban Lãnh Đạo (${this.state.meetingMinutes.length})</div>
      <div class="scroll-list" style="max-height:110px;">${this.state.meetingMinutes.map((m) => `<div class="card-item"><div class="card-head"><strong>${m.topic}</strong><span class="muted">${m.date}</span></div><p>${m.decision}</p></div>`).join('')}</div>`;
  }

  bindComputerTabEvents(tab) {
    if (tab === 'reports') {
      document.querySelectorAll('.rep-approve').forEach((b) => {
        b.addEventListener('click', () => {
          const rep = this.state.resolvePendingReport(b.dataset.rid, true);
          this.audio.playSuccess();
          if (rep) this.toast(`Đã phê duyệt "${rep.title}" — Báo cáo đã được xử lý xong!`, 'success');
          this.openComputer('reports');
        });
      });
      document.querySelectorAll('.rep-reject').forEach((b) => {
        b.addEventListener('click', () => {
          const rep = this.state.resolvePendingReport(b.dataset.rid, false);
          this.audio.playClick();
          if (rep) this.toast(`Đã từ chối "${rep.title}".`, 'info');
          this.openComputer('reports');
        });
      });
    } else if (tab === 'overview') {
      document.getElementById('ov-play-match')?.addEventListener('click', () => { this.closeModal(); this.cb.startMatch(); });
      document.getElementById('ov-board')?.addEventListener('click', () => this.openBoardMeeting());
      document.getElementById('ov-player-meet')?.addEventListener('click', () => this.openPlayerMeetingSelector());
    } else if (tab === 'departments') {
      document.querySelectorAll('.dept-approve').forEach((b) => {
        b.addEventListener('click', () => {
          const d = this.state.departments.find((x) => x.id === b.dataset.dept);
          if (!d) return;
          d.proposalApproved = true; // Biến mất sau khi duyệt!
          d.performance = Math.min(100, d.performance + 5);
          d.morale = Math.min(100, d.morale + 5);
          this.state.addLedger(`Phê duyệt đề xuất của ${d.name}`, -1.2);
          this.audio.playSuccess();
          this.toast(`Đã duyệt đề xuất của ${d.name}!`, 'success');
          this.openComputer('departments');
        });
      });
      document.querySelectorAll('.dept-boost').forEach((b) => {
        b.addEventListener('click', () => {
          const d = this.state.departments.find((x) => x.id === b.dataset.dept);
          if (!d) return;
          d.performance = Math.min(100, d.performance + 3);
          this.audio.playClick();
          this.toast(`Đã giao KPI mới cho ${d.name}.`, 'info');
          this.openComputer('departments');
        });
      });
    } else if (tab === 'formation') {
      document.getElementById('fm-preset')?.addEventListener('change', (e) => {
        this.state.formationSystem.setFormation(e.target.value);
        this.audio.playSuccess();
        this.toast(`Đã chuyển sang sơ đồ ${e.target.value} — Đồng bộ toàn game!`, 'success');
        this.openComputer('formation');
      });
      document.getElementById('fm-save-name')?.addEventListener('click', () => {
        const val = document.getElementById('fm-name')?.value || '';
        this.state.formationSystem.setTacticName(val);
        this.audio.playSuccess();
        this.toast(`Đã lưu chiến thuật "${val}"!`, 'success');
      });
      document.getElementById('fm-zoom-in')?.addEventListener('click', () => { this.pitchZoom = Math.min(1.25, +(this.pitchZoom + 0.1).toFixed(2)); this.openComputer('formation'); });
      document.getElementById('fm-zoom-out')?.addEventListener('click', () => { this.pitchZoom = Math.max(0.8, +(this.pitchZoom - 0.1).toFixed(2)); this.openComputer('formation'); });
      document.querySelectorAll('.pitch-jersey').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.selectedSlotIdx = Number(btn.dataset.slot);
          this.audio.playClick();
          this.openComputer('formation');
        });
      });
      document.getElementById('fm-set-cap')?.addEventListener('click', (e) => {
        this.state.formationSystem.setCaptain(e.target.dataset.pid);
        this.audio.playSuccess();
        this.toast('Đã cập nhật Đội trưởng (C) trên toàn bộ sơ đồ & Tủ đồ 3D!', 'success');
        this.openComputer('formation');
      });
      document.getElementById('fm-set-num')?.addEventListener('click', (e) => {
        const num = document.getElementById('fm-num-inp')?.value;
        this.state.formationSystem.setShirtNumber(e.target.dataset.pid, num);
        this.audio.playSuccess();
        this.toast(`Đã đổi số áo #${num} — Tủ đồ 3D & sơ đồ đã tự động cập nhật!`, 'success');
        this.openComputer('formation');
      });
      document.querySelectorAll('.fm-swap').forEach((b) => {
        b.addEventListener('click', () => {
          const res = this.state.formationSystem.swapStarter(this.selectedSlotIdx, b.dataset.rep);
          if (res.ok) { this.audio.playSuccess(); this.toast('Đã thay cầu thủ — Đồng bộ trên toàn game!', 'success'); this.openComputer('formation'); }
          else { this.audio.playAlert(); this.toast(res.reason, 'error'); }
        });
      });
    } else if (tab === 'squad') {
      document.querySelectorAll('.sq-meet').forEach((b) => b.addEventListener('click', () => this.openPlayerMeetingSelector(b.dataset.pid)));
    } else if (tab === 'academy') {
      document.querySelectorAll('[data-acgrp]').forEach((b) => b.addEventListener('click', () => { this.academyFilter = b.dataset.acgrp; this.openComputer('academy'); }));
      document.querySelectorAll('.ac-promote').forEach((b) => {
        b.addEventListener('click', () => {
          const y = this.state.academy.find((x) => x.id === b.dataset.yid);
          if (!y) return;
          y.promoted = true;
          this.state.players.push({ id: `pl_ac_${Date.now()}`, name: y.name, club: 'Paris Saint-Germain', nationality: y.nationality, position: y.position, age: y.age, dob: `01/01/${2026 - y.age}`, foot: 'Phải', height: 180, weight: 72, ovr: y.ovr, pot: y.pot, tech: y.ovr + 1, phys: y.phys, tact: y.ovr, value: Math.max(3, y.ovr - 55), wage: 25, contractYears: 4, injuryDays: 0, form: 80, morale: 92, satisfaction: 95, loyalty: 92, tier: 'Triển vọng', goals: 0, assists: 0, apps: 0 });
          this.state.formationSystem.notify();
          this.audio.playSuccess(); this.toast(`Đã đôn ${y.name} lên Đội một & cấp tủ cá nhân trong Phòng Thay Đồ!`, 'success'); this.openComputer('academy');
        });
      });
      document.querySelectorAll('.ac-train').forEach((b) => {
        b.addEventListener('click', () => {
          const y = this.state.academy.find((x) => x.id === b.dataset.yid);
          if (!y) return;
          y.trainingWithFirstTeam = true; y.ovr = Math.min(y.pot, y.ovr + 1);
          this.audio.playClick(); this.toast(`${y.name} đã lên tập cùng Đội một!`, 'info'); this.openComputer('academy');
        });
      });
    } else if (tab === 'transfers') {
      document.getElementById('tr-search')?.addEventListener('input', (e) => { this.transferSearch = e.target.value; this.openComputer('transfers'); });
      document.getElementById('tr-pos')?.addEventListener('change', (e) => { this.transferPos = e.target.value; this.openComputer('transfers'); });
      document.getElementById('tr-tier')?.addEventListener('change', (e) => { this.transferTier = e.target.value; this.openComputer('transfers'); });
      document.querySelectorAll('.tr-neg').forEach((b) => b.addEventListener('click', () => this.openTransferNegotiation(b.dataset.pid)));
    } else if (tab === 'coach') {
      document.getElementById('coach-extend')?.addEventListener('click', () => { this.state.coach.contractYears += 2; this.audio.playSuccess(); this.openComputer('coach'); });
      document.getElementById('coach-replace')?.addEventListener('click', () => { this.state.coach.name = 'Xabi Alonso'; this.state.coach.tactics = 94; this.state.addLedger('Bổ nhiệm Xabi Alonso', -8.0); this.audio.playSuccess(); this.openComputer('coach'); });
    } else if (tab === 'leagues') {
      document.getElementById('lg-play-now')?.addEventListener('click', () => { this.closeModal(); this.cb.startMatch(); });
    } else if (tab === 'media') {
      document.querySelectorAll('[data-ncat]').forEach((b) => b.addEventListener('click', () => {
        this.newsCategory = b.dataset.ncat; this.activeArticleId = null;
    this.selectedSlotIdx = null;
    this.pitchZoom = 1.0; this.openComputer('media');
      }));
      document.querySelectorAll('[data-open-news]').forEach((card) => card.addEventListener('click', () => {
        this.activeArticleId = card.dataset.openNews; this.openComputer('media');
      }));
      document.getElementById('news-back')?.addEventListener('click', () => { this.activeArticleId = null;
    this.selectedSlotIdx = null;
    this.pitchZoom = 1.0; this.openComputer('media'); });
      document.getElementById('news-save')?.addEventListener('click', (e) => {
        const a = this.state.newsArchive.find((x) => x.id === e.target.dataset.nid);
        if (a) { a.saved = !a.saved; this.audio.playClick(); this.openComputer('media'); }
      });
    } else if (tab === 'history') {
      this.saveManager.listSlots().then((slots) => {
        slots.forEach(({ id, rec }) => { const el = document.getElementById(`meta-${id}`); if (el) el.textContent = rec ? `${rec.summary} (${rec.savedAt})` : 'Ô trống'; });
      });
      document.querySelectorAll('.sv-save').forEach((b) => b.addEventListener('click', async () => {
        const res = await this.saveManager.saveSlot(b.dataset.slot, this.cb.exportSnapshot());
        this.audio.playSuccess(); this.toast(res.ok ? `Đã lưu ${b.dataset.slot}!` : 'Lỗi lưu.', res.ok ? 'success' : 'error'); this.openComputer('history');
      }));
      document.querySelectorAll('.sv-load').forEach((b) => b.addEventListener('click', async () => {
        const rec = await this.saveManager.loadSlot(b.dataset.slot);
        if (!rec) { this.toast('Ô trống.', 'warn'); return; }
        this.cb.importSnapshot(rec.data); this.audio.playSuccess(); this.toast('Đã tải game!', 'success'); this.closeModal();
      }));
    }
  }

  // === QUY TRÌNH NGÀY THI ĐẤU 4 GIAI ĐOẠN (CHỦ TỊCH PHẠM MINH CHIÊU) ===
  openMatchdayFlow() {
    const fx = this.state.getCurrentWeekFixture() || this.state.getNextFixture();
    if (!fx) {
      this.state.concludeSeason();
      this.toast(`Đã sang mùa giải mới ${this.state.season}!`, 'success');
      return;
    }
    const rep = MatchSimulationEngine.buildPreMatchCoachReport(fx, this.state);
    const directives = [
      ['cheer', '👏 1. Chúc toàn đội thi đấu tốt (+Tinh thần)'],
      ['coach', '🤝 2. Động viên HLV trưởng Luis Enrique (+Tâm lý BHL)'],
      ['rest', '🛡️ 3. Yêu cầu ưu tiên bảo toàn thể lực (-Rủi ro chấn thương)'],
      ['win', '🔥 4. Yêu cầu tập trung giành chiến thắng (+Động lực tấn công)'],
      ['youth', '🎓 5. Yêu cầu tạo cơ hội cho cầu thủ trẻ'],
      ['none', '📋 6. Không đưa ra chỉ đạo (Giao toàn quyền cho HLV)']
    ];

    const html = `
      <div class="card-item urgent">
        <div class="card-head"><strong>📢 THÔNG BÁO NGÀY THI ĐẤU · ${fx.comp}</strong><span class="tag">${fx.round}</span></div>
        <h3 style="margin:6px 0;font-size:16px;">${fx.home}  vs  ${fx.away}</h3>
        <div class="muted">📅 ${fx.date} · ⏰ ${fx.time} · 🏟️ ${fx.stadium} · Trạng thái: <b>${fx.status}</b></div>
      </div>
      <div class="card-item">
        <div class="card-head"><strong>👔 Báo cáo trước trận của HLV ${rep.coachName}</strong><span class="tag ok">${rep.formation}</span></div>
        <p>"${rep.summary}"</p>
        <div class="muted" style="margin-top:6px;">
          <b>Sơ đồ đồng bộ (${this.state.formationSystem.formation}):</b> ${this.state.formationSystem.getFormationData().starters.map((s) => `#${s.shirtNumber} ${s.displayName}${s.isCaptain ? ' (C)' : ''}`).join(' · ')}<br/>
          <b>Phong độ cao:</b> ${rep.inForm.map((p) => `${p.name} (${p.form})`).join(' · ')}<br/>
          <b>Chấn thương / Vắng mặt:</b> ${rep.injured.length ? rep.injured.map((p) => `${p.name} (${p.injuryDays}n)`).join(', ') : 'Không có'} · <b>Điểm cần lưu ý:</b> ${rep.vulnerable}
        </div>
      </div>
      <div class="section-label">Giai đoạn 3: Ý kiến của Chủ tịch Phạm Minh Chiêu → Tự động mô phỏng trận đấu</div>
      <div class="grid-2">
        ${directives.map(([k, txt]) => `<button class="btn-primary md-dir" data-dir="${k}" style="text-align:left;">${txt}</button>`).join('')}
      </div>
      <div class="btn-row" style="margin-top:8px;">
        <button class="btn-secondary" id="md-open-news">📰 Tin báo chí trước trận</button>
        <button class="btn-accent" id="md-open-form">👕 Chỉnh Sơ đồ đội hình</button>
      </div>`;

    this.openModal('⚽ NGÀY THI ĐẤU — PARIS SAINT-GERMAIN', html, 'wide');
    document.getElementById('md-open-news')?.addEventListener('click', () => this.openComputer('media'));
    document.getElementById('md-open-form')?.addEventListener('click', () => this.openComputer('formation'));
    document.querySelectorAll('.md-dir').forEach((b) => {
      b.addEventListener('click', () => {
        const res = this.state.runAutomaticMatchday(b.dataset.dir);
        if (res) {
          this.audio.playWhistle();
          this.openMatchResultModal(res);
        }
      });
    });
  }

  openMatchResultModal(res) {
    const psgGoalsList = res.goalEvents.filter((e) => e.team === 'Paris Saint-Germain');
    const oppGoalsList = res.goalEvents.filter((e) => e.team !== 'Paris Saint-Germain');
    const cr = res.coachReport;

    const html = `
      <div class="card-item ${res.psgWon ? '' : 'urgent'}" style="text-align:center;">
        <div class="tag">${res.fixture.comp} · ${res.fixture.round} · ${res.fixture.stadium}</div>
        <h2 style="margin:8px 0;font-size:21px;">${res.fixture.home}  ${res.homeGoals} - ${res.awayGoals}  ${res.fixture.away}</h2>
        <div class="muted">⭐ Cầu thủ xuất sắc nhất: <b style="color:#fde68a;">${res.motm.name} (${res.motm.rating})</b> · ${cr.resultLabel}</div>
        <div class="kpi-mini" style="justify-content:center;margin-top:8px;">
          <span>Kiểm soát: <b>${res.stats.homePoss}% - ${res.stats.awayPoss}%</b></span>
          <span>Sút (Trúng): <b>${res.stats.homeShots}(${res.stats.homeOnTarget}) - ${res.stats.awayShots}(${res.stats.awayOnTarget})</b></span>
          <span>xG: <b>${res.stats.homeXg} - ${res.stats.awayXg}</b></span>
        </div>
      </div>
      <div class="grid-2">
        <div class="card-item">
          <strong>⚽ Ghi bàn (Paris Saint-Germain)</strong>
          <p>${psgGoalsList.length ? psgGoalsList.map((e) => `• ${e.scorer} (${e.minute}')${e.assister ? ` — kiến tạo: ${e.assister}` : ''}`).join('<br/>') : 'Không có bàn thắng'}</p>
        </div>
        <div class="card-item">
          <strong>⚽ Ghi bàn (${res.oppName})</strong>
          <p>${oppGoalsList.length ? oppGoalsList.map((e) => `• ${e.scorer} (${e.minute}')`).join('<br/>') : 'Giữ sạch lưới!'}</p>
        </div>
      </div>
      <div class="card-item">
        <strong>👔 Báo cáo chuyên môn của HLV ${this.state.coach.name}</strong>
        <p>${cr.summary}</p>
        <p class="muted"><b>Điểm mạnh:</b> ${cr.strengths} · <b>Điểm yếu:</b> ${cr.weaknesses}${res.matchInjury ? ` · 🏥 Chấn thương mới: ${res.matchInjury}` : ''}</p>
      </div>
      <div class="section-label">📊 Đánh giá cầu thủ PSG sau trận</div>
      <div class="table-wrap" style="max-height:155px;">
        <table class="data-table">
          <thead><tr><th>Cầu thủ</th><th>VT</th><th>Điểm</th><th>G/A</th><th>Nhận xét chuyên môn</th></tr></thead>
          <tbody>${cr.ratings.map((r) => `<tr><td><b>${r.name}</b></td><td>${r.position}</td><td><b style="color:${r.rating >= 7.5 ? '#4ade80' : r.rating < 6.2 ? '#f87171' : '#fff'}">${r.rating}</b></td><td>${r.goals}/${r.assists}</td><td>${r.note}</td></tr>`).join('')}</tbody>
        </table>
      </div>
      <div class="section-label">💡 Đề xuất của Ban huấn luyện sau trận</div>
      ${cr.proposals.map((pr) => `
        <div class="card-item">
          <p>"${pr.text}" <span class="tag">${pr.status}</span></p>
          ${pr.status === 'Chờ duyệt' ? `
            <div class="btn-row">
              <button class="btn-xs btn-primary cp-act" data-cpid="${pr.id}" data-act="Đã phê duyệt">✅ Phê duyệt</button>
              <button class="btn-xs btn-danger cp-act" data-cpid="${pr.id}" data-act="Đã từ chối">❌ Từ chối</button>
              <button class="btn-xs btn-secondary cp-act" data-cpid="${pr.id}" data-act="Đã chuyển GĐ Thể thao">📤 Chuyển GĐ Thể thao</button>
            </div>` : ''}
        </div>`).join('')}
      <div class="btn-row" style="margin-top:8px;">
        <button class="btn-primary" id="mr-press">📰 Đọc báo chí & bình luận CĐV sau trận</button>
        <button class="btn-secondary" id="mr-close">🏢 Đóng báo cáo</button>
      </div>`;

    this.openModal('🏁 THÔNG BÁO KẾT QUẢ & BÁO CÁO SAU TRẬN', html, 'wide');
    document.querySelectorAll('.cp-act').forEach((b) => {
      b.addEventListener('click', () => {
        const pr = cr.proposals.find((x) => x.id === b.dataset.cpid);
        if (pr) { pr.status = b.dataset.act; this.audio.playSuccess(); this.toast(`Đã cập nhật đề xuất HLV: ${pr.status}`, 'success'); this.openMatchResultModal(res); }
      });
    });
    document.getElementById('mr-press')?.addEventListener('click', () => { this.activeArticleId = null;
    this.selectedSlotIdx = null;
    this.pitchZoom = 1.0; this.newsCategory = 'ALL'; this.openComputer('media'); });
    document.getElementById('mr-close')?.addEventListener('click', () => this.closeModal());
  }
}
