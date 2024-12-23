import type { Modules, Packages, Summary } from "../../domain";
import type { FSNavCursor } from "../../lib/fs-nav-cursor";
import type { AbsoluteFsPath } from "../../lib/fs-path";
import type { Rec } from "../../lib/rec";
import type { PathInformer } from "./path-informer";

export const reportHtmlPagesContentTypes = ["index", "module", "package"] as const;

export type ReportHtmlPageContentType = (typeof reportHtmlPagesContentTypes)[number];

export interface ReportHtmlPagesContent
	extends Record<ReportHtmlPageContentType, string | Rec<AbsoluteFsPath, string>> {
	index: string;
	module: Rec<AbsoluteFsPath, string>;
	package: Rec<AbsoluteFsPath, string>;
}

export interface ReportSettings {
	version: string;
	path: AbsoluteFsPath;
	staticAssetsPath: AbsoluteFsPath;
}

export type DispatcherRecord = {
	"report-generation-started": [];
};

export interface ComponentContext {
	version: string;
	modules: Modules;
	packages: Packages;
	summary: Summary;
	fsNavCursor: FSNavCursor;
	pathInformer: PathInformer;
}
