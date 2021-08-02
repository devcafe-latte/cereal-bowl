import { TestHelper } from '../testing/TestHelper';
import { Book, Author } from '../testing/model';
import { Serializer } from '../util/Serializer';

let th: TestHelper;

describe("Database Diagnostics Tests", () => {

  beforeEach(async () => {
    try {
      th = await TestHelper.new();
    } catch (err) {
      console.error(err);
      console.log("Can't init testhelper");
      throw err;
    }
  });

  afterEach(async () => {
    if (th) await th.shutdown();
  });

  it('Ping', async () => {
    await th.db.ping();
    expect(1).toBe(1); // As long as we get here...
  });

  it('Shutdown and Ping Failure', async () => {
    await th.db.shutdown();

    await th.db.ping()
      .then(() => {
        //We shouldn't get here
        expect(true).toBe(false);
      })
      .catch(() => { });
  });

  it("gets active connections", async () => {
    const value = await th.db.activeConnections();
    expect(value).toBeGreaterThanOrEqual(1);
  });

});



// describe("TRANSACTIONS Tests", () => {
//   beforeEach(async () => {
//     th = await TestHelper.new();
//     
//   });

//   afterEach(async () => {
//     await th.shutdown();
//     
//   });

//   it("Rollback a transaction", async () => {

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

//     
//   });

//   it("Commit a transaction", async () => {

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

//     
//   });

//   it("Commit a 150 transactions", async () => {

//     for (let i = 0; i < 150; i++) {
//       const t = await th.db.getTransaction();
//       await t.insert(Book.randomBook())
//       await t.commit();
//     }

//     
//   });

//   it("Timeout a transaction", async () => {
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

//     
//   });


// });

describe("INSERT Tests", () => {

  let lastQId = 0;

  beforeEach(async () => {
    th = await TestHelper.new();
    lastQId = Number(await th.db.getValue("SELECT MAX(id) FROM book"));
    
  });

  afterEach(async () => {
    await th.shutdown();
    
  });

  it("Test Insert, complex type", async () => {
    const b = Book.randomBook();

    await th.db.insert(b);
    expect(b.id).toBe(lastQId + 1);

    const sql = "SELECT COUNT(*) as 'c' from `book`";
    const result = await th.db.query(sql);
    expect(result[0]['c']).toBeGreaterThan(2);

    
  });

  it("Test Insert, plain object", async () => {
    const b = Book.randomBook();
    const object = Serializer.serialize(b);

    await th.db.insert(object, 'book');
    expect(object.id).toBe(lastQId + 1);

    const sql = "SELECT COUNT(*) as 'c' from `book`";
    const result = await th.db.query(sql);
    expect(result[0]['c']).toBeGreaterThan(2);

    
  });

  it("Test Insert, Wrong object", async () => {

    const object = { beans: 'foo' };

    try {
      await th.db.insert(object, 'book');
    } catch (err) {
      expect(err.message).toContain("cannot be null");
    }

    const sql = "SELECT COUNT(*) as 'c' from `book`";
    const result = await th.db.query(sql);
    expect(result[0]['c']).toBeGreaterThan(1);

    
  });

  it("Test Multi Inserts", async () => {

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

    
  });

});

