import { catalogResourceName } from '../i18n/catalogNames';
import { t } from '../i18n';
import type { FarmSnapshot } from '../types';

export function resourceLabelFromSnap(snap: FarmSnapshot, code: string): string {
  const row = snap.resourceCatalog.find((r) => r.code === code.trim().toLowerCase());
  return catalogResourceName(code, code, row);
}

/** Localized recipe line for factory modals and shop meta. */
export function formatRecipeLine(
  snap: FarmSnapshot,
  inputCode: string,
  inputQty: number,
  outputCode: string,
  outputQty: number,
): string {
  return t('game.recipeLine', {
    inQty: inputQty,
    inName: resourceLabelFromSnap(snap, inputCode),
    outQty: outputQty,
    outName: resourceLabelFromSnap(snap, outputCode),
  });
}

export function formatQtyResource(
  snap: FarmSnapshot,
  code: string,
  qty: number,
): string {
  return t('game.qtyResource', {
    qty,
    name: resourceLabelFromSnap(snap, code),
  });
}
