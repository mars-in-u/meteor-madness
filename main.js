let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;
let rotationY = 0; // Y-axis rotation (left-right)
let rotationX = 0; // X-axis rotation (up-down)
const maxPoleRotation = Math.PI / 2.5; // Limit to prevent going over poles

// Function to calculate rotation sensitivity based on zoom level
function getRotationSensitivity() {
    const camera = window.cameraInstance;
    if (!camera) return 0.005;
    
    const minZoom = 0.55;  // Closest zoom
    const maxZoom = 8;     // Farthest zoom
    const minSensitivity = 0.001; // Very slow when zoomed in
    const maxSensitivity = 0.008; // Faster when zoomed out
    
    // Normalize camera position to 0-1 range
    const normalizedZoom = (camera.position.z - minZoom) / (maxZoom - minZoom);
    
    // Interpolate sensitivity based on zoom level
    return minSensitivity + (normalizedZoom * (maxSensitivity - minSensitivity));
}

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
    
    // Get dynamic sensitivity based on zoom level
    const sensitivity = getRotationSensitivity();
    
    // Update rotations based on mouse movement with dynamic sensitivity
    rotationY += deltaX * sensitivity;
    
    // Constrain X rotation to prevent going over poles
    const newRotationX = rotationX + deltaY * sensitivity;
    if (newRotationX >= -maxPoleRotation && newRotationX <= maxPoleRotation) {
        rotationX = newRotationX;
    }
}

function onDocumentMouseUp(event) {
    isDragging = false;
}

function onMouseWheel(event) {
    event.preventDefault();
    
    // Enhanced zoom settings
    const zoomSpeed = 0.15;
    const minZoom = 0.55;  // Much closer zoom
    const maxZoom = 8;     // Much farther zoom
    
    // Zoom in/out based on wheel direction
    if (event.deltaY < 0) {
        // Zoom in
        window.cameraInstance.position.z = Math.max(minZoom, window.cameraInstance.position.z - zoomSpeed);
    } else {
        // Zoom out
        window.cameraInstance.position.z = Math.min(maxZoom, window.cameraInstance.position.z + zoomSpeed);
    }
}

document.addEventListener('mousedown', onDocumentMouseDown, false);
document.addEventListener('mousemove', onDocumentMouseMove, false);
document.addEventListener('mouseup', onDocumentMouseUp, false);
document.addEventListener('wheel', onMouseWheel, { passive: false });

function main() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000814); // Very dark blue, almost black
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

    // Create individual stars as particles
    const starCount = 2000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
        // Random positions in a sphere around the scene
        const radius = 10 + Math.random() * 20;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
        starPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
        starPositions[i + 2] = radius * Math.cos(phi);
        
        // Slight color variation (white to slightly blue/yellow)
        const colorVariation = 0.8 + Math.random() * 0.2;
        starColors[i] = colorVariation;
        starColors[i + 1] = colorVariation;
        starColors[i + 2] = 0.9 + Math.random() * 0.1;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    
    const starMaterial = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 1.7;
    
    // Store camera globally for zoom access
    window.cameraInstance = camera;

    const render = () => {
        // Apply rotation using Euler angles to prevent gimbal lock and flipping
        earthMesh.rotation.y = rotationY;
        earthMesh.rotation.x = rotationX;
        
        // Rotate stars with the Earth for immersive effect
        stars.rotation.y = rotationY * 0.5; // Slower rotation for parallax effect
        stars.rotation.x = rotationX * 0.5;
        
        renderer.render(scene, camera);
    }
    const animate = () => {
        requestAnimationFrame(animate);
        render();
    }
    animate();
}
window.onload = main;
