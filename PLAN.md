# Codex Brief — Concept-First UI for Agentic Core Architecture

## 1. Objective

Build a polished demo UI in React Flow that explains the **conceptual relationship** between:

- **Network AI Agents (NW-Agents)**
- **Agent / Tool repositories (ARF / TRF)**
- **NF-hosted tools**
- **UE request / intent**
- optional **agent collaboration**

This is **not** a full topology simulator and **not** a detailed telecom packet-flow viewer.

The product goal is to make the architecture understandable at a glance:

**request -> agent reasoning -> repository lookup -> tool selection -> deterministic execution**

The UI should feel like a premium **architecture explorer / trace review product** for an agentic 6G core.

---

## 2. Source direction to follow

Use **S2-2602109** as the primary architecture reference.

This means the implementation should follow these concepts closely:

- **NW-Agents** are first-class entities in the 6G core.
- There can be multiple NW-Agent types, especially:
  - **Planning Agent**
  - **Connection Agent**
  - **Data Agent**
  - **Computing Agent**
- **SRF** receives UE requests and routes them to the corresponding NW-Agent.
- **TRF** is the repository for **tools**.
- **ARF** is the repository for **agents**.
- **Tools** are modularized network capabilities exposed by NFs or external components.
- **Intent** can be included or absent; the architecture should support both.
- The NW-Agent can:
  - interpret request / intent,
  - evaluate feasibility and constraints,
  - plan tasks,
  - invoke tools,
  - collaborate with other NW-Agents,
  - observe feedback and adjust decisions in a closed loop.

This brief should stay aligned to that model.

---

## 3. Important change from the earlier direction

Earlier idea:
- heavier focus on **System AI Agent + ARF + NF tools**
- relationship-first architecture
- a possible “skill” layer as a concept bridge

New direction with **S2-2602109**:
- use **NW-Agent** terminology
- explicitly distinguish:
  - **SRF** for routing requests
  - **ARF** for agent registration/discovery
  - **TRF** for tool registration/discovery
- make **Planning Agent** the orchestration center
- make **Connection / Data / Computing Agents** the domain-specialized collaborators
- make **tools**, not generic “skills”, the main execution abstraction

### Important product decision

For this UI, **Tool** is the primary architecture term.

If the product still uses the word **skill** anywhere, treat it only as a **secondary explanatory label** for humans, such as:
- a capability grouping,
- an ability tag,
- or a conceptual label above one or more tools.

Do **not** build “skill” as the core backend-facing object unless needed later.

---

## 4. Product goal

The user should understand these ideas quickly:

1. **Agents are the reasoning layer**
2. **Repositories make the system discoverable**
3. **Tools are the executable modular capabilities**
4. **NFs are the hosting owners of tools**
5. **Planning Agent coordinates**
6. **Specialized agents execute subtasks or invoke their own tools**
7. **Execution is iterative and can adapt based on feedback**

---

## 5. What the UI should emphasize

The UI should emphasize **relationships and concepts**, not general telecom topology.

Primary emphasis:
- which agent is responsible for what
- how agents discover other agents
- how agents discover tools
- how tools are owned by NFs
- how a request becomes a plan
- how a plan becomes a set of tool invocations
- how collaboration works between planning and specialized agents

Lower emphasis:
- full CN node placement
- exact network message paths
- exhaustive SBI sequencing
- complete RAN / UP graph
- standards-accurate line-by-line signaling

---

## 6. Core concept model

### 6.1 Layer model

Use the architecture as a **layered concept system**, not a literal network map.

Recommended conceptual layers:

1. **Request / Intent Layer**
2. **Agent Layer**
3. **Repository Layer**
4. **Tool Layer**
5. **NF Host Layer**
6. **Feedback / Closed Loop Layer**

This allows the product to explain:
- where requests enter,
- who reasons,
- where discovery happens,
- what gets executed,
- who owns execution,
- how service is adjusted.

### 6.2 Primary mental model

Use this as the central product sentence:

**NW-Agent interprets the request, consults repositories, selects tools, and orchestrates deterministic execution.**

---

## 7. Recommended entity model for the UI

## 7.1 Main entities

### UE
- source of request
- may send request with or without intent
- should be lightweight in UI
- should not dominate the screen

