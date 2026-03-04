FROM ghost:5-alpine

WORKDIR $GHOST_INSTALL
COPY config.production.json .
COPY updateConfig.js .
COPY reset-password.js .
COPY start.sh .
RUN chmod +x start.sh
RUN npm install mysql2 bcryptjs --no-save 2>/dev/null || true

ENTRYPOINT []
CMD ["./start.sh"]
