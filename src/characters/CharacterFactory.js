// src/characters/CharacterFactory.js
// Tạo mô hình nhân vật 3D có khớp nối đầy đủ (đầu, mặt, tóc, cổ, thân vest/đồ tập, tay có khớp, chân có khớp)
export class CharacterFactory {
  constructor() {
    this.skinTones = [0xf2c6a0, 0xe0ac82, 0xc68652, 0x8d5524, 0xf6d5b8];
    this.hairColors = [0x141414, 0x2c1d11, 0x4a321f, 0x6b4c2e, 0x8a8a8a, 0xb88a44];
  }

  createHumanoid(config = {}) {
    const {
      outfit = 'suit_navy', // suit_president, suit_navy, suit_charcoal, coach_psg, player_home, player_away, medical, media, security
      skinTone = 0xf2c6a0,
      hairColor = 0x161616,
      hairStyle = 0,
      heightScale = 1.0,
      tieColor = 0xda291c,
      jerseyColor = 0x00205b
    } = config;

    const root = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.62, metalness: 0.02 });
    const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.72, metalness: 0.05 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x111318, roughness: 0.35, metalness: 0.2 });

    let topColor = 0x14213d;
    let pantsColor = 0x111827;
    let shirtColor = 0xf8fafc;
    let hasTie = false;
    let isShorts = false;

    if (outfit === 'suit_president') {
      topColor = 0x0b1528; pantsColor = 0x0b1528; hasTie = true;
    } else if (outfit === 'suit_charcoal') {
      topColor = 0x2c313c; pantsColor = 0x20242c; hasTie = true;
    } else if (outfit === 'suit_navy') {
      topColor = 0x162b4d; pantsColor = 0x13223b; hasTie = true;
    } else if (outfit === 'coach_psg') {
      topColor = 0x00205b; pantsColor = 0x0f172a; shirtColor = 0xda291c;
    } else if (outfit === 'player_home') {
      topColor = 0x00205b; pantsColor = 0x00205b; isShorts = true;
    } else if (outfit === 'player_away') {
      topColor = jerseyColor; pantsColor = jerseyColor; isShorts = true;
    } else if (outfit === 'medical') {
      topColor = 0xe2e8f0; pantsColor = 0x334155; shirtColor = 0x0ea5e9;
    } else if (outfit === 'media') {
      topColor = 0x334155; pantsColor = 0x1e293b; shirtColor = 0xf1f5f9;
    } else if (outfit === 'security') {
      topColor = 0x111827; pantsColor = 0x0f172a; shirtColor = 0x38bdf8;
    }

    const topMat = new THREE.MeshStandardMaterial({ color: topColor, roughness: 0.58, metalness: 0.08 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.65, metalness: 0.05 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.5 });

    // Hông (pelvis) là tâm khớp thân người
    const pelvis = new THREE.Group();
    pelvis.position.y = 0.92;
    root.add(pelvis);

    const hipMesh = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.21), pantsMat);
    hipMesh.castShadow = true;
    pelvis.add(hipMesh);

    // Thân trên (torso)
    const torso = new THREE.Group();
    torso.position.y = 0.08;
    pelvis.add(torso);

    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.48, 0.23), topMat);
    chest.position.y = 0.26;
    chest.castShadow = true;
    torso.add(chest);

    // Dải đỏ PSG giữa ngực cho cầu thủ / HLV
    if (outfit === 'player_home' || outfit === 'coach_psg') {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.46, 0.242), new THREE.MeshStandardMaterial({ color: 0xda291c, roughness: 0.5 }));
      stripe.position.y = 0.26;
      torso.add(stripe);
    }

    // Áo sơ mi & cà vạt cho vest
    if (hasTie) {
      const collar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.24), shirtMat);
      collar.position.set(0, 0.43, 0.005);
      torso.add(collar);
      const tie = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.30, 0.025), new THREE.MeshStandardMaterial({ color: tieColor, roughness: 0.35 }));
      tie.position.set(0, 0.28, 0.125);
      torso.add(tie);
    }

    // Cổ và đầu
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.062, 0.10, 10), skinMat);
    neck.position.y = 0.53;
    torso.add(neck);

    const headGroup = new THREE.Group();
    headGroup.position.y = 0.66;
    torso.add(headGroup);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.132, 16, 14), skinMat);
    head.scale.set(0.92, 1.05, 0.95);
    head.castShadow = true;
    headGroup.add(head);

    // Mắt, lông mày, mũi
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });
    [-0.044, 0.044].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), eyeMat);
      eye.position.set(ex, 0.018, 0.112);
      headGroup.add(eye);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.01, 0.012), hairMat);
      brow.position.set(ex, 0.045, 0.115);
      headGroup.add(brow);
    });
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.042, 6), skinMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, -0.006, 0.128);
    headGroup.add(nose);

    // Kiểu tóc đa dạng
    const hairTop = new THREE.Mesh(new THREE.SphereGeometry(0.136, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.56), hairMat);
    hairTop.position.y = 0.016;
    hairTop.scale.set(0.95, 1.02, 0.98);
    headGroup.add(hairTop);
    if (hairStyle % 3 === 1) {
      // Tóc dài / búi sau
      const backHair = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.09), hairMat);
      backHair.position.set(0, -0.04, -0.09);
      headGroup.add(backHair);
    } else if (hairStyle % 3 === 2) {
      // Kiểu tóc vuốt cao hiện đại
      const crest = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.055, 0.16), hairMat);
      crest.position.set(0, 0.13, 0.02);
      headGroup.add(crest);
    }

    // Tay trái & tay phải có khớp vai + khuỷu tay
    const makeArm = (side) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.245, 0.44, 0);
      torso.add(shoulder);
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.046, 0.28, 10), topMat);
      upper.position.y = -0.14;
      upper.castShadow = true;
      shoulder.add(upper);
      const elbow = new THREE.Group();
      elbow.position.y = -0.28;
      shoulder.add(elbow);
      const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.036, 0.26, 10), isShorts ? skinMat : topMat);
      lower.position.y = -0.13;
      elbow.add(lower);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), skinMat);
      hand.position.y = -0.27;
      elbow.add(hand);
      return { shoulder, elbow };
    };
    const leftArm = makeArm(-1);
    const rightArm = makeArm(1);

    // Chân trái & chân phải có khớp hông + đầu gối + giày
    const makeLeg = (side) => {
      const hip = new THREE.Group();
      hip.position.set(side * 0.105, -0.04, 0);
      pelvis.add(hip);
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.074, 0.062, 0.42, 10), pantsMat);
      thigh.position.y = -0.21;
      thigh.castShadow = true;
      hip.add(thigh);
      const knee = new THREE.Group();
      knee.position.y = -0.42;
      hip.add(knee);
      const shinMat = isShorts ? skinMat : pantsMat;
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.046, 0.40, 10), shinMat);
      shin.position.y = -0.20;
      shin.castShadow = true;
      knee.add(shin);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.075, 0.22), shoeMat);
      shoe.position.set(0, -0.42, 0.05);
      knee.add(shoe);
      return { hip, knee };
    };
    const leftLeg = makeLeg(-1);
    const rightLeg = makeLeg(1);

    root.scale.setScalar(heightScale);
    root.userData.rig = {
      pelvis,
      torso,
      headGroup,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      basePelvisY: 0.92,
      animPhase: Math.random() * Math.PI * 2,
      state: 'idle'
    };
    return root;
  }
}