### SRF
- request entry and routing function
- routes request to the appropriate NW-Agent
- should be shown as a gateway / dispatcher, not a planner

### Planning Agent
- primary orchestrator
- interprets request / intent
- checks feasibility and constraints
- decomposes request into tasks
- coordinates specialized agents
- discovers tools through TRF
- discovers agents through ARF
- performs iterative adjustment

This should be the **main visual center** of the UI.

### Connection Agent
- handles connection-related tasks
- works with connection, mobility, session, QoS, policy related tools

### Data Agent
- handles data-related tasks
- data collection, data processing, transformation, distribution, storage

### Computing Agent
- handles compute-related tasks
- compute host preparation, compute resource reasoning, service-specific computing orchestration

### ARF
- repository for NW-Agent profiles
- supports registration, discovery, selection of agents
- should visually behave like a directory of collaborators

### TRF
- repository for tool definitions
- supports tool registration, discovery, selection
- should visually behave like a catalog of executable capabilities

### NF-hosted tools
Primary hosting examples:
- 6G AM tools
- 6G SM tools
- 6G PCF tools
- 6G NSSF tools
- analytics / location / policy related tools
- optional AF-hosted tools

### Hosting NFs
NFs should appear mainly as **tool owners / buckets**, not as the star of the UI.

---

## 8. Relationship-first UI direction

The app should feel like a **concept explorer**, not a topology dashboard.

### Recommended main composition

Use a **relationship graph or relationship matrix** centered on the Planning Agent.

Strong recommendation:
- keep a **small graph**
- keep a **tight number of objects on screen**
- reveal complexity progressively

### Recommended visual structure

#### Center
- **Planning Agent**

#### Left side
- **Request / Intent**
- **UE**
- **SRF**

#### Upper / side support
- **ARF**
- **TRF**

#### Right side
- specialized agents:
  - Connection Agent
  - Data Agent
  - Computing Agent

#### Bottom / execution shelf
- NF-hosted tools grouped by NF

This keeps the product focused on reasoning and relationships, while still giving React Flow a clear structure.

---

## 9. React Flow usage direction

React Flow should be used as a **structured concept graph**, not as a literal telecom network topology.

### Use React Flow for:
- entity cards
- relationship edges
- activation states
- focus transitions
- interactive exploration
- drilldown from abstract entity to detailed metadata

### Do not use React Flow for:
- dense carrier backbone diagrams
- large multi-hop transport paths
- full procedural sequencing drawn as a permanent graph
- overloaded line animations everywhere

### Node design principle
Every node must communicate:
- what it is
- why it matters
- what it owns or interacts with
- whether it is idle, selected, active, or referenced

---

## 10. Recommended node categories

Use consistent node classes.

### Request nodes
Examples:
- UE Request
- Intent
- Task Bundle

### Agent nodes
Examples:
- Planning Agent
- Connection Agent
- Data Agent
- Computing Agent

### Repository nodes
Examples:
- ARF
- TRF

### Tool nodes
Examples:
- Authentication Tool
- Subscription Control Tool
- Mobility Management Tool
- Reachability Tool
- SM characteristics determination tool
- Traffic treatment determination tool
- UP configuration tool
- DNS Resolver Tool
- VN creation tool
- Edge server determination tool

### NF owner nodes
Examples:
- 6G AM
- 6G SM
- 6G PCF
- 6G NSSF
- AF / 3rd-party host
- analytics / location provider

---

## 11. Tool representation requirements

The source proposal gives a clear direction: tools are modularized network capabilities exposed through controlled interfaces.

The UI should represent tools with enough structure so that users can understand **why an agent chose them**.

### Every tool card should support these fields conceptually
- Name
- Purpose
- Description
- Hosting NF
- Pre-condition
- Input
- Output
- Post-condition
- Optional procedures / notes

This is one of the most important parts of the product.

### Product implication
When a tool is selected, the side panel should reveal:
- why it exists
- what it changes
- what inputs it needs
- what state it returns
- who hosts it

---

## 12. Agent representation requirements

### Planning Agent card
Must clearly show:
- request understanding
- feasibility evaluation
- decomposition into subtasks
- tool planning
- repository usage
- monitoring / refinement loop

### Specialized agent cards
Must clearly show:
- domain scope
- supported responsibilities
- available abilities
- related tools
- collaboration status

