import { DateTime } from "luxon";

//Serialization
export interface SerializerMapping {
  name: string;
  isType: (value: any, className: string) => boolean;
  serialize: (value: any) => any;
}
export const defaultSerializerMappings: SerializerMapping[] = [
  {
    name: "datetime",
    isType: (data, className) => DateTime.isDateTime(data),
    serialize: (data: DateTime) => Math.floor(data.toSeconds()),
  },
];

export const serializerContexts: Record<string, SerializerMapping[]> = {
  default: [...defaultSerializerMappings],
};

//Deserialization
export const defaultDeserializerMappings: DeserializerMapppings = {
  datetime: (value) => DateTime.fromSeconds(value),
  number: (value) => Number(value),
};
export const deserializerContexts: Record<string, DeserializerMapppings> = {
  default: { ...defaultDeserializerMappings },
};

export interface DeserializerMapppings {
  [key: string]: (data: any) => any;
}

export class Serializer {
  static deserialize<T>(
    type: { new (): T },
    data: any,
    mapping: ObjectMapping = {},
    context = 'default'
  ): T {
    if (data === null || data === undefined) return null;

    const o = new type();
    for (let key in o) {
      if (!o.hasOwnProperty(key)) continue;
      if (data[key] === undefined) continue;

      o[key] = Serializer.mapValue(data[key], mapping[key], context);
    }

    return o;
  }

  private static mapValue(value: any, action: string | Function, context: string): any {
    //No mapping
    if (!action) return value;

    //Don't do nulls and undefined.
    if (value === null || value === undefined) return value;

    //Function
    if (typeof action === "function") return action(value);

    const lower = action.toLowerCase();
    const mappings = deserializerContexts[context];
    if (!mappings) throw 'Unknown context: ' + context;
    if (mappings[lower]) {
      return mappings[lower](value);
    }

    console.error("Unknown action", action);
    throw "Unknown action";
  }

  static serialize(
    input: any,
    context = "default",
    maxDepth = 10,
    currentDepth = 0
  ) {
    if (currentDepth > maxDepth) return input;

    //Traverse input
    // Array? recursive call
    // serialize? call serialize()
    // object? recursive call

    let result: any;
    if (Array.isArray(input)) {
      result = [];
      for (let i of input) {
        result.push(
          Serializer.serialize(i, context, maxDepth, currentDepth + 1)
        );
      }
      return result;
    } else if (typeof input === "object" && input !== null) {
      const className = input.constructor.name;

      if (!serializerContexts[context]) throw "unknown context " + context;

      for (let m of serializerContexts[context]) {
        if (m.isType(input, className)) return m.serialize(input);
      }

      if (typeof input.serialize === "function") return input.serialize();

      result = {};
      for (let k in input) {
        if (!input.hasOwnProperty(k)) continue;
        result[k] = Serializer.serialize(
          input[k],
          context,
          maxDepth,
          currentDepth + 1
        );
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
