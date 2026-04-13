# Interactive Tracing Review UI Plan

## Goal

Build a visually strong demo app that explains the proposal through a simplified, easy-to-follow agentic execution flow.

The app should emphasize three ideas:

1. **Skill-based discovery** instead of fixed identity-based routing.
2. **Agent orchestration** as the decision layer.
3. **NF MCP tool execution** as the concrete execution layer.

The demo should feel polished and animated, but remain conceptually simple. It is a showcase, not a standards-accurate simulator.

---

## Scope and simplification choices

Keep the demo focused on the following:

- Ignore A2UI for now.
- Ignore the new user-plane tunnel / Agentic Service Stratum transport details.
- Treat the proposal as a **skill and agent execution framework**.
- Treat NFs as **tool providers**:
  - AM
  - SM
  - Policy
  - DB
  - UP
- Treat AAIHF as an **agent runtime domain**, not a single monolithic box.
- Treat ACRF as **registry + discovery only**.
- Treat IGW as a **thin invocation bridge / adapter**.

This keeps the story understandable while still reflecting the proposal’s central idea.

---

## Core story the demo should tell

The user should understand this sequence within seconds:

**Request arrives → agent classifies it → relevant skill is discovered → concrete tools are invoked → state changes are shown → result returns**

That is the entire demo philosophy.

---

## Suggested architecture for the demo

### Device / ingress side

**Phone**
- Visual origin of the request.
- Starts the scenario.
- Receives final result.

**SRF**
- Entry point.
- Normalizes the request into a structured task.
- Sends the task to the agent runtime.
- Should feel lightweight, like a front door or session ingress.

### NF tool domain

This is the deterministic execution side.

**AM**
- Access / session-related network logic.

**SM**
- Session and context setup logic.

**Policy**
- Policy and resource decision logic.

**DB**
- State / profile / context lookup.

**UP**
- User-plane or forwarding-related execution role.

In the simplified demo, each NF can visually expose:
- registered skills
- available MCP tools
- recent tool executions

### Agent runtime domain

This is the purple domain in your sketch.

**System Agent**
- Generic dispatcher.
- First decision point after ingress.
- Routes the request to the right specialized agent.

**Connection Agent**
- Handles traditional connectivity and core-network logic.
- Best place to show session preparation, admission, token or context steps.

**Compute Agent**
- Handles edge compute or compute resource allocation logic.
- Should feel like a service-specialist agent.

**Sense Agent**
- Handles sensing-related logic, semantic task interpretation, or sensor workflow.
- Should visually feel similar to Compute Agent but with different iconography and color tone.

**ACRF**
- Capability registry and semantic discovery node.
- Never presented as an executor.
- Only used to answer “which capability matches this request?”

**IGW**
- Invocation bridge.
- Takes selected capability / skill target and converts it into actual MCP tool execution flow.
- Keep it thin. It should not visually compete with the agents.

---

## Best demo scenario

Use a scenario that mixes classic network logic with new agentic logic.

Recommended scenario:

**Phone requests a sensing task that requires connectivity preparation and compute support.**

This gives you two clear phases:

### Phase 1: connectivity preparation
Handled mainly by:
- System Agent
- Connection Agent
- ACRF
- NF tools

### Phase 2: service execution
Handled mainly by:
- System Agent
- Sense Agent or Compute Agent
- ACRF
- IGW
- NF tools or service-facing execution tools

This is ideal because the audience can see both:
- traditional network-side operations
- newly introduced skill-based agent logic

---

## Recommended end-to-end flow

### Stage 0: registry bootstrap
This happens at app start or as a replayable setup phase.

- NFs register capabilities into ACRF.
- ACRF indexes skills.
- UI shows each NF becoming “discoverable”.
- Agent domain remains idle but ready.

Purpose:
- Teaches the audience what the registry is before the live trace begins.

### Stage 1: request ingress
- Phone emits a user action.
- SRF receives the request.
- SRF transforms it into a structured task.
- Structured request moves into agent domain.

### Stage 2: system dispatch
- System Agent inspects the request.
- System Agent classifies it.
- It determines that connectivity preparation is required first.
- It hands off to Connection Agent.

### Stage 3: connectivity skill discovery
- Connection Agent queries ACRF for relevant network capabilities.
- ACRF returns candidate skills / target profiles.
- Chosen path is highlighted.

### Stage 4: NF tool execution
- Connection Agent initiates deterministic tool flow through the NFs.
- Tool execution updates NF cards.
- Session / policy / state changes are reflected in the UI.

### Stage 5: service skill discovery
- System Agent delegates to Sense Agent or Compute Agent.
- Specialized agent requests relevant capability from ACRF.
- ACRF returns the most relevant skill target.