### Agent profile view
Because S2-2602109 explicitly describes ARF and agent profiles, the UI should support an **agent profile inspector** that can display:
- Agent ID
- Agent Name
- URL
- Description
- abilities
- ability descriptions
- expected ability inputs
- status / availability

---

## 13. Intent representation requirements

Use the proposal’s **semi-structured intent** approach.

The UI should not treat intent as a raw text blob only.

It should support structured decomposition into:

- Description
- Goals
- Requirements
- Conditions
- Guidelines
- Extra-info

This is essential because it gives the user a bridge between:
- human request,
- machine interpretation,
- agent planning,
- tool execution.

### Product implication
When a request is clicked, show:
- original user statement
- parsed structured intent
- which parts influenced planning
- which constraints mattered most

---

## 14. Views the product should support

## 14.1 Concept View
Default mode.

Shows:
- UE / SRF
- Planning Agent
- specialized agents
- ARF / TRF
- tool groups
- relationships only

This is the main architecture explanation view.

## 14.2 Request-to-Plan View
Shows how a request becomes a task plan.

Focus:
- request received
- intent parsed
- feasibility checked
- tasks created
- target agents / tools selected

## 14.3 Agent Collaboration View
Shows agent-to-agent task delegation.

Focus:
- Planning Agent
- one or more specialized agents
- ARF-based discovery
- task creation / update / status

## 14.4 Tool View
Shows tool discovery and tool invocation logic.

Focus:
- TRF
- tool metadata
- hosting NFs
- invocation selection
- result states

## 14.5 Closed-Loop View
Shows feedback and iterative adjustment.

Focus:
- feedback from UE / AF / tools / other agents
- evaluation
- updated parameters
- revised task or tool usage

---

## 15. Recommended interaction model

### Click an agent
Show:
- responsibilities
- abilities
- linked repositories
- linked tools
- active tasks
- collaboration partners

### Click TRF
Show:
- list of discovered tools
- tool search results
- tool categories
- hosting NFs
- semantic descriptions

### Click ARF
Show:
- list of discovered agents
- registered profiles
- available abilities
- candidate selection

### Click a tool
Show:
- definition template fields
- hosting NF
- typical use cases
- related agent types
- pre / post conditions

### Click an NF host
Show:
- all tools provided by that NF
- whether the NF is mainly control / policy / session / analytics / external

### Click a request
Show:
- original request
- structured intent
- generated tasks
- selected agent path
- selected tool path

---

## 16. Animation direction

Animation should explain **reasoning and translation**, not physical routing.

### Key motion ideas

#### 1. Request intake
- request appears from UE
- routed through SRF
- lands on Planning Agent

#### 2. Intent parsing
- request expands into structured intent fields
- important fields highlight
- plan preview appears

#### 3. Repository lookup
- Planning Agent sends focused lookup pulses to:
  - ARF for agent discovery
  - TRF for tool discovery

#### 4. Selection
- candidate agents or tools appear as temporary options
- chosen items lock in
- non-selected options fade back

#### 5. Task delegation
- Planning Agent emits task cards to specialized agents
- task cards should look declarative, not low-level

#### 6. Tool invocation
- specialized agent or planning agent selects tool cards
- tool cards briefly activate
- hosting NF subtly lights up

#### 7. Feedback and loop
- feedback chips return from:
  - tools
  - UE
  - other agents
- planning card updates state or adjusts task path

### Motion rule
Keep base scene calm.
Animate only the currently relevant relationships.

---

## 17. Visual hierarchy

Order of visual importance:

1. Planning Agent
2. Active request / task
3. Active repository result
4. Active specialized agent
5. Active tool
6. Hosting NF
7. UE / SRF
8. passive supporting objects

This is very important. The screen must never look like “everything is equally important.”

---

## 18. Design language

Target feel:
- premium
- technical
- calm
- deliberate
- structured
- intelligence-first, not networking-first

### Tone
Think:
- control-plane product
- observability interface
- architecture explorer
- modern enterprise system

Not:
- glossy concept art
- overwhelming telecom diagram
- toy flowchart

---

## 19. Color semantics

Use stable meanings.

