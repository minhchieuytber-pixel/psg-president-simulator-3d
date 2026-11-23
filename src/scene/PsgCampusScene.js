// src/scene/PsgCampusScene.js
// Quy hoạch khoa học Tầng 1 (68m x 44m): Mọi phòng đều tách biệt hoàn toàn với cửa gỗ mở trực tiếp ra hành lang (không đi xuyên phòng nào sang phòng khác)
// Phòng Chủ tịch có sảnh đệm mở sang trọng và chỉ cần mở ĐÚNG 1 cửa gỗ cao cấp để bước vào!
export class PsgCampusScene {
  constructor(scene, texFactory, furnitureFactory, vehicleSystem) {
    this.scene = scene;
    this.tex = texFactory;
    this.furn = furnitureFactory;
    this.vehicles = vehicleSystem;
    this.root = new THREE.Group();
    this.interactables = new Map();
    this.raycastMeshes = [];
    this.colliders = [];
    this.doors = [];
    this.seats = [];
    this.roomWaypoints = {};
    this.boardroomSeats = [];
    this.presidentMeetingSeat = { x: -26.0, z: -15.2, rotY: Math.PI };
    this.scene.add(this.root);
    this.build();
  }

  addCollider(cx, cz, w, d) {
    const c = { minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2, active: true };
    this.colliders.push(c);
    return c;
  }

  tagInteractable(object3D, id, label, icon, action, extra = null) {
    this.interactables.set(id, { id, label, icon, action, extra });
    object3D.traverse((child) => {
      if (child.isMesh) {
        child.userData.interactId = id;
        this.raycastMeshes.push(child);
      }
    });
  }

  addSeat(object3D, id, label, x, z, lookYaw, standX, standZ) {
    const seat = { id, label, x, z, lookYaw, standX, standZ };
    this.seats.push(seat);
    this.tagInteractable(object3D, id, `Ngồi ${label}`, '🪑', 'sit_seat', seat);
  }

  addGlassWindow(x, z, w, rotY = 0, hasBlinds = false) {
    const win = this.furn.createGlassWindowWall(w, 4.4, hasBlinds);
    win.position.set(x, 0.14, z);
    win.rotation.y = rotY;
    this.root.add(win);
    const rot = Math.abs(Math.sin(rotY)) > 0.5;
    this.addCollider(x, z, rot ? 0.24 : w, rot ? w : 0.24);
  }

