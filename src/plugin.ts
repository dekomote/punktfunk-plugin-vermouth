// The Vermouth library source: the games in your Vermouth launcher, in the host's library.
import * as os from "node:os";
import * as path from "node:path";
import {
	defineLibraryPlugin,
	fileUrl,
	isDir,
	isFile,
	readJsonCapped,
} from "@punktfunk/plugin-kit/library";
import type { ProviderEntry } from "@punktfunk/plugin-kit/wire";
import { Effect, Schema } from "effect";

const VermouthConfig = Schema.Struct({
	/** Which Vermouth install to read, when both exist. */
	install: Schema.Literals(["auto", "native", "flatpak"])
		.annotate({
			title: "Vermouth install",
			description:
				"Which Vermouth to read and launch through. Auto prefers the native install and falls back to the Flatpak.",
		})
		.pipe(
			Schema.withDecodingDefaultKey(Effect.succeed("auto" as const), {
				encodingStrategy: "omit",
			}),
		),
	/** Where Vermouth keeps its config, when it isn't in one of the standard places. */
	configRoot: Schema.optionalKey(
		Schema.String.annotate({
			title: "Vermouth config folder",
			description:
				"Absolute path to the folder holding apps.json. Leave empty to find it automatically. Launching still goes through the install above.",
		}),
	),
});

type Config = typeof VermouthConfig.Type;
export type Install = "native" | "flatpak";

export interface Root {
	readonly dir: string;
	readonly install: Install;
}

/** Candidate config roots, in preference order. */
export const rootCandidates = (cfg: {
	install?: "auto" | "native" | "flatpak";
	configRoot?: string;
}): Root[] => {
	const home = os.homedir();
	const xdg = process.env.XDG_CONFIG_HOME || path.join(home, ".config");
	const native: Root = { dir: path.join(xdg, "vermouth"), install: "native" };
	const flatpak: Root = {
		dir: path.join(home, ".var/app/com.dekomote.vermouth/config/vermouth"),
		install: "flatpak",
	};
	const mode = cfg.install ?? "auto";
	const defaults =
		mode === "native"
			? [native]
			: mode === "flatpak"
				? [flatpak]
				: [native, flatpak];
	// Trimmed: this is a path someone pasted into a settings field.
	const custom = cfg.configRoot?.trim();
	return [
		...(custom
			? [
					{
						dir: custom,
						install: mode === "flatpak" ? "flatpak" : "native",
					} as Root,
				]
			: []),
		...defaults,
	];
};

export const findRoot = (cfg: Parameters<typeof rootCandidates>[0]) =>
	rootCandidates(cfg).find((r) => isFile(path.join(r.dir, "apps.json")));

/** The fields of an `apps.json` entry that we read. */
interface VermouthApp {
	id?: unknown;
	name?: unknown;
	hidden?: unknown;
	platformSlug?: unknown;
	steamAppId?: unknown;
	gridPath?: unknown;
	heroPath?: unknown;
	logoPath?: unknown;
}

/** Art lives beside the config, under the install's data dir. */
export const assetDirs = (): string[] => {
	const home = os.homedir();
	const xdg = process.env.XDG_DATA_HOME || path.join(home, ".local/share");
	return [
		path.join(xdg, "vermouth/assets"),
		path.join(home, ".var/app/com.dekomote.vermouth/data/vermouth/assets"),
	];
};

const localArt = (v: unknown): string | null => {
	const p = text(v);
	return p && path.isAbsolute(p) && isFile(p) ? fileUrl(p) : null;
};

const text = (v: unknown): string | undefined =>
	typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;

export const appEntries = (root: Root): ProviderEntry[] => {
	const doc = readJsonCapped<unknown>(path.join(root.dir, "apps.json"));
	if (!Array.isArray(doc)) return [];
	const template = root.install === "flatpak" ? "play-flatpak" : "play";
	const seen = new Set<string>();
	const out: ProviderEntry[] = [];
	for (const row of doc as VermouthApp[]) {
		if (typeof row !== "object" || row === null) continue;
		const id = text(row.id);
		const name = text(row.name);
		if (!id || !name || row.hidden === true) continue;
		if (!/^[A-Za-z0-9._-]{1,128}$/.test(id) || seen.has(id)) continue;
		seen.add(id);
		out.push({
			external_id: id,
			title: name,
			launch: {
				kind: "exec",
				value: template,
				args: [{ name: "id", value: id }],
			},
			art: {
				portrait: localArt(row.gridPath),
				hero: localArt(row.heroPath),
				logo: localArt(row.logoPath),
			},
			platform: text(row.platformSlug) ?? "PC",
		});
	}
	return out;
};

export const plugin = defineLibraryPlugin({
	name: "vermouth",
	title: "Vermouth",
	configSchema: VermouthConfig,

	detect: (cfg: Config) => Effect.sync(() => findRoot(cfg) !== undefined),

	scan: (cfg: Config) =>
		Effect.sync(() => {
			const root = findRoot(cfg);
			return root ? appEntries(root) : [];
		}),

	wants: (cfg: Config) => [
		...rootCandidates(cfg).map((r) => r.dir),
		...assetDirs(),
	],

	watchDirs: (cfg: Config) => {
		const root = findRoot(cfg);
		return root && isDir(root.dir) ? [root.dir] : [];
	},
});
