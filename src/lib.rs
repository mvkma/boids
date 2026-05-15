extern crate nalgebra as na;

use kiddo::{KdTree, SquaredEuclidean};
use nalgebra::SVector;
use rand::RngExt;
use std::{f64, fmt};
use wasm_bindgen::prelude::*;
use web_sys::{console};

const D: usize = 2;

#[wasm_bindgen]
#[derive(Debug, PartialEq, Clone)]
pub struct Boid {
    position: SVector<f64, D>,
    velocity: SVector<f64, D>,
}

#[wasm_bindgen]
#[derive(Debug)]
pub struct Simulation {
    dt: f64,
    boids: Vec<Boid>,
    magnet: SVector<f64, D>,
    frame: u64,
}

#[wasm_bindgen]
impl Boid {
    fn new() -> Self {
        let mut rng = rand::rng();

        let position =
            SVector::<f64, D>::from_iterator((0..D).map(|_| rng.random_range(-1.0..2.0)));

        let mut velocity = SVector::<f64, D>::zeros();
        if D == 2 {
            let phi = rng.random_range(0.0..f64::consts::PI * 2.0);
            velocity[0] = phi.cos();
            velocity[1] = phi.sin();
        } else if D == 3 {
            let phi = rng.random_range(0.0..f64::consts::PI * 2.0);
            let theta = rng.random_range(0.0..f64::consts::PI);
            velocity[0] = theta.sin() * phi.cos();
            velocity[1] = theta.sin() * phi.sin();
            velocity[2] = theta.cos();
        } else {
            velocity.fill_with(|| rand::random_range(-1.0..1.0));
        }
        velocity.set_magnitude(0.01);

        Self { position, velocity }
    }

    fn separation_cohesion_alignment(
        &mut self,
        tree: &KdTree<f64, D>,
        others: &Vec<Boid>,
    ) -> (SVector<f64, D>, SVector<f64, D>, SVector<f64, D>) {
        let within2 = tree.within_unsorted::<SquaredEuclidean>(self.position.as_ref(), 0.25 * 0.25);

        let mut total_sep = SVector::<f64, D>::zeros();
        let mut total_pos = SVector::<f64, D>::zeros();
        let mut total_vel = SVector::<f64, D>::zeros();

        let mut count_sep = 0;
        let mut count_pos = 0;
        let mut count_vel = 0;

        for neighbor in within2.iter() {
            if neighbor.distance < 1e-10 {
                continue;
            }

            let other = &others[neighbor.item as usize];

            if neighbor.distance < 0.15 * 0.15 {
                let mut diff = self.position - other.position;
                diff.set_magnitude(neighbor.distance.sqrt().recip());

                total_sep += diff;
                count_sep += 1;

                total_vel += other.velocity;
                count_vel += 1;
            }

            total_pos += other.position;
            count_pos += 1;
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
        if self.frame % 300 == 0 {
            self.magnet.fill_with(|| rand::random_range(-4.0..5.0));
        }

        // update positions
        for boid in self.boids.iter_mut() {
            boid.position
                .set_column(0, &(boid.position + self.dt * boid.velocity));
        }

        // update velocities
        let others = self.boids.clone();
        let tree = KdTree::from_iter(
            others
                .iter()
                .enumerate()
                .map(|(idx, b)| (*b.position.as_ref(), idx as u64)),
        );

        for boid in self.boids.iter_mut() {
            let (total_sep, total_pos, total_vel) =
                boid.separation_cohesion_alignment(&tree, &others);
            let mut magnet_direction = self.magnet - boid.position;
            magnet_direction.try_set_magnitude(magnet_direction.norm().recip(), 1.0e-5);
            let new_velocity = (boid.velocity
                + 5.5 * total_sep
                + 0.3 * total_pos
                + 1.0 * total_vel
                + 0.005 * magnet_direction.cap_magnitude(0.11))
            .cap_magnitude(0.04);

            boid.velocity.set_column(0, &new_velocity);
        }

        self.frame += 1;
    }

    pub fn set_magnet(&mut self, x: f64, y: f64) {
        self.magnet[0] = x;
        self.magnet[1] = y;
    }

    pub fn get_magnet(&self) -> *const f64 {
        self.magnet.as_ptr()
    }

    pub fn num_boids(&self) -> usize {
        self.boids.len()
    }

    pub fn boids(&self) -> *const Boid {
        self.boids.as_ptr()
    }

    pub fn new(dt: f64, num_boids: usize) -> Self {
        let boids = (0..num_boids).map(|_| Boid::new()).collect();
        let magnet = SVector::<f64, D>::identity() * 0.5;

        Simulation {
            dt,
            boids,
            magnet,
            frame: 0,
        }
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
