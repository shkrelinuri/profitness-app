export function getFormspreeFormId(): string | null {
  const formId = process.env.FORMSPREE_FORM_ID?.trim();
  return formId && /^[A-Za-z0-9]+$/.test(formId) ? formId : null;
}
