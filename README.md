# ProjectFlow
## Manage your academic projects seamlessly

A web platform that helps students manage and monitor project progress and record feedback from teachers. Team leads can create projects, break them down into tasks, and assign responsibilities to individual members while members can update their task progress.

## Quick Start

Requirements
- Node.js 20+ is recommended (some dependencies request Node >=20). Node 18 may work but can show warnings.
- npm (comes with Node) or pnpm.

Install and run (development)
1. Install dependencies:

```bash
cd /home/neo/codes/ProjectFlow
npm install
```

2. Start the dev server:

```bash
npm run dev
```

Open: http://localhost:5173/

Build for production

```bash
npm run build
# production build output is in the `dist/` folder
```

Notes
- If you see engine warnings during `npm install` (for example, packages requesting Node >=20), upgrade your Node version to 20+ to remove the warnings.
- The project uses Vite and Tailwind CSS. If you prefer `pnpm`, you can run `pnpm install` instead of `npm install`.

Files of interest
- `src/main.tsx` — app entry.
- `vite.config.ts` — vite config.
- `src/app` — UI components and pages.

Troubleshooting
- If dev server fails to start, run `rm -rf node_modules package-lock.json` and reinstall.
- Run `npm audit` and `npm audit fix` to address vulnerabilities.

If you want, I can:
- Run the dev server now (already started in this session).
- Upgrade package versions or switch to `pnpm`/`node 20` instructions.
