FROM ubuntu:22.04

# Prevent interactive prompts during apt install
ENV DEBIAN_FRONTEND=noninteractive

# Install core dependencies: Python, curl, git, and LaTeX (for the typesetter service)
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv \
    curl git wget jq \
    texlive-latex-base texlive-fonts-recommended texlive-latex-extra \
    && rm -rf /var/lib/apt/lists/*

# Set up a virtual environment and install Hermes Agent
RUN python3 -m venv /opt/hermes-env
ENV PATH="/opt/hermes-env/bin:$PATH"
RUN pip install --upgrade pip && pip install hermes-agent

# Install GWS CLI (Google Workspace CLI)
# Note: Replace this with the specific GWS CLI binary URL you use
# RUN curl -L https://example.com/path/to/gws-linux-amd64 -o /usr/local/bin/gws && chmod +x /usr/local/bin/gws

# Set the working directory
WORKDIR /app

# By default, keep the container running so we can exec into it or run cronjobs
CMD ["tail", "-f", "/dev/null"]