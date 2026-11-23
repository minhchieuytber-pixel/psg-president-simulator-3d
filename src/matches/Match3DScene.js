// src/matches/Match3DScene.js
// Tích hợp toàn diện 10 Hệ thống AI đặc biệt, chuỗi tình huống (phản công, sai lầm, phút cuối, đối đầu chiến thuật), Replay chuyển động thật & Khán giả InstancedMesh sống động
import {
  MatchState, MatchEvents, MatchStatistics, MomentumSystem,
  HomeAdvantageSystem, RivalrySystem, CoachAI, CrowdReactionSystem,
  CommentarySystem, ReplaySystem
} from './MatchSystems.js';

export class Match3DScene {
  constructor(texFactory, charFactory, animSystem, audio) {
    this.tex = texFactory;
    this.charFactory = charFactory;
    this.animSystem = animSystem;
    this.audio = audio;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b162a);
    this.scene.fog = new THREE.Fog(0x0b162a, 95, 220);

    this.cameraMode = 'broadcast';
    this.active = false;
    this.paused = false;
    this.speed = 1;

    this.players = [];
    this.benchHome = [];
    this.ball = null;
    this.ballVel = new THREE.Vector3();
    this.ballHeight = 0.28;
    this.ballVelY = 0;
    this.lastTouchHome = true;
    this.lastPasser = null;
    this.setPiece = null;
    this.crowdInst = null;
    this.crowdBaseY = [];
    this.crowdPhase = 0;
    this.replaySampleTimer = 0;

    this.state = null;
    this.events = null;
    this.stats = null;
    this.momentum = null;
    this.homeAdv = null;
    this.coachAI = null;
    this.crowd = null;
    this.commentary = null;
    this.replay = new ReplaySystem();

    this.onUpdateUI = null;
    this.onMatchEnd = null;
    this.goalScorers = [];

