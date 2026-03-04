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
if [ -f "$ADMIN_INDEX" ] && ! grep -q "ghost-signin-fix" "$ADMIN_INDEX"; then
  sed -i 's|</body>|<script data-ghost-signin-fix>new MutationObserver(function(){var b=document.querySelector(".forgotten-link");if(b\&\&b.getAttribute("tabindex")!=="-1")b.setAttribute("tabindex","-1")}).observe(document.documentElement,{childList:true,subtree:true})</script></body>|' "$ADMIN_INDEX"
  echo "[Ghost Fix] Patched admin signin tab order"
fi

node current/index.js
