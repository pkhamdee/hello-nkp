FROM node:alpine AS builder
ENV NODE_ENV production
WORKDIR /app
COPY ./package.json ./
RUN npm install
# Copy app files
COPY . .
# Build the app
RUN npm run build

# Bundle static assets with nginx
FROM nginx:alpine as production

# UID 1000 is fixed and supplied by TAP in the container securityContext
RUN addgroup -g 1000 nonroot && \
    adduser -u 1000 -G nonroot -D nonroot 

# Change ownership of nginx directories
RUN chown -R nonroot:nonroot /var/cache/nginx && \
    chown -R nonroot:nonroot /var/log/nginx && \
    chown -R nonroot:nonroot /usr/share/nginx && \
    chown -R nonroot:nonroot /etc/nginx/conf.d

# Create workspace dir and change ownership
RUN mkdir -p /workspace && \
    chown -R nonroot:nonroot /workspace

RUN apk add --update nodejs npm 

USER nonroot

WORKDIR /workspace

# Copy built assets from builder
COPY --chown=nonroot:nonroot --from=builder /app/build build

# Copy your nginx.conf
COPY --chown=nonroot:nonroot nginx.conf .

ENTRYPOINT npx react-inject-env set \
&& 'nginx' '-p' '/workspace' '-c' '/workspace/nginx.conf' '-g' 'pid /var/log/nginx/nginx.pid;'