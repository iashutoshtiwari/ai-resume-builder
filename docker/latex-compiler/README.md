# Resume-Optimized LaTeX Microservice for Google Cloud Run (100% Free Tier)

A lightweight, specialized LaTeX compilation microservice packaged in Docker and optimized for deployment on Google Cloud Run at **$0.00 / month cost**.

## Highlights

- **Curated Resume Packages & Typography**: Pre-installs serif (`XCharter`, `Latin Modern`, `newtx`, `newpx`, `ebgaramond`, `libertine`), sans-serif (`TeX Gyre Heros / Helvetica`, `Lato`, `Roboto`, `Source Sans Pro`, `Inter`, `Fira Sans`), monospace (`Inconsolata`), and essential resume styling packages (`titlesec`, `geometry`, `enumitem`, `tabularx`, `fontawesome5`, `hyperref`, etc.).
- **100% Zero-Cost Guarantee**: Leverages GitHub Container Registry (`ghcr.io`) for unlimited free public container hosting and Google Cloud Run Free Tier (2M requests, 180k vCPU-seconds, 360k GiB-seconds RAM, 1 GiB egress per month).
- **Scale-to-Zero**: Zero instances active when idle (`--min-instances 0`) = $0 compute or memory cost.
- **Fast & Sandboxed**: Uses `latexmk` with `-no-shell-escape`, run as an unprivileged user (`latexuser`), inside disposable compile directories that are cleaned up automatically.

---

## 100% Free Tier Math

| Resource | GCP Free Tier Quota | Typical Usage | Cost |
| :--- | :--- | :--- | :--- |
| **Container Registry** | GHCR public images | Free unlimited public storage & pulls | **$0.00** |
| **vCPU (Compute)** | 180,000 vCPU-sec/month | ~1.2s per compile = up to 150,000 compiles/mo | **$0.00** |
| **Memory (RAM)** | 360,000 GiB-sec/month | 1 GiB × 1.2s = up to 300,000 compiles/mo | **$0.00** |
| **Invocations** | 2,000,000 requests/month | Resumes compiled on demand | **$0.00** |
| **Network Egress** | 1 GiB / month | Resumes are ~40–70 KB (~15,000–25,000 PDFs) | **$0.00** |
| **Idle Running** | Scale to zero (`--min-instances 0`) | 0 idle instances | **$0.00** |

---

## Local Testing with Docker

To test locally before deploying:

```bash
# 1. Build local container
docker build -t resume-latex-compiler docker/latex-compiler

# 2. Run locally on port 8080
docker run -d -p 8080:8080 --name latex-compiler-test resume-latex-compiler

# 3. Health check
curl http://localhost:8080/health

# 4. Compile a sample resume document
curl -X POST http://localhost:8080/compile \
  -H "Content-Type: application/json" \
  -d '{"source": "\\documentclass{article}\\usepackage{XCharter}\\usepackage{fontawesome5}\\begin{document}\\faGithub\\ Hello XCharter\\end{document}"}'

# 5. Clean up
docker stop latex-compiler-test && docker rm latex-compiler-test
```

---

## One-Command Free Deployment

### Prerequisites
1. **Google Cloud SDK (`gcloud`)**: Configured and logged in (`gcloud auth login`).
2. **GitHub Container Registry (`ghcr.io`)**: Logged in with a Personal Access Token (PAT) with `write:packages` scope:
   ```bash
   echo $CR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
   ```

### Deploy
On Linux / macOS:
```bash
./docker/latex-compiler/deploy-free.sh
```

On Windows PowerShell:
```powershell
.\docker\latex-compiler\deploy-free.ps1
```

Once deployment finishes, copy the output service URL into your Next.js app's `.env.local`:
```env
LATEX_COMPILER_URL=https://resume-latex-compiler-xxxx.a.run.app
```

---

## API Contract

### `GET /health`
Returns health and available engines:
```json
{
  "status": "ok",
  "service": "resume-latex-compiler",
  "engines": ["pdflatex", "xelatex"]
}
```

### `POST /compile`
Compiles LaTeX source to PDF.

#### Request Body
```json
{
  "source": "\\documentclass{article}...",
  "engine": "pdflatex",
  "files": [
    { "name": "custom.sty", "content": "..." }
  ]
}
```

#### Successful Response (HTTP 200)
```json
{
  "success": true,
  "pdf": "<base64 encoded PDF string>",
  "logs": "Latexmk: This is PdfTeX..."
}
```

#### Failure Response (HTTP 200)
```json
{
  "success": false,
  "errors": [
    {
      "code": "latex",
      "message": "Undefined control sequence",
      "line": 42
    }
  ],
  "logs": "..."
}
```
