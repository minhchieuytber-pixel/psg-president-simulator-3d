// src/animations/AnimationSystem.js
// Hệ thống hoạt ảnh khớp nối cho nhân vật 3D (đứng, đi, chạy, ngồi, làm việc, nói chuyện, sút, chuyền, tắc bóng, ném biên, chỉ đạo HLV)
export class AnimationSystem {
  updateRig(meshRoot, state, dt, speedFactor = 1.0) {
    const rig = meshRoot?.userData?.rig;
    if (!rig) return;
    rig.state = state;
    const rate = state === 'run' ? 11.5 : state === 'walk' ? 7.2 : state === 'train' ? 9.5 : 3.2;
    rig.animPhase += dt * rate * speedFactor;
    const t = rig.animPhase;
    const lerp = (a, b, f = Math.min(1, dt * 12)) => a + (b - a) * f;

    if (state === 'kick' || state === 'pass') {
      const power = state === 'kick' ? 1.18 : 0.72;
      rig.pelvis.position.y = lerp(rig.pelvis.position.y, rig.basePelvisY - 0.04);
      rig.torso.rotation.x = lerp(rig.torso.rotation.x, -0.15);
      rig.rightLeg.hip.rotation.x = lerp(rig.rightLeg.hip.rotation.x, -power);
      rig.rightLeg.knee.rotation.x = lerp(rig.rightLeg.knee.rotation.x, 0.25);
      rig.leftLeg.hip.rotation.x = lerp(rig.leftLeg.hip.rotation.x, 0.28);
      rig.leftLeg.knee.rotation.x = lerp(rig.leftLeg.knee.rotation.x, 0.15);
      rig.leftArm.shoulder.rotation.x = lerp(rig.leftArm.shoulder.rotation.x, -0.65);
      rig.rightArm.shoulder.rotation.x = lerp(rig.rightArm.shoulder.rotation.x, 0.55);
      rig.leftArm.elbow.rotation.x = lerp(rig.leftArm.elbow.rotation.x, -0.4);
      rig.rightArm.elbow.rotation.x = lerp(rig.rightArm.elbow.rotation.x, -0.4);
    } else if (state === 'tackle') {
      // Xoạc bóng (tackle) hạ thấp trọng tâm và duỗi chân trượt
      rig.pelvis.position.y = lerp(rig.pelvis.position.y, 0.42);
      rig.torso.rotation.x = lerp(rig.torso.rotation.x, -0.58);
      rig.rightLeg.hip.rotation.x = lerp(rig.rightLeg.hip.rotation.x, -1.25);
      rig.rightLeg.knee.rotation.x = lerp(rig.rightLeg.knee.rotation.x, 0.12);
      rig.leftLeg.hip.rotation.x = lerp(rig.leftLeg.hip.rotation.x, -0.65);
      rig.leftLeg.knee.rotation.x = lerp(rig.leftLeg.knee.rotation.x, 1.35);
      rig.leftArm.shoulder.rotation.x = lerp(rig.leftArm.shoulder.rotation.x, 0.65);
      rig.rightArm.shoulder.rotation.x = lerp(rig.rightArm.shoulder.rotation.x, -0.5);
    } else if (state === 'throw_in') {
      // Ném biên: giơ hai tay qua đầu cầm bóng ném vào sân
      rig.pelvis.position.y = lerp(rig.pelvis.position.y, rig.basePelvisY);
      rig.torso.rotation.x = lerp(rig.torso.rotation.x, -0.18 + Math.sin(t * 2) * 0.15);
      rig.leftLeg.hip.rotation.x = lerp(rig.leftLeg.hip.rotation.x, -0.15);
      rig.rightLeg.hip.rotation.x = lerp(rig.rightLeg.hip.rotation.x, 0.22);
      rig.leftLeg.knee.rotation.x = lerp(rig.leftLeg.knee.rotation.x, 0.1);
      rig.rightLeg.knee.rotation.x = lerp(rig.rightLeg.knee.rotation.x, 0.15);
      rig.leftArm.shoulder.rotation.x = lerp(rig.leftArm.shoulder.rotation.x, -2.75);
      rig.rightArm.shoulder.rotation.x = lerp(rig.rightArm.shoulder.rotation.x, -2.75);
      rig.leftArm.elbow.rotation.x = lerp(rig.leftArm.elbow.rotation.x, -0.35);
      rig.rightArm.elbow.rotation.x = lerp(rig.rightArm.elbow.rotation.x, -0.35);
    } else if (state === 'supervise') {
      // HLV chỉ đạo trên sân tập (khoanh tay / vẫy tay hướng dẫn)
      rig.pelvis.position.y = lerp(rig.pelvis.position.y, rig.basePelvisY);
      rig.torso.rotation.x = lerp(rig.torso.rotation.x, 0.03);
      rig.leftLeg.hip.rotation.x = lerp(rig.leftLeg.hip.rotation.x, 0);
      rig.rightLeg.hip.rotation.x = lerp(rig.rightLeg.hip.rotation.x, 0);
      rig.leftLeg.knee.rotation.x = lerp(rig.leftLeg.knee.rotation.x, 0);
      rig.rightLeg.knee.rotation.x = lerp(rig.rightLeg.knee.rotation.x, 0);
      rig.rightArm.shoulder.rotation.x = -0.85 + Math.sin(t * 1.4) * 0.45;
      rig.rightArm.elbow.rotation.x = -0.4;
      rig.leftArm.shoulder.rotation.x = -0.25;
      rig.leftArm.elbow.rotation.x = -0.5;
      rig.headGroup.rotation.y = Math.sin(t * 0.7) * 0.35;
    } else if (state === 'walk' || state === 'run' || state === 'train') {
      const amp = state === 'run' ? 0.72 : state === 'train' ? 0.58 : 0.46;
      const armAmp = amp * 0.85;
      rig.pelvis.position.y = lerp(rig.pelvis.position.y, rig.basePelvisY + Math.abs(Math.sin(t)) * (state === 'run' ? 0.065 : 0.032));
      rig.torso.rotation.x = lerp(rig.torso.rotation.x, state === 'run' ? 0.14 : 0.04);
      rig.leftLeg.hip.rotation.x = Math.sin(t) * amp;
      rig.rightLeg.hip.rotation.x = -Math.sin(t) * amp;
      rig.leftLeg.knee.rotation.x = Math.max(0, -Math.cos(t) * amp * 0.9);
      rig.rightLeg.knee.rotation.x = Math.max(0, Math.cos(t) * amp * 0.9);
      rig.leftArm.shoulder.rotation.x = -Math.sin(t) * armAmp;
      rig.rightArm.shoulder.rotation.x = Math.sin(t) * armAmp;
      rig.leftArm.elbow.rotation.x = -0.32 - Math.max(0, Math.sin(t) * 0.3);
      rig.rightArm.elbow.rotation.x = -0.32 - Math.max(0, -Math.sin(t) * 0.3);
      rig.headGroup.rotation.y = lerp(rig.headGroup.rotation.y, 0);
    } else if (state === 'sit' || state === 'work_pc') {
      rig.pelvis.position.y = lerp(rig.pelvis.position.y, 0.56);
      rig.torso.rotation.x = lerp(rig.torso.rotation.x, state === 'work_pc' ? 0.08 : 0.02);
      rig.leftLeg.hip.rotation.x = lerp(rig.leftLeg.hip.rotation.x, -1.48);
      rig.rightLeg.hip.rotation.x = lerp(rig.rightLeg.hip.rotation.x, -1.48);
      rig.leftLeg.knee.rotation.x = lerp(rig.leftLeg.knee.rotation.x, 1.48);
      rig.rightLeg.knee.rotation.x = lerp(rig.rightLeg.knee.rotation.x, 1.48);
      if (state === 'work_pc') {
        rig.leftArm.shoulder.rotation.x = lerp(rig.leftArm.shoulder.rotation.x, -0.75 + Math.sin(t * 2.2) * 0.06);
        rig.rightArm.shoulder.rotation.x = lerp(rig.rightArm.shoulder.rotation.x, -0.75 + Math.cos(t * 2.4) * 0.06);
        rig.leftArm.elbow.rotation.x = lerp(rig.leftArm.elbow.rotation.x, -0.82);
        rig.rightArm.elbow.rotation.x = lerp(rig.rightArm.elbow.rotation.x, -0.82);
      } else {
        rig.leftArm.shoulder.rotation.x = lerp(rig.leftArm.shoulder.rotation.x, -0.45);
        rig.rightArm.shoulder.rotation.x = lerp(rig.rightArm.shoulder.rotation.x, -0.45);
        rig.leftArm.elbow.rotation.x = lerp(rig.leftArm.elbow.rotation.x, -0.7);
        rig.rightArm.elbow.rotation.x = lerp(rig.rightArm.elbow.rotation.x, -0.7);
      }
      rig.headGroup.rotation.y = Math.sin(t * 0.45) * 0.14;
    } else if (state === 'talk') {
      rig.pelvis.position.y = lerp(rig.pelvis.position.y, rig.basePelvisY);
      rig.torso.rotation.x = lerp(rig.torso.rotation.x, 0.02);
      rig.leftLeg.hip.rotation.x = lerp(rig.leftLeg.hip.rotation.x, 0);
      rig.rightLeg.hip.rotation.x = lerp(rig.rightLeg.hip.rotation.x, 0);
      rig.leftLeg.knee.rotation.x = lerp(rig.leftLeg.knee.rotation.x, 0);
      rig.rightLeg.knee.rotation.x = lerp(rig.rightLeg.knee.rotation.x, 0);
      rig.leftArm.shoulder.rotation.x = -0.35 + Math.sin(t * 1.4) * 0.25;
      rig.rightArm.shoulder.rotation.x = -0.42 + Math.cos(t * 1.6) * 0.30;
      rig.leftArm.elbow.rotation.x = -0.75;
      rig.rightArm.elbow.rotation.x = -0.85;
      rig.headGroup.rotation.y = Math.sin(t * 0.9) * 0.18;
    } else {
      rig.pelvis.position.y = lerp(rig.pelvis.position.y, rig.basePelvisY + Math.sin(t) * 0.012);
      rig.torso.rotation.x = lerp(rig.torso.rotation.x, 0);
      rig.leftLeg.hip.rotation.x = lerp(rig.leftLeg.hip.rotation.x, 0);
      rig.rightLeg.hip.rotation.x = lerp(rig.rightLeg.hip.rotation.x, 0);
      rig.leftLeg.knee.rotation.x = lerp(rig.leftLeg.knee.rotation.x, 0);
      rig.rightLeg.knee.rotation.x = lerp(rig.rightLeg.knee.rotation.x, 0);
      rig.leftArm.shoulder.rotation.x = lerp(rig.leftArm.shoulder.rotation.x, Math.sin(t) * 0.04);
      rig.rightArm.shoulder.rotation.x = lerp(rig.rightArm.shoulder.rotation.x, -Math.sin(t) * 0.04);
      rig.leftArm.elbow.rotation.x = lerp(rig.leftArm.elbow.rotation.x, -0.1);
      rig.rightArm.elbow.rotation.x = lerp(rig.rightArm.elbow.rotation.x, -0.1);
      rig.headGroup.rotation.y = lerp(rig.headGroup.rotation.y, Math.sin(t * 0.5) * 0.08);
    }
  }
}
