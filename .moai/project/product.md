# MESAsim - Product Overview

## Project Name

MESAsim (Multi-Entity Spatial Autonomous Simulation)

## Description

MESAsim is a 3D autonomous agent simulation platform that renders Korean cityscapes from real OpenStreetMap data and populates them with AI-driven agents powered by Google Gemini. Agents exhibit personality-driven behavior, navigate road networks using A* pathfinding, form memories, and interact with each other in a dynamic day/night and weather cycle.

## Target Audience

- AI researchers exploring emergent behavior in multi-agent systems
- Simulation enthusiasts interested in urban agent dynamics
- Developers studying real-time 3D web rendering with React Three Fiber
- Educators demonstrating autonomous agent concepts in a visual environment

## Core Features

1. **3D City Rendering** - Real OpenStreetMap data transformed into 3D cityscapes covering 8 Korean regions (Gangnam, Hongdae, Haeundae, Itaewon, Myeongdong, Bukchon, Yeouido, Jeju).
2. **AI-Powered Agent Behavior** - Google Gemini API drives agent generation, decision-making, and conversation through structured prompts.
3. **A* Pathfinding** - Road-network-aware navigation with a binary min-heap priority queue for efficient route calculation.
4. **Day/Night Cycle and Weather** - Dynamic lighting transitions and weather system affecting the simulation environment.
5. **Agent Personality System** - Big Five OCEAN personality traits influence agent decisions, interactions, and movement patterns.
6. **Agent Memory and Interaction** - Agents remember past events and hold conversations with nearby agents.
7. **IndexedDB Persistence** - Agent state is persisted to the browser via IndexedDB, allowing sessions to survive page reloads.
8. **Real-Time Simulation Controls** - Users can adjust simulation speed, pause, reset, and inspect individual agents through a control panel.

## Use Cases

- **Research Sandbox**: Observe how personality traits and environmental factors shape emergent group behavior over time.
- **Urban Planning Prototyping**: Visualize pedestrian flow patterns across real Korean city layouts.
- **Education**: Demonstrate AI agent architectures, pathfinding algorithms, and state management in an interactive 3D context.
- **Entertainment**: Watch a living city unfold as autonomous agents go about their daily routines.

## Current Status

- **Stage**: Active development (pre-release)
- **Codebase Size**: 2,774 lines of code across 51 TypeScript/TSX files
- **Test Framework**: Vitest 2 + Testing Library (configured, coverage TBD)
- **Build System**: Next.js 15 with Turbopack
- **Package Manager**: pnpm 9.15.0
