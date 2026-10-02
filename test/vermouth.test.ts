import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { appEntries, rootCandidates } from "../src/plugin.js";

let dir: string;

beforeAll(() => {
	dir = fs.mkdtempSync(path.join(os.tmpdir(), "pf-vermouth-"));
	fs.writeFileSync(
		path.join(dir, "apps.json"),
		JSON.stringify([
			{
				id: "e7808d7e-ef2e-4a4b-9bb5-fdcc0568d8a8",
				name: " World of Warcraft ",
				platformSlug: "",
			},
			{
				id: "88f7f805-52ee-488c-931c-23bb8b7d7a37",
				name: "Hidden",
				hidden: true,
			},
			{ id: "aaaa", name: "SNES Game", platformSlug: "snes" },
			{ id: "aaaa", name: "Duplicate id" },
			{ id: "bad id; rm -rf", name: "Unsafe id" },
			{ name: "No id" },
			null,
		]),
	);
});
afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

describe("appEntries", () => {
	test("maps visible entries to exec launches and drops the rest", () => {
		const out = appEntries({ dir, install: "native" });
		expect(out.map((e) => e.title)).toEqual(["World of Warcraft", "SNES Game"]);
		expect(out[0]).toMatchObject({
			external_id: "e7808d7e-ef2e-4a4b-9bb5-fdcc0568d8a8",
			platform: "PC",
			launch: {
				kind: "exec",
				value: "play",
				args: [{ name: "id", value: "e7808d7e-ef2e-4a4b-9bb5-fdcc0568d8a8" }],
			},
		});
		expect(out[1]?.platform).toBe("snes");
	});

	test("existing art files become file:// urls, missing ones null", () => {
		const grid = path.join(dir, "a b.png");
		fs.writeFileSync(grid, "x");
		fs.writeFileSync(
			path.join(dir, "apps.json"),
			JSON.stringify([
				{ id: "g1", name: "G", gridPath: grid, heroPath: "/nope.png" },
			]),
		);
		const art = appEntries({ dir, install: "native" })[0]?.art;
		expect(art?.portrait).toBe(`file://${dir}/a%20b.png`);
		expect(art?.hero).toBeNull();
		expect(art?.logo).toBeNull();
	});

	test("flatpak installs use the flatpak template", () => {
		const out = appEntries({ dir, install: "flatpak" });
		expect(out[0]?.launch?.value).toBe("play-flatpak");
	});

	test("a missing apps.json is an empty library", () => {
		expect(
			appEntries({ dir: path.join(dir, "nope"), install: "native" }),
		).toEqual([]);
	});
});

describe("rootCandidates", () => {
	test("a custom root goes first and auto lists native before flatpak", () => {
		const r = rootCandidates({ install: "auto", configRoot: " /x/vermouth\n" });
		expect(r[0]?.dir).toBe("/x/vermouth");
		expect(r.map((x) => x.install)).toEqual(["native", "native", "flatpak"]);
	});
});
