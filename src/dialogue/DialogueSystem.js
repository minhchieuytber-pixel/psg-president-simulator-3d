// src/dialogue/DialogueSystem.js
// Hệ thống hội thoại chuyên sâu theo từng chức vụ (18 nhóm vai trò), 15 tính cách NPC, Giao nhiệm vụ liên phòng ban thực tế & Hội thoại chủ động

export class NPCPersonalitySystem {
  static getReaction(personality, context = 'accept_task') {
    const map = {
      'Nhiệt tình': {
        accept_task: 'Tôi sẽ ưu tiên nhiệm vụ này ngay lập tức và cố gắng hoàn thành sớm hơn thời hạn Chủ tịch giao!',
        challenge: 'Tôi rất mong được chứng minh năng lực. Nếu có khó khăn tôi sẽ báo cáo ngay để xử lý kịp thời.'
      },
      'Cẩn thận': {
        accept_task: 'Tôi sẽ kiểm tra kỹ từng số liệu và quy trình trước khi trình Chủ tịch để đảm bảo độ chính xác tuyệt đối.',
        challenge: 'Tôi xin ghi nhận. Để tránh rủi ro, tôi đề nghị dành đủ thời gian rà soát dữ liệu từ các bộ phận liên quan.'
      },
      'Cẩn trọng': {
        accept_task: 'Tôi sẽ thẩm định kỹ mọi thông số trước khi gửi báo cáo chính thức lên máy tính của Chủ tịch.',
        challenge: 'Chúng ta cần thận trọng trước khi ra quyết định cuối cùng.'
      },
      'Tham vọng': {
        accept_task: 'Tôi sẽ hoàn thành xuất sắc nhiệm vụ này để khẳng định vị thế và tầm vóc của bộ phận mình tại PSG!',
        challenge: 'Nếu Chủ tịch duyệt thêm nguồn lực, chúng tôi có thể đạt kết quả vượt xa kỳ vọng ban đầu.'
      },
      'Thẳng thắn': {
        accept_task: 'Tôi nhận nhiệm vụ này, nhưng nói thẳng là tôi cần sự phối hợp đúng hạn từ các phòng ban liên quan.',
        challenge: 'Tôi xin chịu trách nhiệm phần chuyên môn của mình và sẽ báo cáo thẳng thắn mọi vướng mắc.'
      },
      'Ngoại giao': {
        accept_task: 'Tôi sẽ khéo léo kết nối các bên liên quan để nhiệm vụ đạt đồng thuận cao nhất.',
        challenge: 'Tôi hiểu kỳ vọng của Chủ tịch và sẽ cân bằng lợi ích các bộ phận để đạt kết quả ổn định.'
      },
      'Bảo thủ': {
        accept_task: 'Tôi tiếp nhận chỉ đạo, đồng thời sẽ ưu tiên phương án an toàn và tiết kiệm ngân sách tối đa.',
        challenge: 'Tôi vẫn khuyến nghị giữ kỷ luật tài chính chặt chẽ trong mọi phương án triển khai.'
      },
      'Hòa đồng': {
        accept_task: 'Vâng thưa Chủ tịch! Tôi sẽ trao đổi ngay với anh em trong phòng để bắt tay triển khai thật hiệu quả.',
        challenge: 'Không khí làm việc đang rất tốt, tôi tin cả nhóm sẽ phối hợp nhịp nhàng.'
      },
      'Ít nói': {
        accept_task: 'Đã rõ thưa Chủ tịch. Tôi sẽ làm ngay và gửi văn bản lên hệ thống.',
        challenge: 'Tôi sẽ rà soát hồ sơ và phản hồi bằng số liệu cụ thể.'
      },
      'Thiếu trách nhiệm': {
        accept_task: 'Tôi sẽ cố gắng sắp xếp... có thể sẽ cần thêm chút thời gian nếu phát sinh việc khác.',
        challenge: 'Việc này khá phức tạp, tôi không dám chắc có kịp ngay trong tuần không.'
      }
    };
    const p = map[personality] || map['Cẩn thận'];
    return p[context] || p.accept_task;
  }
}

export class RoleDialogueDatabase {
  static getRoleKey(npc) {
    const id = npc.id || '';
    if (id === 'npc_ceo') return 'ceo';
    if (id === 'npc_vp') return 'vp';
    if (id === 'npc_sporting') return 'sporting';
    if (id === 'npc_cfo') return 'cfo';
    if (id === 'npc_tr1') return 'transfers';
    if (id === 'npc_scout' || id === 'npc_scout2') return 'scouting';
    if (id === 'npc_coach' || id === 'npc_asst') return 'coach';
    if (id === 'npc_pcare') return 'player_care';
    if (id === 'npc_hr') return 'hr';
    if (id === 'npc_media') return 'media';
    if (id === 'npc_mkt') return 'marketing';
    if (id === 'npc_legal') return 'legal';
    if (id === 'npc_acad') return 'academy';
    if (id === 'npc_med') return 'medical';
    if (id === 'npc_fac' || id === 'npc_sec') return 'facilities';
    if (id === 'npc_recep') return 'reception';
    if (npc.name === 'Marquinhos') return 'captain';
    if (npc.isPlayer) return 'player';
    return 'ceo';
  }

