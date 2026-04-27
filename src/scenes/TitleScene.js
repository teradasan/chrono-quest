import * as Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    const { width, height } = this.scale;

    // 背景グラデーション
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a2e, 0x0a0a2e, 0x1a1a4e, 0x1a1a4e, 1);
    bg.fillRect(0, 0, width, height);

    // 星を散りばめる
    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.FloatBetween(0.5, 2);
      const alpha = Phaser.Math.FloatBetween(0.3, 1);
      const star = this.add.circle(x, y, size, 0xffffff, alpha);
      this.tweens.add({
        targets: star,
        alpha: { from: alpha, to: alpha * 0.2 },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // タイトルロゴ
    this.add.text(width / 2, height * 0.3, 'CHRONO QUEST', {
      fontSize: '52px',
      fontFamily: 'serif',
      color: '#f0c040',
      stroke: '#8b6800',
      strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 8, fill: true },
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.42, '〜 時の勇者の物語 〜', {
      fontSize: '18px',
      fontFamily: 'serif',
      color: '#c0a030',
    }).setOrigin(0.5);

    // Press Start
    const pressStart = this.add.text(width / 2, height * 0.65, 'Press A / Enter to Start', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: pressStart,
      alpha: 0,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // バージョン
    this.add.text(width - 8, height - 8, 'v0.1.0', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#555555',
    }).setOrigin(1, 1);

    // キーボード入力
    this.input.keyboard.once('keydown-ENTER', () => this.startGame());
    this.input.keyboard.once('keydown-SPACE', () => this.startGame());

    // ゲームパッド入力（接続待ち）
    this.input.gamepad.once('down', (pad, button) => {
      if (button.index === 0) this.startGame(); // Aボタン
    });
  }

  startGame() {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('FieldScene');
    });
  }
}
