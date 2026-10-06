export const registerFileSourceKey = Symbol('registerFileSource');
/** Flow host navigator — steps read workflowActive / openWorkflow / selectRing from this. */
export const flowNavKey = Symbol('flowNav');
/** Child forms register an async () => boolean; return false to block cartable actions. */
export const crtblValidateKey = Symbol('crtblValidate');
