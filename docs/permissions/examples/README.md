# Examples

This folder contains demo and integration examples for local development and documentation.

## Purpose

- Keep package core code isolated in `src/permissions`.
- Avoid coupling demo files to library build outputs.
- Provide runnable references for shell + MFE and hierarchical scenarios.

## Included files

- `example.tsx`: basic RBAC/ABAC example app.
- `hierarchicalExample.tsx`: hierarchical affiliations example.
- `poc.tsx`: proof-of-concept screen.
- `shell-example.tsx`: shell-side context and provider flow.
- `shell-chain-example.tsx`: chained MFE composition example.
- `mfe1.tsx`, `mfe2.tsx`, `mfe3.tsx`: small MFE components.
- `mfe-examples.tsx`: full MFE usage examples.

## Notes

These files are intentionally excluded from package type-check/build in `tsconfig.json`.
