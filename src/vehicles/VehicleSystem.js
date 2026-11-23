// src/vehicles/VehicleSystem.js
// Tạo xe Chủ tịch, xe ban lãnh đạo, xe huấn luyện viên và xe buýt đội bóng PSG
export class VehicleSystem {
  constructor(texFactory) {
    this.tex = texFactory;
  }

  createLuxuryCar(colorHex = 0x11141a, label = 'PSG') {
    const g = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.22, metalness: 0.75 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, transparent: true, opacity: 0.72, roughness: 0.08, metalness: 0.3 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.2, metalness: 0.9 });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.56, 4.8), bodyMat);
    chassis.position.y = 0.58;
    chassis.castShadow = true;
    g.add(chassis);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.52, 2.4), bodyMat);
    cabin.position.set(0, 1.06, -0.15);
    cabin.castShadow = true;
    g.add(cabin);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.44, 2.46), glassMat);
    windshield.position.set(0, 1.04, -0.15);
    g.add(windshield);

    // Đèn pha & đèn hậu
    [-0.68, 0.68].forEach((x) => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.06), new THREE.MeshStandardMaterial({ color: 0xfef9c3, emissive: 0xfef08a, emissiveIntensity: 0.8 }));
      hl.position.set(x, 0.64, 2.41);
      g.add(hl);
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.06), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 0.7 }));
      tl.position.set(x, 0.64, -2.41);
      g.add(tl);
    });

    // 4 bánh xe có vành hợp kim
    [[-0.98, 1.48], [0.98, 1.48], [-0.98, -1.48], [0.98, -1.48]].forEach(([x, z]) => {
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 16), wheelMat);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(x, 0.36, z);
      g.add(tire);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.28, 12), rimMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(x, 0.36, z);
      g.add(rim);
    });
    return g;
  }

  createTeamBus() {
    const g = new THREE.Group();
    const navyMat = new THREE.MeshStandardMaterial({ color: 0x00205b, roughness: 0.28, metalness: 0.45 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xda291c, roughness: 0.35, metalness: 0.2 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, transparent: true, opacity: 0.76, roughness: 0.1 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.85 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.75, 2.85, 11.4), navyMat);
    body.position.y = 1.92;
    body.castShadow = true;
    g.add(body);

    // Dải đỏ PSG chạy dọc hai bên thân xe buýt
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.79, 0.34, 11.42), redMat);
    stripe.position.y = 1.28;
    g.add(stripe);

    // Cửa kính toàn cảnh
    const windows = new THREE.Mesh(new THREE.BoxGeometry(2.78, 1.05, 9.8), glassMat);
    windows.position.set(0, 2.48, 0.2);
    g.add(windows);

    // Biển hiệu PARIS SAINT-GERMAIN bên hông
    const signTex = this.tex.signTexture('PARIS SAINT-GERMAIN · OFFICIAL TEAM BUS', '#00205b', '#ffffff', '#da291c');
    [-1.40, 1.40].forEach((x) => {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 0.72), new THREE.MeshStandardMaterial({ map: signTex }));
      panel.position.set(x, 1.65, 0);
      panel.rotation.y = x > 0 ? Math.PI / 2 : -Math.PI / 2;
      g.add(panel);
    });

    // 6 bánh xe buýt
    [[-1.36, 3.6], [1.36, 3.6], [-1.36, -2.5], [1.36, -2.5], [-1.36, -4.0], [1.36, -4.0]].forEach(([x, z]) => {
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.32, 16), wheelMat);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(x, 0.52, z);
      g.add(tire);
    });

    return g;
  }
}
