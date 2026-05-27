import { onLocaleChange, t } from './core';

const AUTH_INPUT_IDS = [
  'login-email',
  'login-password',
  'register-display-name',
  'register-email',
  'register-password',
] as const;

export function messageFor(input: HTMLInputElement): string {
  if (input.validity.valueMissing) {
    if (input.id.includes('email')) {
      return t('validation.requiredEmail');
    }
    if (input.id.includes('password')) {
      return t('validation.requiredPassword');
    }
    if (input.id.includes('display-name')) {
      return t('validation.requiredDisplayName');
    }
    return t('validation.required');
  }
  if (input.validity.typeMismatch) {
    if (input.type === 'email') {
      return t('validation.invalidEmail');
    }
  }
  if (input.validity.tooShort) {
    if (input.id.includes('password')) {
      return t('validation.passwordTooShort');
    }
    if (input.id.includes('display-name')) {
      return t('validation.displayNameTooShort');
    }
  }
  return t('validation.invalid');
}

function bindInput(input: HTMLInputElement): void {
  const refresh = () => {
    if (!input.validity.valid) {
      input.setCustomValidity(messageFor(input));
    } else {
      input.setCustomValidity('');
    }
  };

  input.addEventListener('input', () => input.setCustomValidity(''));
  input.addEventListener('invalid', (ev) => {
    ev.preventDefault();
    const el = ev.target as HTMLInputElement;
    el.setCustomValidity(messageFor(el));
  });
  input.addEventListener('blur', refresh);
}

export function validateAuthInputs(ids: readonly string[]): boolean {
  for (const id of ids) {
    const el = document.querySelector<HTMLInputElement>(`#${id}`);
    if (!el) {
      continue;
    }
    if (!el.checkValidity()) {
      el.setCustomValidity(messageFor(el));
      el.reportValidity();
      return false;
    }
    el.setCustomValidity('');
  }
  return true;
}

export function bindFormValidation(): void {
  for (const id of AUTH_INPUT_IDS) {
    const el = document.querySelector<HTMLInputElement>(`#${id}`);
    if (el) {
      bindInput(el);
    }
  }

  onLocaleChange(() => {
    for (const id of AUTH_INPUT_IDS) {
      const el = document.querySelector<HTMLInputElement>(`#${id}`);
      if (el && !el.validity.valid) {
        el.setCustomValidity(messageFor(el));
      }
    }
  });
}
