import type { Modules, Packages, Summary } from "../../domain";
import type { EventBusDispatcher } from "../../lib/event-bus";
import type { FSNavCursor } from "../../lib/fs-nav-cursor";
import { indexPage, modulePage, packagePage } from "./html-pages";
import { PathInformer } from "./path-informer";
import { writeReport } from "./report-writer";
import type { DispatcherRecord, ReportHtmlPagesContent, ReportSettings } from "./values";

interface Params {
	settings: ReportSettings;
	dispatcher: EventBusDispatcher<DispatcherRecord>;
	summary: Summary;
	modules: Modules;
	packages: Packages;
	fsNavCursor: FSNavCursor;
}

export type { ReportSettings, DispatcherRecord };

export async function generateReport({ settings, dispatcher, summary, modules, packages, fsNavCursor }: Params) {
	const pathInformer = new PathInformer({ rootPath: settings.path, fsNavCursor });

	dispatcher.dispatch("report-generation-started");

	const ctx = { version: settings.version, pathInformer, summary, modules, packages, fsNavCursor };

	const htmlPagesContent: ReportHtmlPagesContent = {
		index: indexPage(ctx),
		module: modules.mapValue(({ path }) => modulePage({ path }, ctx)),
		package: packages.mapValue(({ path }) => packagePage({ path }, ctx)),
	};

	await writeReport({
		pathInformer,
		htmlPagesContent,
		staticAssetsPath: settings.staticAssetsPath,
	});
}
