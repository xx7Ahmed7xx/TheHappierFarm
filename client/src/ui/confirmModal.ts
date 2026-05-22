import {
  isFarmInputSuspended,
  resumeFarmInput,
  suspendFarmInput,
} from './farmInputLock';

export interface FarmConfirmDetail {
  label: string;
  value: string;
}

export interface FarmConfirmOptions {
  title: string;
  emoji?: string;
  message: string;
  details?: FarmConfirmDetail[];
  confirmLabel?: string;
  cancelLabel?: string;
  /** Visual accent for the primary button */
  variant?: 'collect' | 'start' | 'upgrade' | 'default';
}

export interface FarmAlertOptions {
  title: string;
  emoji?: string;
  message: string;
  details?: FarmConfirmDetail[];
  okLabel?: string;
}

const root = document.querySelector<HTMLDivElement>('#farm-modal')!;
const backdrop = root.querySelector<HTMLDivElement>('.farm-modal-backdrop')!;
const emojiEl = document.querySelector<HTMLSpanElement>('#farm-modal-emoji')!;
const titleEl = document.querySelector<HTMLHeadingElement>('#farm-modal-title')!;
const messageEl = document.querySelector<HTMLParagraphElement>('#farm-modal-message')!;
const detailsEl = document.querySelector<HTMLUListElement>('#farm-modal-details')!;
const cancelBtn = document.querySelector<HTMLButtonElement>('#farm-modal-cancel')!;
const confirmBtn = document.querySelector<HTMLButtonElement>('#farm-modal-confirm')!;
const batchRowEl = document.querySelector<HTMLDivElement>('#farm-modal-batch')!;

let pendingResolve: ((value: boolean) => void) | null = null;
let pendingBatchResolve: ((value: number | null) => void) | null = null;
let pendingAlertResolve: (() => void) | null = null;
let alertMode = false;

function stopPointer(ev: Event): void {
  ev.stopPropagation();
}

for (const el of [root, backdrop, root.querySelector('.farm-modal-panel')!]) {
  el.addEventListener('pointerdown', stopPointer, true);
  el.addEventListener('mousedown', stopPointer, true);
}

function clearBatchRow(): void {
  batchRowEl.innerHTML = '';
  batchRowEl.hidden = true;
}

function closeModal(result: boolean): void {
  root.hidden = true;
  root.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('farm-modal-open');
  cancelBtn.hidden = false;
  confirmBtn.hidden = false;
  clearBatchRow();
  resumeFarmInput();

  if (pendingBatchResolve) {
    const resolveBatch = pendingBatchResolve;
    pendingBatchResolve = null;
    resolveBatch(null);
  }

  if (alertMode) {
    const done = pendingAlertResolve;
    pendingAlertResolve = null;
    alertMode = false;
    done?.();
    return;
  }

  const resolve = pendingResolve;
  pendingResolve = null;
  resolve?.(result);
}

function onKeyDown(ev: KeyboardEvent): void {
  if (root.hidden) {
    return;
  }
  if (ev.key === 'Escape') {
    ev.preventDefault();
    closeModal(alertMode ? false : false);
  }
}

backdrop.addEventListener('click', () => closeModal(false));
cancelBtn.addEventListener('click', () => closeModal(false));
confirmBtn.addEventListener('click', () => closeModal(true));
document.addEventListener('keydown', onKeyDown);

export function isFarmModalOpen(): boolean {
  return !root.hidden || isFarmInputSuspended();
}

function renderDetails(details: FarmConfirmDetail[]): void {
  detailsEl.innerHTML = '';
  if (details.length > 0) {
    for (const row of details) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="farm-modal-detail-label">${row.label}</span><span class="farm-modal-detail-value">${row.value}</span>`;
      detailsEl.appendChild(li);
    }
    detailsEl.hidden = false;
  } else {
    detailsEl.hidden = true;
  }
}

export function showFarmConfirm(options: FarmConfirmOptions): Promise<boolean> {
  if (pendingResolve) {
    closeModal(false);
  }

  const {
    title,
    emoji = '🌾',
    message,
    details = [],
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
  } = options;

  alertMode = false;
  clearBatchRow();
  cancelBtn.hidden = false;
  confirmBtn.hidden = false;
  emojiEl.textContent = emoji;
  titleEl.textContent = title;
  messageEl.textContent = message;
  renderDetails(details);

  cancelBtn.textContent = cancelLabel;
  confirmBtn.textContent = confirmLabel;
  confirmBtn.className = 'farm-modal-confirm';
  if (variant !== 'default') {
    confirmBtn.classList.add(`farm-modal-confirm--${variant}`);
  }

  root.hidden = false;
  root.setAttribute('aria-hidden', 'false');
  document.body.classList.add('farm-modal-open');
  suspendFarmInput();
  confirmBtn.focus();

  return new Promise<boolean>((resolve) => {
    pendingResolve = resolve;
  });
}

/** One-button info dialog (factory busy, missing ingredients, etc.). */
export function showFarmAlert(options: FarmAlertOptions): Promise<void> {
  if (pendingResolve) {
    closeModal(false);
  }

  const {
    title,
    emoji = 'ℹ️',
    message,
    details = [],
    okLabel = 'OK',
  } = options;

  alertMode = true;
  clearBatchRow();
  cancelBtn.hidden = true;
  confirmBtn.hidden = false;
  emojiEl.textContent = emoji;
  titleEl.textContent = title;
  messageEl.textContent = message;
  renderDetails(details);

  confirmBtn.textContent = okLabel;
  confirmBtn.className = 'farm-modal-confirm';

  root.hidden = false;
  root.setAttribute('aria-hidden', 'false');
  document.body.classList.add('farm-modal-open');
  suspendFarmInput();
  confirmBtn.focus();

  return new Promise<void>((resolve) => {
    pendingAlertResolve = resolve;
  });
}

export interface FarmBatchChoice {
  runs: number;
  label: string;
}

export interface FarmBatchPickOptions {
  title: string;
  emoji?: string;
  message: string;
  details?: FarmConfirmDetail[];
  choices: FarmBatchChoice[];
  cancelLabel?: string;
}

/** Pick how many factory runs to start (1 / 5 / 10 …). */
export function showFarmBatchPick(options: FarmBatchPickOptions): Promise<number | null> {
  if (pendingResolve) {
    closeModal(false);
  }

  const {
    title,
    emoji = '🏭',
    message,
    details = [],
    choices,
    cancelLabel = 'Cancel',
  } = options;

  alertMode = false;
  emojiEl.textContent = emoji;
  titleEl.textContent = title;
  messageEl.textContent = message;
  renderDetails(details);

  batchRowEl.innerHTML = '';
  for (const choice of choices) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'farm-modal-batch-btn';
    btn.textContent = choice.label;
    btn.addEventListener('click', () => {
      root.hidden = true;
      root.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('farm-modal-open');
      clearBatchRow();
      confirmBtn.hidden = false;
      resumeFarmInput();
      const resolve = pendingBatchResolve;
      pendingBatchResolve = null;
      resolve?.(choice.runs);
    });
    batchRowEl.appendChild(btn);
  }
  batchRowEl.hidden = choices.length === 0;

  cancelBtn.textContent = cancelLabel;
  cancelBtn.hidden = false;
  confirmBtn.hidden = true;

  root.hidden = false;
  root.setAttribute('aria-hidden', 'false');
  document.body.classList.add('farm-modal-open');
  suspendFarmInput();
  cancelBtn.focus();

  return new Promise<number | null>((resolve) => {
    pendingBatchResolve = resolve;
  });
}
