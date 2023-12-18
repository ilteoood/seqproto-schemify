import type { JSONSchema4, JSONSchema4TypeName } from 'json-schema'

type SerializerCreator = (index: number, objectobjectKey?: string) => string

const indexedObject = (index: number) => `object_${Math.max(index, 0)}`

const buildSerializeFunction = (functionName: string) => (index: number, objectKey?: string) => objectKey ?
    `ser.${functionName}(${indexedObject(index)}['${objectKey}'])\n` :
    `ser.${functionName}(${indexedObject(index)})\n`

const serializers: Partial<Record<JSONSchema4TypeName, SerializerCreator>> = {
    'boolean': buildSerializeFunction('serializeBoolean'),
    'integer': buildSerializeFunction('serializeNumber'),
    'number': buildSerializeFunction('serializeNumber'),
    'string': buildSerializeFunction('serializeString'),
}

export const serialize = (jsonSchema: JSONSchema4) => {
    const generatedCode = serializeInternal(jsonSchema) + `
    return ser.getBuffer()`

    return new Function('ser', 'object_0', generatedCode)
}

const serializeInternal = (jsonSchema: JSONSchema4, index: number = -1, objectKey?: string) => {
    const type = jsonSchema.type

    const serializer = serializers[type as JSONSchema4TypeName]

    if (serializer) {
        return serializer(index, objectKey)
    } else if (type === 'object') {
        let generatedCode = objectKey ? `{
            const ${indexedObject(index + 1)} = ${indexedObject(index)}['${objectKey}']
        ` : `{\n`
        Object.entries(jsonSchema.properties || {}).forEach(([objectKey, schema]) => {
            generatedCode += serializeInternal(schema, index + 1, objectKey)
        })
        generatedCode += '\n}\n'
        return generatedCode
    }

    // TODO: handle array type
    return ''
}