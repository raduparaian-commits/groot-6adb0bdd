# Agents
- Prep flow types, options and tracker storage live in src/lib/prep.ts so every screen shares one model.
- AI calls run in server functions only (src/lib/prep.functions.ts using ai.server.ts).
- Draft flow state passes between screens via sessionStorage; the tracker persists in localStorage until accounts are added.
