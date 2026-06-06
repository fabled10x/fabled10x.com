# Z5 — Your Learning Environment · Slides

**Runtime target:** 20–25 min
**Pillar:** Workflow
**Episode:** Z5 (Act 1: Orientation)
**Deck length:** 26 slides

---

## Slide 1 — Title

# Z5 — Your Learning Environment
### One evening. Four accounts. Zero friction for 35 episodes.

*[Visual: Series card, Z5. Badge: "Last episode of Act 1".]*

---

## Slide 2 — The promise

## By the end of this episode, you will have:

- A code editor
- A place to keep your code (GitHub)
- Access to an AI coding tool
- A way to put your code on the internet (Vercel)
- A first real commit you can see online

**All free. About 30 minutes. Never set up again.**

---

## Slide 3 — Why do this now

## Setup is boring. Setup compounds.

- If you skip, every future episode gets harder
- If you do it once, you never think about it again
- We get the boring part out of the way before we touch code

**Do the setup. Future-you will thank present-you.**

---

## Slide 4 — What we're installing

| Tool | Role | Free? |
|------|------|-------|
| **VS Code** | Code editor | Yes |
| **GitHub** | Store + share code | Yes |
| **Claude Code** | AI coding tool | Free tier |
| **Vercel** | Deploy to the internet | Free tier |
| **Terminal** | Already installed | Yes |
| **git** | Version control (installs with VS Code) | Yes |

---

## Slide 5 — Part 1 — VS Code

*[Visual: Section header slide. VS Code logo.]*

---

## Slide 6 — Install VS Code

1. Go to **code.visualstudio.com**
2. Click "Download" (it detects your OS)
3. Open the installer
4. Accept the defaults (don't customize yet)

**On Mac:** drag to Applications.
**On Windows:** run the .exe, check "Add to PATH."
**On Linux:** the `.deb` or `.rpm` package works.

*[Visual: Screenshot of the download page with arrow on download button.]*

---

## Slide 7 — First open

*[Visual: Screen recording — first launch of VS Code. Annotations call out the four panels.]*

**Four panels to know:**
- **Explorer** (left) — your files
- **Editor** (center) — your code
- **Terminal** (bottom) — your command line
- **Command Palette** (Cmd/Ctrl+Shift+P) — everything, searchable

**Don't customize anything yet.**

---

## Slide 8 — Part 2 — GitHub

*[Visual: Section header. GitHub octocat.]*

---

## Slide 9 — Create account

1. Go to **github.com**
2. Click "Sign up"
3. Pick a username you can live with (it's public)
4. Verify your email

*[Visual: GitHub signup page with arrow on the big green button.]*

---

## Slide 10 — Create your first repo

1. Click "+" (top right) → "New repository"
2. Name it: **zero-to-10x-learning**
3. Description: "My learning repo for the Zero to 10X curriculum"
4. Public
5. Check **"Add a README file"**
6. Click "Create repository"

**You now have a repository. Congratulations — you're a GitHub user.**

*[Visual: Screen recording of the repo creation form.]*

---

## Slide 11 — Part 3 — Claude Code

*[Visual: Section header. Claude logo.]*

---

## Slide 12 — Why Claude Code for this curriculum

- **Agent-based** — can take multi-step actions
- **Fits our workflow** — integrates with the pipeline/skills we use later
- **Free tier is enough** for learning through Act 4
- **Not a sponsorship** — it's the tool I use for real work

*If you prefer Cursor, Copilot, or Codex — most things in this curriculum transfer. We'll revisit in Z10.*

---

## Slide 13 — Install Claude Code

1. Go to **claude.ai** → sign up
2. Go to **claude.com/claude-code** → follow the install guide
3. In your terminal: `claude --version`
4. Authenticate (browser window pops open)

**If you get "command not found," restart your terminal.**

*[Visual: Terminal recording of install + first `claude --version` output.]*

---

## Slide 14 — Part 4 — Vercel

*[Visual: Section header. Vercel triangle.]*

---

## Slide 15 — Sign up for Vercel

1. Go to **vercel.com** → "Sign Up"
2. Choose **"Continue with GitHub"** (reuses your GitHub account)
3. Authorize Vercel to read your repos
4. Done

**We won't deploy anything yet. Just connected.**

*[Visual: Screen recording of the signup + auth flow.]*

---

## Slide 16 — Part 5 — Terminal

*[Visual: Section header. Terminal prompt icon.]*

---

## Slide 17 — Your terminal already exists

- **Mac:** Cmd+Space, type "Terminal"
- **Windows:** Search "Windows Terminal" (install from Microsoft Store if missing)
- **Linux:** Ctrl+Alt+T (usually)

*[Visual: Screenshots of terminals on each OS.]*

**You don't need to love it. You need to be able to open it.**

---

## Slide 18 — Check what you have

In your terminal, run these:

```bash
node --version
git --version
claude --version
```

**If any one fails → fix that one before moving on.**

*(Node usually comes preinstalled on Mac. On Windows/Linux, install from nodejs.org.)*

---

## Slide 19 — Part 6 — Your first commit

*[Visual: Section header. Small celebration icon.]*

---

## Slide 20 — Clone the repo

```bash
cd ~/Documents
git clone https://github.com/YOUR-USERNAME/zero-to-10x-learning.git
cd zero-to-10x-learning
code .
```

**Translation:**
- Go to Documents folder
- Download a copy of your repo
- Go into it
- Open it in VS Code

*[Visual: Terminal recording. Each command annotated.]*

---

## Slide 21 — Edit the README

Open `README.md` in VS Code. Add this line:

```markdown
Started this curriculum on 2026-04-14.
```

**Save with Cmd/Ctrl+S.**

---

## Slide 22 — Commit and push

```bash
git add .
git commit -m "Add start date to README"
git push
```

**Translation:**
- Stage your changes
- Save a checkpoint with a message
- Upload it to GitHub

*[Visual: Terminal recording showing each command + output.]*

---

## Slide 23 — See it on GitHub

Refresh your GitHub repo page.

**Your README updated. Your commit is listed. You just used git.**

*[Visual: Screenshot of the GitHub page with the new commit highlighted.]*

---

## Slide 24 — Part 7 — Your first AI prompt

Inside the repo in your terminal:

```bash
claude
```

**Then type:**

> "Create a simple index.html file with a heading that says 'Hello, Zero to 10X' and one paragraph below it."

*[Visual: Terminal recording of Claude Code producing the file.]*

---

## Slide 25 — Feel what just happened

- You typed natural language
- An agent produced real files
- You can open them, edit them, commit them

**You just did, in about 30 seconds, a task that 15 years ago was an entry-level job interview.**

*Don't review the output yet. We start reviewing in Z15. Today — just feel it.*

---

## Slide 26 — Close

## You have a developer environment.
## Every future episode uses it.
## Don't break it. Move on.

**Next up: Act 2 — The Tools. Starting with Z6, the terminal.**

*[Visual: End card. Z6 preview. Badge: "Act 1 complete."]*
