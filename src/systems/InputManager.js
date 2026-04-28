import * as Phaser from 'phaser';

// ゲーム内アクション定義
export const ACTION = {
  MOVE_UP:     'move_up',
  MOVE_DOWN:   'move_down',
  MOVE_LEFT:   'move_left',
  MOVE_RIGHT:  'move_right',
  ATTACK:      'attack',      // A: 攻撃 / インタラクト（コンテキスト依存）
  DODGE:       'dodge',       // B: 回避
  ITEM:        'item',        // X: アイテム使用
  WEAPON_SWAP: 'weapon_swap', // Y: 武器ホットスワップ
  LOCK_ON:     'lock_on',     // L1: ロックオン（押しっぱなし）
  SKILL1:      'skill1',      // R1: スキル1
  DASH:        'dash',        // L2: ダッシュ（押しっぱなし）
  SKILL2:      'skill2',      // R2: スキル2
  MAP:         'map',         // Select: マップ
  MENU:        'menu',        // Start: システムメニュー
};

// デフォルトキーボードバインド（action → キー名の配列）
const DEFAULT_KB = {
  [ACTION.MOVE_UP]:     ['W', 'UP'],
  [ACTION.MOVE_DOWN]:   ['S', 'DOWN'],
  [ACTION.MOVE_LEFT]:   ['A', 'LEFT'],
  [ACTION.MOVE_RIGHT]:  ['D', 'RIGHT'],
  [ACTION.ATTACK]:      ['Z', 'ENTER'],
  [ACTION.DODGE]:       ['X'],
  [ACTION.ITEM]:        ['Q'],
  [ACTION.WEAPON_SWAP]: ['E'],
  [ACTION.LOCK_ON]:     ['TAB'],
  [ACTION.DASH]:        ['SHIFT'],
  [ACTION.SKILL1]:      ['R'],
  [ACTION.SKILL2]:      ['F'],
  [ACTION.MAP]:         ['M'],
  [ACTION.MENU]:        ['ESC'],
};

// デフォルトゲームパッドバインド（action → ボタンインデックス）
// Nintendo式配置に準拠（B=南, A=東, Y=西, X=北）
const DEFAULT_GP = {
  [ACTION.ATTACK]:      2,  // B（南・メインアクション）
  [ACTION.DODGE]:       3,  // A（東・回避）
  [ACTION.ITEM]:        0,  // Y（西・アイテム）
  [ACTION.WEAPON_SWAP]: 1,  // X（北・武器スワップ）
  [ACTION.LOCK_ON]:     4,  // L1
  [ACTION.SKILL1]:      5,  // R1
  [ACTION.DASH]:        6,  // L2
  [ACTION.SKILL2]:      7,  // R2
  [ACTION.MAP]:         8,  // Select
  [ACTION.MENU]:        9,  // Start
};

const DEADZONE = 0.2; // アナログスティック無感知帯

export class InputManager {
  constructor(scene) {
    this.scene = scene;
    this._keys = {};
    this._bindings = structuredClone(DEFAULT_KB);
    this._gpBindings = { ...DEFAULT_GP };
    this._prevGpBtn = {};   // 前フレームのゲームパッドボタン状態
    this._attackHoldMs = 0; // チャージ攻撃用の押しっぱなし時間

    this._setupKeyboard();
  }

  // --- セットアップ ---

  _setupKeyboard() {
    // 古いキー登録を解除
    Object.values(this._keys).forEach(k => k.destroy?.());
    this._keys = {};

    const KC = Phaser.Input.Keyboard.KeyCodes;
    const allKeyNames = new Set(Object.values(this._bindings).flat());

    allKeyNames.forEach(name => {
      const code = KC[name] ?? name;
      try {
        this._keys[name] = this.scene.input.keyboard.addKey(code);
      } catch (e) {
        console.warn(`InputManager: キー "${name}" の登録に失敗`, e);
      }
    });
  }

  // --- メインAPIメソッド ---

  /**
   * アクションが現在押されているか
   */
  isDown(action) {
    for (const name of this._bindings[action] ?? []) {
      if (this._keys[name]?.isDown) return true;
    }
    const pad = this._getPad();
    if (pad) {
      const idx = this._gpBindings[action];
      if (idx !== undefined && pad.buttons[idx]?.pressed) return true;
    }
    return false;
  }

  /**
   * このフレームで押した瞬間か
   */
  isJustDown(action) {
    for (const name of this._bindings[action] ?? []) {
      if (Phaser.Input.Keyboard.JustDown(this._keys[name])) return true;
    }
    const pad = this._getPad();
    if (pad) {
      const idx = this._gpBindings[action];
      if (idx !== undefined) {
        const cur  = pad.buttons[idx]?.pressed ?? false;
        const prev = this._prevGpBtn[action] ?? false;
        if (cur && !prev) return true;
      }
    }
    return false;
  }

