# MasjidHub Domain Glossary

Canonical vocabulary and ubiquitous language for MasjidHub SaaS platform.

---

## 1. Core Platform & Tenancy

### Tenant
A distinct mosque organization identified by a unique `slug` (subdomain/path context, e.g. `/app/al-hikmah/`). All persistence, user roles, data records, and media belong strictly to a single Tenant context, except for Super Admin platform governance.

### Role & Access Level
MasjidHub enforces role-based personas:
* **Super Admin**: Platform-wide operator controlling tenant onboarding, subscriptions, and AI toggles.
* **DKM Admin**: Mosque executive/manager with full write-access to finance, assets, events, and public site settings.
* **Amil Zakat**: Specialized role focused on managing Asnaf categories, Mustahik records, and Zakat/Infaq distributions.
* **Ustadz**: Lecturer/preacher managing study sessions (kajian), khutbah schedules, and community forum replies.
* **Jamaah**: Mosque congregation member accessing public schedules, donations, presensi attendance, and event registration.

---

## 2. Mobile Responsive Architecture & UI Vocabulary

### Responsive App Shell
The adaptive layout container that detects viewport width. On desktop (`>= 768px`), it renders the full collapsible sidebar; on mobile (`< 768px`), it renders a compact top-bar with quick actions, off-canvas drawer navigation, and a persistent Bottom Navigation Bar.

### Bottom Navigation Bar (Tab Bar)
A fixed mobile navigation container docked at the bottom of the viewport (`< 768px`) positioned within thumb-reach zones. It hosts 4 to 5 primary destinations (e.g. Ringkasan, Keuangan, ZIS, Kegiatan, Menu Lainnya).

### Off-Canvas Drawer (Sheet)
A sliding panel triggered either from the sidebar toggle button or the "Menu Lainnya" bottom-nav item, exposing the complete hierarchical module navigation without crowding the mobile screen.

### Responsive Data View (Table-to-Card Pattern)
A dual-mode presentation pattern for tabular data:
* **Desktop/Tablet (`>= 768px`)**: Dense relational table with multi-column headers, sorting, and inline row actions.
* **Mobile (`< 768px`)**: Stacked cards or swipeable list items highlighting primary identifiers, monetary badges, and quick-action sheets.

### Adaptive Modal (Dialog vs Bottom Sheet)
A polymorphic modal container:
* **Desktop (`>= 768px`)**: Centered modal window (`Dialog`).
* **Mobile (`< 768px`)**: Swipe-to-dismiss bottom sheet drawer anchored to viewport bottom with keyboard-safe viewport boundaries (`pb-safe`).

### Role-Aware Bottom Navigation
A dynamic bottom navigation system where the 4 primary tabs automatically adapt according to the authenticated actor's role (e.g. Amil Zakat sees Mustahik & Distribusi; DKM Admin sees Kas & Kegiatan) anchored by a 5th persistent "Menu Lainnya" drawer trigger.

### Mobile Floating Action Button (FAB)
An elevated primary mutation button floating in the lower-right thumb zone (docked directly above the Bottom Navigation Bar) for high-frequency actions such as recording financial transactions, collecting ZIS, or launching attendance scanners.

### Mobile QR Camera Viewport
A mobile-optimized fullscreen scanner modal leveraging device rear cameras (`facingMode: environment`) with a target alignment frame and torch toggle for on-site congregational attendance and donation verification.

### Kiosk Mobile Preview
A proportionate responsive scaling wrapper (`transform: scale(...)` or aspect-ratio locked container) enabling mosque staff to inspect and monitor the masjid TV digital signage display directly on their smartphones without layout distortion.

### Touch Target Standard
All interactive elements (buttons, inputs, dropdown toggles, bottom bar icons) must maintain a minimum bounding box of 44x44px to satisfy mobile ergonomics.
