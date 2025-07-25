import esbuildServe from "esbuild-serve";

esbuildServe(
  {
    logLevel: "info",
    entryPoints: ["src/main.js"],
    bundle: true,
    sourcemap: true,
    outfile: "public/bundle.min.js",
  },
  { root: "./public", port: 8000 },
);
