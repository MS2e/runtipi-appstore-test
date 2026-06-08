export class UI {
  constructor() {
    this.scoreEl = document.getElementById('score');
    this.highScoreEl = document.getElementById('high-score');
    this.startScreen = document.getElementById('start-screen');
    this.gameOverScreen = document.getElementById('game-over-screen');
    this.finalScoreEl = document.getElementById('final-score');
    this.bestScoreEl = document.getElementById('best-score');
    this.loadingEl = document.getElementById('loading');

    this.btnPlay = document.getElementById('btn-play');
    this.btnRestart = document.getElementById('btn-restart');

    this.highScoreEl.textContent = `Best: ${this.loadHighScore()}`;

    this.btnPlay.addEventListener('click', () => this.triggerPlay());
    this.btnRestart.addEventListener('click', () => this.triggerRestart());
  }

  loadHighScore() {
    return parseInt(localStorage.getItem('flappy3d_highscore')) || 0;
  }

  saveHighScore(score) {
    localStorage.setItem('flappy3d_highscore', score.toString());
  }

  updateScore(score) {
    this.scoreEl.textContent = score;
    // Pop animation
    this.scoreEl.classList.remove('pop');
    void this.scoreEl.offsetWidth; // force reflow
    this.scoreEl.classList.add('pop');
  }

  showHighScore(score) {
    this.highScoreEl.textContent = `Best: ${this.loadHighScore()}`;
  }

  showStartScreen() {
    this.startScreen.style.display = 'flex';
    this.gameOverScreen.style.display = 'none';
    this.scoreEl.style.display = 'none';
    this.highScoreEl.style.display = 'none';
  }

  showGameHUD() {
    this.startScreen.style.display = 'none';
    this.gameOverScreen.style.display = 'none';
    this.scoreEl.style.display = 'block';
    this.highScoreEl.style.display = 'block';
  }

  showGameOver(score) {
    this.startScreen.style.display = 'none';
    this.scoreEl.style.display = 'none';
    this.highScoreEl.style.display = 'none';
    this.gameOverScreen.style.display = 'flex';
    this.finalScoreEl.textContent = `Score: ${score}`;
    this.bestScoreEl.textContent = `Best: ${this.loadHighScore()}`;
  }

  hideLoading() {
    this.loadingEl.classList.add('hidden');
  }

  triggerPlay(callback) {
    if (callback) callback();
  }

  triggerRestart(callback) {
    if (callback) callback();
  }

  dispose() {
    this.btnPlay.removeEventListener('click', () => {});
    this.btnRestart.removeEventListener('click', () => {});
  }
}
