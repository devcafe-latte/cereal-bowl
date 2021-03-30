import moment from 'moment';
import { Moment } from 'moment';

//Serialization
export interface SerializerMapping {
  name: string;
  isType: (value: any, className: string) => boolean;
  serialize: (value: any) => any;
}
export const defaultSerializerMappings: SerializerMapping[] = [
  {
    name: 'moment',
    isType: (val, className) => className === 'Moment',
    serialize: (val: Moment) => val.unix(),
  },
];
export let serializerMappings: SerializerMapping[] = [...defaultSerializerMappings];

//Deserialization
export const defaultDeserializerMappings: DeserializerMapppings = {
  'moment': (value) => moment.unix(value),
  'number': (value) => Number(value),
};
export let deserializerMappings: DeserializerMapppings = { ...defaultDeserializerMappings };
export interface DeserializerMapppings {
  [key: string]: (data: any) => any;
}

export class Serializer {
  static deserialize<T>(type: { new(): T }, data: any, mapping: ObjectMapping = {}): T {
    if (data === null || data === undefined) return null;

    const o = new type();
    for (let key in o) {
      if (!o.hasOwnProperty(key)) continue;
      if (data[key] === undefined) continue;

      o[key] = Serializer.mapValue(data[key], mapping[key]);
    }

    return o;
  }

  private static mapValue(value: any, action: string | Function): any {
    //No mapping
    if (!action) return value;

    //Don't do nulls and undefined.
    if (value === null || value === undefined) return value;

    //Function
    if (typeof action === "function") return action(value);

    const lower = action.toLowerCase();
    if (deserializerMappings[lower]) {
      return deserializerMappings[lower](value);
    }

    console.error("Unknown action", action);
    throw "Unknown action";
  }

  static serialize(input: any, maxDepth = 10, currentDepth = 0) {
    if (currentDepth > maxDepth) return input;

    //Traverse input 
    // Array? recursive call
    // Moment? call unix()
    // serialize? call serialize()
    // object? recursive call

    let result: any;
    if (Array.isArray(input)) {
      result = [];
      for (let i of input) {
        result.push(Serializer.serialize(i, maxDepth, currentDepth + 1));
      }
      return result;
    } else if (typeof input === "object" && input !== null) {
      const className = input.constructor.name;

      for (let m of serializerMappings) {
        if (m.isType(input, className)) return m.serialize(input);
      }

      if (typeof input.serialize === "function") return input.serialize();

      result = {};
      for (let k in input) {
        if (!input.hasOwnProperty(k)) continue;
        result[k] = Serializer.serialize(input[k], maxDepth, currentDepth + 1);
      }
      return result;
    } else {
      return input;
    }
  }
}

export interface ObjectMapping {
  [prop: string]: string | Function;
}