  static buildMenu(npc, state) {
    const rk = RoleDialogueDatabase.getRoleKey(npc);
    const f = state.finance;
    const squad = state.getPsgSquad();
    const injured = squad.filter((p) => p.injuryDays > 0);
    const expiring = squad.filter((p) => p.contractYears <= 1);
    const nextFx = state.getCurrentWeekFixture() || state.getNextFixture();

    const menus = {
      ceo: {
        greeting: `Chào Chủ tịch Phạm Minh Chiêu. Toàn bộ khối điều hành PSG đang bám sát kế hoạch Tuần ${state.week}, tuy nhiên có một số hạng mục quan trọng cần ngài trực tiếp cho ý kiến.`,
        options: [
          { type: 'talk', label: '🗣️ "Tình hình hoạt động chung của CLB hôm nay thế nào?"', reply: `Thưa Chủ tịch, ngân sách hiện ở mức €${f.budget.toFixed(1)}M, ${state.pendingReports.length} báo cáo phòng ban đang chờ ngài duyệt. ${nextFx ? `Trọng tâm tuần này là trận ${nextFx.home} vs ${nextFx.away}.` : 'Hoạt động ổn định.'}` },
          { type: 'talk', label: '📊 "Hãy báo cáo 3 vấn đề quan trọng nhất."', reply: `Thứ nhất là kiểm soát quỹ lương tuần (€${f.weeklyWages}M/tuần). Thứ hai là danh sách mục tiêu chuyển nhượng của Luís Campos. Thứ ba là tiến độ KPI của 12 phòng ban. Tôi đã tổng hợp đầy đủ trên mục Báo cáo máy tính macOS.` },
          { type: 'task', label: '📌 Giao nhiệm vụ: Rà soát hoạt động toàn bộ 12 phòng ban', taskTitle: 'Rà soát tiến độ & KPI toàn bộ 12 phòng ban PSG', collab: 'Tổng Giám Đốc → 12 Trưởng phòng ban', priority: 'Cao', resultKey: 'dept_audit' },
          { type: 'task', label: '📈 Giao nhiệm vụ: Xây dựng kế hoạch phát triển PSG mùa tới', taskTitle: 'Xây dựng Kế hoạch chiến lược PSG mùa giải mới', collab: 'CEO → GĐ Thể thao & Giám đốc Tài chính', priority: 'Khẩn cấp', resultKey: 'season_plan' },
          { type: 'challenge', label: '⚠️ Chất vấn: "Tại sao một số kế hoạch vẫn chậm tiến độ?"', reply: 'Tôi xin nhận trách nhiệm về việc phối hợp giữa vài bộ phận chưa thực sự nhịp nhàng. Tôi sẽ trực tiếp kiểm tra tiến độ mỗi ngày và không để tái diễn.' },
          { type: 'praise', label: '👏 Khen ngợi công tác điều hành chung (+Hài lòng, +Quan hệ)', reply: 'Cảm ơn sự tin tưởng của Chủ tịch Phạm Minh Chiêu. Ban điều hành sẽ tiếp tục duy trì kỷ luật cao nhất.' }
        ]
      },
      vp: {
        greeting: 'Kính chào Chủ tịch Phạm Minh Chiêu. Tôi vừa hoàn tất trao đổi với một số đối tác chiến lược và sẵn sàng tiếp nhận chỉ đạo từ ngài.',
        options: [
          { type: 'talk', label: '🗣️ "Anh đánh giá thế nào về tình hình hiện tại của PSG?"', reply: `Đội bóng có nhiều tín hiệu tích cực với uy tín ${state.president.prestige}/100 và sự ủng hộ CĐV ${state.president.fanSupport}%. Tuy nhiên chúng ta cần duy trì chiều sâu đội hình và sự ổn định tài chính.` },
          { type: 'task', label: '📌 Giao nhiệm vụ: Thay Chủ tịch giám sát các phòng ban tuần này', taskTitle: 'Giám sát vận hành các phòng ban thay Chủ tịch', collab: 'Phó Chủ Tịch → Khối Hành chính & Chuyên môn', priority: 'Cao', resultKey: 'vp_supervise' },
          { type: 'talk', label: '💡 "Anh có đề xuất gì để cải thiện hiệu quả điều hành?"', reply: 'Tôi đề xuất duy trì họp giao ban định kỳ hàng tuần, gắn KPI rõ ràng cho từng trưởng phòng và quy định người chịu trách nhiệm cụ thể cho mọi đầu việc.' },
          { type: 'praise', label: '👏 Khen ngợi vai trò đối ngoại của Phó Chủ tịch', reply: 'Rất cảm ơn Chủ tịch. Tôi sẽ tiếp tục củng cố vị thế thương hiệu PSG tại châu Âu.' }
        ]
      },
      sporting: {
        greeting: 'Chào Chủ tịch Phạm Minh Chiêu! Tôi đang theo dõi sát báo cáo tuyển trạch và kế hoạch nhân sự đội một PSG.',
        options: [
          { type: 'talk', label: '⚽ "Hãy báo cáo tình hình lực lượng hiện tại."', reply: `Đội một hiện có ${squad.length} cầu thủ (${injured.length} ca chấn thương, ${expiring.length} cầu thủ sắp hết hợp đồng). Chúng ta đủ bộ khung chính nhưng nên ưu tiên bổ sung thêm tiền vệ phòng ngự và phương án dự phòng hàng công.` },
          { type: 'task', label: '🎯 Giao nhiệm vụ: Tìm kiếm 5 tiền đạo phù hợp với PSG', taskTitle: 'Tìm kiếm & đánh giá 5 tiền đạo mục tiêu cho PSG', collab: 'GĐ Thể thao → Phòng Chuyển nhượng → Phòng Tuyển trạch', priority: 'Khẩn cấp', resultKey: 'scout_strikers' },
          { type: 'task', label: '🌟 Giao nhiệm vụ: Tìm một tiền vệ đẳng cấp thế giới', taskTitle: 'Lập hồ sơ mục tiêu tiền vệ đẳng cấp thế giới', collab: 'GĐ Thể thao → Mạng lưới Tuyển trạch Châu Âu', priority: 'Cao', resultKey: 'scout_midfielders' },
          { type: 'task', label: '📋 Giao nhiệm vụ: Đánh giá cầu thủ không còn trong kế hoạch', taskTitle: 'Rà soát cầu thủ ít thi đấu để đề xuất bán hoặc cho mượn', collab: 'GĐ Thể thao → HLV Luis Enrique', priority: 'Trung bình', resultKey: 'squad_trim' },
          { type: 'talk', label: '🔍 "Có cầu thủ nào đang muốn rời PSG không?"', reply: `Tôi đang kiểm tra nguyện vọng từng người. ${expiring.length > 0 ? `Đáng chú ý có ${expiring.slice(0, 3).map((p) => p.name).join(', ')} chỉ còn 1 năm hợp đồng.` : 'Hiện tại tinh thần gắn bó của các trụ cột rất ổn định.'}` },
          { type: 'praise', label: '👏 Ghi nhận tầm nhìn chuyển nhượng của Luís Campos', reply: 'Cảm ơn Chủ tịch! Với sự hậu thuẫn của ngài, chúng ta sẽ xây dựng một tập thể đủ sức chinh phục Champions League.' }
        ]
      },
      cfo: {
        greeting: `Thưa Chủ tịch Phạm Minh Chiêu, tôi đang rà soát bảng cân đối tài chính Tuần ${state.week}. Mọi khoản chi đều cần cân đối chặt chẽ theo Luật FFP.`,
        options: [
          { type: 'talk', label: '💶 "Hãy báo cáo tình hình tài chính hiện tại."', reply: `Báo cáo số liệu thực tế: Ngân sách tổng đạt €${f.budget.toFixed(1)}M, quỹ chuyển nhượng còn €${f.transferBudget.toFixed(1)}M, quỹ lương tuần €${f.weeklyWages}M/tuần. Trạng thái Luật Công Bằng Tài Chính: ${f.ffpStatus}.` },
          { type: 'talk', label: '📊 "Tình hình ngân sách chuyển nhượng thế nào?"', reply: `Với €${f.transferBudget.toFixed(1)}M hiện có, PSG đủ sức hoàn tất 1–2 thương vụ trọng điểm. Tuy nhiên nếu kích hoạt bom tấn trên €100M, tôi đề xuất xác định hạn mức lương trước khi đàm phán.` },
          { type: 'task', label: '📈 Giao nhiệm vụ: Xây dựng kế hoạch tăng doanh thu theo quý', taskTitle: 'Lập kế hoạch tăng trưởng doanh thu thương mại & tài trợ', collab: 'GĐ Tài chính → Phòng Marketing & Thương mại', priority: 'Cao', resultKey: 'rev_growth' },
          { type: 'task', label: '✂️ Giao nhiệm vụ: Kiểm tra & tối ưu chi phí vận hành', taskTitle: 'Kiểm toán chi phí vận hành 12 phòng ban', collab: 'GĐ Tài chính → Khối Kế toán Nội bộ', priority: 'Trung bình', resultKey: 'cost_audit' },
          { type: 'task', label: '📑 Giao nhiệm vụ: Lập 3 phương án ngân sách (Thận trọng / Cân bằng / Mở rộng)', taskTitle: 'Xây dựng 3 kịch bản ngân sách mùa giải', collab: 'GĐ Tài chính → Ban Điều Hành', priority: 'Cao', resultKey: 'budget_3plans' }
        ]
      },
      transfers: {
        greeting: 'Chào Chủ tịch! Phòng Chuyển nhượng đang duy trì liên lạc trực tiếp với các đại diện cầu thủ và CLB đối tác tại châu Âu.',
        options: [
          { type: 'task', label: '🛡️ Giao nhiệm vụ: Tìm trung vệ chất lượng (so sánh phương án trẻ & kinh nghiệm)', taskTitle: 'So sánh hồ sơ trung vệ trẻ và trung vệ kinh nghiệm', collab: 'Phòng Chuyển nhượng → Phòng Tuyển trạch', priority: 'Cao', resultKey: 'scout_cb' },
          { type: 'talk', label: '🤝 "Tiến độ đàm phán với các CLB đối tác thế nào?"', reply: 'Một số CLB đối tác đang đẩy giá cao hơn giá thị trường 12–15%. Nếu Chủ tịch không chấp nhận mức giá đó, chúng tôi sẽ kiên quyết hạ giá đề nghị hoặc chuyển sang mục tiêu dự phòng.' },
          { type: 'task', label: '💼 Giao nhiệm vụ: Tổng hợp lời đề nghị hỏi mua cầu thủ PSG', taskTitle: 'Tổng hợp đề nghị chuyển nhượng dành cho cầu thủ PSG', collab: 'Phòng Chuyển nhượng → GĐ Thể thao', priority: 'Trung bình', resultKey: 'outgoing_offers' }
        ]
      },
      scouting: {
        greeting: 'Kính chào Chủ tịch Phạm Minh Chiêu! Các tuyển trạch viên của chúng tôi đang theo dõi sát 5 giải VĐQG hàng đầu châu Âu.',
        options: [
          { type: 'talk', label: '🔭 "Công tác tìm kiếm tài năng hiện tại thế nào?"', reply: 'Chúng tôi đang cập nhật dữ liệu của 200 cầu thủ thật trên toàn cầu. Nhiều tài năng dưới 21 tuổi đã lọt vào danh sách ưu tiên về kỹ thuật và tư duy chiến thuật.' },
          { type: 'task', label: '🌱 Giao nhiệm vụ: Tìm tài năng trẻ U21 tiềm năng 88+', taskTitle: 'Lập danh sách tài năng U21 tiềm năng 88+ tại Châu Âu', collab: 'Phòng Tuyển trạch → Phân tích Video', priority: 'Cao', resultKey: 'scout_u21' },
          { type: 'task', label: '🧤 Giao nhiệm vụ: Tìm thủ môn trẻ kế cận giàu tiềm năng', taskTitle: 'Tìm kiếm thủ môn trẻ tiềm năng cho PSG', collab: 'Phòng Tuyển trạch → HLV Thủ môn', priority: 'Trung bình', resultKey: 'scout_gk' },
          { type: 'task', label: '📄 Giao nhiệm vụ: Rà soát cầu thủ sắp hết hợp đồng (Free Agent)', taskTitle: 'Danh sách cầu thủ chất lượng còn 1 năm hợp đồng', collab: 'Phòng Tuyển trạch → Phòng Pháp chế', priority: 'Cao', resultKey: 'scout_expiring' }
        ]
      },
      coach: {
        greeting: 'Chào Chủ tịch Phạm Minh Chiêu! Tôi đang theo dõi sát cường độ tập luyện và sơ đồ chiến thuật của đội một.',
        options: [
          { type: 'talk', label: '⚽ "Anh đánh giá thế nào về phong độ đội bóng?"', reply: `Đội hình đang vận hành sơ đồ ${state.coach.formation}. Khả năng kiểm soát bóng tốt nhưng chúng tôi đang rèn thêm khả năng chuyển trạng thái và chống phản công cho trận gặp ${nextFx ? (nextFx.home === 'Paris Saint-Germain' ? nextFx.away : nextFx.home) : 'đối thủ tiếp theo'}.` },
          { type: 'task', label: '📋 Giao nhiệm vụ: Lập kế hoạch chuẩn bị trận đấu tiếp theo', taskTitle: `Kế hoạch chiến thuật cho trận ${nextFx ? `${nextFx.home} vs ${nextFx.away}` : 'sắp tới'}`, collab: 'HLV Trưởng → Ban Huấn Luyện & Phân tích Video', priority: 'Khẩn cấp', resultKey: 'match_prep' },
          { type: 'task', label: '🛡️ Giao nhiệm vụ: Tăng cường bài tập tổ chức phòng ngự', taskTitle: 'Chuyên đề tập luyện bọc lót & chống phản công', collab: 'HLV Trưởng → Hàng phòng ngự PSG', priority: 'Cao', resultKey: 'def_drill' },
          { type: 'task', label: '🎓 Giao nhiệm vụ: Đánh giá và trao cơ hội cho cầu thủ trẻ Học viện', taskTitle: 'Tuyển chọn cầu thủ U19 lên tập cùng đội một', collab: 'HLV Trưởng → GĐ Học viện Yohan Cabaye', priority: 'Trung bình', resultKey: 'youth_chance' },
          { type: 'challenge', label: '⚠️ Chất vấn: "Tôi muốn đội bóng thi đấu ổn định và bản lĩnh hơn!"', reply: 'Tôi hiểu kỳ vọng rất cao của Chủ tịch. Tôi chịu trách nhiệm hoàn toàn về mặt chuyên môn và sẽ điều chỉnh cường độ tập ngay lập tức.' }
        ]
      },
      player_care: {
        greeting: 'Chào Chủ tịch Phạm Minh Chiêu! Tôi luôn theo sát đời sống, tâm lý và sự gắn bó của các cầu thủ đội một.',
        options: [
          { type: 'talk', label: '💬 "Có cầu thủ nào đang không hài lòng tại PSG không?"', reply: `Đa số cầu thủ đạt mức hài lòng tốt, nhưng một vài cầu thủ dự bị mong muốn có thêm phút thi đấu. Ngoài ra có ${expiring.length} cầu thủ sắp đáo hạn hợp đồng cần quan tâm sớm.` },
          { type: 'task', label: '🤝 Giao nhiệm vụ: Gặp riêng & ổn định tâm lý cầu thủ bất mãn', taskTitle: 'Gặp riêng lắng nghe và ổn định tâm lý cầu thủ đội một', collab: 'Quản lý Cầu thủ → Đội trưởng Marquinhos', priority: 'Cao', resultKey: 'player_morale' },
          { type: 'task', label: '📝 Giao nhiệm vụ: Lập danh sách cầu thủ cần gia hạn sớm', taskTitle: 'Báo cáo lộ trình gia hạn hợp đồng trụ cột', collab: 'Quản lý Cầu thủ → Phòng Pháp chế & Tài chính', priority: 'Cao', resultKey: 'contract_list' }
        ]
      },
      hr: {
        greeting: 'Kính chào Chủ tịch! Phòng Nhân sự đang theo dõi hiệu suất làm việc của toàn bộ 181 nhân sự khối văn phòng PSG.',
        options: [
          { type: 'talk', label: '👥 "Tình hình nhân sự của CLB hiện tại thế nào?"', reply: 'Các phòng ban đã được bố trí nhân sự đầy đủ theo mặt bằng mới. Chúng tôi đang đánh giá KPI quý và theo dõi sự hài lòng nội bộ.' },
          { type: 'task', label: '📋 Giao nhiệm vụ: Khảo sát mức độ hài lòng & xử lý mâu thuẫn nội bộ', taskTitle: 'Khảo sát nội bộ & gắn kết nhân sự 12 phòng ban', collab: 'Phòng Nhân sự → 12 Trưởng bộ phận', priority: 'Trung bình', resultKey: 'hr_survey' },
          { type: 'task', label: '🎓 Giao nhiệm vụ: Xây dựng chương trình đào tạo nâng cao năng lực', taskTitle: 'Chương trình đào tạo chuyên môn quản lý bóng đá', collab: 'Phòng Nhân sự → Ban Điều Hành', priority: 'Trung bình', resultKey: 'hr_training' }
        ]
      },
      media: {
        greeting: 'Chào Chủ tịch Phạm Minh Chiêu! Phòng Truyền thông đang theo dõi sát phản ứng của báo chí Pháp và cộng đồng CĐV Paris.',
        options: [
          { type: 'talk', label: '📰 "Người hâm mộ đang phản ứng thế nào về PSG?"', reply: `Mức độ ủng hộ của CĐV hiện đạt ${state.president.fanSupport}%. Mạng xã hội đang bàn luận sôi nổi về trận đấu tuần này và các mục tiêu chuyển nhượng mới.` },
          { type: 'task', label: '🎙️ Giao nhiệm vụ: Tổ chức họp báo trước trận & thông cáo báo chí', taskTitle: 'Họp báo trước trận & chiến dịch truyền thông tích cực', collab: 'Phòng Truyền thông → HLV Trưởng', priority: 'Cao', resultKey: 'media_pr' },
          { type: 'task', label: '🛡️ Giao nhiệm vụ: Xử lý các tin đồn tiêu cực trên mạng xã hội', taskTitle: 'Xác minh & đính chính thông tin sai lệch về PSG', collab: 'Phòng Truyền thông → Phòng Pháp chế', priority: 'Khẩn cấp', resultKey: 'media_crisis' }
        ]
      },
      marketing: {
        greeting: 'Chào Chủ tịch! Chúng tôi đang triển khai các chiến dịch thương mại toàn cầu và tìm kiếm đối tác tài trợ mới cho Parc des Princes.',
        options: [
          { type: 'talk', label: '💼 "Doanh thu thương mại của PSG hiện tại thế nào?"', reply: 'Các hợp đồng tài trợ chính hoạt động tốt, doanh số áo đấu tăng mạnh khi đội thắng trận. Chúng tôi đang nhắm thêm các đối tác công nghệ quốc tế.' },
          { type: 'task', label: '💰 Giao nhiệm vụ: Tìm kiếm nhà tài trợ mới (+Doanh thu)', taskTitle: 'Đàm phán gói tài trợ thương mại khu vực mới', collab: 'Phòng Marketing → Phòng Tài chính & Pháp chế', priority: 'Cao', resultKey: 'mkt_sponsor' },
          { type: 'task', label: '👕 Giao nhiệm vụ: Chiến dịch đẩy mạnh doanh số áo đấu & sự kiện CĐV', taskTitle: 'Chiến dịch quảng bá áo đấu & Fan Festival Paris', collab: 'Phòng Marketing → Phòng Truyền thông', priority: 'Trung bình', resultKey: 'mkt_merch' }
        ]
      },
      legal: {
        greeting: 'Kính chào Chủ tịch Phạm Minh Chiêu. Phòng Pháp chế luôn đảm bảo mọi hợp đồng chuyển nhượng và tài trợ đều chặt chẽ về pháp lý.',
        options: [
          { type: 'talk', label: '⚖️ "Các hợp đồng của CLB có vấn đề pháp lý nào cần lưu ý?"', reply: 'Một số điều khoản thưởng thành tích Champions League và bản quyền hình ảnh cần rà soát kỹ trước khi ký gia hạn.' },
          { type: 'task', label: '📜 Giao nhiệm vụ: Rà soát điều khoản hợp đồng chuyển nhượng & tài trợ', taskTitle: 'Thẩm định rủi ro pháp lý hợp đồng mùa giải', collab: 'Phòng Pháp chế → Phòng Tài chính', priority: 'Cao', resultKey: 'legal_review' }
        ]
      },
      academy: {
        greeting: 'Chào Chủ tịch! Học viện bóng đá PSG đang đào tạo 100 cầu thủ trẻ từ U15 đến Đội dự bị theo đúng triết lý của CLB.',
        options: [
          { type: 'talk', label: '🎓 "Hãy báo cáo những tài năng nổi bật của Học viện."', reply: `Hiện có ${state.academy.filter((y) => y.pot >= 86 && !y.promoted).length} viên ngọc thô có tiềm năng trên 86 đang tiến bộ vượt bậc ở đội U19 và Đội dự bị.` },
          { type: 'task', label: '⭐ Giao nhiệm vụ: Đánh giá toàn bộ U19 & đề xuất đôn lên Đội 1', taskTitle: 'Tuyển chọn gương mặt U19 xuất sắc tập cùng Đội một', collab: 'Học viện PSG → HLV Luis Enrique', priority: 'Cao', resultKey: 'acad_eval' }
        ]
      },
      medical: {
        greeting: 'Kính chào Chủ tịch Phạm Minh Chiêu. Trung tâm Y tế đang theo dõi sát tải lượng tập luyện để hạn chế tối đa chấn thương.',
        options: [
          { type: 'talk', label: '🏥 "Tình hình sức khỏe của đội hình hiện tại thế nào?"', reply: injured.length > 0 ? `Hiện có ${injured.length} ca chấn thương: ${injured.map((p) => `${p.name} (còn ${p.injuryDays} ngày)`).join(', ')}. Các cầu thủ còn lại đạt thể trạng tốt.` : 'Tin vui thưa Chủ tịch: 100% cầu thủ đội một đều sung mãn, không có ca chấn thương nào.' },
          { type: 'task', label: '💊 Giao nhiệm vụ: Kiểm tra thể lực toàn đội & phối hợp giảm tải tập', taskTitle: 'Kiểm tra sinh trắc & tối ưu phác đồ hồi phục đội một', collab: 'Trung tâm Y tế → Ban Huấn Luyện', priority: 'Cao', resultKey: 'med_check' }
        ]
      },
      facilities: {
        greeting: 'Chào Chủ tịch! Chúng tôi đang bảo trì định kỳ mặt cỏ sân tập, Parc des Princes và đảm bảo an ninh khuôn viên.',
        options: [
          { type: 'talk', label: '🏟️ "Tình trạng cơ sở vật chất của PSG hiện tại thế nào?"', reply: 'Trụ sở mới 4 phân khu, các sân tập và xe buýt đội bóng đều hoạt động tốt. Hệ thống chiếu sáng và khu hồi phục cần kiểm tra định kỳ trước trận cầu lớn.' },
          { type: 'task', label: '🔧 Giao nhiệm vụ: Kiểm tra sân tập, phòng Gym & hệ thống chiếu sáng SVĐ', taskTitle: 'Bảo trì tổng thể sân tập, phòng Gym & Parc des Princes', collab: 'Quản lý CSVC → Trung tâm Y tế', priority: 'Trung bình', resultKey: 'fac_maint' }
        ]
      },
      reception: {
        greeting: 'Kính chào Chủ tịch Phạm Minh Chiêu! Em là Élodie ở quầy lễ tân. Hôm nay có nhiều lịch hẹn quan trọng của ngài.',
        options: [
          { type: 'talk', label: '📅 "Hôm nay có lịch làm việc gì quan trọng?"', reply: `Thưa Chủ tịch, hôm nay có lịch họp Ban Giám đốc, ${state.pendingReports.length} báo cáo chờ duyệt trên máy tính macOS và đại diện đối tác thương mại đang chờ xác nhận lịch.` },
          { type: 'task', label: '📞 Giao nhiệm vụ: Liên hệ CEO & các trưởng phòng xác nhận lịch họp', taskTitle: 'Điều phối & xác nhận lịch họp Ban Giám Đốc', collab: 'Lễ tân → Phòng Tổng Giám Đốc', priority: 'Trung bình', resultKey: 'recep_sched' }
        ]
      },
      captain: {
        greeting: 'Chào Chủ tịch Phạm Minh Chiêu! Anh em trong phòng thay đồ đều rất tập trung cho mục tiêu vô địch mùa này.',
        options: [
          { type: 'talk', label: '©️ "Cậu đánh giá thế nào về tinh thần toàn đội?"', reply: 'Toàn đội đoàn kết và tôn trọng triết lý của HLV Luis Enrique. Một số cầu thủ trẻ rất háo hức được Chủ tịch quan tâm.' },
          { type: 'task', label: '🔥 Giao nhiệm vụ: Động viên toàn đội & gắn kết phòng thay đồ trước trận', taskTitle: 'Họp nội bộ cầu thủ & củng cố tinh thần trước trận đấu', collab: 'Đội trưởng Marquinhos → Tập thể Đội một PSG', priority: 'Cao', resultKey: 'cap_rally' },
          { type: 'praise', label: '👏 Khen ngợi vai trò thủ lĩnh của Marquinhos', reply: 'Cảm ơn Chủ tịch! Được đeo băng đội trưởng Paris Saint-Germain là vinh dự lớn nhất sự nghiệp của tôi.' }
        ]
      },
      player: {
        greeting: `Chào Chủ tịch Phạm Minh Chiêu! Rất vinh dự được nói chuyện trực tiếp với ngài tại Campus PSG.`,
        options: [
          { type: 'praise', label: '⭐ "Tôi đã theo dõi cậu thi đấu gần đây — rất ấn tượng!"', reply: 'Cảm ơn Chủ tịch Phạm Minh Chiêu! Sự ghi nhận của ngài là động lực cực lớn để tôi tiếp tục bùng nổ tại Parc des Princes!' },
          { type: 'talk', label: '💪 "Cậu cảm thấy thế nào về vai trò và thời gian thi đấu hiện tại?"', reply: 'Tôi luôn khao khát được ra sân cống hiến tối đa cho PSG. Tôi sẽ nỗ lực hết mình trong từng buổi tập để thuyết phục HLV.' },
          { type: 'talk', label: '✍️ "Cậu có dự định gắn bó lâu dài với Paris Saint-Germain không?"', reply: 'PSG là CLB tuyệt vời với tham vọng vô địch Champions League. Nếu ban lãnh đạo tin tưởng, tôi sẵn sàng ngồi vào bàn đàm phán gia hạn hợp đồng!' }
        ]
      }
    };
    return menus[rk] || menus.ceo;
  }
}

