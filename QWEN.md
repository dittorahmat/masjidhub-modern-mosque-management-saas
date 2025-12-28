# MasjidHub - Modern Mosque Management SaaS

## Project Overview

MasjidHub is a comprehensive, multi-tenant SaaS platform designed to modernize mosque operations, finance, inventory, and community events with role-based access control. The platform is built using React for the frontend and Cloudflare Workers with Durable Objects for the backend, providing a scalable solution for managing multiple mosques from a single platform.

### Key Features
- **Multi-tenant Architecture**: Each mosque (tenant) has isolated data and access via unique subdomains
- **Financial Management**: Comprehensive finance tracking with income and expense management
- **ZIS Management**: Zakat, Infaq, and Shadaqah tracking system with payment processing and reporting
- **Mustahik Management**: Recipient management for ZIS distribution
- **Inventory Management**: Track mosque assets and resources
- **Community Events**: Event planning and registration system
- **Forum System**: Community discussion platform with moderation tools
- **User Management**: Banning and role management functionality
- **Payment Processing**: Integrated payment gateway for ZIS transactions
- **Reporting System**: Comprehensive ZIS and financial reporting
- **Role-based Access Control**: Different permissions for Super Admin, DKM Admin, Amil, Ustadz, and Jamaah

### Technology Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Cloudflare Workers, Hono framework, Durable Objects
- **State Management**: Zustand v5
- **UI Components**: shadcn/ui with Radix UI primitives
- **API Client**: TanStack Query for data fetching
- **Styling**: Tailwind CSS with custom theme

## Building and Running

### Prerequisites
- Bun (JavaScript runtime)

### Setup Commands
```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Preview production build locally
bun run preview

# Deploy to Cloudflare
bun run deploy

# Generate Cloudflare types
bun run cf-typegen

# Lint code
bun run lint
```

### Architecture Details

#### Frontend Structure
```
src/
├── components/          # UI components and primitives
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and API client
├── pages/              # Route components
│   ├── auth/           # Authentication flows
│   ├── dashboard/      # Tenant-specific modules
│   └── super-admin/    # Global platform management
└── main.tsx            # Application entry point
```

#### Backend Structure
```
worker/
├── index.ts             # Hono Worker entry point
├── user-routes.ts       # API route definitions
├── entities.ts          # Business logic for Tenant, User, Transaction, etc.
└── core-utils.ts        # Durable Object persistence & Entity abstractions
```

#### Shared Components
```
shared/
├── types.ts            # Shared TypeScript interfaces
└── mock-data.ts        # Initial seed data for development
```

### Multi-Tenancy Implementation
- **Isolation**: Each mosque (tenant) is identified by a unique `slug`
- **Resolution**: The `DashboardLayout` resolves the tenant context from the URL slug via the API
- **RBAC**: Role-Based Access Control (Super Admin, DKM Admin, Amil, Ustadz, Jamaah) is enforced both in the UI and API

### API Endpoints
The backend provides comprehensive REST APIs for all functionality:

#### Authentication
- `POST /api/auth/register` - Register a new mosque
- `POST /api/auth/login` - User login

#### Super Admin
- `GET /api/super/summary` - Platform summary statistics
- `GET /api/super/tenants` - List all tenants
- `GET /api/super/users` - List all users
- `POST /api/super/tenants/:id/approve` - Approve tenant registration

#### Tenant-Specific Endpoints
- `GET /api/tenants/:slug` - Get tenant information
- `PUT /api/:slug/settings` - Update tenant settings
- `GET/POST /api/:slug/finance` - Financial transactions
- `GET/POST /api/:slug/zis` - ZIS transactions
- `POST /api/:slug/zis/:id/process-payment` - Process ZIS payment
- `GET /api/:slug/zis/report` - ZIS reporting
- `GET/POST /api/:slug/mustahik` - Mustahik (recipient) management
- `GET/POST /api/:slug/inventory` - Inventory management
- `GET/POST/PUT /api/:slug/events` - Event management (with speaker, capacity, and minimum donation fields)
- `POST /api/:slug/events/:id/register` - Event registration
- `GET /api/:slug/members` - Member management
- `GET/POST/DELETE /api/:slug/forum` - Forum posts
- `GET /api/:slug/users` - User management
- `POST /api/:slug/users/:id/ban` - Ban user
- `POST /api/:slug/users/:id/unban` - Unban user
- `GET/POST/PUT /api/:slug/prayer-schedules` - Prayer schedule management (for daily prayers and imam/khatib assignments)

## Development Conventions

### Coding Standards
- TypeScript is used throughout the project for type safety
- React components follow modern hooks-based patterns
- Tailwind CSS is used for styling with a consistent design system
- Component organization follows the shadcn/ui patterns

### State Management
- Zustand is used for global state management with primitive selectors
- TanStack Query handles server state and caching
- Immer is used for immutable state updates

### File Organization
- Components are organized by feature in the `src/components/ui` directory
- Pages are organized by route in the `src/pages` directory
- Shared utilities and types are in the `src/lib` and `shared` directories
- API routes are defined in the `worker` directory

### Testing
- While no explicit test files were found in the initial exploration, the project structure suggests a component-based testing approach would be appropriate
- API endpoints should be tested for proper tenant isolation and RBAC enforcement

## Deployment

The application is designed for deployment on Cloudflare Workers:
- Frontend is built as a static site
- Backend runs as Cloudflare Workers with Durable Objects for state persistence
- Wrangler configuration handles deployment and asset management
- Assets are configured for single-page application routing with fallback handling

## Progressive Web App (PWA)

The application includes PWA capabilities:
- Mobile-ready with manifest.json configuration
- Installable to home screens for app-like experience
- Responsive design for various device sizes

## Recent Updates

### Latest Fixes
- **Fixed missing MustahikEntity import**: Resolved 500 Internal Server Error in login API endpoint by adding the missing MustahikEntity import to user-routes.ts