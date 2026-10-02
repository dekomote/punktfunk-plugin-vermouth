# @punktfunk/plugin-vermouth

Adds the games in your [Vermouth](https://github.com/dekomote/vermouth) launcher to a [Punktfunk](https://punktfunk.unom.io/en/)
host's library, and launches each one through Vermouth (`vermouth --launch-id <uuid>`), so Proton /
Wine / umu / launch options / MangoHud settings you configured in Vermouth apply as usual.

```sh
punktfunk-host plugins add @punktfunk/plugin-vermouth
```

- Reads `~/.config/vermouth/apps.json` (or the Flatpak's `~/.var/app/com.dekomote.vermouth/...`).
  Hidden entries are skipped. Entry ids are Vermouth's own UUIDs, so they stay stable.
- `vermouth --launch-id` runs headless and exits with the game, so the stream session ends when
  you quit.
- Settings (Library → Game sources → Vermouth): native vs Flatpak install, custom config folder.
- Art: Vermouth's cached grid / hero / logo images are passed as `file://` URLs for the host to serve (needs read access to Vermouth's `assets` folder, requested via the console).

```sh
punktfunk-plugin-vermouth detect
punktfunk-plugin-vermouth scan --preview
bun install && bun run typecheck && bun test && bun run build
```
