# Cloudflare Workers Full-Stack SaaS Template

[cloudflarebutton]

A production-ready full-stack template for building SaaS applications on Cloudflare Workers. Features a React frontend with Tailwind CSS and shadcn/ui, powered by a Hono backend with Durable Objects for multi-tenant stateful entities (e.g., Users, ChatBoards). Includes indexed listing, CRUD APIs, seed data, and error handling out of the box.

## ✨ Key Features

- **Durable Objects for Entities**: One DO instance per entity with automatic indexing for efficient listing/pagination.
- **Type-Safe APIs**: Shared TypeScript types between frontend and worker (`@shared/*`).
- **React + Vite Frontend**: Modern UI with Tailwind, shadcn/ui components, Tanstack Query, and React Router.
- **Hono Backend**: Fast, lightweight routing with CORS and logging.
- **Seed Data**: Mock users/chats/messages auto-populate on first request.
- **Pagination & CRUD**: Full support for list/create/read/update/delete operations.
- **Dark Mode & Responsive**: Built-in theme toggle and mobile-friendly design.
- **Error Reporting**: Client-side error capture and logging to worker console.
- **Production-Ready**: TypeScript, ESLint, optimized builds, and Cloudflare deployment.

## 🛠️ Tech Stack

| Category | Technologies |
|----------|--------------|
| **Backend** | Cloudflare Workers, Hono, Durable Objects |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| **Data** | Durable Objects (SQLite-backed), Indexed Entities |
| **State** | Tanstack Query, Zustand, Immer |
| **UI/UX** | Lucide React, Framer Motion, Sonner (Toasts) |
| **Utils** | Zod (Validation), React Hook Form, Date-fns |
| **Dev Tools** | Bun, ESLint, Wrangler |

## 🚀 Quick Start

1. **Clone & Install**:
   ```bash
   git clone <your-repo-url>
   cd masjidhub-saas-jtbg-y-udxepva-ni4x4t
   bun install
   ```

2. **Development**:
   ```bash
   bun run dev
   ```
   Opens at `http://localhost:3000` (or `$PORT`). Frontend dev server proxies `/api/*` to worker.

3. **Build & Preview**:
   ```bash
   bun run build
   bun run preview
   ```

## 💻 Development Workflow

- **Frontend**: Edit `src/` files. Hot reload via Vite.
- **Backend**: Add routes to `worker/user-routes.ts`. Custom entities in `worker/entities.ts`.
- **Shared Types**: Define in `shared/types.ts` and `shared/mock-data.ts`.
- **Entities**: Extend `IndexedEntity` from `worker/core-utils.ts` for auto-indexing/CRUD.
- **Seeding**: Call `Entity.ensureSeed(env)` in routes.
- **Type Generation**: `bun run cf-typegen` after `wrangler types`.
- **Linting**: `bun run lint`.

### API Usage Examples

All APIs under `/api/*`. Returns `{ success: boolean, data?: T, error?: string }`.

```bash
# List users (paginated)
curl "http://localhost:8787/api/users?limit=10"

# Create user
curl -X POST http://localhost:8787/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe"}'

# List chats
curl "http://localhost:8787/api/chats"

# Create chat
curl -X POST http://localhost:8787/api/chats \
  -H "Content-Type: application/json" \
  -d '{"title": "My Chat"}'

# Send message
curl -X POST http://localhost:8787/api/chats/c1/messages \
  -H "Content-Type: application/json" \
  -d '{"userId": "u1", "text": "Hello!"}'
```

Frontend uses `api(path)` helper from `src/lib/api-client.ts` with Tanstack Query.

## ☁️ Deployment to Cloudflare

1. **Login**:
   ```bash
   bunx wrangler login
   ```

2. **Configure** (`wrangler.jsonc`):
   - Update `name` to your project name.
   - Set `account_id` if needed.

3. **Deploy**:
   ```bash
   bun run deploy
   ```
   Deploys worker + static assets to Cloudflare Pages/Workers Sites.

[cloudflarebutton]

**Pro Tip**: Use Cloudflare's Git integration for CI/CD or `wrangler pages deploy` for assets.

## 📚 Project Structure

```
├── shared/          # Shared TS types & mock data
├── src/             # React frontend (Vite)
│   ├── components/  # shadcn/ui + custom (sidebar, layout)
│   ├── hooks/       # Custom hooks (theme, mobile)
│   └── pages/       # Router pages
├── worker/          # Hono + Durable Objects backend
│   ├── core-utils.ts # Entity base classes (DO NOT MODIFY)
│   ├── entities.ts   # User/Chat entities
│   └── user-routes.ts # Custom API routes
├── tsconfig*.json   # TypeScript configs (app/worker/node)
└── wrangler.jsonc   # DO bindings & migrations
```

## 🤝 Contributing

1. Fork & clone.
2. `bun install`.
3. Create feature branch: `git checkout -b feature/xyz`.
4. Commit: `git commit -m "feat: add xyz"`.
5. Push & PR.

## ⚠️ Important Notes

- **DO NOT MODIFY**: `worker/core-utils.ts`, `worker/index.ts`, `wrangler.jsonc`.
- **Customization**: Edit `HomePage.tsx` for your app UI, add routes/entities as needed.
- **Limits**: Durable Objects have storage limits; scale horizontally with namespaces.
- **Support**: Cloudflare Workers docs: https://developers.cloudflare.com/workers/

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.