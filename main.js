import init, { Simulation, SimulationParameters } from './pkg/boids.js';

import GUI from 'lil-gui';
import Stats from 'stats-gl';

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
    const width = canvas.width;
    const height = canvas.height;
    const maxInstances = 5000;

    let count = simulation.num_boids();

    let camera, scene, renderer, controls;
    let mesh;
    let magnetMesh;
    let water, sky;
    let axesHelper;

    const dummy = new THREE.Object3D();

    let frame = 0;
    let magnetPosition = new Float64Array([0, 0, 0]);

    const stats = new Stats({ trackGPU: true });
    document.querySelector("#boids-stats").appendChild(stats.dom);

    const initialSimulationParameters = simulation.get_parameters();

    const setSimulationParameter = (key, value) => {
        const currentParams = simulation.get_parameters();
        currentParams[key] = value;
        simulation.set_parameters(currentParams);
    };

    const parameters = {
        visual: {
            fov: 75,
            timeScale: 0.5,
            axesHelper: false,
            paused: false,
        },
        water: {
            distortionScale: 1.0,
            size: 10.0,
        },
        sky: {
            turbidity: 1,
            rayleigh: 1,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.9,
            cloudCoverage: 0.5,
            cloudDensity: 0.7,
            cloudElevation: 0.5,
        },
        simulation: {
            numBoids: simulation.num_boids(),
            weightSep: initialSimulationParameters.weight_sep,
            weightCoh: initialSimulationParameters.weight_coh,
            weightAli: initialSimulationParameters.weight_ali,
            weightMag: initialSimulationParameters.weight_mag,
            maxVelocity: initialSimulationParameters.max_velocity,
            radiusSep: initialSimulationParameters.radius_sep,
            radiusCoh: initialSimulationParameters.radius_coh,
            radiusAli: initialSimulationParameters.radius_ali,
            reset: function () {
                const params = new SimulationParameters();
                simulation.set_parameters(params);
                simulationFolder.reset();
            },
            randomizePositions: function () {
                simulation.randomize_positions();
            },
            randomizeVelocities: function () {
                simulation.randomize_velocities();
            }
        }
    };

    const gui = new GUI({ container: document.querySelector("#boids-canvas-container") });
    const visualFolder = gui.addFolder("visual");
    visualFolder.add(parameters.visual, "fov", 30, 150).onChange(value => {
        camera.fov = value;
        camera.updateProjectionMatrix();
    });
    visualFolder.add(parameters.visual, "timeScale", 0, 5);
    visualFolder.add(parameters.visual, "axesHelper").onChange(value => {
        axesHelper.visible = value;
    });
    visualFolder.add(parameters.visual, "paused").onChange(value => {
    });

    const waterFolder = gui.addFolder("water");
    waterFolder.add(parameters.water, "distortionScale", 0, 20).onChange(value => {
        water.material.uniforms['distortionScale'].value = value;
    });
    waterFolder.add(parameters.water, "size", 0, 20).onChange(value => {
        water.material.uniforms['size'].value = value;
    });
    waterFolder.close();

    const skyFolder = gui.addFolder("sky");
    skyFolder.add(parameters.sky, "turbidity", 0, 10).onChange(value => {
        sky.material.uniforms["turbidity"].value = value;
    });
    skyFolder.add(parameters.sky, "rayleigh", 0, 10).onChange(value => {
        sky.material.uniforms["rayleigh"].value = value;
    });
    skyFolder.add(parameters.sky, "mieCoefficient", 0, 1).onChange(value => {
        sky.material.uniforms["mieCoefficient"].value = value;
    });
    skyFolder.add(parameters.sky, "mieDirectionalG", 0, 1).onChange(value => {
        sky.material.uniforms["mieDirectionalG"].value = value;
    });
    skyFolder.add(parameters.sky, "cloudCoverage", 0, 1).onChange(value => {
        sky.material.uniforms["cloudCoverage"].value = value;
    });
    skyFolder.add(parameters.sky, "cloudDensity", 0, 1).onChange(value => {
        sky.material.uniforms["cloudDensity"].value = value;
    });
    skyFolder.add(parameters.sky, "cloudElevation", 0, 1).onChange(value => {
        sky.material.uniforms["cloudElevation"].value = value;
    });
    skyFolder.close();

    const simulationFolder = gui.addFolder("simulation");
    simulationFolder.add(parameters.simulation, "numBoids", 1, maxInstances, 1).onChange(value => {
        simulation.set_num_boids(value);
        count = value;
        mesh.count = value;
    });
    simulationFolder.add(parameters.simulation, "weightSep", -1.0, 1.0).onChange(value => {
        setSimulationParameter("weight_sep", value);
    });
    simulationFolder.add(parameters.simulation, "weightCoh", -1.0, 1.0).onChange(value => {
        setSimulationParameter("weight_coh", value);
    });
    simulationFolder.add(parameters.simulation, "weightAli", -1.0, 1.0).onChange(value => {
        setSimulationParameter("weight_ali", value);
    });
    simulationFolder.add(parameters.simulation, "weightMag", -1.0, 1.0).onChange(value => {
        setSimulationParameter("weight_mag", value);
    });
    simulationFolder.add(parameters.simulation, "maxVelocity", 0.0, 0.1).onChange(value => {
        setSimulationParameter("max_velocity", value);
    });
    simulationFolder.add(parameters.simulation, "radiusSep", 0.0, 2.0).onChange(value => {
        setSimulationParameter("radius_sep", value);
    });
    simulationFolder.add(parameters.simulation, "radiusCoh", 0.0, 2.0).onChange(value => {
        setSimulationParameter("radius_coh", value);
    });
    simulationFolder.add(parameters.simulation, "radiusAli", 0.0, 2.0).onChange(value => {
        setSimulationParameter("radius_ali", value);
    });

    simulationFolder.add(parameters.simulation, "reset");
    simulationFolder.add(parameters.simulation, "randomizePositions");
    simulationFolder.add(parameters.simulation, "randomizeVelocities");

    const fullscreenIcon = document.querySelector('#boids-fullscreen-icon');

    document.addEventListener("fullscreenchange", () => {
        if (document.fullscreenElement) {
        } else {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        }
    });

    fullscreenIcon.addEventListener('click', () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            const parent = renderer.domElement.parentElement;
            parent.requestFullscreen().then(() => {
                renderer.domElement.width = parent.width;
                renderer.domElement.height = parent.height;
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });
        }
    });

    async function render() {
        if (!parameters.visual.paused) {
            simulation.tick();
        }
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
            dummy.position.multiplyScalar(10);
            dummy.updateMatrix();

            mesh.setMatrixAt(i, dummy.matrix);
        }

        mesh.instanceMatrix.needsUpdate = true;

        if (frame % 300 === 0) {
            for (let i = 0; i < 3; i++) {
                magnetPosition = new Float64Array(
                    memory.buffer,
                    simulation.get_magnet(i),
                    3,
                );
                dummy.position.set(...magnetPosition);
                dummy.position.multiplyScalar(10);
                dummy.updateMatrix();
                magnetMesh.setMatrixAt(i, dummy.matrix);
            }

            magnetMesh.instanceMatrix.needsUpdate = true;
        }

        const time = performance.now() * 0.0001;
        water.material.uniforms['time'].value += parameters.visual.timeScale * 1.0 / 60.0;
				sky.material.uniforms['time'].value = time;

        await renderer.render(scene, camera);

        stats.update();

        frame += 1;
    }

    function animate() {
        render();
    }

    function init() {
				//renderer = new THREE.WebGPURenderer( { antialias: true } );
				renderer = new THREE.WebGLRenderer( { antialias: true, canvas: canvas } );
				renderer.shadowMap.enabled = true;
				renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setClearColor(new THREE.Color(0x000000));
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);
        renderer.toneMapping = THREE.NeutralToneMapping;
				renderer.toneMappingExposure = 0.5;
        renderer.setAnimationLoop(animate);
        renderer.inspector = new Inspector();
        stats.init(renderer);

        camera = new THREE.PerspectiveCamera(parameters.visual.fov, width / height, 0.001, 100);
        camera.position.set(20, 15, -20);
        camera.updateMatrix();

        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x333333, 0.020);

        const material = new THREE.MeshStandardMaterial();
        material.emissive = new THREE.Color("#ffffff");
        material.emissiveIntensity = 0.3;
        material.roughness = 0.6;
        material.metalness = 0.9;

        const geometry = new THREE.CylinderGeometry( 0.1, 0.7, 5, 32, 2 );
        geometry.scale(0.09, 0.09, 0.09);

        mesh = new THREE.InstancedMesh(geometry, material, maxInstances);
        mesh.count = count;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        //mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        for (let i = 0; i < maxInstances; i++) {
            const color = new THREE.Color();
            color.setHSL(Math.random() * 0.2, 1.0, Math.random() * 0.2 + 0.65);
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

        magnetMesh = new THREE.InstancedMesh(magnetGeometry, magnetMaterial, 3);
        magnetMesh.count = 3;
        magnetMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        magnetMesh.castShadow = true;
        scene.add(magnetMesh);

        axesHelper = new THREE.AxesHelper( 5 );
        axesHelper.visible = false;
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
                waterNormals: new THREE.TextureLoader().load( './assets/img/waternormals.jpg', function ( texture ) {

							      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

						    } ),
						    sunColor: 0xffffff,
						    waterColor: 0x001e0f,
						    distortionScale: parameters.water.distortionScale,
						    fog: scene.fog !== undefined
					  }
        );

        water.material.uniforms['size'].value = parameters.water.size;
        water.rotateX(-Math.PI / 2);
        water.position.set(0, -5, 0);
        scene.add(water);

        sky = new Sky();
				sky.scale.setScalar(1000);
				sky.material.uniforms['sunPosition'].value.copy(directionalLight.position);
				sky.material.uniforms['turbidity'].value = parameters.sky.turbidity;
				sky.material.uniforms['rayleigh'].value = parameters.sky.rayleigh;
				sky.material.uniforms['mieCoefficient'].value = parameters.sky.mieCoefficient;
				sky.material.uniforms['mieDirectionalG'].value = parameters.sky.mieDirectionalG;
				sky.material.uniforms['cloudCoverage'].value = parameters.sky.cloudCoverage;
				sky.material.uniforms['cloudDensity'].value = parameters.sky.cloudDensity;
				sky.material.uniforms['cloudElevation'].value = parameters.sky.cloudElevation;
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
