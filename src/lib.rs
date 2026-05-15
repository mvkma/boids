extern crate nalgebra as na;

use nalgebra::Vector2;
use rand::RngExt;
use std::{f64, fmt};
use wasm_bindgen::prelude::*;
use web_sys::console;

#[wasm_bindgen]
#[derive(Debug, PartialEq, Clone)]
pub struct Boid {
    position: Vector2<f64>,
    velocity: Vector2<f64>,
}

#[wasm_bindgen]
#[derive(Debug)]
pub struct Simulation {
    dt: f64,
    boids: Vec<Boid>,
    magnet: Vector2<f64>,
}

#[wasm_bindgen]
impl Boid {
    fn new() -> Self {
        let mut rng = rand::rng();
        let angle = rng.random_range(0.0..f64::consts::PI * 2.0);

        let position = Vector2::new(rng.random(), rng.random());
        let mut velocity = Vector2::new(angle.cos(), angle.sin());
        velocity.set_magnitude(0.01);
        Self {
            position,
            velocity,
        }
    }

    fn separation_cohesion_alignment(
        &self,
        others: &Vec<Boid>,
    ) -> (Vector2<f64>, Vector2<f64>, Vector2<f64>) {
        let mut total_sep = Vector2::new(0.0, 0.0);
        let mut total_pos = Vector2::new(0.0, 0.0);
        let mut total_vel = Vector2::new(0.0, 0.0);

        let mut count_sep = 0;
        let mut count_pos = 0;
        let mut count_vel = 0;

        for other in others.iter() {
            if other == self {
                continue;
            }

            let diff = self.position - other.position;
            let dist = diff.norm();

            if dist < 0.15 {
                total_sep += diff.normalize() / dist;
                count_sep += 1;

                total_vel += other.velocity;
                count_vel += 1;
            } else if dist < 0.55 {
                total_pos += other.position;
                count_pos += 1;
            }
        }

        if count_sep > 0 {
            total_sep.set_magnitude(0.0005);
        }

        if count_pos > 0 {
            total_pos = total_pos / count_pos as f64 - self.position;
            total_pos.set_magnitude(0.0005);
        }

        if count_vel > 0 {
            total_vel.set_magnitude(0.0005);
        }

        (total_sep, total_pos, total_vel)
    }
}

#[wasm_bindgen]
impl Simulation {
    pub fn tick(&mut self) {
        // update positions
        for boid in self.boids.iter_mut() {
            boid.position
                .set_column(0, &(boid.position + self.dt * boid.velocity));
        }

        // console::log_1(&format!("{:?}", self.magnet).into());
        // update velocities
        let others = self.boids.clone();
        for boid in self.boids.iter_mut() {
            let (total_sep, total_pos, total_vel) = boid.separation_cohesion_alignment(&others);
            let magnet_direction = self.magnet - boid.position;
            let new_velocity = (boid.velocity
                + 1.2 * total_sep
                + 0.3 * total_pos
                + 1.0 * total_vel
                + 0.0005 * magnet_direction)
                .cap_magnitude(0.04);

            boid.velocity.set_column(0, &new_velocity);
        }
    }

    pub fn set_magnet(&mut self, x: f64, y: f64) {
        self.magnet[0] = x;
        self.magnet[1] = y;
    }

    pub fn num_boids(&self) -> usize {
        self.boids.len()
    }

    pub fn boids(&self) -> *const Boid {
        self.boids.as_ptr()
    }

    pub fn new(dt: f64, num_boids: usize) -> Self {
        let boids = (0..num_boids).map(|_| Boid::new()).collect();
        let magnet = Vector2::new(0.5, 0.5);

        Simulation { dt, boids, magnet }
    }

    pub fn render(&self) -> String {
        self.to_string()
    }
}

impl fmt::Display for Simulation {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "Simulation {{ dt: {}, num_boids: {}, magnet: {} }}\n",
            self.dt,
            self.boids.len(),
            self.magnet,
        )?;
        for boid in self.boids.iter() {
            write!(f, "  - {:?}\n", boid)?;
        }
        Ok(())
    }
}

// Called when the Wasm module is instantiated
#[wasm_bindgen(start)]
fn main() -> Result<(), JsValue> {
    // Use `web_sys`'s global `window` function to get a handle on the global
    // window object.
    // let window = web_sys::window().expect("no global `window` exists");
    // let document = window.document().expect("should have a document on window");

    Ok(())
}
