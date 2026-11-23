// src/ai/PathfindingSystem.js
// Hệ thống tìm đường thông minh A* (NavGraph) theo đúng mặt bằng Trụ sở PSG 68x44m, Hành lang, Sảnh chính, Sân tập & Phòng Thay Đồ
export class PathfindingSystem {
  constructor() {
    // Mạng lưới nút giao thông thực tế đi qua chính giữa các hành lang & khung cửa gỗ (tuyệt đối không cắt xuyên tường!)
    this.nodes = {
      // Hành lang chính Đông-Tây (z = 0)
      c_w2: { x: -26.4, z: 0.0 },
      c_w1: { x: -12.8, z: 0.0 },
      c_m1: { x: -10.0, z: 0.0 },
      c_0:  { x: 0.0,   z: 0.0 },
      c_e0: { x: 3.0,   z: 0.0 },
      c_e1: { x: 12.8,  z: 0.0 },
      c_e2: { x: 21.2,  z: 0.0 },
      c_e3: { x: 27.2,  z: 0.0 },
      c_e4: { x: 29.7,  z: 0.0 },

      // Khu B (Ban Giám Đốc — phía Bắc)
      pres_foyer: { x: -26.0, z: -4.0 },
      pres_in:    { x: -26.0, z: -7.5 },
      pres_meet:  { x: -26.0, z: -13.5 },
      board_in:   { x: -10.0, z: -5.2 },
      board_mid:  { x: -10.0, z: -8.6 },
      vip_in:     { x: 3.0,   z: -5.5 },
      vip_north:  { x: 3.0,   z: -19.2 },
      ceo_in:     { x: 12.5,  z: -6.0 },
      vp_in:      { x: 21.2,  z: -6.0 },
      sport_in:   { x: 29.7,  z: -6.0 },

      // Khu C & D Hàng 1 (mở ra hành lang chính z = 2.4)
      coach_in: { x: -26.8, z: 4.8 },
      scout_in: { x: -12.8, z: 4.8 },
      fin_in:   { x: 13.2,  z: 4.8 },
      media_in: { x: 27.2,  z: 4.8 },

      // Sảnh chính (Khu A) & Hành lang phụ (z = 12.2)
      lobby_n:   { x: 0.0,   z: 4.8 },
      lobby_w:   { x: -3.6,  z: 12.2 },
      lobby_e:   { x: 3.6,   z: 12.2 },
      lobby_s:   { x: 0.0,   z: 16.5 },
      out_south: { x: 0.0,   z: 25.5 },

      // Hành lang phụ Tây (Khu C Hàng 2) & Đông (Khu D Hàng 2)
      sw_1:     { x: -12.8, z: 12.2 },
      sw_2:     { x: -26.8, z: 12.2 },
      acad_in:  { x: -12.8, z: 16.0 },
      trans_in: { x: -26.8, z: 16.0 },

      se_1:     { x: 13.2,  z: 12.2 },
      se_2:     { x: 27.2,  z: 12.2 },
      medic_in: { x: 13.2,  z: 16.0 },
      hr_in:    { x: 27.2,  z: 16.0 },

      // Ngoài trời: Sân tập chính & Tòa nhà Phòng Thay Đồ 1 tầng
      out_north:  { x: 3.0,   z: -25.0 },
      pitch_n:    { x: 0.0,   z: -34.0 },
      pitch_mid:  { x: 0.0,   z: -44.0 },
      dr_outside: { x: -23.5, z: -43.5 },
      dr_in:      { x: -28.5, z: -43.5 },
      dr_center:  { x: -36.5, z: -43.5 }
    };

    this.edges = {};
    const link = (a, b) => {
      if (!this.edges[a]) this.edges[a] = [];
      if (!this.edges[b]) this.edges[b] = [];
      if (!this.edges[a].includes(b)) this.edges[a].push(b);
      if (!this.edges[b].includes(a)) this.edges[b].push(a);
    };

    // Nối hành lang chính
    ['c_w2', 'c_w1', 'c_m1', 'c_0', 'c_e0', 'c_e1', 'c_e2', 'c_e3', 'c_e4'].reduce((prev, cur) => {
      if (prev) link(prev, cur);
      return cur;
    }, null);

    // Nối Khu B
    link('c_w2', 'pres_foyer'); link('pres_foyer', 'pres_in'); link('pres_in', 'pres_meet');
    link('c_m1', 'board_in'); link('board_in', 'board_mid');
    link('c_e0', 'vip_in'); link('vip_in', 'vip_north'); link('vip_north', 'out_north');
    link('c_e1', 'ceo_in'); link('c_e2', 'vp_in'); link('c_e4', 'sport_in');

    // Nối Khu C & D Hàng 1
    link('c_w2', 'coach_in'); link('c_w1', 'scout_in');
    link('c_e1', 'fin_in'); link('c_e3', 'media_in');

    // Nối Sảnh chính & Hành lang phụ (z = 12.2)
    link('c_0', 'lobby_n'); link('lobby_n', 'lobby_w'); link('lobby_n', 'lobby_e');
    link('lobby_w', 'lobby_e'); link('lobby_w', 'lobby_s'); link('lobby_e', 'lobby_s');
    link('lobby_s', 'out_south');

    link('lobby_w', 'sw_1'); link('sw_1', 'sw_2');
    link('sw_1', 'acad_in'); link('sw_2', 'trans_in');

    link('lobby_e', 'se_1'); link('se_1', 'se_2');
    link('se_1', 'medic_in'); link('se_2', 'hr_in');

    // Nối ngoài trời & Phòng Thay Đồ
    link('out_north', 'pitch_n'); link('pitch_n', 'pitch_mid');
    link('pitch_n', 'dr_outside'); link('pitch_mid', 'dr_outside');
    link('dr_outside', 'dr_in'); link('dr_in', 'dr_center');
  }