  addWoodenDoor(id, x, z, rotY = 0, width = 1.9, isLuxury = false) {
    const group = new THREE.Group();
    group.position.set(x, 0.14, z);
    group.rotation.y = rotY;
    this.root.add(group);

    const frameMat = isLuxury ? this.furn.mats.darkWood : this.furn.mats.walnut;
    const leafMat = isLuxury ? this.furn.mats.walnut : this.furn.mats.oakLight;
    const handleMat = isLuxury ? this.furn.mats.gold : this.furn.mats.chrome;

    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 0.26), frameMat);
    postL.position.set(-width / 2, 1.3, 0);
    const postR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 0.26), frameMat);
    postR.position.set(width / 2, 1.3, 0);
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(width + 0.14, 0.16, 0.26), frameMat);
    lintel.position.set(0, 2.62, 0);
    const transom = new THREE.Mesh(new THREE.BoxGeometry(width + 0.18, 1.82, 0.22), new THREE.MeshStandardMaterial({ color: 0xe6e0d5, roughness: 0.65 }));
    transom.position.set(0, 3.58, 0);
    group.add(postL, postR, lintel, transom);

    const pivot = new THREE.Group();
    pivot.position.set(-width / 2 + 0.06, 0, 0);
    group.add(pivot);

    const leafW = width - 0.12;
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(leafW, 2.52, 0.075), leafMat);
    leaf.position.set(leafW / 2, 1.26, 0);
    leaf.castShadow = true;
    pivot.add(leaf);

    const panel = new THREE.Mesh(new THREE.BoxGeometry(leafW - 0.28, 1.88, 0.09), frameMat);
    panel.position.set(leafW / 2, 1.28, 0);
    pivot.add(panel);

    [-0.065, 0.065].forEach((hz) => {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.032, 0.05), handleMat);
      handle.position.set(leafW - 0.18, 1.08, hz);
      pivot.add(handle);
    });

    const isRot = Math.abs(Math.sin(rotY)) > 0.5;
    const col = this.addCollider(x, z, isRot ? 0.26 : width, isRot ? width : 0.26);
    const doorObj = { id, x, z, pivot, open: false, targetAngle: 0, collider: col };
    this.doors.push(doorObj);
    this.tagInteractable(pivot, id, isLuxury ? 'Mở / Đóng cửa gỗ Cao cấp' : 'Mở / Đóng cửa gỗ', '🚪', 'toggle_door', doorObj);
    return doorObj;
  }

  toggleDoor(doorObj) {
    doorObj.open = !doorObj.open;
    doorObj.targetAngle = doorObj.open ? Math.PI * 0.48 : 0;
    doorObj.collider.active = !doorObj.open;
    return doorObj.open;
  }

  updateDoors(dt, playerPos = null, npcs = []) {
    for (const d of this.doors) {
      let npcNear = false;
      for (const n of npcs) {
        const nd = Math.hypot(n.mesh.position.x - d.x, n.mesh.position.z - d.z);
        if (nd < 2.8) {
          npcNear = true;
          // NPC đang di chuyển đến gần cửa -> tự động mở cửa để đi qua!
          const moving = Math.hypot(n.target.x - n.mesh.position.x, n.target.z - n.mesh.position.z) > 0.35;
          if (moving && nd < 2.35 && !d.open) {
            d.open = true;
            d.targetAngle = Math.PI * 0.48;
            d.collider.active = false;
          }
        }
      }
      if (d.open && !npcNear && playerPos) {
        const dist = Math.hypot(playerPos.x - d.x, playerPos.z - d.z);
        if (dist > 3.6) {
          d.open = false;
          d.targetAngle = 0;
          d.collider.active = true;
        }
      }
      d.pivot.rotation.y += (d.targetAngle - d.pivot.rotation.y) * Math.min(1, dt * 8);
    }
  }

  resolveCollision(x, z, radius = 0.42) {
    let px = Math.max(-60, Math.min(60, x));
    let pz = Math.max(-62, Math.min(54, z));
    for (let iter = 0; iter < 3; iter++) {
      for (const b of this.colliders) {
        if (!b.active) continue;
        const cx = Math.max(b.minX, Math.min(px, b.maxX));
        const cz = Math.max(b.minZ, Math.min(pz, b.maxZ));
        const dx = px - cx, dz = pz - cz, d2 = dx * dx + dz * dz;
        if (d2 < radius * radius) {
          if (d2 > 1e-6) {
            const d = Math.sqrt(d2);
            px += (dx / d) * (radius - d);
            pz += (dz / d) * (radius - d);
          } else {
            const penL = Math.abs(px - b.minX), penR = Math.abs(b.maxX - px);
            const penT = Math.abs(pz - b.minZ), penB = Math.abs(b.maxZ - pz);
            const m = Math.min(penL, penR, penT, penB);
            if (m === penL) px = b.minX - radius;
            else if (m === penR) px = b.maxX + radius;
            else if (m === penT) pz = b.minZ - radius;
            else pz = b.maxZ + radius;
          }
        }
      }
    }
    return { x: px, z: pz };
  }

  build() {
    this.buildLighting();
    this.buildGroundAndRoads();
    this.buildHeadquarters();
    this.buildTrainingPitches();
    this.buildParkingAndVehicles();
    this.buildLandscapingInstanced();
  }

  buildLighting() {
    const hemi = new THREE.HemisphereLight(0xf3f7ff, 0x3b4252, 0.96);
    hemi.position.set(0, 50, 0);
    this.root.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff7e8, 1.05);
    sun.position.set(42, 58, 32);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 160;
    const d = 56;
    sun.shadow.camera.left = -d; sun.shadow.camera.right = d;
    sun.shadow.camera.top = d; sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.0005;
    this.root.add(sun);

    [
      [-26, 4.0, -14, 0xffe8c2, 0.95, 26],
      [-10, 4.0, -12, 0xf0f6ff, 0.85, 26],
      [0, 4.1, 12, 0xfffaf0, 0.9, 28],
      [-20, 4.0, 12, 0xf1f5ff, 0.82, 28],
      [20, 4.0, 12, 0xf1f5ff, 0.82, 28]
    ].forEach(([x, y, z, col, int, dist]) => {
      const l = new THREE.PointLight(col, int, dist, 1.5);
      l.position.set(x, y, z);
      this.root.add(l);
    });
  }

  buildGroundAndRoads() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 240),
      new THREE.MeshStandardMaterial({ color: 0x2a5734, roughness: 0.92 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    this.root.add(ground);

    const plaza = new THREE.Mesh(
      new THREE.BoxGeometry(84, 0.05, 68),
      new THREE.MeshStandardMaterial({ color: 0x262a33, roughness: 0.82 })
    );
    plaza.position.set(0, 0.0, 18);
    plaza.receiveShadow = true;
    this.root.add(plaza);

    const walkway = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.07, 16),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.65 })
    );
    walkway.position.set(0, 0.01, 30);
    this.root.add(walkway);

    const gateHouse = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.1, 3.2), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }));
    gateHouse.position.set(-14, 1.55, 47);
    this.root.add(gateHouse);
    this.addCollider(-14, 47, 4.2, 3.2);

    const gateArch = new THREE.Mesh(new THREE.BoxGeometry(16, 0.9, 1.1), new THREE.MeshStandardMaterial({ color: 0x00205b, roughness: 0.35, metalness: 0.3 }));
    gateArch.position.set(0, 4.5, 47);
    this.root.add(gateArch);
    const gateSign = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 0.76),
      new THREE.MeshStandardMaterial({ map: this.tex.signTexture('CAMPUS PARIS SAINT-GERMAIN · HEADQUARTERS', '#00205b', '#ffffff', '#da291c') })
    );
    gateSign.position.set(0, 4.5, 47.58);
    this.root.add(gateSign);
  }

  buildHeadquarters() {
    const floor1 = new THREE.Mesh(
      new THREE.BoxGeometry(68, 0.14, 44),
      new THREE.MeshStandardMaterial({ map: this.tex.marbleTexture('#e8e3d9', '#ccc5b8'), roughness: 0.35, metalness: 0.08 })
    );
    floor1.position.set(0, 0.05, 0);
    floor1.receiveShadow = true;
    this.root.add(floor1);

    const execFloor = new THREE.Mesh(
      new THREE.BoxGeometry(67.4, 0.04, 19.4),
      new THREE.MeshStandardMaterial({ map: this.tex.woodTexture('#4a2f21', '#2c1910'), roughness: 0.38, metalness: 0.08 })
    );
    execFloor.position.set(0, 0.13, -12.2);
    execFloor.receiveShadow = true;
    this.root.add(execFloor);

    const solidWallMat = new THREE.MeshStandardMaterial({ color: 0xe8e3da, roughness: 0.62, metalness: 0.03 });
    const darkTrimMat = new THREE.MeshStandardMaterial({ color: 0x222834, roughness: 0.55, metalness: 0.15 });

    const addWall = (x, z, w, d, h = 4.45, mat = solidWallMat) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, h / 2 + 0.1, z);
      m.castShadow = true;
      m.receiveShadow = true;
      this.root.add(m);
      this.addCollider(x, z, w, d);
      return m;
    };

    // === 1. NGOẠI THẤT KÍNH CƯỜNG LỰC TRONG SUỐT KHUNG NHÔM ===
    this.addGlassWindow(-26, -22, 16, 0, false);
    this.addGlassWindow(-10, -22, 16, 0, true);
    this.addGlassWindow(0, -22, 4, 0, false);
    this.addWoodenDoor('door_pitch_exit', 3.0, -22, 0, 2.0, true);
    this.addGlassWindow(6, -22, 4, 0, false);
    this.addGlassWindow(21, -22, 26, 0, false);

    this.addGlassWindow(-20, 22, 28, 0, false);
    this.addGlassWindow(-5, 22, 2, 0, false);
    this.addGlassWindow(5, 22, 2, 0, false);
    this.addGlassWindow(20, 22, 28, 0, false);

    this.addGlassWindow(-34, -12, 20, Math.PI / 2, false);
    this.addGlassWindow(-34, 12, 20, Math.PI / 2, false);
    this.addGlassWindow(34, -12, 20, Math.PI / 2, false);
    this.addGlassWindow(34, 12, 20, Math.PI / 2, false);

    // === 2. KHU B: BAN GIÁM ĐỐC (CHỈ 1 CỬA GỖ VÀO PHÒNG CHỦ TỊCH, SẢNH ĐỆM MỞ SANG TRỌNG) ===
    [-18, -2, 8, 17, 25.5].forEach((px) => addWall(px, -12.2, 0.24, 19.6, 4.45, solidWallMat));

    // Cổng vòm sảnh đệm Chủ tịch mở rộng 3.8m tại z = -2.4 (KHÔNG có cửa thứ 2 chắn lối!)
    addWall(-30.9, -2.4, 6.2, 0.24, 4.45, darkTrimMat);
    addWall(-21.1, -2.4, 6.2, 0.24, 4.45, darkTrimMat);
    const archTop = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.35, 0.26), darkTrimMat);
    archTop.position.set(-26.0, 3.85, -2.4);
    this.root.add(archTop);

    // ĐÚNG 1 CỬA GỖ CAO CẤP duy nhất tại z = -5.5 bước thẳng vào Phòng Chủ tịch!
    addWall(-30.5, -5.5, 7.0, 0.24, 4.45, solidWallMat);
    this.addWoodenDoor('door_president_main', -26.0, -5.5, 0, 2.0, true);
    addWall(-21.5, -5.5, 7.0, 0.24, 4.45, solidWallMat);

    // Phòng Họp, VIP, CEO, VP, GĐ Thể thao (mỗi phòng 1 cửa gỗ riêng mở thẳng ra hành lang chính z = -2.4)
    this.addGlassWindow(-14.5, -2.4, 7.0, 0, true);
    this.addWoodenDoor('door_boardroom', -10.0, -2.4, 0, 2.0, true);
    this.addGlassWindow(-5.5, -2.4, 7.0, 0, true);

    this.addGlassWindow(0, -2.4, 4.0, 0, false);
    this.addWoodenDoor('door_vip', 3.0, -2.4, 0, 1.9, true);
    this.addGlassWindow(6.0, -2.4, 4.0, 0, false);

    this.addGlassWindow(9.8, -2.4, 3.6, 0, false);
    this.addWoodenDoor('door_ceo', 12.5, -2.4, 0, 1.9, true);
    this.addGlassWindow(15.2, -2.4, 3.6, 0, false);

    this.addGlassWindow(18.6, -2.4, 3.2, 0, false);
    this.addWoodenDoor('door_vp', 21.2, -2.4, 0, 1.9, true);
    this.addGlassWindow(23.8, -2.4, 3.2, 0, false);

    this.addGlassWindow(27.1, -2.4, 3.2, 0, false);
    this.addWoodenDoor('door_sporting', 29.7, -2.4, 0, 1.9, true);
    this.addGlassWindow(32.3, -2.4, 3.2, 0, false);

    // === 3. KHU C & KHU D: TÁCH BIỆT HOÀN TOÀN BẰNG HÀNH LANG PHỤ RỘNG 3.2m (z = 10.6..13.8) NỐI THẲNG TỪ SẢNH CHÍNH ===
    // Vách ngăn Sảnh chính (x = -6 và x = 6): chừa lối mở rộng 3.2m (z ∈ [10.6, 13.8]) đi thẳng vào hành lang phụ Khu C & Khu D!
    addWall(-6, 6.5, 0.24, 8.2, 4.45, solidWallMat);
    addWall(-6, 17.9, 0.24, 8.2, 4.45, solidWallMat);
    addWall(6, 6.5, 0.24, 8.2, 4.45, solidWallMat);
    addWall(6, 17.9, 0.24, 8.2, 4.45, solidWallMat);

    // Vách ngăn dọc tách đôi các phòng Hàng 1 (z = 2.4..10.6) và Hàng 2 (z = 13.8..22.0) — KHÔNG cắt ngang hành lang phụ!
    addWall(-20, 6.5, 0.24, 8.2, 4.45, solidWallMat);
    addWall(-20, 17.9, 0.24, 8.2, 4.45, solidWallMat);
    addWall(20, 6.5, 0.24, 8.2, 4.45, solidWallMat);
    addWall(20, 17.9, 0.24, 8.2, 4.45, solidWallMat);

    // Tường sau Hàng 1 (z = 10.6) KÍN HOÀN TOÀN (tách biệt hẳn khỏi hành lang phụ)
    addWall(-20, 10.6, 28, 0.22, 4.45, solidWallMat);
    addWall(20, 10.6, 28, 0.22, 4.45, solidWallMat);

    // Mặt hành lang chính (z = 2.4) cho 4 phòng Hàng 1 (mỗi phòng có cửa gỗ & kính trong suốt riêng)
    this.addGlassWindow(-30.9, 2.4, 6.2, 0, false);
    this.addWoodenDoor('door_coach', -26.8, 2.4, 0, 2.0, false);
    this.addGlassWindow(-22.9, 2.4, 5.8, 0, false);

    this.addGlassWindow(-16.9, 2.4, 6.2, 0, false);
    this.addWoodenDoor('door_scouting', -12.8, 2.4, 0, 2.0, false);
    this.addGlassWindow(-8.9, 2.4, 5.8, 0, false);

    this.addGlassWindow(9.1, 2.4, 6.2, 0, true);
    this.addWoodenDoor('door_finance', 13.2, 2.4, 0, 2.0, false);
    this.addGlassWindow(17.1, 2.4, 5.8, 0, true);

    this.addGlassWindow(23.1, 2.4, 6.2, 0, false);
    this.addWoodenDoor('door_media', 27.2, 2.4, 0, 2.0, false);
    this.addGlassWindow(31.1, 2.4, 5.8, 0, false);

    // Mặt hành lang phụ (z = 13.8) cho 4 phòng Hàng 2 (mỗi phòng có cửa gỗ & kính trong suốt mở TRỰC TIẾP ra hành lang phụ!)
    this.addGlassWindow(-30.9, 13.8, 6.2, 0, false);
    this.addWoodenDoor('door_transfers', -26.8, 13.8, 0, 2.0, false);
    this.addGlassWindow(-22.9, 13.8, 5.8, 0, false);

    this.addGlassWindow(-16.9, 13.8, 6.2, 0, false);
    this.addWoodenDoor('door_academy', -12.8, 13.8, 0, 2.0, false);
    this.addGlassWindow(-8.9, 13.8, 5.8, 0, false);

    this.addGlassWindow(9.1, 13.8, 6.2, 0, false);
    this.addWoodenDoor('door_medical', 13.2, 13.8, 0, 2.0, false);
    this.addGlassWindow(17.1, 13.8, 5.8, 0, false);

    this.addGlassWindow(23.1, 13.8, 6.2, 0, false);
    this.addWoodenDoor('door_hr', 27.2, 13.8, 0, 2.0, false);
    this.addGlassWindow(31.1, 13.8, 5.8, 0, false);

    // === 4. NGOẠI THẤT TẦNG 2 ĐẾN TẦNG 8 ===
    const ceiling1 = new THREE.Mesh(new THREE.BoxGeometry(68.4, 0.35, 44.4), darkTrimMat);
    ceiling1.position.set(0, 4.65, 0);
    this.root.add(ceiling1);

    const upperTower = new THREE.Mesh(
      new THREE.BoxGeometry(68.2, 27.2, 44.2),
      new THREE.MeshStandardMaterial({ color: 0x0f2544, roughness: 0.16, metalness: 0.72 })
    );
    upperTower.position.set(0, 18.4, 0);
    upperTower.castShadow = true;
    this.root.add(upperTower);

    for (let fl = 2; fl <= 8; fl++) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(68.8, 0.32, 44.8), this.furn.mats.aluminum);
      band.position.set(0, 4.65 + (fl - 1) * 3.88, 0);
      this.root.add(band);
    }

    const facadeSign = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 3.6),
      new THREE.MeshStandardMaterial({
        map: this.tex.signTexture('PARIS SAINT-GERMAIN · EUROPEAN HEADQUARTERS', '#00205b', '#ffffff', '#da291c'),
        emissive: 0x0a1e40, emissiveIntensity: 0.35
      })
    );
    facadeSign.position.set(0, 29.6, 22.25);
    this.root.add(facadeSign);

    const ledGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.06, 12);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0xfff8e7 });
    const ledInst = new THREE.InstancedMesh(ledGeo, ledMat, 48);
    const dummy = new THREE.Object3D();
    let idx = 0;
    for (let gx = -28; gx <= 28; gx += 8) {
      for (let gz = -16; gz <= 16; gz += 6.4) {
        if (idx >= 48) break;
        dummy.position.set(gx, 4.44, gz);
        dummy.updateMatrix();
        ledInst.setMatrixAt(idx++, dummy.matrix);
      }
    }
    this.root.add(ledInst);

    this.addRoomLabel('← KHU B: BAN GIÁM ĐỐC · PHÒNG CHỦ TỊCH', -14, 0, Math.PI / 2, true);
    this.addRoomLabel('KHU D: HÀNH CHÍNH & Y TẾ →', 14, 0, -Math.PI / 2, true);
    this.addRoomLabel('← HÀNH LANG CHUYỂN NHƯỢNG & HỌC VIỆN', -6.3, 12.2, Math.PI / 2, true);
    this.addRoomLabel('HÀNH LANG Y TẾ & NHÂN SỰ →', 6.3, 12.2, -Math.PI / 2, true);

    this.furnishZoneA_Lobby();
    this.furnishZoneB_ExecutiveSuite();
    this.furnishZoneC_FootballOps();
    this.furnishZoneD_Corporate();
  }

  addRoomLabel(text, x, z, rotY = 0, isCorridorBanner = false) {
    const w = isCorridorBanner ? 3.4 : 1.55;
    const h = isCorridorBanner ? 0.56 : 0.38;
    const y = isCorridorBanner ? 3.45 : 1.68;
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: this.tex.signTexture(text, '#0f172a', '#f8fafc', '#da291c') })
    );
    sign.position.set(x, y, z);
    sign.rotation.y = rotY;
    this.root.add(sign);
  }

  furnishZoneA_Lobby() {
    this.roomWaypoints.lobby = { x: 0, z: 16.0 };
    this.addRoomLabel('SẢNH CHÍNH · PARIS SAINT-GERMAIN', 0, 21.6, Math.PI, true);

    const counter = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.12, 1.1), this.furn.mats.walnut);
    counter.position.set(0, 0.68, 8.2);
    counter.castShadow = true;
    this.root.add(counter);
    this.addCollider(0, 8.2, 5.2, 1.1);

    const pc1 = this.furn.createComputerSet('LỄ TÂN PSG');
    pc1.position.set(-1.1, 1.24, 8.1);
    this.root.add(pc1);
    const pc2 = this.furn.createComputerSet('ĐÓN TIẾP VIP');
    pc2.position.set(1.1, 1.24, 8.1);
    this.root.add(pc2);

    const recChair = this.furn.createSwivelChair(false);
    recChair.position.set(0, 0.14, 7.0);
    recChair.rotation.y = Math.PI;
    this.root.add(recChair);

    const bigCrest = new THREE.Mesh(
      new THREE.CircleGeometry(1.45, 36),
      new THREE.MeshStandardMaterial({ map: this.tex.psgCrestTexture(), transparent: true })
    );
    bigCrest.position.set(5.84, 2.45, 6.5);
    bigCrest.rotation.y = -Math.PI / 2;
    this.root.add(bigCrest);

    const infoScr = this.furn.createWallScreen(3.4, 1.75, 'PARC DES PRINCES · WELCOME');
    infoScr.position.set(-5.78, 2.35, 6.5);
    infoScr.rotation.y = Math.PI / 2;
    this.root.add(infoScr);

    const trophy = this.furn.createTrophyCabinet();
    trophy.position.set(-5.2, 0.14, 17.5);
    trophy.rotation.y = Math.PI / 2;
    this.root.add(trophy);
    this.addCollider(-5.2, 17.5, 0.6, 2.25);
    this.tagInteractable(trophy, 'lobby_trophy', 'Tủ Danh Hiệu & Lịch Sử PSG', '🏆', 'open_history');

    const sofa = this.furn.createSofa(3.0);
    sofa.position.set(4.9, 0.14, 17.5);
    sofa.rotation.y = -Math.PI / 2;
    this.root.add(sofa);
    this.addCollider(4.9, 17.5, 0.9, 3.0);
    this.addSeat(sofa, 'seat_lobby_vip', 'Sofa Sảnh Chính', 4.6, 17.5, Math.PI / 2, 3.3, 17.5);

    const coffee = this.furn.createCoffeeTable(1.6, 0.8);
    coffee.position.set(3.2, 0.14, 17.5);
    coffee.rotation.y = Math.PI / 2;
    this.root.add(coffee);
    this.addCollider(3.2, 17.5, 0.85, 1.6);

    [[-5.0, 20.8], [5.0, 20.8]].forEach(([px, pz]) => {
      const p = this.furn.createPottedPlant(1.2);
      p.position.set(px, 0.14, pz);
      this.root.add(p);
      this.addCollider(px, pz, 0.7, 0.7);
    });
  }

  furnishZoneB_ExecutiveSuite() {
    this.roomWaypoints.president = { x: -26.0, z: -11.5 };
    this.addRoomLabel('SẢNH ĐỆM CHỦ TỊCH', -23.1, -2.24, 0);
    this.addRoomLabel('PHÒNG CHỦ TỊCH · PHẠM MINH CHIÊU', -24.15, -5.34, 0);

    const presDesk = this.furn.createExecutiveDesk(3.4, 1.32, true);
    presDesk.position.set(-26.0, 0.14, -16.8);
    presDesk.rotation.y = Math.PI;
    this.root.add(presDesk);
    this.addCollider(-26.0, -16.8, 3.4, 1.32);
    this.tagInteractable(presDesk, 'pres_pc', 'Mở Máy tính macOS Chủ tịch', '💻', 'open_computer');

    const presChair = this.furn.createSwivelChair(true);
    presChair.position.set(-26.0, 0.14, -18.0);
    presChair.rotation.y = Math.PI;
    this.root.add(presChair);
    this.addSeat(presChair, 'seat_president', 'Ghế Da Chủ tịch', -26.0, -18.0, Math.PI, -26.0, -19.2);

    [-27.1, -24.9].forEach((gx, i) => {
      const gc = this.furn.createSwivelChair(false);
      gc.position.set(gx, 0.14, -15.2);
      this.root.add(gc);
      this.addSeat(gc, `seat_pres_guest_${i}`, 'Ghế đối diện bàn Chủ tịch', gx, -15.2, 0, gx, -14.0);
    });

    const presSofa = this.furn.createSofa(3.2);
    presSofa.position.set(-19.5, 0.14, -10.5);
    presSofa.rotation.y = -Math.PI / 2;
    this.root.add(presSofa);
    this.addCollider(-19.5, -10.5, 0.9, 3.2);
    this.addSeat(presSofa, 'seat_pres_sofa', 'Sofa Phòng Chủ tịch', -19.8, -10.5, Math.PI / 2, -21.2, -10.5);

    const presCoffee = this.furn.createCoffeeTable(1.7, 0.85);
    presCoffee.position.set(-21.6, 0.14, -10.5);
    presCoffee.rotation.y = Math.PI / 2;
    this.root.add(presCoffee);
    this.addCollider(-21.6, -10.5, 0.9, 1.7);

    const cab = this.furn.createFilingCabinet(2.0, 2.2, 0.50);
    cab.position.set(-18.5, 0.14, -17.5);
    cab.rotation.y = -Math.PI / 2;
    this.root.add(cab);
    this.addCollider(-18.5, -17.5, 0.55, 2.05);
    this.tagInteractable(cab, 'pres_cabinet', 'Tủ Hồ Sơ & Báo Cáo Chủ tịch', '📂', 'open_reports');

    const pTrophy = this.furn.createTrophyCabinet();
    pTrophy.position.set(-18.5, 0.14, -14.2);
    pTrophy.rotation.y = -Math.PI / 2;
    this.root.add(pTrophy);
    this.addCollider(-18.5, -14.2, 0.6, 2.25);
    this.tagInteractable(pTrophy, 'pres_trophy', 'Kệ Danh Hiệu Phòng Chủ tịch', '🏆', 'open_history');

    const wallScr = this.furn.createWallScreen(3.4, 1.8, 'PSG PRESIDENT COMMAND CENTER');
    wallScr.position.set(-18.22, 2.35, -10.5);
    wallScr.rotation.y = -Math.PI / 2;
    this.root.add(wallScr);

    const pCrest = new THREE.Mesh(
      new THREE.CircleGeometry(0.85, 36),
      new THREE.MeshStandardMaterial({ map: this.tex.psgCrestTexture(), transparent: true })
    );
    pCrest.position.set(-18.22, 2.55, -7.2);
    pCrest.rotation.y = -Math.PI / 2;
    this.root.add(pCrest);

    const jersey = this.furn.createFramedJersey('10');
    jersey.position.set(-22.2, 2.3, -5.66);
    jersey.rotation.y = Math.PI;
    this.root.add(jersey);

    const clock = this.furn.createWallClock();
    clock.position.set(-29.8, 2.8, -5.66);
    clock.rotation.y = Math.PI;
    this.root.add(clock);

    [[-32.5, -20.5], [-19.2, -20.5], [-29.0, -3.9], [-23.0, -3.9]].forEach(([px, pz]) => {
      const pl = this.furn.createPottedPlant(1.1);
      pl.position.set(px, 0.14, pz);
      this.root.add(pl);
      this.addCollider(px, pz, 0.7, 0.7);
    });

    // B2. Phòng Họp Ban Giám Đốc
    this.roomWaypoints.boardroom = { x: -10.0, z: -6.5 };
    this.addRoomLabel('PHÒNG HỌP BAN GIÁM ĐỐC', -8.15, -2.24, 0);

    const bTable = this.furn.createConferenceTable(8.0, 2.25);
    bTable.position.set(-10.0, 0.14, -12.5);
    this.root.add(bTable);
    this.addCollider(-10.0, -12.5, 8.0, 2.25);
    this.tagInteractable(bTable, 'boardroom_meeting', 'Triệu tập Họp Ban Lãnh Đạo', '🏛️', 'open_board_meeting');

    const headChair = this.furn.createSwivelChair(true);
    headChair.position.set(-14.9, 0.14, -12.5);
    headChair.rotation.y = Math.PI / 2;
    this.root.add(headChair);
    this.addSeat(headChair, 'seat_board_head', 'Ghế Chủ tọa Phòng Họp', -14.9, -12.5, -Math.PI / 2, -16.1, -12.5);

    for (let i = 0; i < 5; i++) {
      const sx = -13.0 + i * 1.55;
      const cN = this.furn.createSwivelChair(false);
      cN.position.set(sx, 0.14, -14.25);
      cN.rotation.y = Math.PI;
      this.root.add(cN);
      this.boardroomSeats.push({ x: sx, z: -14.25, rotY: 0 });

      const cS = this.furn.createSwivelChair(false);
      cS.position.set(sx, 0.14, -10.75);
      this.root.add(cS);
      this.boardroomSeats.push({ x: sx, z: -10.75, rotY: Math.PI });
      if (i === 2) this.addSeat(cS, 'seat_board_mid', 'Ghế Phòng Họp', sx, -10.75, 0, sx, -9.4);
    }

    const bScr = this.furn.createWallScreen(4.4, 2.1, 'HỌP BAN GIÁM ĐỐC PSG');
    bScr.position.set(-2.22, 2.35, -12.5);
    bScr.rotation.y = -Math.PI / 2;
    this.root.add(bScr);

    // B3. Phòng Tiếp Khách VIP
    this.roomWaypoints.vip = { x: 3.0, z: -7.5 };
    this.addRoomLabel('PHÒNG TIẾP KHÁCH VIP', 4.85, -2.24, 0);
    const vipSofa1 = this.furn.createSofa(3.0);
    vipSofa1.position.set(0.2, 0.14, -12.5);
    vipSofa1.rotation.y = Math.PI / 2;
    this.root.add(vipSofa1);
    this.addCollider(0.2, -12.5, 0.9, 3.0);
    this.addSeat(vipSofa1, 'seat_vip_lounge', 'Sofa Phòng Khách VIP', 0.5, -12.5, -Math.PI / 2, 1.8, -12.5);

    const vipSofa2 = this.furn.createSofa(3.0);
    vipSofa2.position.set(5.8, 0.14, -12.5);
    vipSofa2.rotation.y = -Math.PI / 2;
    this.root.add(vipSofa2);
    this.addCollider(5.8, -12.5, 0.9, 3.0);
    const vipCoffee = this.furn.createCoffeeTable(1.8, 0.95);
    vipCoffee.position.set(3.0, 0.14, -12.5);
    this.root.add(vipCoffee);
    this.addCollider(3.0, -12.5, 1.8, 0.95);

    // B4-B6. CEO, VP, GĐ Thể thao
    const execs = [
      { id: 'ceo', label: 'PHÒNG TỔNG GIÁM ĐỐC (CEO)', x: 12.5, deskZ: -15.5, hasRound: false },
      { id: 'vp', label: 'PHÒNG PHÓ CHỦ TỊCH', x: 21.2, deskZ: -14.8, hasRound: false },
      { id: 'sporting', label: 'PHÒNG GIÁM ĐỐC THỂ THAO', x: 29.7, deskZ: -15.5, hasRound: true }
    ];
    execs.forEach((e) => {
      this.roomWaypoints[e.id] = { x: e.x, z: -7.5 };
      this.addRoomLabel(e.label, e.x + 1.85, -2.24, 0);

      const dsk = this.furn.createExecutiveDesk(2.5, 1.12, false);
      dsk.position.set(e.x, 0.14, e.deskZ);
      dsk.rotation.y = Math.PI;
      this.root.add(dsk);
      this.addCollider(e.x, e.deskZ, 2.5, 1.12);
      this.tagInteractable(dsk, `desk_${e.id}`, `Máy tính (${e.label})`, '💻', 'open_computer');

      const ch = this.furn.createSwivelChair(true);
      ch.position.set(e.x, 0.14, e.deskZ - 1.1);
      ch.rotation.y = Math.PI;
      this.root.add(ch);
      this.addSeat(ch, `seat_${e.id}`, `Ghế ${e.label}`, e.x, e.deskZ - 1.1, Math.PI, e.x, e.deskZ - 2.1);

      if (e.hasRound) {
        const rt = this.furn.createRoundMeetingTable(1.0);
        rt.position.set(e.x, 0.14, -9.2);
        this.root.add(rt);
        this.addCollider(e.x, -9.2, 2.0, 2.0);
      } else {
        const sf = this.furn.createSofa(2.2);
        sf.position.set(e.x + 1.8, 0.14, -9.2);
        sf.rotation.y = -Math.PI / 2;
        this.root.add(sf);
        this.addCollider(e.x + 1.8, -9.2, 0.9, 2.2);
      }

      const cabE = this.furn.createFilingCabinet(1.5, 2.0, 0.44);
      cabE.position.set(e.x - 3.6, 0.14, -12.5);
      cabE.rotation.y = Math.PI / 2;
      this.root.add(cabE);
      this.addCollider(e.x - 3.6, -12.5, 0.5, 1.55);
    });
  }

  // Phòng ban độc lập rộng 14m x 8.2m (cửa gỗ mở trực tiếp ra hành lang, không đi xuyên phòng nào!)
  furnishLargeDepartment(cfg) {
    const { id, label, cx, cz, signZ, screenTitle, hasTactical = false, hasPrinter = false } = cfg;
    this.roomWaypoints[id] = { x: cx, z: cz - 2.5 };
    this.addRoomLabel(label, cx - 1.85, signZ - 0.30, Math.PI);

    // 1. Bàn Trưởng phòng
    const headDesk = this.furn.createExecutiveDesk(2.2, 1.0, false);
    headDesk.position.set(cx + 3.8, 0.14, cz - 0.8);
    this.root.add(headDesk);
    this.addCollider(cx + 3.8, cz - 0.8, 2.2, 1.0);
    this.tagInteractable(headDesk, `desk_${id}`, `Máy tính (${label})`, '💻', 'open_computer');

    const headChair = this.furn.createSwivelChair(true);
    headChair.position.set(cx + 3.8, 0.14, cz + 0.15);
    this.root.add(headChair);
    this.addSeat(headChair, `seat_${id}_head`, `Ghế Trưởng ${label}`, cx + 3.8, cz + 0.15, 0, cx + 3.8, cz + 1.15);

    // 2. Cụm 4 bàn làm việc nhân viên rộng thoáng
    const offsets = [[-3.8, -1.2], [-1.2, -1.2], [-3.8, 1.7], [-1.2, 1.7]];
    offsets.forEach(([ox, oz], idx) => {
      const sd = this.furn.createStaffDesk(screenTitle);
      sd.position.set(cx + ox, 0.14, cz + oz);
      this.root.add(sd);
      this.addCollider(cx + ox, cz + oz, 1.65, 0.82);

      const sc = this.furn.createSwivelChair(false);
      sc.position.set(cx + ox, 0.14, cz + oz + 0.85);
      this.root.add(sc);
      if (idx === 0) this.addSeat(sc, `seat_${id}_staff`, `Ghế nhân viên ${label}`, cx + ox, cz + oz + 0.85, 0, cx + ox, cz + oz + 1.65);
    });

    // 3. Bàn họp nhóm tròn
    const huddle = this.furn.createRoundMeetingTable(0.85);
    huddle.position.set(cx + 3.8, 0.14, cz + 2.35);
    this.root.add(huddle);
    this.addCollider(cx + 3.8, cz + 2.35, 1.7, 1.7);

    // 4. Tủ hồ sơ + Màn hình / Bảng chiến thuật / Máy in
    const cab = this.furn.createFilingCabinet(1.5, 1.9, 0.44);
    cab.position.set(cx + 6.4, 0.14, cz);
    cab.rotation.y = -Math.PI / 2;
    this.root.add(cab);
    this.addCollider(cx + 6.4, cz, 0.5, 1.55);

    if (hasTactical) {
      const tb = this.furn.createTacticalBoard();
      tb.position.set(cx + 6.65, 2.05, cz - 2.1);
      tb.rotation.y = -Math.PI / 2;
      this.root.add(tb);
      this.tagInteractable(tb, 'tactical_board', 'Xem Bảng Chiến Thuật Đội Hình', '📋', 'open_tactics');
    } else {
      const scr = this.furn.createWallScreen(2.5, 1.4, screenTitle);
      scr.position.set(cx + 6.65, 2.15, cz - 2.0);
      scr.rotation.y = -Math.PI / 2;
      this.root.add(scr);
    }

    if (hasPrinter) {
      const pr = this.furn.createPrinterStation();
      pr.position.set(cx + 6.3, 0.14, cz + 2.2);
      pr.rotation.y = -Math.PI / 2;
      this.root.add(pr);
      this.addCollider(cx + 6.3, cz + 2.2, 0.65, 0.95);
    }
  }

  furnishZoneC_FootballOps() {
    this.furnishLargeDepartment({ id: 'coach', label: 'BAN HUẤN LUYỆN & HLV TRƯỞNG', cx: -27, cz: 6.5, signZ: 2.56, screenTitle: 'PSG TACTICAL ROOM', hasTactical: true });
    this.furnishLargeDepartment({ id: 'scouting', label: 'PHÒNG TUYỂN TRẠCH & VIDEO', cx: -13, cz: 6.5, signZ: 2.56, screenTitle: 'SCOUTING VIDEO LAB' });
    this.furnishLargeDepartment({ id: 'transfers', label: 'PHÒNG CHUYỂN NHƯỢNG', cx: -27, cz: 17.9, signZ: 13.96, screenTitle: 'GLOBAL TRANSFER DESK' });
    this.furnishLargeDepartment({ id: 'academy', label: 'QUẢN LÝ CẦU THỦ & HỌC VIỆN', cx: -13, cz: 17.9, signZ: 13.96, screenTitle: 'PSG ACADEMY & CARE' });
  }

  furnishZoneD_Corporate() {
    this.furnishLargeDepartment({ id: 'finance', label: 'PHÒNG TÀI CHÍNH & PHÁP CHẾ', cx: 13, cz: 6.5, signZ: 2.56, screenTitle: 'FINANCE & FFP MONITOR', hasPrinter: true });
    this.furnishLargeDepartment({ id: 'media', label: 'TRUYỀN THÔNG & MARKETING', cx: 27, cz: 6.5, signZ: 2.56, screenTitle: 'PSG MEDIA & BRAND' });
    this.furnishLargeDepartment({ id: 'hr', label: 'NHÂN SỰ & QUẢN LÝ CSVC', cx: 27, cz: 17.9, signZ: 13.96, screenTitle: 'HR & STADIUM OPS', hasPrinter: true });

    // Trung tâm Y tế PSG (độc lập, cửa mở ra hành lang phụ z = 13.8)
    this.roomWaypoints.medical = { x: 13.0, z: 15.6 };
    this.addRoomLabel('TRUNG TÂM Y TẾ PSG', 11.35, 13.66, Math.PI);
    const medDesk = this.furn.createExecutiveDesk(2.1, 1.0, false);
    medDesk.position.set(17.2, 0.14, 16.4);
    this.root.add(medDesk);
    this.addCollider(17.2, 16.4, 2.1, 1.0);
    [-2.8, 0, 2.8].forEach((ox, i) => {
      const bed = this.furn.createMedicalBed();
      bed.position.set(11.8 + ox, 0.14, 19.3);
      bed.rotation.y = Math.PI / 2;
      this.root.add(bed);
      this.addCollider(11.8 + ox, 19.3, 0.95, 2.1);
      this.tagInteractable(bed, `med_bed_${i}`, 'Kiểm tra Y tế & Chấn thương', '🏥', 'open_medical');
    });
  }

  buildTrainingPitches() {
    const pitchMat = new THREE.MeshStandardMaterial({ map: this.tex.grassPitchTexture(true), roughness: 0.86 });
    const mainPitch = new THREE.Mesh(new THREE.PlaneGeometry(48, 28), pitchMat);
    mainPitch.rotation.x = -Math.PI / 2;
    mainPitch.position.set(0, 0.02, -44);
    mainPitch.receiveShadow = true;
    this.root.add(mainPitch);
    this.roomWaypoints.pitch = { x: 0, z: -31 };

    const postMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.4 });
    [-22.5, 22.5].forEach((gx) => {
      const g = new THREE.Group();
      const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), postMat); pL.position.set(0, 1.2, -3.5);
      const pR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), postMat); pR.position.set(0, 1.2, 3.5);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 7.1, 8), postMat); bar.rotation.x = Math.PI / 2; bar.position.set(0, 2.4, 0);
      const net = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.35, 6.9), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.32 }));
      net.position.set(gx < 0 ? -0.7 : 0.7, 1.18, 0);
      g.add(pL, pR, bar, net);
      g.position.set(gx, 0, -44);
      this.root.add(g);
    });

    [-48, 48].forEach((px) => {
      const sp = new THREE.Mesh(new THREE.PlaneGeometry(26, 18), pitchMat);
      sp.rotation.x = -Math.PI / 2;
      sp.position.set(px, 0.02, -44);
      this.root.add(sp);
    });
  }

  buildParkingAndVehicles() {
    const presCar = this.vehicles.createLuxuryCar(0x0b0e14);
    presCar.position.set(-10.5, 0.03, 31.5);
    presCar.rotation.y = Math.PI / 2;
    this.root.add(presCar);
    this.addCollider(-10.5, 31.5, 4.9, 2.1);
    this.tagInteractable(presCar, 'pres_car', 'Lên Xe Chủ tịch → SVĐ Parc des Princes', '🚘', 'open_matchday');

    const dirCar = this.vehicles.createLuxuryCar(0x1e293b);
    dirCar.position.set(-20.5, 0.03, 36.5);
    dirCar.rotation.y = Math.PI;
    this.root.add(dirCar);
    this.addCollider(-20.5, 36.5, 2.1, 4.9);

    const bus = this.vehicles.createTeamBus();
    bus.position.set(18.5, 0.03, 33.5);
    bus.rotation.y = Math.PI / 2;
    this.root.add(bus);
    this.addCollider(18.5, 33.5, 11.6, 2.9);
    this.tagInteractable(bus, 'team_bus', 'Xe Buýt Đội Bóng PSG → Trận Đấu 3D', '🚌', 'open_matchday');
    this.roomWaypoints.parking = { x: 0, z: 29 };
  }

  buildLandscapingInstanced() {
    const positions = [
      [-40, 26], [-40, 36], [40, 26], [40, 36],
      [-38, -26], [38, -26], [-32, -60], [0, -61], [32, -60]
    ];
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.34, 2.8, 8), new THREE.MeshStandardMaterial({ color: 0x4d3423, roughness: 0.9 }), positions.length);
    const crowns = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1.9, 1), new THREE.MeshStandardMaterial({ color: 0x265c34, roughness: 0.8 }), positions.length);
    const dummy = new THREE.Object3D();
    positions.forEach(([x, z], i) => {
      dummy.position.set(x, 1.4, z); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);
      this.addCollider(x, z, 0.8, 0.8);
      dummy.position.set(x, 3.6, z); dummy.scale.set(1.08, 1.05, 1.08); dummy.updateMatrix();
      crowns.setMatrixAt(i, dummy.matrix);
    });
    this.root.add(trunks, crowns);
  }
}
