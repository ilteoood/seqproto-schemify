import type { JSONSchema4 } from 'json-schema'
import { describe, expect, it } from 'vitest'

import { serialize } from '../src/serializer'

import { createSer } from 'seqproto'

describe('serializer', () => {
    describe('should serialize plain data', () => {
        const testBed = {
            string: {
                example: 'string',
                serializeFn: 'serializeString'
            },
            number: {
                example: 1,
                serializeFn: 'serializeNumber'
            },
            integer: {
                example: 1,
                serializeFn: 'serializeNumber'
            },
            boolean: {
                example: true,
                serializeFn: 'serializeBoolean'
            }
        }

        it.each(Object.keys(testBed))('correctly serialize %s', (type) => {
            const testData = testBed[type]
            const jsonSchema = { type } as JSONSchema4

            const serializer = serialize(jsonSchema)

            const ser = createSer()
            ser[testData.serializeFn](testData.example)

            const result = serializer(createSer(), testData.example)
            expect(result).toStrictEqual(ser.getBuffer())
        })
    })

    it('should serialize object', () => {
        const jsonSchema = {
            type: 'object',
            properties: {
                name: {
                    type: 'string'
                },
                age: {
                    type: 'integer'
                }
            }
        } as const

        const toSerialize = {
            age: 1,
            name: 'test'
        }

        const result = serialize(jsonSchema)(createSer(), toSerialize)

        const ser = createSer()
        ser.serializeString(toSerialize.name)
        ser.serializeNumber(toSerialize.age)

        expect(result).toStrictEqual(ser.getBuffer())
    })
})