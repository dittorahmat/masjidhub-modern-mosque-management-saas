# MasjidHub Demo Testing Guide

This guide provides instructions for testing the MasjidHub platform with different user roles using the demo login system.

## Demo Login System

The MasjidHub platform includes a comprehensive demo login system that allows you to test the platform with different user roles without creating new accounts.

### Available Demo Accounts

| Role | Email | Description |
|------|-------|-------------|
| Super Admin Platform | `admin@masjidhub.com` | Platform-level administrator with access to all mosques and system settings |
| DKM Admin | `demo-dkm@masjid.org` | Mosque administrator with full access to mosque operations |
| Amil Zakat | `demo-amil@masjid.org` | Zakat officer with access to ZIS management features |
| Ustadz | `demo-ustadz@masjid.org` | Religious teacher with access to educational and event features |
| Jamaah | `demo-jamaah@masjid.org` | Regular mosque member with basic access |

### Known Issue

**Important Note**: The demo login system is currently experiencing a 500 Internal Server Error when attempting to log in with demo accounts. This issue is under investigation. The frontend implementation of role selection is complete and functional, but there appears to be a backend issue preventing successful authentication.

We are working to resolve this issue which may be related to:
- Durable Objects persistence constraints
- User creation logic in the backend
- Other backend infrastructure limitations

Please check back for updates on this issue.

## How to Access Demo Mode

1. Navigate to the login page: `http://localhost:5173/login`
2. Add `?demo=true` to the URL to enable demo mode: `http://localhost:5173/login?demo=true`
3. In demo mode, you'll see a dropdown to select the role you want to test
4. The email field will automatically populate with the appropriate demo email for the selected role
5. Click "Masuk Sekarang" (Login Now) to access the platform

## Testing Different Roles

### Super Admin Platform (`admin@masjidhub.com`)
- Access: Platform-wide administrative functions
- Features: View all mosques, manage tenant approvals, view platform statistics
- Dashboard: `/super-admin/dashboard`

### DKM Admin (`demo-dkm@masjid.org`)
- Access: Full mosque management for assigned mosque
- Features: All mosque features including finance, inventory, events, ZIS, etc.
- Dashboard: `/app/al-hikmah/dashboard`

### Amil Zakat (`demo-amil@masjid.org`)
- Access: ZIS management and reporting
- Features: ZIS transactions, mustahik management, ZIS reporting
- Dashboard: `/app/al-hikmah/dashboard`

### Ustadz (`demo-ustadz@masjid.org`)
- Access: Educational content and event management
- Features: Event management, forum participation, prayer schedule assignments
- Dashboard: `/app/al-hikmah/dashboard`

### Jamaah (`demo-jamaah@masjid.org`)
- Access: Basic mosque services
- Features: Event registration, ZIS donations, forum participation
- Dashboard: `/app/al-hikmah/dashboard`

## Feature Access Matrix

| Feature | Super Admin | DKM Admin | Amil Zakat | Ustadz | Jamaah |
|---------|-------------|-----------|------------|--------|--------|
| Mosque Management | ✅ | ✅ | ❌ | ❌ | ❌ |
| Financial Management | ✅ | ✅ | ❌ | ❌ | ❌ |
| ZIS Management | ✅ | ✅ | ✅ | ❌ | ❌ |
| Mustahik Management | ✅ | ✅ | ✅ | ❌ | ❌ |
| Inventory Management | ✅ | ✅ | ❌ | ❌ | ❌ |
| Event Management | ✅ | ✅ | ❌ | ✅ | ❌ |
| Forum Access | ✅ | ✅ | ✅ | ✅ | ✅ |
| Prayer Schedules | ✅ | ✅ | ❌ | ✅ | ✅ |
| User Management | ✅ | ✅ | ❌ | ❌ | ❌ |
| Platform Statistics | ✅ | ❌ | ❌ | ❌ | ❌ |
| Tenant Approvals | ✅ | ❌ | ❌ | ❌ | ❌ |

## Testing Scenarios

### Scenario 1: Full Mosque Operations (DKM Admin)
1. Login as DKM Admin (`demo-dkm@masjid.org`)
2. Test financial management (income/expense tracking)
3. Manage inventory items
4. Create and manage events
5. Handle ZIS transactions
6. Moderate forum posts

### Scenario 2: ZIS Operations (Amil Zakat)
1. Login as Amil Zakat (`demo-amil@masjid.org`)
2. Process ZIS transactions
3. Manage mustahik (recipients)
4. Generate ZIS reports
5. Process ZIS payments

### Scenario 3: Educational Content (Ustadz)
1. Login as Ustadz (`demo-ustadz@masjid.org`)
2. Create and manage events
3. Participate in forum discussions
4. View prayer schedules

### Scenario 4: Community Engagement (Jamaah)
1. Login as Jamaah (`demo-jamaah@masjid.org`)
2. Register for events
3. Make ZIS donations
4. Participate in forum discussions
5. View mosque information

### Scenario 5: Platform Management (Super Admin)
1. Login as Super Admin (`admin@masjidhub.com`)
2. Access super admin dashboard
3. View all mosques
4. Approve new mosque registrations
5. View platform-wide statistics

## Default Mosque Access

All demo users (except Super Admin) have access to the default demo mosque:
- **Name**: Masjid Al-Hikmah
- **Slug**: `al-hikmah`
- **URL**: `/app/al-hikmah/dashboard`

## Troubleshooting

### Issue: Can't access certain features
- **Solution**: Ensure you're logged in with the correct role that has permissions for the feature

### Issue: Demo mode not working
- **Solution**: Make sure the URL includes `?demo=true` parameter

### Issue: Email field not updating after role selection
- **Solution**: Refresh the page and try again

## Notes

- Demo accounts are created dynamically on login
- All demo users have access to the same default mosque (Al-Hikmah) for consistency
- Changes made in demo mode are temporary and reset on server restart
- Password field is hidden in demo mode as authentication is based on email only