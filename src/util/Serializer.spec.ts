import { DateTime } from "luxon";
import {
  Serializer,
  ObjectMapping,
  deserializerContexts,
  serializerContexts,
  defaultSerializerMappings,
} from "./Serializer";
import { Page } from "./Page";

describe("Deserialize", () => {
  const exampleJson = {
    uuid: "ee13624b-cf22-4597-adb9-bfa4b16baa71",
    name: null,
    email: "coo@covle.com",
    created: 1584422435,
    session: {
      created: 1584422436,
      expires: 1585027236,
      token: "590c3a95dbf475b04ece7510fd0c72cd",
    },
    memberships: [
      { id: 1, created: 1565516907, app: "test-main", role: "admin" },
    ],
  };

  test("page bug", () => {
    const p = new Page({
      perPage: 10,
      totalItems: 100,
      currentPage: 3,
      items: [],
    });

    expect(p.totalItems).toBe(100);

    const s = Serializer.serialize(p);
    expect(s.totalItems).toBe(100);
    expect(s.perPage).toBe(10);
  });

  it("Basics", () => {
    const user = Serializer.deserialize<User>(User, {
      uuid: "123",
      name: "coo",
    });
    expect(user.name).toBe("coo");
    expect(user.uuid).toBe("123");
  });

  it("Mapping", () => {
    const timestamp = DateTime.now().toSeconds();
    const mapping = {
      created: "datetime",
      name: (v: string) => v.toUpperCase(),
      nope: (v) => false,
      age: "nuMBer",
    };

    const user = Serializer.deserialize<User>(
      User,
      { uuid: "123", name: "coo", created: timestamp, age: "44" },
      mapping
    );
    //Should be uppercase
    expect(user.name).toBe("COO");
    expect(user.uuid).toBe("123");
    expect(user.uuid).toBe("123");
    expect(user.age).toBe(44);
    expect(typeof user.age).toBe("number");
    expect(user.created.constructor.name).toBe("DateTime");
    expect(user.created.toSeconds()).toBe(timestamp);
  });

  it("Custom transformations", () => {
    deserializerContexts.default["grump"] = (data) => `foo ${data}`;

    const mapping = {
      name: "grump",
    };

    const user = Serializer.deserialize<User>(User, { name: "coo" }, mapping);
    expect(user.name).toBe("foo coo");
  });

  it("Custom transformation context", () => {
    deserializerContexts["custom"] = { grump: (data) => `foo ${data}` };

    const mapping = {
      name: "grump",
    };

    const user = Serializer.deserialize<User>(User, { name: "coo" }, mapping, 'custom');
    expect(user.name).toBe("foo coo");
  });

  it("Session", () => {
    const mapping: ObjectMapping = {
      created: "datetime",
      expires: "datetime",
    };
    let s = Serializer.deserialize<Session>(
      Session,
      exampleJson.session,
      mapping
    );
    expect(s.created.constructor.name).toBe("DateTime");
    expect(s.expires.constructor.name).toBe("DateTime");
  });

  it("User", () => {
    const mapping: ObjectMapping = {
      created: "datetime",
      session: (data) => Session.deserialize(data),
    };
    let u = Serializer.deserialize<User>(User, exampleJson, mapping);
    expect(u.created.constructor.name).toBe("DateTime");
    expect(u.session.constructor.name).toBe("Session");
  });
});