export class TaskAssignmentSystem {
  static createTask(state, npc, opt) {
    const task = {
      id: `task_${Date.now()}_${Math.floor(Math.random() * 999)}`,
      title: opt.taskTitle,
      assignedBy: 'Chủ tịch Phạm Minh Chiêu',
      owner: `${npc.name} (${npc.role})`,
      ownerId: npc.id,
      dept: npc.dept,
      collaborators: opt.collab || npc.dept,
      assignedWeek: state.week,
      deadlineWeek: state.week + 1,
      priority: opt.priority || 'Trung bình',
      status: 'Đã tiếp nhận', // Chưa tiếp nhận | Đã tiếp nhận | Đang thực hiện | Gặp khó khăn | Hoàn thành
      progress: 15,
      resultKey: opt.resultKey || 'general',
      finalReport: null
    };
    if (!state.assignedTasks) state.assignedTasks = [];
    state.assignedTasks.unshift(task);
    npc.task = `Đang thực hiện: ${task.title}`;
    return task;
  }

  static buildRealReport(state, task) {
    const rk = task.resultKey;
    if (rk === 'scout_strikers') {
      const top5 = state.players.filter((p) => p.position === 'ST' && p.club !== 'Paris Saint-Germain').sort((a, b) => b.ovr - a.ovr).slice(0, 5);
      return `Danh sách 5 tiền đạo mục tiêu đã thẩm định: ${top5.map((p) => `${p.name} (${p.club}, OVR ${p.ovr}, €${p.value}M)`).join(' · ')}.`;
    }
    if (rk === 'scout_midfielders') {
      const top4 = state.players.filter((p) => ['DM', 'CM', 'AM'].includes(p.position) && p.club !== 'Paris Saint-Germain').sort((a, b) => b.ovr - a.ovr).slice(0, 4);
      return `Đề xuất tiền vệ đẳng cấp thế giới: ${top4.map((p) => `${p.name} (${p.club}, OVR ${p.ovr}, €${p.value}M)`).join(' · ')}.`;
    }
    if (rk === 'scout_cb') {
      const cbs = state.players.filter((p) => p.position === 'CB' && p.club !== 'Paris Saint-Germain').sort((a, b) => b.ovr - a.ovr).slice(0, 4);
      return `So sánh trung vệ chất lượng: ${cbs.map((p) => `${p.name} (${p.age}t, OVR ${p.ovr}, €${p.value}M)`).join(' · ')}.`;
    }
    if (rk === 'scout_u21') {
      const u21 = state.players.filter((p) => p.age <= 21 && p.club !== 'Paris Saint-Germain').sort((a, b) => b.pot - a.pot).slice(0, 5);
      return `5 tài năng trẻ U21 tiềm năng cao nhất: ${u21.map((p) => `${p.name} (${p.age}t, POT ${p.pot}, €${p.value}M)`).join(' · ')}.`;
    }
    if (rk === 'mkt_sponsor') {
      state.addLedger('Ký đối tác thương mại mới từ nhiệm vụ Chủ tịch giao', 9.5);
      return 'Hoàn tất đàm phán tài trợ khu vực mới, mang về +€9.5M vào ngân sách PSG!';
    }
    if (rk === 'cost_audit') {
      state.addLedger('Tiết kiệm chi phí vận hành từ kiểm toán CFO', 3.2);
      return 'Đã rà soát chi phí 12 phòng ban và tối ưu tiết kiệm được +€3.2M mà không ảnh hưởng hiệu suất.';
    }
    if (rk === 'cap_rally' || rk === 'player_morale') {
      state.getPsgSquad().forEach((p) => { p.morale = Math.min(100, p.morale + 5); });
      return 'Tinh thần toàn bộ đội một PSG đã tăng +5 điểm, phòng thay đồ gắn kết cao độ!';
    }
    // Mặc định nâng hiệu suất phòng ban & uy tín
    state.president.prestige = Math.min(100, state.president.prestige + 2);
    return `Nhiệm vụ "${task.title}" đã hoàn tất đầy đủ với sự phối hợp của ${task.collaborators}. Uy tín quản trị tăng +2.`;
  }

  static advanceTasks(state, stepAmount = 45) {
    if (!state.assignedTasks) return [];
    const completedNow = [];
    for (const t of state.assignedTasks) {
      if (t.status === 'Hoàn thành' || t.status === 'Thất bại' || t.status === 'Đã hủy') continue;
      t.progress = Math.min(100, t.progress + stepAmount);
      if (t.progress >= 100) {
        t.status = 'Hoàn thành';
        t.finalReport = TaskAssignmentSystem.buildRealReport(state, t);
        state.pushPhoneMsg(t.owner, `✅ Hoàn thành nhiệm vụ: ${t.title}`, t.finalReport, false);
        completedNow.push(t);
      } else if (t.progress >= 50) {
        t.status = 'Đang thực hiện';
      }
    }
    return completedNow;
  }
}