  /**
   * このフレームで離した瞬間か
   */
  isJustUp(action) {
    for (const name of this._bindings[action] ?? []) {
      if (Phaser.Input.Keyboard.JustUp(this._keys[name])) return true;
    }
    const pad = this._getPad();
    if (pad) {
      const idx = this._gpBindings[action];
      if (idx !== undefined) {
        const cur  = pad.buttons[idx]?.pressed ?? false;
        const prev = this._prevGpBtn[action] ?? false;
        if (!cur && prev) return true;
      }
    }
    return false;
  }

  /**
   * 移動軸 {x, y} を返す（-1.0 〜 1.0 の正規化済み）
   * ゲームパッドのアナログスティック優先、なければDパッド、なければキーボード
   */
  getAxis() {
    let x = 0, y = 0;
    let fromAnalog = false;

    const pad = this._getPad();
    if (pad) {
      // アナログスティック（左）
      const sx = pad.leftStick?.x ?? 0;
      const sy = pad.leftStick?.y ?? 0;
      if (Math.abs(sx) > DEADZONE || Math.abs(sy) > DEADZONE) {
        x = sx; y = sy;
        fromAnalog = true;
      }

      // Dパッド（.pressed で判定 — pad.left はオブジェクトなので常にtruthyになる）
      if (!fromAnalog) {
        if (pad.left?.pressed)  x -= 1;
        if (pad.right?.pressed) x += 1;
        if (pad.up?.pressed)    y -= 1;
        if (pad.down?.pressed)  y += 1;
      }
    }

    // キーボード（ゲームパッド入力がなければ）
    if (!fromAnalog && x === 0 && y === 0) {
      if (this.isDown(ACTION.MOVE_LEFT))  x -= 1;
      if (this.isDown(ACTION.MOVE_RIGHT)) x += 1;
      if (this.isDown(ACTION.MOVE_UP))    y -= 1;
      if (this.isDown(ACTION.MOVE_DOWN))  y += 1;
    }

    // 斜め移動を正規化
    const len = Math.sqrt(x * x + y * y);
    if (len > 1) { x /= len; y /= len; }

    return { x, y };
  }

  /**
   * ATTACKボタンを押し続けている時間（ms）
   * チャージ攻撃判定に使用
   */
  getAttackHoldMs() {
    return this._attackHoldMs;
  }

  // --- フレームごとに呼ぶ ---

  /**
   * フレーム先頭で呼ぶ（チャージタイマー更新）
   * ※ _prevGpBtn の更新は endFrame() で行う
   */
  update(delta) {
    if (this.isDown(ACTION.ATTACK)) {
      this._attackHoldMs += delta;
    } else {
      this._attackHoldMs = 0;
    }
  }

  /**
   * フレーム末尾で必ず呼ぶ
   * isJustDown / isJustUp が "前フレーム" を正しく参照できるよう、
   * 全ての入力チェックが終わってから現在状態を prev に保存する
   */
  endFrame() {
    const pad = this._getPad();
    if (pad) {
      for (const action of Object.keys(this._gpBindings)) {
        const idx = this._gpBindings[action];
        this._prevGpBtn[action] = pad.buttons[idx]?.pressed ?? false;
      }
    }
  }

  // --- リバインド ---

  /**
   * キーボードのキーを変更する
   * rebind(ACTION.ATTACK, ['Z', 'SPACE'])
   */
  rebind(action, keyNames) {
    this._bindings[action] = keyNames;
    this._setupKeyboard();
  }

  /**
   * ゲームパッドボタンを変更する
   */
  rebindGamepad(action, buttonIndex) {
    this._gpBindings[action] = buttonIndex;
  }

  /**
   * 現在のバインド設定をオブジェクトで返す（設定保存用）
   */
  exportBindings() {
    return {
      keyboard: structuredClone(this._bindings),
      gamepad: { ...this._gpBindings },
    };
  }

  /**
   * バインド設定を読み込む（設定復元用）
   */
  importBindings(data) {
    if (data.keyboard) { this._bindings = data.keyboard; this._setupKeyboard(); }
    if (data.gamepad)  { this._gpBindings = data.gamepad; }
  }

  // --- ユーティリティ ---

  _getPad() {
    const gp = this.scene.input.gamepad;
    if (!gp) return null;
    // スロット0〜3を順番に探して最初に接続されているものを返す
    return gp.pad1 ?? gp.pad2 ?? gp.pad3 ?? gp.pad4 ?? null;
  }

  /**
   * ゲームパッドが接続されているか
   */
  isGamepadConnected() {
    return this._getPad() !== null;
  }

  destroy() {
    Object.values(this._keys).forEach(k => k.destroy?.());
  }
}
