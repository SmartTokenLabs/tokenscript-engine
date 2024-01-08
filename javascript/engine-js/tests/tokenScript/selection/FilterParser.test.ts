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
			expiry: new MockAttribute('string', '123'),
		};

		const parser = new Parser(tokens, values);
		const result = await parser.parse();
		expect(result).toBe(true);
	});

	test('testParsingWithParenthesis', async() => {

		const tokens = lexer.tokenize('(expiry=123)');
		const values = {
			expiry: new MockAttribute('string', '123'),
		};

		const parser = new Parser(tokens, values);
		const result = await parser.parse();
		expect(result).toBe(true);
	});

	test('testParsingFilterListOne', async () => {

		const tokens = lexer.tokenize('&(expiry=123)');
		const values = {
			expiry: new MockAttribute('string', '123'),
		};

		const parser = new Parser(tokens, values);
		const result = await parser.parse();
		expect(result).toBe(true);
	});

	test('testParsingFilterListMultipleAnd1', async () => {

		const tokens = lexer.tokenize('&(expiry=123)(expiry=123)');
		const values = {
			expiry: new MockAttribute('string', '123'),
		};

		const parser = new Parser(tokens, values);
		const result = await parser.parse();
		expect(result).toBe(true);
	});

	test('testParsingFilterListMultipleAnd2', async () => {

		const tokens = lexer.tokenize('&(expiry=123)(expiry=124)');
		const values = {
			expiry: new MockAttribute('string', '123'),
		};

		const parser = new Parser(tokens, values);
		const result = await parser.parse();
		expect(result).toBe(false);
	});

	test('testParsingFilterListMultipleOr1', async () => {

		const tokens = lexer.tokenize('|(expiry=123)(expiry=123)');
		const values = {
			expiry: new MockAttribute('string', '123'),
		};

		const parser = new Parser(tokens, values);
		const result = await parser.parse();
		expect(result).toBe(true);
	});

	test('testParsingFilterListMultipleOr2', async () => {

		const tokens = lexer.tokenize('|(expiry=123)(expiry=124)');
		const values = {
			expiry: new MockAttribute('string', '123'),
		};

		const parser = new Parser(tokens, values);
		const result = await parser.parse();
		expect(result).toBe(true);
	});

	test('testParsingFilterListMultipleOr3', async () => {

		const tokens = lexer.tokenize('|(expiry=124)(expiry=124)');
		const values = {
			expiry: new MockAttribute('string', '123'),
		};

		const parser = new Parser(tokens, values);
		const result = await parser.parse();
		expect(result).toBe(false);
	});

	test('testParsingFilterListNot1', async () => {

		const tokens = lexer.tokenize('!(expiry=123)');
		const values = {
			expiry: new MockAttribute('string', '123'),
		};

		const parser = new Parser(tokens, values);
		const result = await parser.parse();
		expect(result).toBe(false);
	});

	test('testParsingFilterListNot2', async () => {

		const tokens = lexer.tokenize('!(expiry=124)');
		const values = {
			expiry: new MockAttribute('string', '123'),
		};

		const parser = new Parser(tokens, values);
		const result = await parser.parse();
		expect(result).toBe(true);
	});

	test('testParsingFilterListInvalidNot', async () => {

		const tokens = lexer.tokenize('!(expiry=124)(expiry=124)');
		const values = {
			expiry: new MockAttribute('string', '123'),
		};

		const parser = new Parser(tokens, values);
		const result = await parser.parse();
		expect(result).toBe(false);
	});


	test('testParsingImplicitValues1', async () => {

		const tokens = lexer.tokenize('(wallet=${ownerAddress})');
		const wallet = '0x007bEe82BDd9e866b2bd114780a47f2261C684E3';
		const values = {
			wallet: new MockAttribute('string', wallet),
			ownerAddress: new MockAttribute("string", wallet)
		};

		const parser = new Parser(tokens, values);
		const result = await parser.parse();
		expect(result).toBe(true);
	});

	test('testParsingImplicitValues2', async () => {

		const tokens = lexer.tokenize('wallet=${ownerAddress}');
		const wallet = '0x007bEe82BDd9e866b2bd114780a47f2261C684E3';
		const values = {
			wallet: new MockAttribute('string', wallet),
			ownerAddress: new MockAttribute("string", wallet)
		};

		const parser = new Parser(tokens, values);
		const result = await parser.parse();
		expect(result).toBe(true);
	});

	test('testParsingImplicitValues3', async () => {

		const tokens = lexer.tokenize('label=prefix-${ownerAddress}-suffix');
		const label = 'prefix-0x007bEe82BDd9e866b2bd114780a47f2261C684E3-suffix';
		const wallet = '0x007bEe82BDd9e866b2bd114780a47f2261C684E3';
		const values = {
			label: new MockAttribute('string', label),
			ownerAddress: new MockAttribute("string", wallet)
		};

		const parser = new Parser(tokens, values);
		const result = await parser.parse();
		expect(result).toBe(true);
	});

	test('testParsingImplicitValuesRepeat', async () => {

		const tokens = lexer.tokenize('label=prefix-${ownerAddress}-${ownerAddress}-suffix');
		const label = 'prefix-0x007bEe82BDd9e866b2bd114780a47f2261C684E3-0x007bEe82BDd9e866b2bd114780a47f2261C684E3-suffix';
		const wallet = '0x007bEe82BDd9e866b2bd114780a47f2261C684E3';
		const values = {
			label: new MockAttribute('string', label),
			ownerAddress: new MockAttribute("string", wallet)
		};

		const parser = new Parser(tokens, values);
		const result = await parser.parse();
		expect(result).toBe(true);
	});

	test('testParsingImplicitValuesToday', async () => {

		const tokens = lexer.tokenize('expiry=${today}');
		const date = new Date();

		const values = {
			expiry: new MockAttribute('generalisedTime', date.getTime()),
			today: new MockAttribute("generalisedTime", date.getTime())
		};

		const parser = new Parser(tokens, values);
		const result = await parser.parse();
		expect(result).toBe(true);
	});

	test('testParsingGeneralisedTimePartialGreaterThan', async () => {

		const tokens = lexer.tokenize('expiry>2023');
		const values = {
			expiry: new MockAttribute('generalisedTime', new Date('20230405111234+0000').getTime()),
		};

		const parser = new Parser(tokens, values);
		const result = await parser.parse();
		expect(result).toBe(false);
	});

	test('testParsingGeneralisedTimePartialLessThan', async () => {

		const tokens = lexer.tokenize('expiry<2023');
		const values = {
			expiry: new MockAttribute('generalisedTime', new Date('20230405111234+0000')),
		};

		const parser = new Parser(tokens, values);
		const result = await parser.parse();
		expect(result).toBe(false);
	});

	test('testParsingGeneralisedTimePartialEqual', async () => {

		const tokens = lexer.tokenize('expiry=2023');
		const values = {
			expiry: new MockAttribute('generalisedTime', new Date('20230405111234+0000')),
		};

		const parser = new Parser(tokens, values);
		const result = await parser.parse();
		expect(result).toBe(true);
	});
});
