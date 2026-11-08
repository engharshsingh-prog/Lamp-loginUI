import * as THREE from 'three';

// Generate radial gradient texture for the floor light puddle
export function createRadialLightTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  gradient.addColorStop(0, 'rgba(255, 230, 140, 0.85)');
  gradient.addColorStop(0.2, 'rgba(250, 204, 21, 0.65)');
  gradient.addColorStop(0.45, 'rgba(234, 179, 8, 0.35)');
  gradient.addColorStop(0.7, 'rgba(217, 119, 6, 0.12)');
  gradient.addColorStop(0.9, 'rgba(180, 83, 9, 0.03)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Generate soft particle texture for floating dust motes
export function createParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.25, 'rgba(254, 240, 138, 0.8)');
  gradient.addColorStop(0.6, 'rgba(250, 204, 21, 0.3)');
  gradient.addColorStop(1, 'rgba(250, 204, 21, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Volumetric light cone shader material
export function createLightConeMaterial() {
  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uIntensity;
    uniform vec3 uColor;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      // Vertical falloff: strongest near top rim, fading down to floor
      float verticalFalloff = pow(1.0 - vUv.y, 0.7);

      // Edge falloff: smoother transparency towards the silhouette edges
      float fresnel = abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
      float edgeFalloff = pow(fresnel, 0.4);

      // Combined alpha
      float alpha = verticalFalloff * edgeFalloff * uIntensity * 0.45;

      // Inner beam intensity
      vec3 finalColor = mix(uColor, vec3(1.0, 0.95, 0.8), (1.0 - vUv.y) * 0.4);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uIntensity: { value: 0.0 },
      uColor: { value: new THREE.Color('#facc15') }
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}
