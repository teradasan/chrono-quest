export class FieldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FieldScene' });
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x2d5a1b);

    this.add.text(width / 2, height / 2, 'Field Scene\n（Session 02以降で実装）', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);
  }
}
