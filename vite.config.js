import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The automatic JSX runtime (used by @vitejs/plugin-react) rewrites JSX to
// call jsx()/jsxs() from "react/jsx-runtime" instead of React.createElement,
// so files no longer need to `import React` just to use JSX. This avoids the
// class of bug where a component file uses JSX but forgets that import,
// which only surfaces as a runtime "React is not defined" error in the
// browser — `vite build` compiles it without complaint either way.
export default defineConfig({
  plugins: [react()],
});
