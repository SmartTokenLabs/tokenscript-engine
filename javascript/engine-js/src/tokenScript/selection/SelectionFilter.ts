import {ITokenIdContext, ITokenScript} from "../../ITokenScript";
import {Lexer, Parser, Token} from "./FilterParser";

/**
 * SelectionFilter represents the filter attribute on ts:selection element
 * This class contains logic for parsing the filter string and evaluating the condition/s to true or false
 */
export class SelectionFilter {

	private tokens: Token[];

	constructor(private tokenScript: ITokenScript, private filter: string) {
		this.tokens = new Lexer().tokenize(this.filter);
	}

	/**
	 * Evaluate the filter condition
	 * @param tokenContext
	 */
	public async satisfiesFilter(tokenContext: ITokenIdContext){
		return this.parse(tokenContext);
	}

	public async parse(tokenContext?: ITokenIdContext): Promise<boolean> {
		// Note: The lexer tokens are modified inside the parser, so we need to make a copy
		return await (new Parser(this.tokenScript, tokenContext, [...this.tokens]).parse());
	}
}
