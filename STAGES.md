# `/architecture` Trace Demo Stages

## Goal

Rebuild `/architecture` into a polished, professional trace demo for the story:

**request -> classify -> discover skill -> invoke tools -> update state -> return result**

Keep the experience clean, white-themed, and useful for an engineering audience. Use subtle neon accents and glows only where they clarify active state, discovery, execution, or completion.

## Stage 1 - Baseline and Scope

- [ ] Confirm `/architecture` is the only target route for this demo pass.
- [ ] Leave `/execution` and live WebSocket behavior unchanged.
- [ ] Keep `@xyflow/react` as the topology canvas engine.
- [ ] Remove or hide the current export-position control from the production demo UI.
- [ ] Identify reusable app styles and tokens before adding new CSS.
- [ ] Avoid standards-heavy details, fictional protocols, latency claims, or long labels unless they are necessary for comprehension.

## Stage 2 - Demo Data Model

- [ ] Define a typed deterministic scenario model for the architecture feature.
- [ ] Include only the core nodes from `PLAN.md`: Phone, SRF, System Agent, Connection Agent, Compute Agent, Sense Agent, ACRF, IGW, AM, SM, Policy, DB, and UP.
- [ ] Define each trace step with active node ids, active edge ids, event type, short summary, selected inspector content, and state changes.
- [ ] Use clear event categories: `registry`, `ingress`, `dispatch`, `discovery`, `execution`, `handoff`, and `result`.
- [ ] Keep scenario copy concise and engineering-facing.
- [ ] Add enough data for one complete scenario before adding more presets.

## Stage 3 - Page Structure

- [ ] Rework `ArchitecturePage` into a full-screen white-theme demo shell.
- [ ] Add a compact top control bar with title, scenario label, playback controls, speed, and mode/status.
- [ ] Add the main topology canvas as the primary visual area.
- [ ] Add a right rail with Trace, Inspector, and State sections.
- [ ] Ensure the layout remains usable on desktop and narrower browser widths.
- [ ] Avoid nested cards and avoid making the canvas look like an embedded preview.

## Stage 4 - Topology Canvas

- [ ] Rebuild the graph layout around the demo domains: Device, Agent Runtime, and NF Tool Domain.
- [ ] Make domain grouping visible but quiet with light tints, thin borders, and restrained labels.
- [ ] Style node cards with stable dimensions, short labels, role subtitles, and small status/skill/tool badges where useful.
- [ ] Differentiate semantic states:
  - [ ] idle: neutral white card with soft border.
  - [ ] selected: clear outline and subtle lift.
  - [ ] processing: restrained glow or pulse.
  - [ ] discoverable/registered: small amber registry marker.
  - [ ] completed: subtle green confirmation.
  - [ ] failed: red style available, but unused in the default happy-path scenario.
- [ ] Style edge types consistently:
  - [ ] discovery: dashed amber path.
  - [ ] execution: solid blue/cyan path.
  - [ ] agent handoff: purple path.
  - [ ] result: green return path.
- [ ] Dim unrelated nodes and edges during active playback without making the graph hard to read.

## Stage 5 - Playback Behavior

- [ ] Implement Play/Pause state.
- [ ] Implement Step to advance exactly one trace event.
- [ ] Implement Replay to reset to the beginning.
- [ ] Implement speed selection with a small, readable set of options.
- [ ] Autoadvance through the scenario without skipping inspector or timeline updates.
- [ ] Pause at completion and keep the completed path inspectable.
- [ ] Keep animation limited to the active path and active node.

## Stage 6 - Trace Timeline

- [ ] Render trace events in order with source, target, event type, short summary, status, and step number.
- [ ] Highlight the active trace event.
- [ ] Mark completed events quietly after the active step advances.
- [ ] Clicking a trace event jumps to that step.
- [ ] Keep rows compact and scannable.
- [ ] Avoid long JSON blocks, packet dumps, or verbose generated explanations.

## Stage 7 - Inspector and State Panel

- [ ] Show selected step details by default during playback.
- [ ] Show selected node details when a node is clicked.
- [ ] For agent events, show role, why it took control, next action, and selected skill if available.
- [ ] For ACRF events, show request summary, candidate capabilities, and chosen match.
- [ ] For NF execution events, show tool summary, affected state, and concise input/output summary.
- [ ] For the final result, show outcome, path used, total steps, and completion status.
- [ ] Add a compact state summary for session readiness, discovery state, selected capability, and final result.

## Stage 8 - Visual Polish

- [ ] Keep the global look white, clean, and modern.
- [ ] Use subtle neon accents instead of saturated background blocks.
- [ ] Use consistent semantic colors:
  - [ ] purple for agent reasoning and handoff.
  - [ ] amber/gold for ACRF discovery and registry matching.
  - [ ] blue/cyan for NF tool invocation and deterministic execution.
  - [ ] green for success and completed state.
  - [ ] red only for failure states.
- [ ] Keep button and card border radius at 8px or less.
- [ ] Do not use a dominant purple, dark blue, beige, brown, or one-note palette.
- [ ] Do not add decorative blobs, dramatic gradients, or excessive ambient movement.
- [ ] Make text fit within cards at desktop and mobile widths.

## Stage 9 - Verification

- [ ] Run `npm run build`.
- [ ] Run `npm run lint`.
- [ ] Start the Vite dev server.
- [ ] Use Playwright remote Chrome to verify the initial ready state.
- [ ] Verify Play, Pause, Step, Replay, and speed controls.
- [ ] Verify timeline click and node click both update focus and inspector content.
- [ ] Verify discovery and execution states are visually distinct.
- [ ] Verify the completed state keeps the full path readable.
- [ ] Capture or inspect desktop and narrower viewport layouts.
- [ ] Fix visual clutter before adding any extra scenario content.

## Stage 10 - Final Review Criteria

- [ ] A viewer can understand the story within a few seconds.
- [ ] The UI reads as a professional engineering demo, not a slide deck or standards simulator.
- [ ] The graph is readable while idle, during playback, and after completion.
- [ ] Trace and inspector panels add useful depth without overwhelming the canvas.
- [ ] The implementation is deterministic and works without a backend.
- [ ] No unrelated pages or existing user changes are modified.
