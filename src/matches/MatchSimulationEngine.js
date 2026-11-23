// src/matches/MatchSimulationEngine.js
// Hệ thống mô phỏng kết quả trận đấu tự động theo mô hình sức mạnh đội hình, phong độ, thể lực, chiến thuật, sân nhà/khách, lịch sử đối đầu
// Đảm bảo thống nhất dữ liệu 100%: Cầu thủ ghi bàn/kiến tạo thuộc đúng đội hình ra sân, không chấn thương/treo giò, khớp tuyệt đối với bảng tỷ số & thống kê

export class MatchCalendarSystem {
  static buildSeasonSchedule(clubs, seasonStartYear = 2026) {
    const ligue1 = clubs.filter((c) => c.league === 'Ligue 1' && c.name !== 'Paris Saint-Germain');
    const uclPool = clubs.filter((c) => c.rating >= 82 && c.name !== 'Paris Saint-Germain').slice(0, 12);
    const list = [];
    let id = 1;

    const makeDate = (weekNum) => {
      const base = new Date(seasonStartYear, 7, 2); // Tháng 8
      base.setDate(base.getDate() + (weekNum - 1) * 7);
      const dd = String(base.getDate()).padStart(2, '0');
      const mm = String(base.getMonth() + 1).padStart(2, '0');
      return `${dd}/${mm}/${base.getFullYear()}`;
    };

    // Tuần 1: Giao hữu tiền mùa giải
    list.push({
      id: `fx_${id++}`, week: 1, comp: 'Giao hữu', round: 'Giao hữu Quốc tế',
      date: makeDate(1), time: '20:00', home: 'Paris Saint-Germain', away: uclPool[0]?.name || 'Bayern Munich',
      stadium: 'Parc des Princes', status: 'Hôm nay thi đấu', played: false, homeGoals: null, awayGoals: null, importance: 0.7
    });

    // Tuần 2: Trophée des Champions (Siêu cúp Pháp)
    list.push({
      id: `fx_${id++}`, week: 2, comp: 'Trophée des Champions', round: 'Chung kết Siêu cúp Pháp',
      date: makeDate(2), time: '21:00', home: 'Paris Saint-Germain', away: 'AS Monaco',
      stadium: 'Parc des Princes', status: 'Sắp diễn ra', played: false, homeGoals: null, awayGoals: null, importance: 1.15
    });

    // 30 vòng Ligue 1 xen kẽ UEFA Champions League & Coupe de France
    let weekCursor = 3;
    for (let round = 1; round <= 30; round++) {
      const opp = ligue1[(round - 1) % ligue1.length];
      const isHome = round % 2 === 1;
      const homeClub = isHome ? 'Paris Saint-Germain' : opp.name;
      const awayClub = isHome ? opp.name : 'Paris Saint-Germain';
      const stadium = isHome ? 'Parc des Princes' : opp.stadium;

      list.push({
        id: `fx_${id++}`, week: weekCursor++, comp: 'Ligue 1', round: `Vòng ${round}`,
        date: makeDate(weekCursor - 1), time: isHome ? '21:00' : '19:00',
        home: homeClub, away: awayClub, stadium,
        status: 'Sắp diễn ra', played: false, homeGoals: null, awayGoals: null,
        importance: ['Olympique de Marseille', 'AS Monaco', 'Olympique Lyonnais', 'LOSC Lille'].includes(opp.name) ? 1.2 : 1.0
      });

      if (round % 4 === 0 && uclPool.length > 0) {
        const uOpp = uclPool[(round / 4 - 1) % uclPool.length];
        const uHome = (round / 4) % 2 === 1;
        list.push({
          id: `fx_${id++}`, week: weekCursor++, comp: 'UEFA Champions League',
          round: round <= 16 ? `Vòng bảng · Lượt ${round / 4}` : 'Vòng Knock-out Châu Âu',
          date: makeDate(weekCursor - 1), time: '21:00',
          home: uHome ? 'Paris Saint-Germain' : uOpp.name,
          away: uHome ? uOpp.name : 'Paris Saint-Germain',
          stadium: uHome ? 'Parc des Princes' : uOpp.stadium,
          status: 'Sắp diễn ra', played: false, homeGoals: null, awayGoals: null, importance: 1.35
        });
      }

      if (round % 8 === 0) {
        const cOpp = ligue1[(round + 2) % ligue1.length];
        list.push({
          id: `fx_${id++}`, week: weekCursor++, comp: 'Coupe de France',
          round: round === 8 ? 'Vòng 1/16' : round === 16 ? 'Tứ kết' : 'Bán kết / Chung kết',
          date: makeDate(weekCursor - 1), time: '20:45',
          home: 'Paris Saint-Germain', away: cOpp.name, stadium: 'Parc des Princes',
          status: 'Sắp diễn ra', played: false, homeGoals: null, awayGoals: null, importance: 1.1
        });
      }
    }
    return list;
  }
}

