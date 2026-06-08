import * as THREE from 'three';

export class PipeManager {
  constructor(scene) {
    this.scene = scene;
    this.pipes = [];
    this.pipeSpeed = 4;
    this.spawnTimer = 0;
    this.spawnInterval = 1.8;
    this.gapHeight = 3.0;
    this.minPipeY = -1.5;
    this.maxPipeTop = 4.5;
  }

  spawnPipe() {
    const gapY = this.minPipeY + Math.random() * (this.maxPipeTop - this.minPipeY);
    const gapTop = gapY + this.gapHeight / 2;
    const gapBottom = gapY - this.gapHeight / 2;

    // Pipe group
    const group = new THREE.Group();

    const pipeMat = new THREE.MeshStandardMaterial({
      color: 0x22aa44, roughness: 0.6, metalness: 0.1
    });
    const pipeDarkMat = new THREE.MeshStandardMaterial({
      color: 0x1a8833, roughness: 0.7, metalness: 0.1
    });

    // Top pipe
    const topH = 8 - gapTop;
    const topPipe = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, topH, 1.2),
      topH > 2 ? pipeMat : pipeDarkMat
    );
    topPipe.position.set(0, gapTop + topH / 2, 0);
    topPipe.castShadow = true;
    topPipe.receiveShadow = true;
    group.add(topPipe);

    // Top pipe cap
    const topCap = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.3, 1.5),
      pipeMat
    );
    topCap.position.set(0, gapTop + 0.15, 0);
    topCap.castShadow = true;
    group.add(topCap);

    // Bottom pipe
    const botH = gapBottom + 3;
    const botPipe = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, botH, 1.2),
      botH > 2 ? pipeMat : pipeDarkMat
    );
    botPipe.position.set(0, -3 + botH / 2, 0);
    botPipe.castShadow = true;
    botPipe.receiveShadow = true;
    group.add(botPipe);

    // Bottom pipe cap
    const botCap = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.3, 1.5),
      pipeMat
    );
    botCap.position.set(0, gapBottom - 0.15, 0);
    botCap.castShadow = true;
    group.add(botCap);

    // Start pipe on the right side
    group.position.x = 12;
    group.position.z = 0;

    this.scene.scene.add(group);

    const pipeData = {
      group,
      x: 12,
      gapTop,
      gapBottom,
      scored: false
    };
    this.pipes.push(pipeData);
    return pipeData;
  }

  update(dt) {
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnPipe();
    }

    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i];
      pipe.x -= this.pipeSpeed * dt;
      pipe.group.position.x = pipe.x;

      // Remove if off screen
      if (pipe.x < -10) {
        this.scene.scene.remove(pipe.group);
        pipe.group.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        });
        this.pipes.splice(i, 1);
      }
    }
  }

  getPipeCollisionBox(pipe) {
    const pipeW = 0.65; // half-width for collision
    return {
      minX: pipe.x - pipeW,
      maxX: pipe.x + pipeW,
      gapTop: pipe.gapTop,
      gapBottom: pipe.gapBottom
    };
  }

  checkCollision(birdBox) {
    for (const pipe of this.pipes) {
      const pBox = this.getPipeCollisionBox(pipe);

      // Check if bird is in pipe's X range
      if (birdBox.maxX > pBox.minX && birdBox.minX < pBox.maxX) {
        // Check if bird is NOT in the gap
        if (birdBox.maxY > pBox.gapBottom && birdBox.minY < pBox.gapTop) {
          return true; // collision detected
        }
      }
    }
    return false;
  }

  checkScoring(birdX) {
    for (const pipe of this.pipes) {
      if (!pipe.scored && pipe.x < birdX && pipe.x > birdX - 0.5) {
        pipe.scored = true;
        return true;
      }
    }
    return false;
  }

  clear() {
    for (const pipe of this.pipes) {
      this.scene.scene.remove(pipe.group);
      pipe.group.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
    }
    this.pipes = [];
  }

  setDifficulty(score) {
    // Speed up gradually
    this.pipeSpeed = 4 + Math.min(score * 0.15, 4);
    this.spawnInterval = Math.max(1.0, 1.8 - score * 0.04);
  }
}
