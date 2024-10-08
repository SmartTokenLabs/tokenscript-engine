import {ITokenIdContext, ITokenScript} from "../../ITokenScript";
import {FilterValue} from "../data/event/FilterValue";

export enum TokenType {
	Reserved = 'reserved',
	Value = 'value',
	BinaryOperator = 'binaryOperator',
	Other = 'other',
	Invalid = 'invalid',
}

export class Token {

	public readonly type: TokenType;
	public readonly value?: string;

	constructor(type: TokenType, value?: string) {
		this.type = type;
		this.value = value;
	}

	get otherValue(): string | null {
		switch (this.type) {
			case TokenType.Value:
			case TokenType.Invalid:
			case TokenType.BinaryOperator:
			case TokenType.Reserved:
				return null;
			case TokenType.Other:
				return this.value;
			default:
				return null;
		}
	}

	get valueValue(): string | null {
		switch (this.type) {
			case TokenType.Other:
			case TokenType.Invalid:
			case TokenType.BinaryOperator:
			case TokenType.Reserved:
				return null;
			case TokenType.Value:
				return this.value;
			default:
				return null;
		}
	}

	get binaryOperatorValue(): string | null {
		switch (this.type) {
			case TokenType.Value:
			case TokenType.Invalid:
			case TokenType.Other:
			case TokenType.Reserved:
				return null;
			case TokenType.BinaryOperator:
				return this.value;
			default:
				return null;
		}
	}
}

enum Operator {
	Equal = '=',
	LessThan = '<',
	GreaterThan = '>',
	LessThanOrEqual = '<=',
	GreaterThanOrEqual = '>='
	// Add other operators as needed
}

export interface AttributeWrapper {
	getAsType: () => string,
	getValue: (throwOnUndefined: boolean) => Promise<any>
}

export class ImplicitAttribute implements AttributeWrapper {

	constructor(
		private type: string,
		private value: any) {
	}

	getAsType(): string {
		return this.type;
	}

	getValue(throwOnUndefined: boolean): Promise<any> {
		return this.value;
	}
}

export class Lexer {
	private static readonly reservedTokens: string[] = ["=", "<", ">", "<=", ">=", "(", ")", "&", "|", "!"];
	private readonly reservedTokens: string[] = Lexer.reservedTokens;
	private readonly binaryOperators: string[] = ["=", "<", ">", "<=", ">="];
	private readonly escape: string = "\\";

	public constructor() {}

	public tokenize(expression: string): Token[] {
		const result: Token[] = [];
		let buffer: string[] = [];
		let escapeBuffer: string[] | null = null;
		let wasPreviousEscapedCharacter: boolean = false;

		for (const c of expression) {
			const previous = buffer.length > 0 ? buffer[buffer.length - 1] : undefined;

			if (c === this.escape && escapeBuffer === null) {
				// Start new escape
				escapeBuffer = [];
				continue;
			} else if (c === this.escape && escapeBuffer !== null) {
				if (escapeBuffer.length === 0) {
					// Invalid escape sequence with double backward slash (\\)
					if (buffer.length > 0) {
						result.push(new Token(TokenType.Value, buffer.join("")));
						buffer = [];
					}
					result.push(new Token(TokenType.Invalid, "\\\\")); // Pushing invalid token
					escapeBuffer = null;
					continue;
				} else {
					// Invalid. Start another escape sequence
					if (buffer.length > 0) {
						result.push(new Token(TokenType.Value, buffer.join("")));
						buffer = [];
					}
					result.push(new Token(TokenType.Invalid, `\\${escapeBuffer.join('')}`)); // Pushing invalid token
					escapeBuffer = [];
					continue;
				}
			} else if (escapeBuffer !== null) {
				if (escapeBuffer.length === 0){
					escapeBuffer.push(c);
					continue;
				} else if (escapeBuffer.length === 1) {
					// We have 1 character of the escape sequence already
					// Finished escaping
					escapeBuffer.push(c);
					const char = this.convertHexToCharacter(escapeBuffer.join(''));
					char.split("").map(char => buffer.push(char));
					escapeBuffer = null;
					wasPreviousEscapedCharacter = true;
					continue;
				} else {
					// no-op
				}
			}

			// Reserved character
			if (this.reservedTokens.includes(c)) {
				const previousToken = result[result.length - 1] ?? undefined;
				if (previous && !this.reservedTokens.includes(previous)) {
					// Start reserve
					if (buffer.length > 0) {
						result.push(new Token(this.getTokenType(buffer, previousToken), buffer.join(''))); // Pushing the token
					}
					buffer = [c];
				} else if (this.reservedTokens.includes(buffer.join('') + c)) {
					// More for this reserved token
					buffer.push(c);
				} else {
					// Encounters stop, so assume end previous, start new token, saving previous as a token
					if (buffer.length > 0) {
						result.push(new Token(this.getTokenType(buffer, previousToken), buffer.join(''))); // Pushing the token
					}
					buffer = [c];
				}
			} else if (previous && this.reservedTokens.includes(previous) && !wasPreviousEscapedCharacter) {
				// Previous last char was a stop, but not anymore, so save token and start new
				const tokenType = this.getTokenType(buffer);
				result.push(new Token(tokenType, buffer.join(''))); // Pushing the token
				buffer = [c];
			} else {
				// Continue token
				buffer.push(c);
			}

			wasPreviousEscapedCharacter = false;
		}

		if (buffer.length > 0) {
			const previousToken = result[result.length - 1];

			if (previousToken) {
				switch (previousToken.type) {
					case TokenType.BinaryOperator:
						result.push(new Token(TokenType.Value, buffer.join(''))); // Pushing the token
						break;
					case TokenType.Reserved:
					case TokenType.Value:
					case TokenType.Other:
					case TokenType.Invalid:
						if (this.reservedTokens.includes(buffer.join(''))) {
							result.push(new Token(TokenType.Reserved, buffer.join(''))); // Pushing the token
						} else {
							result.push(new Token(TokenType.Other, buffer.join(''))); // Pushing the token
						}
						break;
					default:
						break;
				}
			} else {
				if (this.reservedTokens.includes(buffer.join(''))) {
					result.push(new Token(TokenType.Reserved, buffer.join(''))); // Pushing the token
				} else {
					result.push(new Token(TokenType.Other, buffer.join(''))); // Pushing the token
				}
			}
		}

		return result;
	}

