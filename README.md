# Boids 3D

A [Boids](https://en.wikipedia.org/wiki/Boids) simulation in 3D.

## Requirements

- Install `wasm-pack` (e.g. by running `cargo install wasm-pack` or following the instructions on the [wasm-pack website](https://wasm-bindgen.github.io/wasm-pack/)).
- Install [`pnpm`](https://pnpm.io/).

## Build

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

## Development

Run `pnpm run dev`.

## References

- Craig Reynolds: [Flocks, herds and schools: A distributed behavioral model](https://doi.org/10.1145/37401.37406) (1987)
- Norihiro Maruyama, Daichi Saito, Yasuhiro Hashimoto, Takashi Ikegami: [Dynamic organization of flocking behaviors in a large‑scale boids model](https://doi.org/10.1007/s42001-019-00037-9) (2019)

## License

GNU General Public License v3.0 or later. See [COPYING](./COPYING) for the full text.
