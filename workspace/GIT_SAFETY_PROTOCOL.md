# Git Safety Protocol

**Purpose:** Prevent loss of work during commits. This protocol exists because `git reset --hard` has wiped working files twice before.

---

## 🛑 NEVER DO THESE

1. **NEVER use `git reset --hard`** - It wipes uncommitted work. Period.
2. **NEVER commit `.openclaw/`** - Contains API keys, session logs, credentials
3. **NEVER commit without checking `git status` first**
4. **NEVER commit in response to secret-scanning errors** - Fix the staging, don't reset

---

## ✅ SAFE COMMIT WORKFLOW

### Step 1: Inspect Before Staging
```powershell
git status
git status --short
```
See what's changed. Know what you're touching.

### Step 2: Stage Selectively
```powershell
# Stage specific safe files/directories
git add MEMORY.md AGENTS.md SOUL.md USER.md TOOLS.md IDENTITY.md HEARTBEAT.md
git add memory/
git add workspace/dashboard/
git add workspace/MODEL_ROUTING.md

# NEVER do this:
# git add -A  (stages everything including secrets)
```

### Step 3: Verify Staged Content
```powershell
git status
git diff --staged --name-only
```
Confirm only safe files are staged.

### Step 4: Commit
```powershell
git commit -m "Clear message about what changed"
```

### Step 5: Push
```powershell
git push origin main
```

---

## 🚨 IF GITHUB BLOCKS PUSH (Secret Scanning)

**DO NOT RESET. DO NOT PANIC.**

1. **Unstage everything (soft, safe):**
   ```powershell
   git reset
   ```
   This only unstages - does NOT touch working directory files.

2. **Check what triggered the block:**
   - GitHub error message tells you which file/path had secrets
   - Usually `.openclaw/`, session logs, or config files

3. **Re-stage ONLY safe files:**
   ```powershell
   git add MEMORY.md AGENTS.md memory/ workspace/dashboard/
   ```

4. **Amend or recommit:**
   ```powershell
   git commit -m "Same message"
   git push origin main
   ```

---

## 📦 .GITIGNORE RULES

The `.gitignore` must aggressively exclude:

- `.openclaw/` - ALL of it (API keys, sessions, credentials)
- `*.env`, `*.key`, `*.secret` - Any secret files
- `workspace/state/*.json` - Live state files that change every sync
- `*.local.json` - Local config with secrets
- `credentials.json` - Obvious secret storage

**If it has keys, tokens, or session data → it's ignored.**

---

## 🔄 BACKUP BEFORE RISKY OPERATIONS

Before ANY git operation that might affect working directory:

```powershell
# Copy uncommitted files to temp backup
robocopy E:\openclaw\workspace\dashboard E:\openclaw\.backup\dashboard /E
robocopy E:\openclaw\memory E:\openclaw\.backup\memory /E
```

Or commit to a **feature branch** first:
```powershell
git checkout -b backup-before-commit-2026-04-08
git add .
git commit -m "Backup point"
git checkout main
```

---

## 🧪 TEST COMMITS LOCALLY

Before pushing to GitHub:
```powershell
# Verify commit looks right
git log -1 --stat
git show --name-only HEAD
```

---

## 📝 COMMIT CHECKLIST

Before every commit, verify:

- [ ] `git status` shows only intended files
- [ ] No `.openclaw/` files staged
- [ ] No `*.env`, `*.key`, `*.secret` files staged
- [ ] No state files that change every sync
- [ ] Commit message is clear and useful
- [ ] Backup exists if this is a large/risky change

---

## 🔧 RECOVERY IF WORK GETS WIPED

If files are lost:

1. **Check git reflog:**
   ```powershell
   git reflog
   git show HEAD~1:path/to/file > recovered_file
   ```

2. **Check Memory Palace:**
   - Wings may have captured decisions/context
   - Daily journals may have relevant info

3. **Check browser cache:**
   - For dashboard/assets, browser may have cached versions

4. **Ask the user:**
   - They may have backups you don't know about

---

## 🎯 CORE PRINCIPLE

**Working directory files > Git history.**

If git and working directory conflict, preserve the working directory. Git can be fixed. Lost work cannot.

---

*This protocol was created after two incidents where `git reset --hard` wiped uncommitted work. Never again.*
