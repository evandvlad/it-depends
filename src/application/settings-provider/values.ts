import type { PathFilter } from "~/application/file-items-generator";
import type { ReportSettings } from "~/application/report-generator";
import type { Aliases, ExtraPackageEntries } from "~/domain";
import type { EventBusDispatcher } from "~/lib/event-bus";

interface Conf {
	version: string;
	reportStaticAssetsPath: string;
}

export interface ConfLoaderPort {
	load: () => Promise<Conf>;
}

export interface FSysPort {
	checkAccess: (path: string) => Promise<boolean>;
}

export type DispatcherPort = EventBusDispatcher<{
	"settings-preparation:started": [];
	"settings-preparation:finished": [];
}>;

export interface Settings {
	paths: string[];
	pathFilter: PathFilter;
	aliases: Aliases;
	extraPackageEntries: ExtraPackageEntries;
	report: ReportSettings | null;
}
