# 🕌 MasjidHub SaaS
**Digital Backbone for Modern Mosque Communities**
MasjidHub is a comprehensive, multi-tenant SaaS platform designed to modernize mosque operations, enhance financial transparency, and bridge the gap between pengurus (DKM) and jamaah. Built with a human-centered, illustrative design aesthetic, it makes technology approachable for religious communities.
---
## 🚀 Quickstart
### Prerequisites
- [Bun](https://bun.sh) runtime installed.
### Installation & Development
```bash
# Clone the repository
git clone <repo-url>
cd masjidhub-saas
# Install dependencies
bun install
# Start local development server
bun dev
```
### Authentication & Demo
- **Super Admin Credentials**: `admin@masjidhub.com` / `password`
- **Mosque Registration**: Visit `/register` to create a new mosque tenant and claim your unique URL slug.
- **Demo Mosque**: Access `masjidhub.com/app/al-hikmah` to view a pre-populated DKM dashboard.
---
## ✨ Features
- **Multi-Tenant Architecture**: Each mosque operates in an isolated environment with its own subdomain-style slug.
- **Role-Based Access Control (RBAC)**: Defined roles for Super Admin, DKM Admin, Amil Zakat, Ustadz, and Jamaah.
- **Finance Module**: Double-entry bookkeeping for tracking Infaq, Shadaqah, and operational expenses with automated reports.
- **ZIS Management**: Specialized module for Zakat Fitrah, Zakat Maal, and Fidyah collection and distribution.
- **Inventory Tracker**: Digital catalog for mosque assets, condition monitoring, and maintenance logs.
- **Community Forum**: Secure space for religious discussions, kajian announcements, and community polls.
- **Public Portal**: Professional landing page for each mosque featuring event registration and location details.
---
## 🛠 Architecture
### Tech Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Shadcn UI.
- **State Management**: Zustand (Primitive Selectors for Performance).
- **Backend**: Hono (Cloudflare Workers).
- **Storage**: Cloudflare Durable Objects (strongly consistent, per-tenant storage).
- **Icons & Visuals**: Lucide React, Framer Motion, Recharts.
### Project Structure
- `src/pages/`: View implementations organized by domain (auth, dashboard, super-admin).
- `src/lib/store.ts`: Centralized Zustand store with stable primitive hooks.
- `worker/entities.ts`: Business logic and data models for Durable Object persistence.
- `shared/types.ts`: Universal TypeScript interfaces for API and data integrity.
---
## �� Deployment
The platform is designed for serverless deployment on Cloudflare.
```bash
# Build and deploy to Cloudflare Workers
bun run deploy
```
*Note: For production multi-tenancy, ensure a wildcard custom domain is configured in Cloudflare to support dynamic slug resolution.*
---
## 📜 License
Built with ❤�� for the Ummah.