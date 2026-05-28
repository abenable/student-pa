# Student-PA — Hermes Agent on Node 24 Alpine
# Multi-stage build to keep the runtime image as small as possible.

# ------------------------------------------------------------------------------
# Builder stage — compile Python wheels so we can discard build tools later
# ------------------------------------------------------------------------------
FROM node:24-alpine AS builder

RUN apk add --no-cache \
    python3-dev py3-pip \
    build-base linux-headers

RUN python3 -m venv /opt/hermes-env
ENV PATH="/opt/hermes-env/bin:$PATH"

RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir \
        hermes-agent[youtube,web,cron,messaging] \
        pymupdf \
        yt-dlp

# ------------------------------------------------------------------------------
# Runtime stage — only runtime deps + copied venv + GWS CLI
# ------------------------------------------------------------------------------
FROM node:24-alpine

RUN apk add --no-cache \
    python3 bash ca-certificates \
    curl git jq wget \
    texlive texmf-dist-latexextra \
    pandoc \
    libstdc++

# Pull in the pre-built Python environment (Hermes + tools)
COPY --from=builder /opt/hermes-env /opt/hermes-env
ENV PATH="/opt/hermes-env/bin:$PATH"

# Install GWS CLI (Google Workspace CLI)
RUN npm install -g @googleworkspace/cli \
    && gws --version

# Create non-root user
RUN adduser -D -h /home/hermes -s /bin/bash hermes \
    && mkdir -p /home/hermes/.hermes /home/hermes/.gws /app \
    && touch /home/hermes/.hermes/.env \
    && chown -R hermes:hermes /home/hermes

WORKDIR /app

USER hermes
ENV HOME=/home/hermes
ENV HERMES_HOME=/home/hermes/.hermes

CMD ["tail", "-f", "/dev/null"]
