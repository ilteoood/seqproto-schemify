import type { JSONSchema4, JSONSchema4TypeName } from 'json-schema'

type SerializerCreator = (objectobjectKey?: string) => string

const serializers: Partial<Record<JSONSchema4TypeName, SerializerCreator>> = {
    'boolean': (objectKey?: string) => objectKey ? `ser.serializeBoolean(object[${objectKey}])` : `ser.serializeBoolean(object)`,
    'integer': (objectKey?: string) => objectKey ? `ser.serializeUInt32(object[${objectKey})` : `ser.serializeUInt32(object)`,
    'number': (objectKey?: string) => objectKey ? `ser.serializeFloat32(object[${objectKey})` : `ser.serializeFloat32(object)`,
    'string': (objectKey?: string) => objectKey ? `ser.serializeString(object[${objectKey})` : `ser.serializeString(object)`,
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
        return generatedCode + serializer(objectKey)
    } else if (type === 'object') {
        generatedCode += objectKey ? `{
            let object =
        ` : `{\n`
        Object.entries(jsonSchema.properties || {}).forEach(([objectKey, value]) => {
            generatedCode += serializeInternal(value, generatedCode, objectKey)
        })
        generatedCode += '}\n'
        return generatedCode
    }

    // TODO: handle array type
    return generatedCode
}