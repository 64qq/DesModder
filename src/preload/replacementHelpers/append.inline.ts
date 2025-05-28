import { compileGLesmos } from "#plugins/GLesmos/exportAsGLesmos.ts";

// WorkerGlobalScope?
declare const self: typeof globalThis & {
  dsm_compileGLesmos: typeof compileGLesmos;
};
self.dsm_compileGLesmos = compileGLesmos;

export default "";
