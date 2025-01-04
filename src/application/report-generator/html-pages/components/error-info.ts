interface Params {
	error: Error;
}

export function errorInfo({ error }: Params) {
	return `
		<pre class="error-info">${error.stack || error.message}</pre>
	`;
}
