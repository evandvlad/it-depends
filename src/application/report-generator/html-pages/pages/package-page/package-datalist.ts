import type { PackagePageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { datalist } from "../../atoms/datalist";
import { entityDropMenu } from "../../components/entity-drop-menu";

export function packageDatalist(pageViewModel: PackagePageViewModel) {
	return datalist({
		items: [
			{
				label: "Name",
				value: `<span title="${pageViewModel.shortPath}">${pageViewModel.name}</span> ${entityDropMenu(pageViewModel)}`,
			},
			{
				label: "Entry point",
				value: `${a(pageViewModel.entryPointLinkData)} ${entityDropMenu(pageViewModel.entryPointLinkData)}`,
			},
			{
				label: "Parent package",
				value: pageViewModel.parentPackageLinkData
					? `${a(pageViewModel.parentPackageLinkData)} ${entityDropMenu(pageViewModel.parentPackageLinkData)}`
					: "",
			},
		],
	});
}
