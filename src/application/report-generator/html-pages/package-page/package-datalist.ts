import type { PackagePageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { datalist } from "../atoms/datalist";

export function packageDatalist({ shortPath, entryPointLinkData, parentPackageLinkData }: PackagePageViewModel) {
	return datalist({
		items: [
			{ label: "Full path", value: shortPath },
			{ label: "Entry point", value: a(entryPointLinkData) },
			{
				label: "Parent package",
				value: parentPackageLinkData ? a(parentPackageLinkData) : "",
			},
		],
	});
}