describe("SELECT Tests", () => {

  beforeEach(async () => {
    th = await TestHelper.new();
    
  });

  afterEach(async () => {
    await th.shutdown();
    
  });

  it("Tests serializing rows", async () => {
    const books = await th.db.getRows<Book>("SELECT * FROM `book`", [], Book);
    expect(books.length).toBeGreaterThan(2);
    const b = books[0];
    expect(b.title).toContain("Being fat")
    expect(b.constructor.name).toBe("Book");
    
  });

  it("Tests getting rows as objects", async () => {
    const books: any[] = await th.db.getRows("SELECT * FROM `book`", []);
    expect(books.length).toBeGreaterThan(2);
    const b = books[0];
    expect(b.title).toContain("Being fat")
    expect(b.constructor.name).toBe("Object");
    
  });

  it("Tests getting a single row", async () => {
    const b = await th.db.getRow<Book>("SELECT * FROM `book`", [], Book);
    expect(b.title).not.toBeNull();
    expect(b.constructor.name).toBe("Book");
    
  });

  it("Tests getting a single row, doesn't exist.", async () => {
    const q = await th.db.getRow<Book>("SELECT * FROM `book` WHERE id = ?", [99], Book);
    expect(q).toBeNull();
    
  });

  it("Tests getting values.", async () => {
    const titles = await th.db.getValues("SELECT title FROM `book` LIMIT 3", []);
    expect(titles.length).toBe(3);
    expect(titles).toEqual(['Being fat is a choice', 'De motu corporum in gyrum', 'Reports as Master of the Mint']);
    
  });

  it("Tests getting value", async () => {
    const id = await th.db.getValue("SELECT id FROM `book` WHERE id = ?", [1]);
    expect(id).toEqual(1);
    
  });

  it("Tests getting Booleans", async () => {
    let books = await th.db.getRows<Book>("SELECT * FROM `book` ORDER BY `id`");
    expect(typeof books[0].isGood).toEqual("boolean");
    expect(books[0].isGood).toBe(true);
    expect(books[1].isGood).toBe(null);
    expect(books[2].isGood).toBe(false);

    
  });


});

describe("getObjects Tests", () => {

  beforeEach(async () => {
    th = await TestHelper.new();

    
  });

  afterEach(async () => {
    await th.shutdown();
    
  });

  it("gets rows and cast them", async () => {
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

    
  });

  it("gets rows, no casting", async () => {
    const qry = { sql: "SELECT * FROM `book` b LEFT OUTER JOIN `author` a ON b.authorId = a.id" };
    const results = await th.db.getObjects(qry);

    expect(results.hasResults).toBe(true);

    expect(results.get('b').length).toBe(3);
    expect(results.get('a').length).toBe(2);

    const b1 = results.get('b', 1);
    const a1 = results.get('a', 1);

    expect(b1.constructor.name).toBe("Object");
    expect(a1.constructor.name).toBe("Object");

    
  });

});

describe("UPDATE Tests", () => {

  beforeEach(async () => {
    th = await TestHelper.new();
    
  });

  afterEach(async () => {
    await th.shutdown();
    
  });

  it("Tests updating", async () => {
    const b = new Book();
    b.id = 1;
    b.title = "bluppieflop";
    b.subtitle = 'Of Foos and Bars';

    await th.db.update({ object: b });

    const gotten = await th.db.getRow<Book>("SELECT * FROM `book` WHERE id = ?", [b.id], Book);
    expect(gotten.title).toBe("bluppieflop");
    expect(gotten.subtitle).toBe("Of Foos and Bars");
    expect(gotten.isbn).toBe("0123456789");

    
  });

  it("Tests updating, no WHERE", async () => {
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

    
  });

  it("Tests updating, NULLS", async () => {
    await th.db.query("UPDATE book SET subtitle = 'Achieve anything with these easy steps!' WHERE id = 1");

    const b = await th.db.getRow<Book>("SELECT * FROM `book` WHERE id = 1", [], Book);
    expect(b.subtitle).not.toBeNull();

    b.subtitle = null;

    await th.db.update({ object: b });

    const gotten = await th.db.getRow<Book>("SELECT * FROM `book` WHERE id = 1", [], Book);
    //KeepNulls wasn't set, we should not have updated
    expect(gotten.subtitle).not.toBeNull();

    await th.db.update({ object: b, keepNulls: true });

    const gotten2 = await th.db.getRow<Book>("SELECT * FROM `book` WHERE id = 1", [], Book);
    //should be null now
    expect(gotten2.subtitle).toBeNull();

    
  });
});