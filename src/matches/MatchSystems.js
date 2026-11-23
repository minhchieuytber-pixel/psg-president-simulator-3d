// src/matches/MatchSystems.js
// 10 Hệ thống AI đặc biệt, Thống kê nâng cao (xG/xA/...), Bình luận tiếng Việt ngữ cảnh, Khán giả, Đấu trí HLV, Lịch sử đối đầu & Replay

export class MatchState {
  constructor(fixture, homeClub, awayClub) {
    this.fixture = fixture;
    this.homeClub = homeClub;
    this.awayClub = awayClub;
    this.minute = 0;
    this.homeGoals = 0;
    this.awayGoals = 0;
    this.possessionTicksHome = 50;
    this.possessionTicksAway = 50;
    this.homeTactic = 'balanced'; // attacking | balanced | defensive | high_press
    this.awayTactic = 'balanced';
    this.homeFocusFlank = 'center'; // left | center | right
    this.awayFocusFlank = 'center';
    this.homeSubsUsed = 0;
    this.awaySubsUsed = 0;
    this.homeAttackZones = { left: 0, center: 0, right: 0 };
    this.awayAttackZones = { left: 0, center: 0, right: 0 };
    this.duels = new Map(); // "pA_pB" -> { winsA, winsB, dribblesA, fouls }
    this.halftimeTriggered = false;
    this.finished = false;
    this.varChecking = false;
  }

  getPossessionHome() {
    const tot = this.possessionTicksHome + this.possessionTicksAway;
    return tot > 0 ? Math.round((this.possessionTicksHome / tot) * 100) : 50;
  }

  recordDuel(winnerName, loserName, type = 'duel') {
    const key = [winnerName, loserName].sort().join('__');
    if (!this.duels.has(key)) this.duels.set(key, { a: winnerName, b: loserName, wins: {}, total: 0 });
    const d = this.duels.get(key);
    d.wins[winnerName] = (d.wins[winnerName] || 0) + 1;
    d.total++;
    return d.wins[winnerName];
  }

  getDuelLosses(playerName, oppName) {
    const key = [playerName, oppName].sort().join('__');
    const d = this.duels.get(key);
    if (!d) return 0;
    return d.wins[oppName] || 0;
  }
}

export class MatchEvents {
  constructor() {
    this.list = [];
    this.lastEventTime = {};
  }

  emit(type, minute, teamSide, data = {}) {
    const evt = { id: `me_${this.list.length + 1}`, type, minute: Math.floor(minute), teamSide, ...data };
    this.list.unshift(evt);
    this.lastEventTime[type] = minute;
    return evt;
  }

  canEmit(type, minute, minGap = 1.5) {
    return (minute - (this.lastEventTime[type] ?? -99)) >= minGap;
  }
}

export class MatchStatistics {
  constructor() {
    const makeTeam = () => ({
      shots: 0, shotsOnTarget: 0, xG: 0, xA: 0,
      bigChances: 0, bigChancesMissed: 0,
      pressingSuccess: 0, recoveries: 0,
      dribblesWon: 0, dribbledPast: 0,
      duelsWon: 0, interceptions: 0,
      throughBalls: 0, boxTouches: 0,
      distanceKm: 0, topSpeedKmh: 28.0,
      saves: 0, errorsToChance: 0, errorsToGoal: 0,
      corners: 0, throwIns: 0, fouls: 0
    });
    this.home = makeTeam();
    this.away = makeTeam();
  }

  side(isHome) { return isHome ? this.home : this.away; }

  recordShot(isHome, distToGoal, angleFactor, isBigChance, onTarget, scored, assisterExists) {
    const s = this.side(isHome);
    s.shots++;
    if (onTarget) s.shotsOnTarget++;
    // Tính xG dựa trên khoảng cách thực tế đến khung thành và góc sút
    const baseXg = Math.max(0.03, Math.min(0.78, (1 - distToGoal / 34) * 0.55 * angleFactor + (isBigChance ? 0.22 : 0)));
    s.xG = +(s.xG + baseXg).toFixed(2);
    if (assisterExists) s.xA = +(s.xA + baseXg * 0.72).toFixed(2);
    if (isBigChance) {
      s.bigChances++;
      if (!scored) s.bigChancesMissed++;
    }
    return +baseXg.toFixed(2);
  }
}

