FROM ghost:5-alpine

WORKDIR $GHOST_INSTALL
COPY config.production.json .
COPY updateConfig.js .
COPY start.sh .
RUN chmod +x start.sh

ENTRYPOINT []
CMD ["./start.sh"]
