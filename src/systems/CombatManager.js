import * as Phaser from 'phaser';

const ATTACK_DURATION   = 300;   // 通常攻撃の全体フレーム(ms)
const ATTACK_ACTIVE     = 150;   // ヒットボックス有効時間(ms)
const ATTACK_COOLDOWN   = 350;   // 次の攻撃まで(ms)
const CHARGE_RELEASE_D  = 450;   // チャージ攻撃の全体フレーム
const CHARGE_ACTIVE     = 220;   // チャージ攻撃のヒットボックス有効時間
const LOCKON_RANGE      = 260;   // ロックオン射程(px)

// 方向ごとのヒットボックス位置（プレイヤー中心からのオフセット）
function getHitboxRect(dir, isCharge) {
  const w  = isCharge ? 80 : 58;
  const h  = isCharge ? 52 : 38;
  const of = 14;
  switch (dir) {
    case 'down':  return { x: -w / 2,       y: of,          w, h };
    case 'up':    return { x: -w / 2,       y: -of - h,     w, h };
    case 'left':  return { x: -of - w,      y: -h / 2,      w, h };
    case 'right': return { x: of,           y: -h / 2,      w, h };
    default:      return { x: -w / 2,       y: of,          w, h };
  }
}

// 方向→ラジアン（スウィングエフェクト用）
const DIR_ANGLE = { down: Math.PI / 2, up: -Math.PI / 2, left: Math.PI, right: 0 };

export class CombatManager {
  constructor(scene, player) {
    this.scene   = scene;
    this.player  = player;

    // ヒットボックスグループ（物理あり）
    this.hitboxGroup = scene.physics.add.staticGroup();

    // ロックオン
    this.lockTarget    = null;
    this._lockIndicator = null;

    // 攻撃タイマー
    this._attackTimer   = 0;
    this._cooldown      = 0;
    this._activeTimer   = 0;
    this._isCharge      = false;
    this._attacking     = false;

    // ヒット済みオブジェクト（1回の攻撃で同じ敵に複数ヒットしない）
    this._hitSet = new Set();
  }

  // ─── ロックオン ─────────────────────────

  updateLockOn(isHeld, enemyGroup) {
    if (!isHeld) {
      this._clearLockOn();
      return;
    }

    // 最も近い敵を探す
    const px = this.player.x;
    const py = this.player.y;
    let best = null, bestDist = LOCKON_RANGE;

    if (enemyGroup) {
      enemyGroup.getChildren().forEach(e => {
        if (!e.active) return;
        const d = Phaser.Math.Distance.Between(px, py, e.x, e.y);
        if (d < bestDist) { bestDist = d; best = e; }
      });
    }

    // ダミー標的も対象にする
    if (this._dummyGroup) {
      this._dummyGroup.getChildren().forEach(e => {
        if (!e.active) return;
        const d = Phaser.Math.Distance.Between(px, py, e.x, e.y);
        if (d < bestDist) { bestDist = d; best = e; }
      });
    }

    if (best !== this.lockTarget) {
      this._clearLockIndicator();
      this.lockTarget = best;
    }

    if (this.lockTarget) {
      this._updateLockIndicator();
      // プレイヤーをターゲットの方向に向ける
      this._faceTarget();
    }
  }

