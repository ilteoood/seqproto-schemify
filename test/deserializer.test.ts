import type { JSONSchema4 } from "json-schema";
import { describe, expect, it } from "vitest";

import { deserialize } from "../src/deserializer";

import { createDes, createSer } from "seqproto";

describe("deserializer", () => {
	describe("should deserialize plain data", () => {
		const testBed = {
			string: {
				example: "string",
				deserializeFn: "deserializeString",
			},
			number: {
				example: 1,
				deserializeFn: "deserializeNumber",
			},
			integer: {
				example: 1,
				deserializeFn: "deserializeNumber",
			},
			boolean: {
				example: true,
				deserializeFn: "deserializeBoolean",
			},
		};

		it.each(Object.keys(testBed))("correctly deserialize %s", (type) => {
			const testData = testBed[type];
			const jsonSchema = { type } as JSONSchema4;

			const deserializer = deserialize(jsonSchema);

			const ser = createSer();
			ser[testData.deserializeFn.slice(2)](testData.example);

			const des = createDes(ser.getBuffer());

			const result = deserializer(createDes(ser.getBuffer()));
			expect(result).toStrictEqual(
				des[testData.deserializeFn](testData.example),
			);
		});
	});

	describe("integer deserialization", () => {
		const toSerialize = 1;
		const minimumPositiveValues = [...new Array(10).keys()];

		it.each(minimumPositiveValues)(
			"should serialize integer with minimum >= 0, %d",
			(minimum) => {
				const jsonSchema = { type: "integer", minimum } as JSONSchema4;

				const deserializer = deserialize(jsonSchema);

				const ser = createSer();
				ser.serializeUInt32(toSerialize);

				const des = createDes(ser.getBuffer());

				const result = deserializer(createDes(ser.getBuffer()));
				expect(result).toStrictEqual(des.deserializeUInt32());
			},
		);

		const minimumNegativeValues = [...new Array(10).keys()]
			.slice(1)
			.map((n) => -n);

		it.each(minimumNegativeValues)(
			"should serialize integer with minimum < 0, %d",
			(minimum) => {
				const jsonSchema = { type: "integer", minimum } as JSONSchema4;

				const deserializer = deserialize(jsonSchema);

				const ser = createSer();
				ser.serializeNumber(toSerialize);

				const des = createDes(ser.getBuffer());

				const result = deserializer(createDes(ser.getBuffer()));
				expect(result).toStrictEqual(des.deserializeNumber());
			},
		);
	});
});
