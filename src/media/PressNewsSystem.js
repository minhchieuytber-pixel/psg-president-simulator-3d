// src/media/PressNewsSystem.js
// Hệ thống Báo chí thể thao chuyên nghiệp: 30 nhóm kịch bản (A: Trước trận 1-10, B: Sau trận 11-20, C: Chuyển nhượng & Nội bộ 21-30),
// Hệ thống tạo ảnh báo chí minh họa riêng theo từng bối cảnh (SVG editorial nhẹ, sắc nét trên iPhone), Bình luận CĐV & Kho lưu trữ tin tức

export class NewsImageSystem {
  // Tạo ảnh báo chí thể thao phong cách tạp chí (SVG Data URI chuẩn 16:9, siêu nhẹ cho iPhone, khác biệt theo từng sự kiện)
  static generateEditorialImage(sceneType, caption = 'PARIS SAINT-GERMAIN', accent = '#da291c', playerBadge = '10') {
    const palettes = {
      pre_clash: ['#07142b', '#0f2c59', '#da291c'],
      training: ['#0b2e1f', '#14532d', '#38bdf8'],
      celebration: ['#001a4d', '#003876', '#d4af37'],
      defeat: ['#111827', '#1f2937', '#ef4444'],
      goalkeeper: ['#0c1c38', '#1e3a8a', '#facc15'],
      transfer: ['#091224', '#1e1b4b', '#da291c'],
      boardroom: ['#1c1410', '#3b2518', '#d4af37'],
      fans: ['#00205b', '#7f1d1d', '#f8fafc'],
      trophy: ['#0f172a', '#1e3a8a', '#f59e0b']
    };
    const [c1, c2, c3] = palettes[sceneType] || palettes.pre_clash;

    let sceneArt = '';
    if (sceneType === 'celebration' || sceneType === 'trophy') {
      // Cầu thủ áo PSG giơ hai tay ăn mừng dưới ánh đèn Parc des Princes
      sceneArt = `
        <circle cx="120" cy="40" r="65" fill="${c3}" opacity="0.16"/>
        <circle cx="520" cy="40" r="65" fill="#38bdf8" opacity="0.15"/>
        <rect x="0" y="210" width="640" height="90" fill="#1b5e20" opacity="0.72"/>
        <circle cx="320" cy="112" r="24" fill="#e0ac82"/>
        <path d="M282,144 L358,144 L352,228 L288,228 Z" fill="#00205b"/>
        <rect x="311" y="144" width="18" height="84" fill="#da291c"/>
        <path d="M282,148 L244,98 L258,88 L294,136 Z" fill="#00205b"/>
        <path d="M358,148 L396,98 L382,88 L346,136 Z" fill="#00205b"/>
        <text x="320" y="196" fill="#fff" font-size="26" font-weight="800" text-anchor="middle" font-family="sans-serif">${playerBadge}</text>
        ${sceneType === 'trophy' ? `<polygon points="440,120 472,120 462,175 450,175" fill="#d4af37"/><rect x="444" y="175" width="24" height="12" fill="#111827"/>` : ''}`;
    } else if (sceneType === 'transfer') {
      // Chủ tịch & Tân binh cầm áo đấu PSG tại buổi ký hợp đồng
      sceneArt = `
        <rect x="24" y="24" width="592" height="252" rx="14" fill="rgba(255,255,255,0.04)" stroke="${c3}" stroke-opacity="0.35"/>
        <circle cx="220" cy="118" r="22" fill="#f2c6a0"/>
        <rect x="188" y="146" width="64" height="88" rx="8" fill="#0f172a"/>
        <rect x="216" y="146" width="8" height="44" fill="#da291c"/>
        <circle cx="420" cy="118" r="22" fill="#e0ac82"/>
        <rect x="388" y="146" width="64" height="88" rx="8" fill="#00205b"/>
        <rect x="412" y="146" width="16" height="88" fill="#da291c"/>
        <rect x="278" y="138" width="84" height="92" rx="6" fill="#00205b" stroke="#fff" stroke-width="2"/>
        <rect x="311" y="138" width="18" height="92" fill="#da291c"/>
        <text x="320" y="194" fill="#fff" font-size="28" font-weight="800" text-anchor="middle" font-family="sans-serif">${playerBadge}</text>`;
    } else if (sceneType === 'goalkeeper') {
      // Thủ môn bay người cứu thua trước khung thành
      sceneArt = `
        <rect x="0" y="210" width="640" height="90" fill="#1b5e20" opacity="0.78"/>
        <rect x="90" y="75" width="460" height="135" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.7"/>
        <circle cx="290" cy="145" r="20" fill="#f2c6a0"/>
        <rect x="255" y="130" width="110" height="34" rx="12" fill="#facc15" transform="rotate(-18 310 145)"/>
        <circle cx="408" cy="112" r="14" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>`;
    } else if (sceneType === 'boardroom') {
      // Phòng họp Ban Giám đốc & họp báo
      sceneArt = `
        <rect x="110" y="175" width="420" height="58" rx="10" fill="#4a2d20"/>
        <circle cx="220" cy="132" r="20" fill="#f2c6a0"/>
        <rect x="192" y="154" width="56" height="40" rx="6" fill="#0f172a"/>
        <circle cx="320" cy="126" r="22" fill="#f2c6a0"/>
        <rect x="290" y="150" width="60" height="44" rx="6" fill="#00205b"/>
        <circle cx="420" cy="132" r="20" fill="#e0ac82"/>
        <rect x="392" y="154" width="56" height="40" rx="6" fill="#1e293b"/>`;
    } else if (sceneType === 'training') {
      // Sân tập Campus PSG với HLV quan sát
      sceneArt = `
        <rect x="0" y="185" width="640" height="115" fill="#1e6b34"/>
        <line x1="0" y1="210" x2="640" y2="210" stroke="#fff" stroke-opacity="0.45" stroke-width="3"/>
        <circle cx="210" cy="132" r="18" fill="#c68652"/><rect x="190" y="154" width="40" height="62" rx="6" fill="#00205b"/>
        <circle cx="320" cy="128" r="18" fill="#8d5524"/><rect x="300" y="150" width="40" height="66" rx="6" fill="#00205b"/>
        <circle cx="465" cy="134" r="18" fill="#e0ac82"/><rect x="445" y="156" width="40" height="60" rx="6" fill="#1e293b"/>
        <circle cx="265" cy="214" r="9" fill="#fff"/>`;
    } else {
      // Đối đầu trước trận / CĐV / Thất bại
      sceneArt = `
        <rect x="0" y="210" width="640" height="90" fill="#14532d" opacity="0.65"/>
        <circle cx="210" cy="124" r="24" fill="#e0ac82"/>
        <rect x="174" y="154" width="72" height="82" rx="8" fill="#00205b"/>
        <rect x="202" y="154" width="16" height="82" fill="#da291c"/>
        <text x="320" y="176" fill="${c3}" font-size="38" font-weight="900" text-anchor="middle" font-family="sans-serif">VS</text>
        <circle cx="430" cy="124" r="24" fill="#f2c6a0"/>
        <rect x="394" y="154" width="72" height="82" rx="8" fill="#334155"/>`;
    }

    const safeCap = String(caption).replace(/[<>&"]/g, '').slice(0, 44);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs>
      <rect width="640" height="300" fill="url(#g)"/>
      ${sceneArt}
      <rect x="0" y="246" width="640" height="54" fill="rgba(5,10,22,0.82)"/>
      <rect x="18" y="258" width="6" height="28" fill="${c3}"/>
      <text x="34" y="278" fill="#f8fafc" font-size="18" font-weight="700" font-family="sans-serif">${safeCap}</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
}

export class PressNewsSystem {
  static outlets = ['L\'Équipe', 'Le Parisien Sport', 'France Football', 'RMC Sport', 'PSG Insider', 'Canal+ Foot'];

  // 30 nhóm kịch bản báo chí chuẩn hóa (A: 1-10 Trước trận, B: 11-20 Sau trận, C: 21-30 Chuyển nhượng & Nội bộ)
  static createArticle(state, cfg) {
    const {
      scenarioId, category, tagType = 'Chính thức', title, summary, body,
      imageType = 'pre_clash', imageCaption = 'PARIS SAINT-GERMAIN', relatedEntity = 'PSG',
      importance = 'Cao', fanTone = 'positive', badge = '10'
    } = cfg;
    const outlet = PressNewsSystem.outlets[(state.newsArchive.length + scenarioId) % PressNewsSystem.outlets.length];
    const comments = PressNewsSystem.generateFanComments(fanTone, relatedEntity);
    const article = {
      id: `news_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
      scenarioId,
      category,      // Tin PSG | Trước trận | Sau trận | Chuyển nhượng | Ligue 1 | Champions League | Nội bộ
      tagType,       // Chính thức | Tin đồn | Nhận định chuyên gia | Phản ứng CĐV
      outlet,
      date: `Tuần ${state.week} · ${state.dayName} (${state.season})`,
      title,
      summary,
      body,
      image: NewsImageSystem.generateEditorialImage(imageType, imageCaption, '#da291c', badge),
      relatedEntity,
      importance,
      read: false,
      saved: false,
      likes: 2400 + Math.floor(Math.random() * 22000),
      comments
    };
    state.newsArchive.unshift(article);
    if (state.newsArchive.length > 80) state.newsArchive.pop();
    return article;
  }

  static generateFanComments(tone, entity) {
    if (tone === 'win') {
      return [
        { user: '@Parisien_1970', text: 'Một trận đấu quá thuyết phục! Hàng công PSG chơi gắn kết và sắc bén thực sự.' },
        { user: '@Ultras_Auteuil', text: `${entity} xứng đáng nhận tràng pháo tay từ cả Parc des Princes!` },
        { user: '@Lucas_PSG', text: 'Hy vọng Chủ tịch Phạm Minh Chiêu và toàn đội tiếp tục giữ vững phong độ này.' }
      ];
    }
    if (tone === 'loss') {
      return [
        { user: '@Marc_Paris', text: 'Đây không phải màn trình diễn mà CĐV Paris mong đợi. HLV cần sớm rà soát lại hàng thủ.' },
        { user: '@Sophie_75', text: 'Chúng ta kiểm soát bóng nhiều nhưng bỏ lỡ quá nhiều cơ hội rõ rệt!' },
        { user: '@Jean_PSG', text: 'Tin tưởng Chủ tịch Phạm Minh Chiêu sẽ có những điều chỉnh kịp thời.' }
      ];
    }
    if (tone === 'transfer') {
      return [
        { user: '@Mercato_Paris', text: `Bản hợp đồng mang tên ${entity} hứa hẹn nâng tầm đội hình PSG!` },
        { user: '@Kylian_Fan', text: 'Liệu cậu ấy có hòa nhập nhanh với triết lý kiểm soát bóng của PSG không?' },
        { user: '@PSG_Vietnam', text: 'Chủ tịch Phạm Minh Chiêu làm chuyển nhượng rất quyết đoán và bài bản.' }
      ];
    }
    return [
      { user: '@ParcDesPrinces', text: `Mọi ánh mắt đang hướng về ${entity} trước giờ bóng lăn!` },
      { user: '@IciCestParis', text: 'Cổ động viên PSG luôn sẵn sàng tiếp lửa trên khán đài!' }
    ];
  }

  // Tự động tạo loạt bài báo NHÓM A (Trước trận đấu — Kịch bản 1 đến 10)
  static generatePreMatchNews(state, fixture) {
    const opp = fixture.home === 'Paris Saint-Germain' ? fixture.away : fixture.home;
    const star = state.getPsgSquad()[0]?.name || 'Ousmane Dembélé';
    const injured = state.getPsgSquad().filter((p) => p.injuryDays > 0);
    const isBig = fixture.importance >= 1.15;

    PressNewsSystem.createArticle(state, {
      scenarioId: isBig ? 1 : 2,
      category: fixture.comp === 'UEFA Champions League' ? 'Champions League' : 'Trước trận',
      tagType: 'Nhận định chuyên gia',
      title: isBig ? `Đại chiến rực lửa: PSG sẵn sàng quyết đấu ${opp} tại ${fixture.comp}!` : `PSG đứng trước cơ hội giành trọn 3 điểm trước ${opp}`,
      summary: `Paris Saint-Germain hoàn tất khâu chuẩn bị cuối cùng trước cuộc đối đầu ${opp} tại ${fixture.stadium}.`,
      body: `Trước thềm vòng đấu ${fixture.round} (${fixture.date} · ${fixture.time}), thầy trò HLV ${state.coach.name} đang tập trung tối đa cho cuộc chạm trán ${opp} tại ${fixture.stadium}. Ngôi sao ${star} đang đạt phong độ cao và được kỳ vọng sẽ tạo nên khác biệt. ${injured.length > 0 ? `Đáng lưu ý, PSG đang cân nhắc bài toán thể trạng khi ${injured.map((p) => p.name).join(', ')} cần theo dõi y tế.` : 'Tin vui là toàn bộ đội hình chính của PSG đều đạt thể trạng tốt nhất.'}`,
      imageType: isBig ? 'pre_clash' : 'training',
      imageCaption: `${fixture.home} vs ${fixture.away}`,
      relatedEntity: star,
      fanTone: 'neutral'
    });

    if (injured.length > 0) {
      PressNewsSystem.createArticle(state, {
        scenarioId: 5,
        category: 'Tin PSG',
        tagType: 'Chính thức',
        title: `Bài toán nhân sự: PSG thận trọng với thể trạng của ${injured[0].name}`,
        summary: `Trung tâm Y tế PSG xác nhận ${injured[0].name} chưa đạt 100% thể lực trước trận gặp ${opp}.`,
        body: `Bộ phận Y tế do BS. Christophe Baudot phụ trách đã gửi báo cáo lên Chủ tịch Phạm Minh Chiêu và HLV trưởng. Nhiều khả năng ban huấn luyện sẽ xoay tua hợp lý để đảm bảo lực lượng cho chặng đường dài.`,
        imageType: 'training',
        imageCaption: `Y TẾ PSG · ${injured[0].name}`,
        relatedEntity: injured[0].name,
        fanTone: 'neutral'
      });
    }
  }

  // Tự động tạo loạt bài báo NHÓM B (Sau trận đấu — Kịch bản 11 đến 20, chuẩn xác 100% dữ liệu trận)
  static generatePostMatchNews(state, res) {
    const score = `${res.homeGoals}-${res.awayGoals}`;
    const diff = res.psgGoals - res.oppGoals;
    const motm = res.motm?.name || 'Ousmane Dembélé';
    const cat = res.fixture.comp === 'UEFA Champions League' ? 'Champions League' : 'Sau trận';

    // Bài chính sau trận (Kịch bản 11 / 12 / 13 / 14)
    if (res.psgWon) {
      const scenarioId = res.lateWinner ? 12 : 11;
      const title = res.lateWinner
        ? `Nghẹt thở phút cuối! PSG hạ gục ${res.oppName} ${score} đầy cảm xúc!`
        : diff >= 3
          ? `PSG thắng áp đảo ${res.oppName} với tỷ số ${score} tại ${res.fixture.comp}!`
          : `PSG giành chiến thắng thuyết phục ${score} trước ${res.oppName}!`;
      PressNewsSystem.createArticle(state, {
        scenarioId, category: cat, tagType: 'Chính thức', title,
        summary: `Cầu thủ xuất sắc nhất ${motm} (${res.motm.rating} điểm) dẫn dắt PSG giành trọn niềm vui trước ${res.oppName}.`,
        body: `Tại ${res.fixture.stadium}, Paris Saint-Germain khép lại trận đấu với tỷ số ${res.fixture.home} ${score} ${res.fixture.away}. PSG kiểm soát ${res.psgIsHome ? res.stats.homePoss : res.stats.awayPoss}% bóng, tung ra ${res.psgIsHome ? res.stats.homeShots : res.stats.awayShots} cú sút (xG ${res.psgIsHome ? res.stats.homeXg : res.stats.awayXg}). Các bàn thắng của PSG được ghi do công của: ${res.goalEvents.filter((e) => e.team === 'Paris Saint-Germain').map((e) => `${e.scorer} (${e.minute}')`).join(', ') || 'hàng công PSG'}.`,
        imageType: 'celebration',
        imageCaption: `PSG ${score} ${res.oppName} · MOTM: ${motm}`,
        relatedEntity: motm,
        fanTone: 'win'
      });
    } else if (res.psgDrew) {
      PressNewsSystem.createArticle(state, {
        scenarioId: 13, category: cat, tagType: 'Chính thức',
        title: `PSG chia điểm đáng tiếc (${score}) trong cuộc đối đầu ${res.oppName}`,
        summary: `Dù tạo ra nhiều cơ hội, PSG không thể giữ trọn 3 điểm trước lối chơi kỷ luật của ${res.oppName}.`,
        body: `Trận đấu giữa ${res.fixture.home} và ${res.fixture.away} kết thúc với tỷ số hòa ${score}. ${motm} (${res.motm.rating} điểm) là điểm sáng lớn nhất của PSG, nhưng ban huấn luyện vẫn còn nhiều việc phải làm ở khâu tận dụng cơ hội.`,
        imageType: 'pre_clash',
        imageCaption: `HÒA ${score} · ${res.oppName}`,
        relatedEntity: motm,
        fanTone: 'neutral'
      });
    } else {
      PressNewsSystem.createArticle(state, {
        scenarioId: 14, category: cat, tagType: 'Chính thức',
        title: `PSG nhận thất bại ${score} trước ${res.oppName}: Bài học về sự tập trung`,
        summary: `Đội bóng thành Paris không thể vượt qua ${res.oppName} tại ${res.fixture.comp}, giới chuyên môn phân tích khâu phòng ngự.`,
        body: `Dù kiểm soát bóng ${res.psgIsHome ? res.stats.homePoss : res.stats.awayPoss}%, Paris Saint-Germain để thua ${score} trước ${res.oppName}. HLV ${state.coach.name} khẳng định đội bóng sẽ nhanh chóng đứng dậy và đã gửi báo cáo chuyên môn chi tiết lên Chủ tịch Phạm Minh Chiêu.`,
        imageType: 'defeat',
        imageCaption: `SAU TRẬN: ${res.fixture.home} ${score} ${res.fixture.away}`,
        relatedEntity: state.coach.name,
        fanTone: 'loss'
      });
    }

    // Bài phụ chuyên sâu (Thủ môn giữ sạch lưới #18 / Cầu thủ trẻ tỏa sáng #17 / Ngôi sao lập cú đúp #15)
    if (res.cleanSheet && res.gkRating) {
      PressNewsSystem.createArticle(state, {
        scenarioId: 18, category: 'Tin PSG', tagType: 'Nhận định chuyên gia',
        title: `Bức tường thép ${res.gkRating.name}: Giữ sạch lưới ấn tượng trước ${res.oppName}!`,
        summary: `Thủ thành ${res.gkRating.name} nhận điểm ${res.gkRating.rating} nhờ sự chắc chắn tuyệt đối trong khung gỗ PSG.`,
        body: `Những pha ra vào hợp lý và cản phá xuất sắc của ${res.gkRating.name} là nền tảng giúp Paris Saint-Germain bảo toàn mảnh lưới suốt 90 phút.`,
        imageType: 'goalkeeper',
        imageCaption: `CLEAN SHEET · ${res.gkRating.name}`,
        relatedEntity: res.gkRating.name,
        fanTone: 'win'
      });
    } else if (res.youngStar) {
      PressNewsSystem.createArticle(state, {
        scenarioId: 17, category: 'Tin PSG', tagType: 'Nhận định chuyên gia',
        title: `Tài năng trẻ ${res.youngStar.name} gây ấn tượng mạnh với điểm số ${res.youngStar.rating}!`,
        summary: `Cầu thủ ${res.youngStar.age} tuổi tận dụng xuất sắc cơ hội ra sân trong màu áo PSG.`,
        body: `Màn trình diễn tự tin của ${res.youngStar.name} cho thấy chính sách phát triển tài năng trẻ dưới thời Chủ tịch Phạm Minh Chiêu đang đi đúng hướng.`,
        imageType: 'celebration',
        imageCaption: `TÀI NĂNG TRẺ · ${res.youngStar.name}`,
        relatedEntity: res.youngStar.name,
        fanTone: 'win'
      });
    }
  }

  // NHÓM C: Tin chuyển nhượng & nội bộ (Kịch bản 21-30)
  static generateTransferNews(state, playerName, fromClub, fee, isOfficial = true) {
    PressNewsSystem.createArticle(state, {
      scenarioId: isOfficial ? 24 : 21,
      category: 'Chuyển nhượng',
      tagType: isOfficial ? 'Chính thức' : 'Tin đồn',
      title: isOfficial ? `CHÍNH THỨC: PSG chào đón tân binh ${playerName} từ ${fromClub}!` : `Tin đồn Mercato: PSG đang theo dõi sát sao ${playerName}`,
      summary: isOfficial ? `Chủ tịch Phạm Minh Chiêu hoàn tất thương vụ ${playerName} với mức phí €${fee}M.` : `Truyền thông châu Âu cho biết PSG đang cân nhắc chiêu mộ ${playerName}.`,
      body: isOfficial
        ? `Paris Saint-Germain chính thức công bố bản hợp đồng mới mang tên ${playerName} từ ${fromClub} với tổng mức phí €${fee}M. Chủ tịch Phạm Minh Chiêu và Giám đốc thể thao Luís Campos kỳ vọng tân binh sẽ lập tức nâng tầm sức mạnh đội bóng.`
        : `Theo nguồn tin chuyển nhượng, bộ phận tuyển trạch PSG đang theo sát phong độ của ${playerName}. Hiện chưa có đề nghị chính thức nào được xác nhận.`,
      imageType: 'transfer',
      imageCaption: `MERCATO · ${playerName.toUpperCase()}`,
      relatedEntity: playerName,
      fanTone: 'transfer'
    });
  }
}
