// src/scene/FurnitureFactory.js
// Nội thất 3D chuẩn European Executive Office: Bàn có lỗ luồn dây & ngăn kéo, ghế có bánh xe, cụm bàn nhân viên, máy in, bàn họp nhóm, vách kính khung nhôm trong suốt có rèm
export class FurnitureFactory {
  constructor(texFactory) {
    this.tex = texFactory;
    this.mats = {
      walnut: new THREE.MeshStandardMaterial({ map: texFactory.woodTexture('#4a2d20', '#2b1810'), roughness: 0.42, metalness: 0.08 }),
      darkWood: new THREE.MeshStandardMaterial({ map: texFactory.woodTexture('#2e1c14', '#1a0f0a'), roughness: 0.48, metalness: 0.06 }),
      oakLight: new THREE.MeshStandardMaterial({ map: texFactory.woodTexture('#8c6b4f', '#6b4e35'), roughness: 0.46, metalness: 0.04 }),
      leatherDark: new THREE.MeshStandardMaterial({ color: 0x1a1d24, roughness: 0.36, metalness: 0.12 }),
      leatherNavy: new THREE.MeshStandardMaterial({ color: 0x0d2142, roughness: 0.4, metalness: 0.1 }),
      fabricCream: new THREE.MeshStandardMaterial({ color: 0xe8e2d5, roughness: 0.85, metalness: 0.02 }),
      chrome: new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.2, metalness: 0.88 }),
      aluminum: new THREE.MeshStandardMaterial({ color: 0x262f3d, roughness: 0.32, metalness: 0.78 }),
      gold: new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.22, metalness: 0.92 }),
      matteBlack: new THREE.MeshStandardMaterial({ color: 0x161920, roughness: 0.65, metalness: 0.25 }),
      // Kính cường lực trong suốt chuẩn Three.js (nhìn xuyên rõ ra ngoài, có phản xạ chân thực)
      glass: new THREE.MeshPhysicalMaterial({
        color: 0xdbeafe, transparent: true, opacity: 0.22, roughness: 0.06, metalness: 0.15, depthWrite: false
      }),
      blindMat: new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.6, metalness: 0.1 }),
      ceramic: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3, metalness: 0.05 }),
      foliage: new THREE.MeshStandardMaterial({ color: 0x2d6a3e, roughness: 0.72, metalness: 0.02 }),
      bark: new THREE.MeshStandardMaterial({ color: 0x5c3d28, roughness: 0.88 }),
      whiteMatte: new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.55 })
    };
  }

  // Hệ cửa sổ kính cường lực trong suốt khung nhôm cao cấp (có thể kèm rèm điều chỉnh ánh sáng)
  createGlassWindowWall(width, height = 4.4, hasBlinds = false) {
    const g = new THREE.Group();
    const sillH = 0.22;
    const headH = 0.24;
    const glassH = height - sillH - headH;

    // Bệ dưới & thanh đà trên bằng nhôm
    const sill = new THREE.Mesh(new THREE.BoxGeometry(width, sillH, 0.20), this.mats.aluminum);
    sill.position.y = sillH / 2;
    const head = new THREE.Mesh(new THREE.BoxGeometry(width, headH, 0.20), this.mats.aluminum);
    head.position.y = height - headH / 2;
    g.add(sill, head);

    // Tấm kính cường lực trong suốt dày 0.04m
    const pane = new THREE.Mesh(new THREE.BoxGeometry(width - 0.12, glassH, 0.04), this.mats.glass);
    pane.position.y = sillH + glassH / 2;
    g.add(pane);

    // Đố nhôm đứng chia ô kính hiện đại mỗi 2.2m
    const panels = Math.max(1, Math.round(width / 2.2));
    for (let i = 0; i <= panels; i++) {
      const mx = -width / 2 + (i / panels) * width;
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.08, height, 0.18), this.mats.aluminum);
      mullion.position.set(mx, height / 2, 0);
      g.add(mullion);
    }

    // Thanh ngang gia cường ở độ cao 3.1m
    const transom = new THREE.Mesh(new THREE.BoxGeometry(width, 0.07, 0.14), this.mats.aluminum);
    transom.position.y = 3.1;
    g.add(transom);

    // Rèm cuốn điều chỉnh ánh sáng phía trên (cho Phòng Họp & Pháp Chế)
    if (hasBlinds) {
      const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, width - 0.2, 10), this.mats.chrome);
      roller.rotation.z = Math.PI / 2;
      roller.position.set(0, height - 0.34, 0.10);
      g.add(roller);
      for (let s = 0; s < 5; s++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(width - 0.28, 0.04, 0.015), this.mats.blindMat);
        slat.position.set(0, height - 0.48 - s * 0.11, 0.10);
        slat.rotation.x = 0.28;
        g.add(slat);
      }
    }
    return g;
  }

  createExecutiveDesk(width = 2.6, depth = 1.15, isPresident = false) {
    const g = new THREE.Group();
    const wood = isPresident ? this.mats.walnut : this.mats.darkWood;
    const top = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, depth), wood);
    top.position.y = 0.76;
    top.castShadow = true;
    top.receiveShadow = true;
    g.add(top);

    const blotter = new THREE.Mesh(new THREE.BoxGeometry(width * 0.45, 0.012, depth * 0.54), this.mats.leatherDark);
    blotter.position.set(0, 0.805, 0.06);
    g.add(blotter);

    // Lỗ luồn dây điện kim loại trên mặt bàn
    const grommet = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.015, 12), this.mats.chrome);
    grommet.position.set(width * 0.24, 0.802, -depth * 0.26);
    g.add(grommet);

    const modesty = new THREE.Mesh(new THREE.BoxGeometry(width - 0.18, 0.64, 0.06), wood);
    modesty.position.set(0, 0.40, -depth / 2 + 0.1);
    g.add(modesty);

    const trim = new THREE.Mesh(new THREE.BoxGeometry(width - 0.16, 0.03, 0.07), isPresident ? this.mats.gold : this.mats.chrome);
    trim.position.set(0, 0.68, -depth / 2 + 0.1);
    g.add(trim);

    [-1, 1].forEach((side) => {
      const ped = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.68, depth - 0.16), wood);
      ped.position.set(side * (width / 2 - 0.34), 0.38, 0.02);
      ped.castShadow = true;
      g.add(ped);
      const legBar = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.05, depth - 0.14), this.mats.chrome);
      legBar.position.set(side * (width / 2 - 0.34), 0.025, 0.02);
      g.add(legBar);
      for (let d = 0; d < 3; d++) {
        const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.18, 0.025), wood);
        drawer.position.set(side * (width / 2 - 0.34), 0.18 + d * 0.21, depth / 2 - 0.055);
        g.add(drawer);
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.03), isPresident ? this.mats.gold : this.mats.chrome);
        handle.position.set(side * (width / 2 - 0.34), 0.21 + d * 0.21, depth / 2 - 0.03);
        g.add(handle);
      }
    });

    const pc = this.createComputerSet(isPresident ? 'PSG PRESIDENT macOS' : 'PSG DEPT WORKSTATION');
    pc.position.set(0, 0.80, -0.14);
    g.add(pc);

    const phone = this.createDeskPhone();
    phone.position.set(width / 2 - 0.42, 0.80, 0.12);
    g.add(phone);

    if (isPresident) {
      const lamp = this.createDeskLamp();
      lamp.position.set(-width / 2 + 0.40, 0.80, -0.22);
      g.add(lamp);
    }
    return g;
  }

  // Bàn làm việc nhân viên chuẩn văn phòng châu Âu (mặt gỗ sồi sáng, chân thép, hộc tủ, máy tính quay đúng hướng ghế)
  createStaffDesk(screenTitle = 'PSG STAFF OS') {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.055, 0.82), this.mats.oakLight);
    top.position.y = 0.74;
    top.castShadow = true;
    top.receiveShadow = true;
    g.add(top);

    // 4 chân khung thép chữ U + hộc tủ ngăn kéo bên phải
    [[-0.76, -0.34], [0.76, -0.34], [-0.76, 0.34], [0.76, 0.34]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.72, 0.045), this.mats.aluminum);
      leg.position.set(x, 0.36, z);
      g.add(leg);
    });
    const ped = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.62, 0.62), this.mats.whiteMatte);
    ped.position.set(0.54, 0.34, 0.02);
    g.add(ped);
    for (let d = 0; d < 3; d++) {
      const hdl = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.018, 0.025), this.mats.chrome);
      hdl.position.set(0.54, 0.18 + d * 0.19, 0.34);
      g.add(hdl);
    }
    // Lỗ đi dây điện
    const grom = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 10), this.mats.matteBlack);
    grom.position.set(-0.35, 0.77, -0.22);
    g.add(grom);

    const pc = this.createComputerSet(screenTitle);
    pc.position.set(-0.10, 0.77, -0.10);
    g.add(pc);
    return g;
  }

  // Bàn họp nhóm tròn cho các phòng ban đông nhân viên
  createRoundMeetingTable(radius = 0.95) {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.06, 24), this.mats.walnut);
    top.position.y = 0.74;
    top.castShadow = true;
    g.add(top);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.72, 14), this.mats.chrome);
    col.position.y = 0.36;
    g.add(col);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.04, 18), this.mats.matteBlack);
    base.position.y = 0.02;
    g.add(base);
    return g;
  }

  // Trạm máy in / photocopy công sở cho phòng Tài chính & Hành chính
  createPrinterStation() {
    const g = new THREE.Group();
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.76, 0.58), this.mats.whiteMatte);
    cab.position.y = 0.38;
    g.add(cab);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.42, 0.52), this.mats.matteBlack);
    body.position.y = 0.97;
    g.add(body);
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.30), this.mats.chrome);
    tray.position.set(0, 0.90, 0.32);
    g.add(tray);
    return g;
  }

  createComputerSet(screenTitle = 'PSG SYSTEM') {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.015, 0.18), this.mats.chrome);
    base.position.set(0, 0.008, -0.04);
    g.add(base);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.025), this.mats.chrome);
    neck.position.set(0, 0.11, -0.08);
    neck.rotation.x = -0.12;
    g.add(neck);
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.39, 0.026), this.mats.matteBlack);
    bezel.position.set(0, 0.31, -0.05);
    g.add(bezel);
    const screenMat = new THREE.MeshStandardMaterial({
      map: this.tex.screenTexture(screenTitle), emissive: 0x163566, emissiveIntensity: 0.42, roughness: 0.2
    });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.35), screenMat);
    screen.position.set(0, 0.31, -0.036);
    g.add(screen);
    const kb = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.014, 0.14), this.mats.matteBlack);
    kb.position.set(-0.04, 0.008, 0.24);
    g.add(kb);
    const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.024, 0.105), this.mats.matteBlack);
    mouse.position.set(0.26, 0.012, 0.25);
    g.add(mouse);
    return g;
  }

  createDeskPhone() {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.05, 0.18), this.mats.matteBlack);
    base.position.y = 0.025;
    g.add(base);
    const handset = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.19), this.mats.matteBlack);
    handset.position.set(-0.06, 0.065, 0);
    g.add(handset);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.01, 0.07), new THREE.MeshStandardMaterial({ color: 0x1e3a8a, emissive: 0x1d4ed8, emissiveIntensity: 0.4 }));
    screen.position.set(0.04, 0.052, -0.02);
    g.add(screen);
    return g;
  }

  createDeskLamp() {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.12, 0.03, 16), this.mats.gold);
    base.position.y = 0.015;
    g.add(base);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.42, 10), this.mats.gold);
    stem.position.y = 0.22;
    g.add(stem);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.16, 16, 1, true), this.mats.matteBlack);
    shade.position.y = 0.44;
    g.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 10), new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffd27d, emissiveIntensity: 1.2 }));
    bulb.position.y = 0.40;
    g.add(bulb);
    return g;
  }

  createSwivelChair(isLuxury = true) {
    const g = new THREE.Group();
    const mat = isLuxury ? this.mats.leatherDark : this.mats.leatherNavy;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.36, 10), this.mats.chrome);
    pole.position.y = 0.24;
    g.add(pole);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.28), this.mats.chrome);
      spoke.position.set(Math.sin(a) * 0.14, 0.06, Math.cos(a) * 0.14);
      spoke.rotation.y = a;
      g.add(spoke);
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.022, 8), this.mats.matteBlack);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(Math.sin(a) * 0.26, 0.026, Math.cos(a) * 0.26);
      g.add(wheel);
    }
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.10, 0.54), mat);
    seat.position.y = 0.46;
    seat.castShadow = true;
    g.add(seat);
    const backH = isLuxury ? 0.72 : 0.56;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.54, backH, 0.10), mat);
    back.position.set(0, 0.46 + backH / 2, 0.24);
    back.rotation.x = 0.08;
    back.castShadow = true;
    g.add(back);
    [-0.29, 0.29].forEach((x) => {
      const armPost = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.20, 0.05), this.mats.chrome);
      armPost.position.set(x, 0.56, 0.02);
      g.add(armPost);
      const armPad = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.34), mat);
      armPad.position.set(x, 0.67, 0.02);
      g.add(armPad);
    });
    return g;
  }

  createSofa(width = 2.4) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(width, 0.24, 0.88), this.mats.leatherNavy);
    base.position.y = 0.20;
    base.castShadow = true;
    g.add(base);
    [[-width / 2 + 0.12, -0.34], [width / 2 - 0.12, -0.34], [-width / 2 + 0.12, 0.34], [width / 2 - 0.12, 0.34]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.09, 8), this.mats.chrome);
      leg.position.set(x, 0.045, z);
      g.add(leg);
    });
    const nCush = Math.max(2, Math.round(width / 0.78));
    const cw = (width - 0.32) / nCush;
    for (let i = 0; i < nCush; i++) {
      const cx = -((width - 0.32) / 2) + cw * (i + 0.5);
      const cush = new THREE.Mesh(new THREE.BoxGeometry(cw - 0.03, 0.14, 0.74), this.mats.leatherNavy);
      cush.position.set(cx, 0.39, 0.04);
      g.add(cush);
      const back = new THREE.Mesh(new THREE.BoxGeometry(cw - 0.03, 0.46, 0.18), this.mats.leatherNavy);
      back.position.set(cx, 0.64, -0.32);
      g.add(back);
    }
    [-width / 2 + 0.08, width / 2 - 0.08].forEach((x) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.44, 0.88), this.mats.leatherNavy);
      arm.position.set(x, 0.48, 0);
      g.add(arm);
    });
    return g;
  }

  createCoffeeTable(w = 1.4, d = 0.75) {
    const g = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), this.mats.darkWood);
    frame.position.y = 0.38;
    g.add(frame);
    const glassTop = new THREE.Mesh(new THREE.BoxGeometry(w - 0.08, 0.02, d - 0.08), this.mats.glass);
    glassTop.position.y = 0.41;
    g.add(glassTop);
    [[-w / 2 + 0.08, -d / 2 + 0.08], [w / 2 - 0.08, -d / 2 + 0.08], [-w / 2 + 0.08, d / 2 - 0.08], [w / 2 - 0.08, d / 2 - 0.08]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.38, 0.045), this.mats.chrome);
      leg.position.set(x, 0.19, z);
      g.add(leg);
    });
    return g;
  }

  createFilingCabinet(w = 1.6, h = 2.0, d = 0.46) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.mats.walnut);
    body.position.y = h / 2;
    body.castShadow = true;
    g.add(body);
    const colors = [0x00205b, 0xda291c, 0x1e293b, 0xd4af37, 0xf8fafc];
    for (let row = 0; row < 3; row++) {
      const shelfY = 0.9 + row * 0.34;
      for (let b = 0; b < 7; b++) {
        const bh = 0.20 + ((row * 3 + b) % 3) * 0.03;
        const binder = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, bh, 0.28),
          new THREE.MeshStandardMaterial({ color: colors[(row + b) % colors.length], roughness: 0.5 })
        );
        binder.position.set(-w / 2 + 0.22 + b * 0.19, shelfY, 0.07);
        g.add(binder);
      }
    }
    [-w / 4, w / 4].forEach((x) => {
      const door = new THREE.Mesh(new THREE.BoxGeometry(w / 2 - 0.06, 0.72, 0.03), this.mats.darkWood);
      door.position.set(x, 0.40, d / 2 + 0.01);
      g.add(door);
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, 0.03), this.mats.gold);
      handle.position.set(x + (x < 0 ? 0.24 : -0.24), 0.52, d / 2 + 0.03);
      g.add(handle);
    });
    return g;
  }

  createTrophyCabinet() {
    const g = new THREE.Group();
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.75, 0.55), this.mats.darkWood);
    plinth.position.y = 0.375;
    g.add(plinth);
    const glassBox = new THREE.Mesh(new THREE.BoxGeometry(2.14, 1.35, 0.50), this.mats.glass);
    glassBox.position.y = 1.425;
    g.add(glassBox);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.55), this.mats.matteBlack);
    cap.position.y = 2.14;
    g.add(cap);
    [-0.68, 0, 0.68].forEach((x, idx) => {
      const cupMat = idx === 1 ? this.mats.gold : this.mats.chrome;
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.10, 14), this.mats.matteBlack);
      stand.position.set(x, 0.80, 0);
      g.add(stand);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.06, 0.24, 12), cupMat);
      stem.position.set(x, 0.97, 0);
      g.add(stem);
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.06, 0.28, 16), cupMat);
      bowl.position.set(x, 1.22, 0);
      g.add(bowl);
    });
    return g;
  }

  createPottedPlant(scale = 1) {
    const g = new THREE.Group();
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.42, 14), this.mats.ceramic);
    pot.position.y = 0.21;
    pot.castShadow = true;
    g.add(pot);
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 12), this.mats.bark);
    soil.position.y = 0.41;
    g.add(soil);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.65, 8), this.mats.bark);
    trunk.position.y = 0.72;
    g.add(trunk);
    [[0, 1.15, 0, 0.34], [0.18, 1.0, 0.14, 0.24], [-0.18, 1.04, -0.1, 0.25], [0.05, 1.38, -0.06, 0.24]].forEach(([x, y, z, r]) => {
      const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), this.mats.foliage);
      leaf.position.set(x, y, z);
      leaf.castShadow = true;
      g.add(leaf);
    });
    g.scale.setScalar(scale);
    return g;
  }

  createConferenceTable(len = 7.6, wid = 2.2) {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(len, 0.09, wid), this.mats.walnut);
    top.position.y = 0.76;
    top.castShadow = true;
    top.receiveShadow = true;
    g.add(top);
    const inlay = new THREE.Mesh(new THREE.BoxGeometry(len - 0.6, 0.015, wid - 0.7), this.mats.leatherDark);
    inlay.position.y = 0.81;
    g.add(inlay);
    [-len / 3, 0, len / 3].forEach((x) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, wid * 0.55), this.mats.matteBlack);
      leg.position.set(x, 0.36, 0);
      g.add(leg);
    });
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.05, 12), this.mats.chrome);
    hub.position.set(0, 0.835, 0);
    g.add(hub);
    for (let i = -2; i <= 2; i++) {
      [-0.72, 0.72].forEach((z) => {
        const folder = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.015, 0.22), this.mats.leatherNavy);
        folder.position.set(i * 1.25, 0.82, z);
        g.add(folder);
        const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.18, 8), this.mats.glass);
        bottle.position.set(i * 1.25 + 0.22, 0.90, z);
        g.add(bottle);
      });
    }
    return g;
  }

  createMedicalBed() {
    const g = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.14, 0.92), this.mats.chrome);
    frame.position.y = 0.66;
    g.add(frame);
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.14, 0.86), this.mats.whiteMatte);
    mattress.position.y = 0.78;
    g.add(mattress);
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.10, 0.64), this.mats.fabricCream);
    pillow.position.set(-0.78, 0.88, 0);
    g.add(pillow);
    [[-0.92, -0.38], [0.92, -0.38], [-0.92, 0.38], [0.92, 0.38]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.66, 8), this.mats.chrome);
      leg.position.set(x, 0.33, z);
      g.add(leg);
    });
    return g;
  }

  createWallScreen(w = 3.2, h = 1.75, title = 'PSG EXECUTIVE DISPLAY') {
    const g = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, h + 0.12, 0.07), this.mats.matteBlack);
    g.add(frame);
    const disp = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: this.tex.screenTexture(title), emissive: 0x102a52, emissiveIntensity: 0.35 })
    );
    disp.position.z = 0.038;
    g.add(disp);
    return g;
  }

  createTacticalBoard() {
    const g = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.38, 0.06), this.mats.chrome);
    g.add(frame);
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(2.08, 1.26),
      new THREE.MeshStandardMaterial({ map: this.tex.tacticalBoardTexture(), roughness: 0.4 })
    );
    board.position.z = 0.034;
    g.add(board);
    return g;
  }

  createFramedJersey(num = '10') {
    const g = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.18, 0.07), this.mats.matteBlack);
    g.add(box);
    const art = new THREE.Mesh(
      new THREE.PlaneGeometry(0.86, 1.08),
      new THREE.MeshStandardMaterial({ map: this.tex.framedJerseyTexture(num), roughness: 0.35 })
    );
    art.position.z = 0.038;
    g.add(art);
    return g;
  }

  createWallClock() {
    const g = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.045, 24), this.mats.gold);
    rim.rotation.x = Math.PI / 2;
    g.add(rim);
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.05, 24), this.mats.whiteMatte);
    face.rotation.x = Math.PI / 2;
    g.add(face);
    const hHand = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.01), this.mats.matteBlack);
    hHand.position.set(0, 0.04, 0.03);
    g.add(hHand);
    const mHand = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.16, 0.01), this.mats.matteBlack);
    mHand.position.set(0.06, 0, 0.032);
    mHand.rotation.z = -Math.PI / 2;
    g.add(mHand);
    return g;
  }
}
