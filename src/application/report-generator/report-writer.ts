import { AppError } from "~/lib/errors";
import type { Rec } from "~/lib/rec";
import type { FSysPort } from "./values";

interface Params {
	fSysPort: FSysPort;
	rootPath: string;
	assetsPath: string;
	staticAssetsPath: string;
	htmlPages: Rec<string, string>;
}

export async function writeReport({ fSysPort, rootPath, assetsPath, staticAssetsPath, htmlPages }: Params) {
	try {
		await fSysPort.removeDir(rootPath);
		await fSysPort.makeDir(rootPath);
	} catch (e) {
		throw new AppError(`Can't create the directory '${rootPath}' for the report.`, { cause: e as Error });
	}

	await fSysPort.copy(staticAssetsPath, assetsPath);

	await Promise.all(htmlPages.toEntries().map(([path, html]) => fSysPort.writeFile(path, html)));
}
