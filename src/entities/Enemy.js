import * as Phaser from 'phaser';

const HP_BAR_W = 30;

/**
 * 敵の基底クラス
 * HP・ノックバック・HPバー・ダメージ受け処理を共通化
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey, config = {}) {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(26, 26);
    this.body.setOffset(3, 7);
    this.setDepth(10);

    this.hpMax   = config.hp    ?? 5;
    this.hp      = this.hpMax;
    this.speed   = config.speed ?? 80;
    this.atk     = config.atk   ?? 1;

    this.state        = 'idle';
    this._player      = null;
    this._atkCooldown = 0;
    this._hurtTimer   = 0;   // ノックバック中タイマー(ms)

    this._createHPBar();
  }

  // ── 初期化 ───────────────────────────────

  setPlayer(player) {
    this._player = player;
  }

  // ── ユーティリティ ────────────────────────

  distToPlayer() {
    if (!this._player) return Infinity;
    return Phaser.Math.Distance.Between(this.x, this.y, this._player.x, this._player.y);
  }

  dirToPlayer() {
    if (!this._player) return { x: 0, y: 0 };
    const angle = Phaser.Math.Angle.Between(this.x, this.y, this._player.x, this._player.y);
    return { x: Math.cos(angle), y: Math.sin(angle) };
  }

  // ── ダメージ・死亡 ─────────────────────────

  takeDamage(amount) {
    if (this.state === 'dead') return;

    this.hp = Math.max(0, this.hp - amount);
    this._updateHPBar();

    // 赤フラッシュ
    this.setTint(0xff5555);
    this.scene.time.delayedCall(150, () => {
      if (this.active) this.clearTint();
    });

    // ノックバック（プレイヤーの逆方向へ）
    const dir = this.dirToPlayer();
    this.body.setVelocity(-dir.x * 140, -dir.y * 140);
    this._hurtTimer = 220;

    if (this.hp <= 0) this._die();
  }

  _die() {
    if (this.state === 'dead') return;
    this.state = 'dead';
    this.body.setVelocity(0, 0);
    this.body.enable = false;

    this.scene.tweens.add({
      targets: [this, this._hpBarBg, this._hpBar],
      alpha: 0,
      y: '-=20',
      duration: 380,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this._hpBar?.destroy();
        this._hpBarBg?.destroy();
        this.destroy();
      },
    });
  }

  // ── HPバー ────────────────────────────────

  _createHPBar() {
    // 背景（中心揃え）
    this._hpBarBg = this.scene.add
      .rectangle(this.x, this.y - 22, HP_BAR_W, 4, 0x222222)
      .setDepth(11);
    // 前景（左端基準・origin(0, 0.5)で左から縮む）
    this._hpBar = this.scene.add
      .rectangle(this.x - HP_BAR_W / 2, this.y - 22, HP_BAR_W, 4, 0x44dd44)
      .setOrigin(0, 0.5)
      .setDepth(12);
  }

  _updateHPBar() {
    if (!this._hpBar) return;
    const ratio = Math.max(0, this.hp / this.hpMax);
    this._hpBar.displayWidth = HP_BAR_W * ratio;
    this._hpBar.setFillStyle(
      ratio > 0.5 ? 0x44dd44 : ratio > 0.25 ? 0xdddd44 : 0xdd4444
    );
    this._hpRatio = ratio;
  }

  _syncHPBar() {
    if (this._hpBarBg) this._hpBarBg.setPosition(this.x, this.y - 22);
    if (this._hpBar)   this._hpBar.setPosition(this.x - HP_BAR_W / 2, this.y - 22);
  }

  // ── 近接攻撃ヘルパー ──────────────────────

  tryMeleeAttack(range) {
    if (this._atkCooldown > 0 || !this._player) return false;
    if (this.distToPlayer() <= range) {
      this._player.takeDamage(this.atk);
      this._atkCooldown = 1200;
      return true;
    }
    return false;
  }

  // ── 毎フレーム共通処理 ────────────────────

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.state === 'dead') return;

    this._atkCooldown = Math.max(0, this._atkCooldown - delta);

    // ノックバック中はAIを止める
    if (this._hurtTimer > 0) {
      this._hurtTimer -= delta;
      if (this._hurtTimer <= 0) this.body.setVelocity(0, 0);
    }

    this._syncHPBar();
  }
}
