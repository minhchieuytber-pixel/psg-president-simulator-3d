// src/scene/DressingRoomSystem.js
// Tòa nhà Phòng Thay Đồ Cầu Thủ 1 tầng riêng biệt cạnh sân tập & sân vận động PSG
// Gồm: Phòng thay đồ chính (20 tủ cá nhân đồng bộ tên/số áo/áo đấu treo từ DB), Bàn chiến thuật trung tâm, Màn hình sơ đồ đội hình 3D sống động,
// Khu thủ môn, Khu tắm & phục hồi, Phòng HLV, Kho dụng cụ & Sofa nghỉ ngơi

export class DressingRoomSystem {
  constructor(campusScene, texFactory, furnFactory, formationSystem) {
    this.campus = campusScene;
    this.tex = texFactory;
    this.furn = furnFactory;
    this.formation = formationSystem;
    this.group = new THREE.Group();
    this.lockerMeshes = []; // Lưu để cập nhật động khi đổi số áo / mua bán / đôn cầu thủ trẻ!
    this.tacticalCanvas = document.createElement('canvas');
    this.tacticalCanvas.width = 512;
    this.tacticalCanvas.height = 360;
    this.tacticalTex = new THREE.CanvasTexture(this.tacticalCanvas);

    // Tọa độ trung tâm tòa nhà 1 tầng cạnh sân tập chính (x ∈ [-48, -26], z ∈ [-56, -32], 22m x 24m)
    this.cx = -37;
    this.cz = -44;
    this.campus.root.add(this.group);
    this.build();
    this.formation.onChange(() => this.refreshDynamicElements());
    this.refreshDynamicElements();
  }

  makeLockerJerseyTexture(shirtNumber, displayName, isCaptain, isGK) {
    const c = document.createElement('canvas');
    c.width = 160; c.height = 220;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#0b1528';
    ctx.fillRect(0, 0, 160, 220);
    // Bảng tên & số trên đỉnh tủ
    ctx.fillStyle = '#00205b';
    ctx.fillRect(8, 8, 144, 34);
    ctx.fillStyle = '#da291c';
    ctx.fillRect(8, 8, 6, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(shirtNumber ? `#${shirtNumber} ${displayName}` : 'TỦ TRỐNG', 82, 30);

    if (shirtNumber) {
      // Áo đấu PSG treo trong tủ
      ctx.fillStyle = isGK ? '#eab308' : '#00205b';
      ctx.beginPath();
      ctx.moveTo(46, 56); ctx.lineTo(114, 56); ctx.lineTo(140, 86); ctx.lineTo(124, 102);
      ctx.lineTo(114, 92); ctx.lineTo(114, 194); ctx.lineTo(46, 194); ctx.lineTo(46, 92);
      ctx.lineTo(36, 102); ctx.lineTo(20, 86); ctx.closePath(); ctx.fill();
      ctx.fillStyle = isGK ? '#ca8a04' : '#da291c';
      ctx.fillRect(70, 56, 20, 138);
      ctx.fillStyle = isGK ? '#0f172a' : '#ffffff';
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText(String(shirtNumber), 80, 140);
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(displayName, 80, 174);
      if (isCaptain) {
        ctx.fillStyle = '#facc15';
        ctx.fillRect(114, 54, 24, 22);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText('C', 126, 70);
      }
    }
    return new THREE.CanvasTexture(c);
  }

  build() {
    const cx = this.cx, cz = this.cz;
    // Đăng ký điểm đi nhanh & tọa độ bàn họp chiến thuật trong Phòng Thay Đồ
    this.campus.roomWaypoints.dressing_room = { x: cx + 2, z: cz + 6 };
    this.campus.dressingRoomTable = { x: cx, z: cz };

    // Sàn chống trượt đá xám cao cấp (22m x 24m, 1 tầng duy nhất!)
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(22, 0.16, 24),
      new THREE.MeshStandardMaterial({ color: 0x2a313d, roughness: 0.48, metalness: 0.12 })
    );
    floor.position.set(cx, 0.06, cz);
    floor.receiveShadow = true;
    this.group.add(floor);

    // Mái 1 tầng hiện đại + đèn âm trần
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(22.6, 0.42, 24.6),
      new THREE.MeshStandardMaterial({ color: 0x161c27, roughness: 0.42, metalness: 0.35 })
    );
    roof.position.set(cx, 4.55, cz);
    roof.castShadow = true;
    this.group.add(roof);

