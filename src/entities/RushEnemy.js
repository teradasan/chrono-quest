import { Enemy } from './Enemy.js';

const DETECT_RANGE   = 160;  // 発見距離(px)
const TELEGRAPH_MS   = 600;  // 予備動作時間(ms) ─ オレンジ点滅で予告
const RUSH_SPEED     = 310;  // 突進速度(px/s)
const RUSH_MS        = 380;  // 突進継続時間(ms)
const COOLDOWN_MS    = 1600; // 突進後クールダウン(ms)
const CONTACT_RANGE  =  28;  // 接触ダメージ判定距離(px)

/**
 * 突進型敵
 * idle → (発見) → telegraph (点滅予告) → rush (高速突進) → cooldown
 * 突進中は接触でダメージ
 */
export class RushEnemy extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy_rush', { hp: 8, speed: 0, atk: 2 });

    this._telegraphTimer = 0;
    this._rushTimer      = 0;
    this._cooldownTimer  = 0;
    this._rushDx         = 0;
    this._rushDy         = 0;
    this._blinkTimer     = 0;
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.state === 'dead' || this._hurtTimer > 0) return;

    this._telegraphTimer = Math.max(0, this._telegraphTimer - delta);
    this._rushTimer      = Math.max(0, this._rushTimer      - delta);
    this._cooldownTimer  = Math.max(0, this._cooldownTimer  - delta);

    switch (this.state) {
      case 'idle':      this._doIdle(delta);      break;
      case 'telegraph': this._doTelegraph(delta);  break;
      case 'rush':      this._doRush();            break;
      case 'cooldown':  this._doCooldown();        break;
    }
  }

  // ── 待機 ──────────────────────────────────

  _doIdle(delta) {
    this.body.setVelocity(0, 0);
    if (this.distToPlayer() < DETECT_RANGE) {
      this.state           = 'telegraph';
      this._telegraphTimer = TELEGRAPH_MS;
      this._blinkTimer     = 0;
    }
  }

  // ── 予備動作（オレンジ点滅）──────────────

  _doTelegraph(delta) {
    // ゆっくりプレイヤーに向かいながら点滅
    const dir = this.dirToPlayer();
    this.body.setVelocity(dir.x * 28, dir.y * 28);

    this._blinkTimer += delta;
    this.setTint(Math.floor(this._blinkTimer / 80) % 2 === 0 ? 0xff8800 : 0xffcc44);

    if (this._telegraphTimer <= 0) {
      this.clearTint();
      // 突進方向を発射時点で固定
      const d      = this.dirToPlayer();
      this._rushDx = d.x;
      this._rushDy = d.y;
      this.state      = 'rush';
      this._rushTimer = RUSH_MS;
    }
  }

  // ── 突進 ──────────────────────────────────

  _doRush() {
    this.body.setVelocity(this._rushDx * RUSH_SPEED, this._rushDy * RUSH_SPEED);

    // 接触ダメージ
    if (this._atkCooldown <= 0 && this.distToPlayer() < CONTACT_RANGE) {
      this._player?.takeDamage(this.atk);
      this._atkCooldown = COOLDOWN_MS;
    }

    if (this._rushTimer <= 0) {
      this.body.setVelocity(0, 0);
      this.state          = 'cooldown';
      this._cooldownTimer = COOLDOWN_MS;
    }
  }

  // ── クールダウン ───────────────────────────

  _doCooldown() {
    this.body.setVelocity(0, 0);
    if (this._cooldownTimer <= 0) {
      this.state = 'idle';
    }
  }
}
