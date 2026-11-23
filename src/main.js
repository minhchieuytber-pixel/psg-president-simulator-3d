// src/main.js
// Khởi chạy chính: Raycast từ tâm ngắm để chỉ hiện nút tương tác khi trỏ vào vật thể/cửa gỗ/ghế/NPC, đồng hồ lịch tập luyện sống động & trận đấu 3D
import { AudioManager } from './audio/AudioManager.js';
import { TextureFactory } from './core/TextureFactory.js';
import { FurnitureFactory } from './scene/FurnitureFactory.js';
import { CharacterFactory } from './characters/CharacterFactory.js';
import { AnimationSystem } from './animations/AnimationSystem.js';
import { VehicleSystem } from './vehicles/VehicleSystem.js';
import { ThirdPersonCamera } from './camera/ThirdPersonCamera.js';
import { TouchControls } from './controls/TouchControls.js';
import { PsgCampusScene } from './scene/PsgCampusScene.js';
import { DressingRoomSystem } from './scene/DressingRoomSystem.js';
import { NpcSystem } from './npc/NpcSystem.js';
import { SaveManager } from './save/SaveManager.js';
import { GameState } from './club/GameState.js';
import { TaskAssignmentSystem } from './dialogue/DialogueSystem.js';
import { UIManager } from './ui/UIManager.js';

class FootballPresidentGame3D {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.audio = new AudioManager();
    this.saveManager = new SaveManager();
    this.state = new GameState();

