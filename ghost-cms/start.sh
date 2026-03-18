#!/bin/bash
set -o errexit

baseDir="$GHOST_INSTALL/content.orig"
for src in "$baseDir"/*/ "$baseDir"/themes/*; do
  src="${src%/}"
  target="$GHOST_CONTENT/${src#$baseDir/}"
  mkdir -p "$(dirname "$target")"
  if [ ! -e "$target" ]; then
    tar -cC "$(dirname "$src")" "$(basename "$src")" | tar -xC "$(dirname "$target")"
  fi
done

node updateConfig.js

# One-time password reset if GHOST_RESET_PASSWORD env var is set
if [ -n "$GHOST_RESET_PASSWORD" ]; then
  node reset-password.js || echo "[Ghost Reset] Reset script failed, continuing startup"
fi

# Fix Ghost admin login: remove "Forgot?" from tab order so pressing Enter
# after typing the password submits the form instead of triggering "Forgot?"
ADMIN_INDEX="$GHOST_INSTALL/current/core/built/admin/index.html"
PATCH_DATE=$(date -u '+%Y-%m-%d %H:%M UTC')
if [ -f "$ADMIN_INDEX" ] && ! grep -q "ghost-signin-fix" "$ADMIN_INDEX"; then
  sed -i "s|</body>|<script data-ghost-signin-fix>new MutationObserver(function(){var b=document.querySelector('.forgotten-link');if(b\&\&b.getAttribute('tabindex')!=='-1')b.setAttribute('tabindex','-1');var s=document.querySelector('.gh-signin');if(s\&\&!document.getElementById('ow-patch-ver')){var d=document.createElement('div');d.id='ow-patch-ver';d.style.cssText='position:fixed;bottom:8px;right:12px;font-size:10px;color:#ccc;z-index:9999';d.textContent='OW patch: ${PATCH_DATE}';document.body.appendChild(d)}}).observe(document.documentElement,{childList:true,subtree:true})</script></body>|" "$ADMIN_INDEX"
  echo "[Ghost Fix] Patched admin signin tab order (${PATCH_DATE})"
fi

# Disable Ghost 5.x staff email verification (2FA via email code)
# Ghost 5.130+ calls sendAuthCodeToUser during createSession, which requires
# working SMTP. Patch the session service to skip the verification step so
# password-only login works without email.
SESSION_SVC="$GHOST_INSTALL/versions/5.130.6/core/server/services/auth/session/session-service.js"
if [ -f "$SESSION_SVC" ] && grep -q "sendAuthCodeToUser" "$SESSION_SVC"; then
  # Replace sendAuthCodeToUser to be a no-op that resolves immediately
  sed -i 's/async sendAuthCodeToUser(user)/async sendAuthCodeToUser(user) { return; } async _originalSendAuthCodeToUser(user)/' "$SESSION_SVC"
  echo "[Ghost Fix] Disabled staff email verification (2FA bypass)"
elif [ -d "$GHOST_INSTALL/versions" ]; then
  # Handle different Ghost versions dynamically
  GHOST_VER=$(ls "$GHOST_INSTALL/versions" | head -1)
  SESSION_SVC_ALT="$GHOST_INSTALL/versions/$GHOST_VER/core/server/services/auth/session/session-service.js"
  if [ -f "$SESSION_SVC_ALT" ] && grep -q "sendAuthCodeToUser" "$SESSION_SVC_ALT"; then
    sed -i 's/async sendAuthCodeToUser(user)/async sendAuthCodeToUser(user) { return; } async _originalSendAuthCodeToUser(user)/' "$SESSION_SVC_ALT"
    echo "[Ghost Fix] Disabled staff email verification for Ghost $GHOST_VER (2FA bypass)"
  fi
fi

node current/index.js
