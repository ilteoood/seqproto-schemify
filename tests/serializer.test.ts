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

    describe('integer serialization', () => {
        const toSerialize = 1
        const minimumPositiveValues = [...new Array(10).keys()]

        it.each(minimumPositiveValues)('should serialize integer with minimum >= 0, %d', (minimum) => {
            const jsonSchema = { type: 'integer', minimum } as JSONSchema4

            const serializer = serialize(jsonSchema)

            const ser = createSer()
            ser.serializeUInt32(toSerialize)

            const result = serializer(createSer(), toSerialize)
            expect(result).toStrictEqual(ser.getBuffer())
        })

        const minimumNegativeValues = [...new Array(10).keys()].slice(1).map((n) => -n)

        it.each(minimumNegativeValues)('should serialize integer with minimum < 0, %d', (minimum) => {
            const jsonSchema = { type: 'integer', minimum } as JSONSchema4

            const serializer = serialize(jsonSchema)

            const ser = createSer()
            ser.serializeNumber(toSerialize)

            const result = serializer(createSer(), toSerialize)
            expect(result).toStrictEqual(ser.getBuffer())
        })
    })

    describe('object serialization', () => {
        it('should serialize plain object', () => {
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

        it('should serialize nested object', () => {
            const jsonSchema = {
                type: 'object',
                properties: {
                    name: {
                        type: 'string'
                    },
                    age: {
                        type: 'integer'
                    },
                    address: {
                        type: 'object',
                        properties: {
                            city: {
                                type: 'string'
                            }
                        }
                    }
                }
            } as const

            const toSerialize = {
                name: 'test',
                age: 1,
                address: {
                    city: 'test'
                }
            }

            const result = serialize(jsonSchema)(createSer(), toSerialize)

            const ser = createSer()
            ser.serializeString(toSerialize.name)
            ser.serializeNumber(toSerialize.age)
            ser.serializeString(toSerialize.address.city)

            expect(result).toStrictEqual(ser.getBuffer())
        })

        it('should serialize very deep nested object', () => {
            const jsonSchema = {
                type: 'object',
                properties: {
                    a: {
                        type: 'object',
                        properties: {
                            b: {
                                type: 'object',
                                properties: {
                                    c: {
                                        type: 'object',
                                        properties: {
                                            d: {
                                                type: 'object',
                                                properties: {
                                                    e: {
                                                        type: 'object',
                                                        properties: {
                                                            f: {
                                                                type: 'object',
                                                                properties: {
                                                                    g: {
                                                                        type: 'object',
                                                                        properties: {
                                                                            h: {
                                                                                type: 'object',
                                                                                properties: {
                                                                                    i: {
                                                                                        type: 'integer'
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } as const

            const toSerialize = {
                a: {
                    b: {
                        c: {
                            d: {
                                e: {
                                    f: {
                                        g: {
                                            h: {
                                                i: 1
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            const result = serialize(jsonSchema)(createSer(), toSerialize)

            const ser = createSer()
            ser.serializeNumber(toSerialize.a.b.c.d.e.f.g.h.i)

            expect(result).toStrictEqual(ser.getBuffer())
        })
    })

    describe('array serialization', () => {
        it('should serialize array of objects', () => {
            const jsonSchema = {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string'
                        },
                        age: {
                            type: 'integer'
                        }
                    }
                }
            } as const

            const toSerialize = [{ name: 'test', age: 1 }]

            const result = serialize(jsonSchema)(createSer(), toSerialize)

            const ser = createSer()
            ser.serializeArray(toSerialize, (ser, object) => {
                ser.serializeString(object.name)
                ser.serializeNumber(object.age)
            })

            expect(result).toStrictEqual(ser.getBuffer())
        })

        it('should serialize array of plain values', () => {
            const jsonSchema = {
                type: 'array',
                items: { type: 'string' }
            } as const

            const toSerialize = ['test', 'test2']

            const result = serialize(jsonSchema)(createSer(), toSerialize)

            const ser = createSer()
            ser.serializeArray(toSerialize, (ser, object) => {
                ser.serializeString(object)
            })

            expect(result).toStrictEqual(ser.getBuffer())
        })
    })
})