# GitHub Upload Guide — Himanshu Portfolio

## Repository
**URL:** https://github.com/himanshunarwaria/himanshu-portfolio
**Branch:** main
**Local folder:** `d:\Himanshu Design\PortFolio Figma\02 Claude26\Himanshu 06`

---

## One-time Setup (already done — skip this)
```bash
git init
git config user.name "Himanshu Narwaria"
git config user.email "himanshunarwaria.work@gmail.com"
git remote add origin https://TOKEN@github.com/himanshunarwaria/himanshu-portfolio.git
```

---

## Every Time You Make Changes

Open **Git Bash** in the project folder, then run:

```bash
# 1. See what changed
git status

# 2. Stage all changes (new files, edits, deletions)
git add -A

# 3. Commit with a message describing what you did
git commit -m "your message here"

# 4. Push to GitHub
git push
```

### Example — after adding new social media images:
```bash
git add -A
git commit -m "Add Nomme social media images"
git push
```

---

## Updating Your Token (do this when token expires)

1. Go to https://github.com/settings/tokens → generate new classic token → check `repo`
2. Run this once with the new token:
```bash
git remote set-url origin https://YOUR_NEW_TOKEN@github.com/himanshunarwaria/himanshu-portfolio.git
```

---

## Enable GitHub Pages (to host the site live)

1. Go to https://github.com/himanshunarwaria/himanshu-portfolio/settings/pages
2. Under **Source** → select **Deploy from a branch**
3. Branch: **main** → folder: **/ (root)**
4. Click **Save**
5. Your site will be live at: `https://himanshunarwaria.github.io/himanshu-portfolio/`

---

## Useful Commands

| Command | What it does |
|---|---|
| `git status` | See all changed/new files |
| `git add -A` | Stage everything |
| `git add images/social-media/nomme/` | Stage only a specific folder |
| `git commit -m "message"` | Save a snapshot with a label |
| `git push` | Upload to GitHub |
| `git log --oneline` | See history of all commits |
| `git diff` | See exactly what lines changed |

---

## Adding a New Brand (future workflow)

1. Add HTML file to the right folder (`social-media/`, `meta-ads/`, `listing/`)
2. Add images to `images/[category]/[brand]/`
3. Run:
```bash
git add -A
git commit -m "Add [BrandName] social media page"
git push
```

---

## ⚠️ Security Reminder
- Never share your Personal Access Token publicly
- Regenerate at: https://github.com/settings/tokens
- Tokens expire — regenerate and update remote URL when they do
