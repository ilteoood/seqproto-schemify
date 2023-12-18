import type { JSONSchema4, JSONSchema4TypeName } from 'json-schema'

type SerializerCreator = (objectobjectKey?: string) => string

const serializers: Partial<Record<JSONSchema4TypeName, SerializerCreator>> = {
    'boolean': (objectKey?: string) => objectKey ? `ser.serializeBoolean(object['${objectKey}'])\n` : `ser.serializeBoolean(object)\n`,
    'integer': (objectKey?: string) => objectKey ? `ser.serializeNumber(object['${objectKey}'])\n` : `ser.serializeNumber(object)\n`,
    'number': (objectKey?: string) => objectKey ? `ser.serializeNumber(object['${objectKey}'])\n` : `ser.serializeNumber(object)\n`,
    'string': (objectKey?: string) => objectKey ? `ser.serializeString(object['${objectKey}'])\n` : `ser.serializeString(object)\n`,
}

export const serialize = (jsonSchema: JSONSchema4) => {
    const generatedCode = serializeInternal(jsonSchema) + `
    return ser.getBuffer()`

    return new Function('ser', 'object', generatedCode)
}

const serializeInternal = (jsonSchema: JSONSchema4, generatedCode: string = '', objectKey?: string) => {
    const type = jsonSchema.type

    const serializer = serializers[type as JSONSchema4TypeName]

    if (serializer) {
        return serializer(objectKey)
    } else if (type === 'object') {
        generatedCode += objectKey ? `{
            let object =
        ` : `{\n`
        Object.entries(jsonSchema.properties || {}).forEach(([objectKey, schema]) => {
            generatedCode += serializeInternal(schema, generatedCode, objectKey)
        })
        generatedCode += '\n}\n'
        return generatedCode
    }

    // TODO: handle array type
    return generatedCode
}