FROM debian:bookworm-slim

# Install curated TeX Live packages and fonts for professional resumes
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-latex-recommended \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-xetex \
    fonts-lato \
    fonts-roboto \
    fonts-font-awesome \
    cm-super \
    latexmk \
    nodejs \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json server.mjs ./

# Run under sandboxed non-root user for security
RUN useradd -m -u 1001 latexuser && chown -R latexuser:latexuser /app
USER latexuser

ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.mjs"]
