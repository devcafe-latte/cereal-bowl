import { SqlResult } from './SqlResults';
import { Serializer } from '../util/Serializer';

class User {
  id: number;
  username: string;
  m: { id: number, app: string, role: string }[]
  static deserialize() {
    return Serializer.deserialize<User>(User, this)
  }
}

describe("Processing results", () => {
  let rows;

  beforeEach(() => {
    rows = [
      { u: { id: 1, username: 'Jack' }, m: { id: 1, app: 'some-app', role: 'admin' } },
      { u: { id: 1, username: 'Jack' }, m: { id: 3, app: 'some-app', role: 'user' } },
      { u: { id: 8, username: 'Bruce' }, m: { id: 34, app: 'some-app', role: 'user' } },
    ];
  });

  it("processes nested results from Mysql", () => {
    const expected = {
      u: {
        1: { id: 1, username: 'Jack' },
        8: { id: 8, username: 'Bruce' },
      },
      m: {
        1: { id: 1, app: 'some-app', role: 'admin' },
        3: { id: 3, app: 'some-app', role: 'user' },
        34: { id: 34, app: 'some-app', role: 'user' }
      }
    };

    const r = SqlResult.new(rows);
    expect(r.data).toEqual(expected);
  });

  it("Tries setDefault", () => {
    const r = SqlResult.new(rows);
    r.data.u[1].someArray = [1, 2, 3];
    r.setDefault('u', 'someArray');

    expect(r.data.u[1].someArray).toEqual([1, 2, 3]);
    expect(r.data.u[8].someArray).toEqual([]);

  });

  it("tries casting", () => {
    const r = SqlResult.new(rows);
    expect(r.data.u[1].constructor.name).toBe("Object");
    expect(r.data.u[8].constructor.name).toBe("Object");
    r.cast('u', User);
    expect(r.data.u[1].constructor.name).toBe("User");
    expect(r.data.u[8].constructor.name).toBe("User");

  });


  it("Checks of the order is maintained.", async () => {
    const rows = [
      { u: { id: 8, username: 'Bruce' }, m: { id: 34, app: 'some-app', role: 'user' } },
      { u: { id: 1, username: 'Jack' }, m: { id: 1, app: 'some-app', role: 'admin' } },
      { u: { id: 1, username: 'Jack' }, m: { id: 3, app: 'some-app', role: 'user' } },

    ];

    const r = SqlResult.new(rows);

    const users = r.get<any>('u');
    expect(users[0].username).toBe('Bruce');
    expect(users[1].username).toBe('Jack');

  });

});