import * as THREE from 'three';

export class Bird {
  constructor(scene) {
    this.scene = scene;
    this.reset();
  }

  reset() {
    // Bird group
    this.group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xffd700, roughness: 0.4, metalness: 0.3
    });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.castShadow = true;
    this.group.add(this.body);

    // Beak
    const beakGeo = new THREE.ConeGeometry(0.1, 0.35, 8);
    const beakMat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.5 });
    this.beak = new THREE.Mesh(beakGeo, beakMat);
    this.beak.rotation.z = -Math.PI / 2;
    this.beak.position.set(0.45, 0, 0);
    this.beak.castShadow = true;
    this.group.add(this.beak);

    // Eye
    const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0.2, 0.15, 0.25);
    this.group.add(eye);

    // Pupil
    const pupilGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(0.26, 0.15, 0.28);
    this.group.add(pupil);

    // Wing
    const wingGeo = new THREE.BoxGeometry(0.3, 0.05, 0.5);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.5 });
    this.wing = new THREE.Mesh(wingGeo, wingMat);
    this.wing.position.set(-0.1, -0.05, 0.35);
    this.wing.castShadow = true;
    this.group.add(this.wing);

    this.scene.scene.add(this.group);

    // Physics state
    this.velocity = 0;
    this.gravity = -20;
    this.jumpStrength = 9;
    this.positionY = 0;
    this.rotation = 0;
    this.alive = true;
    this.wingAngle = 0;
  }

  jump() {
    if (!this.alive) return;
    this.velocity = this.jumpStrength;
    this.wingUp = true;
  }

  update(dt) {
    if (!this.alive) return;

    // Wing animation
    this.wingAngle += dt * 12;
    this.wing.rotation.x = Math.sin(this.wingAngle) * 0.5;
    this.wing.position.z = 0.35 + Math.sin(this.wingAngle) * 0.1;

    // Physics
    this.velocity += this.gravity * dt;
    this.positionY += this.velocity * dt;

    // Clamp position
    if (this.positionY < -2.6) {
      this.positionY = -2.6;
      this.alive = false;
      this.velocity = 0;
    }
    if (this.positionY > 6) {
      this.positionY = 6;
      this.velocity = 0;
    }

    this.group.position.y = this.positionY;

    // Rotation based on velocity
    this.rotation = THREE.MathUtils.clamp(this.velocity * 0.04, -0.5, Math.PI / 2);
    this.group.rotation.z = this.rotation;
  }

  get position() {
    return new THREE.Vector3(0, this.positionY, 0);
  }

  get boundingBox() {
    const r = 0.35; // slightly smaller than visual radius for tighter collision
    return {
      minX: -0.35, maxX: 0.35,
      minY: this.positionY - r, maxY: this.positionY + r,
      minZ: -0.35, maxZ: 0.35
    };
  }

  destroy() {
    this.scene.scene.remove(this.group);
    this.group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
  }
}
