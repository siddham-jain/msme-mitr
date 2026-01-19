# MSME Mitr - CI/CD Project Assignment

## How to Run Locally & trigger the Pipeline

To replicate this CI/CD setup in your own repository, follow these steps:

### 1. Prerequisites
- A GitHub account.
- A DockerHub account.
- A local terminal with `git` installed.

### 2. Repository Setup
1. **Fork/Clone** this repository to your GitHub account.
2. Navigate to the project directory:
   ```bash
   git clone https://github.com/siddham-jain/msme-mitr
   cd msme-mitr
   ```

### 3. Secrets Configuration
You must configure the following **GitHub Actions Secrets** for the pipeline to function correctly:
Go to **Settings** > **Secrets and variables** > **Actions** > **New repository secret**.

| Secret Name | Description |
| :--- | :--- |
| `DOCKERHUB_USERNAME` | Your DockerHub username for pushing images. |
| `DOCKERHUB_TOKEN` | Your DockerHub Access Token (ensure Read/Write permissions). |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL for the application build. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Public Key. |
| `SUPABASE_SECRET_KEY` | Supabase Secret Key (if required for build/tests). |
| `OPENROUTER_API_KEY` | API Key for OpenRouter services. |
| `DEEPGRAM_API_KEY` | API Key for Deepgram services. |

### 4. Triggering the Pipeline
The pipeline is designed to run automatically.
- **Make a change**: Edit any file and `git push` to the `main` or `master` branch.
- **Manual Trigger**: Go to the **Actions** tab in GitHub, select **CI Pipeline**, and click **Run workflow**.

---

## CI Pipeline Explanation

The Continuous Integration (CI) pipeline is defined in `.github/workflows/ci.yml`. It ensures that every commit is vetted for quality, security, and functionality before being packaged.

### **Stages Breakdown**

1. **Checkout**: Uses `actions/checkout@v4` to pull the latest code.
2. **Setup Runtime**: Installs Node.js v20 and caches `npm` dependencies for speed.
3. **Linting (Quality Gate)**:
   - Runs `npm run lint` (ESLint) to enforce code style and best practices.
   - Runs `tsc` (TypeScript Compiler) to catch type errors.
4. **SCA (Software Composition Analysis)**:
   - Runs `npm audit` to check for known vulnerabilities in dependencies.
   - Fails if High/Critical vulnerabilities are found (ensures supply chain security).
5. **Unit Tests**:
   - Executes `npm test` to validate business logic.
6. **Application Build**:
   - Compiles the Next.js application to ensure it builds without errors.
7. **Docker Build**:
   - Uses `docker/build-push-action` to build the container image.
   - Uses **BuildKit** caching (`type=gha`) to speed up subsequent builds.
8. **Container Security Scan (Trivy)**:
   - Scans the built *local* Docker image for OS-level vulnerabilities using **Aquasecurity Trivy**.
   - Generates a SARIF report uploaded to GitHub Security.
9. **Smoke Test**:
   - Spins up the container locally (`docker run`).
   - Polls the `/api/health` endpoint to ensure the app actually starts and responds.
10. **Registry Push**:
    - If all checks pass, pushes the trusted image to DockerHub tagged with both the commit SHA and `latest`.

---

## CD Pipeline Explanation

The Continuous Deployment (CD) pipeline is defined in `.github/workflows/cd.yml`. It triggers **automatically** after the CI pipeline completes successfully.

### **Stages Breakdown**

1. **Trigger**: Watched for the `completed` event of "CI Pipeline".
2. **Cluster Creation (Kind)**:
   - Spins up an ephemeral **Kubernetes inside Docker (Kind)** cluster within the GitHub Actions runner.
   - This simulates a real Kubernetes environment for zero-cost integration testing.
3. **Manifest Update**:
   - Dynamically injects the specific Docker image SHA (from the CI run) into `k8s/deployment.yaml`.
   - Ensures we deploy *exactly* what verified in CI, not just "whatever is latest".
4. **Deployment**:
   - Applies `service.yaml` (NodePort) and `deployment.yaml`.
   - Waits for `rollout status` to confirm pods are successfully Running.
5. **DAST (OWASP ZAP)**:
   - Port-forwards the running service to localhost.
   - Runs an **OWASP ZAP Baseline Scan** against the running application to detect runtime security issues (headers, cookies, XSS risks).
