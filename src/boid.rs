use kiddo::{KdTree, SquaredEuclidean};
use nalgebra::SVector;
use rand::RngExt;
use std::f64;

use crate::D;

#[derive(Debug, PartialEq, Clone)]
pub struct Boid {
    pub position: SVector<f64, D>,
    pub velocity: SVector<f64, D>,
}

impl Boid {
    pub fn new() -> Self {
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

    pub fn separation_cohesion_alignment(
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
