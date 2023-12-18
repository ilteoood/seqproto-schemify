const identifiers = {
	MESSAGE_TYPE: "message",
	OPENING_BRACKET: "{",
	CLOSING_BRACKET: "}",
	PROPERTY_SEPARATOR: "=",
	TOKEN_SEPARATOR: " ",
};

export const PARSE_ERROR_CODES = {
	EXPECTED_MESSAGE_KEYWORD: "EXPECTED_MESSAGE_KEYWORD",
	EXPECTED_OPENING_BRACKET: "EXPECTED_OPENING_BRACKET",
	EXPECTED_CLOSING_BRACKET: "EXPECTED_CLOSING_BRACKET",
	INVALID_TYPE: "INVALID_TYPE",
	EXPECTED_PROPERTY: "EXPECTED_PROPERTY",
	INVALID_INTEGER_VALUE: "INVALID_INTEGER_VALUE",
};

type Middleware = (token: string) => MiddlewareResult;

export type ParsedValue = {
	value: number;
	type: string;
	key: string;
} & Record<string, boolean>;

export type ParseResult =
	| {
		type: string;
		identifier: string;
	}
	| Record<string, ParsedValue>;

export type MiddlewareResult = {
	objectFinished?: boolean;
	next: Middleware;
	data?: Partial<ParseResult>;
}

export class ParseError extends Error {
	public code: string;
	constructor(code: string, message: string) {
		super(message);
		this.code = code;
	}
}

export class SeqProtoParser {

	private UNIQUE_KEYWORDS = new Set(["required", "optional"]);

	private UNIQUE_VALUE_TYPES = new Set<string>(["string", "boolean", "number"]);

	public parse(schema: string): ParseResult[] {
		const tokens = schema
			.replaceAll(/(\r\n|\n|\r)/gm, "")
			.split(identifiers.TOKEN_SEPARATOR);
		const results: ParseResult[] = [];
		let currentObject: Partial<ParseResult> = {};
		let next: Middleware = this.begin;

		for (const token of tokens) {
			if (token === "") continue;
			const { next: nextFunction, data, objectFinished } = next.call(this, token);

			if (data != null) {
				Object.assign(currentObject, data);
			}

			if (objectFinished === true) {
				this.UNIQUE_VALUE_TYPES.add(currentObject.identifier as string);
				results.push(currentObject as ParseResult);
				currentObject = {};
			}

			next = nextFunction;
		}

		return results;
	}

	private begin(token: string): MiddlewareResult {
		if (token !== identifiers.MESSAGE_TYPE) {
			throw new ParseError(
				PARSE_ERROR_CODES.EXPECTED_MESSAGE_KEYWORD,
				`Expected message, received ${token}`,
			);
		}
		return {
			next: this.expectMessageIdentifier,
			data: {
				type: token,
			},
		};
	}

	private expectMessageIdentifier(token: string): MiddlewareResult {
		return {
			next: this.expectOpeningBracket,
			data: {
				identifier: token,
			},
		};
	}

	private expectOpeningBracket(token: string): MiddlewareResult {
		if (token !== identifiers.OPENING_BRACKET) {
			throw new ParseError(
				PARSE_ERROR_CODES.EXPECTED_OPENING_BRACKET,
				`Expected {, received ${token}`,
			);
		}
		return {
			next: this.expectKeywordOrTypeOrClosingBracket({}),
		};
	}

	private expectKeywordOrTypeOrClosingBracket(
		aggregator?: Partial<ParsedValue>,
	): Middleware {
		return (token: string): MiddlewareResult => {
			if (token === identifiers.CLOSING_BRACKET) {
				return {
					objectFinished: true,
					next: this.begin,
				};
			}

			if (this.UNIQUE_KEYWORDS.has(token)) {
				return {
					next: this.expectKeywordOrTypeOrClosingBracket({
						...aggregator,
						[token]: true,
					}),
					data: {},
				};
			}

			if (!this.UNIQUE_VALUE_TYPES.has(token))
				throw new ParseError(
					PARSE_ERROR_CODES.INVALID_TYPE,
					`Invalid type, received: ${token}`,
				);

			return {
				next: this.expectProperty({
					...aggregator,
					type: token,
				} as Partial<ParsedValue>),
			};
		};
	}

	private expectProperty(aggregator: Partial<ParsedValue>): Middleware {
		return (token: string): MiddlewareResult => {
			aggregator.key = token;

			return {
				next: this.expectPropertyValueSeparator(aggregator),
			};
		};
	}

	private expectPropertyValueSeparator(
		aggregator: Partial<ParsedValue>,
	): Middleware {
		return (token: string): MiddlewareResult => {
			if (!token.endsWith(identifiers.PROPERTY_SEPARATOR)) {
				throw new ParseError(
					PARSE_ERROR_CODES.EXPECTED_PROPERTY,
					`Expecting property, received ${token}`,
				);
			}

			return {
				next: this.expectValue(aggregator),
			};
		};
	}

	private expectValue(aggregator: Partial<ParsedValue>): Middleware {
		return (token: string): MiddlewareResult => {
			const integerValue = parseInt(token, 10);
			if (!Number.isFinite(integerValue) || integerValue < 0) {
				throw new ParseError(
					PARSE_ERROR_CODES.INVALID_INTEGER_VALUE,
					`Invalid integer value, received ${token}`,
				);
			}
			const aggregatorValue = { ...aggregator, value: integerValue };
			return {
				next: this.expectKeywordOrTypeOrClosingBracket({}),

				data: {
					[aggregator.key as string]: aggregatorValue,
				},
			};
		};
	}
}
