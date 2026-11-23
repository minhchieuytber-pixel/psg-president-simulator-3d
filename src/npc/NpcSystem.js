import { PathfindingSystem } from '../ai/PathfindingSystem.js';
// src/npc/NpcSystem.js
// Sửa hướng ngồi ghế chuẩn xác (luôn quay mặt đúng về phía màn hình/bàn làm việc) và cho HLV Luis Enrique ra sân tập chỉ đạo cầu thủ đúng giờ tập (09:00-11:30 & 15:00-17:00)
export class NpcSystem {
  constructor(scene, charFactory, animSystem, campusScene) {
    this.scene = scene;
    this.charFactory = charFactory;
    this.animSystem = animSystem;
    this.campus = campusScene;
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.npcs = [];
    this.raycastMeshes = [];
    this.meetingActive = false;
    this.summonedPlayerNpc = null;
    this.wasTraining = null;
    this.pathfinder = new PathfindingSystem();
  }

  getCorrectDeskRotation(p) {
    // Trong CharacterFactory, mặt & chân ngồi duỗi hướng về +z khi rotation.y = 0, và hướng về -z khi rotation.y = Math.PI
    if (p.id === 'npc_recep') return 0;      // Lễ tân ngồi phía Bắc quầy (z=9.3), quay mặt +z ra cửa chính
    if (p.id === 'npc_sec') return 0;        // Bảo vệ quay mặt +z ra cổng
    if (p.home.z < 0) return 0;              // Khu B phía Bắc (CEO, VP, GĐ Thể thao): ghế sau bàn quay mặt +z về màn hình & cửa
    return Math.PI;                          // Khu C & D phía Nam: ghế phía Nam bàn quay mặt -z về màn hình máy tính
  }

  spawnFromProfiles(profiles, initialClockHour = 9.25) {
    while (this.group.children.length > 0) this.group.remove(this.group.children[0]);
    this.npcs = [];
    this.raycastMeshes = [];

    const trainingAtStart = this.isTrainingHour(initialClockHour);
    this.wasTraining = trainingAtStart;

    const restSpots = [
      { x: -2.8, z: 14.5 }, { x: 2.8, z: 14.5 }, { x: -10.5, z: 15.5 },
      { x: 10.5, z: 15.5 }, { x: 13.0, z: 14.8 }, { x: -1.5, z: 12.5 }
    ];
    let pIdx = 0;

    profiles.forEach((p, idx) => {
      const mesh = this.charFactory.createHumanoid({
        outfit: p.outfit,
        skinTone: p.skin,
        hairColor: p.hair,
        hairStyle: p.hairStyle,
        heightScale: 0.96 + (idx % 5) * 0.02,
        jerseyColor: p.jerseyColor || 0x00205b
      });

      const seatRotY = this.getCorrectDeskRotation(p);
      let startX = p.home.x;
      let startZ = p.home.z;
      let startMode = p.isPlayer ? (trainingAtStart ? 'train' : 'rest') : 'work_pc';
      let startRotY = seatRotY;

      // Nếu khởi đầu đang trong giờ tập, HLV Luis Enrique đứng sẵn ngoài đường biên sân tập chỉ đạo cầu thủ!
      if (p.id === 'npc_coach' && trainingAtStart) {
        startX = 0;
        startZ = -34.5;
        startMode = 'supervise';
        startRotY = Math.PI; // Quay mặt về phía sân tập (z = -44) nơi cầu thủ đang tập
      }

      mesh.position.set(startX, 0.14, startZ);
      mesh.rotation.y = startRotY;
      this.group.add(mesh);

      const npc = {
        ...p,
        mesh,
        target: new THREE.Vector3(startX, 0.14, startZ),
        restSpot: p.isPlayer ? restSpots[pIdx++ % restSpots.length] : p.home,
        mode: startMode,
        timer: 3 + (idx % 7) * 2,
        memory: p.memory || [],
        speed: p.isPlayer ? 3.4 : (p.id === 'npc_coach' ? 4.4 : 1.85),
        seatRotY,
        coachWaypointIdx: 0,
        path: [],
        taskWorkTimer: 0
      };
      mesh.traverse((child) => {
        if (child.isMesh) {
          child.userData.npcId = npc.id;
          this.raycastMeshes.push(child);
        }
      });
      this.npcs.push(npc);
    });
  }

