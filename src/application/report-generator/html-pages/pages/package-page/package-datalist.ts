import type { PackagePageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { datalist } from "../../atoms/datalist";

export function packageDatalist({ name, shortPath, entryPointLinkData, parentPackageLinkData }: PackagePageViewModel) {
	return datalist({
		items: [
			{ label: "Name", value: name, title: shortPath },
			{ label: "Entry point", value: a(entryPointLinkData) },
			{
				label: "Parent package",
				value: parentPackageLinkData ? a(parentPackageLinkData) : "",
			},
		],
	});
}
