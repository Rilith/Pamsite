############################
#  Stage 1 – build full    #
############################
FROM node:20-alpine AS build
WORKDIR /app

# Copio TUTTO il sorgente backend (incluso server.js)
COPY backend ./backend

# Installo dipendenze
RUN npm install --prefix backend --production

############################
#  Stage 2 – final image   #
############################
FROM node:20-alpine
ENV PORT=3000
EXPOSE 3000

# Python + deps Alpine
RUN apk add --no-cache \
      python3 \
      py3-pip \
      py3-requests \
      py3-beautifulsoup4 \
      py3-lxml

WORKDIR /app

# Copio l’intero build-stage, che ora contiene anche server.js
COPY --from=build /app/backend ./backend

# File statici & script
COPY public   ./backend/public
COPY scripts  ./scripts

WORKDIR /app/backend
CMD ["node", "server.js"]
