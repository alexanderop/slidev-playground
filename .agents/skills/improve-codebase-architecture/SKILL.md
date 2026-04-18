---
name: improve-codebase-architecture
description: Explore a codebase to find opportunities for architectural improvement, focusing on making the codebase more testable by deepening shallow modules. Use when user wants to improve architecture, find refactoring opportunities, consolidate tightly-coupled modules, or make a codebase more AI-navigable.
---

# Improve Codebase Architecture

Explore a codebase like an AI would, surface architectural friction, discover opportunities for realistic integration testing, and propose module-deepening refactors as local plan folders.

A **deep module** (John Ousterhout, "A Philosophy of Software Design") has a small interface hiding a large implementation. Deep modules are more AI-navigable and — crucially — they expose a seam where a single realistic integration test can cover what previously took a dozen brittle unit tests.

## Testing stance

Follow Kent C. Dodds' testing trophy: **"Write tests. Not too many. Mostly integration."**

- Unit tests on shallow, extracted helpers are a smell, not an asset. They test implementation detail, drift from real usage, and pass while the real bug lives in the wiring between modules.
- Confidence comes from tests that resemble how the software is actually used — multiple real modules running together, real data flowing through real types, asserting on observable outcomes.
- When you deepen a module, the goal isn't to write more tests inside it. The goal is to collapse a pile of unit tests into one realistic integration test at the new boundary.
- Mock only what you can't control (network, time, third-party APIs). Never mock your own code to make it testable — that's a sign the module is too shallow.

This stance drives every step below.

## Process

### 1. Explore the codebase

Use the Agent tool with subagent_type=Explore to navigate the codebase naturally. Do NOT follow rigid heuristics — explore organically and note where you experience friction:

- Where does understanding one concept require bouncing between many small files?
- Where are modules so shallow that the interface is nearly as complex as the implementation?
- Where have pure functions been extracted _just to make them unit-testable_, while the real bugs hide in how they're called?
- Where do the existing unit tests pass but the feature still breaks because the seams between modules aren't exercised?
- Where do tightly-coupled modules create integration risk that no current test would catch?
- Which parts of the codebase are untested, or hard to test realistically?

The friction you encounter IS the signal. Pay special attention to test files that assert on internal shapes or mock same-package collaborators — those tests are what we want to replace.

### 2. Present candidates

Present a numbered list of deepening opportunities. For each candidate, show:

- **Cluster**: Which modules/concepts are involved
- **Why they're coupled**: Shared types, call patterns, co-ownership of a concept
- **Dependency category**: See [REFERENCE.md](REFERENCE.md) for the four categories
- **Integration test payoff**: What realistic scenario would become testable at the new boundary, and which brittle unit tests it would retire

Do NOT propose interfaces yet. Ask the user: "Which of these would you like to explore?"

### 3. User picks a candidate

### 4. Frame the problem space

Before spawning sub-agents, write a user-facing explanation of the problem space for the chosen candidate:

- The constraints any new interface would need to satisfy
- The dependencies it would need to rely on
- The realistic scenario the integration test at this boundary should cover
- A rough illustrative code sketch to make the constraints concrete — this is not a proposal, just a way to ground the constraints

Show this to the user, then immediately proceed to Step 5. The user reads and thinks about the problem while the sub-agents work in parallel.

### 5. Design multiple interfaces

Spawn 3+ sub-agents in parallel using the Agent tool. Each must produce a **radically different** interface for the deepened module.

Prompt each sub-agent with a separate technical brief (file paths, coupling details, dependency category, what's being hidden, what the integration test should assert). This brief is independent of the user-facing explanation in Step 4. Give each agent a different design constraint:

- Agent 1: "Minimize the interface — aim for 1-3 entry points max"
- Agent 2: "Maximize flexibility — support many use cases and extension"
- Agent 3: "Optimize for the most common caller — make the default case trivial"
- Agent 4 (if applicable): "Design around the ports & adapters pattern for cross-boundary dependencies"

Each sub-agent outputs:

1. Interface signature (types, methods, params)
2. Usage example showing how callers use it
3. What complexity it hides internally
4. Dependency strategy (how deps are handled — see [REFERENCE.md](REFERENCE.md))
5. **Integration test sketch**: a single realistic test at this boundary, showing inputs, observable outputs, and which existing tests it replaces
6. Trade-offs

Present designs sequentially, then compare them in prose.

After comparing, give your own recommendation: which design you think is strongest and why. Weigh how cleanly each one supports a realistic integration test at the boundary — if a design needs mocks of its own collaborators to be tested, that's a strike against it. If elements from different designs would combine well, propose a hybrid. Be opinionated — the user wants a strong read, not just a menu.

### 6. User picks an interface (or accepts recommendation)

### 7. Save plan to folder

Save the refactor RFC to `plans/<slug>/plan.md` at the repo root, where `<slug>` is a short kebab-case name for the candidate (e.g. `deepen-frontmatter-binding`). Create the folder if it doesn't exist. Use the template in [REFERENCE.md](REFERENCE.md). Do NOT ask the user to review before saving — just write the file and share the path.
