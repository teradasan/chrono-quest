import { Enemy } from './Enemy.js';
import * as Phaser from 'phaser';

const DETECT_RANGE   = 210;  // 感知距離(px)
const OPTIMAL_RANGE  = 150;  // 理想射程(px) ─ この距離を保って射撃
const FLEE_RANGE     =  75;  // 逃げ出す距離(px)
const SHOOT_COOLDOWN = 2200; // 射撃クールダウン(ms)
const BULLET_SPEED   = 155;  // 弾速(px/s)
const BULLET_LIFE    = 2200; // 弾の寿命(ms)
const MOVE_SPEED     =  60;  // 移動速度(px/s)

/**
 * 遠距離型敵（メイジ）
 * プレイヤーとの距離を OPTIMAL_RANGE 付近に保ちながら弾を放つ
 * 近づかれると逃げる
 */
export class RangedEnemy extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy_ranged', { hp: 4, speed: MOVE_SPEED, atk: 1 });
    this._shootCooldown = 1000; // 初弾は少し待つ
    this._bullets       = [];
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.state === 'dead' || this._hurtTimer > 0) return;

    this._shootCooldown = Math.max(0, this._shootCooldown - delta);

    const dist = this.distToPlayer();
    if (dist > DETECT_RANGE) {
      this.body.setVelocity(0, 0);
      this.state = 'idle';
      return;
    }

    this.state = 'active';
    const dir  = this.dirToPlayer();

    if (dist < FLEE_RANGE) {
      // 近すぎる → 逃げる
      this.body.setVelocity(-dir.x * MOVE_SPEED * 1.3, -dir.y * MOVE_SPEED * 1.3);
    } else if (dist > OPTIMAL_RANGE) {
      // 遠すぎる → 近づく（ゆっくり）
      this.body.setVelocity(dir.x * MOVE_SPEED * 0.5, dir.y * MOVE_SPEED * 0.5);
    } else {
      // 適正距離 → 止まって射撃
      this.body.setVelocity(0, 0);
      if (this._shootCooldown <= 0) {
        this._shoot(dir);
        this._shootCooldown = SHOOT_COOLDOWN;
      }
    }
  }

  // ── 射撃 ──────────────────────────────────

  _shoot(dir) {
    // 弾丸オブジェクト（小さい円）
    const bullet = this.scene.add.circle(this.x, this.y, 5, 0xff44ff, 1).setDepth(9);
    this.scene.physics.add.existing(bullet);
    bullet.body.setVelocity(dir.x * BULLET_SPEED, dir.y * BULLET_SPEED);
    bullet.body.setAllowGravity(false);
    bullet._life   = BULLET_LIFE;
    bullet._damage = this.atk;
    this._bullets.push(bullet);

    // 射撃エフェクト（魔法陣風フラッシュ）
    const flash = this.scene.add.circle(this.x, this.y, 10, 0xff88ff, 0.7).setDepth(13);
    this.scene.tweens.add({
      targets: flash, alpha: 0, scaleX: 2, scaleY: 2,
      duration: 200, ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });
  }

  // ── 弾更新（EnemyManagerから呼ぶ）──────────

  updateBullets(delta, player) {
    this._bullets = this._bullets.filter(b => {
      if (!b.active) return false;

      b._life -= delta;
      if (b._life <= 0) { b.destroy(); return false; }

      // プレイヤーとの当たり判定
      if (!player.invincible) {
        const d = Phaser.Math.Distance.Between(b.x, b.y, player.x, player.y);
        if (d < 18) {
          player.takeDamage(b._damage);
          // 命中エフェクト
          const hit = this.scene.add.circle(b.x, b.y, 8, 0xff88ff, 0.8).setDepth(14);
          this.scene.tweens.add({
            targets: hit, alpha: 0, duration: 150,
            onComplete: () => hit.destroy(),
          });
          b.destroy();
          return false;
        }
      }
      return true;
    });
  }

  // ── 死亡時に弾も消す ──────────────────────

  _die() {
    this._bullets.forEach(b => { if (b.active) b.destroy(); });
    this._bullets = [];
    super._die();
  }
}
