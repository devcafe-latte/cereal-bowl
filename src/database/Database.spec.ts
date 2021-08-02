import { TestHelper } from '../testing/TestHelper';
import { Book, Author } from '../testing/model';
import { Serializer } from '../util/Serializer';

let th: TestHelper;

describe("Database Diagnostics Tests", () => {

  beforeEach(async (done) => {
    try {
      th = await TestHelper.new();
    } catch (err) {
      console.error(err);
      console.log("Can't init testhelper");
      throw err;
    }

    done();
  });

  afterEach(async (done) => {
    if (th) await th.shutdown();
    done();
  });

  it('Ping', async (done) => {
    await expectAsync(th.db.ping()).toBeResolved();
    done();
  });

  it('Shutdown and Ping Failure', async () => {
    await th.db.shutdown();
    await expectAsync(th.db.ping()).toBeRejected();
    console.log("done?");
    
  });

  it("gets active connections", async (done) => {
    const value = await th.db.activeConnections();
    expect(value).toBeGreaterThanOrEqual(1);
    done();
  });

});



// describe("TRANSACTIONS Tests", () => {
//   beforeEach(async (done) => {
//     th = await TestHelper.new();
//     done();
//   });

//   afterEach(async (done) => {
//     await th.shutdown();
//     done();
//   });

//   it("Rollback a transaction", async (done) => {

//     const t = await th.db.getTransaction();

//     const beforeCount = await t.getValue("SELECT COUNT(*) FROM `book`");
//     expect(beforeCount).toBeGreaterThanOrEqual(3);

//     await t.insert(Book.randomBook())

//     const duringCount = await t.getValue("SELECT COUNT(*) FROM book");
//     expect(duringCount).toBe(beforeCount + 1, "Within transaction, should be counted.");

//     const duringCount2 = await th.db.getValue("SELECT COUNT(*) FROM book");
//     expect(duringCount2).toBe(beforeCount, "Outside transaction, should NOT be counted.");

//     await t.rollback();

//     const afterCount = await t.getValue("SELECT COUNT(*) FROM book");
//     expect(afterCount).toBe(beforeCount, "Within transaction, should be rolled back.");

//     const afterCount2 = await th.db.getValue("SELECT COUNT(*) FROM book");
//     expect(afterCount2).toBe(beforeCount, "Outside transaction, should NOT be counted.");

//     done();
//   });

//   it("Commit a transaction", async (done) => {

//     const t = await th.db.getTransaction();

//     const beforeCount = await t.getValue("SELECT COUNT(*) FROM book");
//     expect(beforeCount).toBeGreaterThanOrEqual(3);

//     await t.insert(Book.randomBook())

//     const duringCount = await t.getValue("SELECT COUNT(*) FROM book");
//     expect(duringCount).toBe(beforeCount + 1, "Within transaction, should be counted.");

//     const duringCount2 = await th.db.getValue("SELECT COUNT(*) FROM book");
//     expect(duringCount2).toBe(beforeCount, "Outside transaction, should NOT be counted.");

//     await t.commit();

//     const afterCount = await t.getValue("SELECT COUNT(*) FROM book");
//     expect(afterCount).toBe(beforeCount + 1, "Within transaction, should be Committed.");

//     const afterCount2 = await th.db.getValue("SELECT COUNT(*) FROM book");
//     expect(afterCount2).toBe(beforeCount + 1, "Outside transaction, should be counted as it is committed.");

//     done();
//   });

//   it("Commit a 150 transactions", async (done) => {

//     for (let i = 0; i < 150; i++) {
//       const t = await th.db.getTransaction();
//       await t.insert(Book.randomBook())
//       await t.commit();
//     }

//     done();
//   });

//   it("Timeout a transaction", async (done) => {
//     const t = await th.db.getTransaction();

//     const beforeCount = await t.getValue("SELECT COUNT(*) FROM book");
//     expect(beforeCount).toBeGreaterThanOrEqual(3);

//     await t.insert(Book.randomBook())

//     const duringCount = await t.getValue("SELECT COUNT(*) FROM book");
//     expect(duringCount).toBe(beforeCount + 1, "Within transaction, should be counted.");