  // Xác định nút NavGraph gần nhất trong cùng phòng/khu vực (ưu tiên không nhảy qua tường)
  nearestNode(x, z) {
    // Kiểm tra nhanh vùng phòng để chọn đúng cửa phòng đó
    if (x < -25 && z < -30 && z > -57) return x < -31 ? 'dr_center' : 'dr_in';
    if (z < -23) return z < -39 ? 'pitch_mid' : (z < -29 ? 'pitch_n' : 'out_north');
    if (z > 22.5) return 'out_south';
    if (z < -2.4) {
      if (x < -18) return z < -10 ? 'pres_meet' : (z < -5.5 ? 'pres_in' : 'pres_foyer');
      if (x < -2) return z < -7 ? 'board_mid' : 'board_in';
      if (x < 8) return z < -13 ? 'vip_north' : 'vip_in';
      if (x < 17) return 'ceo_in';
      if (x < 25.5) return 'vp_in';
      return 'sport_in';
    }
    if (z > 2.4 && z < 10.6) {
      if (x < -20) return 'coach_in';
      if (x < -6) return 'scout_in';
      if (x <= 6) return 'lobby_n';
      if (x < 20) return 'fin_in';
      return 'media_in';
    }
    if (z >= 13.8) {
      if (x < -20) return 'trans_in';
      if (x < -6) return 'acad_in';
      if (x <= 6) return 'lobby_s';
      if (x < 20) return 'medic_in';
      return 'hr_in';
    }
    // Hành lang chính hoặc hành lang phụ
    let best = 'c_0', bestD = 1e9;
    for (const [k, pt] of Object.entries(this.nodes)) {
      const d = Math.hypot(pt.x - x, pt.z - z);
      if (d < bestD) { bestD = d; best = k; }
    }
    return best;
  }

