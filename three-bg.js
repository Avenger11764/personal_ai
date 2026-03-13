const canvas = document.getElementById('bg-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.001);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 50;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Particles
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 2000; // Dense network of points
const posArray = new Float32Array(particlesCount * 3);
const colorsArray = new Float32Array(particlesCount * 3);

const colorBlack = new THREE.Color(0x333333);
const colorYellow = new THREE.Color(0xfacc15);

for(let i = 0; i < particlesCount * 3; i+=3) {
    // Spread further out
    posArray[i] = (Math.random() - 0.5) * 200;
    posArray[i+1] = (Math.random() - 0.5) * 200;
    posArray[i+2] = (Math.random() - 0.5) * 100;
    
    // Mix darker gray and yellow particles
    const mixedColor = Math.random() > 0.8 ? colorYellow : colorBlack;
    colorsArray[i] = mixedColor.r;
    colorsArray[i+1] = mixedColor.g;
    colorsArray[i+2] = mixedColor.b;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

// Particle material
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.6,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// Optional: floating geometric shapes
const shapeGeometry = new THREE.IcosahedronGeometry(1.5, 0);
const shapeMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xfacc15, 
    wireframe: true, 
    transparent: true, 
    opacity: 0.15 
});
const shapes = [];

for(let i = 0; i < 20; i++) {
    const mesh = new THREE.Mesh(shapeGeometry, shapeMaterial);
    mesh.position.x = (Math.random() - 0.5) * 150;
    mesh.position.y = (Math.random() - 0.5) * 150;
    mesh.position.z = (Math.random() - 0.5) * 80;
    
    mesh.rotation.x = Math.random() * Math.PI;
    mesh.rotation.y = Math.random() * Math.PI;
    
    // randomize scale slightly
    const scale = Math.random() * 1.5 + 0.5;
    mesh.scale.set(scale, scale, scale);
    
    scene.add(mesh);
    shapes.push({
        mesh: mesh,
        speedX: (Math.random() - 0.5) * 0.002,
        speedY: (Math.random() - 0.5) * 0.002,
        rotX: (Math.random() - 0.5) * 0.01,
        rotY: (Math.random() - 0.5) * 0.01
    });
}

// Mouse interaction
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
});

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    targetX = mouseX * 0.2;
    targetY = mouseY * 0.2;

    // Smooth camera mouse tracking
    camera.position.x += (mouseX * 15 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 15 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    // Rotate particles slowly
    particlesMesh.rotation.y = elapsedTime * 0.03;
    particlesMesh.rotation.x = elapsedTime * 0.01;

    // Animate wireframe shapes
    shapes.forEach((item) => {
        item.mesh.rotation.x += item.rotX;
        item.mesh.rotation.y += item.rotY;
        
        item.mesh.position.x += item.speedX * 5;
        item.mesh.position.y += Math.sin(elapsedTime * 0.5) * 0.02; // floating effect
    });

    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
