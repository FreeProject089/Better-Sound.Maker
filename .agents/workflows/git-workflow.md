---
description: Complete Git workflow for multi-branch management, issues, features, and merges.
---

# Git Workflow - Better ModMaker

This document defines the development cycle and collaboration rules for the project.

## 1. Branch Structure

| Branch | Role | Source | Destination |
| :--- | :--- | :--- | :--- |
| `main` | Production (Stable) | - | - |
| `develop` | Integration (Unstable) | `main` | `main` (via Release) |
| `feature/*` | New features | `develop` | `develop` |
| `fix/*` | Bug fixes | `develop` | `develop` |
| `hotfix/*` | Urgent patches | `main` | `main` & `develop` |

## 2. Standard Process

### Step 1: Issue & Discussion
- Before any coding, create an **Issue** to describe the requirement or bug.
- For major architectural changes, use the **Discussions** tab.

### Step 2: Branch Creation
// turbo
1. Switch to `develop`: `git checkout develop`
2. Pull latest changes: `git pull origin develop`
3. Create your branch: `git checkout -b feature/my-new-feature` (or `fix/bug-name`)

### Step 3: Development & Commits
- Work on your files.
- Make atomic commits: `git commit -m "feat: added sound management"`
- Use prefixes: `feat:`, `fix:`, `docs:`, `refactor:`, `style:`.

### Step 4: Push & Merge
1. Push your branch: `git push origin feature/my-new-feature`
2. Open a **Pull Request** (PR) targeting the `develop` branch.
3. Ensure tests pass and request a review.
4. Once approved, merge using **Squash and Merge**.

## 3. Golden Rules
- **Never** push directly to `main` or `develop`.
- Always link a PR to an Issue (e.g., `Fixes #123` in the description).
- Clean up local branches after merging: `git branch -d feature/my-new-feature`.

## 4. Glossary
- **Merge**: Combining two branches.
- **Squash**: Combining all commits from a branch into a single clean commit during merge.
- **Pull Request**: Formal request to integrate code into a protected branch.
