# Deployment Runbook — Timewave2 + fabled10x (Hetzner CPX41)

**Audience:** Claude Code, executing on the server as the `travis` user.
**Goal:** Provision a single Hetzner CPX41 box and bring up two production apps
co-hosted behind Nginx with one shared PostgreSQL 18 instance.

---

## CREDENTIALS / VALUES VAULT

Filled in as of this revision. **`SERVER_IP` is the only placeholder remaining**
and must be set once the Hetzner box is provisioned.

| Variable | Value |
|---|---|
| Server public IP (v4) | `5.78.65.127` |
| Server public IP (v6) | `2a01:4ff:1f0:ead4::/64` |
| Server name / Hetzner ID | `fabledtimewave` / `#137275840` |
| Server location | Hillsboro, OR (us-west) |
| Timewave2 repo | `git@github.com:TravisGautier/timewave2.git` (also present at `/home/travis/Projects/Timewave2` locally) |
| fabled10x repo | `git@github.com:fabled10x/fabled10x.com.git` (also present at `/home/travis/Projects/fabled10x` locally) |
| Timewave2 domain | `timewave2.com` |
| fabled10x domain | `fabled10x.com` |
| Postgres `timewave2` DB password | `eUReKtjqCfxQEQBBHxIG5SA2M166llgy` |
| Postgres `fabled10x` DB password | `QvbiSZCK6G6QSyGmekU5Q5ZWUIuS8l8P` |
| Stripe + Resend secrets (fabled10x) | provided via `.env`, never hardcoded |
| Admin user | `travis` |

**Locked assumptions for this revision:**
- Node 22 LTS · Python 3.12 · Uvicorn on `127.0.0.1:8000` · Nuxt SSR on
  `127.0.0.1:3001` · Next.js on `127.0.0.1:3000`
- **fabled10x = npm** (single Next.js app, no workspace — matches local repo)
- **Timewave2 web = pnpm** (it's a pnpm workspace monorepo at `program/web/`
  with `frontend-nuxt` + sibling `packages/*`; pnpm workspaces was the migration
  driver — see commit `e29fc3c`)
- Timewave2 backend lives at `program/web/backend/`; FastAPI app object is
  `main:app` (file `program/web/backend/main.py`).
- `libtimewave2_core.so` is built into `program/build/core/` (CMake build dir).

---

## TARGET ARCHITECTURE (read first — this is the "why")

One CPX41: **8 vCPU AMD / 16 GB / 240 GB / Ubuntu 26.04**, Hillsboro OR.

**Project 1 — Timewave2** (`/home/travis/Projects/Timewave2`)
- Uvicorn / FastAPI (Python), calls `libtimewave2_core.so` via ctypes
- Nuxt 3 SSR frontend (port 3001) — pnpm workspace member `frontend-nuxt`
- Redis (rate limiting, token blacklist, cache)
- ARQ background worker (systemd, **MemoryMax=1G**)

**Project 2 — fabled10x** (`/home/travis/Projects/fabled10x`)
- Next.js 16 App Router (`next start`) — marketing/brand site
- Drizzle ORM → **shared** Postgres (migrating off its own docker-compose Postgres)
- Stripe + Resend (external, no local footprint)

**Shared:** one PostgreSQL 18 with two databases (`timewave2`, `fabled10x`),
one Redis, Nginx as the single reverse proxy.

**RAM budget (medium/high traffic):**

| Service | Steady RSS |
|---|---|
| PostgreSQL (shared, tuned for 2 apps) | 2.0–3.0 GB |
| Redis | 300–800 MB |
| Uvicorn × 4 workers | 0.8–1.2 GB |
| ARQ worker (MemoryMax=1G) | up to 1 GB |
| Nuxt SSR | 400–700 MB |
| Next.js SSR | 350–600 MB |
| Nginx + OS + cache + headroom | 1.5 GB |
| **Total** | **~7–10 GB steady, 11–13 GB burst** |

**Hard tuning constraints — do not deviate:**
1. **Uvicorn: 4 workers.** NOT the `(2 × cores) + 1` formula (that gives 17 on
   8 cores — far too aggressive for a co-hosted box with CPU-bound math).
   Start at 4, monitor, scale to 6 only if needed.
2. **Postgres `shared_buffers` ≈ 2 GB** — ~25% of Postgres's *slice*, NOT 25%
   of total RAM. The "25% of RAM" rule is wrong on a co-hosted box.