### Stage 6: invocation bridge and execution
- Specialized agent hands the selected skill to IGW.
- IGW bridges into concrete execution.
- NF or service-side execution proceeds.
- Results propagate back.

### Stage 7: response and review
- Final result returns to the Phone.
- Timeline is complete.
- User can inspect each step after playback.

---

## What the app should visually communicate

At all times, the viewer should be able to answer five questions:

1. **What is happening now?**
2. **Which node is active?**
3. **Is this discovery or execution?**
4. **What changed in network / agent state?**
5. **What happened previously?**

If the UI answers those clearly, the demo will feel strong even with a simplified backend.

---

## UI structure

Use a three-panel structure.

## 1. Main topology canvas
This is the hero area.

It should show:
- domain grouping
- nodes and their relationships
- active message flow
- current step highlights
- skill discovery versus tool execution

This is where attention goes during playback.

### Canvas goals
- Immediate readability
- Cinematic motion
- Easy pause-and-inspect review

## 2. Trace timeline panel
A secondary panel that logs the journey.

Each trace entry should show:
- source
- target
- event type
- brief summary
- status
- timing / order

Purpose:
- Helps users review the whole process.
- Makes the app feel like an observability or tracing product rather than just an animation.

## 3. Detail / inspector panel
When the user clicks a node or timeline event, the side panel should show:
- what the step means
- intent summary
- selected skill
- candidate skills returned by ACRF
- tool execution summary
- before / after state changes

Purpose:
- Gives depth to the demo without cluttering the canvas.

---

## Suggested page layout

### Top bar
Include:
- app title
- scenario selector
- playback controls
- speed control
- replay button
- mode toggle such as “Live” / “Review”

### Left main area
- topology canvas

### Right side panel
Tabs or stacked sections:
- Trace
- Inspector
- State

### Optional bottom strip
A compact event ticker can work well if you want the interface to feel more “broadcast” or “operations center” like.

---

## Visual design direction

Aim for:
- soft dark or muted light background
- clean cards with subtle glass or layered panels
- glowing active states
- restrained palette with meaningful color coding
- rounded, modern components
- deliberate negative space

The app should feel like a premium control-plane visualization tool, not a slide deck.

---

## Domain styling suggestions

Each domain should be visually distinct but not loud.

### Device domain
- coolest, lightest tone
- clear and simple
- visually calm

### NF tool domain
- grounded, structured, deterministic feel
- slightly industrial or infrastructure-like

### Agent runtime domain
- more dynamic and premium
- subtle emphasis to signal this is the “intelligent” layer

Use different border styles or background tints so domain boundaries are obvious even when animation is paused.

---

## Node design suggestions

Each node should support multiple visual states.

### Idle
- soft card
- muted icon
- light shadow

### Selected
- brighter outline
- raised card feeling

### Processing
- pulsing glow
- animated border or icon halo
- optional scanning or ripple effect

### Successful
- subtle green confirmation accent
- completed badge or check pulse

### Failed
- red accent
- shake, flash, or warning marker

### Discoverable / registered
- small skill badge
- registry-linked indicator

Each node card can optionally display:
- title
- role subtitle
- state badge
- skill count
- tool count

---

## Edge and message flow suggestions

Edges should carry meaning, not just connectivity.

### Discovery edges
- dashed
- softer motion
- search-like pulse

### Execution edges
- solid
- brighter motion
- faster, more decisive movement

### Handoff edges
- short animated travel pulse between agents

### Return edges
- lighter reverse motion
- confirms response or result propagation

### Completed path
- softly illuminated for a short time after execution

This will make the graph tell a story even without reading labels.

---

## Animation philosophy

Do not animate everything all the time.

Instead:
- keep the base scene calm
- animate only the active path
- use rhythm to show causality
- let the UI “breathe” between steps

The animation should feel intentional and confident, not noisy.

---

## Most important animation idea

Animate the transformation from abstraction to execution.

That means the UI should visually show:

**request → intent → skill → selected target → tool invocation → state update → result**

This is the single most valuable narrative device in the whole app.

---

## Recommended animation sequence for each major step

### 1. Ingress pulse
- Phone highlights.
- Request chip appears.
- Chip moves to SRF.

### 2. Normalization
- SRF briefly expands or lights up.
- Request chip morphs into a more structured object.

### 3. Agent handoff
- Structured task moves to System Agent.
- System Agent glows and “thinks”.
- It emits a handoff chip to a specialized agent.

### 4. Intent to skill transformation
- Specialized agent displays a small intent badge.
- Intent badge transforms into a skill badge or URI-style token.
- This token moves to ACRF.

### 5. Discovery response
- ACRF lights up with a search / matching effect.
- Candidate targets briefly fan out or appear as lightweight overlays.
- Final match is emphasized.

### 6. Execution bridge
- Selected match moves to IGW.
- IGW emits one or more execution tokens toward NF nodes.

