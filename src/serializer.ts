import type { JSONSchema4, JSONSchema4TypeName } from "json-schema";

import type { Ser } from "seqproto";

type SerializeFunction = (index: number, objectKey?: string) => string;

type SerializerCreator = (jsonSchema: JSONSchema4) => SerializeFunction;

type SerializeFunctionBuilder = (functionName: string) => SerializeFunction;

type StrictArrayBuffer = ReturnType<Ser["getBuffer"]>;

const indexedObject = (index: number) => `object_${Math.max(index, 0)}`;

const buildBaseSerializeFunction: SerializeFunctionBuilder =
	(functionName: string) => (index: number, objectKey?: string) =>
		objectKey
			? `ser.${functionName}(${indexedObject(index)}['${objectKey}']`
			: `ser.${functionName}(${indexedObject(index)}`;

const buildSerializeFunction: SerializeFunctionBuilder = (
	functionName: string,
) => {
	const builderFunction = buildBaseSerializeFunction(functionName);
	return (index: number, objectKey?: string) =>
		`${builderFunction(index, objectKey)})\n`;
};

const buildArraySerializeFunction: SerializeFunction =
	buildBaseSerializeFunction("serializeArray");

const serializers: Partial<Record<JSONSchema4TypeName, SerializerCreator>> = {
	boolean: () => buildSerializeFunction("serializeBoolean"),
	integer: (jsonSchema: JSONSchema4) =>
		Number(jsonSchema.minimum) >= 0
			? buildSerializeFunction("serializeUInt32")
			: buildSerializeFunction("serializeNumber"),
	number: () => buildSerializeFunction("serializeNumber"),
	string: () => buildSerializeFunction("serializeString"),
};

export const serialize = (jsonSchema: JSONSchema4) => {
	const generatedCode = `${serializeInternal(jsonSchema)}
    return ser.getBuffer()`;

	return new Function("ser", "object_0", generatedCode) as (
		ser: Ser,
		object_0: unknown,
	) => StrictArrayBuffer;
};

const serializeInternal = (
	jsonSchema: JSONSchema4,
	index = -1,
	objectKey?: string,
) => {
	const type = jsonSchema.type;

	const serializerBuilder = serializers[type as JSONSchema4TypeName];

	if (serializerBuilder) {
		const serializer = serializerBuilder(jsonSchema);
		return serializer(index, objectKey);
	}

	if (type === "object") {
		let generatedCode = objectKey
			? `{
            const ${indexedObject(index + 1)} = ${indexedObject(
							index,
						)}['${objectKey}']
        `
			: "{\n";

		for (const [objectKey, schema] of Object.entries(
			jsonSchema.properties || {},
		)) {
			generatedCode += serializeInternal(schema, index + 1, objectKey);
		}

		generatedCode += "\n}\n";
		return generatedCode;
	}

	if (type === "array") {
		let generatedCode = `${buildArraySerializeFunction(
			index,
			objectKey,
		)}, (ser, ${indexedObject(index + 1)}) => {`;
		generatedCode += serializeInternal(jsonSchema.items || {}, index);
		generatedCode += "\n})\n";
		return generatedCode;
	}

	return "";
};