3. **Redis: set `maxmemory` with LRU eviction.** Without it, Redis grows until OOM.
4. **ARQ worker capped at 1 GB** via `MemoryMax=1G` in the systemd unit.
5. `libtimewave2_core.so` is mmap'd — code pages are copy-on-write shared
   across uvicorn workers. Only per-request NumPy/heap allocs are per-worker.

**Upgrade path if it gets tight:** swap pressure or slow calculator → resize to
CPX51 (32 GB) for RAM, or migrate to **CCX33 (8 dedicated vCPU / 32 GB)** if the
bottleneck is CPU contention rather than RAM.

---

## OPERATING RULES FOR CLAUDE CODE

- You run as `travis`, which has **passwordless sudo**. Prefix any
  root-requiring command with `sudo`. **Never run `claude` itself with sudo.**
- Execute phases **in order**. **Stop on the first failing step** — report the
  failure, do not continue or "work around" it.
- After each phase, run its **validation** block and confirm green before moving on.
- Treat this as production. When a step is destructive (dropping the old
  fabled10x Postgres, restarting a live service), state what you're about to do
  and confirm the backup/snapshot exists first.

---

## PHASE 0 — Server bootstrap (HUMAN runs this once, as root)

This is the only part Claude Code does **not** do — it's the chicken-and-egg
step that creates the user Claude Code then runs as. Travis runs this over SSH
as `root` immediately after the box is created:

```bash
adduser travis
usermod -aG sudo travis

echo 'travis ALL=(ALL) NOPASSWD:ALL' | sudo tee /etc/sudoers.d/travis-nopasswd
chmod 440 /etc/sudoers.d/travis-nopasswd
visudo -c -f /etc/sudoers.d/travis-nopasswd      # must print "parsed OK"

mkdir -p /home/travis/.ssh
cp /root/.ssh/authorized_keys /home/travis/.ssh/authorized_keys
chown -R travis:travis /home/travis/.ssh
chmod 700 /home/travis/.ssh && chmod 600 /home/travis/.ssh/authorized_keys
```

Then log out, log back in as `travis`, install Claude Code, and hand it this file:

```bash
ssh travis@5.78.65.127
curl -fsSL https://claude.ai/install.sh | bash
export PATH="$HOME/.local/bin:$PATH"      # installer prints the exact line for ~/.bashrc
claude --version
claude --dangerously-skip-permissions     # required: this flag is BLOCKED as root
```

---

## PHASE 1 — System packages (Claude Code, as travis)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential cmake ufw fail2ban \
    python3 python3-venv python3-dev \
    postgresql postgresql-client \
    redis-server nginx certbot python3-certbot-nginx
```

Node 22 LTS via nvm (Next.js 16 + Nuxt 3 need Node 20+; 22 is the safe LTS).
**Both `npm` (built into Node) and `pnpm` are installed — fabled10x uses npm,
Timewave2 web uses pnpm.**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 22 && nvm use 22 && nvm alias default 22
npm install -g pnpm
```

**Validate:** `node -v` (v22.x), `npm -v`, `pnpm -v`, `python3 --version`,
`psql --version` (18.x — Ubuntu 26.04 default), `redis-server --version`,
`nginx -v`, `cmake --version`.

---

## PHASE 2 — Shared PostgreSQL 18

