import init, { Simulation, SimulationParameters } from './pkg/boids.js';

//import * as THREE from 'three/webgpu';
import * as THREE from 'three';
import { mix, range, normalWorld, oscSine, time } from 'three/tsl';

import { Inspector } from 'three/addons/inspector/Inspector.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';

const D = 2;

function run3D(memory, simulation) {
    const canvas = document.querySelector("#canvas");
    canvas.hidden = true;

    const count = simulation.num_boids();

    let camera, scene, renderer, controls;
    let mesh;
    let magnetMesh;
    let water, sky;

    const dummy = new THREE.Object3D();

    let frame = 0;
    let magnetPosition = new Float64Array([0, 0, 0]);

    async function render() {
        simulation.tick();
        const stride = 6;

        const positionsAndVelocities = new Float64Array(
            memory.buffer,
            simulation.get_boids(),
            simulation.num_boids() * stride,
        );

        for (let i = 0; i < simulation.num_boids(); i++) {
            const [x, y, z, vx, vy, vz] = positionsAndVelocities.slice(stride * i, stride * (i + 1));

            dummy.position.set(x, y, z);
            dummy.lookAt(x + vx, y + vy, z + vz);
            dummy.rotateX(Math.PI / 2);
            dummy.updateMatrix();

            mesh.setMatrixAt(i, dummy.matrix);
        }

        mesh.instanceMatrix.needsUpdate = true;

        if (frame % 300 === 0) {
            magnetPosition = new Float64Array(
                memory.buffer,
                simulation.get_magnet(),
                3,
            );
            magnetMesh.position.set(...magnetPosition);
        }

        const time = performance.now() * 0.0001;
        water.material.uniforms['time'].value += 0.5 * 1.0 / 60.0;
				sky.material.uniforms['time'].value = time;

        await renderer.render(scene, camera);

        frame += 1;
    }

    function animate() {
        render();
    }

    function init() {
				//renderer = new THREE.WebGPURenderer( { antialias: true } );
				renderer = new THREE.WebGLRenderer( { antialias: true } );
				renderer.shadowMap.enabled = true;
				renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setClearColor(new THREE.Color(0x000000));
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(1200, 800);
        renderer.toneMapping = THREE.NeutralToneMapping;
				renderer.toneMappingExposure = 0.5;
        renderer.setAnimationLoop(animate);
        renderer.inspector = new Inspector();

        document.body.appendChild(renderer.domElement);

        camera = new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 0.01, 100);
        camera.position.set(20, 15, -20);
        //camera = new THREE.OrthographicCamera(-15, 15, 15, -15, 0.01, 100);
        //camera.position.set(0, 10, 2);
        camera.updateMatrix();
        camera.lookAt(0, 0, 0);

        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x333333, 0.020);

        const material = new THREE.MeshStandardMaterial();
        material.roughness = 1.0;
        material.metalness = 1.0;

        const geometry = new THREE.CylinderGeometry( 0.1, 0.7, 5, 32, 2 );
        geometry.scale(0.09, 0.09, 0.09);

        mesh = new THREE.InstancedMesh(geometry, material, count);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        //mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        for (let i = 0; i < count; i++) {
            const color = new THREE.Color();
            color.setHSL(Math.random() * 0.2, 0.7, Math.random() * 0.2 + 0.65);
            mesh.setColorAt(i, color);
        }
        mesh.instanceColor.needsUpdate = true;
        scene.add(mesh);

        const magnetMaterial = new THREE.MeshStandardMaterial();
        magnetMaterial.color = new THREE.Color("#9ef404");
        magnetMaterial.roughness = 0.6;
        magnetMaterial.metalness = 0.9;

        const magnetGeometry = new THREE.SphereGeometry( 1.0, 32, 16 );
        magnetGeometry.scale(0.19, 0.19, 0.19);

        magnetMesh = new THREE.Mesh(magnetGeometry, magnetMaterial);
        magnetMesh.castShadow = true;
        scene.add(magnetMesh);

        const axesHelper = new THREE.AxesHelper( 5 );
        scene.add(axesHelper);

        const extent = 50;

        const directionalLight = new THREE.DirectionalLight(0xffffff, 8.0);
        directionalLight.position.set(0, 1.4 * extent, 1.4 * extent);
        directionalLight.target.position.set(0, 0, -15);
        directionalLight.castShadow = true;
				directionalLight.shadow.camera.near = 1;
				directionalLight.shadow.camera.far = 5000;
				directionalLight.shadow.camera.right = extent;
				directionalLight.shadow.camera.left = -extent;
				directionalLight.shadow.camera.top	= extent;
				directionalLight.shadow.camera.bottom = -extent;
				directionalLight.shadow.mapSize.width = 512;
				directionalLight.shadow.mapSize.height = 512;
        directionalLight.shadow.bias = -0.0001;
        directionalLight.shadow.normalBias = 0;
        directionalLight.shadow.intensity = 0.9;

        directionalLight.updateMatrixWorld(true);
        directionalLight.target.updateMatrixWorld(true);
        directionalLight.shadow.updateMatrices(directionalLight);

        scene.add(directionalLight);

        const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 17.0);
        scene.add(hemisphereLight);

        const lightMesh = new THREE.Mesh(
            new THREE.SphereGeometry(1.1, 32, 16),
            new THREE.MeshStandardMaterial({
                emissive: new THREE.Color("#ffffff"),
            }),
        );
        lightMesh.position.copy(directionalLight.position);
        lightMesh.updateMatrix();
        scene.add(lightMesh);

        const waterGeometry = new THREE.PlaneGeometry(200, 200);
        water = new Water(
            waterGeometry,
            {
                textureWidth: 512,
                textureHeight: 512,
						    sunDirection: (new THREE.Vector3()).copy(directionalLight.position).normalize(),
                waterNormals: new THREE.TextureLoader().load( 'waternormals.jpg', function ( texture ) {

							      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

						    } ),
						    sunColor: 0xffffff,
						    waterColor: 0x001e0f,
						    distortionScale: 5.0,
						    fog: scene.fog !== undefined
					  }
        );

        water.material.uniforms['size'].value = 10;
        water.rotateX(-Math.PI / 2);
        water.position.set(0, -5, 0);
        scene.add(water);

        sky = new Sky();
				sky.scale.setScalar(1000);
				sky.material.uniforms['sunPosition'].value.copy(directionalLight.position);
				sky.material.uniforms['turbidity'].value = 1;
				sky.material.uniforms['rayleigh'].value = 1;
				sky.material.uniforms['mieCoefficient'].value = 0.005;
				sky.material.uniforms['mieDirectionalG'].value = 0.8;
				sky.material.uniforms['cloudCoverage'].value = 0.4;
				sky.material.uniforms['cloudDensity'].value = 0.5;
				sky.material.uniforms['cloudElevation'].value = 0.5;
				scene.add(sky);

        const gui = renderer.inspector.createParameters('Settings');
        controls = new OrbitControls(camera, renderer.domElement);
    }

    init();

}