### 7. Tool execution
- NF node receives the token.
- Node expands slightly.
- A small tool label appears.
- State update is shown on the card.

### 8. Result propagation
- Result chip travels back to the invoking agent.
- Agent completes and returns status upward.
- Final completion returns to Phone.

This sequence will make the demo feel smart and cinematic without being overly complex.

---

## Animation suggestions by UI area

## Topology canvas
- moving message pulses
- node glows
- temporary skill badges
- path illumination
- domain-level subtle background response when an area is active

## Timeline panel
- new events slide in smoothly
- active event row pulses softly
- completed items settle into a quieter state

## Inspector panel
- selected content crossfades rather than hard switches
- show gradual reveal of sections instead of instant overload

---

## Suggested motion vocabulary

Use a small set of recurring motions so the UI feels coherent.

### Pulse
Use for:
- active node
- active message
- current timeline row

### Morph
Use for:
- intent becoming skill
- skill becoming execution token

### Expand / collapse
Use for:
- node detail preview
- candidate list reveal
- tool execution detail

### Sweep or scan
Use for:
- ACRF matching
- registry search

### Ripple
Use for:
- successful completion
- domain activation

### Drift / float
Use sparingly for ambient premium feel in idle state

---

## Color semantics

Assign clear meanings.

### Purple
- agent reasoning
- handoff between agents
- planning and orchestration

### Amber / gold
- ACRF discovery
- registry operations
- candidate matching

### Blue
- NF tool invocation
- infrastructure operations
- deterministic execution

### Green
- success
- validated state
- completed transitions

### Red
- failure
- rejection
- invalid path

Keep these meanings consistent across canvas, timeline, and inspector.

---

## Interaction suggestions

### Playback modes
Support:
- autoplay demo mode
- step-through review mode
- click-to-focus mode

### Scenario presets
Keep a few curated scenarios:
- connectivity-first flow
- compute-assisted flow
- sensing-assisted flow
- mixed service flow

### Click behaviors
Clicking a node should:
- highlight its related events
- dim unrelated topology
- open relevant inspector details

Clicking a timeline event should:
- jump the canvas to that moment
- highlight the active path
- show the associated node states

### Hover behavior
Hover should be subtle and informative, not distracting.

---

## Information layers

The demo should support multiple levels of understanding.

### Level 1: cinematic overview
User sees only motion and high-level labels.

### Level 2: architecture understanding
User inspects nodes, relationships, and flow categories.

### Level 3: execution review
User opens trace details and understands what the system did step by step.

This layered design makes the app useful for both quick demos and deeper explanation.

---

## Suggested content shown in the inspector

For an agent event:
- role of the agent
- why it took control
- selected next action
- selected skill

For an ACRF event:
- request summary
- candidate capabilities
- chosen match rationale

For an NF execution event:
- tool summary
- affected state
- inputs and outputs summarized in plain language

For a final result:
- outcome
- path used
- total steps
- total duration

---

## Suggested app states

The demo should feel rich even when not running.

### Empty / ready state
- calm topology
- tiny ambient motion
- hint to start scenario

### Live playback state
- active animated path
- timeline grows
- inspector tracks current step

### Paused review state
- freeze current animation
- preserve visual highlights
- allow inspection

### Completed state
- full path visible
- user can scrub or replay

---

## Make it feel cool without making it messy

A few things will make the app feel premium:

- smooth edge animations
- subtle depth and glow
- consistent motion language
- staged information reveal
- polished playback controls
- dimming of inactive areas during active flow
- visible but elegant state transitions

A few things will make it feel messy:

- too many simultaneous glows
- too much permanent motion
- too much text on the graph
- identical styling for discovery and execution
- large inspector blocks that instantly flood the screen

---

## Recommended first version

For the first polished demo, prioritize:

1. strong topology layout
2. clear domain grouping
3. convincing active-path animation
4. skill discovery visualization
5. tool execution visualization
6. usable trace timeline
7. focused inspector panel

Do not try to simulate every standards detail in version one.

The core success criterion is that a viewer can immediately understand:

**Agents choose skills, ACRF finds capabilities, and NFs execute tools.**

---

## Future enhancements after the first version

After the first clean version works, you can add:

- richer scenario library
- branching / failure / retry animations
- side-by-side comparison of “traditional routing” vs “skill-based routing”
- agent confidence or candidate ranking visualization
- replay scrubbing by time or step
- domain filters
- more service-agent types
- richer state diff visualizations

---

## Final design principle

The app should not feel like a standards diagram turned interactive.

It should feel like a **premium observability-style product demo for an agentic telecom runtime**.

That means:
- architecture clarity
- narrative motion
- selective detail
- strong visual hierarchy
- calm, intentional animation

The best version of this demo is one where the audience understands the idea before you finish explaining it.

