declare module "mammoth/mammoth.browser.js" {
  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string; messages: unknown[] }>;
  const _default: { extractRawText: typeof extractRawText };
  export default _default;
}
