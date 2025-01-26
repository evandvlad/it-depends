import { assert } from "~/lib/errors";
import { normalizePath } from "~/lib/fs-path";
import { Rec } from "~/lib/rec";
import type { ExtraPackageEntries, PathFilter } from "~/values";
import type { FSysPort } from "./values";

interface Params {
	fSysPort: FSysPort;
}

export class OptionProcessor {
	#fSysPort;

	constructor({ fSysPort }: Params) {
		this.#fSysPort = fSysPort;
	}

	async processPaths(paths: string[]) {
		const baseErrorMessage = "Option 'paths' should be an array fulfilled with real absolute paths.";
		const processedPaths: string[] = [];

		assert(paths.length > 0, baseErrorMessage);

		for await (const path of paths) {
			assert(this.#fSysPort.isAbsolutePath(path), `${baseErrorMessage} Path '${path}' is not absolute.`);

			assert(
				await this.#fSysPort.checkAccess(path),
				`${baseErrorMessage} Path '${path}' doesn't exist or is not accessible.`,
			);
			processedPaths.push(normalizePath(path));
		}

		return processedPaths;
	}

	processPathFilter(filter?: PathFilter) {
		return filter ?? (() => true);
	}

	async processAliases(rawAliases?: Record<string, string>) {
		const aliases = new Rec<string, string>();

		if (!rawAliases) {
			return aliases;
		}

		const baseErrorMessage = "Option 'aliases' should be a record of names and real absolute paths.";

		for await (const [name, path] of Object.entries(rawAliases)) {
			assert(
				this.#fSysPort.isAbsolutePath(path),
				`${baseErrorMessage} Path '${path}' for name '${name}' is not absolute.`,
			);

			assert(
				await this.#fSysPort.checkAccess(path),
				`${baseErrorMessage} Path '${path}' for '${name}' doesn't exist or is not accessible.`,
			);

			aliases.set(name, normalizePath(path));
		}

		return aliases;
	}

	async processExtraPackageEntries(rawEntries?: Partial<ExtraPackageEntries>) {
		const entries = {
			fileNames: [],
			filePaths: [],
			...rawEntries,
		} as ExtraPackageEntries;

		if (entries.filePaths.length === 0) {
			return entries;
		}

		const baseErrorMessage =
			"Option 'extraPackageEntries.filePaths' should be an array fulfilled with real absolute paths";

		const processedFilePaths: string[] = [];

		for await (const path of entries.filePaths) {
			assert(this.#fSysPort.isAbsolutePath(path), `${baseErrorMessage} Path '${path}' is not absolute.`);

			assert(
				await this.#fSysPort.checkAccess(path),
				`${baseErrorMessage} Path '${path}' doesn't exist or is not accessible.`,
			);

			processedFilePaths.push(normalizePath(path));
		}

		entries.filePaths = processedFilePaths;

		return entries;
	}

	async processReport(report?: { path: string }) {
		if (!report) {
			return null;
		}

		const baseErrorMessage = "Option 'report.path' should be a real absolute path.";

		assert(this.#fSysPort.isAbsolutePath(report.path), `${baseErrorMessage} Path '${report.path}' is not absolute.`);

		assert(
			await this.#fSysPort.checkAccess(report.path),
			`${baseErrorMessage} Path '${report.path}' doesn't exist or is not accessible.`,
		);

		return {
			path: normalizePath(report.path),
		};
	}
}
