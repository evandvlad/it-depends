import { ConfLoader } from "~/adapters/conf-loader";
import { FSys } from "~/adapters/fsys";
import { ProgramFileProcessor } from "~/adapters/program-file-processor";
import { Terminal } from "~/adapters/terminal";
import { Application, type GlobalEventBusSubscriber, type Result } from "~/application";
import { AppError } from "~/lib/errors";
import type { Options } from "~/values";

export { AppError };

export class ItDepends implements GlobalEventBusSubscriber {
	on;

	#application;

	constructor(options: Options) {
		this.#application = new Application({
			options,
			fSysPort: new FSys(),
			programFileProcessorPort: new ProgramFileProcessor(),
			confLoaderPort: new ConfLoader(__dirname),
			terminalPort: new Terminal(),
		});

		this.on = this.#application.on;
	}

	run = (): Promise<Result> => {
		return this.#application.run();
	};
}
