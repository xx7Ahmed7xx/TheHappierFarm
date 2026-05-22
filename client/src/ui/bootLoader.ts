import { onLocaleChange, t } from '../i18n';

export type BootStep = {
  id: string;
  labelKey: string;
  run: () => Promise<void>;
};

const overlay = () => document.querySelector<HTMLDivElement>('#page-boot')!;
const barEl = () => document.querySelector<HTMLDivElement>('#boot-progress-bar')!;
const stepEl = () => document.querySelector<HTMLParagraphElement>('#boot-step-label')!;
const pctEl = () => document.querySelector<HTMLSpanElement>('#boot-progress-pct')!;

let currentBootLabelKey = 'boot.preparing';

export function showBootScreen(): void {
  overlay().hidden = false;
  overlay().setAttribute('aria-busy', 'true');
  setProgress(0, 'boot.preparing');
}

export function hideBootScreen(): void {
  overlay().hidden = true;
  overlay().setAttribute('aria-busy', 'false');
}

function setProgress(ratio: number, labelKey: string): void {
  currentBootLabelKey = labelKey;
  const pct = Math.min(100, Math.max(0, Math.round(ratio * 100)));
  barEl().style.width = `${pct}%`;
  pctEl().textContent = `${pct}%`;
  stepEl().textContent = t(labelKey);
  const track = barEl().parentElement;
  if (track) {
    track.setAttribute('aria-valuenow', String(pct));
    track.setAttribute('aria-label', t(labelKey));
  }
}

export function refreshBootLocale(): void {
  if (overlay().hidden) {
    return;
  }
  stepEl().textContent = t(currentBootLabelKey);
  const track = barEl().parentElement;
  if (track) {
    track.setAttribute('aria-label', t(currentBootLabelKey));
  }
}

onLocaleChange(() => {
  refreshBootLocale();
});

export async function runBootSequence(steps: BootStep[]): Promise<void> {
  if (steps.length === 0) {
    setProgress(1, 'boot.ready');
    return;
  }

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    setProgress(i / steps.length, step.labelKey);
    await step.run();
    setProgress((i + 1) / steps.length, step.labelKey);
  }

  setProgress(1, 'boot.ready');
  await new Promise((r) => setTimeout(r, 280));
}