Create two databases with separate roles (least-privilege per app):

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE timewave2_app LOGIN PASSWORD 'eUReKtjqCfxQEQBBHxIG5SA2M166llgy';
CREATE ROLE fabled10x_app LOGIN PASSWORD 'QvbiSZCK6G6QSyGmekU5Q5ZWUIuS8l8P';
CREATE DATABASE timewave2 OWNER timewave2_app;
CREATE DATABASE fabled10x OWNER fabled10x_app;
SQL
```

Tune for a co-hosted box — edit `/etc/postgresql/18/main/postgresql.conf`:

```
shared_buffers = 2GB
effective_cache_size = 4GB
work_mem = 32MB
maintenance_work_mem = 256MB
max_connections = 100
```

```bash
sudo systemctl restart postgresql
```

**Validate:** `sudo -u postgres psql -c "\l"` shows both DBs;
`psql "postgresql://fabled10x_app:QvbiSZCK6G6QSyGmekU5Q5ZWUIuS8l8P@127.0.0.1/fabled10x" -c "select 1;"`
connects.

---

## PHASE 3 — Redis (bounded memory)

Edit `/etc/redis/redis.conf`:

```
maxmemory 768mb
maxmemory-policy allkeys-lru
```

```bash
sudo systemctl restart redis-server && sudo systemctl enable redis-server
```

**Validate:** `redis-cli ping` → `PONG`; `redis-cli config get maxmemory-policy`
→ `allkeys-lru`.

---

## PHASE 4 — Deploy Timewave2

```bash
cd /home/travis/Projects
git clone git@github.com:TravisGautier/timewave2.git Timewave2
cd Timewave2
```

1. **Build the C library** (CMake out-of-tree build):
   ```bash
   cd program
   cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
   cmake --build build -j$(nproc)
   # produces program/build/core/libtimewave2_core.so
   cd ..
   ```
2. **Python env + backend deps:**
   ```bash
   python3 -m venv .venv && source .venv/bin/activate
   pip install --upgrade pip
   pip install -r program/web/backend/requirements.txt
   ```
3. **Env:** create `/home/travis/Projects/Timewave2/.env` with
   `DATABASE_URL=postgresql://timewave2_app:eUReKtjqCfxQEQBBHxIG5SA2M166llgy@127.0.0.1:5432/timewave2`
   and `REDIS_URL=redis://127.0.0.1:6379` (plus whatever other vars
   `program/web/backend/config.py` reads). Run DB migrations:
   `cd program/web/backend && alembic upgrade head`.
4. **Nuxt SSR build (pnpm workspace at `program/web/`):**
   ```bash
   cd /home/travis/Projects/Timewave2/program/web
   pnpm install
   pnpm --filter frontend-nuxt build
   # produces program/web/frontend-nuxt/.output/server/index.mjs
   ```

Create systemd units (Claude Code writes these):

`/etc/systemd/system/timewave2-api.service` — Uvicorn, **4 workers**, port 8000:
```ini
[Unit]
Description=Timewave2 FastAPI (uvicorn)
After=network.target postgresql.service redis-server.service

[Service]
User=travis
WorkingDirectory=/home/travis/Projects/Timewave2/program/web/backend
ExecStart=/home/travis/Projects/Timewave2/.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always
EnvironmentFile=/home/travis/Projects/Timewave2/.env

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/timewave2-nuxt.service` — Nuxt SSR, port 3001:
```ini
[Unit]
Description=Timewave2 Nuxt SSR
After=network.target

[Service]
User=travis
WorkingDirectory=/home/travis/Projects/Timewave2/program/web/frontend-nuxt
Environment=HOST=127.0.0.1
Environment=PORT=3001
Environment=NODE_ENV=production
ExecStart=/home/travis/.nvm/versions/node/v22/bin/node .output/server/index.mjs
Restart=always
EnvironmentFile=/home/travis/Projects/Timewave2/.env

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/timewave2-arq.service` — ARQ worker, **with the cap**:
```ini
[Unit]
Description=Timewave2 ARQ worker
After=network.target redis-server.service

[Service]
User=travis
WorkingDirectory=/home/travis/Projects/Timewave2/program/web/backend
ExecStart=/home/travis/Projects/Timewave2/.venv/bin/arq app.worker.WorkerSettings
Restart=always
MemoryMax=1G
EnvironmentFile=/home/travis/Projects/Timewave2/.env

[Install]
WantedBy=multi-user.target
```

> **TBD at run-time:** confirm the ARQ `WorkerSettings` import path before
> enabling. If `app.worker.WorkerSettings` doesn't resolve under
> `program/web/backend/`, find the actual module path with
> `grep -r "class WorkerSettings" program/web/backend/`.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now timewave2-api timewave2-nuxt timewave2-arq
```

**Validate:** all three `systemctl status` are `active (running)`;
`curl -s 127.0.0.1:8000/health` and `curl -s 127.0.0.1:3001` respond.

---

## PHASE 5 — Deploy fabled10x (incl. Postgres migration)

```bash
cd /home/travis/Projects
git clone git@github.com:fabled10x/fabled10x.com.git fabled10x
cd fabled10x
npm ci
```

**Migrate off the docker-compose Postgres → shared instance:**
1. Set `DATABASE_URL` in `/home/travis/Projects/fabled10x/.env`:
   `DATABASE_URL=postgresql://fabled10x_app:QvbiSZCK6G6QSyGmekU5Q5ZWUIuS8l8P@127.0.0.1:5432/fabled10x`
   (plus all `AUTH_*`, `RESEND_*`, `STRIPE_*`, `NEXT_PUBLIC_STRIPE_*` from your
   secret store — see `/home/travis/Projects/fabled10x/.env.example` for the
   full list).
