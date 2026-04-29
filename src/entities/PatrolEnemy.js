import { Enemy } from './Enemy.js';
import * as Phaser from 'phaser';

const DETECT_RANGE = 130;  // 発見距離(px)
const LOSE_RANGE   = 220;  // 見失い距離(px)
const PATROL_SPEED =  55;  // 巡回速度(px/s)
const CHASE_SPEED  = 105;  // 追跡速度(px/s)
const MELEE_RANGE  =  30;  // 近接攻撃距離(px)
const WP_REACH     =  10;  // ウェイポイント到達判定(px)

/**
 * パトロール型敵
 * 巡回 → プレイヤー発見で追跡 → 近接攻撃
 * 見失ったら巡回に戻る
 */
export class PatrolEnemy extends Enemy {
  constructor(scene, x, y, waypoints) {
    super(scene, x, y, 'enemy_patrol', { hp: 6, speed: PATROL_SPEED, atk: 1 });

    // ウェイポイント: 未指定なら左右 64px を往復
    this._waypoints = waypoints ?? [
      [x - 64, y],
      [x + 64, y],
    ];
    this._wpIndex = 0;
    this.state    = 'patrol';
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.state === 'dead' || this._hurtTimer > 0) return;

    switch (this.state) {
      case 'patrol': this._doPatrol(); break;
      case 'chase':  this._doChase();  break;
    }
  }

  // ── 巡回 ──────────────────────────────────

  _doPatrol() {
    if (this.distToPlayer() < DETECT_RANGE) {
      this.state = 'chase';
      return;
    }

    const [tx, ty] = this._waypoints[this._wpIndex];
    const dist = Phaser.Math.Distance.Between(this.x, this.y, tx, ty);

    if (dist < WP_REACH) {
      // 次のウェイポイントへ
      this._wpIndex = (this._wpIndex + 1) % this._waypoints.length;
      this.body.setVelocity(0, 0);
    } else {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
      this.body.setVelocity(
        Math.cos(angle) * PATROL_SPEED,
        Math.sin(angle) * PATROL_SPEED,
      );
    }
  }

  // ── 追跡 ──────────────────────────────────

  _doChase() {
    if (this.distToPlayer() > LOSE_RANGE) {
      this.state = 'patrol';
      return;
    }

    // 近接攻撃を試みる
    if (this.tryMeleeAttack(MELEE_RANGE)) {
      this.body.setVelocity(0, 0);
      return;
    }

    // プレイヤーへ移動
    const dir = this.dirToPlayer();
    this.body.setVelocity(dir.x * CHASE_SPEED, dir.y * CHASE_SPEED);
  }
}
