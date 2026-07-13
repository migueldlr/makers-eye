import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: {
    jsx: "automatic",
  },
  resolve: {
    // Match the app's tsconfig paths, where "@/*" resolves to both the repo
    // root and src. Root-level entries (e.g. "@/styles/*") come first.
    alias: [
      {
        find: "@/styles",
        replacement: fileURLToPath(new URL("./styles", import.meta.url)),
      },
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
    ],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