// 1. Hệ thống Động lực trận đấu (MomentumSystem)
export class MomentumSystem {
  constructor() {
    this.home = 52;
    this.away = 48;
  }

  shift(isHome, delta) {
    if (isHome) {
      this.home = Math.max(15, Math.min(95, this.home + delta));
      this.away = 100 - this.home;
    } else {
      this.away = Math.max(15, Math.min(95, this.away + delta));
      this.home = 100 - this.away;
    }
  }

  decay(dt) {
    this.home += (50 - this.home) * Math.min(1, dt * 0.03);
    this.away = 100 - this.home;
  }

  getBehaviorModifiers(isHome, goalDiff, minute) {
    const mom = isHome ? this.home : this.away;
    const late = minute >= 78;
    return {
      tempo: mom > 62 ? 1.14 : mom < 38 ? 0.92 : 1.0,
      linePush: (late && goalDiff < 0) ? 7.5 : (late && goalDiff > 0) ? -5.5 : (mom - 50) * 0.12,
      riskTaking: (late && goalDiff < 0) ? 1.35 : (late && goalDiff > 0) ? 0.65 : 0.85 + (mom / 100) * 0.3,
      cbJoinAttack: late && goalDiff < 0 && minute >= 84
    };
  }
}

// 2. Hệ thống Áp lực sân nhà & sân khách (HomeAdvantageSystem)
export class HomeAdvantageSystem {
  constructor(homeClub, comp) {
    this.stadium = homeClub?.stadium || 'Parc des Princes';
    this.capacity = homeClub?.name === 'Paris Saint-Germain' ? 47929 : 38000;
    this.attendancePct = comp === 'UEFA Champions League' ? 100 : 94 + Math.floor(Math.random() * 6);
    this.intensity = comp === 'UEFA Champions League' ? 0.94 : 0.78;
  }

  getComposureFactor(isHome, playerAge, crowdEnergy) {
    const expBonus = Math.min(0.08, Math.max(0, (playerAge - 20) * 0.008));
    if (isHome) return 1.0 + this.intensity * crowdEnergy * 0.05;
    // Sân khách chịu áp lực nhẹ hơn nếu cầu thủ giàu kinh nghiệm, không đảm bảo chủ nhà luôn thắng
    return Math.max(0.91, 1.0 - this.intensity * crowdEnergy * 0.055 + expBonus);
  }
}

// 10. Hệ thống Lịch sử đối đầu (RivalrySystem)
export class RivalrySystem {
  static key(c1, c2) {
    return [c1, c2].sort().join('__VS__');
  }

  static getRecord(h2hMap, homeName, awayName) {
    const k = RivalrySystem.key(homeName, awayName);
    const rec = h2hMap[k] || { matches: 0, wins: {}, draws: 0, goals: {}, history: [] };
    return {
      matches: rec.matches,
      homeWins: rec.wins[homeName] || 0,
      awayWins: rec.wins[awayName] || 0,
      draws: rec.draws || 0,
      lastMatch: rec.history[0] || null
    };
  }

  static recordResult(h2hMap, homeName, awayName, hg, ag, comp, season, scorers = []) {
    const k = RivalrySystem.key(homeName, awayName);
    if (!h2hMap[k]) h2hMap[k] = { matches: 0, wins: {}, draws: 0, goals: {}, history: [] };
    const rec = h2hMap[k];
    rec.matches++;
    rec.goals[homeName] = (rec.goals[homeName] || 0) + hg;
    rec.goals[awayName] = (rec.goals[awayName] || 0) + ag;
    if (hg > ag) rec.wins[homeName] = (rec.wins[homeName] || 0) + 1;
    else if (ag > hg) rec.wins[awayName] = (rec.wins[awayName] || 0) + 1;
    else rec.draws++;
    rec.history.unshift({ season, comp, home: homeName, away: awayName, score: `${hg}-${ag}`, scorers: scorers.slice(0, 4) });
    if (rec.history.length > 15) rec.history.pop();
  }
}

