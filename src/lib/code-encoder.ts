export function encodeHTML(code: string) {
	return code
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;")
		.replaceAll("\t", "&nbsp;".repeat(4))
		.replaceAll("\n", "&nbsp;");
}
