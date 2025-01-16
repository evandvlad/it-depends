let idIndex = 0;

export function createId() {
	return [Math.random(), Date.now(), ++idIndex].join("-");
}