function run2D(memory, simulation) {
    const canvas = document.querySelector("#canvas");
    const ctx = canvas.getContext("2d");

    const toCanvasCoordinates = (x, y) => {
        return [
            (x - 0.5) * canvas.width / 16 + canvas.width / 2,
            (y - 0.5) * canvas.height / 16 + canvas.height / 2,
        ];
    }

    ctx.fillStyle = "lightblue";

    let frame = 0;
    let magnetPosition = new Float64Array([0.5, 0.5]);

    const performanceGauge = document.querySelector("#performance");

    const renderLoop = () => {
        const t0 = performance.now();
        simulation.tick();
        const t1 = performance.now();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "black";
        ctx.beginPath();

        const stride = 4;
        // const stride = 6;
        const positionsAndVelocities = new Float64Array(
            memory.buffer,
            simulation.get_boids(),
            simulation.num_boids() * stride,
        );

        for (let i = 0; i < simulation.num_boids(); i++) {
            const [x, y, vx, vy] = positionsAndVelocities.slice(stride * i, stride * (i + 1));
            // const [x, y, z, vx, vy, vz] = positionsAndVelocities.slice(stride * i, stride * (i + 1));
            const [cx, cy] = toCanvasCoordinates(x, y);
            const [bx, by] = toCanvasCoordinates(x - 5 * vx, y - 5 * vy);
            const r = 1.5;

            ctx.moveTo(cx, cy)
            ctx.arc(cx - r, cy, r, 0.0, 2.0 * Math.PI);
            ctx.moveTo(bx, by);
            ctx.lineTo(cx - r, cy);
        }

        ctx.stroke();

        ctx.strokeStyle = "red";
        ctx.beginPath();
        const [cx, cy] = toCanvasCoordinates(...magnetPosition);
        ctx.moveTo(cx, cy);
        ctx.arc(cx - 5.0, cy, 5.0, 0.0, 2.0 * Math.PI);
        ctx.stroke();

        if (frame % 300 === 0) {
            magnetPosition = new Float64Array(
                memory.buffer,
                simulation.get_magnet(),
                2,
            );
        }

        frame += 1;

        const t2 = performance.now();
        if (frame % 5 == 0) {
            const rate = (1 / (t2 - t0) * 1e3).toFixed(2);
            performanceGauge.innerHTML = `tick: ${(t1 - t0).toFixed(2)} ms, drawing: ${(t2 - t1).toFixed(2)} ms, fps: ${rate}`;
        }

        requestAnimationFrame(() => renderLoop());
    };

    requestAnimationFrame(() => renderLoop());
}

async function run() {
    const module = await init();

    const memory = module.memory;
    const simulation = Simulation.new(1.0, 500);


    // run2D(memory, simulation);
    run3D(memory, simulation);
}

run();