  isTrainingHour(clockHour) {
    return (clockHour >= 10.0 && clockHour < 11.5) || (clockHour >= 15.0 && clockHour < 16.5);
  }
  isDressingRoomHour(clockHour) {
    return (clockHour >= 9.0 && clockHour < 10.0) || (clockHour >= 11.5 && clockHour < 12.5) || (clockHour >= 14.0 && clockHour < 15.0);
  }


  // Steering tránh va chạm động giữa NPC: tách nhẹ khi đứng gần, né sang bên
  // khi hai NPC đang đi ngược chiều; collider tĩnh vẫn do campus.resolveCollision xử lý.
  getNpcAvoidance(npc, desiredX, desiredZ, playerPos = null) {
    let ax = 0, az = 0;
    const px = npc.mesh.position.x, pz = npc.mesh.position.z;
    for (const other of this.npcs) {
      if (other === npc) continue;
      const dx = px - other.mesh.position.x;
      const dz = pz - other.mesh.position.z;
      const d2 = dx * dx + dz * dz;
      const minDist = 0.92;
      if (d2 > 1e-4 && d2 < minDist * minDist) {
        const d = Math.sqrt(d2);
        const strength = (minDist - d) / minDist;
        ax += (dx / d) * strength;
        az += (dz / d) * strength;
      }
    }
    if (playerPos) {
      const pdx = px - playerPos.x, pdz = pz - playerPos.z;
      const pd2 = pdx * pdx + pdz * pdz;
      if (pd2 > 1e-4 && pd2 < 1.05 * 1.05) {
        const pd = Math.sqrt(pd2);
        const strength = (1.05 - pd) / 1.05;
        ax += (pdx / pd) * strength * 1.15;
        az += (pdz / pd) * strength * 1.15;
      }
    }
    const len = Math.hypot(ax, az);
    if (len > 0.001) {
      // Ưu tiên lách ngang thay vì đứng đẩy nhau khi đi cùng hành lang.
      const sideX = -desiredZ, sideZ = desiredX;
      const sideSign = (npc.id || '').length % 2 ? 1 : -1;
      ax = ax / len * 0.55 + sideX * sideSign * 0.45;
      az = az / len * 0.55 + sideZ * sideSign * 0.45;
      const al = Math.hypot(ax, az) || 1;
      return { x: ax / al, z: az / al, strength: Math.min(1, len) };
    }
    return null;
  }

  setNpcDestination(npc, destX, destZ) {
    const pts = this.pathfinder.findPath(npc.mesh.position.x, npc.mesh.position.z, destX, destZ);
    npc.path = pts;
    if (pts.length > 0) npc.target.set(pts[0].x, 0.14, pts[0].z);
  }

  dispatchNpcForTask(npcId, resultKey) {
    const npc = this.getById(npcId);
    if (!npc) return null;
    const dest = PathfindingSystem.getTaskTargetRoom(resultKey);
    npc.mode = 'task_travel';
    npc.taskWorkTimer = 14;
    this.setNpcDestination(npc, dest.x, dest.z);
    return dest;
  }

  summonBoardMeeting() {
    this.meetingActive = true;
    const execIds = ['npc_ceo', 'npc_vp', 'npc_sporting', 'npc_coach', 'npc_cfo', 'npc_media', 'npc_mkt', 'npc_legal'];
    execIds.forEach((id, i) => {
      const npc = this.npcs.find((n) => n.id === id);
      const seat = this.campus.boardroomSeats[i];
      if (npc && seat) {
        this.setNpcDestination(npc, seat.x, seat.z);
        npc.meetingRotY = seat.rotY;
        npc.mode = 'going_meeting';
      }
    });
  }

