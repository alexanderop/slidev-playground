# Reference

## Dependency Categories

When assessing a candidate for deepening, classify its dependencies. The category determines how you'll keep the integration test at the new boundary realistic.

### 1. In-process

Pure computation, in-memory state, no I/O. Always deepenable — merge the modules and test them together through the real interface with real inputs. No mocks.

### 2. Local-substitutable

Dependencies that have local test stand-ins (e.g., PGLite for Postgres, in-memory filesystem, browser DOM via Playwright). Deepenable if the test substitute exists. The integration test runs the real module against the local stand-in — still a realistic end-to-end exercise of the module's behavior.

### 3. Remote but owned (Ports & Adapters)

Your own services across a network boundary (microservices, internal APIs). Define a port (interface) at the module boundary. The deep module owns the logic; the transport is injected. Integration tests use an in-memory adapter that honors the same contract as the HTTP/gRPC/queue adapter used in production. The test exercises real logic end-to-end — only the wire is swapped.

Recommendation shape: "Define a shared interface (port), implement an HTTP adapter for production and an in-memory adapter for testing, so the logic can be tested as one deep module through a realistic integration test even though it's deployed across a network boundary."

### 4. True external (Mock)

Third-party services (Stripe, Twilio, etc.) you don't control. Mock at the boundary — and only there. The deepened module takes the external dependency as an injected port; the integration test provides a mock implementation and still exercises the full module behavior around it. Do not mock anything inside the module.

## Testing Strategy

The core principle: **replace, don't layer.** Kent C. Dodds — "Write tests. Not too many. Mostly integration."

- Old unit tests on shallow modules are waste once a realistic integration test covers the boundary — delete them.
- Write one (or a small number of) integration test(s) at the deepened module's interface. Each one should look like a real caller using the module for real work.
- Assert on observable outcomes through the public interface, not internal state.
- Don't mock same-package collaborators. If you feel the need to, the module isn't deep enough yet.
- Tests should survive internal refactors — they describe behavior, not implementation.
- Fewer, more realistic tests > more, more isolated tests. Coverage of _scenarios_ beats coverage of _functions_.

### What a good integration test looks like at the new boundary

- Constructs the deep module with its real dependencies (or local stand-ins / in-memory adapters for categories 2–4).
- Drives it through a realistic end-to-end scenario a real caller would perform.
- Asserts on the observable output — return values, emitted events, rendered UI, persisted state — not on internal calls.
- Would still pass if you rewrote the module's internals tomorrow.

## Plan Template

<plan-template>

## Problem

Describe the architectural friction:

- Which modules are shallow and tightly coupled
- What integration risk exists in the seams between them
- Why this makes the codebase harder to navigate and maintain
- Which existing unit tests are giving false confidence (passing while the real wiring is untested)

## Proposed Interface

The chosen interface design:

- Interface signature (types, methods, params)
- Usage example showing how callers use it
- What complexity it hides internally

## Dependency Strategy

Which category applies and how dependencies are handled:

- **In-process**: merged directly
- **Local-substitutable**: tested with [specific stand-in]
- **Ports & adapters**: port definition, production adapter, test adapter
- **Mock**: mock boundary for external services

## Testing Strategy

- **New integration test(s) to write**: describe the realistic scenario(s) exercised at the boundary, and the observable outcomes asserted
- **Old tests to delete**: list the shallow module / unit tests that become redundant
- **Test environment needs**: any local stand-ins or in-memory adapters required
- **What is intentionally not tested**: anything dropped because the integration test already covers it

## Implementation Recommendations

Durable architectural guidance that is NOT coupled to current file paths:

- What the module should own (responsibilities)
- What it should hide (implementation details)
- What it should expose (the interface contract)
- How callers should migrate to the new interface

</plan-template>