	private convertHexToCharacter(hex: string): string | undefined {
		const code = parseInt(hex, 16);
		return isNaN(code) ? undefined : String.fromCharCode(code);
	}

	private getTokenType(buffer: string[], previous?: Token): TokenType {
		const tokenString = buffer.join('');
		if (this.binaryOperators.includes(tokenString)) {
			return TokenType.BinaryOperator;
		} else if (this.reservedTokens.includes(tokenString)) {
			return TokenType.Reserved;
		} else {
			if (previous?.type === TokenType.BinaryOperator){
				return TokenType.Value;
			} else {
				return TokenType.Other;
			}
		}
	}
}

interface AttributeValue {
	type: string,
	value: any
}

export class Parser {

	protected values: { [key: string]: AttributeValue } = {};

	private async getAttributeValue(key: string){

		if (!this.values[key]){

			const attributeReference = new FilterValue(this.tokenscript, key);
			const value = await attributeReference.getValue(this.tokenContext);
			let type = "string"

			switch (typeof value) {
				case "boolean":
					type = "bool";
					break;
			}

			this.values[key] = {
				type,
				value
			}
		}

		return this.values[key];
	}

	public constructor(
		private tokenscript: ITokenScript|null,
		private tokenContext: ITokenIdContext|null,
		protected tokens: Token[]
	) {

	}

	private isExpected(expectedToken: Token): boolean {
		const token = this.tokens.shift();
		return token && token.type == expectedToken.type && token.value === expectedToken.value;
	}

	private lookAhead(): Token | undefined {
		return this.tokens[0];
	}

	public async parse(): Promise<boolean> {
		let result: boolean | undefined;
		if (this.lookAhead()?.type === TokenType.Reserved && this.lookAhead()?.value === "(") {
			result = await this.parseFilter();
		} else {
			result = await this.parseFilterComp();
		}
		return result ?? false;
	}

	private async parseFilter(): Promise<boolean | undefined> {

		if (!this.isExpected(new Token(TokenType.Reserved, "(")))
			return undefined;

		const result = await this.parseFilterComp();

		if (!this.isExpected(new Token(TokenType.Reserved, ")")))
			return undefined;

		return result;
	}

	private async parseFilterComp(): Promise<boolean | undefined> {
		switch (this.lookAhead()?.type) {
			case undefined:
				return undefined;
			case TokenType.Reserved:
				if (this.lookAhead()?.value === "&") return this.parseAnd();
				if (this.lookAhead()?.value === "|") return this.parseOr();
				if (this.lookAhead()?.value === "!") return this.parseNot();
				return await this.parseItem();
			default:
				return await this.parseItem();
		}
	}

	private async parseAnd(): Promise<boolean | undefined> {
		if (!this.isExpected(new Token(TokenType.Reserved, "&"))) return undefined;
		const resultsOfOptionals: boolean[] | undefined = await this.parseFilterList();
		if (!resultsOfOptionals) return undefined;
		return resultsOfOptionals.length ? resultsOfOptionals.every(result => result) : false;
	}