- **Purple**: agent reasoning, planning, collaboration
- **Amber**: repository discovery, lookup, candidate selection
- **Blue**: tool invocation, deterministic execution
- **Teal / cyan**: active service state, runtime condition, feedback loop
- **Green**: fulfilled / valid / successful
- **Red**: blocked / invalid / failed / constraint violation
- **Grey**: passive infrastructure context

---

## 20. Recommended concrete scenarios for the first version

Use a small number of scenarios.

### Scenario A — Connection-focused request
Best for:
- Planning Agent
- Connection Agent
- TRF
- AM / SM / PCF / NSSF tools

Example:
- UE requests a connection-oriented service assurance
- Planning Agent interprets
- selects connection-related tools
- executes a plan

### Scenario B — Data + connection collaboration
Best for:
- Planning Agent
- Data Agent
- ARF discovery
- TRF tool selection
- collaboration and task split

Example:
- UE asks for AR / XR or sensing-assisted experience
- Planning Agent decomposes into:
  - connection task
  - data task
- Data Agent is discovered and engaged
- each side uses tools
- outcome merges

### Scenario C — Closed-loop adjustment
Best for:
- ongoing service
- feedback
- re-selection / parameter adjustment

Example:
- service is running
- QoE degrades
- agent receives tool / UE / network feedback
- tool parameters or selected tools are updated

---

## 21. Relationship rules the product should teach

The UI should make these truths obvious:

### Agent != Tool
Agents reason and coordinate. Tools execute bounded capabilities.

### NF != Tool
NFs host tools. The tool is the callable capability.

### ARF != TRF
ARF is for agents. TRF is for tools.

### Planning Agent != all other agents
Planning Agent leads and coordinates. Specialized agents execute domain-specific subtasks.

### Request != Intent != Plan
These are different abstraction levels:
- request is what arrives
- intent is interpreted meaning
- plan is the ordered execution strategy

### Tool invocation != full procedure graph
The UI should not draw the entire 3GPP flow. It should show modular capability invocation.

---

## 22. What to avoid

Do not build:
- a full CN topology dashboard
- a giant always-on message flow graph
- a standards-accurate signaling simulator
- a UI dominated by NF boxes and arrows
- a product where repositories feel like passive storage only
- a product where tools look like anonymous API calls with no semantics

Do not let the architecture collapse into:
- “Planning Agent calls random boxes”
- “everything is a single graph”
- “skills, tools, and agents all look identical”

---

## 23. MVP deliverable expectations for Codex

The first useful implementation should include:

### A. Main concept graph
- Planning Agent centered
- UE + SRF
- ARF + TRF
- Connection / Data / Computing Agents
- bottom tool shelf grouped by NF host

### B. Right-side inspector
Supports:
- request details
- intent details
- agent profiles
- tool definitions
- NF ownership

### C. View mode switcher
At least:
- Concept
- Collaboration
- Tool
- Closed Loop

### D. State-driven highlighting
- selected
- active
- candidate
- delegated
- invoked
- feedback received
- completed

### E. Scenario data
Ship with 2–3 curated scenarios that demonstrate:
- simple planning + tool selection
- multi-agent collaboration
- closed-loop adjustment

---

## 24. Suggested implementation philosophy

Build the UI as a **narrative architecture product**, not a drawing canvas.

The success condition is not:
- maximum accuracy of telecom call flow

The success condition is:
- a viewer understands the roles and relationships after a few clicks

---

## 25. Acceptance criteria

The first version is successful if a reviewer can immediately answer:

1. What is a NW-Agent?
2. What is the difference between Planning Agent and specialized agents?
3. What is the difference between ARF and TRF?
4. What is a tool?
5. How is a tool different from an NF?
6. How does a request become a plan?
7. How does a plan become tool invocations?
8. How does agent collaboration work?
9. How can the system react to feedback in a closed loop?

If these answers are visually obvious, the implementation is on the right path.

---

## 26. Final direction statement for Codex

Build a **relationship-first, concept-first React Flow UI** based on **S2-2602109**.

Do not treat this as a full network topology product.

Center the experience on:
- **Planning Agent**
- **ARF / TRF**
- **specialized NW-Agents**
- **NF-hosted tools**
- **semi-structured intent**
- **closed-loop feedback**

Preserve the earlier elegant idea of showing layered abstraction, but make the source-of-truth architecture follow the **NW-Agent / TRF / ARF / tool modularization** model from the Huawei proposal.
