export class Game {
  constructor() {
    this.state = 'idle'; // idle, playing, gameover
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('flappy3d_highscore')) || 0;
    this.startTime = 0;
    this.elapsedTime = 0;
  }

  start() {
    this.state = 'playing';
    this.score = 0;
    this.startTime = performance.now();
  }

  update(dt) {
    if (this.state !== 'playing') return;
    this.elapsedTime += dt;
  }

  addScore() {
    this.score++;
  }

  die() {
    this.state = 'gameover';
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('flappy3d_highscore', this.highScore.toString());
    }
  }

  reset() {
    this.state = 'idle';
    this.score = 0;
    this.elapsedTime = 0;
    this.startTime = 0;
  }

  getScore() { return this.score; }
  getHighScore() { return this.highScore; }
  getState() { return this.state; }
}
