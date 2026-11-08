# HARSH — Interactive 3D Lamp Login Animation 💡

An interactive, cinematic 3D login experience featuring a realistic hanging/standing lamp with an interactive pull-string switch, volumetric lighting, and a dark glassmorphism authentication card.

Built with **React**, **Three.js**, **GSAP**, and **Tailwind CSS**.

---

## ✨ Features

### 1. Realistic 3D Lamp (Three.js)
* **Physically-Based Materials:** Matte dark-charcoal dome shade, brushed gold brass joints, inner reflector disc, lightbulb socket, and weighted base.
* **Beaded Pull Chain:** 18-segment metallic beaded ball chain ending in a polished gold teardrop tassel knob.
* **Dynamic Swinging Physics:** Pulling or clicking the string exerts natural torque on the lamp head, causing it to tilt and swing like a pendulum with damped spring recovery.
* **Camera Mouse Parallax:** Smooth 3D camera orbit and depth perspective responding to cursor coordinates.

### 2. Physical Interaction & Procedural Sound (Web Audio API)
* **Click & Drag Interaction:** The pull string knob can be clicked directly or grabbed and pulled downward with natural elastic tension.
* **Self-Contained Audio Engine:** 100% synthesized in the browser without external `.mp3` or `.wav` dependencies:
  * Metallic beaded chain rattle while stretching
  * Dual-action mechanical rotary switch click
  * Subtle 60Hz electrical filament warmth and hum while illuminated
  * Incandescent filament glass ping when igniting
* **Audio Controls:** Sound toggle with instant gesture unlock.

### 3. Cinematic Lighting & Reveal Sequence (GSAP)
* **Initial State:** Deep atmospheric dark room with faint floating dust particles and hidden login card.
* **Lamp Activation Sequence:**
  1. Filament ignition with authentic electrical micro-flicker.
  2. Custom shader-driven volumetric light cone radiating downwards.
  3. Elliptical warm golden light puddle spreading across the floor/desk surface.
  4. Ambient light blooming across the room.
  5. Glassmorphism login card fading in and scaling up into position (`opacity: 0 → 1`, `scale: 0.95 → 1`).
  6. Floating golden firefly motes twinkling in the illuminated light beam.
* **Toggle OFF:** Pulling or clicking the switch again gracefully dims the filament, collapses the light cone, and fades the login form back into darkness.

### 4. Glassmorphism Authentication Card
* **Fields:**
  * Username input (with `User` icon)
  * Email Address input (with `Mail` icon)
  * Password input (with `Lock` icon, CapsLock alert, and Show/Hide toggle)
* **Authentication Flows:**
  * **Sign In** mode with Remember Me option and Forgot Password recovery.
  * **Sign Up** mode with dynamic 4-stage password strength meter.
  * **Social Authentication:** Styled Google and GitHub SSO buttons.
* **Celebratory Confetti:** Golden sparkle burst on successful login.
* **Active Session View:** Interactive logged-in profile dashboard preview with avatar, encryption badge, and Sign Out action.
* **Auto-Focus:** Automatically focuses the first form field when illuminated.

---

## 🛠️ Tech Stack

* **Frontend Library:** [React 18](https://react.dev/)
* **Build Tool:** [Vite](https://vitejs.dev/)
* **3D Graphics:** [Three.js](https://threejs.org/)
* **Animations:** [GSAP (GreenSock)](https://gsap.com/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Audio:** Native Web Audio API (`AudioContext`, `OscillatorNode`, `BiquadFilterNode`)

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (version 18 or higher recommended)
* `npm` (comes with Node.js)

### Installation

1. Clone or navigate to the project directory:
```bash
cd "login ui"
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3000/
```

### Production Build

To build the project for production:
```bash
npm run build
```

To preview the production build locally:
```bash
npm run preview
```

---

## 📁 Project Structure

```
login-ui/
├── index.html                      # HTML entry with font preconnects
├── package.json                    # Project dependencies and scripts
├── tailwind.config.js              # Custom glow colors and animations
├── vite.config.js                  # Vite configuration and chunk optimization
├── src/
│   ├── main.jsx                    # React DOM root entry
│   ├── App.jsx                     # Top layout, ambient glow, and brand header
│   ├── index.css                   # Tailwind styles, glassmorphism, button gradients
│   ├── components/
│   │   ├── ThreeLamp.jsx           # 3D Scene, lamp geometry, pull physics, shaders
│   │   ├── LoginForm.jsx           # Glassmorphism card, validation, confetti, auth states
│   │   └── GlowParticles.jsx       # Floating golden fireflies and ambient dust
│   └── utils/
│       ├── soundEffects.js         # Procedural Web Audio API sound synthesizer
│       ├── textureGenerators.js    # Radial floor light map & volumetric cone shaders
│       └── themePresets.js         # Lighting mood palettes and color presets
```

---

## 🎮 How to Interact

1. **Pull the String:** Click or drag down on the golden knob hanging from the right side of the lampshade.
2. **Watch the Magic:** The lamp head tilts, clicks on with realistic audio, and warm light floods the screen to reveal the login card.
3. **Parallax Movement:** Move your cursor across the screen to experience 3D camera depth.
4. **Authenticate:** Enter credentials and click **Sign In** to experience the golden sparkle celebration and account dashboard state.
5. **Switch OFF:** Pull or click the string again anytime to return the room to cinematic darkness.

---

## 📄 License

MIT License — Feel free to use and adapt this project for your own creative applications.
