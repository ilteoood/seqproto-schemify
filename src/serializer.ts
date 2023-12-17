import type { JSONSchema4, JSONSchema4TypeName } from 'json-schema'

const serializers: Partial<Record<JSONSchema4TypeName, string>> = {
    'boolean': `ser.serializeBoolean(value)`,
    'integer': `ser.serializeUInt32(value)`,
    'number': `ser.serializeFloat32(value)`,
    'string': `ser.serializeString(value)`,
}

const serialize = (jsonSchema: JSONSchema4) => {
    const code = serializeInternal(jsonSchema)

    return new Function('ser', 'foo', code)
}

const serializeInternal = (jsonSchema: JSONSchema4, code: string = '') => {
    const type = jsonSchema.type

    const serializer = serializers[type as JSONSchema4TypeName]

    if (serializer) {
        return code + serializer
    } else if (type === 'object') {
        Object.entries(jsonSchema.properties || {}).forEach(([key, value]) => {
            code += serializeInternal(value, code)
        })
        return code
    }

    // TODO: handle array type
    return code
}