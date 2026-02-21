FROM node:20-slim

RUN apt-get update && apt-get install -y curl git && rm -rf /var/lib/apt/lists/*

RUN curl -L https://foundry.paradigm.xyz | bash && \
    /root/.foundry/bin/foundryup
ENV PATH="/root/.foundry/bin:${PATH}"

RUN npm install -g pnpm@10

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Patch 0G SDK with updated flow contract ABI (npm v0.3.3 has stale ABI)
RUN if [ -d /tmp/0g-sdk-patch ]; then rm -rf /tmp/0g-sdk-patch; fi && \
    git clone --depth 1 https://github.com/0gfoundation/0g-ts-sdk.git /tmp/0g-sdk-patch && \
    cd /tmp/0g-sdk-patch && npm install --ignore-scripts && \
    npx tsc -b tsconfig.esm.json tsconfig.commonjs.json tsconfig.types.json && \
    echo '{"type":"commonjs"}' > lib.commonjs/package.json && \
    echo '{"type":"module"}' > lib.esm/package.json && \
    SDK_DIR=$(find /app/node_modules -path '*/@0glabs/0g-ts-sdk' -type d | head -1) && \
    rm -rf "$SDK_DIR/lib.esm" "$SDK_DIR/lib.commonjs" "$SDK_DIR/types" && \
    cp -R /tmp/0g-sdk-patch/lib.esm "$SDK_DIR/lib.esm" && \
    cp -R /tmp/0g-sdk-patch/lib.commonjs "$SDK_DIR/lib.commonjs" && \
    cp -R /tmp/0g-sdk-patch/types "$SDK_DIR/types" && \
    rm -rf /tmp/0g-sdk-patch

ENV USE_DOCKER_SANDBOX=false
ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "dist/src/index.js"]
