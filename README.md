# Skills

A collection of agent skills for Qoder CLI and compatible agents.

| Skill | What it does |
| --- | --- |
| [app-design-system](app-design-system/) | Capture an app's visual language from a web URL, screenshots, or a running desktop window, and turn it into a reusable design system: semantic tokens, type/space/radius scales, component atoms, rules, and a verifier. |

## Install

Copy a skill folder into a skills directory, then reload skills.

- User level: `~/.qoder/skills/<skill-name>/` (Windows: `C:\Users\<you>\.qoder\skills\<skill-name>\`)
- Project level: `.qoder/skills/<skill-name>/`

Run `/skills reload` (or restart the session) and invoke it with `/<skill-name>`.

```bash
git clone https://github.com/CarlOpenLab/skills.git
cp -r skills/app-design-system ~/.qoder/skills/
```

## Requirements

- Node.js 18+ for `verify.mjs` and `palette.mjs`
- Windows PowerShell for `capture-window.ps1` (desktop capture)
- The `ego-browser` skill for web capture (optional but recommended)

## Validate

```bash
node app-design-system/scripts/verify.mjs app-design-system/assets/starter app-design-system/assets/examples/linear
```

The verifier reads the project's own `tokens.css` and reports raw colors, off-scale radii/font sizes/spacing, and long transitions.

## Adding a skill

1. Create `<skill-name>/SKILL.md` with `name` and `description` frontmatter.
2. Put supporting material in `references/`, `assets/`, `snippets/`, and `scripts/`.
3. Run the verifier and add the skill to the table above.

## License

MIT © 2026 CarlOpenLab
