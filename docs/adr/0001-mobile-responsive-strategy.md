# 1. Mobile-First Experience and Responsive Navigation Strategy

Date: 2026-10-30

## Status

Accepted

## Context

MasjidHub serves diverse mosque operational roles: DKM administrators and Amil Zakat managing cash flow, donation receipts, and inventory on-site; Ustadz reviewing schedules; and Jamaah registering for events or scanning QR presensi directly from smartphones.

Previously, the desktop-oriented layout relied on standard collapsible sidebars, wide relational data tables with dense columns, and centered modal dialogs. In mobile viewports (< 768px):
1. Sidebars blocked primary content or required floating toggles that collided with action headers.
2. Tables required awkward horizontal scrolling, obscuring monetary values and action buttons.
3. Centered modal dialogs collided with mobile virtual keyboards and cut off submit actions.
4. Navigation required multi-tap drawer interactions instead of natural one-handed thumb interaction.

## Decision

We adopt a comprehensive, system-wide mobile responsive architecture across all platform surfaces (Public Portal, Tenant Dashboard, and Super Admin):

1. **Bottom Navigation + Drawer Sheet Integration**:
   - For viewports `< 768px`, provide a persistent, thumb-friendly `Bottom Navigation Bar` for top frequent destinations (Dashboard, Keuangan, ZIS, Kegiatan, Menu Lainnya).
   - Role-Aware: The 4 core tabs adapt automatically to the authenticated user role (e.g. Amil Zakat sees Mustahik & Distribusi; DKM Admin sees Kas & Kegiatan), with the 5th tab consistently triggering the "Menu Lainnya" Off-Canvas Sheet drawer.
2. **Table-to-Card Responsive Pattern**:
   - Replace raw horizontal scroll tables on mobile with stacked responsive cards/list view.
   - Cards present high-signal data points (title, category badge, amount, date) with a tap/action menu to open full detail drawers.
3. **Adaptive Modals (Dialog to Drawer)**:
   - Use adaptive dialog wrappers that render standard centered `Dialog` on desktop (`>= 768px`) and a swipe-to-dismiss `Drawer` (Bottom Sheet) on mobile (`< 768px`).
   - Include safe-area padding (`pb-safe`) and keyboard-aware scroll handling.
4. **Mobile Floating Action Button (FAB)**:
   - Elevate primary mutation actions (Add Transaction, Record ZIS, Scan QR) into a thumb-zone FAB floating above the Bottom Navigation Bar.
5. **Mobile QR Scanner & Kiosk Preview**:
   - Implement fullscreen rear-facing camera overlay with target guide for QR presensi and donations.
   - Deliver aspect-ratio locked CSS auto-fit scaling for Kiosk mode preview on mobile screens.
6. **Touch Target Hygiene**:
   - Enforce a minimum 44x44px touch target area for all interactive buttons, action icon buttons, and navigation tabs.

## Consequences

### Positive
- High ergonomics for mosque caretakers and amil recording donations or attendance on smartphones.
- Zero horizontal overflow or cut-off content on small mobile devices (320px - 430px screens).
- Seamless user experience for Jamaah accessing public portal features on mobile browsers.

### Negative / Trade-offs
- Additional component abstraction for responsive data display (requires building card templates alongside tables).
- Need to ensure Bottom Navigation accounts for mobile browser bottom chrome and home bar indicators (`env(safe-area-inset-bottom)`).
