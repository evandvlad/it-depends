import { describe, expect, it } from "@jest/globals";
import { encodeHTML } from "../code-encoder";

describe("code-encoder", () => {
	it("should encode to html correctly", () => {
		const code = `<div>&'"</div>`;
		expect(encodeHTML(code)).toEqual("&lt;div&gt;&amp;&apos;&quot;&lt;/div&gt;");
	});
});
