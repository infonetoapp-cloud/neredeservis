FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001

COPY package.json ./
COPY src ./src

EXPOSE 3001

CMD ["node", "src/server.js"]
