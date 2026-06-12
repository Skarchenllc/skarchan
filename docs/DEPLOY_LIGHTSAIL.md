# Deploying to AWS Lightsail

This project is a **6-container Docker Compose stack** with stateful databases.
The right Lightsail target is a **Lightsail instance (an Ubuntu VM running Docker
Compose)** — *not* the Lightsail Container Service, which is stateless and can't
host Postgres / Redis / ChromaDB with persistent volumes.

The CI workflow `.github/workflows/deploy-lightsail.yml` does the actual deploys
(rsync code → write `.env` from secrets → `docker compose up -d --build` →
health check). This document is the **one-time instance setup** that workflow
depends on.

---

## 0. What runs, and how big it needs to be

| Container | Image | Notes | ~RAM |
|---|---|---|---|
| `bmp-nginx` | nginx:alpine | Public entry on :80 | ~30 MB |
| `bmp-core-frontend` | Next.js (Dockerfile.dev) | **dev server**, `--max-old-space-size=2048` | up to **2 GB** |
| `bmp-core-backend` | FastAPI/uvicorn | API on :8000 | ~400–600 MB |
| `bmp-postgres` | postgres:16-alpine | named volume `postgres_data` | ~300–500 MB |
| `bmp-chromadb` | chromadb/chroma | vector store, `chromadb_data` | ~400–700 MB |
| `bmp-redis` | redis:7-alpine | `redis_data` | ~50 MB |

Steady state is ~3.5–4.5 GB RAM, with a spike during `docker compose build`
(the Next.js install/compile is the heaviest step). External Anthropic / OpenAI
APIs are called over the network — no local GPU/model.

**Recommended plan:** `8 GB RAM / 2 vCPU` (~$44/mo). Comfortable for the dev
server + builds + ChromaDB.
**Minimum plan:** `4 GB RAM / 2 vCPU` (~$24/mo) — *only* if you add **swap**
(Step 3); without swap the Next.js build will OOM-kill.
Do **not** use 1–2 GB plans.

**Blueprint:** Ubuntu 22.04 LTS (OS-only, not a pre-baked app).
**Disk:** the included 80 GB (4 GB plan) / 160 GB (8 GB plan) is plenty — the repo
is ~17 MB of source; Docker images + volumes use a few GB and grow slowly.

---

## 1. Create the instance

Lightsail console → **Create instance**:
- Region: closest to your users.
- Platform **Linux/Unix** → Blueprint **OS Only → Ubuntu 22.04 LTS**.
- Choose the **8 GB** (or 4 GB) plan.
- Name it e.g. `nexacore-prod`. **Create**.

## 2. Static IP + firewall

1. Networking → **Create static IP** → attach to the instance. Use this IP for
   DNS and for the `LIGHTSAIL_HOST` secret (so it survives reboots).