    this.buildStadium();
  }

  buildStadium() {
    this.scene.add(new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.85));
    const flood = new THREE.DirectionalLight(0xffffff, 1.15);
    flood.position.set(28, 48, 22);
    flood.castShadow = true;
    flood.shadow.mapSize.width = 1024;
    flood.shadow.mapSize.height = 1024;
    this.scene.add(flood);

    const pitch = new THREE.Mesh(
      new THREE.PlaneGeometry(68, 44),
      new THREE.MeshStandardMaterial({ map: this.tex.grassPitchTexture(true), roughness: 0.82 })
    );
    pitch.rotation.x = -Math.PI / 2;
    pitch.receiveShadow = true;
    this.scene.add(pitch);

    const apron = new THREE.Mesh(
      new THREE.PlaneGeometry(92, 66),
      new THREE.MeshStandardMaterial({ color: 0x0b2545, roughness: 0.85 })
    );
    apron.rotation.x = -Math.PI / 2;
    apron.position.y = -0.04;
    this.scene.add(apron);

    const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.4 });
    [-31.6, 31.6].forEach((gx) => {
      const g = new THREE.Group();
      const l = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8), postMat);
      l.position.set(0, 1.3, -3.7);
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8), postMat);
      r.position.set(0, 1.3, 3.7);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 7.5, 8), postMat);
      top.rotation.x = Math.PI / 2;
      top.position.set(0, 2.6, 0);
      const net = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 2.55, 7.3),
        new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.35 })
      );
      net.position.set(gx < 0 ? -0.9 : 0.9, 1.28, 0);
      g.add(l, r, top, net);
      g.position.set(gx, 0, 0);
      this.scene.add(g);
    });

    const standMat = new THREE.MeshStandardMaterial({ color: 0x0f2544, roughness: 0.7 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.3 });
    [
      { x: 0, z: -31, w: 80, d: 14, ry: 0 },
      { x: 0, z: 31, w: 80, d: 14, ry: Math.PI },
      { x: -43, z: 0, w: 54, d: 14, ry: Math.PI / 2 },
      { x: 43, z: 0, w: 54, d: 14, ry: -Math.PI / 2 }
    ].forEach((st) => {
      const base = new THREE.Mesh(new THREE.BoxGeometry(st.w, 12, st.d), standMat);
      base.position.set(st.x, 6, st.z);
      base.rotation.y = st.ry;
      this.scene.add(base);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(st.w + 2, 0.6, st.d + 4), roofMat);
      roof.position.set(st.x, 15.5, st.z);
      roof.rotation.y = st.ry;
      this.scene.add(roof);
    });

    const ledBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(58, 1.6),
      new THREE.MeshBasicMaterial({ map: this.tex.signTexture('PARC DES PRINCES · ICI C\'EST PARIS · LIGUE 1', '#00205b', '#ffffff', '#da291c') })
    );
    ledBoard.position.set(0, 1.1, -23.4);
    this.scene.add(ledBoard);

    // 420 Khán giả InstancedMesh có thể nhún nhảy / ăn mừng theo trạng thái CrowdReactionSystem
    const fanGeo = new THREE.BoxGeometry(0.45, 0.78, 0.45);
    const fanMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
    this.crowdInst = new THREE.InstancedMesh(fanGeo, fanMat, 420);
    const dummy = new THREE.Object3D();
    const fanColors = [new THREE.Color(0x00205b), new THREE.Color(0xda291c), new THREE.Color(0xf8fafc), new THREE.Color(0x38bdf8)];
    this.crowdBaseY = [];
    for (let i = 0; i < 420; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const row = Math.floor(i / 60);
      const fx = -34 + (i % 60) * 1.15;
      const fy = 2.4 + row * 1.35;
      const fz = side * (25.5 + row * 1.1);
      this.crowdBaseY.push({ x: fx, y: fy, z: fz });
      dummy.position.set(fx, fy, fz);
      dummy.updateMatrix();
      this.crowdInst.setMatrixAt(i, dummy.matrix);
      this.crowdInst.setColorAt(i, fanColors[i % fanColors.length]);
    }
    this.crowdInst.instanceColor.needsUpdate = true;
    this.scene.add(this.crowdInst);

    this.ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.32, metalness: 0.08 })
    );
    this.ball.position.set(0, 0.28, 0);
    this.ball.castShadow = true;
    this.scene.add(this.ball);
  }

  startMatch(fixture, homeClub, awayClub, psgSquad, h2hMap, onUpdateUI, onMatchEnd) {
    this.state = new MatchState(fixture, homeClub, awayClub);
    this.events = new MatchEvents();
    this.stats = new MatchStatistics();
    this.momentum = new MomentumSystem();
    this.homeAdv = new HomeAdvantageSystem(homeClub, fixture.comp);
    this.coachAI = new CoachAI(homeClub.manager, awayClub.manager);
    this.crowd = new CrowdReactionSystem();
    this.commentary = new CommentarySystem();
    this.replay = new ReplaySystem();

    this.onUpdateUI = onUpdateUI;
    this.onMatchEnd = onMatchEnd;
    this.active = true;
    this.paused = false;
    this.speed = 1;
    this.setPiece = null;
    this.goalScorers = [];
    this.ballHeight = 0.28;
    this.ballVelY = 0;
    this.lastPasser = null;

    // Tin trước trận từ Lịch sử đối đầu (RivalrySystem)
    const h2h = RivalrySystem.getRecord(h2hMap || {}, homeClub.name, awayClub.name);
    const h2hText = h2h.matches > 0
      ? `Lịch sử đối đầu (${h2h.matches} trận): ${homeClub.name} thắng ${h2h.homeWins}, hòa ${h2h.draws}, thua ${h2h.awayWins}.`
      : `Lần chạm trán đầu tiên giữa ${homeClub.name} và ${awayClub.name} trong triều đại Chủ tịch Phạm Minh Chiêu!`;
    this.commentary.lines.unshift(`🏟️ 0' — Khai cuộc tại ${this.homeAdv.stadium} (${this.homeAdv.attendancePct}% sức chứa)! ${h2hText}`);

    this.players.forEach((p) => this.scene.remove(p.mesh));
    this.players = [];

    const psgIsHome = homeClub.name === 'Paris Saint-Germain';
    this.benchHome = psgSquad.slice(11, 18);

    const homeForm = [
      [-29,0,'GK'],[-19,-13,'LB'],[-20,-4.5,'CB'],[-20,4.5,'CB'],[-19,13,'RB'],
      [-9,-10,'CM'],[-11,0,'DM'],[-9,10,'CM'],[7,-11,'LW'],[12,0,'ST'],[7,11,'RW']
    ];
    const awayForm = [
      [29,0,'GK'],[19,13,'LB'],[20,4.5,'CB'],[20,-4.5,'CB'],[19,-13,'RB'],
      [9,10,'CM'],[11,0,'DM'],[9,-10,'CM'],[-7,11,'LW'],[-12,0,'ST'],[-7,-11,'RW']
    ];

    const spawnTeam = (isHome, form, club) => {
      const isPsg = club.name === 'Paris Saint-Germain';
      const shirtCol = isPsg ? 0x00205b : (club.color === 0x00205b ? 0xef4444 : club.color);
      form.forEach(([fx, fz, role], idx) => {
        const sq = isPsg && psgSquad[idx] ? psgSquad[idx] : null;
        const mesh = this.charFactory.createHumanoid({
          outfit: idx === 0 ? 'player_away' : (isPsg ? 'player_home' : 'player_away'),
          jerseyColor: idx === 0 ? (isHome ? 0xfacc15 : 0x22c55e) : shirtCol,
          skinTone: this.charFactory.skinTones[idx % 5],
          hairColor: this.charFactory.hairColors[idx % 6],
          hairStyle: idx % 3,
          heightScale: 0.94
        });
        mesh.position.set(fx, 0, fz);
        this.scene.add(mesh);
        this.players.push({
          mesh, isHome, isGK: idx === 0, role,
          id: sq ? sq.id : `${isHome ? 'h' : 'a'}_${idx}`,
          name: sq ? sq.name : `${club.name.split(' ')[0]} #${idx + 1}`,
          age: sq ? sq.age : 24 + (idx % 7),
          rating: sq ? sq.ovr : club.rating,
          tech: sq ? sq.tech : club.rating,
          phys: sq ? sq.phys : club.rating,
          homePos: new THREE.Vector3(fx, 0, fz),
          stamina: 100,
          formRating: 6.4, // Phong độ trong trận (4.8 - 9.8)
          confidence: 0.0, // -0.2 đến +0.25
          goals: 0, assists: 0, saves: 0,
          action: null, actionTimer: 0, cooldown: 0
        });
      });
    };

    spawnTeam(true, homeForm, homeClub);
    spawnTeam(false, awayForm, awayClub);

    const refMesh = this.charFactory.createHumanoid({ outfit: 'security', heightScale: 0.92 });
    refMesh.position.set(0, 0, 8);
    this.scene.add(refMesh);
    this.players.push({ mesh: refMesh, isRef: true, homePos: new THREE.Vector3(0, 0, 8), rating: 80, stamina: 100, action: null, actionTimer: 0, cooldown: 0 });

    this.ball.position.set(0, 0.28, 0);
    this.ballVel.set(5.5, 0, 1.8);
    this.audio.playWhistle();
    if (this.onUpdateUI) this.onUpdateUI(this.getHUDState());
  }

  // 7. Hệ thống Cầu thủ dự bị tạo đột biến (Impact Sub)
  makeImpactSub(isHome = true) {
    if (!this.state || this.state.finished) return null;
    if (isHome && (this.state.homeSubsUsed >= 5 || this.benchHome.length === 0)) return null;
    const teamPlayers = this.players.filter((p) => !p.isRef && !p.isGK && p.isHome === isHome);
    // Chọn cầu thủ mệt nhất trên sân ra nghỉ
    teamPlayers.sort((a, b) => a.stamina - b.stamina);
    const outP = teamPlayers[0];
    if (!outP) return null;

    let inName = `${isHome ? this.state.homeClub.name.split(' ')[0] : this.state.awayClub.name.split(' ')[0]} Dự bị #${12 + this.state.awaySubsUsed}`;
    let inRating = (isHome ? this.state.homeClub.rating : this.state.awayClub.rating) + 1;
    if (isHome && this.benchHome.length > 0) {
      const subData = this.benchHome.shift();
      inName = subData.name;
      inRating = subData.ovr;
      this.state.homeSubsUsed++;
    } else {
      this.state.awaySubsUsed++;
    }

    const oldName = outP.name;
    outP.name = inName;
    outP.rating = inRating;
    outP.stamina = 100;
    outP.confidence = 0.14; // Cầu thủ dự bị vào sân sung mãn & tạo đột biến tốc độ!
    outP.formRating = 6.7;
    const teamName = isHome ? this.state.homeClub.name : this.state.awayClub.name;
    const evt = this.events.emit('sub', this.state.minute, isHome ? 'home' : 'away', { team: teamName, inPlayer: inName, outPlayer: oldName });
    this.commentary.addFromEvent(evt);
    this.momentum.shift(isHome, 4);
    if (this.onUpdateUI) this.onUpdateUI(this.getHUDState());
    return { inName, oldName };
  }

  getHUDState() {
    const s = this.state;
    return {
      minute: Math.floor(s.minute),
      homeName: s.homeClub.name,
      awayName: s.awayClub.name,
      homeGoals: s.homeGoals,
      awayGoals: s.awayGoals,
      possessionHome: s.getPossessionHome(),
      shotsHome: this.stats.home.shots,
      shotsAway: this.stats.away.shots,
      xGHome: this.stats.home.xG.toFixed(2),
      xGAway: this.stats.away.xG.toFixed(2),
      momentumHome: Math.round(this.momentum.home),
      crowdMood: this.crowd.mood,
      comp: s.fixture.comp,
      round: s.fixture.round,
      cameraMode: this.cameraMode,
      tactic: s.homeTactic,
      paused: this.paused,
      finished: s.finished,
      replayActive: this.replay.playing,
      replayCount: this.replay.clips.length,
      subsLeft: Math.max(0, 5 - s.homeSubsUsed),
      commentary: this.commentary.lines.slice(0, 6),
      stats: this.stats,
      coachLog: this.coachAI.duelLog.slice(0, 6),
      topRatings: this.players.filter((p) => !p.isRef && p.isHome).sort((a, b) => b.formRating - a.formRating).slice(0, 5)
    };
  }

  setCameraMode(mode) { this.cameraMode = mode; if (this.onUpdateUI) this.onUpdateUI(this.getHUDState()); }

  setTactic(tactic) {
    if (!this.state) return;
    this.state.homeTactic = tactic;
    const label = tactic === 'attacking' ? 'Tấn công tổng lực' : tactic === 'defensive' ? 'Phòng ngự phản công' : 'Cân bằng kiểm soát bóng';
    this.commentary.lines.unshift(`📋 ${Math.floor(this.state.minute)}' — Chỉ đạo chiến thuật: ${label}.`);
    if (this.onUpdateUI) this.onUpdateUI(this.getHUDState());
  }

  startReplay(speed = 0.45, angle = 'behind_goal') {
    const ok = this.replay.startPlayback(0, speed, angle);
    if (ok && this.onUpdateUI) this.onUpdateUI(this.getHUDState());
    return ok;
  }

  stopReplay() {
    this.replay.stop();
    if (this.onUpdateUI) this.onUpdateUI(this.getHUDState());
  }

  separatePlayers() {
    const minDist = 1.25;
    const minDistSq = minDist * minDist;
    for (let i = 0; i < this.players.length; i++) {
      const a = this.players[i].mesh.position;
      for (let j = i + 1; j < this.players.length; j++) {
        const b = this.players[j].mesh.position;
        const dx = b.x - a.x, dz = b.z - a.z;
        const dSq = dx * dx + dz * dz;
        if (dSq < minDistSq) {
          const d = Math.sqrt(dSq) || 0.01;
          const ov = (minDist - d) * 0.5;
          a.x = Math.max(-31.5, Math.min(31.5, a.x - (dx / d) * ov));
          a.z = Math.max(-21.2, Math.min(21.2, a.z - (dz / d) * ov));
          b.x = Math.max(-31.5, Math.min(31.5, b.x + (dx / d) * ov));
          b.z = Math.max(-21.2, Math.min(21.2, b.z + (dz / d) * ov));
        }
      }
    }
  }

  triggerSetPiece(type, isHome, x, z) {
    const candidates = this.players.filter((p) => !p.isRef && !p.isGK && p.isHome === isHome);
    let taker = candidates[0], bestD = 999;
    for (const c of candidates) {
      const d = Math.hypot(c.mesh.position.x - x, c.mesh.position.z - z);
      if (d < bestD) { bestD = d; taker = c; }
    }
    this.ball.position.set(x, type === 'throw_in' ? 1.85 : 0.28, z);
    this.ballHeight = type === 'throw_in' ? 1.85 : 0.28;
    this.ballVel.set(0, 0, 0);
    this.ballVelY = 0;
    this.setPiece = { type, isHome, taker, timer: 1.25, pos: new THREE.Vector3(x, 0, z) };
    if (type === 'corner') this.stats.side(isHome).corners++;
    if (type === 'throw_in') this.stats.side(isHome).throwIns++;
    const teamName = isHome ? this.state.homeClub.name : this.state.awayClub.name;
    const text = type === 'throw_in' ? `🙌 ${Math.floor(this.state.minute)}' — Ném biên cho ${teamName} (${taker.name}).` :
                 type === 'corner' ? `🚩 ${Math.floor(this.state.minute)}' — Phạt góc nguy hiểm cho ${teamName} (${taker.name} treo bóng)!` :
                 `🧤 ${Math.floor(this.state.minute)}' — Phát bóng lên cho ${teamName}.`;
    this.commentary.addFromEvent(this.events.emit('set_piece', this.state.minute, isHome ? 'home' : 'away', { text }));
  }

  animateCrowd(dt) {
    if (!this.crowdInst || !this.crowd) return;
    this.crowdPhase += dt * (4 + this.crowd.energy * 9);
    const amp = this.crowd.mood === 'Ăn mừng' ? 0.55 : this.crowd.mood === 'Hưng phấn' ? 0.34 : this.crowd.mood === 'Cổ vũ' ? 0.16 : 0.04;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < this.crowdBaseY.length; i++) {
      const b = this.crowdBaseY[i];
      const jump = Math.max(0, Math.sin(this.crowdPhase + (i % 12) * 0.6)) * amp;
      dummy.position.set(b.x, b.y + jump, b.z);
      dummy.updateMatrix();
      this.crowdInst.setMatrixAt(i, dummy.matrix);
    }
    this.crowdInst.instanceMatrix.needsUpdate = true;
  }

  update(dt, camera) {
    if (!this.active || !this.state) return;

    // Nếu đang phát Replay tình huống thật -> chiếu lại chính xác chuyển động 3D đã ghi
    if (this.replay.playing) {
      const stillPlaying = this.replay.step(dt, this.ball, this.players, camera);
      if (!stillPlaying && this.onUpdateUI) this.onUpdateUI(this.getHUDState());
      return;
    }

    this.animateCrowd(dt);

    if (!this.paused && !this.state.finished) {
      const simDt = dt * this.speed;
      this.state.minute += simDt * 1.75;
      const min = this.state.minute;

      this.momentum.decay(simDt);
      this.crowd.update(simDt, this.state.homeGoals - this.state.awayGoals, min);

      // Ghi khung hình thật cho hệ thống Replay (20Hz)
      this.replaySampleTimer += dt;
      if (this.replaySampleTimer >= 0.05) {
        this.replaySampleTimer = 0;
        this.replay.captureFrame(this.ball.position, this.players);
      }

      // Đấu trí giữa 2 HLV & Tự động thay người dự bị tạo đột biến ở phút 62 và 76
      const coachActions = this.coachAI.evaluate(this.state, this.momentum, this.stats);
      coachActions.forEach((a) => this.commentary.addFromEvent(this.events.emit(a.type, min, a.side, { text: a.text })));
      if (min > 62 && this.state.awaySubsUsed === 0) this.makeImpactSub(false);
      if (min > 72 && this.state.homeSubsUsed === 0) this.makeImpactSub(true);

      if (min >= 45 && !this.state.halftimeTriggered) {
        this.state.halftimeTriggered = true;
        this.commentary.lines.unshift(`⏸️ 45' — Hết hiệp 1! ${this.state.homeClub.name} ${this.state.homeGoals} - ${this.state.awayGoals} ${this.state.awayClub.name} (xG: ${this.stats.home.xG.toFixed(2)} - ${this.stats.away.xG.toFixed(2)}).`);
        this.audio.playWhistle();
      }
      if (min >= 90) {
        this.state.minute = 90;
        this.state.finished = true;
        this.audio.playWhistle();
        this.commentary.lines.unshift(`🏁 90' — HẾT GIỜ! ${this.state.homeClub.name} ${this.state.homeGoals} - ${this.state.awayGoals} ${this.state.awayClub.name}.`);
        if (this.onUpdateUI) this.onUpdateUI(this.getHUDState());
        if (this.onMatchEnd) {
          this.onMatchEnd({
            homeGoals: this.state.homeGoals,
            awayGoals: this.state.awayGoals,
            fixture: this.state.fixture,
            scorers: this.goalScorers,
            stats: this.stats,
            playerRatings: this.players.filter((p) => !p.isRef).map((p) => ({ id: p.id, name: p.name, isHome: p.isHome, rating: +p.formRating.toFixed(1), goals: p.goals }))
          });
        }
        return;
      }

      if (this.setPiece) {
        const sp = this.setPiece;
        sp.timer -= simDt;
        const tk = sp.taker;
        tk.mesh.position.lerp(new THREE.Vector3(sp.pos.x, 0, sp.pos.z + (sp.pos.z > 0 ? 0.6 : -0.6)), Math.min(1, simDt * 7));
        tk.mesh.rotation.y = Math.atan2(-sp.pos.x, -sp.pos.z);
        this.animSystem.updateRig(tk.mesh, sp.type === 'throw_in' ? 'throw_in' : 'kick', simDt);
        if (sp.timer <= 0) {
          const dirX = sp.isHome ? 1 : -1;
          if (sp.type === 'throw_in') {
            this.ballHeight = 1.4; this.ballVelY = 2.2;
            this.ballVel.set(dirX * 9 + (Math.random() - 0.5) * 4, 0, -Math.sign(sp.pos.z) * 11);
          } else if (sp.type === 'corner') {
            this.ballHeight = 0.4; this.ballVelY = 6.2;
            this.ballVel.set(-Math.sign(sp.pos.x) * 11, 0, -Math.sign(sp.pos.z) * 15);
          } else {
            this.ballHeight = 0.35; this.ballVelY = 5.4;
            this.ballVel.set(dirX * 19, 0, (Math.random() - 0.5) * 9);
          }
          this.setPiece = null;
        }
      } else {
        // Vật lý bóng 3D thực (có trọng lực & độ nảy)
        this.ball.position.x += this.ballVel.x * simDt;
        this.ball.position.z += this.ballVel.z * simDt;
        this.ballVel.multiplyScalar(Math.pow(0.42, simDt));
        this.ballVelY -= 16 * simDt;
        this.ballHeight += this.ballVelY * simDt;
        if (this.ballHeight < 0.28) {
          this.ballHeight = 0.28;
          this.ballVelY = Math.abs(this.ballVelY) > 1.2 ? -this.ballVelY * 0.48 : 0;
        }
        this.ball.position.y = this.ballHeight;

        // Biên dọc -> Ném biên
        if (Math.abs(this.ball.position.z) > 20.6) {
          this.triggerSetPiece('throw_in', !this.lastTouchHome, Math.max(-28, Math.min(28, this.ball.position.x)), Math.sign(this.ball.position.z) * 20.4);
        } else if (Math.abs(this.ball.position.x) > 31.3) {
          if (Math.abs(this.ball.position.z) < 3.6 && this.ballHeight < 2.6) {
            const homeScored = this.ball.position.x > 0;
            // Kiểm tra thủ môn cứu thua hoặc dội xà ngang
            const keeper = this.players.find((p) => p.isGK && p.isHome !== homeScored);
            const keeperDist = keeper ? Math.abs(keeper.mesh.position.z - this.ball.position.z) : 5;
            const saveChance = keeper ? Math.max(0.12, Math.min(0.68, (keeper.rating / 115) * (1 - keeperDist / 4.2))) : 0.2;

            if (this.ballHeight > 2.25 && Math.random() < 0.4) {
              // XÀ NGANG!
              this.ballVel.x *= -0.65;
              this.ballVelY = 3.5;
              const shooter = this.lastPasser?.name || 'Tiền đạo';
              this.crowd.react('crossbar', homeScored, this.state.homeGoals - this.state.awayGoals, min);
              this.commentary.addFromEvent(this.events.emit('crossbar', min, homeScored ? 'home' : 'away', { shooter }));
              this.replay.saveClip(`Dội xà ngang (${shooter})`, min);
            } else if (keeper && Math.random() < saveChance) {
              // THỦ MÔN CỨU THUA!
              this.stats.side(!homeScored).saves++;
              keeper.saves++;
              keeper.formRating = Math.min(9.8, keeper.formRating + 0.45);
              this.momentum.shift(!homeScored, 6);
              this.crowd.react('save', !homeScored, this.state.homeGoals - this.state.awayGoals, min);
              this.commentary.addFromEvent(this.events.emit('save', min, !homeScored ? 'home' : 'away', {
                keeper: keeper.name, shooter: this.lastPasser?.name || 'Tiền đạo',
                team: !homeScored ? this.state.homeClub.name : this.state.awayClub.name
              }));
              this.replay.saveClip(`Cứu thua (${keeper.name})`, min);
              this.ballVel.set((homeScored ? -1 : 1) * 10, 0, (Math.random() - 0.5) * 12);
            } else {
              // VÀOOO!
              if (homeScored) this.state.homeGoals++; else this.state.awayGoals++;
              const scorer = this.lastPasser && this.lastPasser.isHome === homeScored
                ? this.lastPasser
                : this.players.find((p) => !p.isRef && !p.isGK && p.isHome === homeScored && Math.abs(p.homePos.x) > 5);
              if (scorer) {
                scorer.goals++;
                scorer.formRating = Math.min(9.9, scorer.formRating + 1.1);
                scorer.confidence = Math.min(0.25, scorer.confidence + 0.12);
                this.goalScorers.push(`${scorer.name} (${Math.floor(min)}')`);
              }
              this.momentum.shift(homeScored, 14);
              this.crowd.react('goal', homeScored, this.state.homeGoals - this.state.awayGoals, min);
              const scoreStr = `${this.state.homeGoals}-${this.state.awayGoals}`;
              const evt = this.events.emit('goal', min, homeScored ? 'home' : 'away', {
                scorer: scorer ? scorer.name : 'Tiền đạo',
                team: homeScored ? this.state.homeClub.name : this.state.awayClub.name,
                score: scoreStr,
                xG: (0.28 + Math.random() * 0.35).toFixed(2)
              });
              this.commentary.addFromEvent(evt);
              this.replay.saveClip(`Bàn thắng ${scorer ? scorer.name : ''} (${scoreStr})`, min);
              this.audio.playGoal();
              this.ball.position.set(0, 0.28, 0);
              this.ballHeight = 0.28; this.ballVelY = 0;
              this.ballVel.set((homeScored ? -1 : 1) * 5, 0, (Math.random() - 0.5) * 4);
            }
          } else {
            const atRightEnd = this.ball.position.x > 0;
            const corner = (atRightEnd && !this.lastTouchHome) || (!atRightEnd && this.lastTouchHome);
            if (corner) this.triggerSetPiece('corner', atRightEnd, atRightEnd ? 30.8 : -30.8, Math.sign(this.ball.position.z) * 19.6);
            else this.triggerSetPiece('goal_kick', !atRightEnd, atRightEnd ? 28.5 : -28.5, 0);
          }
        }
      }

      // Tính 1 cầu thủ gần bóng nhất mỗi đội
      const findChaser = (isHome) => {
        let best = null, bestD = 999;
        for (const p of this.players) {
          if (p.isRef || p.isGK || p.isHome !== isHome) continue;
          const d = p.mesh.position.distanceTo(this.ball.position);
          if (d < bestD) { bestD = d; best = p; }
        }
        return best;
      };
      const homeChaser = findChaser(true);
      const awayChaser = findChaser(false);

      const homeMod = this.momentum.getBehaviorModifiers(true, this.state.homeGoals - this.state.awayGoals, min);
      const awayMod = this.momentum.getBehaviorModifiers(false, this.state.awayGoals - this.state.homeGoals, min);

      for (const p of this.players) {
        if (p.actionTimer > 0) p.actionTimer -= simDt;
        if (p.cooldown > 0) p.cooldown -= simDt;

        if (p.isRef) {
          p.mesh.position.x += (this.ball.position.x * 0.62 - p.mesh.position.x) * simDt * 1.8;
          p.mesh.position.z += (this.ball.position.z * 0.62 + 5.5 - p.mesh.position.z) * simDt * 1.8;
          this.animSystem.updateRig(p.mesh, 'walk', simDt);
          continue;
        }
        if (this.setPiece && p === this.setPiece.taker) continue;

        const mod = p.isHome ? homeMod : awayMod;
        const tactic = p.isHome ? this.state.homeTactic : this.state.awayTactic;
        const attackDir = p.isHome ? 1 : -1;
        const tacticShift = (tactic === 'attacking' ? 5.5 : tactic === 'defensive' ? -5.0 : 0) + mod.linePush;

        // Kịch tính cuối trận: Trung vệ lên tham gia không chiến khi đang bị dẫn!
        let extraPush = (mod.cbJoinAttack && p.role === 'CB') ? 22 * attackDir : 0;
        let tx = p.homePos.x + this.ball.position.x * (p.isGK ? 0.06 : 0.40) + tacticShift * attackDir + extraPush;
        let tz = p.homePos.z + this.ball.position.z * (p.isGK ? 0.22 : 0.34);

        if (!this.setPiece && (p === homeChaser || p === awayChaser)) {
          tx = this.ball.position.x;
          tz = this.ball.position.z;
        }
        if (p.isGK) {
          tx = p.isHome ? -30.2 : 30.2;
          tz = Math.max(-3.3, Math.min(3.3, this.ball.position.z * 0.45));
        }

        const dx = tx - p.mesh.position.x, dz = tz - p.mesh.position.z;
        const d = Math.hypot(dx, dz);
        // Thể lực ảnh hưởng tốc độ chạy thực tế
        const staminaFactor = 0.72 + (p.stamina / 100) * 0.28;
        const maxSpd = (p.isGK ? 5.6 : 7.4 + (p.rating - 75) * 0.14) * staminaFactor * mod.tempo;

        if (d > 0.25) {
          const moved = Math.min(d, maxSpd * simDt);
          p.mesh.position.x += (dx / d) * moved;
          p.mesh.position.z += (dz / d) * moved;
          p.mesh.rotation.y = Math.atan2(dx, dz);
          p.stamina = Math.max(25, p.stamina - moved * 0.065);
          this.stats.side(p.isHome).distanceKm = +(this.stats.side(p.isHome).distanceKm + moved / 1000).toFixed(2);
          const spdKmh = +(maxSpd * 3.6).toFixed(1);
          if (spdKmh > this.stats.side(p.isHome).topSpeedKmh) this.stats.side(p.isHome).topSpeedKmh = spdKmh;
        }

        const animState = p.actionTimer > 0 && p.action ? p.action : (d > 2.2 ? 'run' : d > 0.3 ? 'walk' : 'idle');
        this.animSystem.updateRig(p.mesh, animState, simDt);

        const distBall = p.mesh.position.distanceTo(this.ball.position);
        if (!this.setPiece && distBall < 1.25 && p.cooldown <= 0 && this.ballVel.length() < 16) {
          p.cooldown = 0.55;
          const opposingTouch = this.lastTouchHome !== p.isHome;
          const prevOwner = this.lastPasser;
          this.lastTouchHome = p.isHome;
          if (p.isHome) this.state.possessionTicksHome++; else this.state.possessionTicksAway++;

          // Ghi nhận vùng tấn công cho TacticalAI
          const zones = p.isHome ? this.state.homeAttackZones : this.state.awayAttackZones;
          if (p.mesh.position.z < -7) zones.left++;
          else if (p.mesh.position.z > 7) zones.right++;
          else zones.center++;

          // Chạm bóng trong vòng cấm
          const goalX = p.isHome ? 32 : -32;
          const distGoal = Math.abs(goalX - p.mesh.position.x);
          if (distGoal < 12 && Math.abs(p.mesh.position.z) < 9) this.stats.side(p.isHome).boxTouches++;

          const composure = this.homeAdv.getComposureFactor(p.isHome, p.age, this.crowd.energy);
          const effectiveSkill = (p.rating / 100 + p.confidence) * composure;

          // Chuỗi tình huống: Sai lầm phòng ngự dưới áp lực pressing (xác suất nhỏ có kiểm soát)
          if ((p.isGK || p.role === 'CB') && distGoal > 42 && Math.random() < 0.035 && this.events.canEmit('error', min, 12)) {
            this.stats.side(p.isHome).errorsToChance++;
            p.formRating = Math.max(4.8, p.formRating - 0.5);
            this.crowd.react('error', p.isHome, this.state.homeGoals - this.state.awayGoals, min);
            this.commentary.addFromEvent(this.events.emit('error', min, p.isHome ? 'home' : 'away', { player: p.name }));
            this.ballVel.set(attackDir * 5, 0, (Math.random() - 0.5) * 4);
            this.lastPasser = p;
            continue;
          }

          if (opposingTouch && Math.random() < 0.42) {
            // TẮC BÓNG / ĐÁNH CHẶN & ĐỐI ĐẦU CÁ NHÂN
            p.action = 'tackle'; p.actionTimer = 0.55;
            this.stats.side(p.isHome).recoveries++;
            this.stats.side(p.isHome).duelsWon++;
            this.stats.side(p.isHome).interceptions++;
            if (p.mesh.position.x * attackDir > 0) this.stats.side(p.isHome).pressingSuccess++;
            p.formRating = Math.min(9.5, p.formRating + 0.16);
            this.momentum.shift(p.isHome, 2.5);
            if (prevOwner) this.state.recordDuel(p.name, prevOwner.name, 'tackle');

            if (this.events.canEmit('tackle', min, 7)) {
              this.commentary.addFromEvent(this.events.emit('tackle', min, p.isHome ? 'home' : 'away', {
                player: p.name, victim: prevOwner ? prevOwner.name : 'đối thủ'
              }));
            }
            // Nếu cướp bóng giữa sân -> châm ngòi PHẢN CÔNG NHANH!
            const fw = this.players.find((m) => !m.isRef && !m.isGK && m.isHome === p.isHome && ['ST', 'LW', 'RW'].includes(m.role));
            if (fw && Math.random() < 0.45 && this.events.canEmit('counter', min, 9)) {
              this.stats.side(p.isHome).throughBalls++;
              const pv = new THREE.Vector3(fw.mesh.position.x - p.mesh.position.x, 0, fw.mesh.position.z - p.mesh.position.z).normalize();
              this.ballVel.copy(pv.multiplyScalar(18));
              this.ballVelY = 3.2;
              this.commentary.addFromEvent(this.events.emit('counter', min, p.isHome ? 'home' : 'away', {
                passer: p.name, runner: fw.name, team: p.isHome ? this.state.homeClub.name : this.state.awayClub.name,
                flank: fw.mesh.position.z < 0 ? 'trái' : 'phải'
              }));
            } else {
              this.ballVel.set(attackDir * 12, 0, (Math.random() - 0.5) * 10);
            }
            this.lastPasser = p;
          } else if (!p.isGK && distGoal < 21 && Math.random() < (0.30 + effectiveSkill * 0.22) * mod.riskTaking) {
            // SÚT BÓNG (tính xG thực tế!)
            p.action = 'kick'; p.actionTimer = 0.48;
            const isBig = distGoal < 13 && Math.abs(p.mesh.position.z) < 7;
            const angleF = Math.max(0.45, 1 - Math.abs(p.mesh.position.z) / 18);
            const aimSpread = Math.max(4.5, 9.2 - effectiveSkill * 3.8);
            const aimZ = (Math.random() - 0.5) * aimSpread;
            const onTarget = Math.abs(aimZ) < 3.6;
            this.stats.recordShot(p.isHome, distGoal, angleF, isBig, onTarget, false, !!prevOwner && prevOwner.isHome === p.isHome);
            if (isBig) this.crowd.react('big_chance', p.isHome, this.state.homeGoals - this.state.awayGoals, min);

            const sVec = new THREE.Vector3(goalX - p.mesh.position.x, 0, aimZ - p.mesh.position.z).normalize();
            this.ballVel.copy(sVec.multiplyScalar(20 + Math.random() * 6));
            this.ballVelY = 1.8 + Math.random() * 2.8;
            this.lastPasser = p;
          } else {
            // CHUYỀN BÓNG / QUA NGƯỜI (có kiểm tra đối đầu cá nhân — nếu thua kèo nhiều thì chuyền sớm)
            p.action = 'pass'; p.actionTimer = 0.36;
            if (Math.random() < 0.25) {
              this.stats.side(p.isHome).dribblesWon++;
              this.stats.side(!p.isHome).dribbledPast++;
            }
            p.formRating = Math.min(9.5, p.formRating + 0.04);
            const focusFlank = p.isHome ? this.state.homeFocusFlank : this.state.awayFocusFlank;
            const mates = this.players.filter((m) => !m.isRef && !m.isGK && m !== p && m.isHome === p.isHome && (m.mesh.position.x - p.mesh.position.x) * attackDir > 1);
            if (mates.length > 0) {
              // Ưu tiên chuyền theo hướng chiến thuật HLV đã điều chỉnh
              const preferred = mates.find((m) => (focusFlank === 'center' && Math.abs(m.mesh.position.z) < 7) || (focusFlank === 'right' && m.mesh.position.z > 5)) || mates[Math.floor(Math.random() * mates.length)];
              const pVec = new THREE.Vector3(preferred.mesh.position.x - p.mesh.position.x, 0, preferred.mesh.position.z - p.mesh.position.z).normalize();
              this.ballVel.copy(pVec.multiplyScalar(14 + Math.random() * 4.5));
              if (Math.abs(preferred.mesh.position.x - p.mesh.position.x) > 10) this.stats.side(p.isHome).throughBalls++;
            } else {
              this.ballVel.set(attackDir * 12, 0, (Math.random() - 0.5) * 12);
            }
            this.lastPasser = p;
          }
        }
      }

      this.separatePlayers();

      if (Math.random() < simDt * 2.5 && this.onUpdateUI) {
        this.onUpdateUI(this.getHUDState());
      }
    }

    const bx = this.ball.position.x, bz = this.ball.position.z;
    const targetCam = new THREE.Vector3();
    const lookPt = new THREE.Vector3(bx * 0.75, 1.0, bz * 0.55);

    if (this.cameraMode === 'broadcast') targetCam.set(bx * 0.55, 18, 30);
    else if (this.cameraMode === 'wide') { targetCam.set(0, 29, 44); lookPt.set(0, 0, 0); }
    else if (this.cameraMode === 'tactical') { targetCam.set(bx * 0.2, 46, 8); lookPt.set(bx * 0.2, 0, 0); }
    else if (this.cameraMode === 'player') { targetCam.set(bx - 9, 5.2, bz + 9); lookPt.set(bx, 1.2, bz); }
    else { targetCam.set(0, 12.5, 29.5); lookPt.set(bx * 0.65, 1.0, bz * 0.45); }

    camera.position.lerp(targetCam, Math.min(1, dt * 4.5));
    camera.lookAt(lookPt);
  }
}
