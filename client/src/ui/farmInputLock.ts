/** Blocks Phaser farm input while DOM modals are open. */

export interface FarmInputHooks {
  suspend: () => void;
  resume: () => void;
}

let hooks: FarmInputHooks | null = null;
let suspended = false;

export function registerFarmInputHooks(next: FarmInputHooks): void {
  hooks = next;
}

export function isFarmInputSuspended(): boolean {
  return suspended;
}

export function suspendFarmInput(): void {
  if (suspended) {
    hooks?.suspend();
    return;
  }
  suspended = true;
  hooks?.suspend();
}

export function resumeFarmInput(): void {
  if (!suspended) {
    return;
  }
  suspended = false;
  hooks?.resume();
}