  endBoardMeeting() {
    this.meetingActive = false;
    this.npcs.forEach((n) => {
      if (n.mode === 'going_meeting' || n.mode === 'meeting') {
        this.setNpcDestination(n, n.home.x, n.home.z);
        n.mode = 'returning';
      }
    });
  }

  summonPlayerToPresidentOffice(playerName) {
    let npc = this.npcs.find((n) => n.name === playerName);
    if (!npc) npc = this.npcs.find((n) => n.isPlayer);
    if (!npc) return null;
    this.summonedPlayerNpc = npc;
    this.setNpcDestination(npc, -26.0, -15.2);
    npc.meetingRotY = Math.PI; // Quay mặt về phía bàn Chủ tịch (-z)
    npc.mode = 'going_president';
    return npc;
  }

  dismissSummonedPlayer() {
    if (!this.summonedPlayerNpc) return;
    const n = this.summonedPlayerNpc;
    this.setNpcDestination(n, n.home.x, n.home.z);
    n.mode = 'returning';
    this.summonedPlayerNpc = null;
  }

  update(dt, playerPos, clockHour = 9.5, onScheduleToast = null) {
    const trainingNow = this.isTrainingHour(clockHour);

    // Thông báo khi chuyển ca tập luyện <-> nghỉ ngơi
    if (this.wasTraining !== null && trainingNow !== this.wasTraining) {
      this.wasTraining = trainingNow;
      if (onScheduleToast) {
        onScheduleToast(trainingNow
          ? '⚽ Đã đến giờ tập! HLV Luis Enrique đã ra sân tập chính chỉ đạo đội một PSG.'
          : '☕ Hết giờ tập! Đội một PSG về nghỉ hồi phục và HLV Luis Enrique về phòng chiến thuật.');
      }
    }

    const coachSidelineSpots = [
      { x: 0, z: -34.5 }, { x: -7, z: -34.5 }, { x: 7, z: -34.5 }, { x: 0, z: -36.5 }
    ];

    this.npcs.forEach((n) => {
      const distToPlayer = n.mesh.position.distanceTo(playerPos);
      const near = distToPlayer < 55;

      const drNow = this.isDressingRoomHour(clockHour);
      // HLV Trưởng Luis Enrique: Trước giờ tập họp chiến thuật tại Phòng Thay Đồ, tới giờ tập ra sân tập chỉ đạo cầu thủ
      if (n.id === 'npc_coach' && !this.meetingActive && n.mode !== 'going_meeting' && n.mode !== 'meeting') {
        if (drNow && clockHour >= 9.65 && clockHour < 10.0) {
          n.task = 'Đang phổ biến chiến thuật trước buổi tập tại Phòng Thay Đồ PSG';
          if (Math.hypot(n.target.x - (-34.5), n.target.z - (-45.2)) > 1.5) {
            this.setNpcDestination(n, -34.5, -45.2);
            n.mode = 'supervise_walk';
          }
        } else if (trainingNow) {
          n.task = 'Đang trực tiếp đứng sân tập chính chỉ đạo bài tập của đội một PSG';
          if (n.mode !== 'supervise' && n.mode !== 'supervise_walk') {
            this.setNpcDestination(n, 0, -34.5);
            n.mode = 'supervise_walk';
          }
        } else {
          n.task = 'Phân tích băng hình đối thủ và lên giáo án chiến thuật tại Phòng HLV';
          if (n.mode === 'supervise' || n.mode === 'supervise_walk') {
            this.setNpcDestination(n, n.home.x, n.home.z);
            n.mode = 'returning';
          }
        }
      }

      // Cầu thủ đội 1 tuân thủ lịch sinh hoạt: Có mặt tại Phòng Thay Đồ trước giờ tập 60 phút -> Ra sân tập -> Về phòng thay đồ -> Nghỉ ngơi
      if (n.isPlayer && n !== this.summonedPlayerNpc && n.mode !== 'going_president' && n.mode !== 'sit_president') {
        if (drNow) {
          n.task = 'Đang có mặt tại Phòng Thay Đồ chuẩn bị trang phục & nghe phổ biến chiến thuật (trước giờ tập 60 phút)';
          const drX = -40 + ((n.name.length * 3) % 7);
          const drZ = -48 + ((n.age * 5) % 8);
          if (n.mode !== 'dressing') { n.mode = 'dressing'; this.setNpcDestination(n, drX, drZ); }
        } else if (trainingNow) {
          n.task = 'Đang tập luyện dưới sự chỉ đạo trực tiếp của HLV Luis Enrique';
          if (n.mode === 'rest' || n.mode === 'dressing') {
            n.mode = 'train';
            this.setNpcDestination(n, n.home.x, n.home.z);
          }
        } else {
          n.task = 'Nghỉ ngơi, hồi phục thể lực theo lịch sinh hoạt CLB';
          if (n.mode === 'train') {
            n.mode = 'rest';
            this.setNpcDestination(n, n.restSpot.x, n.restSpot.z);
          }
        }
      }

      const dx = n.target.x - n.mesh.position.x;
      const dz = n.target.z - n.mesh.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.25) {
        const step = Math.min(dist, n.speed * dt);
        const desiredX = dx / dist, desiredZ = dz / dist;
        const avoid = this.getNpcAvoidance(n, desiredX, desiredZ, playerPos);
        const steer = avoid ? Math.min(0.72, avoid.strength * 0.72) : 0;
        const moveX = desiredX * (1 - steer) + (avoid?.x || 0) * steer;
        const moveZ = desiredZ * (1 - steer) + (avoid?.z || 0) * steer;
        const moveLen = Math.hypot(moveX, moveZ) || 1;
        const rawX = n.mesh.position.x + (moveX / moveLen) * step;
        const rawZ = n.mesh.position.z + (moveZ / moveLen) * step;
        let res = this.campus.resolveCollision(rawX, rawZ, 0.36);
        // Nếu hướng né bị đồ đạc chặn, thử trượt theo trục còn lại để tránh mắc kẹt ở góc.
        if (Math.hypot(res.x - n.mesh.position.x, res.z - n.mesh.position.z) < step * 0.18) {
          const slideX = this.campus.resolveCollision(rawX, n.mesh.position.z, 0.36);
          const slideZ = this.campus.resolveCollision(n.mesh.position.x, rawZ, 0.36);
          const sx = Math.hypot(slideX.x - n.mesh.position.x, slideX.z - n.mesh.position.z);
          const sz = Math.hypot(slideZ.x - n.mesh.position.x, slideZ.z - n.mesh.position.z);
          if (sx > sz) res = slideX;
          else if (sz > 0) res = slideZ;
        }
        const movedDist = Math.hypot(res.x - n.mesh.position.x, res.z - n.mesh.position.z);
        n.mesh.position.x = res.x;
        n.mesh.position.z = res.z;
        n.mesh.rotation.y = Math.atan2(dx, dz);
        // Nếu bị tường/đồ nội thất chặn đứng khi đang đi dạo, quay về ghế làm việc thay vì kẹt
        if (movedDist < step * 0.22 && n.mode === 'roam') {
          n.mode = 'work_pc';
          this.setNpcDestination(n, n.home.x, n.home.z);
        }
        if (near) this.animSystem.updateRig(n.mesh, n.isPlayer && n.mode === 'train' ? 'train' : 'walk', dt);
      } else {
        // Nếu còn điểm tiếp theo trên lộ trình A*, chuyển sang điểm kế tiếp!
        if (n.path && n.path.length > 1) {
          n.path.shift();
          n.target.set(n.path[0].x, 0.14, n.path[0].z);
          return;
        }
        n.path = [];
        if (n.mode === 'task_travel') {
          n.mode = 'task_working';
          n.taskWorkTimer = 14;
        } else if (n.mode === 'task_working') {
          n.taskWorkTimer -= dt;
          if (near) this.animSystem.updateRig(n.mesh, 'talk', dt);
          if (n.taskWorkTimer <= 0) {
            n.mode = 'returning';
            this.setNpcDestination(n, n.home.x, n.home.z);
          }
          return;
        }
        if (n.mode === 'going_meeting') { n.mode = 'meeting'; n.mesh.rotation.y = n.meetingRotY ?? 0; }
        else if (n.mode === 'going_president') { n.mode = 'sit_president'; n.mesh.rotation.y = Math.PI; }
        else if (n.mode === 'supervise_walk') { n.mode = 'supervise'; n.mesh.rotation.y = Math.PI; n.timer = 5; }
        else if (n.mode === 'returning') {
          n.mode = n.isPlayer ? (trainingNow ? 'train' : 'rest') : 'work_pc';
          n.mesh.rotation.y = n.seatRotY;
        }

        if (n.mode === 'supervise') {
          // HLV đi dọc đường biên quan sát & vẫy tay chỉ đạo các cầu thủ đang tập (quay mặt về phía sân z = -44)
          n.mesh.rotation.y = Math.PI;
          n.timer -= dt;
          if (n.timer <= 0) {
            n.timer = 6 + Math.random() * 5;
            n.coachWaypointIdx = (n.coachWaypointIdx + 1) % coachSidelineSpots.length;
            const wp = coachSidelineSpots[n.coachWaypointIdx];
            n.target.set(wp.x, 0.14, wp.z);
            n.mode = 'supervise_walk';
          }
          if (near) this.animSystem.updateRig(n.mesh, 'supervise', dt);
        } else if (n.mode === 'meeting' || n.mode === 'sit_president') {
          n.mesh.rotation.y = n.mode === 'sit_president' ? Math.PI : (n.meetingRotY ?? 0);
          if (near) this.animSystem.updateRig(n.mesh, 'sit', dt);
        } else if (n.isPlayer && n.mode === 'train') {
          n.timer -= dt;
          if (n.timer <= 0) {
            n.timer = 2.4 + Math.random() * 3.6;
            n.target.set(
              Math.max(-20, Math.min(20, n.home.x + (Math.random() - 0.5) * 14)),
              0.14,
              Math.max(-55, Math.min(-33, n.home.z + (Math.random() - 0.5) * 10))
            );
          }
          if (near) this.animSystem.updateRig(n.mesh, 'train', dt);
        } else if (n.isPlayer && n.mode === 'rest') {
          if (near) this.animSystem.updateRig(n.mesh, 'idle', dt);
        } else {
          // Nhân viên ngồi đúng hướng ghế làm việc máy tính hoặc đi lại ngắn trong phòng
          if (n.mode === 'work_pc') n.mesh.rotation.y = n.seatRotY;
          n.timer -= dt;
          if (n.timer <= 0 && !this.meetingActive) {
            n.timer = 9 + Math.random() * 10;
            if (n.mode === 'work_pc' && n.id !== 'npc_recep' && n.id !== 'npc_sec') {
              n.mode = 'roam';
              n.target.set(n.home.x + (Math.random() - 0.5) * 1.8, 0.14, n.home.z + (n.home.z < 0 ? 1.4 : -1.4));
            } else {
              n.mode = 'work_pc';
              this.setNpcDestination(n, n.home.x, n.home.z);
            }
          }
          if (near) {
            const animState = n.mode === 'work_pc' ? (n.id === 'npc_sec' ? 'idle' : 'work_pc') : (distToPlayer < 4.5 ? 'talk' : 'idle');
            this.animSystem.updateRig(n.mesh, animState, dt);
          }
        }
      }
    });
  }

  getById(id) {
    return this.npcs.find((n) => n.id === id) || null;
  }
}