// 5 & 9. Hệ thống Đấu trí giữa hai Huấn luyện viên & AI Đối phó chiến thuật (CoachAI + TacticalAI)
export class CoachAI {
  constructor(homeCoachName, awayCoachName) {
    this.home = { name: homeCoachName || 'Luis Enrique', philosophy: 'Kiểm soát & Pressing tầm cao', risk: 0.72, reading: 92, lastAdjustMin: 0 };
    this.away = { name: awayCoachName || 'HLV Đối thủ', philosophy: 'Phòng ngự phản công linh hoạt', risk: 0.56, reading: 84, lastAdjustMin: 0 };
    this.duelLog = [];
  }

  evaluate(matchState, momentum, stats) {
    const min = matchState.minute;
    const diffHome = matchState.homeGoals - matchState.awayGoals;
    const actions = [];

    // Phân tích hướng tấn công của PSG / chủ nhà để đối thủ bọc lót
    if (min - this.away.lastAdjustMin >= 14) {
      const az = matchState.homeAttackZones;
      if (az.right >= az.left + 3 && az.right >= 3) {
        this.away.lastAdjustMin = min;
        matchState.homeFocusFlank = 'center'; // PSG nhận ra cánh phải bị phong tỏa -> chuyển trung lộ!
        const msg = `${this.away.name} điều thêm tiền vệ bọc lót cánh phải → ${this.home.name} lập tức chỉ đạo chuyển hướng tấn công vào trung lộ!`;
        this.duelLog.unshift(`${Math.floor(min)}' — ${msg}`);
        actions.push({ type: 'tactical_counter', side: 'away', text: msg });
      } else if (az.left >= az.right + 3 && az.left >= 3) {
        this.away.lastAdjustMin = min;
        matchState.homeFocusFlank = 'right';
        const msg = `${this.away.name} gia cố hậu vệ cánh trái → ${this.home.name} yêu cầu đảo cánh đánh sang biên phải!`;
        this.duelLog.unshift(`${Math.floor(min)}' — ${msg}`);
        actions.push({ type: 'tactical_counter', side: 'away', text: msg });
      } else if (matchState.homeTactic === 'attacking' && diffHome >= 0 && min > 25) {
        this.away.lastAdjustMin = min;
        matchState.awayTactic = 'defensive';
        const msg = `${this.away.name} cho đội hình lùi sâu phòng ngự thấp và chuyền dài vượt tuyến hóa giải pressing!`;
        this.duelLog.unshift(`${Math.floor(min)}' — ${msg}`);
        actions.push({ type: 'tactical_counter', side: 'away', text: msg });
      }
    }

    // Kịch tính cuối trận (phút 78+)
    if (min >= 78 && min - this.home.lastAdjustMin >= 12) {
      this.home.lastAdjustMin = min;
      if (diffHome < 0) {
        matchState.homeTactic = 'attacking';
        const msg = `${this.home.name} ra sát đường biên yêu cầu dâng cao toàn đội hình, đẩy trung vệ tham gia bóng bổng tìm bàn gỡ!`;
        this.duelLog.unshift(`${Math.floor(min)}' — ${msg}`);
        actions.push({ type: 'late_drama', side: 'home', text: msg });
      } else if (diffHome > 0) {
        matchState.homeTactic = 'defensive';
        const msg = `${this.home.name} chỉ đạo giữ cự ly đội hình chặt chẽ, ưu tiên kiểm soát bóng bảo toàn tỷ số.`;
        this.duelLog.unshift(`${Math.floor(min)}' — ${msg}`);
        actions.push({ type: 'late_drama', side: 'home', text: msg });
      }
    }

    return actions;
  }
}

// 8. Hệ thống Ảnh hưởng của Khán giả (CrowdReactionSystem — 8 trạng thái + hoạt ảnh InstancedMesh theo nhóm)
export class CrowdReactionSystem {
  constructor() {
    this.mood = 'Cổ vũ'; // Bình thường | Cổ vũ | Hưng phấn | Lo lắng | Thất vọng | Phẫn nộ | Ăn mừng | Im lặng
    this.energy = 0.55;
    this.timer = 0;
  }

