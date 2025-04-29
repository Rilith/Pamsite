############################
#  Stage 1 – build full    #
############################
FROM node:23-alpine AS build

WORKDIR /app

# -- install prod dependencies first so Docker layer-cache works
COPY backend/package*.json ./backend/
RUN npm ci --prefix backend --omit=dev      # installs `timidity` too

# -- then copy the rest of your source
COPY backend ./backend


############################
#  Stage 2 – final image   #
############################
FROM node:23-alpine

ENV PORT=3000
EXPOSE 3000
WORKDIR /app

# pull built code from stage 1
COPY --from=build /app/backend ./backend
# static files & helper scripts
COPY public   ./backend/public
COPY scripts  ./scripts

# (optional) convenience: where the WASM + FreePats live
ENV TIMIDITY_ASSETS_DIR=/app/backend/node_modules/timidity

WORKDIR /app/backend
CMD ["node", "server.js"]
