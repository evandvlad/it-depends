import type { AbsoluteFsPath } from "../../lib/fs-path";

export interface ReportSettings {
	version: string;
	path: AbsoluteFsPath;
	staticAssetsPath: AbsoluteFsPath;
}

export type DispatcherRecord = {
	"report-generation-started": [];
};
