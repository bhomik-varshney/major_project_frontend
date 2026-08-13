// Temporary diagnostic: verify defineConfig() resolves. Deleted after use.
const HARD_LIMIT = 45000;
const timer = setTimeout(() => {
  process.stdout.write("RESULT: TIMEOUT — defineConfig did not resolve\n");
  process.exit(3);
}, HARD_LIMIT);
timer.unref?.();

const t0 = Date.now();
const mod = await import("@lovable.dev/vite-tanstack-config");
process.stdout.write(`import: ${Date.now() - t0}ms\n`);

const t1 = Date.now();
const cfg = await mod.defineConfig({ tanstackStart: { server: { entry: "server" } } });
const resolved =
  typeof cfg === "function" ? await cfg({ command: "serve", mode: "development" }) : cfg;
clearTimeout(timer);
process.stdout.write(`defineConfig: ${Date.now() - t1}ms\n`);
process.stdout.write(`plugins: ${(resolved?.plugins ?? []).flat(9).filter(Boolean).length}\n`);
process.stdout.write("RESULT: OK\n");
process.exit(0);
