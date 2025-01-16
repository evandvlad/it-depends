"use strict";

(function () {
	function initFiltrableLists() {
		const containerDataAttribute = "data-js-filtrable-list";
		const filterInputDataAttribute = "data-js-filtrable-list-input";
		const modeSwitchDataAttribute = "data-js-filtrable-list-mode-switch";
		const listItemDataAttribute = "data-js-filtrable-list-item";
		const listItemValueDataAttribute = "data-js-value";

		function createFilter({ filterValue, isRegExpMode }) {
			if (isRegExpMode) {
				const regExp = new RegExp(filterValue);
				return (value) => regExp.test(value);
			}

			return (value) => value.includes(filterValue);
		}

		function filterItems({ listItems, state }) {
			const filter = createFilter(state);

			listItems.forEach((listItem) => {
				const value = listItem.getAttribute(listItemValueDataAttribute);
				listItem.style.display = filter(value) ? "" : "none";
			});
		}

		Array.from(document.querySelectorAll(`[${containerDataAttribute}]`)).forEach((container) => {
			const id = container.getAttribute(containerDataAttribute);
			const filterInput = container.querySelector(`[${filterInputDataAttribute}="${id}"]`);
			const listItems = Array.from(container.querySelectorAll(`[${listItemDataAttribute}="${id}"]`));
			const modeSwitch = container.querySelector(`[${modeSwitchDataAttribute}="${id}"]`);

			if (!filterInput || !modeSwitch || !listItems.length) {
				return;
			}

			const state = {
				filterValue: "",
				isRegExpMode: false,
			};

			filterInput.addEventListener("input", (e) => {
				state.filterValue = e.target.value;
				filterItems({ listItems, state });
			});

			modeSwitch.addEventListener("click", (e) => {
				state.isRegExpMode = e.target.checked;
				filterItems({ listItems, state });
			});
		});
	}

	initFiltrableLists();
})();

