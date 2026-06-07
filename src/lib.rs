extern crate nalgebra as na;

use wasm_bindgen::prelude::*;
use web_sys::console;

mod simulation;
mod boid;

pub const D: usize = 3;


// Called when the Wasm module is instantiated
#[wasm_bindgen(start)]
fn main() -> Result<(), JsValue> {
    // Use `web_sys`'s global `window` function to get a handle on the global
    // window object.
    // let window = web_sys::window().expect("no global `window` exists");
    // let document = window.document().expect("should have a document on window");

    Ok(())
}
