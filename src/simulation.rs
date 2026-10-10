use kiddo::ImmutableKdTree;
use kiddo::dist::SquaredEuclidean;
use nalgebra::SVector;
use std::fmt;
use wasm_bindgen::prelude::*;

use crate::D;
use crate::boid::Boid;

#[wasm_bindgen]
#[derive(Debug)]
pub struct Simulation {
    dt: f64,
    boids: Vec<Boid>,
    magnets: Vec<SVector<f64, D>>,
    frame: u64,
    parameters: SimulationParameters,
}

#[wasm_bindgen]
#[derive(Clone, Copy, Debug)]
pub struct SimulationParameters {
    weight_sep: f64,
    weight_coh: f64,
    weight_ali: f64,
    weight_mag: f64,
    max_velocity: f64,
    radius_sep: f64,
    radius_coh: f64,
    radius_ali: f64,
    num_mag: usize,
    box_size_mag: f64,
}

impl Default for SimulationParameters {
    fn default() -> Self {
        Self {
            weight_sep: 0.002,
            weight_coh: 0.008,
            weight_ali: 0.06,
            weight_mag: 0.00001,
            max_velocity: 0.005,
            radius_sep: 0.01,
            radius_coh: 0.05,
            radius_ali: 0.05,
            num_mag: 3,
            box_size_mag: 1.0,
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
    pub fn weight_coh(&self) -> f64 {
        self.weight_coh
    }

    #[wasm_bindgen(setter)]
    pub fn set_weight_coh(&mut self, weight: f64) {
        self.weight_coh = weight
    }

    #[wasm_bindgen(getter)]
    pub fn weight_ali(&self) -> f64 {
        self.weight_ali
    }

    #[wasm_bindgen(setter)]
    pub fn set_weight_ali(&mut self, weight: f64) {
        self.weight_ali = weight
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
    pub fn radius_sep(&self) -> f64 {
        self.radius_sep
    }

    #[wasm_bindgen(setter)]
    pub fn set_radius_sep(&mut self, radius: f64) {
        self.radius_sep = radius
    }

    #[wasm_bindgen(getter)]
    pub fn radius_coh(&self) -> f64 {
        self.radius_coh
    }

    #[wasm_bindgen(setter)]
    pub fn set_radius_coh(&mut self, radius: f64) {
        self.radius_coh = radius
    }

    #[wasm_bindgen(getter)]
    pub fn radius_ali(&self) -> f64 {
        self.radius_ali
    }

    #[wasm_bindgen(setter)]
    pub fn set_radius_ali(&mut self, radius: f64) {
        self.radius_ali = radius
    }

    #[wasm_bindgen(getter)]
    pub fn num_mag(&self) -> usize {
        self.num_mag
    }

    #[wasm_bindgen(setter)]
    pub fn set_num_mag(&mut self, n: usize) {
        self.num_mag = n
    }

    #[wasm_bindgen(getter)]
    pub fn box_size_mag(&self) -> f64 {
        self.box_size_mag
    }

    #[wasm_bindgen(setter)]
    pub fn set_box_size_mag(&mut self, radius: f64) {
        self.box_size_mag = radius
    }
}

#[wasm_bindgen]
impl Simulation {
    pub fn tick(&mut self) {
        if self.frame % 300 == 0 {
            let s = self.parameters.box_size_mag;

            if self.parameters.num_mag != self.magnets.len() {
                self.magnets
                    .resize_with(self.parameters.num_mag, || SVector::<f64, D>::identity());
            }

            for i in 0..self.magnets.len() {
                self.magnets[i][0] = rand::random_range(-s..s);
                self.magnets[i][1] = rand::random_range(-0.5..s);
                self.magnets[i][2] = rand::random_range(-s..s);
            }
        }

        // update positions
        for boid in self.boids.iter_mut() {
            boid.position
                .set_column(0, &(boid.position + self.dt * boid.velocity));
        }

        // update velocities
        let others = self.boids.clone();
        let positions: Vec<[f64; D]> = others.iter().map(|b| *b.position.as_ref()).collect();
        let tree = ImmutableKdTree::<f64, D>::new_from_slice(&positions).unwrap();

        let biggest_radius = self
            .parameters
            .radius_sep()
            .max(self.parameters.radius_coh())
            .max(self.parameters.radius_ali());

        let matches = tree
            .query_batch(&positions)
            .within::<SquaredEuclidean<f64>>(biggest_radius)
            .unsorted()
            .execute();

        for (i, boid) in self.boids.iter_mut().enumerate() {
            let within = matches.get(i).unwrap();

            let (dv_sep, dv_coh, dv_ali) =
                boid.separation_cohesion_alignment(&within, &others, &self.parameters);

            let mut dv_mag = SVector::<f64, D>::zeros();
            for i in 0..self.magnets.len() {
                let diff = self.magnets[i] - boid.position;
                dv_mag += diff / diff.norm().powi(2);
            }

            let dv_sep_w = self.parameters.weight_sep * dv_sep;
            let dv_coh_w = self.parameters.weight_coh * dv_coh;
            let dv_ali_w = self.parameters.weight_ali * dv_ali;
            let dv_mag_w = self.parameters.weight_mag * dv_mag;

            let dv = dv_sep_w + dv_coh_w + dv_ali_w + dv_mag_w;
            let new_velocity = (boid.velocity + dv).cap_magnitude(self.parameters.max_velocity);

            boid.velocity.set_column(0, &new_velocity);
        }

        self.frame += 1;
    }

    pub fn num_magnets(&self) -> usize {
        self.magnets.len()
    }

    pub fn get_magnets(&self) -> *const SVector<f64, D> {
        self.magnets.as_ptr()
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

    pub fn randomize_positions(&mut self) {
        for boid in self.boids.iter_mut() {
            for i in 0..D {
                boid.position[i] = rand::random_range(-1.0..1.0);
            }
        }
    }

    pub fn randomize_velocities(&mut self) {
        for boid in self.boids.iter_mut() {
            for i in 0..D {
                boid.velocity[i] = rand::random_range(-1.0..1.0);
            }
            boid.velocity
                .set_magnitude(rand::random_range(0.0..self.parameters.max_velocity));
        }
    }

    pub fn new(dt: f64, num_boids: usize) -> Self {
        let boids = (0..num_boids).map(|_| Boid::new()).collect();
        let parameters = SimulationParameters::default();
        let magnets = (0..parameters.num_mag)
            .map(|_| SVector::<f64, D>::identity() * 0.5)
            .collect();

        Simulation {
            dt,
            boids,
            magnets,
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
            "Simulation {{ dt: {}, num_boids: {} }}\n",
            self.dt,
            self.boids.len(),
        )?;
        for boid in self.boids.iter() {
            write!(f, "  - {:?}\n", boid)?;
        }
        Ok(())
    }
}
