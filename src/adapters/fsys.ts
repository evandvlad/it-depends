import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { type AbsoluteFsPath, getParentPath, joinPaths } from "~/lib/fs-path";

type StatEntryType = "file" | "dir" | "unknown";

export class FSys {
	readFile(path: AbsoluteFsPath) {
		return readFile(path, "utf-8");
	}

	async readDir(path: AbsoluteFsPath) {
		const names = await readdir(path);
		return names.map((name) => joinPaths(path, name));
	}

	async getStatEntryType(path: AbsoluteFsPath): Promise<StatEntryType> {
		const statEntry = await stat(path);

		if (statEntry.isFile()) {
			return "file";
		}

		if (statEntry.isDirectory()) {
			return "dir";
		}

		return "unknown";
	}

	async makeDir(path: AbsoluteFsPath) {
		await mkdir(path, { recursive: true });
	}

	async removeDir(path: AbsoluteFsPath) {
		await rm(path, { recursive: true, force: true });
	}

	async writeFile(path: AbsoluteFsPath, content: string) {
		const parentPath = getParentPath(path);

		await this.makeDir(parentPath);
		await writeFile(path, content);
	}

	async copy(sourcePath: AbsoluteFsPath, destinationPath: AbsoluteFsPath) {
		await cp(sourcePath, destinationPath, { recursive: true });
	}
}
