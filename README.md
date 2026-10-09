# boids

1. Build WebAssembly blob:
  ```bash
  wasm-pack build --target web
  ```
  The resulting JavaScript package can be found in the `./pkg` directory.

2. Bundle Javascript:
  ```bash
  pnpm run build
  ```
  The output can be found in the `./build` directory.