    const mobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
    this.isMobileDevice = !!mobileDevice;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !mobileDevice,
      alpha: false,
      powerPreference: mobileDevice ? 'default' : 'high-performance',
      stencil: false,
      depth: true
    });
    this.renderer.setPixelRatio(Math.min(mobileDevice ? 1.15 : 1.5, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = !mobileDevice;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;

    this.campusSceneObj = new THREE.Scene();
    this.campusSceneObj.background = new THREE.Color(0x8bb8e8);
    this.campusSceneObj.fog = new THREE.Fog(0x8bb8e8, 75, 195);

    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.15, 260);
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 4.6;
    this.centerNDC = new THREE.Vector2(0, 0);

    this.texFactory = new TextureFactory();
    this.furnFactory = new FurnitureFactory(this.texFactory);
    this.charFactory = new CharacterFactory();
    this.animSystem = new AnimationSystem();
    this.vehicleSystem = new VehicleSystem(this.texFactory);

    this.campus = new PsgCampusScene(this.campusSceneObj, this.texFactory, this.furnFactory, this.vehicleSystem);
    this.dressingRoom = new DressingRoomSystem(this.campus, this.texFactory, this.furnFactory, this.state.formationSystem);
    this.npcSystem = new NpcSystem(this.campusSceneObj, this.charFactory, this.animSystem, this.campus);
    this.npcSystem.spawnFromProfiles(this.state.npcs, this.state.clockHour);

    this.playerMesh = this.charFactory.createHumanoid({ outfit: 'suit_president', heightScale: 1.02 });
    this.playerMesh.visible = false;
    this.playerMesh.position.set(-26.0, 0.14, -12.5);
    this.campusSceneObj.add(this.playerMesh);

    this.tpCam = new ThirdPersonCamera(this.camera);
    this.tpCam.setLookDirection(0, -0.06);
    this.controls = new TouchControls(this.tpCam, this.canvas, () => this.handleInteract());

    this.mode = 'campus';
    this.seatedSeat = null;
    this.aimedTarget = null;
    this.fpsFrames = 0;
    this.fpsTime = performance.now();
    this.currentFps = 60;
    this.lastAdaptiveCheck = performance.now();
    this.adaptivePixelRatio = Math.min(mobileDevice ? 1.15 : 1.5, window.devicePixelRatio || 1);
    this.lowFpsSamples = 0;

    this.ui = new UIManager(this.state, this.audio, this.saveManager, {
      teleport: (room) => this.teleportToRoom(room),
      startMatch: () => this.enterMatchday(),
      exitMatch: () => this.exitMatchday(),
      summonBoard: () => this.npcSystem.summonBoardMeeting(),
      endBoard: () => this.npcSystem.endBoardMeeting(),
      summonPlayer: (name) => this.npcSystem.summonPlayerToPresidentOffice(name),
      dismissPlayer: () => this.npcSystem.dismissSummonedPlayer(),
      dispatchNpcTask: (npcId, rKey) => this.npcSystem.dispatchNpcForTask(npcId, rKey),
      setQuality: (q) => this.applyQuality(q),
      toggleSprint: () => { this.controls.sprint = !this.controls.sprint; return this.controls.sprint; },
      interact: () => this.handleInteract(),
      toggleMatchSpeed: () => {
        this.match3D.speed = this.match3D.speed === 1 ? 2.2 : 1;
        const b = document.getElementById('btn-match-speed');
        if (b) b.textContent = this.match3D.speed > 1 ? '⏩ 2x' : '▶️ 1x';
      },
      toggleMatchPause: () => {
        this.match3D.paused = !this.match3D.paused;
        const b = document.getElementById('btn-match-pause');
        if (b) b.textContent = this.match3D.paused ? '▶️ Tiếp tục' : '⏸️ Tạm dừng';
      },
      exportSnapshot: () => ({
        president: this.state.president, season: this.state.season, seasonNum: this.state.seasonNum,
        week: this.state.week, dayNum: this.state.dayNum, dayName: this.state.dayName, clockHour: this.state.clockHour,
        coach: this.state.coach, finance: this.state.finance, departments: this.state.departments,
        players: this.state.players, academy: this.state.academy, clubs: this.state.clubs,
        fixtures: this.state.fixtures, pendingReports: this.state.pendingReports,
        dailyBriefings: this.state.dailyBriefings, meetingMinutes: this.state.meetingMinutes,
        phoneInbox: this.state.phoneInbox, socialFeed: this.state.socialFeed,
        seasonHistory: this.state.seasonHistory, dialogueLogs: this.state.dialogueLogs, headToHead: this.state.headToHead, assignedTasks: this.state.assignedTasks, newsArchive: this.state.newsArchive, matchReports: this.state.matchReports, formationState: this.state.formationSystem.exportState(),
        npcs: this.state.npcs,
        playerPos: { x: this.playerMesh.position.x, z: this.playerMesh.position.z }
      }),
      importSnapshot: (snap) => {
        Object.assign(this.state, snap);
        if (snap.formationState) this.state.formationSystem.importState(snap.formationState);
        if (snap.npcs) this.state.npcs = snap.npcs;
        this.standUp(true);
        if (snap.playerPos) this.playerMesh.position.set(snap.playerPos.x, 0.14, snap.playerPos.z);
      }
    });

    const savedSettings = this.saveManager.loadSettings();
    this.ui.currentQuality = savedSettings.quality || 'Medium';
    this.audio.muted = !!savedSettings.muted;
    this.applyQuality(this.ui.currentQuality);

    this.onResize();
    window.addEventListener('resize', () => this.onResize());

    // Service Worker được đăng ký sớm từ index.html để cache tài nguyên trước khi cần offline.

    this.lastTime = performance.now();
    this.autoSaveBusy = false;
    this.lastAutoSaveAt = 0;
    // Tự động lưu mỗi 15 giây và khi người chơi chuyển tab/đóng Safari.
    this.autoSaveTimer = window.setInterval(() => this.saveAutomatically(), 15000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.saveAutomatically();
    });
    window.addEventListener('pagehide', () => this.saveAutomatically());
    // Khôi phục bản lưu gần nhất trước khi bắt đầu vòng lặp game.
    this.restoreAutomaticSave().finally(() => {
      this.ui.toast('Trỏ tâm ngắm vào bàn máy tính, cửa gỗ, ghế hoặc nhân viên để hiện nút tương tác!', 'success');
      this.loop();
    });
  }

  async restoreAutomaticSave() {
    try {
      const rec = await this.saveManager.loadSlot('autosave');
      if (rec && rec.data) {
        this.ui.cb.importSnapshot(rec.data);
        if (rec.data.npcs) this.npcSystem.spawnFromProfiles(this.state.npcs, this.state.clockHour);
        this.lastAutoSaveAt = Date.now();
        this.ui.toast(`Đã khôi phục dữ liệu tự động lưu (${rec.savedAt}).`, 'success');
      }
    } catch (err) {
      console.warn('Không thể khôi phục bản tự động lưu:', err);
    }
  }

  async saveAutomatically() {
    if (this.autoSaveBusy || !this.ui || !this.ui.cb) return;
    this.autoSaveBusy = true;
    try {
      const snapshot = this.ui.cb.exportSnapshot();
      const result = await this.saveManager.saveSlot('autosave', snapshot);
      if (result.ok) this.lastAutoSaveAt = Date.now();
      else console.warn('Tự động lưu thất bại:', result.error);
    } catch (err) {
      console.warn('Tự động lưu thất bại:', err);
    } finally {
      this.autoSaveBusy = false;
    }
  }

  applyQuality(level) {
    const dpr = window.devicePixelRatio || 1;
    const mobileCap = this.isMobileDevice ? 1.25 : 2.0;
    if (level === 'Low') {
      this.adaptivePixelRatio = Math.min(0.85, dpr);
      this.renderer.shadowMap.enabled = false;
    } else if (level === 'High') {
      this.adaptivePixelRatio = Math.min(this.isMobileDevice ? 1.25 : 2.0, dpr);
      this.renderer.shadowMap.enabled = !this.isMobileDevice;
    } else {
      this.adaptivePixelRatio = Math.min(this.isMobileDevice ? 1.0 : 1.5, dpr);
      this.renderer.shadowMap.enabled = !this.isMobileDevice;
    }
    this.renderer.setPixelRatio(Math.min(mobileCap, this.adaptivePixelRatio));
    this.onResize();
  }

  adaptPerformance(now) {
    if (now - this.lastAdaptiveCheck < 3000) return;
    this.lastAdaptiveCheck = now;
    if (this.currentFps < 27) this.lowFpsSamples++;
    else this.lowFpsSamples = Math.max(0, this.lowFpsSamples - 1);
    // Tự hạ độ phân giải khi thiết bị yếu/nóng; không đổi chất lượng do người chơi đã chọn trong menu.
    if (this.lowFpsSamples >= 2) {
      const next = Math.max(0.75, this.adaptivePixelRatio - 0.15);
      if (next < this.adaptivePixelRatio) {
        this.adaptivePixelRatio = next;
        this.renderer.setPixelRatio(next);
        this.onResize();
      }
      this.lowFpsSamples = 0;
    } else if (this.currentFps > 53 && this.adaptivePixelRatio < (this.isMobileDevice ? 1.15 : 1.5)) {
      this.adaptivePixelRatio = Math.min(this.isMobileDevice ? 1.15 : 1.5, this.adaptivePixelRatio + 0.05);
      this.renderer.setPixelRatio(this.adaptivePixelRatio);
      this.onResize();
    }
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  sitOnSeat(seat) {
    this.seatedSeat = seat;
    this.playerMesh.position.set(seat.x, 0.14, seat.z);
    this.tpCam.setSeated(true);
    this.tpCam.setLookDirection(seat.lookYaw, -0.08);
    this.audio.playClick();
    this.ui.toast(`Đã ngồi vào ${seat.label}. Kéo joystick để đứng dậy.`, 'info');
  }

  standUp(silent = false) {
    if (!this.seatedSeat) return;
    const safe = this.campus.resolveCollision(this.seatedSeat.standX, this.seatedSeat.standZ, 0.42);
    this.playerMesh.position.set(safe.x, 0.14, safe.z);
    this.seatedSeat = null;
    this.tpCam.setSeated(false);
    if (!silent) { this.audio.playClick(); this.ui.toast('Đã đứng dậy.', 'info'); }
  }

  teleportToRoom(roomKey) {
    this.standUp(true);
    const pt = this.campus.roomWaypoints[roomKey];
    if (pt) {
      const safe = this.campus.resolveCollision(pt.x, pt.z, 0.42);
      this.playerMesh.position.set(safe.x, 0.14, safe.z);
    }
  }

  enterMatchday() {
    this.ui.openMatchdayFlow();
  }

  // CHỈ HIỆN TƯƠNG TÁC KHI TÂM NGẮM TRỎ TRỰC TIẾP VÀO VẬT THỂ / CỬA GỖ / GHẾ / NPC
  detectAimedTarget() {
    this.raycaster.setFromCamera(this.centerNDC, this.camera);
    const targets = [...this.npcSystem.raycastMeshes, ...this.campus.raycastMeshes];
    const hits = this.raycaster.intersectObjects(targets, false);
    if (hits.length > 0) {
      const obj = hits[0].object;
      if (obj.userData.npcId) {
        const npc = this.npcSystem.getById(obj.userData.npcId);
        if (npc) return { type: 'npc', data: npc, prompt: `💬 ${npc.name} · ${npc.role} (${npc.dept})` };
      }
      if (obj.userData.interactId) {
        const meta = this.campus.interactables.get(obj.userData.interactId);
        if (meta) {
          if (meta.action === 'toggle_door' && meta.extra) {
            return { type: 'obj', data: meta, prompt: meta.extra.open ? '🚪 Đóng cửa gỗ' : '🚪 Mở cửa gỗ' };
          }
          return { type: 'obj', data: meta, prompt: `${meta.icon} ${meta.label}` };
        }
      }
    }
    if (this.seatedSeat) {
      return { type: 'stand', data: null, prompt: '🧍 Đứng dậy khỏi ghế' };
    }
    return null;
  }

  handleInteract() {
    if (this.mode !== 'campus') return;
    const t = this.aimedTarget;
    if (!t) return;
    this.audio.playClick();
    if (t.type === 'stand') { this.standUp(); return; }
    if (t.type === 'npc') {
      if (t.data.isPlayer) {
        const sq = this.state.getPsgSquad().find((p) => p.name === t.data.name);
        if (sq) { this.ui.openPlayerMeetingSelector(sq.id); return; }
      }
      this.ui.openNpcDialogue(t.data);
    } else {
      const act = t.data.action;
      if (act === 'toggle_door' && t.data.extra) {
        const isOpen = this.campus.toggleDoor(t.data.extra);
        this.audio.playDoor();
        this.ui.toast(isOpen ? 'Đã mở cửa gỗ.' : 'Đã đóng cửa gỗ.', 'info');
      } else if (act === 'sit_seat' && t.data.extra) this.sitOnSeat(t.data.extra);
      else if (act === 'open_computer') this.ui.openComputer('reports');
      else if (act === 'open_reports') this.ui.openComputer('reports');
      else if (act === 'open_history') this.ui.openComputer('history');
      else if (act === 'open_board_meeting') this.ui.openBoardMeeting();
      else if (act === 'open_medical') this.ui.openComputer('squad');
      else if (act === 'open_tactics' || act === 'open_formation') this.ui.openComputer('formation');
      else if (act === 'open_matchday') this.enterMatchday();
    }
  }

  updateCampus(dt) {
    // Đồng hồ trong game chạy thực tế (1 giờ game ~ 24 giây) để đội 1 tập theo lịch sáng/chiều & nghỉ giữa ca
    const prevDay = Math.floor(this.state.clockHour / 18);
    this.state.clockHour += dt * 0.042;
    if (this.state.clockHour >= 18.5) {
      this.state.clockHour = 8.0;
      this.state.dayNum++;
      const days = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
      this.state.dayName = days[(this.state.dayNum - 1) % 7];
      TaskAssignmentSystem.advanceTasks(this.state, 45);
      this.state.generateDailyBriefing();
      this.ui.toast(`🌅 Ngày mới (${this.state.dayName}) — Đã gửi Bản tin tình hình vào mục Báo cáo trên máy tính!`, 'info');
    }

    const inp = this.controls.getInputVector();
    if (inp.moving) {
      if (this.seatedSeat) this.standUp(true);
      const speed = this.controls.sprint ? 7.2 : 4.2;
      const forward = new THREE.Vector3(-Math.sin(this.tpCam.yaw), 0, -Math.cos(this.tpCam.yaw));
      const right = new THREE.Vector3(Math.cos(this.tpCam.yaw), 0, -Math.sin(this.tpCam.yaw));
      const moveDir = new THREE.Vector3().addScaledVector(right, inp.x).addScaledVector(forward, -inp.y);
      if (moveDir.lengthSq() > 0.001) {
        moveDir.normalize();
        const resolved = this.campus.resolveCollision(
          this.playerMesh.position.x + moveDir.x * speed * dt,
          this.playerMesh.position.z + moveDir.z * speed * dt,
          0.42
        );
        this.playerMesh.position.x = resolved.x;
        this.playerMesh.position.z = resolved.z;
        this.audio.playStep(this.controls.sprint);
      }
    }

    this.campus.updateDoors(dt, this.playerMesh.position, this.npcSystem.npcs);
    this.npcSystem.update(dt, this.playerMesh.position, this.state.clockHour, (msg) => this.ui.toast(msg, "info"));
    this.tpCam.update(this.playerMesh.position, dt);
    this.aimedTarget = this.detectAimedTarget();
  }

  loop() {
    requestAnimationFrame(() => this.loop());
    if (document.visibilityState === 'hidden') return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.fpsFrames++;
    if (now - this.fpsTime >= 500) {
      this.currentFps = Math.round((this.fpsFrames * 1000) / (now - this.fpsTime));
      this.fpsFrames = 0;
      this.fpsTime = now;
    }

    this.updateCampus(dt);
    this.adaptPerformance(now);
    this.renderer.render(this.campusSceneObj, this.camera);
    this.ui.updateTopHUD(this.currentFps, this.aimedTarget ? this.aimedTarget.prompt : null);
  }
}

window.addEventListener('load', () => {
  window.__PSG_GAME__ = new FootballPresidentGame3D();
});
