/**
 * Minimal jsdom surface used by the blog-import scripts. The real
 * `@types/jsdom` package can replace this once registry access allows
 * installing it; only `new JSDOM(html).window.document` is relied upon
 * (which also satisfies convertHTMLToLexical's JSDOM parameter).
 */
declare module 'jsdom' {
  export class JSDOM {
    constructor(html?: string)
    window: { document: Document }
  }
}
