// src/club/GameState.js
// Trung tâm dữ liệu PSG: Lịch trận theo tuần (khóa qua tuần khi chưa đá), Báo cáo chờ duyệt tự biến mất khi duyệt & Thông báo tình hình mỗi ngày cho Giám đốc/Chủ tịch
import { createInitialDepartments, createInitialNpcProfiles } from '../departments/DepartmentData.js';
import { generateRealPlayers200, generateAcademy100 } from '../players/PlayerDatabase.js';
import { createWorldClubs, simulateLigue1Round } from '../leagues/LeagueSystem.js';
import { MatchCalendarSystem, MatchSimulationEngine } from '../matches/MatchSimulationEngine.js';
import { PressNewsSystem } from '../media/PressNewsSystem.js';
import { SquadFormationSystem } from '../squad/SquadFormationSystem.js';
import { RivalrySystem } from '../matches/MatchSystems.js';
import { TaskAssignmentSystem } from '../dialogue/DialogueSystem.js';

export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.president = {
      name: 'Phạm Minh Chiêu',
      club: 'Paris Saint-Germain',
      stadium: 'Parc des Princes',
      league: 'Ligue 1',
      prestige: 88,
      boardTrust: 86,
      fanSupport: 84
    };
    this.season = '2026/27';
    this.seasonNum = 1;
    this.week = 1;
    this.dayNum = 1;
    this.dayName = 'Thứ Hai';
    this.clockHour = 9.25; // Bắt đầu 09:15 (đúng giờ tập sáng)

    this.coach = {
      name: 'Luis Enrique',
      reputation: 91, experience: 90, tactics: 92, youthDev: 86, dressingRoom: 85,
      wage: 195, contractYears: 3,
      formation: '4-3-3 Kiểm soát bóng',
      objectives: ['Vô địch Ligue 1', 'Tối thiểu Bán kết Champions League', 'Đôn 2 cầu thủ Học viện lên đội một']
    };

    this.finance = {
      budget: 245.0,
      transferBudget: 165.0,
      weeklyWages: 4.85,
      debt: 0.0,
      ffpStatus: 'An toàn (72% doanh thu)',
      income: { tv: 112, tickets: 68, sponsors: 145, merch: 54, prize: 42, sales: 0 },
      expenses: { playerWages: 215, staffWages: 28, coachWage: 10, transfers: 0, ops: 38, maintenance: 16 },
      ledger: [
        { date: 'Tuần 1', desc: 'Tài trợ chính Qatar Airways & Nike (đợt 1)', amount: +48.0 },
        { date: 'Tuần 1', desc: 'Quỹ lương tuần đội một & 12 phòng ban', amount: -4.85 }
      ]
    };

    this.departments = createInitialDepartments().map((d) => ({ ...d, proposalApproved: false }));
    this.npcs = createInitialNpcProfiles();
    this.players = generateRealPlayers200();
    this.academy = generateAcademy100();
    this.clubs = createWorldClubs();
    this.fixtures = MatchCalendarSystem.buildSeasonSchedule(this.clubs, 2026);

    // Báo cáo chờ Chủ tịch duyệt — khi duyệt hoặc từ chối sẽ biến mất khỏi danh sách!
    this.pendingReports = [
      { id: 'rep_1', dept: 'Ban Huấn Luyện', author: 'Luis Enrique', title: 'Đề xuất tăng ngân sách phân tích video đối thủ (€1.5M)', detail: 'Trang bị hệ thống camera chiến thuật góc rộng phân tích pressing cho Ligue 1 & Champions League.', cost: -1.5, effect: { deptId: 'coaching', perf: 5, morale: 4 } },
      { id: 'rep_2', dept: 'Phòng Marketing & Thương Mại', author: 'Antoine Lefèvre', title: 'Ký gói tài trợ khu vực Châu Á (+€14.0M)', detail: 'Đối tác viễn thông đề nghị tài trợ biển LED Parc des Princes trong 1 mùa giải.', cost: +14.0, effect: { deptId: 'marketing', perf: 4, prestige: 3 } },
      { id: 'rep_3', dept: 'Phòng Y Tế', author: 'BS. Christophe Baudot', title: 'Nâng cấp buồng hồi phục lạnh Cryotherapy (€1.8M)', detail: 'Giúp giảm 25% nguy cơ căng cơ và rút ngắn thời gian hồi phục cho đội một.', cost: -1.8, effect: { deptId: 'medical', perf: 6, morale: 5 } },
      { id: 'rep_4', dept: 'Phòng Tuyển Trạch', author: 'Marc-Antoine Delacroix', title: 'Mở rộng mạng lưới săn cầu thủ U20 Nam Mỹ (€2.2M)', detail: 'Phát hiện sớm các tài năng trẻ tiềm năng 90+ trước các đối thủ Ngoại hạng Anh.', cost: -2.2, effect: { deptId: 'scouting', perf: 5, morale: 4 } }
    ];

    // Thông báo tình hình mỗi ngày trên máy tính cho Giám đốc / Chủ tịch
    this.dailyBriefings = [];
    this.generateDailyBriefing();

    this.meetingMinutes = [
      {
        id: 'mm_0',
        date: 'Tuần 1 · Mùa 2026/27',
        topic: 'Khởi động chiến lược mùa giải mới dưới thời Chủ tịch Phạm Minh Chiêu',
        attendees: ['Victoriano Melero', 'Luís Campos', 'Luis Enrique', 'Jean-Baptiste Laurent'],
        votes: { approve: 4, reject: 0, abstain: 0 },
        decision: 'Phê duyệt mục tiêu Vô địch Ligue 1, tiến sâu tại UEFA Champions League và kiểm soát quỹ lương bền vững.',
        owner: 'Ban Điều Hành PSG'
      }
    ];

    this.phoneInbox = [
      { id: 'msg_1', from: 'Lịch Thi Đấu PSG', title: `⚠️ Tuần 1 có trận: ${this.fixtures[0].home} vs ${this.fixtures[0].away}`, body: 'Thưa Chủ tịch, tuần này PSG có trận đấu chính thức. Không thể tua qua tuần khi trận đấu chưa diễn ra.', urgent: true, read: false },
      { id: 'msg_2', from: 'Luís Campos (GĐ Thể Thao)', title: 'Danh sách 200 mục tiêu tuyển trạch đã sẵn sàng', body: 'Phòng Tuyển trạch đã hoàn tất hồ sơ 200 cầu thủ thật. Ngài có thể mở Máy tính macOS để xem và duyệt đàm phán.', urgent: false, read: false },
      { id: 'msg_3', from: 'Victoriano Melero (CEO)', title: 'Báo cáo tình hình mỗi ngày đã cập nhật trên Máy tính', body: 'Thưa Chủ tịch Phạm Minh Chiêu, bản tin tổng hợp tình hình câu lạc bộ hằng ngày và các báo cáo chờ duyệt đã sẵn sàng trong mục Báo cáo.', urgent: false, read: false }
    ];

    this.incomingCall = null;

    this.socialFeed = [
      { id: 'soc_1', author: 'Le Parisien Sport', handle: '@leparisien_psg', text: 'Chủ tịch Phạm Minh Chiêu chính thức chủ trì buổi làm việc đầu tuần tại Trụ sở Campus PSG.', likes: 12480, sentiment: 'positive' },
      { id: 'soc_2', author: 'Collectif Ultras Paris', handle: '@Co_Ultras_Paris', text: 'Parc des Princes đã sẵn sàng rực cháy cho trận mở màn tuần này!', likes: 8940, sentiment: 'positive' }
    ];

    this.seasonHistory = [
      { season: '2025/26', ligue1Winner: 'Paris Saint-Germain', uclWinner: 'Paris Saint-Germain', topScorer: 'Ousmane Dembélé (24 bàn)', psgRank: 'Hạng 1', trophies: 'Ligue 1, Coupe de France, UCL', revenue: '€805M' }
    ];

    this.dialogueLogs = [];
    this.transferLogs = [];
    this.loseStreak = 0;
    this.headToHead = {};
    this.assignedTasks = [];
    this.newsArchive = [];
    this.matchReports = [];
    this.lastMatchResult = null;
    this.formationSystem = new SquadFormationSystem(this);
    if (this.fixtures[0]) PressNewsSystem.generatePreMatchNews(this, this.fixtures[0]);
    PressNewsSystem.createArticle(this, { scenarioId: 26, category: 'Nội bộ', tagType: 'Chính thức', title: 'Chủ tịch Phạm Minh Chiêu chính thức mở màn mùa giải mới cùng Paris Saint-Germain', summary: 'Ban lãnh đạo PSG khẳng định quyết tâm bảo vệ ngôi vương Ligue 1 và chinh phục UEFA Champions League.', body: 'Tại trụ sở hiện đại Campus PSG, Chủ tịch Phạm Minh Chiêu đã có buổi làm việc đầu mùa với 12 phòng ban và HLV trưởng Luis Enrique, đặt mục tiêu kết hợp giữa bản sắc bóng đá tấn công và sự phát triển bền vững của Học viện.', imageType: 'boardroom', imageCaption: 'BAN LÃNH ĐẠO PSG · MÙA GIẢI MỚI', relatedEntity: 'Chủ tịch Phạm Minh Chiêu', fanTone: 'win' });
  }

  getPsgSquad() {
    return this.players.filter((p) => p.club === 'Paris Saint-Germain').sort((a, b) => b.ovr - a.ovr);
  }

  getNextFixture() {
    return this.fixtures.find((f) => !f.played) || null;
  }

  // Trả về trận đấu chưa diễn ra trong tuần hiện tại (dùng để thông báo & khóa qua tuần)
  getCurrentWeekFixture() {
    return this.fixtures.find((f) => !f.played && f.week <= this.week) || null;
  }

  generateDailyBriefing() {
    const fx = this.getCurrentWeekFixture();
    const injured = this.getPsgSquad().filter((p) => p.injuryDays > 0);
    const avgPerf = Math.round(this.departments.reduce((s, d) => s + d.performance, 0) / this.departments.length);
    this.dailyBriefings.unshift({
      id: `brief_${Date.now()}_${Math.random()}`,
      date: `Ngày ${this.dayNum} · ${this.dayName} · Tuần ${this.week} (${this.season})`,
      matchAlert: fx ? `⚽ Tuần này có trận ${fx.comp}: ${fx.home} vs ${fx.away} (Chưa thi đấu — Bắt buộc hoàn thành trước khi qua tuần)` : '✅ Không còn trận đấu tồn đọng trong tuần này.',
      trainingNote: `🏃 Lịch tập đội một: Ca sáng 09:00–11:30 & Ca chiều 15:00–17:00 do HLV ${this.coach.name} trực tiếp duy trì trên sân tập chính.`,
      healthNote: injured.length > 0 ? `🏥 Chấn thương (${injured.length}): ${injured.map((p) => `${p.name} (${p.injuryDays} ngày)`).join(', ')}.` : '💚 Thể trạng đội một 100% sẵn sàng, không có ca chấn thương.',
      financeNote: `💶 Ngân sách: €${this.finance.budget.toFixed(1)}M · Quỹ chuyển nhượng: €${this.finance.transferBudget.toFixed(1)}M · Hiệu suất TB 12 phòng ban: ${avgPerf}%.`
    });
    if (this.dailyBriefings.length > 20) this.dailyBriefings.pop();
  }

  resolvePendingReport(reportId, approve) {
    const idx = this.pendingReports.findIndex((r) => r.id === reportId);
    if (idx === -1) return null;
    const rep = this.pendingReports[idx];
    this.pendingReports.splice(idx, 1); // Biến mất ngay khỏi danh sách sau khi xử lý!
    if (approve) {
      if (rep.cost !== 0) this.addLedger(`${rep.dept}: ${rep.title}`, rep.cost);
      if (rep.effect?.deptId) {
        const d = this.departments.find((x) => x.id === rep.effect.deptId);
        if (d) {
          d.performance = Math.min(100, d.performance + (rep.effect.perf || 4));
          d.morale = Math.min(100, d.morale + (rep.effect.morale || 3));
        }
      }
      if (rep.effect?.prestige) this.president.prestige = Math.min(100, this.president.prestige + rep.effect.prestige);
    }
    return rep;
  }

  addLedger(desc, amount) {
    this.finance.budget = +(this.finance.budget + amount).toFixed(2);
    if (amount < 0) this.finance.transferBudget = Math.max(0, +(this.finance.transferBudget + amount * 0.6).toFixed(2));
    else this.finance.transferBudget = +(this.finance.transferBudget + amount * 0.5).toFixed(2);
    this.finance.ledger.unshift({ date: `Tuần ${this.week}`, desc, amount: +amount.toFixed(2) });
    if (this.finance.ledger.length > 30) this.finance.ledger.pop();
  }

  pushSocial(author, handle, text, sentiment = 'neutral') {
    this.socialFeed.unshift({ id: `soc_${Date.now()}_${Math.random()}`, author, handle, text, likes: 1800 + Math.floor(Math.random() * 14000), sentiment });
    if (this.socialFeed.length > 25) this.socialFeed.pop();
  }

  pushPhoneMsg(from, title, body, urgent = false) {
    this.phoneInbox.unshift({ id: `msg_${Date.now()}`, from, title, body, urgent, read: false });
    if (this.phoneInbox.length > 25) this.phoneInbox.pop();
  }

  advanceWeek(onLivingWorldEvent) {
    // Khóa qua tuần nếu trận đấu trong tuần chưa diễn ra
    const pendingFx = this.getCurrentWeekFixture();
    if (pendingFx) {
      return { blocked: true, fixture: pendingFx };
    }

    this.week++;
    this.dayNum += 7;
    const days = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
    this.dayName = days[(this.week - 1) % 7];
    this.clockHour = 9.0;

    const psgSquad = this.getPsgSquad();
    const wageM = +(psgSquad.reduce((s, p) => s + p.wage, 0) / 1000 + 1.15).toFixed(2);
    this.finance.weeklyWages = wageM;
    this.addLedger(`Chi trả quỹ lương tuần ${this.week}`, -wageM);
    if (this.week % 2 === 0) {
      this.addLedger(`Doanh thu thương mại & áo đấu tuần ${this.week}`, +(5.8 + this.president.prestige * 0.04).toFixed(2));
    }

    psgSquad.forEach((p) => { if (p.injuryDays > 0) p.injuryDays = Math.max(0, p.injuryDays - 7); });
    this.academy.forEach((y) => { if (!y.promoted && Math.random() < 0.22 && y.ovr < y.pot) y.ovr = Math.min(y.pot, y.ovr + 1); });

    // Sinh thêm 1 báo cáo chờ duyệt mới mỗi tuần cho Giám đốc/Chủ tịch xử lý
    const deptSample = this.departments[this.week % this.departments.length];
    this.pendingReports.unshift({
      id: `rep_w${this.week}_${Date.now()}`,
      dept: deptSample.name,
      author: deptSample.head,
      title: `Đề xuất tối ưu hoạt động Tuần ${this.week} (${deptSample.name})`,
      detail: deptSample.proposal,
      cost: -1.0,
      effect: { deptId: deptSample.id, perf: 4, morale: 4 }
    });

    // Thông báo trận đấu tuần mới
    const newFx = this.getCurrentWeekFixture();
    if (newFx) {
      newFx.status = 'Hôm nay thi đấu';
      PressNewsSystem.generatePreMatchNews(this, newFx);
      this.pushPhoneMsg('Lịch Thi Đấu PSG', `⚠️ Tuần ${this.week} có trận: ${newFx.home} vs ${newFx.away}`, `Giải ${newFx.comp} (${newFx.round}). Hãy ra sân Parc des Princes để theo dõi trận đấu trước khi kết thúc tuần.`, true);
    }

    // Chuyển nhượng AI
    const aiClubs = this.clubs.filter((c) => c.name !== 'Paris Saint-Germain');
    const otherPlayers = this.players.filter((p) => p.club !== 'Paris Saint-Germain');
    if (otherPlayers.length > 10 && Math.random() < 0.45) {
      const p = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
      const dest = aiClubs[Math.floor(Math.random() * aiClubs.length)];
      if (dest && dest.name !== p.club && dest.budget >= p.value * 0.8) {
        const oldClub = p.club;
        p.club = dest.name;
        this.pushSocial('Fabrizio Romano', '@FabrizioRomano', `Here we go! ${dest.name} chiêu mộ ${p.name} từ ${oldClub} với giá €${p.value}M!`, 'neutral');
      }
    }

    // Sự kiện sống động có nguyên nhân - kết quả
    const roll = Math.random();
    if (roll < 0.32 && psgSquad.length > 0) {
      const target = psgSquad[Math.floor(Math.random() * Math.min(10, psgSquad.length))];
      if (target.injuryDays === 0) {
        target.injuryDays = 14;
        const evtText = `${target.name} bị căng cơ trong buổi tập! Trung tâm Y tế đã lập báo cáo (nghỉ 14 ngày).`;
        this.pushPhoneMsg('BS. Christophe Baudot (Y Tế)', `Báo cáo chấn thương: ${target.name}`, evtText, true);
        this.incomingCall = {
          caller: 'BS. Christophe Baudot · Trưởng Y Tế',
          summary: `${target.name} chấn thương nhẹ (14 ngày). Chủ tịch có duyệt phác đồ hồi phục nhanh (€0.6M → 7 ngày) không?`,
          acceptLabel: 'Duyệt hồi phục nhanh (-€0.6M)',
          rejectLabel: 'Điều trị tiêu chuẩn',
          onAccept: () => { target.injuryDays = 7; this.addLedger(`Phác đồ hồi phục ${target.name}`, -0.6); },
          onReject: () => {}
        };
        if (onLivingWorldEvent) onLivingWorldEvent(evtText);
      }
    }

    TaskAssignmentSystem.advanceTasks(this, 60);
    this.generateDailyBriefing();
    if (!this.getNextFixture()) this.concludeSeason();
    return { blocked: false };
  }

  runAutomaticMatchday(directive = 'none') {
    const fx = this.getCurrentWeekFixture() || this.getNextFixture();
    if (!fx) return null;
    const homeClub = this.clubs.find((c) => c.name === fx.home) || this.clubs[0];
    const awayClub = this.clubs.find((c) => c.name === fx.away) || this.clubs[1];
    const res = MatchSimulationEngine.simulateMatch(fx, homeClub, awayClub, this, directive);

    fx.played = true;
    fx.status = 'Đã kết thúc';
    fx.homeGoals = res.homeGoals;
    fx.awayGoals = res.awayGoals;
    this.lastMatchResult = res;
    this.matchReports.unshift(res.coachReport);
    if (this.matchReports.length > 30) this.matchReports.pop();

    // Cập nhật BXH, Lịch sử đối đầu và thống kê cầu thủ ĐỒNG BỘ 1:1
    simulateLigue1Round(this.clubs, fx, res.homeGoals, res.awayGoals);
    if (!this.headToHead) this.headToHead = {};
    RivalrySystem.recordResult(this.headToHead, fx.home, fx.away, res.homeGoals, res.awayGoals, fx.comp, this.season, res.goalEvents.map((e) => `${e.scorer} (${e.minute}')`));

    res.ratings.forEach((r) => {
      const pl = this.players.find((x) => x.id === r.id);
      if (!pl) return;
      pl.apps++;
      pl.goals += r.goals;
      pl.assists += r.assists;
      if (r.rating >= 7.8) {
        pl.form = Math.min(99, pl.form + 3);
        pl.morale = Math.min(100, pl.morale + 4);
        pl.value = +(pl.value + 1).toFixed(1);
      } else if (r.rating <= 5.9) {
        pl.form = Math.max(48, pl.form - 2);
        pl.morale = Math.max(38, pl.morale - 3);
      }
    });

    if (res.psgIsHome) this.addLedger(`Doanh thu bán vé & VIP Parc des Princes (${fx.comp})`, 4.2);
    if (res.psgWon) {
      this.loseStreak = 0;
      this.president.fanSupport = Math.min(100, this.president.fanSupport + 3);
      this.president.boardTrust = Math.min(100, this.president.boardTrust + 2);
      this.president.prestige = Math.min(100, this.president.prestige + 1);
      if (fx.comp === 'UEFA Champions League') this.addLedger('Tiền thưởng chiến thắng UEFA Champions League', 2.8);
    } else if (!res.psgDrew) {
      this.loseStreak++;
      this.president.fanSupport = Math.max(25, this.president.fanSupport - 4);
      this.president.boardTrust = Math.max(30, this.president.boardTrust - 3);
    }

    // Sinh bài báo sau trận & thông báo về Điện thoại Chủ tịch
    PressNewsSystem.generatePostMatchNews(this, res);
    this.pushPhoneMsg(
      'Trung Tâm Thi Đấu PSG',
      `🏁 KẾT QUẢ: ${fx.home} ${res.homeGoals} - ${res.awayGoals} ${fx.away} (${fx.comp})`,
      `Cầu thủ xuất sắc nhất: ${res.motm.name} (${res.motm.rating} điểm). Báo cáo chuyên môn của HLV ${this.coach.name} và các bài báo thể thao đã sẵn sàng.`,
      true
    );
    this.generateDailyBriefing();
    return res;
  }

  recordMatchOutcome(fixture, homeGoals, awayGoals, extra = {}) {
    fixture.played = true;
    fixture.homeGoals = homeGoals;
    fixture.awayGoals = awayGoals;
    if (!this.headToHead) this.headToHead = {};
    this.assignedTasks = [];
    this.newsArchive = [];
    this.matchReports = [];
    this.lastMatchResult = null;
    this.formationSystem = new SquadFormationSystem(this);
    if (this.fixtures[0]) PressNewsSystem.generatePreMatchNews(this, this.fixtures[0]);
    PressNewsSystem.createArticle(this, { scenarioId: 26, category: 'Nội bộ', tagType: 'Chính thức', title: 'Chủ tịch Phạm Minh Chiêu chính thức mở màn mùa giải mới cùng Paris Saint-Germain', summary: 'Ban lãnh đạo PSG khẳng định quyết tâm bảo vệ ngôi vương Ligue 1 và chinh phục UEFA Champions League.', body: 'Tại trụ sở hiện đại Campus PSG, Chủ tịch Phạm Minh Chiêu đã có buổi làm việc đầu mùa với 12 phòng ban và HLV trưởng Luis Enrique, đặt mục tiêu kết hợp giữa bản sắc bóng đá tấn công và sự phát triển bền vững của Học viện.', imageType: 'boardroom', imageCaption: 'BAN LÃNH ĐẠO PSG · MÙA GIẢI MỚI', relatedEntity: 'Chủ tịch Phạm Minh Chiêu', fanTone: 'win' });
    RivalrySystem.recordResult(this.headToHead, fixture.home, fixture.away, homeGoals, awayGoals, fixture.comp, this.season, extra.scorers || []);
    if (Array.isArray(extra.playerRatings)) {
      extra.playerRatings.forEach((pr) => {
        const pl = this.players.find((x) => x.id === pr.id || x.name === pr.name);
        if (!pl) return;
        if (pr.rating >= 7.6) {
          pl.morale = Math.min(100, pl.morale + 4);
          pl.form = Math.min(99, pl.form + 3);
          pl.value = +(pl.value + 1).toFixed(1);
        } else if (pr.rating <= 5.7) {
          pl.morale = Math.max(35, pl.morale - 3);
          pl.form = Math.max(45, pl.form - 2);
        }
      });
    }

    const psgIsHome = fixture.home === 'Paris Saint-Germain';
    const psgG = psgIsHome ? homeGoals : awayGoals;
    const oppG = psgIsHome ? awayGoals : homeGoals;
    const oppName = psgIsHome ? fixture.away : fixture.home;

    simulateLigue1Round(this.clubs, fixture, homeGoals, awayGoals);

    const psgAttackers = this.getPsgSquad().filter((p) => ['ST', 'LW', 'RW', 'AM', 'CM'].includes(p.position));
    for (let g = 0; g < psgG; g++) {
      if (psgAttackers.length > 0) psgAttackers[Math.floor(Math.random() * Math.min(6, psgAttackers.length))].goals++;
    }
    this.getPsgSquad().slice(0, 14).forEach((p) => p.apps++);

    if (psgIsHome) this.addLedger(`Doanh thu vé & VIP Parc des Princes (${fixture.comp})`, 4.2);

    if (psgG > oppG) {
      this.loseStreak = 0;
    this.headToHead = {};
    this.assignedTasks = [];
    this.newsArchive = [];
    this.matchReports = [];
    this.lastMatchResult = null;
    this.formationSystem = new SquadFormationSystem(this);
    if (this.fixtures[0]) PressNewsSystem.generatePreMatchNews(this, this.fixtures[0]);
    PressNewsSystem.createArticle(this, { scenarioId: 26, category: 'Nội bộ', tagType: 'Chính thức', title: 'Chủ tịch Phạm Minh Chiêu chính thức mở màn mùa giải mới cùng Paris Saint-Germain', summary: 'Ban lãnh đạo PSG khẳng định quyết tâm bảo vệ ngôi vương Ligue 1 và chinh phục UEFA Champions League.', body: 'Tại trụ sở hiện đại Campus PSG, Chủ tịch Phạm Minh Chiêu đã có buổi làm việc đầu mùa với 12 phòng ban và HLV trưởng Luis Enrique, đặt mục tiêu kết hợp giữa bản sắc bóng đá tấn công và sự phát triển bền vững của Học viện.', imageType: 'boardroom', imageCaption: 'BAN LÃNH ĐẠO PSG · MÙA GIẢI MỚI', relatedEntity: 'Chủ tịch Phạm Minh Chiêu', fanTone: 'win' });
      this.president.fanSupport = Math.min(100, this.president.fanSupport + 3);
      this.president.boardTrust = Math.min(100, this.president.boardTrust + 2);
      if (fixture.comp === 'UEFA Champions League') this.addLedger('Tiền thưởng thắng UEFA Champions League', 2.8);
      this.pushSocial('PSG Official', '@PSG_inside', `CHIẾN THẮNG! PSG đánh bại ${oppName} ${psgG}-${oppG} tại ${fixture.comp}!`, 'positive');
    } else if (psgG < oppG) {
      this.loseStreak++;
      this.president.fanSupport = Math.max(20, this.president.fanSupport - 5);
      this.president.boardTrust = Math.max(25, this.president.boardTrust - 4);
      this.pushSocial('L\'Équipe', '@lequipe', `Thất bại gây thất vọng: PSG thua ${oppName} ${psgG}-${oppG}.`, 'negative');
    } else {
      this.pushSocial('Canal+ Foot', '@CanalplusFoot', `Chia điểm kịch tính: PSG hòa ${oppName} ${psgG}-${oppG}.`, 'neutral');
    }
    this.generateDailyBriefing();
  }

  concludeSeason() {
    const ligue1 = this.clubs.filter((c) => c.league === 'Ligue 1').sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga));
    const champ = ligue1[0]?.name || 'Paris Saint-Germain';
    const psgRankIdx = ligue1.findIndex((c) => c.name === 'Paris Saint-Germain') + 1;
    const topScorer = this.getPsgSquad().sort((a, b) => b.goals - a.goals)[0];

    this.seasonHistory.unshift({
      season: this.season,
      ligue1Winner: champ,
      uclWinner: psgRankIdx === 1 ? 'Paris Saint-Germain' : 'Real Madrid',
      topScorer: topScorer ? `${topScorer.name} (${topScorer.goals} bàn)` : 'Ousmane Dembélé',
      psgRank: `Hạng ${psgRankIdx || 1}`,
      trophies: champ === 'Paris Saint-Germain' ? 'Vô địch Ligue 1' : 'Á quân Ligue 1',
      revenue: `€${Math.round(760 + this.president.prestige * 1.2)}M`
    });

    this.seasonNum++;
    const startY = 2025 + this.seasonNum;
    this.season = `${startY}/${String((startY + 1) % 100).padStart(2, '0')}`;
    this.week = 1;
    this.clubs.forEach((c) => { c.played = 0; c.won = 0; c.drawn = 0; c.lost = 0; c.gf = 0; c.ga = 0; c.pts = 0; });
    this.players.forEach((p) => { p.age++; p.goals = 0; p.assists = 0; p.apps = 0; p.contractYears = Math.max(1, p.contractYears - 1); });
    this.fixtures = MatchCalendarSystem.buildSeasonSchedule(this.clubs, startY);
    this.addLedger('Tiền thưởng kết thúc mùa giải & bản quyền truyền hình', 85.0);
    this.generateDailyBriefing();
  }
}
