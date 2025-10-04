let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;
let rotationY = 0; // Y-axis rotation (left-right)
let rotationX = 0; // X-axis rotation (up-down)
const maxPoleRotation = Math.PI / 2.5; // Limit to prevent going over poles

function onDocumentMouseDown(event) {
    event.preventDefault();
    isDragging = true;
    previousMouseX = event.clientX;
    previousMouseY = event.clientY;
}

function onDocumentMouseMove(event) {
    if (!isDragging) return;
    
    const deltaX = event.clientX - previousMouseX;
    const deltaY = event.clientY - previousMouseY;
    
    previousMouseX = event.clientX;
    previousMouseY = event.clientY;
    
    // Update rotations based on mouse movement
    rotationY += deltaX * 0.005;
    
    // Constrain X rotation to prevent going over poles
    const newRotationX = rotationX + deltaY * 0.005;
    if (newRotationX >= -maxPoleRotation && newRotationX <= maxPoleRotation) {
        rotationX = newRotationX;
    }
}

function onDocumentMouseUp(event) {
    isDragging = false;
}

document.addEventListener('mousedown', onDocumentMouseDown, false);
document.addEventListener('mousemove', onDocumentMouseMove, false);
document.addEventListener('mouseup', onDocumentMouseUp, false);

function main() {
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#globe') });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const earthGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const earthMaterial = new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('texture/earthmap.jpeg'),
        bumpMap: new THREE.TextureLoader().load('texture/earthbump.jpeg'),
        bumpScale: 1,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earthMesh);

    // Ambient light to uniformly illuminate everything (no shadows)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); // White light, intensity 1.5
    scene.add(ambientLight);

    const starGeometry = new THREE.SphereGeometry(5, 64, 64);
    const starMaterial = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('texture/galaxy.png'),
        side: THREE.BackSide
    });

    const starMesh = new THREE.Mesh(starGeometry, starMaterial);
    scene.add(starMesh);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 1.7;

    const render = () => {
        // Apply rotation using Euler angles to prevent gimbal lock and flipping
        earthMesh.rotation.y = rotationY;
        earthMesh.rotation.x = rotationX;
        
        renderer.render(scene, camera);
    }
    const animate = () => {
        requestAnimationFrame(animate);
        render();
    }
    animate();
}
window.onload = main;
