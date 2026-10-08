use kiddo::{KdTree, SquaredEuclidean};
use nalgebra::SVector;
use rand::RngExt;
use std::f64;

use crate::{D, simulation::SimulationParameters};

#[derive(Debug, PartialEq, Clone)]
pub struct Boid {
    pub position: SVector<f64, D>,
    pub velocity: SVector<f64, D>,
}

impl Boid {
    pub fn new() -> Self {
        let mut rng = rand::rng();

        let position =
            SVector::<f64, D>::from_iterator((0..D).map(|_| rng.random_range(-1.0..1.0)));

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
        velocity.set_magnitude(0.005);

        Self { position, velocity }
    }

    pub fn separation_cohesion_alignment(
        &mut self,
        tree: &KdTree<f64, D>,
        others: &Vec<Boid>,
        parameters: &SimulationParameters,
    ) -> (SVector<f64, D>, SVector<f64, D>, SVector<f64, D>) {
        let biggest_radius = parameters
            .radius_sep()
            .max(parameters.radius_coh())
            .max(parameters.radius_ali());

        let within =
            tree.within_unsorted::<SquaredEuclidean>(self.position.as_ref(), biggest_radius);

        let mut dv_sep = SVector::<f64, D>::zeros();
        let mut dv_coh = SVector::<f64, D>::zeros();
        let mut dv_ali = SVector::<f64, D>::zeros();

        let mut count_sep = 0;
        let mut count_coh = 0;
        let mut count_ali = 0;

        for neighbor in within.iter() {
            if neighbor.distance < 1e-10 {
                continue;
            }

            let other = &others[neighbor.item as usize];
            let dist = neighbor.distance.sqrt();

            if dist < parameters.radius_sep() {
                let diff = (self.position - other.position).normalize();

                dv_sep += diff;
                count_sep += 1;
            }

            if dist < parameters.radius_ali() {
                dv_ali += other.velocity;
                count_ali += 1;
            }

            if dist < parameters.radius_coh() {
                dv_coh += other.position;
                count_coh += 1;
            }
        }

        if count_sep > 0 {
            // total_sep.set_magnitude(BOID_MAX_MAG);
        }

        if count_coh > 0 {
            dv_coh = dv_coh / count_coh as f64 - self.position;
            // total_pos.set_magnitude(BOID_MAX_MAG);
        }

        if count_ali > 0 {
            // total_vel.set_magnitude(BOID_MAX_MAG);
            dv_ali = dv_ali / count_ali as f64 - self.velocity;
        }

        // console::log_4(&count_sep.into(), &count_coh.into(), &count_ali.into(), &skipped.into());

        (dv_sep, dv_coh, dv_ali)
    }
}
