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

			const result = deserializer(createDes(ser.getBuffer()));
			expect(result).toStrictEqual(testData.example);
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

				const result = deserializer(createDes(ser.getBuffer()));
				expect(result).toStrictEqual(toSerialize);
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

				const result = deserializer(createDes(ser.getBuffer()));
				expect(result).toStrictEqual(toSerialize);
			},
		);
	});

	describe("object deserialization", () => {
		it("should deserialize plain object", () => {
			const jsonSchema = {
				type: "object",
				properties: {
					name: {
						type: "string",
					},
					age: {
						type: "integer",
					},
				},
			} as const;

			const toSerialize = {
				age: 1,
				name: "test",
			};

			const ser = createSer();
			ser.serializeString(toSerialize.name);
			ser.serializeNumber(toSerialize.age);

			const result = deserialize(jsonSchema)(createDes(ser.getBuffer()));

			expect(result).toStrictEqual(toSerialize);
		});

		it("should deserialize nested object", () => {
			const jsonSchema = {
				type: "object",
				properties: {
					name: {
						type: "string",
					},
					age: {
						type: "integer",
					},
					address: {
						type: "object",
						properties: {
							city: {
								type: "string",
							},
						},
					},
				},
			} as const;

			const toSerialize = {
				name: "test",
				age: 1,
				address: {
					city: "test",
				},
			};

			const ser = createSer();
			ser.serializeString(toSerialize.name);
			ser.serializeNumber(toSerialize.age);
			ser.serializeString(toSerialize.address.city);

			const result = deserialize(jsonSchema)(createDes(ser.getBuffer()));

			expect(result).toStrictEqual(toSerialize);
		});

		it("should deserialize very deep nested object", () => {
			const jsonSchema = {
				type: "object",
				properties: {
					a: {
						type: "object",
						properties: {
							b: {
								type: "object",
								properties: {
									c: {
										type: "object",
										properties: {
											d: {
												type: "object",
												properties: {
													e: {
														type: "object",
														properties: {
															f: {
																type: "object",
																properties: {
																	g: {
																		type: "object",
																		properties: {
																			h: {
																				type: "object",
																				properties: {
																					i: {
																						type: "integer",
																					},
																				},
																			},
																		},
																	},
																},
															},
														},
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			} as const;

			const toSerialize = {
				a: {
					b: {
						c: {
							d: {
								e: {
									f: {
										g: {
											h: {
												i: 1,
											},
										},
									},
								},
							},
						},
					},
				},
			};

			const ser = createSer();
			ser.serializeNumber(toSerialize.a.b.c.d.e.f.g.h.i);

			const result = deserialize(jsonSchema)(createDes(ser.getBuffer()));

			expect(result).toStrictEqual(toSerialize);
		});

		it("should deserialize nested array", () => {
			const jsonSchema = {
				type: "object",
				properties: {
					name: {
						type: "string",
					},
					age: {
						type: "integer",
					},
					addresses: {
						type: "array",
						items: {
							type: "object",
							properties: {
								city: {
									type: "string",
								},
							},
						},
					},
				},
			} as const;

			const toSerialize = {
				name: "test",
				age: 1,
				addresses: [
					{
						city: "test",
					},
				],
			};

			const ser = createSer();
			ser.serializeString(toSerialize.name);
			ser.serializeNumber(toSerialize.age);
			ser.serializeArray(toSerialize.addresses, (ser, object) => {
				ser.serializeString(object.city);
			});

			const result = deserialize(jsonSchema)(createDes(ser.getBuffer()));

			expect(result).toStrictEqual(toSerialize);
		});
	});

	describe("array deserialization", () => {
		it("should deserialize array of objects", () => {
			const jsonSchema = {
				type: "array",
				items: {
					type: "object",
					properties: {
						name: {
							type: "string",
						},
						age: {
							type: "integer",
						},
					},
				},
			} as const;

			const toSerialize = [{ name: "test", age: 1 }];

			const ser = createSer();
			ser.serializeArray(toSerialize, (ser, object) => {
				ser.serializeString(object.name);
				ser.serializeNumber(object.age);
			});

			const result = deserialize(jsonSchema)(createDes(ser.getBuffer()));

			expect(result).toStrictEqual(toSerialize);
		});

		it("should deserialize array of plain values", () => {
			const jsonSchema = {
				type: "array",
				items: { type: "string" },
			} as const;

			const toSerialize = ["test", "test2"];

			const ser = createSer();
			ser.serializeArray(toSerialize, (ser, object) => {
				ser.serializeString(object);
			});

			const result = deserialize(jsonSchema)(createDes(ser.getBuffer()));

			expect(result).toStrictEqual(toSerialize);
		});

		it("should deserialize array nested inside an object", () => {
			const jsonSchema = {
				type: "array",
				items: {
					type: "object",
					properties: {
						name: {
							type: "array",
							items: {
								type: "object",
								properties: {
									name: {
										type: "string",
									},
								},
							},
						},
					},
				},
			} as const;

			const toSerialize = [
				{
					name: [
						{
							name: "test",
						},
					],
				},
			];

			const ser = createSer();
			ser.serializeArray(toSerialize, (ser, object) => {
				ser.serializeArray(object.name, (ser, object) => {
					ser.serializeString(object.name);
				});
			});

			const result = deserialize(jsonSchema)(createDes(ser.getBuffer()));

			expect(result).toStrictEqual(toSerialize);
		});
	});
});
