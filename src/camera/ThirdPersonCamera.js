// src/camera/ThirdPersonCamera.js
// Camera góc nhìn thứ nhất (First-Person) mượt mà, tự điều chỉnh độ cao mắt khi đứng và khi ngồi ghế
export class ThirdPersonCamera {
  constructor(camera) {
    this.camera = camera;
    this.yaw = Math.PI; // nhìn ra phía cửa / bàn làm việc Phòng Chủ tịch
    this.pitch = -0.06;
    this.eyeHeight = 1.72;
    this.targetEyeHeight = 1.72;
    this.fov = 62;
    this.currentPos = new THREE.Vector3();
    this.initialized = false;
  }

  setSeated(isSeated) {
    this.targetEyeHeight = isSeated ? 1.24 : 1.72;
  }

  setLookDirection(yaw, pitch = -0.05) {
    this.yaw = yaw;
    this.pitch = Math.max(-1.15, Math.min(1.15, pitch));
  }

  rotate(dx, dy) {
    this.yaw -= dx * 0.0048;
    this.pitch = Math.max(-1.15, Math.min(1.15, this.pitch - dy * 0.0042));
  }

  zoom(delta) {
    this.fov = Math.max(42, Math.min(76, this.fov + delta * 0.02));
    this.camera.fov = this.fov;
    this.camera.updateProjectionMatrix();
  }

  update(targetPosition, dt) {
    const alpha = Math.min(1, dt * 14);
    this.eyeHeight += (this.targetEyeHeight - this.eyeHeight) * Math.min(1, dt * 9);

    const desired = new THREE.Vector3(
      targetPosition.x,
      targetPosition.y + this.eyeHeight,
      targetPosition.z
    );

    if (!this.initialized) {
      this.currentPos.copy(desired);
      this.initialized = true;
    } else {
      this.currentPos.lerp(desired, alpha);
    }

    this.camera.position.copy(this.currentPos);
    const lookDir = new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    );
    this.camera.lookAt(this.currentPos.clone().add(lookDir));
  }
}
