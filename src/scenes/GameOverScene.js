import * as Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create() {
    const { width, height } = this.scale;

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

    // サブテキスト
    const sub = this.add.text(width / 2, height * 0.50, '力尽きてしまった…', {
      fontSize: '18px',
      fontFamily: 'serif',
      color: '#aaaaaa',
    }).setOrigin(0.5).setAlpha(0);

    // フェードイン
    this.tweens.add({
      targets: [title, sub],
      alpha: 1,
      duration: 800,
      ease: 'Quad.easeOut',
    });

    // ボタン（フェードイン後に表示）
    this.time.delayedCall(1000, () => this._showButtons(width, height));

    // キーボード・ゲームパッドは _showButtons 後に有効化
    this._inputReady = false;
  }

  _showButtons(width, height) {
    // もう一度ボタン
    const retry = this._makeButton(
      width / 2, height * 0.65,
      'もう一度挑戦する',
      0x226622,
      () => {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('FieldScene');
        });
      }
    );

    // タイトルへボタン
    const toTitle = this._makeButton(
      width / 2, height * 0.78,
      'タイトルへ戻る',
      0x444444,
      () => {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('TitleScene');
        });
      }
    );

    // フェードイン
    [retry, toTitle].forEach(({ bg, text }) => {
      bg.setAlpha(0); text.setAlpha(0);
      this.tweens.add({ targets: [bg, text], alpha: 1, duration: 400 });
    });

    this._inputReady = true;

    // キーボード: Enter でリトライ、Esc でタイトル
    this.input.keyboard.once('keydown-ENTER', () => {
      if (this._inputReady) retry.onSelect();
    });
    this.input.keyboard.once('keydown-ESC', () => {
      if (this._inputReady) toTitle.onSelect();
    });
  }

  _makeButton(x, y, label, bgColor, onSelect) {
    const bg = this.add.rectangle(x, y, 220, 36, bgColor, 0.85)
      .setInteractive({ useHandCursor: true })
      .on('pointerover',  () => bg.setFillStyle(bgColor, 1.0))
      .on('pointerout',   () => bg.setFillStyle(bgColor, 0.85))
      .on('pointerdown',  () => onSelect());

    const text = this.add.text(x, y, label, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    const btn = { bg, text, onSelect };
    return btn;
  }
}
