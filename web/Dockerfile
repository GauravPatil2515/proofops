# Multi-stage Dockerfile for Proofline React Web Frontend
FROM node:20-alpine as builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./
RUN npm run build

FROM nginx:alpine as runner

COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config for SPA single-page app routing
RUN printf 'server {\n\
    listen 5173;\n\
    server_name localhost;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