describe("Serialize", () => {
  it("takes a simple value", () => {
    expect(Serializer.serialize(1)).toBe(1);
    expect(Serializer.serialize("foo")).toBe("foo");
    expect(Serializer.serialize(false)).toBe(false);
    expect(
      Serializer.serialize(
        DateTime.fromObject({ year: 2020, month: 1, day: 1 })
      )
    ).toBe(1577811600);
  });

  it("takes a simple array", () => {
    const array = [1, "foo", false];
    const result = Serializer.serialize(array);
    expect(result).toEqual(array);
  });

  it("takes a simple Object with several types", () => {
    const obj = { num: 1, str: "foo", bool: false };
    const result = Serializer.serialize(obj);
    expect(result).toEqual(obj);
  });

  it("takes a simple object With a Date", () => {
    const obj = { date: DateTime.now() };
    const result = Serializer.serialize(obj);
    expect(typeof result.date).toBe("number");
  });

  it("takes a Custom serializer context", () => {
    serializerContexts["custom"] = [...defaultSerializerMappings];
    serializerContexts["custom"].push({
      name: "test-1",
      isType: (val, className) => val.isTestThing !== undefined,
      serialize: (val) => `moo ${val.name}`,
    });

    serializerContexts["custom"].push({
      name: "test-2",
      isType: (val, className) => val.isTest2 !== undefined,
      serialize: (val) => `poo ${val.name}`,
    });

    const type1 = {
      isTestThing: true,
      name: "Ferdinand",
    };

    const type2 = {
      isTest2: true,
      name: "Spongebob",
    };

    expect(Serializer.serialize(type1, "custom")).toBe("moo Ferdinand");
    expect(Serializer.serialize(type2, "custom")).toBe("poo Spongebob");

    const object = {
      testData: type1,
      testData2: type2,
      foo: "bar",
      bluh: { name: "knop" },
    };

    const result = Serializer.serialize(object, "custom");
    expect(result.testData).toBe("moo Ferdinand");
    expect(result.testData2).toBe("poo Spongebob");
    expect(result.foo).toBe("bar");
    expect(result.bluh.name).toBe("knop");
  });

  it("takes a Custom serializer mapping", () => {
    serializerContexts["default"] = [...defaultSerializerMappings];
    serializerContexts["default"].push({
      name: "test-1",
      isType: (val, className) => val.isTestThing !== undefined,
      serialize: (val) => `moo ${val.name}`,
    });

    serializerContexts["default"].push({
      name: "test-2",
      isType: (val, className) => val.isTest2 !== undefined,
      serialize: (val) => `poo ${val.name}`,
    });

    const type1 = {
      isTestThing: true,
      name: "Ferdinand",
    };

    const type2 = {
      isTest2: true,
      name: "Spongebob",
    };

    expect(Serializer.serialize(type1)).toBe("moo Ferdinand");
    expect(Serializer.serialize(type2)).toBe("poo Spongebob");

    const object = {
      testData: type1,
      testData2: type2,
      foo: "bar",
      bluh: { name: "knop" },
    };

    const result = Serializer.serialize(object);
    expect(result.testData).toBe("moo Ferdinand");
    expect(result.testData2).toBe("poo Spongebob");
    expect(result.foo).toBe("bar");
    expect(result.bluh.name).toBe("knop");
  });

  it("takes a complex Object", () => {
    const input = {
      d: DateTime.now().startOf("week"),
      str: "foo",
      o: {
        serialize: () => {
          return { r: "serialized" };
        },
      },
    };

    const expected = {
      d: DateTime.now().startOf("week").toSeconds(),
      str: "foo",
      o: { r: "serialized" },
    };

    const result = Serializer.serialize(input);
    expect(result).toEqual(expected);
  });

  it("takes an array with a complex Object", () => {
    const input = {
      d: DateTime.now().startOf("week"),
      str: "foo",
      o: {
        serialize: () => {
          return { r: "serialized" };
        },
      },
    };

    const expected = {
      d: DateTime.now().startOf("week").toSeconds(),
      str: "foo",
      o: { r: "serialized" },
    };

    const result = Serializer.serialize([input]);
    expect(result).toEqual([expected]);
  });
});

class User {
  uuid: string = null;
  name: string = null;
  email: string = null;
  session: Session = null;
  memberships: any[] = null;
  created: DateTime = null;
  age?: number = null;
}

class Session {
  created: DateTime = null;
  expires: DateTime = null;
  token: string = null;

  static deserialize(data: any): Session {
    const m: ObjectMapping = {
      created: "datetime",
      expires: "datetime",
    };
    return Serializer.deserialize(Session, data, m);
  }
}
