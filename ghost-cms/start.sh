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

# Fix Ghost admin login: remove "Forgot?" from tab order so pressing Enter
# after typing the password submits the form instead of triggering "Forgot?"
ADMIN_INDEX="$GHOST_INSTALL/current/core/built/admin/index.html"
PATCH_DATE=$(date -u '+%Y-%m-%d %H:%M UTC')
if [ -f "$ADMIN_INDEX" ] && ! grep -q "ghost-signin-fix" "$ADMIN_INDEX"; then
  sed -i "s|</body>|<script data-ghost-signin-fix>new MutationObserver(function(){var b=document.querySelector('.forgotten-link');if(b\&\&b.getAttribute('tabindex')!=='-1')b.setAttribute('tabindex','-1');var s=document.querySelector('.gh-signin');if(s\&\&!document.getElementById('ow-patch-ver')){var d=document.createElement('div');d.id='ow-patch-ver';d.style.cssText='position:fixed;bottom:8px;right:12px;font-size:10px;color:#ccc;z-index:9999';d.textContent='OW patch: ${PATCH_DATE}';document.body.appendChild(d)}}).observe(document.documentElement,{childList:true,subtree:true})</script></body>|" "$ADMIN_INDEX"
  echo "[Ghost Fix] Patched admin signin tab order (${PATCH_DATE})"
fi

node current/index.js