  _faceTarget() {
    const dx = this.lockTarget.x - this.player.x;
    const dy = this.lockTarget.y - this.player.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.player.dir = dx > 0 ? 'right' : 'left';
    } else {
      this.player.dir = dy > 0 ? 'down' : 'up';
    }
  }

  _updateLockIndicator() {
    if (!this._lockIndicator) {
      this._lockIndicator = this.scene.add.graphics().setDepth(20);
    }
    const g = this._lockIndicator;
    g.clear();
    // ターゲット上に黄色い三角
    const tx = this.lockTarget.x;
    const ty = this.lockTarget.y - (this.lockTarget.displayHeight ?? 24) / 2 - 12;
    g.fillStyle(0xffee00, 0.9);
    g.fillTriangle(tx - 8, ty - 6, tx + 8, ty - 6, tx, ty + 2);
    // ターゲットを囲む点線風の四角
    g.lineStyle(2, 0xffee00, 0.6);
    const hw = (this.lockTarget.displayWidth  ?? 32) / 2 + 4;
    const hh = (this.lockTarget.displayHeight ?? 32) / 2 + 4;
    g.strokeRect(tx - hw, this.lockTarget.y - hh, hw * 2, hh * 2);
  }

  _clearLockOn() {
    this.lockTarget = null;
    this._clearLockIndicator();
  }

  _clearLockIndicator() {
    this._lockIndicator?.destroy();
    this._lockIndicator = null;
  }

  // ─── 攻撃 ─────────────────────────────

  canAttack() {
    return this._cooldown <= 0 && !this._attacking;
  }

  startAttack(isCharge = false) {
    if (!this.canAttack()) return;

    this._isCharge      = isCharge;
    this._attacking     = true;
    this._attackTimer   = isCharge ? CHARGE_RELEASE_D : ATTACK_DURATION;
    this._activeTimer   = isCharge ? CHARGE_ACTIVE    : ATTACK_ACTIVE;
    this._cooldown      = isCharge ? 500 : ATTACK_COOLDOWN;
    this._hitSet.clear();

    // ヒットボックス生成
    this._spawnHitbox();

    // スウィングエフェクト
    this._showSwingEffect(isCharge);

    // プレイヤーに状態を通知
    this.player.onAttackStart(isCharge);
  }

  _spawnHitbox() {
    const { x, y, dir } = this.player;
    const rect = getHitboxRect(dir, this._isCharge);
    const hb = this.scene.add.rectangle(
      x + rect.x + rect.w / 2,
      y + rect.y + rect.h / 2,
      rect.w, rect.h,
      this._isCharge ? 0xff8800 : 0xffdd00,
      0.0  // 通常は透明（デバッグ時は0.3にする）
    );
    this.scene.physics.add.existing(hb, true); // static
    hb._attackData = { isCharge: this._isCharge, power: this._isCharge ? 2 : 1 };
    this.hitboxGroup.add(hb);
    this._currentHitbox = hb;
  }

  _showSwingEffect(isCharge) {
    const { x, y, dir } = this.player;
    const angle  = DIR_ANGLE[dir] ?? 0;
    const radius = isCharge ? 80 : 58;
    const spread = isCharge ? Math.PI * 0.55 : Math.PI * 0.45;

    const g = this.scene.add.graphics().setDepth(15);
    g.fillStyle(isCharge ? 0xff8800 : 0xffffff, isCharge ? 0.6 : 0.5);
    g.beginPath();
    g.moveTo(x, y);
    g.arc(x, y, radius, angle - spread, angle + spread, false);
    g.closePath();
    g.fill();

    // チャージはフチを追加
    if (isCharge) {
      g.lineStyle(3, 0xffdd44, 0.9);
      g.beginPath();
      g.arc(x, y, radius, angle - spread, angle + spread, false);
      g.strokePath();
    }

    this.scene.tweens.add({
      targets: g,
      alpha: 0,
      scaleX: isCharge ? 1.3 : 1.1,
      scaleY: isCharge ? 1.3 : 1.1,
      duration: isCharge ? 300 : 200,
      ease: 'Quad.easeOut',
      onComplete: () => g.destroy(),
    });
  }

  // ─── チャージ中のエフェクト ───────────────

  showChargeEffect(holdMs) {
    if (!this._chargeGfx) {
      this._chargeGfx = this.scene.add.graphics().setDepth(9);
    }
    const g = this._chargeGfx;
    g.clear();
    const progress = Math.min(holdMs / 600, 1);
    const radius   = 16 + progress * 20;
    const alpha    = 0.3 + progress * 0.5;
    g.lineStyle(3, 0xffdd00, alpha);
    g.strokeCircle(this.player.x, this.player.y, radius);
    if (progress >= 1) {
      g.lineStyle(4, 0xff8800, 0.8);
      g.strokeCircle(this.player.x, this.player.y, radius + 6);
    }
  }

  clearChargeEffect() {
    this._chargeGfx?.destroy();
    this._chargeGfx = null;
  }

  // ─── ヒット処理 ───────────────────────────

  checkHits(targetGroup) {
    if (!this._attacking || !this._currentHitbox || this._activeTimer <= 0) return;

    const hb = this._currentHitbox;
    const hbBounds = hb.getBounds();

    const check = (target) => {
      if (!target.active || this._hitSet.has(target)) return;
      const tb = target.getBounds();
      if (Phaser.Geom.Intersects.RectangleToRectangle(hbBounds, tb)) {
        this._hitSet.add(target);
        this._onHit(target, hb._attackData);
      }
    };

    targetGroup?.getChildren().forEach(check);
    this._dummyGroup?.getChildren().forEach(check);
  }

  _onHit(target, data) {
    // ヒットフラッシュ
    const flash = this.scene.add.rectangle(
      target.x, target.y,
      target.width ?? 32, target.height ?? 32,
      0xffffff, 0.8
    ).setDepth(30);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 150,
      onComplete: () => flash.destroy(),
    });

    // ターゲットのtakeDamageを呼ぶ（あれば）
    target.takeDamage?.(data.power);

    // ダメージ数字を表示
    this._showDamageNumber(target.x, target.y - 20, data.power);
  }

  _showDamageNumber(x, y, value) {
    const txt = this.scene.add.text(x, y, value.toString(), {
      fontSize: '22px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: this._isCharge ? '#ff8800' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setDepth(50).setOrigin(0.5);

    this.scene.tweens.add({
      targets: txt,
      y: y - 36,
      alpha: 0,
      duration: 700,
      ease: 'Quad.easeOut',
      onComplete: () => txt.destroy(),
    });
  }

  // ─── 更新 ──────────────────────────────

  update(delta, enemyGroup) {
    this._cooldown    = Math.max(0, this._cooldown - delta);
    this._attackTimer = Math.max(0, this._attackTimer - delta);
    this._activeTimer = Math.max(0, this._activeTimer - delta);

    if (this._attacking) {
      this.checkHits(enemyGroup);

      if (this._activeTimer <= 0 && this._currentHitbox) {
        this._currentHitbox.destroy();
        this._currentHitbox = null;
      }

      if (this._attackTimer <= 0) {
        this._attacking = false;
        this.player.onAttackEnd();
      }
    }

    // ロックオンインジケーター位置更新
    if (this.lockTarget && this._lockIndicator) {
      this._updateLockIndicator();
    }
  }

  // ─── ダミー標的登録（テスト用） ────────────

  setDummyGroup(group) {
    this._dummyGroup = group;
  }

  destroy() {
    this._clearLockOn();
    this._chargeGfx?.destroy();
    this.hitboxGroup.clear(true, true);
  }
}
