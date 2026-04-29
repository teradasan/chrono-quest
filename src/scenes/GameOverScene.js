import * as Phaser from 'phaser';

// このユーザーのコントローラー配置
const BTN_CONFIRM = 2;  // B = 確認・リトライ
const BTN_CANCEL  = 3;  // A = キャンセル・タイトル
const BTN_START   = 9;  // Start

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create() {
    const { width, height } = this.scale;

    this._inputReady  = false;
    this._transitioning = false;
    this._selectedIdx = 0;      // 0=リトライ, 1=タイトル
    this._prevGpBtn   = {};
    this._actions     = [];     // [{onSelect}]

    // 暗いオーバーレイ
    this.add.rectangle(0, 0, width, height, 0x000000, 0.75)
      .setOrigin(0, 0);

    // GAME OVER テキスト
    const title = this.add.text(width / 2, height * 0.35, 'GAME OVER', {
      fontSize: '48px',
      fontFamily: 'serif',
      color: '#dd2222',
      stroke: '#550000',
      strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 8, fill: true },
    }).setOrigin(0.5).setAlpha(0);

    const sub = this.add.text(width / 2, height * 0.50, '力尽きてしまった…', {
      fontSize: '18px',
      fontFamily: 'serif',
      color: '#aaaaaa',
    }).setOrigin(0.5).setAlpha(0);

    // 操作ヒント（右下）
    this._hint = this.add.text(width - 10, height - 10,
      'B: 決定  A: タイトル  ↑↓: 選択', {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: '#666666',
      }).setOrigin(1, 1).setAlpha(0);

    this.tweens.add({
      targets: [title, sub],
      alpha: 1,
      duration: 800,
      ease: 'Quad.easeOut',
    });

    // ボタンを 1 秒後に表示
    this.time.delayedCall(1000, () => this._showButtons(width, height));
  }

  // ── ボタン配置 ────────────────────────────

  _showButtons(width, height) {
    this._btnRetry   = this._makeButton(width / 2, height * 0.65, 'もう一度挑戦する', 0x226622, () => this._retry());
    this._btnToTitle = this._makeButton(width / 2, height * 0.78, 'タイトルへ戻る',   0x444444, () => this._goTitle());

    this._actions = [this._btnRetry, this._btnToTitle];

    [this._btnRetry, this._btnToTitle].forEach(({ bg, label }) => {
      bg.setAlpha(0); label.setAlpha(0);
      this.tweens.add({ targets: [bg, label], alpha: 1, duration: 400 });
    });
    this.tweens.add({ targets: this._hint, alpha: 1, duration: 400 });

    this._inputReady = true;
    this._updateCursor();

    // キーボード
    this.input.keyboard.on('keydown-ENTER', () => this._confirm());
    this.input.keyboard.on('keydown-Z',     () => this._confirm());
    this.input.keyboard.on('keydown-ESC',   () => this._goTitle());
    this.input.keyboard.on('keydown-UP',    () => this._move(-1));
    this.input.keyboard.on('keydown-DOWN',  () => this._move(1));
    this.input.keyboard.on('keydown-W',     () => this._move(-1));
    this.input.keyboard.on('keydown-S',     () => this._move(1));
  }

  // ── 毎フレーム：ゲームパッド入力 ─────────

  update() {
    if (!this._inputReady || this._transitioning) return;

    const gp  = this.input.gamepad;
    const pad = gp?.pad1 ?? gp?.pad2 ?? gp?.pad3 ?? gp?.pad4;
    if (!pad) {
      this._prevGpBtn = {};
      return;
    }

    const justPressed = (idx) => {
      const cur  = pad.buttons[idx]?.pressed ?? false;
      const prev = this._prevGpBtn[idx] ?? false;
      return cur && !prev;
    };

    // 決定: B
    if (justPressed(BTN_CONFIRM)) this._confirm();
    // タイトル: A または Start
    if (justPressed(BTN_CANCEL) || justPressed(BTN_START)) this._goTitle();
    // 上下選択
    const up   = pad.up?.pressed   ?? false;
    const down = pad.down?.pressed  ?? false;
    const sy   = pad.leftStick?.y  ?? 0;
    if (justPressed(/* dummy */ -1) || false) { /* unused */ }
    if ((up   || sy < -0.5) && !(this._prevGpBtn['_up']))   this._move(-1);
    if ((down || sy >  0.5) && !(this._prevGpBtn['_down']))  this._move(1);

    // prev 更新
    for (let i = 0; i < pad.buttons.length; i++) {
      this._prevGpBtn[i] = pad.buttons[i]?.pressed ?? false;
    }
    this._prevGpBtn['_up']   = up   || sy < -0.5;
    this._prevGpBtn['_down'] = down || sy >  0.5;
  }

  // ── 選択操作 ──────────────────────────────

  _move(dir) {
    if (!this._actions.length) return;
    this._selectedIdx = (this._selectedIdx + dir + this._actions.length) % this._actions.length;
    this._updateCursor();
  }

  _confirm() {
    this._actions[this._selectedIdx]?.onSelect();
  }

  _updateCursor() {
    this._actions.forEach(({ bg, baseColor }, i) => {
      bg.setFillStyle(baseColor, i === this._selectedIdx ? 1.0 : 0.75);
      bg.setStrokeStyle(i === this._selectedIdx ? 2 : 0, 0xffffff, 1);
    });
  }

  // ── 遷移 ──────────────────────────────────

  _retry() {
    if (this._transitioning) return;
    this._transitioning = true;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('FieldScene');
    });
  }

  _goTitle() {
    if (this._transitioning) return;
    this._transitioning = true;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('TitleScene');
    });
  }

  // ── ボタン生成 ────────────────────────────

  _makeButton(x, y, text, baseColor, onSelect) {
    const bg = this.add.rectangle(x, y, 230, 38, baseColor, 0.75)
      .setInteractive({ useHandCursor: true })
      .on('pointerover',  () => { if (!this._transitioning) { this._selectedIdx = this._actions.indexOf(btn); this._updateCursor(); } })
      .on('pointerdown',  () => { if (!this._transitioning) onSelect(); });

    const label = this.add.text(x, y, text, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    const btn = { bg, label, baseColor, onSelect };
    return btn;
  }
}