  react(eventType, isHomeEvent, goalDiffHome, minute) {
    if (eventType === 'goal') {
      this.mood = isHomeEvent ? 'Ăn mừng' : 'Im lặng';
      this.energy = isHomeEvent ? 1.0 : 0.2;
      this.timer = 7.0;
    } else if (eventType === 'big_chance' || eventType === 'crossbar') {
      this.mood = isHomeEvent ? 'Hưng phấn' : 'Lo lắng';
      this.energy = isHomeEvent ? 0.88 : 0.65;
      this.timer = 4.0;
    } else if (eventType === 'save') {
      this.mood = isHomeEvent ? 'Cổ vũ' : 'Thất vọng';
      this.energy = 0.78;
      this.timer = 3.5;
    } else if (eventType === 'error' && isHomeEvent) {
      this.mood = goalDiffHome < 0 && minute > 65 ? 'Phẫn nộ' : 'Lo lắng';
      this.energy = 0.7;
      this.timer = 4.0;
    }
  }

  update(dt, goalDiffHome, minute) {
    if (this.timer > 0) {
      this.timer -= dt;
      return;
    }
    if (minute > 78 && Math.abs(goalDiffHome) <= 1) {
      this.mood = goalDiffHome >= 0 ? 'Hưng phấn' : 'Lo lắng';
      this.energy = 0.82;
    } else if (goalDiffHome < -1) {
      this.mood = 'Thất vọng';
      this.energy = 0.32;
    } else if (goalDiffHome > 0) {
      this.mood = 'Cổ vũ';
      this.energy = 0.72;
    } else {
      this.mood = 'Bình thường';
      this.energy = 0.5;
    }
  }
}

// V. Hệ thống Bình luận viên tiếng Việt có ngữ cảnh & chống lặp câu
export class CommentarySystem {
  constructor() {
    this.lines = [];
    this.usedIdx = {};
  }

  pick(key, templates) {
    const last = this.usedIdx[key] ?? -1;
    const next = (last + 1) % templates.length;
    this.usedIdx[key] = next;
    return templates[next];
  }

  addFromEvent(evt) {
    const m = `${evt.minute}'`;
    let text = '';
    if (evt.type === 'goal') {
      const tpl = this.pick('goal', [
        `⚽ ${m} — VÀOOO! ${evt.scorer} dứt điểm đẳng cấp hạ gục thủ môn, nâng tỷ số lên ${evt.score}! (xG: ${evt.xG})`,
        `⚽ ${m} — SIÊU PHẨM! ${evt.scorer} tung cú sút không thể cản phá cho ${evt.team}! Khán đài Parc des Princes như vỡ òa! (${evt.score})`,
        `⚽ ${m} — BÀN THẮNG QUÝ GIÁ! ${evt.scorer} chớp thời cơ cực nhanh sau pha phối hợp sắc nét! (${evt.score})`
      ]);
      text = tpl;
    } else if (evt.type === 'save') {
      text = this.pick('save', [
        `🧤 ${m} — Một pha cứu thua xuất sắc của thủ môn ${evt.keeper}! Cú sút cực căng của ${evt.shooter} đã bị từ chối.`,
        `🧤 ${m} — Không thể tin được! ${evt.keeper} bay người hết cỡ đẩy bóng giải nguy cho ${evt.team}!`
      ]);
    } else if (evt.type === 'crossbar') {
      text = `💥 ${m} — XÀ NGANG CỨU THUA! Cú dứt điểm của ${evt.shooter} dội trúng khung gỗ trong sự tiếc nuối của khán giả!`;
    } else if (evt.type === 'counter') {
      text = this.pick('counter', [
        `⚡ ${m} — PHẢN CÔNG NHANH! ${evt.passer} chọc khe xuyên tuyến thông minh cho ${evt.runner} bứt tốc!`,
        `⚡ ${m} — Chuyển trạng thái cực nhanh! ${evt.team} tổ chức đợt tấn công chớp nhoáng bên cánh ${evt.flank}!`
      ]);
    } else if (evt.type === 'tackle') {
      text = this.pick('tackle', [
        `🦵 ${m} — Pha tắc bóng chuẩn xác của ${evt.player} cắt đứt đợt lên bóng nguy hiểm của ${evt.victim}!`,
        `🛡️ ${m} — ${evt.player} đọc tình huống rất tốt, đánh chặn thành công pha đi bóng của đối phương.`
      ]);
    } else if (evt.type === 'error') {
      text = `⚠️ ${m} — SAI LẦM PHÒNG NGỰ! Dưới sức ép pressing, ${evt.player} chuyền hỏng ngay trước vòng cấm tạo cơ hội cực kỳ nguy hiểm!`;
    } else if (evt.type === 'sub') {
      text = `🔄 ${m} — Thay người chiến thuật (${evt.team}): ${evt.inPlayer} vào sân thay ${evt.outPlayer} để tạo đột biến bằng tốc độ và thể lực sung mãn!`;
    } else if (evt.type === 'var') {
      text = `📺 ${m} — Trọng tài kiểm tra VAR cho tình huống va chạm trong vòng cấm... Quyết định cuối cùng: ${evt.verdict}!`;
    } else if (evt.type === 'tactical_counter' || evt.type === 'late_drama') {
      text = `🧠 ${m} — ĐẤU TRÍ HLV: ${evt.text}`;
    } else if (evt.type === 'set_piece') {
      text = evt.text;
    }
    if (text) {
      this.lines.unshift(text);
      if (this.lines.length > 30) this.lines.pop();
    }
    return text;
  }
}

