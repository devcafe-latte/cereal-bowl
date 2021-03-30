import moment from 'moment';

import { Serializer, ObjectMapping, deserializerMappings, serializerMappings } from './Serializer';
import { Moment } from 'moment';

describe('Deserialize', () => {

  const exampleJson = {
    uuid: 'ee13624b-cf22-4597-adb9-bfa4b16baa71',
    name: null,
    email: 'coo@covle.com',
    created: 1584422435,
    session:
    {
      created: 1584422436,
      expires: 1585027236,
      token: '590c3a95dbf475b04ece7510fd0c72cd'
    },
    memberships:
      [{ id: 1, created: 1565516907, app: 'test-main', role: 'admin' }]
  };

  it('Basics', () => {
    const user = Serializer.deserialize<User>(User, { uuid: "123", name: 'coo' });
    expect(user.name).toBe('coo');
    expect(user.uuid).toBe("123");
  });

  it('Mapping', () => {
    const timestamp = moment().unix();
    const mapping = {
      created: "Moment",
      name: (v: string) => v.toUpperCase(),
      nope: (v) => false,
      age: 'nuMBer'
    };

    const user = Serializer.deserialize<User>(User, { uuid: "123", name: 'coo', created: timestamp, age: "44" }, mapping);
    expect(user.name).toBe('COO', "Should be uppercase");
    expect(user.uuid).toBe("123");
    expect(user.uuid).toBe("123");
    expect(user.age).toBe(44);
    expect(typeof user.age).toBe("number");
    expect(user.created.constructor.name).toBe("Moment");
    expect(user.created.unix()).toBe(timestamp);
  });

  it('Custom transformations', () => {
    deserializerMappings['grump'] = (data) => `foo ${data}`;
    
    const mapping = {
      name: 'grump',
    };

    const user = Serializer.deserialize<User>(User, { name: 'coo' }, mapping);
    expect(user.name).toBe('foo coo');
  });

  it("Session", () => {
    const mapping: ObjectMapping = {
      created: 'moment',
      expires: 'moment'
    };
    let s = Serializer.deserialize<Session>(Session, exampleJson.session, mapping);
    expect(s.created.constructor.name).toBe("Moment");
    expect(s.expires.constructor.name).toBe("Moment");
  });

  it("User", () => {
    const mapping: ObjectMapping = {
      created: 'moment',
      session: (data) => Session.deserialize(data),
    };
    let u = Serializer.deserialize<User>(User, exampleJson, mapping);
    expect(u.created.constructor.name).toBe("Moment");
    expect(u.session.constructor.name).toBe("Session");
  });
});

describe('Serialize', () => {

  it("takes a simple value", () => {
    expect(Serializer.serialize(1)).toBe(1);
    expect(Serializer.serialize("foo")).toBe("foo");
    expect(Serializer.serialize(false)).toBe(false);
    expect(Serializer.serialize(moment().year(2020).startOf('year'))).toBe(1577811600);
  });

  it("takes a simple array", () => {
    const array = [1, "foo", false]
    const result = Serializer.serialize(array);
    expect(result).toEqual(array);
  });

  it("takes a simple Object with several types", () => {
    const obj = { num: 1, str: "foo", bool: false };
    const result = Serializer.serialize(obj);
    expect(result).toEqual(obj);
  });

  it("takes a simple object With a Moment", () => {
    const obj = { date: moment() };
    const result = Serializer.serialize(obj);
    expect(typeof result.date).toBe('number');
  });

  it("takes a Custom serializer", () => {
    serializerMappings.push({
      name: 'test-1',
      isType: (val, className) => val.isTestThing !== undefined,
      serialize: (val) => `moo ${val.name}`,
    });

    const data = {
      isTestThing: true,
      name: 'Ferdinand'
    }

    expect(Serializer.serialize(data)).toBe('moo Ferdinand');

    const object = {
      testData: data,
      foo: 'bar',
      bluh: { name: 'knop' }
    }

    const result = Serializer.serialize(object);
    expect(result.testData).toBe('moo Ferdinand');
    expect(result.foo).toBe('bar');
    expect(result.bluh.name).toBe('knop');

  });

  it("takes a complex Object", () => {
    const input = {
      d: moment().startOf('week'),
      str: 'foo',
      o: { serialize: () => { return { r: 'serialized' } } }
    };

    const expected = {
      d: moment().startOf('week').unix(),
      str: 'foo',
      o: { r: 'serialized' }
    };

    const result = Serializer.serialize(input);
    expect(result).toEqual(expected);
  });

  it("takes an array with a complex Object", () => {
    const input = {
      d: moment().startOf('week'),
      str: 'foo',
      o: { serialize: () => { return { r: 'serialized' } } }
    };

    const expected = {
      d: moment().startOf('week').unix(),
      str: 'foo',
      o: { r: 'serialized' }
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
  created: Moment = null;
  age?: number = null;
}

class Session {
  created: Moment = null;
  expires: Moment = null;
  token: string = null;

  static deserialize(data: any): Session {
    const m: ObjectMapping = {
      created: 'moment',
      expires: 'moment',
    };
    return Serializer.deserialize(Session, data, m);
  }
}
