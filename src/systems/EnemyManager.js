import { PatrolEnemy } from '../entities/PatrolEnemy.js';
import { RushEnemy }   from '../entities/RushEnemy.js';
import { RangedEnemy } from '../entities/RangedEnemy.js';

/**
 * 敵の生成・テクスチャ管理・更新を担当
 * FieldScene から使う:
 *   this.enemyMgr = new EnemyManager(this, this.player, this.layer);
 *   this.combat.setEnemyGroup(this.enemyMgr.getGroup());
 */
export class EnemyManager {
  constructor(scene, player, layer) {
    this.scene   = scene;
    this.player  = player;
    this.layer   = layer;
    this.enemies = [];

    this._createTextures();
  }

  // ── テクスチャ生成（Canvas 2D）────────────

  _createTextures() {
    this._makeTexture('enemy_patrol', 32, 40, this._drawPatrol);
    this._makeTexture('enemy_rush',   32, 40, this._drawRush);
    this._makeTexture('enemy_ranged', 32, 40, this._drawRanged);
  }

  _makeTexture(key, w, h, drawFn) {
    if (this.scene.textures.exists(key)) return;
    const canvas = this.scene.textures.createCanvas(key, w, h);
    const ctx    = canvas.getContext();
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx, w, h);
    canvas.refresh();
  }

  // ── パトロール敵（青いガード）──────────────

  _drawPatrol(ctx, w, h) {
    const cx = w / 2;
    // 影
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(cx, h - 3, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
    // 足
    ctx.fillStyle = '#2a4e8b';
    ctx.fillRect(cx - 7, 26, 5, 10);
    ctx.fillRect(cx + 2, 26, 5, 10);
    // ブーツ
    ctx.fillStyle = '#1a2e5b';
    ctx.fillRect(cx - 8, 33, 6, 4);
    ctx.fillRect(cx + 2, 33, 6, 4);
    // 胴体（鎧）
    ctx.fillStyle = '#3a6eab';
    ctx.fillRect(cx - 8, 14, 16, 14);
    // 腕
    ctx.fillStyle = '#2a5e9b';
    ctx.fillRect(cx - 12, 15, 5, 10);
    ctx.fillRect(cx + 7,  15, 5, 10);
    // 盾（左腕に）
    ctx.fillStyle = '#8b3a22';
    ctx.fillRect(cx - 16, 13, 6, 10);
    ctx.fillStyle = '#cc6644';
    ctx.fillRect(cx - 15, 14, 4,  8);
    // 槍（右腕に）
    ctx.fillStyle = '#aaaaaa';
    ctx.fillRect(cx + 10, 2, 3, 28);
    ctx.fillStyle = '#dddd44';
    ctx.fillRect(cx + 9,  0, 5,  5);
    // 顔
    ctx.fillStyle = '#c8a878'; ctx.fillRect(cx - 5, 8, 10, 8);
    // ヘルメット
    ctx.fillStyle = '#4a4a7a'; ctx.fillRect(cx - 6,  3, 12, 8);
    ctx.fillStyle = '#3a3a6a'; ctx.fillRect(cx - 7,  2, 14, 4);
    // 目（赤く光る）
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(cx - 4, 10, 3, 3);
    ctx.fillRect(cx + 1, 10, 3, 3);
  }

  // ── 突進敵（赤いベルセルカー）──────────────

  _drawRush(ctx, w, h) {
    const cx = w / 2;
    // 影
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(cx, h - 3, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
    // 足（太い）
    ctx.fillStyle = '#8b2211'; ctx.fillRect(cx - 8, 26, 7, 10);
    ctx.fillStyle = '#8b2211'; ctx.fillRect(cx + 1, 26, 7, 10);
    ctx.fillStyle = '#5b1100'; ctx.fillRect(cx - 9, 33, 8, 4);
    ctx.fillStyle = '#5b1100'; ctx.fillRect(cx + 1, 33, 8, 4);
    // 胴体（大きめ）
    ctx.fillStyle = '#cc3322'; ctx.fillRect(cx - 10, 12, 20, 16);
    // 腕（太い）
    ctx.fillStyle = '#aa2211'; ctx.fillRect(cx - 14, 12, 6, 13);
    ctx.fillStyle = '#aa2211'; ctx.fillRect(cx + 8,  12, 6, 13);
    // 頭（大きめ）
    ctx.fillStyle = '#cc3322'; ctx.fillRect(cx - 8,  2, 16, 13);
    // 角
    ctx.fillStyle = '#663300';
    ctx.fillRect(cx - 9, 0, 3, 6);
    ctx.fillRect(cx + 6, 0, 3, 6);
    // 目（黄色）
    ctx.fillStyle = '#ffee00';
    ctx.fillRect(cx - 6, 7, 5, 4);
    ctx.fillRect(cx + 1, 7, 5, 4);
    // 牙
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 4, 13, 3, 4);
    ctx.fillRect(cx + 1, 13, 3, 4);
    // 傷（白線）
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(cx + 2, 4, 2, 8);
  }

  // ── 遠距離敵（紫のメイジ）──────────────────

  _drawRanged(ctx, w, h) {
    const cx = w / 2;
    // 影
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(cx, h - 3, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
    // ローブ下部（台形）
    ctx.fillStyle = '#4a2277';
    ctx.beginPath();
    ctx.moveTo(cx - 8, 20); ctx.lineTo(cx - 12, h - 4);
    ctx.lineTo(cx + 12, h - 4); ctx.lineTo(cx + 8, 20);
    ctx.closePath(); ctx.fill();
    // ローブ上部
    ctx.fillStyle = '#6633aa'; ctx.fillRect(cx - 8, 12, 16, 10);
    // 腕
    ctx.fillStyle = '#5522aa';
    ctx.fillRect(cx - 12, 13, 5, 9);
    ctx.fillRect(cx + 7,  13, 5, 9);
    // 杖
    ctx.fillStyle = '#6b4a0a'; ctx.fillRect(cx + 10, 0, 3, 24);
    // 杖の宝珠
    ctx.fillStyle = '#ff88ff'; ctx.beginPath();
    ctx.arc(cx + 11, 3, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffbbff'; ctx.beginPath();
    ctx.arc(cx + 10, 2, 2, 0, Math.PI * 2); ctx.fill();
    // 顔
    ctx.fillStyle = '#ddbbff'; ctx.fillRect(cx - 5, 7, 10, 8);
    // フード
    ctx.fillStyle = '#6633aa'; ctx.fillRect(cx - 6,  4, 12, 8);
    ctx.fillStyle = '#4a2277'; ctx.fillRect(cx - 7,  2, 14, 5);
    ctx.fillStyle = '#3a1155'; ctx.fillRect(cx - 7,  1, 14, 3);
    // 目（魔法で光る）
    ctx.fillStyle = '#ffaaff';
    ctx.fillRect(cx - 4, 10, 3, 3);
    ctx.fillRect(cx + 1, 10, 3, 3);
  }

  // ── 敵の配置 ──────────────────────────────

  spawnPatrol(x, y, waypoints) {
    const e = new PatrolEnemy(this.scene, x, y, waypoints);
    e.setPlayer(this.player);
    this.scene.physics.add.collider(e, this.layer);
    this.enemies.push(e);
    return e;
  }

  spawnRush(x, y) {
    const e = new RushEnemy(this.scene, x, y);
    e.setPlayer(this.player);
    this.scene.physics.add.collider(e, this.layer);
    this.enemies.push(e);
    return e;
  }

  spawnRanged(x, y) {
    const e = new RangedEnemy(this.scene, x, y);
    e.setPlayer(this.player);
    this.scene.physics.add.collider(e, this.layer);
    this.enemies.push(e);
    return e;
  }

  // ── 毎フレーム更新 ────────────────────────

  update(delta) {
    // 死亡した敵を除去
    this.enemies = this.enemies.filter(e => e.active && e.state !== 'dead');

    // 遠距離敵の弾更新
    this.enemies.forEach(e => {
      if (typeof e.updateBullets === 'function') {
        e.updateBullets(delta, this.player);
      }
    });
  }

  // CombatManager に渡すグループ互換オブジェクト
  getGroup() {
    return {
      getChildren: () => this.enemies.filter(e => e.active && e.state !== 'dead'),
    };
  }

  destroy() {
    this.enemies.forEach(e => { if (e.active) e.destroy(); });
    this.enemies = [];
  }
}