//     const duringCount2 = await th.db.getValue("SELECT COUNT(*) FROM book");
//     expect(duringCount2).toBe(beforeCount, "Outside transaction, should NOT be counted.");

//     await th.sleep(11000);

//     const afterCount = await t.getValue("SELECT COUNT(*) FROM book");
//     expect(afterCount).toBe(beforeCount, "Within transaction, should be rolled back due to timeout.");

//     const afterCount2 = await th.db.getValue("SELECT COUNT(*) FROM book");
//     expect(afterCount2).toBe(beforeCount, "Outside transaction, should NOT be counted.");

//     done();
//   });


// });

describe("INSERT Tests", () => {

  let lastQId = 0;

  beforeEach(async (done) => {
    th = await TestHelper.new();
    lastQId = Number(await th.db.getValue("SELECT MAX(id) FROM book"));
    done();
  });

  afterEach(async (done) => {
    await th.shutdown();
    done();
  });

  it("Test Insert, complex type", async (done) => {
    const b = Book.randomBook();

    await th.db.insert(b);
    expect(b.id).toBe(lastQId + 1);

    const sql = "SELECT COUNT(*) as 'c' from `book`";
    const result = await th.db.query(sql);
    expect(result[0]['c']).toBeGreaterThan(2);

    done();
  });

  it("Test Insert, plain object", async (done) => {
    const b = Book.randomBook();
    const object = Serializer.serialize(b);

    await th.db.insert(object, 'book');
    expect(object.id).toBe(lastQId + 1);

    const sql = "SELECT COUNT(*) as 'c' from `book`";
    const result = await th.db.query(sql);
    expect(result[0]['c']).toBeGreaterThan(2);

    done();
  });

  it("Test Insert, Wrong object", async (done) => {

    const object = { beans: 'foo' };

    try {
      await th.db.insert(object, 'book');
    } catch (err) {
      expect(err.message).toContain("cannot be null");
    }

    const sql = "SELECT COUNT(*) as 'c' from `book`";
    const result = await th.db.query(sql);
    expect(result[0]['c']).toBeGreaterThan(1);

    done();
  });

  it("Test Multi Inserts", async (done) => {

    const books = [
      Book.randomBook(),
      Book.randomBook(),
      Book.randomBook(),
      Book.randomBook(),
    ];
  
    await th.db.insert(books);

    expect(books[0].id).toBe(lastQId + 1);
    expect(books[1].id).toBe(lastQId + 2);
    expect(books[2].id).toBe(lastQId + 3);
    expect(books[3].id).toBe(lastQId + 4);

    const sql = "SELECT COUNT(*) as 'c' from `book`";
    const result = await th.db.query(sql);
    expect(result[0]['c']).toBeGreaterThan(5);

    done();
  });

});

describe("SELECT Tests", () => {

  beforeEach(async (done) => {
    th = await TestHelper.new();
    done();
  });

  afterEach(async (done) => {
    await th.shutdown();
    done();
  });

  it("Tests serializing rows", async (done) => {
    const books = await th.db.getRows<Book>("SELECT * FROM `book`", [], Book);
    expect(books.length).toBeGreaterThan(2);
    const b = books[0];
    expect(b.title).toContain("Being fat")
    expect(b.constructor.name).toBe("Book");
    done();
  });

  it("Tests getting rows as objects", async (done) => {
    const books: any[] = await th.db.getRows("SELECT * FROM `book`", []);
    expect(books.length).toBeGreaterThan(2);
    const b = books[0];
    expect(b.title).toContain("Being fat")
    expect(b.constructor.name).toBe("Object");
    done();
  });

  it("Tests getting a single row", async (done) => {
    const b = await th.db.getRow<Book>("SELECT * FROM `book`", [], Book);
    expect(b.title).not.toBeNull();
    expect(b.constructor.name).toBe("Book");
    done();
  });

  it("Tests getting a single row, doesn't exist.", async (done) => {
    const q = await th.db.getRow<Book>("SELECT * FROM `book` WHERE id = ?", [99], Book);
    expect(q).toBeNull();
    done();
  });

  it("Tests getting values.", async (done) => {
    const titles = await th.db.getValues("SELECT title FROM `book` LIMIT 3", []);
    expect(titles.length).toBe(3);
    expect(titles).toEqual(['Being fat is a choice', 'De motu corporum in gyrum', 'Reports as Master of the Mint']);
    done();
  });

  it("Tests getting value", async (done) => {
    const id = await th.db.getValue("SELECT id FROM `book` WHERE id = ?", [1]);
    expect(id).toEqual(1);
    done();
  });

  it("Tests getting Booleans", async (done) => {
    let books = await th.db.getRows<Book>("SELECT * FROM `book` ORDER BY `id`");
    expect(typeof books[0].isGood).toEqual("boolean");
    expect(books[0].isGood).toBe(true);
    expect(books[1].isGood).toBe(null);
    expect(books[2].isGood).toBe(false);
    
    done();
  });


});

