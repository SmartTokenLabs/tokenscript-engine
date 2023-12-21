import {AttributeWrapper, Lexer, Parser, Token, TokenType} from "../../../src/tokenScript/selection/FilterParser";


describe('TokenScriptFilterParserTests', () => {

	const lexer = new Lexer();

	class MockAttribute implements AttributeWrapper {

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

	test('testTokenizing', () => {

		expect(lexer.tokenize('expiry=123')).toEqual([
			new Token(TokenType.Other, 'expiry'),
			new Token(TokenType.BinaryOperator, '='),
			new Token(TokenType.Value, '123')
		]);
		expect(lexer.tokenize('expiry<123')).toEqual([
			new Token(TokenType.Other, 'expiry'),
			new Token(TokenType.BinaryOperator, '<'),
			new Token(TokenType.Value, '123')
		]);

		expect(lexer.tokenize('expiry>123')).toEqual([
			new Token(TokenType.Other, 'expiry'),
			new Token(TokenType.BinaryOperator, '>'),
			new Token(TokenType.Value, '123')
		]);

		expect(lexer.tokenize('(expiry>123)')).toEqual([
			new Token(TokenType.Reserved, "("),
			new Token(TokenType.Other, 'expiry'),
			new Token(TokenType.BinaryOperator, '>'),
			new Token(TokenType.Value, '123'),
			new Token(TokenType.Reserved, ")")
		]);

		expect(lexer.tokenize('expiry<=123')).toEqual([
			new Token(TokenType.Other, 'expiry'),
			new Token(TokenType.BinaryOperator, '<='),
			new Token(TokenType.Value, '123')
		]);

		expect(lexer.tokenize('expiry>=123')).toEqual([
			new Token(TokenType.Other, 'expiry'),
			new Token(TokenType.BinaryOperator, '>='),
			new Token(TokenType.Value, '123')
		]);

		expect(lexer.tokenize("expiry>=hello\\29world")).toEqual([
			new Token(TokenType.Other, 'expiry'),
			new Token(TokenType.BinaryOperator, '>='),
			new Token(TokenType.Value, 'hello)world')
		]);

		expect(lexer.tokenize('expiry>=hello)world')).toEqual([
			new Token(TokenType.Other, 'expiry'),
			new Token(TokenType.BinaryOperator, '>='),
			new Token(TokenType.Value, 'hello'),
			new Token(TokenType.Reserved, ')'),
			new Token(TokenType.Other, 'world')
		]);

		expect(lexer.tokenize('expiry>=hello>world')).toEqual([
			new Token(TokenType.Other, 'expiry'),
			new Token(TokenType.BinaryOperator, '>='),
			new Token(TokenType.Value, 'hello'),
			new Token(TokenType.BinaryOperator, '>'),
			new Token(TokenType.Value, 'world'),
		]);

		expect(lexer.tokenize('(&(birthDate=xxx)(expiry<=20200421000000))')).toEqual([
			new Token(TokenType.Reserved, '('),
			new Token(TokenType.Reserved, '&'),
			new Token(TokenType.Reserved, '('),
			new Token(TokenType.Other, 'birthDate'),
			new Token(TokenType.BinaryOperator, '='),
			new Token(TokenType.Value, 'xxx'),
			new Token(TokenType.Reserved, ')'),
			new Token(TokenType.Reserved, '('),
			new Token(TokenType.Other, 'expiry'),
			new Token(TokenType.BinaryOperator, '<='),
			new Token(TokenType.Value, '20200421000000'),
			new Token(TokenType.Reserved, ')'),
			new Token(TokenType.Reserved, ')'),
		]);
	});

	test('testTokenizingWithParenthesis', () => {
		expect(lexer.tokenize('(expiry=123)')).toEqual([
			new Token(TokenType.Reserved, "("),
			new Token(TokenType.Other, 'expiry'),
			new Token(TokenType.BinaryOperator, '='),
			new Token(TokenType.Value, '123'),
			new Token(TokenType.Reserved, ")")
		]);
	});

	test('testTokenizingWithInvalidEscapeSequence', () => {

		expect(lexer.tokenize('expiry>=hello\\4\\29world')).toEqual([
			new Token(TokenType.Other, 'expiry'),
			new Token(TokenType.BinaryOperator, '>='),
			new Token(TokenType.Value, 'hello'),
			new Token(TokenType.Invalid, '\\4'),
			new Token(TokenType.Other, ')world'),
		]);

		expect(lexer.tokenize('expiry>=hello\\\\world')).toEqual([
			new Token(TokenType.Other, 'expiry'),
			new Token(TokenType.BinaryOperator, '>='),
			new Token(TokenType.Value, 'hello'),
			new Token(TokenType.Invalid, '\\\\'),
			new Token(TokenType.Other, 'world'),
		]);
	});

	test('testTokenizingWithImplicitValue', () => {

		expect(lexer.tokenize('(wallet=${ownerAddress})')).toEqual([
			new Token(TokenType.Reserved, '('),
			new Token(TokenType.Other, 'wallet'),
			new Token(TokenType.BinaryOperator, '='),
			new Token(TokenType.Value, '${ownerAddress}'),
			new Token(TokenType.Reserved, ')'),
		]);
	});

	test('testBasicParsing', async () => {
		const tokens = lexer.tokenize('expiry=123');
		const values = {
			expiry: new MockAttribute('directoryString', '123'),
		};
		const parser = new Parser(tokens, values);
		const result = await parser.parse();
		expect(result).toBe(true);
	});

	/*test('testParsingWithParenthesis', () => {
		const tokens = lexer.tokenize('(expiry=123)');
		const values = {
			expiry: { syntax: 'directoryString', value: '123' },
		};
		const parser = new Parser(tokens, values);

		expect(result).toBe(true);
		const result = parser.parse();
		expect(result).toBe(true);
	});*/

	// Convert other test cases following the same structure...
});
