import type { PackagePageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { datalist } from "../../atoms/datalist";

export function packageDatalist({ fullPath, entryPointLinkData, parentPackageLinkData }: PackagePageViewModel) {
	return datalist({
		items: [
			{ label: "Full path", value: fullPath },
			{ label: "Entry point", value: a(entryPointLinkData) },
			{
				label: "Parent package",
				value: parentPackageLinkData ? a(parentPackageLinkData) : "",
			},
		],
	});
}
