#!/usr/bin/env bun
import { plugin } from "./plugin.js";

if (import.meta.main) await plugin.cli();

export default plugin.def;
