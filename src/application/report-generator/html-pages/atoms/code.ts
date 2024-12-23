interface Params {
	content: string;
}

export function code({ content }: Params) {
	return `<pre class="code"><code>${content}</code></pre>`;
}
