import { access, cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { getParentPath, joinPaths } from "~/lib/fs-path";

type StatEntryType = "file" | "dir" | "unknown";

export class FSys {
	readFile(path: string) {
		return readFile(path, "utf-8");
	}

	async readDir(path: string) {
		const names = await readdir(path);
		return names.map((name) => joinPaths(path, name));
	}

	async getStatEntryType(path: string): Promise<StatEntryType> {
		const statEntry = await stat(path);

		if (statEntry.isFile()) {
			return "file";
		}

		if (statEntry.isDirectory()) {
			return "dir";
		}

		return "unknown";
	}

	async makeDir(path: string) {
		await mkdir(path, { recursive: true });
	}

	async removeDir(path: string) {
		await rm(path, { recursive: true, force: true });
	}

	async writeFile(path: string, content: string) {
		const parentPath = getParentPath(path);

		await this.makeDir(parentPath);
		await writeFile(path, content);
	}

	async copy(sourcePath: string, destinationPath: string) {
		await cp(sourcePath, destinationPath, { recursive: true });
	}

	async checkAccess(path: string) {
		try {
			await access(path);
			return true;
		} catch {
			return false;
		}
	}
}