2. Instance → **Networking** tab → **IPv4 Firewall**. Allow **only**:
   - SSH `22` (lock the source to your IP if possible),
   - HTTP `80`,
   - HTTPS `443` (if you add TLS).

   > The Compose file publishes extra host ports (3100, 8012, 5632, 6579, 8200).
   > Leave them **out** of the Lightsail firewall — the platform firewall blocks
   > them from the internet even though Docker binds them locally, so Postgres et
   > al. stay private. (Optional hardening: remove those `ports:` mappings from
   > `docker-compose.yml` so they aren't published on the host at all.)

## 3. Install Docker, Compose, rsync (+ swap)

SSH in (`ssh -i LightsailDefaultKey.pem ubuntu@<STATIC_IP>`), then:

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2 rsync git
sudo systemctl enable --now docker
sudo usermod -aG docker $USER         # run docker without sudo
# log out and back in for the group change to take effect

# Swap — REQUIRED on the 4 GB plan, recommended everywhere (covers build spikes)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h   # confirm swap is on
```

## 4. Deploy directory + CI SSH key

```bash
mkdir -p ~/nexacore          # this path becomes LIGHTSAIL_DEPLOY_DIR
```

Create a dedicated deploy key **on your laptop** (not the Lightsail default key)
so CI has its own credential you can rotate:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/nexacore_deploy -N "" -C "github-actions"
# print the PUBLIC key, then add it to the instance's authorized_keys:
cat ~/.ssh/nexacore_deploy.pub
```

On the instance:
```bash
echo "<paste the public key>" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

The **private** key (`~/.ssh/nexacore_deploy`) goes into the GitHub secret
`LIGHTSAIL_SSH_KEY`.

## 5. GitHub repository secrets

Settings → Secrets and variables → **Actions** → *New repository secret*:

| Secret | Value |
|---|---|
| `LIGHTSAIL_HOST` | the static IP (or domain) |
| `LIGHTSAIL_USER` | `ubuntu` |
| `LIGHTSAIL_SSH_KEY` | full contents of `~/.ssh/nexacore_deploy` |
| `LIGHTSAIL_DEPLOY_DIR` | `/home/ubuntu/nexacore` |
| `POSTGRES_PASSWORD` | DB password — **set before first deploy** (`openssl rand -hex 24`) |
| `APP_SECRET_KEY` | backend JWT key, ≥32 chars (`openssl rand -hex 32`) |
| `VAULT_ENCRYPTION_KEY` | base64 of 32 random bytes (`openssl rand -base64 32`) |
| `ANTHROPIC_API_KEY` | your Anthropic key (AI features) |
| `OPENAI_API_KEY` | OpenAI key (optional — embeddings only) |

## 6. Production stack vs. dev

The deploy uses **`docker-compose.prod.yml`** (not the dev `docker-compose.yml`),
which already hardens the important bits:
- Frontend is a real **`next build` + `next start`** image (`Dockerfile.prod`),
  not the dev server — no source bind-mounts.
- Backend runs the image's code with **`DEBUG=False`** and uvicorn **without
  `--reload`**.
- DB password, `SECRET_KEY`, and `VAULT_ENCRYPTION_KEY` come from `.env` and the
  stack **refuses to start** if the required ones are missing.
- Internal ports (3100/8012/5432/6379/8000) are **not published** — only nginx
  `:80` is exposed.

The one thing you must get right up front: **`POSTGRES_PASSWORD` must be set
before the first deploy**, because Postgres bakes it into the data volume on
init. Changing it later means resetting the volume (data loss) or an
`ALTER USER` inside the container.

## 7. First deploy

- Push `main` (or run the workflow manually: Actions → *Deploy to AWS Lightsail*
  → **Run workflow**).
- The workflow rsyncs code, writes `.env`, and runs
  `docker compose -f docker-compose.prod.yml up -d --build` (the frontend build
  takes a few minutes the first time — this is where the swap from Step 3 earns
  its keep).
- On the **first** boot, Postgres runs `infrastructure/databases/init-scripts`
  against the empty volume to create the schema/seed.
- The health check polls `http://localhost/`; the run fails (with logs) if the
  app doesn't come up.

Visit `http://<STATIC_IP>/`.

## 8. Domain + HTTPS

1. Point your domain's A record at the static IP.
2. Add `443` to the Lightsail firewall (Step 2).
3. Terminate TLS. Two easy options:
   - Put **Caddy** in front (auto Let's Encrypt), or
   - Run **certbot** and extend `nginx/nginx.conf` with a 443 server block + the
     cert paths. (The current `nginx.conf` only serves :80.)

## 9. Persistence & backups

State lives in Docker **named volumes** (survive `compose up/down`, *not*
`down -v`): `postgres_data`, `chromadb_data`, `redis_data`, `uploads_data`.

- **Snapshots:** enable Lightsail **automatic snapshots** on the instance (daily,
  whole-disk including volumes).
- **DB dumps (recommended too):** cron a logical backup:
  ```bash
  docker exec bmp-postgres pg_dump -U postgres business_management \
    | gzip > ~/backups/db-$(date +%F).sql.gz
  ```
  Add `0 3 * * *` to crontab and copy off-box (S3) for safety.

## 10. Day-2 operations

```bash
cd ~/nexacore
P="-f docker-compose.prod.yml"     # always target the prod stack
docker compose $P ps                   # status
docker compose $P logs -f core-backend # tail a service
docker compose $P restart core-backend
docker compose $P down                 # stop (keeps volumes)
docker compose $P up -d --build        # what CI runs
docker system df                       # disk usage; `docker image prune -f` to reclaim
```

Redeploys are just `git push` to `main` — CI handles the rest.
