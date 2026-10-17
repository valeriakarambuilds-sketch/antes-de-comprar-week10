# Implementation prompt — Week 10

Build "Antes de comprar" following docs/PACKET.md.

Interface:
- Responsive Spanish interface based on docs/mockup.png.
- Form for budget, intended use and required protection.
- Product price, shipping, return costs and quoted policy.
- Evidence summary with sources, dates and unknowns.
- Copyable clarification questions.
- Buyer options: ask, wait or continue independently.

Acceptance criteria:
- Calculate MXN totals with deterministic code.
- Distinguish zero costs from missing costs.
- Never infer coverage from a return period alone.
- Invalidate the result after inputs change.
- Validate inputs and render user text safely.
- Never order products or send messages automatically.
- Keep API keys server-side and out of Git.
- Clearly label simulated AI until real integration works.

Delivery:
- Build and test small features in separate meaningful commits.
- Deploy a working version, fix a documented bug and redeploy.
- Run the screenshot persona test and correct the worst confusion.
