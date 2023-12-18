import { ParseError, SeqProtoParser } from "../src/dsl";
import t from "node:test";
import assert from "node:assert";

t.test("new SeqProtoParser().parse works", () => {
	const schema = `
    message Foo {
    required number foo = 0
    optional string bar = 1
    boolean baz = 2
    }
    
    message Test {
    Foo foo = 0
    string bar = 1
    boolean baz = 2
    }`;

	const expectedResult = [
		{
			type: "message",
			identifier: "Foo",
			foo: { required: true, type: "number", key: "foo", value: 0 },
			bar: { optional: true, type: "string", key: "bar", value: 1 },
			baz: { type: "boolean", key: "baz", value: 2 },
		},
		{
			type: "message",
			identifier: "Test",
			foo: { type: "Foo", key: "foo", value: 0 },
			bar: { type: "string", key: "bar", value: 1 },
			baz: { type: "boolean", key: "baz", value: 2 },
		},
	];
	assert.deepStrictEqual(new SeqProtoParser().parse(schema), expectedResult);
});

t.test("new SeqProtoParser().parse exceptions", () => {
	assert.deepStrictEqual(new SeqProtoParser().parse(""), []);
	assert.doesNotThrow(() => new SeqProtoParser().parse("message Foo { }"));
	assert.doesNotThrow(() => new SeqProtoParser().parse("message Foo { } message Bar { }"));
	assert.doesNotThrow(() =>
		new SeqProtoParser().parse("message Foo { } message Bar { Foo foo = 0 }"),
	);
	// assert.throws(() => { })

	assert.throws(
		() => new SeqProtoParser().parse("message Foo { } message Bar { Bar foo = 0 } "),
		ParseError,
	);

	assert.throws(() => new SeqProtoParser().parse("message { }"), ParseError);

	assert.throws(() => new SeqProtoParser().parse("Foo { }"), ParseError);

	assert.throws(() => new SeqProtoParser().parse("message Foo{ }"), ParseError);

	assert.throws(
		() => new SeqProtoParser().parse("message Foo { random_type foo = 0 }"),
		ParseError,
	);

	assert.throws(
		() => new SeqProtoParser().parse("message Foo { required number foo }"),
		ParseError,
	);

	assert.throws(
		() => new SeqProtoParser().parse("message Foo { required number foo = -1 }"),
		ParseError,
	);

	assert.throws(
		() => new SeqProtoParser().parse(" message Foo { required number foo = bar }"),
		ParseError,
	);

	assert.throws(
		() => new SeqProtoParser().parse("message Foo { random number foo = bar }"),
		ParseError,
	);

	assert.throws(
		() => new SeqProtoParser().parse("message Foo { random number foo = 1 "),
		ParseError,
	);

	assert.throws(() => new SeqProtoParser().parse("message Foo random number foo = 1"), ParseError);
});