	private async parseOr(): Promise<boolean | undefined> {
		if (!this.isExpected(new Token(TokenType.Reserved, "|"))) return undefined;
		const resultsOfOptionals: boolean[] | undefined = await this.parseFilterList();
		if (!resultsOfOptionals) return undefined;
		return resultsOfOptionals.length ? resultsOfOptionals.some(result => result) : false;
	}

	private async parseNot(): Promise<boolean | undefined> {
		if (!this.isExpected(new Token(TokenType.Reserved, "!"))) return undefined;
		const result = await this.parseFilter();
		return result !== undefined ? !result : undefined;
	}

	private async parseFilterList(): Promise<(boolean | undefined)[] | undefined> {
		const results: (boolean | undefined)[] = [];

		while (this.lookAhead()?.type === TokenType.Reserved && this.lookAhead()?.value === "(") {
			const result = await this.parseFilter();
			results.push(result);
			if (result === undefined) break;
		}

		return results.length === 0 ? undefined : results;
	}

	private async parseItem(): Promise<boolean | undefined> {
		return this.parseSimple();
	}

	private async parseSimple(): Promise<boolean | undefined> {
		const attributeToken = this.tokens.shift();
		const attribute = attributeToken?.otherValue;
		const attributeValue = attribute ? await this.getAttributeValue(attribute) : {value: undefined, type: undefined};

		const operatorToken = this.tokens.shift();
		const operator = operatorToken?.binaryOperatorValue as Operator;

		const valueToken = this.tokens.shift();
		const value = valueToken?.valueValue;

		if (!attribute || !attributeValue || !operator || !value) return false;

		const interpolatedValue = await this.interpolate(value);

		if (interpolatedValue === undefined) return undefined;

		return this.isTrueFor(attributeValue, interpolatedValue, operator);
	}

	private async interpolate(value: string): Promise<string | undefined> {
		let result = value;

		do {
			const match = Parser.regex?.exec(result);
			if (match) {
				const attribute = match[1];
				if (attribute) {
					const attributeValue = await this.getAttributeValue(attribute);
					if (attributeValue !== undefined) {
						const attributeValueString = this.convertAttributeValueToString(attributeValue);
						result = result.replace(match[0], attributeValueString);
					} else {
						return undefined;
					}
				}
			}
		} while (Parser.regex?.test(result));

		return result;
	}

	private async isTrueFor(attributeValue: AttributeValue, value: string, operator: Operator): Promise<boolean> {

		switch (attributeValue.type) {
			case 'address':
				switch (operator) {
					case Operator.Equal:
						const attrVal = typeof attributeValue.value === "string" ? attributeValue.value : attributeValue.value.toString();
						return attrVal.toLowerCase() === value.toLowerCase();
					// Add other cases for operators as needed
					default:
						return false;
				}
			case 'bool':
				switch (operator) {
					case Operator.Equal:
						return (attributeValue.value ? "TRUE": "FALSE") === value;
					// Add other cases for operators as needed
					default:
						return false;
				}
			case 'string':
				switch (operator) {
					case Operator.Equal:
						return attributeValue.value === value;
					case Operator.LessThan:
						return attributeValue.value < value;
					case Operator.GreaterThan:
						return attributeValue.value > value;
					case Operator.LessThanOrEqual:
						return attributeValue.value <= value;
					case Operator.GreaterThanOrEqual:
						return attributeValue.value >= value;
					default:
						return false;
				}
			// Add other cases for different types of attribute values
			default:
				return false;
		}
	}

	private convertAttributeValueToString(attributeValue: AttributeValue): string {
		switch (attributeValue.type) {
			case 'address':
				return attributeValue.value.toString().toLowerCase();
			case 'bool':
				return attributeValue.value ? 'TRUE' : 'FALSE';
			case 'string':
				return attributeValue.value.toString();
			case 'bytes':
				return attributeValue.value.toString(); // Already hex?
			case 'int':
				return attributeValue.value.toString();
			case 'uint':
				return attributeValue.value.toString();
			case 'generalisedTime':
				return typeof attributeValue.value === "string" ?
					attributeValue.value :
					(new Date(attributeValue.value * 1000)).toISOString();
			default:
				return '';
		}
	}

	private static readonly regex = /\$\{([a-zA-Z][a-zA-Z0-9]*)\}/;
}

export class MockParser extends Parser {
	public constructor(
		tokens: Token[],
		values: {[key: string]: AttributeValue}
	) {
		super(null, null, tokens);
		this.values = values;
	}
}
