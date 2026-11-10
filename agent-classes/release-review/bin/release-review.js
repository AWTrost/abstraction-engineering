#!/usr/bin/env node
import { main } from "../dist/release-review/cli.js";

process.exitCode = main(process.argv.slice(2));
