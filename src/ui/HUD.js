/**
 * プレイヤーHUD
 * - ハート型HPアイコン（ゼルダ風）
 * - ダメージ時の赤フラッシュ
 * - scene イベント 'playerDamaged' / 'playerDied' を購読
 */
export class HUD {
  constructor(scene, player) {
    this.scene  = scene;
    this.player = player;

    this._heartGfx  = []; // ハートグラフィックスの配列
    this._flashRect = null;

    this._buildHearts();

    // Player から発行されるイベントを購読
    scene.events.on('playerDamaged', this._onDamaged, this);
    scene.events.on('shutdown',      this.destroy,    this);
  }

  // ── ハートアイコン生成 ────────────────────

  _buildHearts() {
    const maxHearts = Math.ceil(this.player.hpMax / 2); // 2HP = 1ハート
    const sx = 14;
    const sy = this.scene.scale.height - 18;
    const step = 20;

    for (let i = 0; i < maxHearts; i++) {
      const g = this.scene.add.graphics()
        .setScrollFactor(0)
        .setDepth(200);
      this._heartGfx.push(g);
      this._drawHeart(g, sx + i * step, sy, 1.0);
    }

    this.update(this.player.hp);
  }

  // ── ハートを 1 つ描画（fill: 0=空 / 0.5=半分 / 1=満タン）──

  _drawHeart(g, cx, cy, fill) {
    g.clear();

    // 空ハート（暗い輪郭）
    g.fillStyle(0x553333, 0.5);
    this._heartShape(g, cx, cy);
    g.fill();

    // 満タン部分（赤）
    if (fill >= 1) {
      g.fillStyle(0xff2244, 1.0);
      this._heartShape(g, cx, cy);
      g.fill();
    } else if (fill >= 0.5) {
      // 半分（左半分のみ赤）
      g.fillStyle(0xff2244, 1.0);
      this._heartShapeHalf(g, cx, cy);
      g.fill();
    }

    // 白ハイライト
    g.fillStyle(0xffffff, 0.3);
    g.fillRect(cx - 4, cy - 7, 3, 2);
    g.fillRect(cx + 1, cy - 7, 3, 2);
  }

  // ハート形パス（9×9 ピクセルアート風）
  _heartShape(g, cx, cy) {
    g.beginPath();
    // 上段2つの丸
    g.fillRect(cx - 7, cy - 7, 5, 3);
    g.fillRect(cx + 2, cy - 7, 5, 3);
    // 中段
    g.fillRect(cx - 8, cy - 4, 16, 4);
    // 下段（三角）
    g.fillRect(cx - 7, cy,      14, 2);
    g.fillRect(cx - 5, cy + 2,  10, 2);
    g.fillRect(cx - 3, cy + 4,   6, 2);
    g.fillRect(cx - 1, cy + 6,   2, 2);
  }

  // 左半分のみのハート形（半ダメージ表示用）
  _heartShapeHalf(g, cx, cy) {
    g.beginPath();
    g.fillRect(cx - 7, cy - 7, 5, 3);
    g.fillRect(cx - 8, cy - 4, 8, 4);
    g.fillRect(cx - 7, cy,      7, 2);
    g.fillRect(cx - 5, cy + 2,  5, 2);
    g.fillRect(cx - 3, cy + 4,  3, 2);
    g.fillRect(cx - 1, cy + 6,  1, 2);
  }

  // ── HP 表示更新 ───────────────────────────

  update(hp) {
    const maxHearts = this._heartGfx.length;
    const sx = 14;
    const sy = this.scene.scale.height - 18;
    const step = 20;

    for (let i = 0; i < maxHearts; i++) {
      const heartHp = hp - i * 2;       // このハートに対応するHP残量
      const fill = heartHp >= 2 ? 1.0   // 満タン
                 : heartHp === 1 ? 0.5  // 半分
                 : 0;                   // 空
      this._drawHeart(this._heartGfx[i], sx + i * step, sy, fill);
    }
  }

  // ── ダメージフラッシュ ────────────────────

  _onDamaged(hp) {
    this.update(hp);
    this._flashRed();
  }

  _flashRed() {
    // 既にフラッシュ中なら重ねない
    if (this._flashRect?.active) return;

    const { width, height } = this.scene.scale;
    this._flashRect = this.scene.add.rectangle(0, 0, width, height, 0xff0000, 0.35)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(250);

    this.scene.tweens.add({
      targets: this._flashRect,
      alpha: 0,
      duration: 320,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this._flashRect?.destroy();
        this._flashRect = null;
      },
    });
  }

  // ── 破棄 ──────────────────────────────────

  destroy() {
    this._heartGfx.forEach(g => g.destroy());
    this._heartGfx = [];
    this._flashRect?.destroy();
    this.scene.events.off('playerDamaged', this._onDamaged, this);
  }
}