export class MatchSimulationEngine {
  static selectLineup(psgSquad, preferYouth = false, formationSystem = null) {
    if (formationSystem && !preferYouth) {
      const fd = formationSystem.getFormationData();
      const xi = fd.starters.map((s) => s.player).filter((p) => p && (p.injuryDays || 0) <= 0 && !p.suspended);
      if (xi.length === 11) {
        const bench = fd.bench.map((b) => b.player).filter((p) => p && (p.injuryDays || 0) <= 0 && !p.suspended).slice(0, 7);
        const injured = psgSquad.filter((p) => (p.injuryDays || 0) > 0);
        const suspended = psgSquad.filter((p) => !!p.suspended);
        return { xi, bench, injured, suspended };
      }
    }
    // Tuyệt đối loại trừ cầu thủ đang chấn thương hoặc bị treo giò
    const avail = psgSquad.filter((p) => (p.injuryDays || 0) <= 0 && !p.suspended);
    const sortFn = (a, b) => {
      const scoreA = a.ovr * 0.7 + a.form * 0.2 + (a.morale || 75) * 0.1 + (preferYouth && a.age <= 22 ? 6 : 0);
      const scoreB = b.ovr * 0.7 + b.form * 0.2 + (b.morale || 75) * 0.1 + (preferYouth && b.age <= 22 ? 6 : 0);
      return scoreB - scoreA;
    };
    const gks = avail.filter((p) => p.position === 'GK').sort(sortFn);
    const defs = avail.filter((p) => ['CB', 'LB', 'RB'].includes(p.position)).sort(sortFn);
    const mids = avail.filter((p) => ['DM', 'CM', 'AM'].includes(p.position)).sort(sortFn);
    const atts = avail.filter((p) => ['LW', 'RW', 'ST'].includes(p.position)).sort(sortFn);

    const xi = [];
    const pick = (pool, count) => {
      for (const p of pool) {
        if (xi.length < 11 && count > 0 && !xi.includes(p)) { xi.push(p); count--; }
      }
    };
    pick(gks, 1); pick(defs, 4); pick(mids, 3); pick(atts, 3);
    // Điền đủ 11 nếu thiếu vị trí cụ thể
    for (const p of avail.sort(sortFn)) {
      if (xi.length >= 11) break;
      if (!xi.includes(p)) xi.push(p);
    }
    const bench = avail.filter((p) => !xi.includes(p)).slice(0, 7);
    const injured = psgSquad.filter((p) => (p.injuryDays || 0) > 0);
    const suspended = psgSquad.filter((p) => !!p.suspended);
    return { xi, bench, injured, suspended };
  }

  static buildPreMatchCoachReport(fixture, state) {
    const squad = state.getPsgSquad();
    const { xi, injured, suspended } = MatchSimulationEngine.selectLineup(squad, false, state.formationSystem);
    const inForm = [...xi].sort((a, b) => b.form - a.form).slice(0, 3);
    const weakSpot = [...xi].sort((a, b) => a.ovr - b.ovr)[0];
    return {
      fixture,
      coachName: state.coach.name,
      formation: state.coach.formation,
      summary: 'Thưa Chủ tịch, công tác chuẩn bị cho trận đấu đã hoàn tất. Đội hình hiện tại có thể đáp ứng yêu cầu chuyên môn. Tuy nhiên, chúng ta cần lưu ý một số vấn đề về thể lực và phong độ của cầu thủ.',
      xi,
      injured,
      suspended,
      inForm,
      vulnerable: weakSpot ? `${weakSpot.position} (${weakSpot.name} · OVR ${weakSpot.ovr})` : 'Không có điểm yếu lớn'
    };
  }

