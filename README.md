# LifeAx: Aura Sentinel Build (LifeAx2)

LifeAx is a specialized behavioral intelligence and temporal architecture platform. The **Aura Sentinel** build is designed for high-velocity user profiling and resilient AI-driven lifecycle optimization.

## Primary Objectives

- **Behavioral Profiling**: Capture and analyze user designation, biological rhythms, and 90-day strategic objectives.
- **Resilient AI Layer**: Robust error handling for free-tier Gemini API quotas, featuring model fallbacks and adaptive debouncing.
- **Secure Identity Core**: Integrated authentication gateway and automated AI Studio API key synchronization.
- **Temporal Scheduling**: Mapping cognitive peak windows to actionable task blocks.

## System Architecture

- **`index.tsx`**: Core application logic including Auth, Onboarding, and the Sentinel Chat Engine.
- **`types.ts`**: Data contracts for the baseline user dossier and application state.
- **`index.css`**: "Sentinel" high-contrast immersive dark theme with refined UI transitions.
- **`components/`**: Modularized UI elements including the DottedGlowBackground canvas and SideDrawer overlays.

## Deployment & Usage

This project is optimized for deployment as an ES6 module application. 
1. **GitHub Repository**: `https://github.com/teksan1/LifeAx/tree/LifeAx2`
2. **Access**: Requires Identity Core authentication (configured in `index.tsx`).
3. **API Integrity**: Uses `process.env.API_KEY` for seamless @google/genai integration.

---
*Maintained by teksan1 - Final Build Release*