    // Đèn sáng ấm đầy đủ bên trong phòng thay đồ
    const light1 = new THREE.PointLight(0xf1f6ff, 1.0, 26, 1.4);
    light1.position.set(cx, 4.0, cz - 4);
    const light2 = new THREE.PointLight(0xfff4e0, 0.9, 26, 1.4);
    light2.position.set(cx, 4.0, cz + 5);
    this.group.add(light1, light2);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e2532, roughness: 0.55, metalness: 0.12 });
    const addW = (x, z, w, d) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 4.35, d), wallMat);
      m.position.set(x, 2.28, z);
      m.castShadow = true; m.receiveShadow = true;
      this.group.add(m);
      this.campus.addCollider(x, z, w, d);
    };

    // 4 Tường bao tòa nhà 1 tầng:
    // Tường Bắc (z = cz - 12), Tường Tây (x = cx - 11), Tường Nam (z = cz + 12 có kính lớn), Tường Đông (x = cx + 11 hướng ra sân tập có cửa chính!)
    addW(cx, cz - 12, 22, 0.26);
    addW(cx - 11, cz, 0.26, 24);
    this.campus.addGlassWindow(cx, cz + 12, 22, 0, false);

    // Mặt tiền Đông hướng thẳng ra sân tập chính (x = cx + 11): kính + cửa gỗ lớn mở ra sân tập!
    this.campus.addGlassWindow(cx + 11, cz - 6.5, 11, Math.PI / 2, false);
    this.campus.addWoodenDoor('door_dressing_main', cx + 11, cz + 0.5, Math.PI / 2, 2.4, true);
    this.campus.addGlassWindow(cx + 11, cz + 7.0, 10, Math.PI / 2, false);

    // Biển hiệu mặt tiền & Logo PSG lớn
    const facade = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 1.2),
      new THREE.MeshStandardMaterial({ map: this.tex.signTexture('PHÒNG THAY ĐỒ ĐỘI MỘT · PARIS SAINT-GERMAIN', '#00205b', '#ffffff', '#da291c') })
    );
    facade.position.set(cx + 11.2, 3.85, cz);
    facade.rotation.y = Math.PI / 2;
    this.group.add(facade);

    const crest = new THREE.Mesh(
      new THREE.CircleGeometry(1.1, 32),
      new THREE.MeshStandardMaterial({ map: this.tex.psgCrestTexture(), transparent: true })
    );
    crest.position.set(cx, 2.7, cz - 11.82);
    this.group.add(crest);

    // === 20 TỦ ĐỒ CÁ NHÂN CẦU THỦ ĐỘI MỘT DỌC HAI TƯỜNG TÂY & BẮC (ĐỒNG BỘ 100% DATABASE) ===
    const lockerMat = this.furn.mats.darkWood;
    const benchMat = this.furn.mats.leatherNavy;
    const createLockerSlot = (idx, lx, lz, rotY) => {
      const lg = new THREE.Group();
      lg.position.set(lx, 0.14, lz);
      lg.rotation.y = rotY;
      // Khung tủ gỗ tối màu cao 2.2m + ngăn giày + ghế ngồi trước tủ
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.18, 2.2, 0.56), lockerMat);
      back.position.set(0, 1.1, 0);
      lg.add(back);
      const bench = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.44, 0.46), benchMat);
      bench.position.set(0, 0.22, 0.48);
      lg.add(bench);
      // Tấm hiển thị tên + số áo + áo đấu PSG treo trong tủ (cập nhật động!)
      const dispMat = new THREE.MeshStandardMaterial({ roughness: 0.4 });
      const disp = new THREE.Mesh(new THREE.PlaneGeometry(1.06, 1.48), dispMat);
      disp.position.set(0, 1.38, 0.29);
      lg.add(disp);
      this.group.add(lg);
      this.lockerMeshes.push({ idx, dispMat, lg });
    };

    // 12 tủ dọc tường Tây (x = cx - 10.4, quay mặt +x) + 8 tủ dọc tường Bắc (z = cz - 11.4, quay mặt +z)
    for (let i = 0; i < 12; i++) {
      createLockerSlot(i, cx - 10.35, cz - 8.5 + i * 1.45, Math.PI / 2);
    }
    for (let i = 0; i < 8; i++) {
      createLockerSlot(12 + i, cx - 7.5 + i * 1.6, cz - 11.35, 0);
    }
    this.campus.addCollider(cx - 10.2, cz - 0.5, 1.4, 18.0);
    this.campus.addCollider(cx - 1.9, cz - 11.2, 13.0, 1.4);

    // === BÀN HỌP CHIẾN THUẬT TRUNG TÂM + MÀN HÌNH SƠ ĐỒ ĐỘI HÌNH 3D SỐNG ĐỘNG ===
    const tacTable = this.furn.createConferenceTable(5.2, 1.9);
    tacTable.position.set(cx + 0.5, 0.14, cz - 1.2);
    this.group.add(tacTable);
    this.campus.addCollider(cx + 0.5, cz - 1.2, 5.2, 1.9);
    this.campus.tagInteractable(tacTable, 'dr_tactics_table', 'Mở Sơ Đồ Đội Hình & Chiến Thuật PSG', '📋', 'open_formation');

    // Màn hình chiến thuật lớn hiển thị sơ đồ áo đấu thật (cập nhật realtime!)
    const screenFrame = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.55, 0.10), this.furn.mats.matteBlack);
    screenFrame.position.set(cx + 6.5, 2.15, cz - 11.75);
    const screenPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 2.38),
      new THREE.MeshStandardMaterial({ map: this.tacticalTex, emissive: 0x0c2444, emissiveIntensity: 0.35 })
    );
    screenPlane.position.set(cx + 6.5, 2.15, cz - 11.68);
    this.group.add(screenFrame, screenPlane);
    this.campus.tagInteractable(screenFrame, 'dr_tactics_screen', 'Chỉnh Sơ Đồ Đội Hình PSG (Đồng bộ)', '🖥️', 'open_formation');

    // Khu vực nghỉ ngơi Sofa + Tủ lạnh nước uống & khăn tắm (góc Đông Nam)
    const sofa = this.furn.createSofa(3.0);
    sofa.position.set(cx + 6.5, 0.14, cz + 7.5);
    sofa.rotation.y = Math.PI;
    this.group.add(sofa);
    this.campus.addCollider(cx + 6.5, cz + 7.5, 3.0, 0.9);
    this.campus.addSeat(sofa, 'seat_dr_sofa', 'Sofa Phòng Thay Đồ PSG', cx + 6.5, cz + 7.2, 0, cx + 6.5, cz + 5.8);

    const fridge = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.0, 0.75), this.furn.mats.chrome);
    fridge.position.set(cx + 9.6, 1.14, cz + 8.5);
    this.group.add(fridge);
    this.campus.addCollider(cx + 9.6, cz + 8.5, 1.1, 0.75);

    // Khu chức năng phụ: Khu phục hồi (Giường y tế) & Kho dụng cụ bóng tập (góc Tây Nam)
    const recBed = this.furn.createMedicalBed();
    recBed.position.set(cx - 5.5, 0.14, cz + 9.2);
    this.group.add(recBed);
    this.campus.addCollider(cx - 5.5, cz + 9.2, 2.1, 0.95);

    const gearRack = this.furn.createFilingCabinet(2.0, 1.9, 0.5);
    gearRack.position.set(cx - 1.5, 0.14, cz + 11.0);
    gearRack.rotation.y = Math.PI;
    this.group.add(gearRack);
    this.campus.addCollider(cx - 1.5, cz + 11.0, 2.0, 0.55);
  }

  // Cập nhật đồng bộ toàn bộ 20 tủ cầu thủ + Màn hình chiến thuật 3D ngay khi đội hình/số áo/đội trưởng thay đổi!
  refreshDynamicElements() {
    this.formation.syncLockers();
    this.lockerMeshes.forEach(({ idx, dispMat, lg }) => {
      const l = this.formation.lockers[idx];
      if (!l) return;
      if (dispMat.map) dispMat.map.dispose();
      dispMat.map = this.makeLockerJerseyTexture(l.shirtNumber, l.displayName, l.isCaptain, l.position === 'GK');
      dispMat.needsUpdate = true;
      if (l.isAssigned) {
        this.campus.tagInteractable(lg, `locker_int_${idx}`, `Tủ #${l.shirtNumber} ${l.fullName} (${l.position})`, '👕', 'open_formation');
      }
    });
    this.formation.drawTacticalScreenCanvas(this.tacticalCanvas);
    this.tacticalTex.needsUpdate = true;
  }
}
