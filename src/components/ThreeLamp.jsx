import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { soundManager } from '../utils/soundEffects';
import { createRadialLightTexture, createParticleTexture, createLightConeMaterial } from '../utils/textureGenerators';

export default function ThreeLamp({ isLampOn, onToggleLamp, mood, isMobile = false }) {
  const activeMood = mood || {
    bulbColor: '#fff6b8',
    lightColor: '#facc15',
    secondaryColor: '#f59e0b',
    particleColor: '#fde047',
  };
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const frameIdRef = useRef(null);

  // 3D Objects refs for animation & interaction
  const lampGroupRef = useRef(null);
  const lampHeadRef = useRef(null);
  const bulbRef = useRef(null);
  const bulbLightRef = useRef(null);
  const spotLightRef = useRef(null);
  const floorPuddleRef = useRef(null);
  const lightConeRef = useRef(null);
  const particlesRef = useRef(null);

  // Pull chain refs
  const chainGroupRef = useRef(null);
  const pullKnobRef = useRef(null);
  const chainBeadsRef = useRef([]);
  const stringLineRef = useRef(null);

  // Dragging state
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const currentPullOffsetRef = useRef(0);
  const maxPullDistance = 0.75;
  const triggerThreshold = 0.38;
  const hasTriggeredThisPull = useRef(false);

  // Parallax mouse
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // Raycaster for 3D clicks / hover
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());
  const [isKnobHovered, setIsKnobHovered] = useState(false);
  const [knobScreenPos, setKnobScreenPos] = useState({ x: 0, y: 0, visible: false });
  const knobWorldPosVec = useRef(new THREE.Vector3());
  const quickPullFnRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x08080a, 0.04);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition(camera, width, height);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Materials
    const darkMetalMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.9,
      roughness: 0.28,
    });

    const brushedGoldMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.88,
      roughness: 0.3,
    });

    const innerReflectorMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff0c2,
      metalness: 0.2,
      roughness: 0.4,
      emissive: 0x554411,
      emissiveIntensity: 0.1,
    });

    // 5. Build Lamp Hierarchy
    const lampGroup = new THREE.Group();
    lampGroupRef.current = lampGroup;
    scene.add(lampGroup);

    // Adjust lamp root position based on screen width
    updateLampPosition(lampGroup, width, height);

    // Lamp Base
    const baseGeo = new THREE.CylinderGeometry(0.85, 0.92, 0.08, 48);
    const baseMesh = new THREE.Mesh(baseGeo, darkMetalMaterial);
    baseMesh.position.y = -2.16;
    baseMesh.receiveShadow = true;
    lampGroup.add(baseMesh);

    // Base gold ring accent
    const baseRingGeo = new THREE.CylinderGeometry(0.87, 0.87, 0.02, 48);
    const baseRingMesh = new THREE.Mesh(baseRingGeo, brushedGoldMaterial);
    baseRingMesh.position.y = -2.12;
    lampGroup.add(baseRingMesh);

    // Stand Stem
    const stemHeight = 3.6;
    const stemGeo = new THREE.CylinderGeometry(0.045, 0.045, stemHeight, 24);
    const stemMesh = new THREE.Mesh(stemGeo, darkMetalMaterial);
    stemMesh.position.y = -2.16 + stemHeight / 2;
    stemMesh.castShadow = true;
    stemMesh.receiveShadow = true;
    lampGroup.add(stemMesh);

    // Upper swivel joint
    const jointGeo = new THREE.SphereGeometry(0.09, 24, 24);
    const jointMesh = new THREE.Mesh(jointGeo, brushedGoldMaterial);
    jointMesh.position.y = 1.45;
    lampGroup.add(jointMesh);

    // Lamp Head (Dome Shade + Bulb + Socket) - Tilts when pull string is pulled
    const lampHead = new THREE.Group();
    lampHead.position.set(0, 1.45, 0);
    lampHeadRef.current = lampHead;
    lampGroup.add(lampHead);

    // Shade connector rod
    const shadeRodGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 16);
    const shadeRodMesh = new THREE.Mesh(shadeRodGeo, darkMetalMaterial);
    shadeRodMesh.position.y = 0.15;
    lampHead.add(shadeRodMesh);

    // Top cap finial
    const finialGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.1, 32);
    const finialMesh = new THREE.Mesh(finialGeo, brushedGoldMaterial);
    finialMesh.position.y = 0.36;
    lampHead.add(finialMesh);

    // Outer Lampshade Dome (curved half-capsule matching reference photo)
    const domeRadius = 1.12;
    const domeGeo = new THREE.SphereGeometry(
      domeRadius,
      48,
      24,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.46
    );
    // Invert geometry normals or flip to make it an umbrella/shade
    const domeMesh = new THREE.Mesh(domeGeo, darkMetalMaterial);
    domeMesh.rotation.x = Math.PI;
    domeMesh.position.y = 0.32;
    domeMesh.castShadow = true;
    lampHead.add(domeMesh);

    // Inner Reflector Dome
    const innerDomeGeo = new THREE.SphereGeometry(
      domeRadius - 0.015,
      48,
      24,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.46
    );
    const innerDomeMesh = new THREE.Mesh(innerDomeGeo, innerReflectorMaterial);
    innerDomeMesh.rotation.x = Math.PI;
    innerDomeMesh.position.y = 0.32;
    lampHead.add(innerDomeMesh);

    // Bottom Rim Ring (gives the lampshade realistic physical thickness)
    const rimGeo = new THREE.TorusGeometry(0.98, 0.025, 16, 48);
    rimGeo.rotateX(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeo, darkMetalMaterial);
    rimMesh.position.y = -0.32;
    lampHead.add(rimMesh);

    // Light Bulb
    const bulbGeo = new THREE.SphereGeometry(0.24, 32, 32);
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x000000,
      emissiveIntensity: 0,
      roughness: 0.1,
      metalness: 0.1,
    });
    const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
    bulbMesh.position.y = -0.15;
    bulbRef.current = bulbMesh;
    lampHead.add(bulbMesh);

    // Socket base for bulb
    const socketGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.16, 24);
    const socketMesh = new THREE.Mesh(socketGeo, brushedGoldMaterial);
    socketMesh.position.y = 0.02;
    lampHead.add(socketMesh);

    // --- Pull Chain Switch ---
    const chainOriginX = 0.65; // Hanging from underneath the right side of the dome
    const chainOriginY = -0.32;
    const chainOriginZ = 0.1;

    // Small brass eyelet where string emerges
    const eyeletGeo = new THREE.TorusGeometry(0.04, 0.015, 12, 24);
    eyeletGeo.rotateX(Math.PI / 2);
    const eyeletMesh = new THREE.Mesh(eyeletGeo, brushedGoldMaterial);
    eyeletMesh.position.set(chainOriginX, chainOriginY + 0.01, chainOriginZ);
    lampHead.add(eyeletMesh);

    // Chain group (moves dynamically)
    const chainGroup = new THREE.Group();
    chainGroup.position.set(chainOriginX, chainOriginY, chainOriginZ);
    chainGroupRef.current = chainGroup;
    lampHead.add(chainGroup);

    // Build beaded metallic chain
    const restChainLength = 0.95;
    const numBeads = 18;
    const chainBeads = [];

    const beadGeo = new THREE.SphereGeometry(0.022, 12, 12);
    for (let i = 0; i < numBeads; i++) {
      const bead = new THREE.Mesh(beadGeo, brushedGoldMaterial);
      const ratio = (i + 1) / (numBeads + 1);
      bead.position.y = -ratio * restChainLength;
      chainGroup.add(bead);
      chainBeads.push(bead);
    }
    chainBeadsRef.current = chainBeads;

    // Pull Knob (Tassel) at the end of the chain - The interactive hit target!
    const knobGroup = new THREE.Group();
    knobGroup.position.y = -restChainLength;
    chainGroup.add(knobGroup);
    pullKnobRef.current = knobGroup;

    // Knob upper ring
    const knobRingGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.04, 16);
    const knobRingMesh = new THREE.Mesh(knobRingGeo, darkMetalMaterial);
    knobGroup.add(knobRingMesh);

    // Knob teardrop / cylinder body
    const knobBodyGeo = new THREE.CylinderGeometry(0.045, 0.065, 0.16, 24);
    const knobBodyMesh = new THREE.Mesh(knobBodyGeo, brushedGoldMaterial);
    knobBodyMesh.position.y = -0.09;
    knobGroup.add(knobBodyMesh);

    // Knob bottom cap
    const knobCapGeo = new THREE.SphereGeometry(0.065, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const knobCapMesh = new THREE.Mesh(knobCapGeo, brushedGoldMaterial);
    knobCapMesh.rotation.x = Math.PI;
    knobCapMesh.position.y = -0.17;
    knobGroup.add(knobCapMesh);

    // Invisible larger hit box with transparent material for reliable raycasting
    const hitBoxGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const hitBoxMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
    hitBox.position.y = -0.09;
    hitBox.userData = { isPullSwitch: true };
    knobGroup.add(hitBox);

    // 6. Lights
    // Ambient Light (subtle dark cinematic tone)
    const ambientLight = new THREE.AmbientLight(0x0c0c12, 0.6);
    scene.add(ambientLight);

    // Directional Fill Light (cool low moonlight)
    const dirLight = new THREE.DirectionalLight(0x2d3748, 0.35);
    dirLight.position.set(5, 8, 4);
    scene.add(dirLight);

    // Warm Point Light inside Bulb (Omnidirectional glow when ON)
    const bulbLight = new THREE.PointLight(0xfacc15, 0, 15, 1.2);
    bulbLight.position.set(0, -0.18, 0);
    bulbLightRef.current = bulbLight;
    lampHead.add(bulbLight);

    // Warm SpotLight casting downward cone & shadows
    const spotLight = new THREE.SpotLight(0xffdf59, 0, 12, Math.PI * 0.32, 0.45, 1.1);
    spotLight.position.set(0, -0.15, 0);
    spotLight.target.position.set(0, -5, 0);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.camera.near = 0.2;
    spotLight.shadow.camera.far = 10;
    spotLight.shadow.bias = -0.001;
    spotLightRef.current = spotLight;
    lampHead.add(spotLight);
    lampHead.add(spotLight.target);

    // Secondary ambient bounce light (under lamp to simulate bounce onto desk/card)
    const bounceLight = new THREE.PointLight(0xf59e0b, 0, 10, 1.5);
    bounceLight.position.set(1.5, -1.2, 0.5);
    scene.add(bounceLight);

    // 7. Volumetric Light Cone Frustum
    const coneHeight = 3.6;
    const coneTopRadius = 0.98;
    const coneBottomRadius = 2.4;
    const coneGeo = new THREE.CylinderGeometry(coneTopRadius, coneBottomRadius, coneHeight, 36, 1, true);
    coneGeo.translate(0, -coneHeight / 2, 0);
    const coneMat = createLightConeMaterial();
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.position.y = -0.32;
    lightConeRef.current = coneMesh;
    lampHead.add(coneMesh);

    // 8. Surface Light Puddle on Floor / Desk
    const floorPuddleGeo = new THREE.PlaneGeometry(5.2, 5.2);
    const floorPuddleMat = new THREE.MeshBasicMaterial({
      map: createRadialLightTexture(),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const floorPuddle = new THREE.Mesh(floorPuddleGeo, floorPuddleMat);
    floorPuddle.rotation.x = -Math.PI / 2;
    floorPuddle.position.set(0, -2.19, 0);
    floorPuddleRef.current = floorPuddle;
    lampGroup.add(floorPuddle);

    // Desk Surface plane to receive shadows
    const deskGeo = new THREE.PlaneGeometry(30, 20);
    const deskMat = new THREE.ShadowMaterial({ opacity: 0.65 });
    const deskMesh = new THREE.Mesh(deskGeo, deskMat);
    deskMesh.rotation.x = -Math.PI / 2;
    deskMesh.position.y = -2.2;
    deskMesh.receiveShadow = true;
    scene.add(deskMesh);

    // 9. Floating 3D Dust Particles / Glowing Motes
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount * 3);
    const particleOriginals = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.3) * 6.5;
      const y = (Math.random() - 0.5) * 5.0;
      const z = (Math.random() - 0.5) * 4.0;

      particlePositions[i * 3] = x;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = z;

      particleOriginals[i * 3] = x;
      particleOriginals[i * 3 + 1] = y;
      particleOriginals[i * 3 + 2] = z;

      particleSpeeds[i * 3] = (Math.random() - 0.5) * 0.003;
      particleSpeeds[i * 3 + 1] = Math.random() * 0.004 + 0.001;
      particleSpeeds[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.12,
      map: createParticleTexture(),
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0xffffff,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    particlesRef.current = { mesh: particles, speeds: particleSpeeds, originals: particleOriginals };
    scene.add(particles);

    // 10. Pointer Events Handling (Click & Drag for Pull String)
    const getPointerCoords = (e) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: ((clientX - rect.left) / rect.width) * 2 - 1,
        y: -((clientY - rect.top) / rect.height) * 2 + 1,
        clientX,
        clientY,
      };
    };

    const handlePointerMove = (e) => {
      const coords = getPointerCoords(e);
      pointerRef.current.set(coords.x, coords.y);

      // Smooth camera parallax target
      mouseRef.current.targetX = coords.x * 0.25;
      mouseRef.current.targetY = coords.y * 0.15;

      // Handle dragging
      if (isDraggingRef.current) {
        const deltaY = (coords.clientY - dragStartYRef.current) * 0.005;
        const pull = Math.max(0, Math.min(maxPullDistance, deltaY));
        currentPullOffsetRef.current = pull;

        updateChainVisuals(pull);

        // Lamp tilts slightly towards the pull direction
        if (lampHeadRef.current) {
          lampHeadRef.current.rotation.z = -pull * 0.18;
          lampHeadRef.current.rotation.x = pull * 0.08;
        }

        // Trigger switch when pulled past threshold
        if (pull >= triggerThreshold && !hasTriggeredThisPull.current) {
          hasTriggeredThisPull.current = true;
          onToggleLamp();
          soundManager.playSwitchClick(!isLampOn);
        }
      } else {
        // Check hover over pull knob
        raycasterRef.current.setFromCamera(pointerRef.current, camera);
        const hit = raycasterRef.current.intersectObject(hitBox, true);
        setIsKnobHovered(hit.length > 0);
      }
    };

    const handlePointerDown = (e) => {
      const coords = getPointerCoords(e);
      pointerRef.current.set(coords.x, coords.y);
      raycasterRef.current.setFromCamera(pointerRef.current, camera);
      const hit = raycasterRef.current.intersectObject(hitBox, true);

      if (hit.length > 0) {
        isDraggingRef.current = true;
        dragStartYRef.current = coords.clientY;
        hasTriggeredThisPull.current = false;
        soundManager.playChainRattle();
        container.style.cursor = 'grabbing';
      }
    };

    const handlePointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        container.style.cursor = 'default';

        // If user just tapped/clicked without dragging far enough, toggle it!
        if (!hasTriggeredThisPull.current && currentPullOffsetRef.current < 0.1) {
          triggerQuickPullAnimation();
        } else {
          // Release spring bounce back
          springReleaseChain();
        }
      }
    };

    // Fallback click handler if clicked anywhere near the knob
    const triggerQuickPullAnimation = () => {
      soundManager.playChainRattle();
      gsap.to(currentPullOffsetRef, {
        current: 0.42,
        duration: 0.14,
        ease: 'power2.out',
        onUpdate: () => {
          updateChainVisuals(currentPullOffsetRef.current);
          if (lampHeadRef.current) {
            lampHeadRef.current.rotation.z = -currentPullOffsetRef.current * 0.15;
          }
        },
        onComplete: () => {
          onToggleLamp();
          soundManager.playSwitchClick(!isLampOn);
          springReleaseChain();
        }
      });
    };
    quickPullFnRef.current = triggerQuickPullAnimation;

    const springReleaseChain = () => {
      // Harmonic spring oscillation back to 0
      gsap.to(currentPullOffsetRef, {
        current: 0,
        duration: 0.7,
        ease: 'elastic.out(1.2, 0.35)',
        onUpdate: () => {
          updateChainVisuals(currentPullOffsetRef.current);
        }
      });

      // Lamp head pendular swing settling back
      if (lampHeadRef.current) {
        gsap.to(lampHeadRef.current.rotation, {
          z: 0,
          x: 0,
          duration: 1.2,
          ease: 'elastic.out(1.4, 0.4)',
        });
      }
    };

    const updateChainVisuals = (pullOffset) => {
      const restLength = 0.95;
      const totalLength = restLength + pullOffset;

      if (pullKnobRef.current) {
        pullKnobRef.current.position.y = -totalLength;
      }

      const beads = chainBeadsRef.current;
      for (let i = 0; i < beads.length; i++) {
        const ratio = (i + 1) / (beads.length + 1);
        beads[i].position.y = -ratio * totalLength;
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);

    // 11. Resize handling
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      updateCameraPosition(cameraRef.current, w, h);
      if (lampGroupRef.current) {
        updateLampPosition(lampGroupRef.current, w, h);
      }
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 12. Main Render Loop
    let clock = new THREE.Clock();

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Camera parallax damping
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      camera.position.x += (mouseRef.current.x - camera.position.x) * 0.04;
      camera.position.y += (mouseRef.current.y + (width < 768 ? 0.3 : 0.0) - camera.position.y) * 0.04;
      camera.lookAt(width < 768 ? 0 : 0.2, width < 768 ? 0.2 : 0, 0);

      // Animate floating particles
      if (particlesRef.current) {
        const { mesh, speeds, originals } = particlesRef.current;
        const positions = mesh.geometry.attributes.position.array;

        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 1] += speeds[i * 3 + 1];
          positions[i * 3] += Math.sin(elapsedTime * 0.5 + i) * 0.0015;
          positions[i * 3 + 2] += Math.cos(elapsedTime * 0.4 + i) * 0.0015;

          // Wrap around top/bottom
          if (positions[i * 3 + 1] > 2.8) {
            positions[i * 3 + 1] = -2.2;
            positions[i * 3] = originals[i * 3];
            positions[i * 3 + 2] = originals[i * 3 + 2];
          }
        }
        mesh.geometry.attributes.position.needsUpdate = true;
      }

      // Subtle idle breathing swing for hanging pull chain when not dragging
      if (!isDraggingRef.current && pullKnobRef.current && chainGroupRef.current) {
        const sway = Math.sin(elapsedTime * 1.8) * 0.015;
        chainGroupRef.current.rotation.z = sway;
      }

      // Update 2D screen coordinate projection for the pull string knob
      if (pullKnobRef.current && (clock.getElapsedTime() % 0.1 < 0.02 || !knobScreenPos.visible)) {
        pullKnobRef.current.getWorldPosition(knobWorldPosVec.current);
        // Project to normalized device coords [-1, 1]
        const projected = knobWorldPosVec.current.clone().project(camera);
        const screenX = (projected.x * 0.5 + 0.5) * container.clientWidth;
        const screenY = (-(projected.y) * 0.5 + 0.5) * container.clientHeight;
        
        setKnobScreenPos((prev) => {
          if (Math.abs(prev.x - screenX) > 1 || Math.abs(prev.y - screenY) > 1 || !prev.visible) {
            return { x: screenX, y: screenY, visible: true };
          }
          return prev;
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(frameIdRef.current);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Helper: Camera positioning based on aspect ratio
  function updateCameraPosition(cam, w, h) {
    if (w < 768) {
      // Mobile: camera framed slightly higher and further back
      cam.position.set(0, 0.4, 6.8);
    } else if (w < 1024) {
      // Tablet
      cam.position.set(-0.6, 0.1, 5.8);
    } else {
      // Desktop: Wide cinematic view
      cam.position.set(-0.8, 0.0, 5.2);
    }
  }

  // Helper: Position Lamp in 3D space
  function updateLampPosition(lamp, w, h) {
    if (w < 768) {
      // Mobile: Lamp centered at top
      lamp.position.set(0, 0.7, 0);
      lamp.scale.set(0.72, 0.72, 0.72);
    } else if (w < 1024) {
      // Tablet
      lamp.position.set(-1.8, 0.05, 0);
      lamp.scale.set(0.9, 0.9, 0.9);
    } else {
      // Desktop: Lamp on the left, matching reference photo!
      lamp.position.set(-2.25, 0.1, 0);
      lamp.scale.set(1.0, 1.0, 1.0);
    }
  }

  // Effect: Light ON / OFF GSAP Transitions
  useEffect(() => {
    if (!bulbRef.current || !bulbLightRef.current || !spotLightRef.current || !lightConeRef.current || !floorPuddleRef.current) return;

    const bulbMesh = bulbRef.current;
    const bulbLight = bulbLightRef.current;
    const spotLight = spotLightRef.current;
    const coneMesh = lightConeRef.current;
    const floorPuddle = floorPuddleRef.current;
    const particles = particlesRef.current;

    const tl = gsap.timeline();

    if (isLampOn) {
      // --- TURN ON SEQUENCE ---
      // 1. Initial micro-flicker / electrical spark
      tl.to(bulbMesh.material, {
        emissiveIntensity: 0.8,
        duration: 0.04,
        onUpdate: () => {
          bulbMesh.material.emissive.set(activeMood.lightColor);
        }
      })
      .to(bulbMesh.material, { emissiveIntensity: 0.1, duration: 0.03 })
      .to(bulbMesh.material, { emissiveIntensity: 1.4, duration: 0.05 })
      .to(bulbMesh.material, { emissiveIntensity: 0.7, duration: 0.04 })
      // 2. Full warm glow bloom
      .to(bulbMesh.material, {
        emissiveIntensity: 2.8,
        duration: 0.45,
        ease: 'power2.out',
        onStart: () => {
          bulbMesh.material.emissive.set(activeMood.bulbColor);
          bulbLight.color.set(activeMood.lightColor);
          spotLight.color.set(activeMood.lightColor);
          coneMesh.material.uniforms.uColor.value.set(activeMood.lightColor);
        }
      }, '+=0.02');

      // Point Light & SpotLight power up
      tl.to(bulbLight, { intensity: 4.8, distance: 16, duration: 0.5, ease: 'power2.out' }, '-=0.45')
        .to(spotLight, { intensity: 9.5, duration: 0.6, ease: 'power2.out' }, '-=0.5');

      // Volumetric Cone reveals smoothly
      tl.to(coneMesh.material.uniforms.uIntensity, {
        value: 1.0,
        duration: 0.7,
        ease: 'power2.out',
      }, '-=0.5');

      // Floor puddle illuminates
      tl.to(floorPuddle.material, {
        opacity: 0.95,
        duration: 0.65,
        ease: 'power2.out',
      }, '-=0.6');

      // Particles glow warmer and brighter
      if (particles) {
        tl.to(particles.mesh.material, {
          opacity: 0.85,
          size: 0.16,
          duration: 0.8,
          onStart: () => {
            particles.mesh.material.color.set('#fde047');
          }
        }, '-=0.6');
      }
    } else {
      // --- TURN OFF SEQUENCE ---
      // Filament cool-down curve
      tl.to(coneMesh.material.uniforms.uIntensity, {
        value: 0.0,
        duration: 0.35,
        ease: 'power2.in',
      })
      .to(floorPuddle.material, {
        opacity: 0.0,
        duration: 0.35,
        ease: 'power2.in',
      }, '-=0.35')
      .to(spotLight, {
        intensity: 0.0,
        duration: 0.3,
        ease: 'power2.in',
      }, '-=0.35')
      .to(bulbLight, {
        intensity: 0.0,
        duration: 0.35,
        ease: 'power2.in',
      }, '-=0.3')
      .to(bulbMesh.material, {
        emissiveIntensity: 0.0,
        duration: 0.4,
        ease: 'power1.out',
        onComplete: () => {
          bulbMesh.material.emissive.set('#000000');
        }
      }, '-=0.25');

      if (particles) {
        tl.to(particles.mesh.material, {
          opacity: 0.22,
          size: 0.10,
          duration: 0.5,
          onStart: () => {
            particles.mesh.material.color.set('#64748b');
          }
        }, '-=0.4');
      }
    }
  }, [isLampOn]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className={`w-full h-full ${isKnobHovered ? 'cursor-grab-pull' : 'cursor-default'}`}
        style={{ touchAction: 'none' }}
      />

      {/* Interactive Beacon & Hint attached to the pull string knob */}
      {knobScreenPos.visible && (
        <div
          className="absolute pointer-events-auto transition-transform duration-75"
          style={{
            top: `${knobScreenPos.y}px`,
            left: `${knobScreenPos.x}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Pulsating target circle on the knob */}
          <button
            type="button"
            onClick={() => {
              if (quickPullFnRef.current) quickPullFnRef.current();
            }}
            className="group relative flex items-center justify-center p-3 focus:outline-none"
            title="Click or pull to toggle lamp"
          >
            <span
              className={`absolute w-8 h-8 rounded-full border border-yellow-400/50 transition-opacity ${
                !isLampOn ? 'animate-ping opacity-60' : 'opacity-0 group-hover:opacity-40'
              }`}
            />
            <span
              className={`w-3.5 h-3.5 rounded-full bg-yellow-400/90 shadow-[0_0_12px_rgba(250,204,21,0.9)] transition-transform duration-200 group-hover:scale-125 ${
                !isLampOn ? 'animate-pulse' : ''
              }`}
            />
          </button>

          {/* Interactive Hint Banner when lamp is off */}
          {!isLampOn && (
            <div
              onClick={() => {
                if (quickPullFnRef.current) quickPullFnRef.current();
              }}
              className="absolute left-7 top-1/2 -translate-y-1/2 whitespace-nowrap cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-yellow-400/40 text-yellow-300 text-xs font-semibold tracking-wide shadow-2xl backdrop-blur-xl">
                <span>Pull or click string</span>
                <span className="text-sm animate-bounce">👈</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