describe("getObjects Tests", () => {

  beforeEach(async (done) => {
    th = await TestHelper.new();

    done();
  });

  afterEach(async (done) => {
    await th.shutdown();
    done();
  });

  it("gets rows and cast them", async (done) => {
    const qry = { sql: "SELECT * FROM `book` b LEFT OUTER JOIN `author` a ON b.authorId = a.id" };
    const mapping = {
      b: Book,
      a: Author
    };
    const results = await th.db.getObjects(qry, mapping);

    expect(results.hasResults).toBe(true);

    expect(results.get('b').length).toBe(3);
    expect(results.get('a').length).toBe(2);

    const b1 = results.get('b', 1);
    const a1 = results.get('a', 1);

    expect(b1.constructor.name).toBe("Book");
    expect(a1.constructor.name).toBe("Author");

    done();
  });

  it("gets rows, no casting", async (done) => {
    const qry = { sql: "SELECT * FROM `book` b LEFT OUTER JOIN `author` a ON b.authorId = a.id" };
    const results = await th.db.getObjects(qry);

    expect(results.hasResults).toBe(true);

    expect(results.get('b').length).toBe(3);
    expect(results.get('a').length).toBe(2);

    const b1 = results.get('b', 1);
    const a1 = results.get('a', 1);

    expect(b1.constructor.name).toBe("Object");
    expect(a1.constructor.name).toBe("Object");

    done();
  });

});

describe("UPDATE Tests", () => {

  beforeEach(async (done) => {
    th = await TestHelper.new();
    done();
  });

  afterEach(async (done) => {
    await th.shutdown();
    done();
  });

  it("Tests updating", async (done) => {
    const b = new Book();
    b.id = 1;
    b.title = "bluppieflop";
    b.subtitle = 'Of Foos and Bars';

    await th.db.update({ object: b });

    const gotten = await th.db.getRow<Book>("SELECT * FROM `book` WHERE id = ?", [b.id], Book);
    expect(gotten.title).toBe("bluppieflop");
    expect(gotten.subtitle).toBe("Of Foos and Bars");
    expect(gotten.isbn).toBe("0123456789");

    done();
  });

  it("Tests updating, no WHERE", async (done) => {
    const q = new Book();
    q.id = undefined;
    q.title = 'SpongeBob, The untold story.';
    q.subtitle = 'Pinapple life ain\'t easy';

    try {
      await th.db.update({ object: q });
      throw "Nope";
    } catch (err) {
      expect(err.message).toContain("Object does not have value for");
    }

    done();
  });

  it("Tests updating, NULLS", async (done) => {
    await th.db.query("UPDATE book SET subtitle = 'Achieve anything with these easy steps!' WHERE id = 1");

    const b = await th.db.getRow<Book>("SELECT * FROM `book` WHERE id = 1", [], Book);
    expect(b.subtitle).not.toBeNull();

    b.subtitle = null;

    await th.db.update({ object: b });

    const gotten = await th.db.getRow<Book>("SELECT * FROM `book` WHERE id = 1", [], Book);
    expect(gotten.subtitle).not.toBeNull("KeepNulls wasn't set, we should not have updated");

    await th.db.update({ object: b, keepNulls: true });

    const gotten2 = await th.db.getRow<Book>("SELECT * FROM `book` WHERE id = 1", [], Book);
    expect(gotten2.subtitle).toBeNull("should be null now");

    done();
  });
});