  // Mô phỏng tự động dựa trên mô hình sức mạnh thực tế (không random tỷ số vô căn cứ)
  static simulateMatch(fixture, homeClub, awayClub, state, presidentDirective = 'none') {
    const psgIsHome = fixture.home === 'Paris Saint-Germain';
    const preferYouth = presidentDirective === 'youth';
    const { xi, bench } = MatchSimulationEngine.selectLineup(state.getPsgSquad(), preferYouth, state.formationSystem);

    // 1. Tính điểm sức mạnh đội hình PSG (GK, DEF, MID, ATT, Form, Morale, Coach Tactics, Directive)
    const avg = (arr, fn, fallback = 80) => arr.length ? arr.reduce((s, x) => s + fn(x), 0) / arr.length : fallback;
    const psgOvr = avg(xi, (p) => p.ovr, 84);
    const psgForm = avg(xi, (p) => p.form, 78);
    const psgMorale = avg(xi, (p) => p.morale, 80);
    const psgBench = avg(bench, (p) => p.ovr, 77);
    const directiveMod =
      presidentDirective === 'win' ? 1.8 :
      presidentDirective === 'cheer' ? 1.2 :
      presidentDirective === 'coach' ? 1.1 :
      presidentDirective === 'rest' ? -0.8 :
      presidentDirective === 'youth' ? -0.4 : 0;

    const psgPower = psgOvr * 0.62 + psgForm * 0.14 + psgMorale * 0.10 + state.coach.tactics * 0.09 + psgBench * 0.05 + directiveMod + (psgIsHome ? 2.6 : -1.1);
    const oppClub = psgIsHome ? awayClub : homeClub;
    const oppPower = (oppClub?.rating || 78) * 0.96 + (psgIsHome ? -0.8 : 2.5) + (Math.random() - 0.5) * 3.8;

    const homePower = psgIsHome ? psgPower : oppPower;
    const awayPower = psgIsHome ? oppPower : psgPower;
    const diff = homePower - awayPower;

    // 2. Tạo cơ hội & bàn thắng dựa trên chênh lệch sức mạnh + xác suất có điều kiện (đội mạnh không luôn thắng 100%)
    const homePoss = Math.max(34, Math.min(68, Math.round(50 + diff * 1.4 + (Math.random() - 0.5) * 6)));
    const awayPoss = 100 - homePoss;

    const homeShots = Math.max(4, Math.round(10 + diff * 0.55 + Math.random() * 6));
    const awayShots = Math.max(3, Math.round(9 - diff * 0.45 + Math.random() * 6));
    const homeOnTarget = Math.max(1, Math.min(homeShots, Math.round(homeShots * (0.34 + Math.random() * 0.22))));
    const awayOnTarget = Math.max(1, Math.min(awayShots, Math.round(awayShots * (0.32 + Math.random() * 0.22))));

    const homeXg = +(homeOnTarget * 0.26 + (homeShots - homeOnTarget) * 0.05).toFixed(2);
    const awayXg = +(awayOnTarget * 0.25 + (awayShots - awayOnTarget) * 0.05).toFixed(2);

    // Chuyển hóa xG thành bàn thắng thực tế
    const convertGoals = (xg, onTarget) => {
      let g = 0;
      const tries = Math.max(1, onTarget);
      const pGoal = Math.min(0.42, Math.max(0.08, xg / tries));
      for (let i = 0; i < tries; i++) {
        if (Math.random() < pGoal && g < 6) g++;
      }
      return g;
    };
    const homeGoals = convertGoals(homeXg, homeOnTarget);
    const awayGoals = convertGoals(awayXg, awayOnTarget);

    // 3. Tạo danh sách sự kiện bàn thắng THỐNG NHẤT 100% với đội hình ra sân
    const attackers = xi.filter((p) => ['ST', 'LW', 'RW', 'AM', 'CM'].includes(p.position));
    const psgPool = attackers.length > 0 ? attackers : xi.slice(1);
    const oppPlayers = state.players.filter((p) => p.club === oppClub?.name);

    const pickWeightedPsg = () => {
      const weights = psgPool.map((p) => (p.position === 'ST' ? 4 : ['LW', 'RW'].includes(p.position) ? 3 : 1.5));
      let r = Math.random() * weights.reduce((a, b) => a + b, 0);
      for (let i = 0; i < psgPool.length; i++) {
        r -= weights[i];
        if (r <= 0) return psgPool[i];
      }
      return psgPool[0];
    };

    const goalEvents = [];
    const playerGoalCount = new Map();
    const playerAssistCount = new Map();

    const makeGoalsForSide = (count, isHomeSide) => {
      const isPsgSide = isHomeSide === psgIsHome;
      for (let i = 0; i < count; i++) {
        const minute = Math.max(2, Math.min(90, Math.round(8 + (i + 0.5) * (80 / Math.max(1, count)) + (Math.random() - 0.5) * 16)));
        if (isPsgSide) {
          const scorer = pickWeightedPsg();
          const assistPool = xi.filter((p) => p.id !== scorer.id && p.position !== 'GK');
          const assister = assistPool.length ? assistPool[Math.floor(Math.random() * assistPool.length)] : null;
          playerGoalCount.set(scorer.id, (playerGoalCount.get(scorer.id) || 0) + 1);
          if (assister) playerAssistCount.set(assister.id, (playerAssistCount.get(assister.id) || 0) + 1);
          goalEvents.push({ minute, isHome: isHomeSide, team: 'Paris Saint-Germain', scorer: scorer.name, scorerId: scorer.id, assister: assister ? assister.name : null });
        } else {
          const oppScorer = oppPlayers.length
            ? oppPlayers[Math.floor(Math.random() * oppPlayers.length)].name
            : `Tiền đạo ${oppClub?.name?.split(' ')[0] || 'Đối thủ'}`;
          goalEvents.push({ minute, isHome: isHomeSide, team: oppClub?.name || 'Đối thủ', scorer: oppScorer, scorerId: null, assister: null });
        }
      }
    };
    makeGoalsForSide(homeGoals, true);
    makeGoalsForSide(awayGoals, false);
    goalEvents.sort((a, b) => a.minute - b.minute);

    const psgGoals = psgIsHome ? homeGoals : awayGoals;
    const oppGoals = psgIsHome ? awayGoals : homeGoals;
    const psgWon = psgGoals > oppGoals;
    const psgDrew = psgGoals === oppGoals;
    const cleanSheet = oppGoals === 0;
    const lateWinner = psgWon && goalEvents.some((e) => e.team === 'Paris Saint-Germain' && e.minute >= 82);

    // 4. Chấm điểm từng cầu thủ PSG dựa trực tiếp trên đóng góp thực tế
    const yellowCards = [];
    const ratings = xi.map((p) => {
      const g = playerGoalCount.get(p.id) || 0;
      const a = playerAssistCount.get(p.id) || 0;
      let score = 6.5 + (psgWon ? 0.5 : psgDrew ? 0.1 : -0.5) + g * 1.15 + a * 0.65 + (cleanSheet && ['GK', 'CB', 'LB', 'RB'].includes(p.position) ? 0.65 : 0) + (Math.random() - 0.45) * 0.8;
      score = +Math.max(5.1, Math.min(9.7, score)).toFixed(1);
      if (Math.random() < 0.12 && yellowCards.length < 3) yellowCards.push(`${p.name} (${15 + Math.floor(Math.random() * 70)}')`);
      let note = 'Thi đấu tròn vai, giữ tốt cự ly đội hình';
      if (g >= 2) note = `Lập cú đúp (${g} bàn), bùng nổ trên hàng công`;
      else if (g === 1 && a >= 1) note = 'Ghi bàn và kiến tạo, tỏa sáng rực rỡ';
      else if (g === 1) note = 'Ghi bàn thắng quan trọng cho PSG';
      else if (a >= 1) note = `Có ${a} đường kiến tạo mở khóa hàng thủ đối phương`;
      else if (p.position === 'GK' && cleanSheet) note = 'Giữ sạch lưới với những pha cứu thua chắc chắn';
      else if (score < 6.2) note = 'Chưa đạt phong độ cao nhất, cần cải thiện sự tập trung';
      return { id: p.id, name: p.name, position: p.position, age: p.age, rating: score, goals: g, assists: a, note };
    });

    const motm = [...ratings].sort((a, b) => b.rating - a.rating)[0];
    const youngStar = ratings.find((r) => r.age <= 21 && r.rating >= 7.3) || null;
    const gkRating = ratings.find((r) => r.position === 'GK');

    // Chấn thương nhẹ có thể phát sinh trong trận (xác suất thấp, giảm nếu Chủ tịch yêu cầu bảo toàn thể lực)
    let matchInjury = null;
    if (Math.random() < (presidentDirective === 'rest' ? 0.06 : 0.16)) {
      const victim = xi[1 + Math.floor(Math.random() * (xi.length - 1))];
      if (victim) {
        victim.injuryDays = 7 + Math.floor(Math.random() * 14);
        matchInjury = `${victim.name} (nghỉ ${victim.injuryDays} ngày)`;
      }
    }

    // 5. Tạo Báo cáo chuyên môn & Đề xuất của Ban huấn luyện sau trận
    const proposals = [];
    if (!psgWon) {
      proposals.push({ id: `cp_${Date.now()}_1`, text: 'Đề nghị tổ chức thêm các buổi tập chuyên sâu về phòng ngự chuyển trạng thái và chống phản công.', actionType: 'drill' });
      proposals.push({ id: `cp_${Date.now()}_2`, text: 'Đề xuất bổ sung thêm 1 tiền đạo dứt điểm sắc bén trong kỳ chuyển nhượng để tăng hiệu suất ghi bàn.', actionType: 'transfer' });
    } else {
      proposals.push({ id: `cp_${Date.now()}_3`, text: 'Đề xuất xoay tua cho 2 trụ cột nghỉ ngơi nhẹ ở buổi tập tới để giữ nền tảng thể lực cho Champions League.', actionType: 'rest' });
      if (youngStar) proposals.push({ id: `cp_${Date.now()}_4`, text: `Tài năng trẻ ${youngStar.name} (${youngStar.rating} điểm) chơi rất ấn tượng — đề xuất trao thêm cơ hội đá chính.`, actionType: 'youth' });
    }

    const coachReport = {
      fixtureId: fixture.id,
      date: fixture.date,
      comp: fixture.comp,
      scoreText: `${fixture.home} ${homeGoals} - ${awayGoals} ${fixture.away}`,
      resultLabel: psgWon ? 'Chiến thắng' : psgDrew ? 'Hòa' : 'Thất bại',
      summary: psgWon
        ? `PSG đã giành chiến thắng ${psgGoals}-${oppGoals} đầy thuyết phục trước ${oppClub.name} nhờ sự tỏa sáng của ${motm.name} (${motm.rating} điểm).`
        : psgDrew
          ? `PSG chia điểm ${psgGoals}-${oppGoals} với ${oppClub.name} dù kiểm soát bóng ${psgIsHome ? homePoss : awayPoss}%. Khâu dứt điểm cần sắc bén hơn.`
          : `PSG nhận thất bại ${psgGoals}-${oppGoals} trước ${oppClub.name}. Ban huấn luyện nhận trách nhiệm và sẽ điều chỉnh ngay chiến thuật phòng ngự.`,
      strengths: psgWon ? `Kiểm soát nhịp độ tốt (${psgIsHome ? homePoss : awayPoss}% bóng), tạo ra ${psgIsHome ? homeShots : awayShots} cú sút.` : 'Tinh thần chiến đấu đến phút cuối và khả năng luân chuyển bóng tuyến giữa.',
      weaknesses: oppGoals >= 2 ? 'Khoảng trống sau lưng hậu vệ biên khi chuyển trạng thái.' : 'Cần tận dụng tốt hơn các cơ hội lớn trong vòng cấm.',
      ratings,
      proposals: proposals.map((pr) => ({ ...pr, status: 'Chờ duyệt' }))
    };

    return {
      fixture, homeClub, awayClub, homeGoals, awayGoals, psgIsHome, psgGoals, oppGoals, psgWon, psgDrew,
      cleanSheet, lateWinner, oppName: oppClub.name,
      stats: { homePoss, awayPoss, homeShots, awayShots, homeOnTarget, awayOnTarget, homeXg, awayXg, yellowCards },
      goalEvents, ratings, motm, youngStar, gkRating, matchInjury, coachReport
    };
  }
}