// VI. Hệ thống Phát lại tình huống thật (ReplaySystem — ghi chuyển động 3D thực tế)
export class ReplaySystem {
  constructor(maxBufferFrames = 100) {
    this.maxBufferFrames = maxBufferFrames;
    this.ring = [];
    this.clips = []; // Các clip bàn thắng / cứu thua / xà ngang đã ghi lại chuyển động thật
    this.playing = false;
    this.activeClip = null;
    this.frameIdx = 0;
    this.speed = 0.45; // 1.0 bình thường, 0.4 quay chậm
    this.camAngle = 'behind_goal'; // wide | close | behind_goal
  }

  captureFrame(ballPos, players) {
    if (this.playing) return;
    this.ring.push({
      ball: [ballPos.x, ballPos.y, ballPos.z],
      players: players.map((p) => [p.mesh.position.x, p.mesh.position.z, p.mesh.rotation.y])
    });
    if (this.ring.length > this.maxBufferFrames) this.ring.shift();
  }

  saveClip(label, minute) {
    if (this.ring.length < 10) return;
    this.clips.unshift({
      id: `clip_${Date.now()}`,
      label: `${Math.floor(minute)}' · ${label}`,
      frames: this.ring.slice(-75).map((f) => ({ ball: [...f.ball], players: f.players.map((p) => [...p]) }))
    });
    if (this.clips.length > 8) this.clips.pop();
  }

  startPlayback(clipIndex = 0, speed = 0.45, camAngle = 'behind_goal') {
    const clip = this.clips[clipIndex];
    if (!clip) return false;
    this.activeClip = clip;
    this.frameIdx = 0;
    this.speed = speed;
    this.camAngle = camAngle;
    this.playing = true;
    return true;
  }

  stop() {
    this.playing = false;
    this.activeClip = null;
  }

  step(dt, ballMesh, players, camera) {
    if (!this.playing || !this.activeClip) return false;
    this.frameIdx += dt * 20 * this.speed;
    const idx = Math.floor(this.frameIdx);
    if (idx >= this.activeClip.frames.length) {
      this.stop();
      return false;
    }
    const f = this.activeClip.frames[idx];
    ballMesh.position.set(f.ball[0], f.ball[1], f.ball[2]);
    for (let i = 0; i < Math.min(players.length, f.players.length); i++) {
      players[i].mesh.position.set(f.players[i][0], 0, f.players[i][1]);
      players[i].mesh.rotation.y = f.players[i][2];
    }
    const bx = f.ball[0], bz = f.ball[2];
    const camTarget = new THREE.Vector3();
    if (this.camAngle === 'wide') camTarget.set(0, 24, 36);
    else if (this.camAngle === 'close') camTarget.set(bx - 6.5, 4.2, bz + 7.5);
    else camTarget.set(bx > 0 ? 37 : -37, 4.5, bz * 0.4); // Sau khung thành
    camera.position.lerp(camTarget, Math.min(1, dt * 6));
    camera.lookAt(bx, 1.0, bz);
    return true;
  }
}