2. If the old docker-compose Postgres has data worth keeping, `pg_dump` it and
   restore into the shared DB **before** running migrations. Otherwise skip.
3. `npm run db:migrate` (or whatever the Drizzle migrate script is — check
   `package.json` scripts).
4. Once verified, **stop and remove** the docker-compose Postgres so it isn't
   eating RAM: `docker compose down` (confirm the dump exists first).

```bash
npm run build
```

`/etc/systemd/system/fabled10x.service` — `next start`, port 3000:
```ini
[Unit]
Description=fabled10x Next.js
After=network.target postgresql.service

[Service]
User=travis
WorkingDirectory=/home/travis/Projects/fabled10x
Environment=PORT=3000
Environment=NODE_ENV=production
ExecStart=/home/travis/.nvm/versions/node/v22/bin/npm start
Restart=always
EnvironmentFile=/home/travis/Projects/fabled10x/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now fabled10x
```

**Validate:** `systemctl status fabled10x` is running; `curl -s 127.0.0.1:3000`
returns the homepage. Confirm only **one** Postgres is running (`sudo ss -ltnp | grep 5432`).

---

## PHASE 6 — Nginx reverse proxy + TLS

Create one server block per domain in `/etc/nginx/sites-available/`, symlink to
`sites-enabled/`, proxying to the right local port:

- `timewave2.com` → Nuxt SSR `127.0.0.1:3001`, with `/api/` → `127.0.0.1:8000`
- `fabled10x.com` (+ `www`) → `127.0.0.1:3000`

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Issue certs (only after DNS resolves — see Phase 7):

```bash
sudo certbot --nginx -d timewave2.com -d www.timewave2.com -d fabled10x.com -d www.fabled10x.com
```

**Validate:** `sudo nginx -t` passes; `curl -I https://fabled10x.com` returns 200.

---

## PHASE 7 — DNS (HUMAN, at the registrar)

Not done in Hetzner Cloud — at your domain registrar:
- `fabled10x.com` → A record → `5.78.65.127`; `www` → CNAME → `fabled10x.com`
- `timewave2.com` → A record → `5.78.65.127`; `www` → CNAME → `timewave2.com`

Wait for propagation, then run the certbot step in Phase 6.

---

## PHASE 8 — Backups & safety net

1. **Hetzner image Backups** — enable in the Cloud console (≈20% of server price).
   Disk-level, good for full-box rollback.
2. **Postgres logical backups** — disk snapshots are NOT a DB backup. Add a cron:
   ```bash
   # /etc/cron.d/pg-backup  (daily, both DBs)
   0 3 * * * travis pg_dump fabled10x | gzip > /home/travis/backups/fabled10x-$(date +\%F).sql.gz
   15 3 * * * travis pg_dump timewave2 | gzip > /home/travis/backups/timewave2-$(date +\%F).sql.gz
   ```
3. Before any risky change, take a Hetzner snapshot first.

---

## FINAL VALIDATION

Run all of these and report results:

```bash
free -h                                   # confirm steady use well under 16 GB, no swap
systemctl status timewave2-api timewave2-nuxt timewave2-arq fabled10x nginx postgresql redis-server
sudo ss -ltnp | grep -E ':(80|443|3000|3001|8000|5432|6379)'
curl -I https://fabled10x.com
curl -I https://timewave2.com
```

Expected: every service `active (running)`, RAM comfortably under budget, both
sites returning 200 over HTTPS, exactly one Postgres on 5432.

---

## NOTES

- This runbook assumes Claude Code runs **on the server** as `travis` (the
  pattern used for the Party Masters box). If you instead drive it from your
  local codebase sandbox, it should execute these steps over SSH to `5.78.65.127`.
- TLS uses Nginx + certbot to match the Timewave2 stack. If you'd rather not
  hand-manage certs, Caddy with on-demand TLS is a drop-in alternative for the
  reverse-proxy layer.
- Ports, package manager, and service entrypoints are pinned in the
  **Credentials / Values Vault** at the top. Update there if anything changes.
