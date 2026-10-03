# @dekomote/plugin-vermouth

Adds the games in your [Vermouth](https://github.com/dekomote/vermouth) launcher to a [Punktfunk](https://punktfunk.unom.io/en/)
host's library, and launches each one through Vermouth (`vermouth --launch-id <uuid>`), so Proton /
Wine / umu / launch options / MangoHud settings you configured in Vermouth apply as usual.

```sh
punktfunk-host plugins add @dekomote/plugin-vermouth --allow-public-registry
```

- Reads `~/.config/vermouth/apps.json` (or the Flatpak's `~/.var/app/com.dekomote.vermouth/...`).
  Hidden entries are skipped. Entry ids are Vermouth's own UUIDs, so they stay stable.
- `vermouth --launch-id` runs headless and exits with the game, so the stream session ends when
  you quit.
- Settings (Library → Game sources → Vermouth): native vs Flatpak install, custom config folder.
- Art: Vermouth's cached grid / hero / logo images are passed as `file://` URLs for the host to serve (needs read access to Vermouth's `assets` folder, requested via the console).

## Commands

The package installs a `punktfunk-plugin-vermouth` binary into the host's plugins folder (it is not
put on your `PATH`):

```sh
~/.config/punktfunk/plugins/node_modules/.bin/punktfunk-plugin-vermouth detect          # is Vermouth set up here?
~/.config/punktfunk/plugins/node_modules/.bin/punktfunk-plugin-vermouth scan --preview  # what WOULD be synced, as JSON
```

## Development

```sh
bun install
bun run typecheck && bun test && bun run build
bun src/index.ts scan --preview     # run the CLI from source
```

## License

MIT.