  // Thuật toán A* tìm đường ngắn nhất qua các cửa gỗ và hành lang
  findPath(startX, startZ, endX, endZ) {
    const startKey = this.nearestNode(startX, startZ);
    const endKey = this.nearestNode(endX, endZ);

    // Nếu cùng 1 phòng / rất gần nhau -> đi thẳng đến đích
    if (startKey === endKey) return [{ x: endX, z: endZ }];

    const h = (a, b) => Math.hypot(this.nodes[a].x - this.nodes[b].x, this.nodes[a].z - this.nodes[b].z);
    const open = new Set([startKey]);
    const cameFrom = {};
    const gScore = { [startKey]: 0 };
    const fScore = { [startKey]: h(startKey, endKey) };

    while (open.size > 0) {
      let current = null, bestF = Infinity;
      for (const k of open) {
        const f = fScore[k] ?? Infinity;
        if (f < bestF) { bestF = f; current = k; }
      }
      if (current === endKey) {
        const path = [];
        let cur = current;
        while (cur) {
          path.unshift({ x: this.nodes[cur].x, z: this.nodes[cur].z });
          cur = cameFrom[cur];
        }
        path.push({ x: endX, z: endZ });
        return path;
      }
      open.delete(current);
      for (const nb of (this.edges[current] || [])) {
        const tentativeG = (gScore[current] ?? Infinity) + h(current, nb);
        if (tentativeG < (gScore[nb] ?? Infinity)) {
          cameFrom[nb] = current;
          gScore[nb] = tentativeG;
          fScore[nb] = tentativeG + h(nb, endKey);
          open.add(nb);
        }
      }
    }
    return [{ x: endX, z: endZ }];
  }

  // Trả về tọa độ phòng đích tương ứng với loại nhiệm vụ Chủ tịch giao
  static getTaskTargetRoom(resultKey) {
    const map = {
      scout_strikers: { x: -13.0, z: 6.0, label: 'Phòng Tuyển Trạch' },
      scout_midfielders: { x: -13.0, z: 6.0, label: 'Phòng Tuyển Trạch' },
      scout_cb: { x: -13.0, z: 6.0, label: 'Phòng Tuyển Trạch' },
      scout_u21: { x: -27.0, z: 16.5, label: 'Phòng Chuyển Nhượng' },
      rev_growth: { x: 27.0, z: 6.0, label: 'Phòng Marketing' },
      mkt_sponsor: { x: 13.0, z: 6.0, label: 'Phòng Tài Chính' },
      cost_audit: { x: 12.5, z: -7.5, label: 'Phòng Tổng Giám Đốc' },
      match_prep: { x: -27.0, z: 6.0, label: 'Phòng Ban Huấn Luyện' },
      def_drill: { x: 0.0, z: -36.0, label: 'Sân Tập Chính' },
      youth_chance: { x: -13.0, z: 16.5, label: 'Phòng Học Viện' },
      acad_eval: { x: -27.0, z: 6.0, label: 'Phòng HLV Trưởng' },
      med_check: { x: -36.5, z: -43.5, label: 'Phòng Thay Đồ Cầu Thủ' },
      cap_rally: { x: -36.5, z: -43.5, label: 'Phòng Thay Đồ Cầu Thủ' },
      player_morale: { x: -36.5, z: -43.5, label: 'Phòng Thay Đồ Cầu Thủ' },
      dept_audit: { x: 0.0, z: 6.5, label: 'Sảnh & Các Phòng Ban' },
      season_plan: { x: -10.0, z: -8.0, label: 'Phòng Họp Ban Giám Đốc' },
      media_pr: { x: -27.0, z: 6.0, label: 'Phòng HLV Trưởng' },
      legal_review: { x: 13.0, z: 6.0, label: 'Phòng Tài Chính & Pháp Chế' },
      fac_maint: { x: 0.0, z: -34.0, label: 'Khuôn Viên Sân Tập' }
    };
    return map[resultKey] || { x: -10.0, z: -8.0, label: 'Phòng Họp Ban Giám Đốc' };
  }
}
