# seqproto-schemify

seqproto-schemify is an utility that aims to generate seqproto serialization and deserialization code from a json schema.

## Usage

### Serialization

```javascript
import { serialize } from 'seqproto-schemify';
import { createSer } from 'seqproto'

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
};

const serializer = serialize(jsonSchema);

const toSerialize = {
    age: 1,
    name: 'test'
};

const resultBuffer = serializer(createSer(), toSerialize);
```


### Deserialization

```javascript
import { deserialize } from 'seqproto-schemify';
import { createDes } from 'seqproto'

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
};

const deserializer = deserialize(jsonSchema);

const arrayBuffer = ...

const result = deserializer(createDes(arrayBuffer));
```