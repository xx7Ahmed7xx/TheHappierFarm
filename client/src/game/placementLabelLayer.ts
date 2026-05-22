import Phaser from 'phaser';
import { footprintScreenBounds, footprintStackDepth } from './farmFootprint';
import { labelLiftWorld, labelTextPadding, timerLabelFontSize } from './farmLabelScale';

const LABEL_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'Segoe UI, system-ui, sans-serif',
  fontSize: '11px',
  fontStyle: 'bold',
  color: '#fffde7',
  stroke: '#37474f',
  strokeThickness: 1,
  align: 'center',
  backgroundColor: '#00000099',
  padding: { x: 4, y: 1 },
};

/** Scene-level labels for multi-tile buildings/animals (drawn above placement sprites). */
export class PlacementLabelLayer {
  private readonly labels = new Map<string, Phaser.GameObjects.Text>();
  private readonly scene: Phaser.Scene;
  private zoom = 1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setZoom(zoom: number): void {
    this.zoom = zoom;
    for (const [k, label] of this.labels) {
      const meta = this.footprintByKey.get(k);
      if (!meta) {
        continue;
      }
      const { w: fpW, h: fpH, anchorY, boundsH } = meta;
      label.setFontSize(timerLabelFontSize(zoom, fpW, fpH));
      const pad = labelTextPadding(zoom, fpW, fpH);
      label.setPadding(pad.x, pad.y);
      const lift = labelLiftWorld(zoom, fpW, fpH);
      label.setY(anchorY - boundsH - lift);
    }
  }

  private readonly footprintByKey = new Map<string, { w: number; h: number; anchorY: number; boundsH: number }>();

  private key(anchorGx: number, anchorGy: number): string {
    return `${anchorGx},${anchorGy}`;
  }

  sync(
    anchorGx: number,
    anchorGy: number,
    anchorWorldX: number,
    anchorWorldY: number,
    text: string,
    footprintW: number,
    footprintH: number,
  ): void {
    const k = this.key(anchorGx, anchorGy);
    if (!text) {
      this.remove(anchorGx, anchorGy);
      return;
    }

    const bounds = footprintScreenBounds(footprintW, footprintH);
    const x = anchorWorldX;
    const lift = labelLiftWorld(this.zoom, footprintW, footprintH);
    const y = anchorWorldY - bounds.height - lift;
    this.footprintByKey.set(k, { w: footprintW, h: footprintH, anchorY: anchorWorldY, boundsH: bounds.height });

    let label = this.labels.get(k);
    const pad = labelTextPadding(this.zoom, footprintW, footprintH);
    if (!label) {
      label = this.scene.add.text(x, y, text, LABEL_STYLE).setOrigin(0.5, 1);
      label.setFontSize(timerLabelFontSize(this.zoom, footprintW, footprintH));
      label.setPadding(pad.x, pad.y);
      this.labels.set(k, label);
    } else {
      label.setText(text);
      label.setPosition(x, y);
      label.setFontSize(timerLabelFontSize(this.zoom, footprintW, footprintH));
      label.setPadding(pad.x, pad.y);
      label.setVisible(true);
    }

    label.setDepth(
      footprintStackDepth(anchorGx, anchorGy, anchorGx, anchorGy, footprintW, footprintH, true) + 2,
    );
  }

  remove(anchorGx: number, anchorGy: number): void {
    const k = this.key(anchorGx, anchorGy);
    this.labels.get(k)?.destroy();
    this.labels.delete(k);
    this.footprintByKey.delete(k);
  }

  clear(): void {
    for (const label of this.labels.values()) {
      label.destroy();
    }
    this.labels.clear();
    this.footprintByKey.clear();
  }
}
