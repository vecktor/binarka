// A minimal declaration of the part of jsdom that tests/index-html.test.ts uses: jsdom ships no types and @types/jsdom is not a
// dependency (TC-10: no new dependency). The test runs the REAL inline head script of index.html with
// `new JSDOM(html, { runScripts: 'dangerously', beforeParse })` (autonomy-log row 124, A5).
declare module 'jsdom' {
  export class VirtualConsole {
    on(event: 'jsdomError', listener: (error: Error) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
  }
  export interface JSDOMOptions {
    url?: string;
    runScripts?: 'dangerously' | 'outside-only';
    virtualConsole?: VirtualConsole;
    beforeParse?: (window: Window & typeof globalThis) => void;
  }
  export class JSDOM {
    constructor(html: string, options?: JSDOMOptions);
    readonly window: Window & typeof globalThis;
  }
}
