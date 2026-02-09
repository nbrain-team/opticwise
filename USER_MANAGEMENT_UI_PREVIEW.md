# User Management UI Preview

This document shows what Bill will see when using the new user management system.

---

## Header Navigation

**Before (all users see this):**
```
[Logo] Deals | Contacts | Organizations | Campaigns | Conferences | Sales Inbox | OWnet Agent     [Logout]
```

**After (NEW - with Profile link):**
```
[Logo] Deals | Contacts | Organizations | Campaigns | Conferences | Sales Inbox | OWnet Agent     [👤 Profile] [Logout]
```

Click "Profile" to access Settings page.

---

## Settings Page (`/settings`)

### Left Sidebar Navigation

```
┌─────────────────┐
│   SETTINGS      │
├─────────────────┤
│ ▶ Profile       │ ← Currently active
│ ▶ Team Members  │ ← Admin only
└─────────────────┘
```

### Profile Section (All Users)

```
┌──────────────────────────────────────────────────────┐
│  Profile Information                                  │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Name                                                 │
│  Bill                                                 │
│                                                       │
│  Email                                                │
│  bill@opticwise.com                                   │
│                                                       │
│  Role                                                 │
│  [ Administrator ]  ← Blue badge                      │
│                                                       │
│  Member Since                                         │
│  January 15, 2026                                     │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### Team Members Section (Admin Only)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Team Members                              [+ Add User]                   │
│  Manage users who have access to your organization                       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ User               │ Department  │ Role    │ Status   │ Joined      │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │ Bill               │ Not set     │ Admin   │ Active   │ Jan 15 2026 │ │
│  │ bill@opticwise.com │             │ [Blue]  │ [Green]  │ You         │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │ Sarah Johnson      │ Marketing   │ User    │ Active   │ Feb 1 2026  │ │
│  │ sarah@opticwise    │ [Gray]      │ [Green] │ [Green]  │ Deactivate  │ │
│  │ .com               │             │         │          │ Delete      │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │ Mike Chen          │ Finance     │ User    │ Inactive │ Feb 5 2026  │ │
│  │ mike@opticwise.com │ [Gray]      │ [Green] │ [Red]    │ Activate    │ │
│  │                    │             │         │          │ Delete      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Add User Modal

Click "+ Add User" to see this modal:

```
┌────────────────────────────────────────────────┐
│  Add New User                              [X] │
├────────────────────────────────────────────────┤
│                                                │
│  Email *                                       │
│  ┌──────────────────────────────────────────┐ │
│  │ user@opticwise.com                       │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Full Name *                                   │
│  ┌──────────────────────────────────────────┐ │
│  │ John Doe                                 │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Temporary Password *                          │
│  ┌──────────────────────────────────────────┐ │
│  │ ••••••••                                 │ │
│  └──────────────────────────────────────────┘ │
│  User will be asked to change this on first    │
│  login                                          │
│                                                │
│  Department (Optional)                         │
│  ┌──────────────────────────────────────────┐ │
│  │ Select department              ▼        │ │
│  └──────────────────────────────────────────┘ │
│  - Finance                                     │
│  - Marketing                                   │
│  - Operations                                  │
│  - Sales                                       │
│  - Engineering                                 │
│                                                │
│  Departments will be used for permissions in   │
│  a future update                               │
│                                                │
├────────────────────────────────────────────────┤
│                         [Cancel] [Add User]    │
└────────────────────────────────────────────────┘
```

---

## User Experience Flows

### Flow 1: Admin Adding New User

1. Bill logs in → sees "Profile" in header
2. Clicks "Profile" → goes to `/settings`
3. Sees "Team Members" section (admin only)
4. Clicks "+ Add User" → modal opens
5. Fills in:
   - Email: sarah@opticwise.com
   - Name: Sarah Johnson
   - Password: TempPass123
   - Department: Marketing
6. Clicks "Add User" → modal closes
7. New user appears in table with:
   - Green "Active" badge
   - Green "User" badge
   - Gray "Marketing" badge
8. Sarah can now log in with those credentials

### Flow 2: Admin Managing Users

**Deactivate User:**
1. Find user in table
2. Click "Deactivate" button
3. User's status changes to red "Inactive" badge
4. User cannot log in anymore
5. Button changes to "Activate"

**Reactivate User:**
1. Find inactive user
2. Click "Activate" button
3. User's status changes to green "Active"
4. User can log in again

**Delete User:**
1. Find user in table
2. Click "Delete" button
3. Confirmation dialog: "Are you sure? This cannot be undone."
4. Click "Confirm"
5. User removed from table
6. User's account permanently deleted

### Flow 3: Regular User View

1. Sarah logs in → sees "Profile" in header
2. Clicks "Profile" → goes to `/settings`
3. Sees ONLY "Profile Information" section
4. No "Team Members" section (not admin)
5. Can view her own:
   - Name: Sarah Johnson
   - Email: sarah@opticwise.com
   - Role: User (green badge)
   - Department: Marketing (gray badge)
   - Member Since: February 1, 2026

---

## Visual Design Elements

### Color Scheme (Matching Site)

**Primary:** #3B6B8F (Opticwise blue)
- Used for active states, primary buttons, selected items

**Success:** Green (#10B981)
- Active status badges
- User role badges

**Danger:** Red (#EF4444)
- Inactive status badges
- Delete buttons (on hover)

**Neutral:** Gray shades
- Department badges
- Borders, backgrounds
- Non-active states

### Badge Styles

**Administrator:**
```
[ Administrator ]  ← bg-blue-100, text-blue-800, rounded-full
```

**User:**
```
[ User ]  ← bg-green-100, text-green-800, rounded-full
```

**Active:**
```
[ Active ]  ← bg-green-100, text-green-800, rounded-full
```

**Inactive:**
```
[ Inactive ]  ← bg-red-100, text-red-800, rounded-full
```

**Department:**
```
[ Marketing ]  ← bg-gray-100, text-gray-800, rounded-full
```

### Button Styles

**Primary (Add User):**
```
[ + Add User ]  ← bg-[#3B6B8F], white text, hover:bg-[#2E5570]
```

**Secondary (Cancel):**
```
[ Cancel ]  ← border-gray-300, gray text, hover:bg-gray-50
```

**Action Links (Deactivate/Delete):**
```
[ Deactivate ]  ← text-[#3B6B8F], hover:text-[#2E5570]
[ Delete ]      ← text-red-600, hover:text-red-800
```

---

## Responsive Design

### Desktop (1200px+)
- Full layout with sidebar navigation
- Table shows all columns
- Modal centered with max-width

### Tablet (768px - 1199px)
- Sidebar navigation remains
- Table columns may stack on smaller sizes
- Modal still centered

### Mobile (< 768px)
- Navigation becomes vertical menu
- Table becomes card-based layout
- Modal full-width with padding

---

## Accessibility Features

### Keyboard Navigation
- Tab through all interactive elements
- Enter to submit forms
- Escape to close modals

### Screen Readers
- Proper ARIA labels
- Semantic HTML structure
- Focus management in modals

### Visual Indicators
- Clear focus states
- Color + text for status (not color alone)
- Sufficient contrast ratios

---

## Loading States

**Adding User:**
```
[ Adding... ]  ← Button disabled, shows loading text
```

**Form Validation:**
```
Email *
┌──────────────────────────────────────────┐
│ invalid-email                            │ 
└──────────────────────────────────────────┘
⚠️ Please enter a valid email address
```

**Success:**
```
✅ User added successfully!  ← Green notification (auto-dismisses)
```

**Error:**
```
❌ User with this email already exists  ← Red notification
```

---

## Empty States

**No Team Members Yet:**
```
┌────────────────────────────────────────────┐
│  Team Members              [+ Add User]     │
│  Manage users who have access              │
├────────────────────────────────────────────┤
│                                            │
│         👥                                 │
│    No team members yet                     │
│    Click "Add User" to invite your team    │
│                                            │
└────────────────────────────────────────────┘
```

---

## Security Indicators

**Self-Protection:**
- Bill's own row shows "You" instead of action buttons
- Cannot deactivate or delete own account
- Prevents accidental lockout

**Admin Badge:**
- Blue color distinguishes admins from regular users
- Clear visual hierarchy

**Status Visibility:**
- Green = Can access system
- Red = Cannot access system
- No ambiguity

---

This UI matches the existing Opticwise design system and provides a clean, professional interface for team management!
