use kiddo::KdTree;
use nalgebra::SVector;
use std::fmt;
use wasm_bindgen::prelude::*;

use crate::D;
use crate::boid::{BOID_MAX_MAG, Boid};

#[wasm_bindgen]
#[derive(Debug)]
pub struct Simulation {
    dt: f64,
    boids: Vec<Boid>,
    magnet: SVector<f64, D>,
    frame: u64,
    parameters: SimulationParameters,
}

#[wasm_bindgen]
#[derive(Clone, Copy, Debug)]
pub struct SimulationParameters {
    weight_sep: f64,
    weight_pos: f64,
    weight_vel: f64,
    weight_mag: f64,
    max_velocity: f64,
    radius1: f64,
    radius2: f64,
}

impl Default for SimulationParameters {
    fn default() -> Self {
        Self {
            weight_sep: 5.5,
            weight_pos: 0.3,
            weight_vel: 1.0,
            weight_mag: 10.0 * BOID_MAX_MAG,
            max_velocity: 0.04,
            radius1: 0.4,
            radius2: 0.1,
        }
    }
}

#[wasm_bindgen]
impl SimulationParameters {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        SimulationParameters::default()
    }

    #[wasm_bindgen(getter)]
    pub fn weight_sep(&self) -> f64 {
        self.weight_sep
    }

    #[wasm_bindgen(setter)]
    pub fn set_weight_sep(&mut self, weight: f64) {
        self.weight_sep = weight
    }

    #[wasm_bindgen(getter)]
    pub fn weight_pos(&self) -> f64 {
        self.weight_pos
    }

    #[wasm_bindgen(setter)]
    pub fn set_weight_pos(&mut self, weight: f64) {
        self.weight_pos = weight
    }

    #[wasm_bindgen(getter)]
    pub fn weight_vel(&self) -> f64 {
        self.weight_vel
    }

    #[wasm_bindgen(setter)]
    pub fn set_weight_vel(&mut self, weight: f64) {
        self.weight_vel = weight
    }

    #[wasm_bindgen(getter)]
    pub fn weight_mag(&self) -> f64 {
        self.weight_mag
    }

    #[wasm_bindgen(setter)]
    pub fn set_weight_mag(&mut self, weight: f64) {
        self.weight_mag = weight
    }

    #[wasm_bindgen(getter)]
    pub fn max_velocity(&self) -> f64 {
        self.max_velocity
    }

    #[wasm_bindgen(setter)]
    pub fn set_max_velocity(&mut self, velocity: f64) {
        self.max_velocity = velocity
    }

    #[wasm_bindgen(getter)]
    pub fn radius1(&self) -> f64 {
        self.radius1
    }

    #[wasm_bindgen(setter)]
    pub fn set_radius1(&mut self, radius: f64) {
        self.radius1 = radius
    }

    #[wasm_bindgen(getter)]
    pub fn radius2(&self) -> f64 {
        self.radius2
    }

    #[wasm_bindgen(setter)]
    pub fn set_radius2(&mut self, radius: f64) {
        self.radius2 = radius
    }
}

#[wasm_bindgen]
impl Simulation {
    pub fn tick(&mut self) {
        if self.frame % 300 == 0 {
            self.magnet[0] = rand::random_range(-14.0..15.0);
            self.magnet[1] = rand::random_range(-4.0..5.0);
            self.magnet[2] = rand::random_range(-14.0..15.0);
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
            let (total_sep, total_pos, total_vel) = boid.separation_cohesion_alignment(
                &tree,
                &others,
                self.parameters.radius1,
                self.parameters.radius2,
            );
            let mut magnet_direction = self.magnet - boid.position;
            magnet_direction.try_set_magnitude(magnet_direction.norm().recip(), 1.0e-5);
            let new_velocity = (boid.velocity
                + self.parameters.weight_sep * total_sep
                + self.parameters.weight_pos * total_pos
                + self.parameters.weight_vel * total_vel
                + self.parameters.weight_mag * magnet_direction.cap_magnitude(0.11))
            .cap_magnitude(self.parameters.max_velocity);

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

    pub fn get_boids(&self) -> *const Boid {
        self.boids.as_ptr()
    }

    pub fn get_parameters(&self) -> SimulationParameters {
        self.parameters
    }

    pub fn set_parameters(&mut self, parameters: SimulationParameters) {
        self.parameters = parameters;
    }

    pub fn set_num_boids(&mut self, num_boids: usize) {
        self.boids.resize_with(num_boids, || Boid::new());
    }

    pub fn new(dt: f64, num_boids: usize) -> Self {
        let boids = (0..num_boids).map(|_| Boid::new()).collect();
        let magnet = SVector::<f64, D>::identity() * 0.5;
        let parameters = SimulationParameters::default();

        Simulation {
            dt,
            boids,
            magnet,
            frame: 0,
            parameters,
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
