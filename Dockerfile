FROM node:20-bullseye-slim

RUN apt-get update && apt-get install dumb-init
RUN mkdir /web-viewer
RUN chown node:node /web-viewer
WORKDIR /web-viewer

USER node
COPY --chown=node:node public ./public
COPY --chown=node:node src ./src
COPY --chown=node:node package.json ./
COPY --chown=node:node package-lock.json ./
COPY --chown=node:node index.html ./
COPY --chown=node:node vite.config.js ./

RUN echo "{\
  \"api_host\": \"http://localhost:8080\",\
  \"visualizejs_url\": \"\",\
  \"supportFormats\": [ \"DGN\", \"DWF\", \"DWG\", \"DXF\", \"IFC\", \"IFCZIP\", \"NWC\", \"NWD\", \"OBJ\", \"RCS\", \"RFA\", \"RVT\", \"STEP\", \"STL\", \"STP\", \"VSFX\" ],\
  \"nativeFormats\": [ \"IFCX\", \"USDZ\"],\
  \"jobParameters\": { \"geometry\": \"--objectTree=false\", \"properties\": \"--properties_group\" }, \"geometryType\": \"vsfx\" }\
}" > public/config.json

RUN npm ci && npm run build
CMD dumb-init npm run dev

EXPOSE 3000
