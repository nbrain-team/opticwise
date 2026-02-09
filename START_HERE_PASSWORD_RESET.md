# 🔐 Password Reset System - START HERE

**Implementation Complete:** February 9, 2026  
**Status:** Code deployed to GitHub, ready for Render testing

---

## ✅ What's Built

Complete password reset system with three features:

1. **"Forgot Password?" on Login** - Email reset link with secure 1-hour token
2. **Change Password in Settings** - Users can update their own password
3. **Email Notifications** - Professional emails from bill@opticwise.com

---

## 🚀 Quick Deploy

### Step 1: Wait for Render (2-3 minutes)

Render auto-deploys from GitHub. Check:
- https://dashboard.render.com/web/srv-d4ecr5rgk3sc73blsjag

### Step 2: Run Migration in Render Shell

```bash
# Apply the migration
psql $DATABASE_URL -c "CREATE TABLE IF NOT EXISTS \"PasswordResetToken\" (
    \"id\" TEXT NOT NULL,
    \"token\" TEXT NOT NULL,
    \"userId\" TEXT NOT NULL,
    \"expiresAt\" TIMESTAMP(3) NOT NULL,
    \"used\" BOOLEAN NOT NULL DEFAULT false,
    \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT \"PasswordResetToken_pkey\" PRIMARY KEY (\"id\")
);
CREATE UNIQUE INDEX IF NOT EXISTS \"PasswordResetToken_token_key\" ON \"PasswordResetToken\"(\"token\");
CREATE INDEX IF NOT EXISTS \"PasswordResetToken_token_idx\" ON \"PasswordResetToken\"(\"token\");
CREATE INDEX IF NOT EXISTS \"PasswordResetToken_userId_idx\" ON \"PasswordResetToken\"(\"userId\");
CREATE INDEX IF NOT EXISTS \"PasswordResetToken_expiresAt_idx\" ON \"PasswordResetToken\"(\"expiresAt\");
ALTER TABLE \"PasswordResetToken\" ADD CONSTRAINT IF NOT EXISTS \"PasswordResetToken_userId_fkey\" FOREIGN KEY (\"userId\") REFERENCES \"User\"(\"id\") ON DELETE CASCADE ON UPDATE CASCADE;"

# Mark migration as applied
cd ow && npx prisma migrate resolve --applied 20260209145306_add_password_reset_tokens

# Regenerate Prisma client
cd ow && npx prisma generate
```

### Step 3: Test It!

**Test Forgot Password:**
1. Go to login page
2. Click "Forgot password?"
3. Enter email: bill@opticwise.com
4. Check Bill's email for reset link
5. Click link and set new password

**Test Change Password:**
1. Log in and click "Profile"
2. Click "Change Password"
3. Enter current → new password
4. Check email for confirmation

---

## 📧 Email Features

**Emails sent from:** bill@opticwise.com  
**Using:** Existing Google service account  
**Templates:** Professional HTML with Opticwise branding

**Two email types:**
1. **Password Reset** - Link with 1-hour expiration
2. **Password Changed** - Confirmation notification

---

## 🔒 Security

- ✅ Secure random tokens (32 bytes)
- ✅ 1-hour expiration
- ✅ Single-use tokens
- ✅ bcrypt password hashing
- ✅ Email enumeration prevention
- ✅ Min 8 characters enforced
- ✅ Current password required for changes

---

## 📋 Quick Test Checklist

### Forgot Password
- [ ] "Forgot password?" link visible on login
- [ ] Modal opens when clicked
- [ ] Can submit email
- [ ] Email received with reset link
- [ ] Link works and goes to reset page
- [ ] Can set new password
- [ ] Redirects to login
- [ ] Can log in with new password
- [ ] Confirmation email received

### Change Password  
- [ ] "Change Password" section in Settings
- [ ] Requires current password
- [ ] Validates new password (8 chars, match)
- [ ] Shows success message
- [ ] Confirmation email received
- [ ] Can log in with new password

---

## 🐛 Troubleshooting

**If emails don't arrive:**
- Check Google service account is set up
- Verify `GOOGLE_SERVICE_ACCOUNT_JSON` env var
- Check Render logs for email errors

**If migration fails:**
- Table might already exist (check with `\d PasswordResetToken`)
- Just mark as applied: `npx prisma migrate resolve --applied 20260209145306_add_password_reset_tokens`

**If "Invalid token" error:**
- Token might be expired (1 hour limit)
- Request a new reset link

---

## 📚 Full Documentation

**PASSWORD_RESET_SYSTEM_COMPLETE.md** - Complete technical details

---

## ✨ User Experience

### Login Page
```
┌─────────────────────────┐
│  [Opticwise Logo]      │
│  Welcome Back          │
│                        │
│  Email: [_________]    │
│  Password: [______]    │
│                        │
│  [Sign in]             │
│                        │
│  Forgot password? ←NEW │
└─────────────────────────┘
```

### Reset Email
```
From: Opticwise <bill@opticwise.com>
Subject: Reset Your Opticwise Password

Hi [Name],

We received a request to reset your password.

[Reset Password] ← Button

Link expires in 1 hour.
```

### Settings Page
```
Settings
├─ Profile
├─ Change Password ←NEW
└─ Team Members (admin)
```

---

**Everything is ready! Just run the migration and test.** 🎉
