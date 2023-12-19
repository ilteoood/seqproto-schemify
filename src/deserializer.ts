import type { JSONSchema4, JSONSchema4TypeName } from "json-schema";

type SerializerCreator = (jsonSchema: JSONSchema4) => string;

type SerializeFunctionBuilder = (functionName: string) => string;

const buildBaseSerializeFunction: SerializeFunctionBuilder = (
	functionName: string,
) => `des.${functionName}(`;

const buildSerializeFunction = (functionName: string) => `${buildBaseSerializeFunction(functionName)})`;

const arrayDeserializeFunction = buildBaseSerializeFunction("deserializeArray");

const deserializers: Partial<Record<JSONSchema4TypeName, SerializerCreator>> = {
	boolean: () => buildSerializeFunction("deserializeBoolean"),
	integer: (jsonSchema: JSONSchema4) =>
		Number(jsonSchema.minimum) >= 0
			? buildSerializeFunction("deserializeUInt32")
			: buildSerializeFunction("deserializeNumber"),
	number: () => buildSerializeFunction("deserializeNumber"),
	string: () => buildSerializeFunction("deserializeString"),
};

export const deserialize = (jsonSchema: JSONSchema4) => {
	const generatedCode = `return ${deserializeInternal(jsonSchema)}`;

	return new Function("des", generatedCode);
};

const deserializeInternal = (jsonSchema: JSONSchema4) => {
	const type = jsonSchema.type;

	const deserializer = deserializers[type as JSONSchema4TypeName];

	if (deserializer) {
		return deserializer(jsonSchema);
	}

	if (type === "object") {
		let generatedCode = "{\n";

		for (const [objectKey, schema] of Object.entries(
			jsonSchema.properties || {},
		)) {
			generatedCode += `'${objectKey}': ${deserializeInternal(schema)},\n`;
		}

		generatedCode += "\n}\n";
		return generatedCode;
	}

	if (type === "array") {
		let generatedCode = `${arrayDeserializeFunction}(des) => (`;
		generatedCode += deserializeInternal(jsonSchema.items || {});
		generatedCode += "\n))\n";
		return generatedCode;
	}

	return "";
};
