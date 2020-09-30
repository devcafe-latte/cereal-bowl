import { TestHelper } from '../testing/TestHelper';
import { Book } from '../testing/model';
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

  it('Shutdown and Ping Failure', async (done) => {
    await th.db.shutdown();
    await expectAsync(th.db.ping()).toBeRejected();
    done();
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

//     const beforeCount = await t.getValue("SELECT COUNT(*) FROM student");
//     expect(beforeCount).toBeGreaterThanOrEqual(10);

//     await t.insert(dg.getStudent(12))

//     const duringCount = await t.getValue("SELECT COUNT(*) FROM student");
//     expect(duringCount).toBe(beforeCount + 1, "Within transaction, should be counted.");

//     const duringCount2 = await th.db.getValue("SELECT COUNT(*) FROM student");
//     expect(duringCount2).toBe(beforeCount, "Outside transaction, should NOT be counted.");

//     await t.rollback();

//     const afterCount = await t.getValue("SELECT COUNT(*) FROM student");
//     expect(afterCount).toBe(beforeCount, "Within transaction, should be rolled back.");

//     const afterCount2 = await th.db.getValue("SELECT COUNT(*) FROM student");
//     expect(afterCount2).toBe(beforeCount, "Outside transaction, should NOT be counted.");

//     done();
//   });

//   it("Commit a transaction", async (done) => {

//     const t = await th.db.getTransaction();

//     const beforeCount = await t.getValue("SELECT COUNT(*) FROM student");
//     expect(beforeCount).toBeGreaterThanOrEqual(10);

//     await t.insert(dg.getStudent(12))

//     const duringCount = await t.getValue("SELECT COUNT(*) FROM student");
//     expect(duringCount).toBe(beforeCount + 1, "Within transaction, should be counted.");

//     const duringCount2 = await th.db.getValue("SELECT COUNT(*) FROM student");
//     expect(duringCount2).toBe(beforeCount, "Outside transaction, should NOT be counted.");

//     await t.commit();

//     const afterCount = await t.getValue("SELECT COUNT(*) FROM student");
//     expect(afterCount).toBe(beforeCount + 1, "Within transaction, should be Committed.");

//     const afterCount2 = await th.db.getValue("SELECT COUNT(*) FROM student");
//     expect(afterCount2).toBe(beforeCount + 1, "Outside transaction, should be counted as it is committed.");

//     done();
//   });

//   it("Commit a 150 transactions", async (done) => {

//     for (let i = 0; i < 150; i++) {
//       const t = await th.db.getTransaction();
//       await t.insert(dg.getStudent(i + 100))
//       await t.commit();
//     }

//     done();
//   });

//   it("transaction Locks test", async (done) => {

//     const t1 = await th.db.getTransaction();
//     console.log("t1 started");
//     const t2 = await th.db.getTransaction();
//     console.log("t2 started");

//     //Acquire x-lock
//     await t1.getRow("SELECT * FROM student WHERE id = 1 FOR UPDATE");
//     console.log("t1 getRow returned, Lock Acquired");

//     const t2Get = t2.getRow<any>("SELECT * FROM student WHERE id = 1");

//     await t1.query("UPDATE student set firstName = 'foo' WHERE id = 1");
//     await t1.commit();

//     const t2Restult = await t2Get;
//     //Does not do what I thought it would do.
//     ///console.log(t2Restult);
//     //expect(t2Restult.firstName).toBe("foo");

//     done();
//   });

//   it("Timeout a transaction", async (done) => {
//     const t = await th.db.getTransaction();

//     const beforeCount = await t.getValue("SELECT COUNT(*) FROM student");
//     expect(beforeCount).toBeGreaterThanOrEqual(10);

//     await t.insert(dg.getStudent(12))

//     const duringCount = await t.getValue("SELECT COUNT(*) FROM student");
//     expect(duringCount).toBe(beforeCount + 1, "Within transaction, should be counted.");

//     const duringCount2 = await th.db.getValue("SELECT COUNT(*) FROM student");
//     expect(duringCount2).toBe(beforeCount, "Outside transaction, should NOT be counted.");

//     await sleep(11000);

//     const afterCount = await t.getValue("SELECT COUNT(*) FROM student");
//     expect(afterCount).toBe(beforeCount, "Within transaction, should be rolled back due to timeout.");

//     const afterCount2 = await th.db.getValue("SELECT COUNT(*) FROM student");
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

// describe("SELECT Tests", () => {

//   beforeEach(async (done) => {
//     th = await TestHelper.new();

//     await th.db.insert([
//       dg.getQuestion(1),
//       dg.getQuestion(2),
//       dg.getQuestion(3),
//       dg.getQuestion(4),
//     ]);

//     done();
//   });

//   afterEach(async (done) => {
//     await th.shutdown();
//     done();
//   });

//   it("Tests serializing rows", async (done) => {
//     const questions = await th.db.getRows<Question>("SELECT * FROM `question`", [], Question);
//     expect(questions.length).toBeGreaterThan(43);
//     const q = questions[0];
//     expect(q.name).not.toBeNull();
//     expect(q.constructor.name).toBe("Question");
//     done();
//   });

//   it("Tests getting rows as objects", async (done) => {
//     const questions: any[] = await th.db.getRows("SELECT * FROM `question`", []);
//     expect(questions.length).toBeGreaterThan(43);
//     const q = questions[0];
//     expect(q.text).not.toBeNull();
//     expect(q.validation).toBeNull();
//     expect(q.constructor.name).toBe("Object");
//     done();
//   });

//   it("Tests getting a single row", async (done) => {
//     const question = await th.db.getRow<Question>("SELECT * FROM `question`", [], Question);
//     expect(question.name).not.toBeNull();
//     expect(question.constructor.name).toBe("Question");
//     done();
//   });

//   it("Tests getting a single row, doesn't exist.", async (done) => {
//     const q = await th.db.getRow<Question>("SELECT * FROM `question` WHERE id = ?", [99], Question);
//     expect(q).toBeNull();
//     done();
//   });

//   it("Tests getting values.", async (done) => {
//     const types = await th.db.getValues("SELECT type FROM `question` WHERE id < 5", []);
//     expect(types.length).toBe(4);
//     expect(types).toEqual(['text', 'text', 'single', 'number']);
//     done();
//   });

//   it("Tests getting value", async (done) => {
//     const id = await th.db.getValue("SELECT id FROM `question` WHERE id = ?", [1]);
//     expect(id).toEqual(1);
//     done();
//   });

// });

// describe("getObjects Tests", () => {

//   beforeEach(async (done) => {
//     th = await TestHelper.new();

//     done();
//   });

//   afterEach(async (done) => {
//     await th.shutdown();
//     done();
//   });

//   it("gets rows and cast them", async (done) => {
//     const qry = { sql: "SELECT * FROM `question` q LEFT OUTER JOIN `answer` a ON q.id = a.questionId" };
//     const mapping = {
//       q: Question,
//       a: Answer
//     };
//     const results = await th.db.getObjects(qry, mapping);

//     expect(results.hasResults).toBe(true);

//     expect(results.get('q').length).toBeGreaterThan(39);
//     expect(results.get('a').length).toBeGreaterThan(16);

//     const q1 = results.get('q', 1);
//     const a1 = results.get('a', 1);

//     expect(q1.constructor.name).toBe("Question");
//     expect(a1.constructor.name).toBe("Answer");

//     done();
//   });

//   it("gets rows, no casting", async (done) => {
//     const qry = { sql: "SELECT * FROM `question` q LEFT OUTER JOIN `answer` a ON q.id = a.questionId" };
//     const results = await th.db.getObjects(qry);

//     expect(results.hasResults).toBe(true);

//     expect(results.get('q').length).toBeGreaterThan(39);
//     expect(results.get('a').length).toBeGreaterThan(16);

//     const c1 = results.get('q', 1);
//     const t1 = results.get('a', 1);

//     expect(c1.constructor.name).toBe("Object");
//     expect(t1.constructor.name).toBe("Object");

//     done();
//   });

// });

// describe("UPDATE Tests", () => {

//   beforeEach(async (done) => {
//     th = await TestHelper.new();
//     await th.db.insert(dg.getQuestion(1));
//     done();
//   });

//   afterEach(async (done) => {
//     await th.shutdown();
//     done();
//   });

//   it("Tests updating", async (done) => {
//     const q = new Question();
//     q.id = 1;
//     q.name = "bluppieflop";
//     q.validation = ValidationScheme.TEST;

//     await th.db.update({ object: q });

//     const gotten = await th.db.getRow<Question>("SELECT * FROM `question` WHERE id = ?", [q.id], Question);
//     expect(gotten.name).toBe("bluppieflop");
//     expect(gotten.validation).toBe(ValidationScheme.TEST);
//     expect(gotten.type).toBe("text");

//     done();
//   });

//   it("Tests updating, no WHERE", async (done) => {
//     const q = new Question();
//     q.id = undefined;
//     q.name = 'SpongeBob';
//     q.validation = ValidationScheme.MOCK;

//     try {
//       await th.db.update({ object: q });
//       throw "Nope";
//     } catch (err) {
//       expect(err.message).toContain("Object does not have value for");
//     }

//     done();
//   });

//   it("Tests updating, NULLS", async (done) => {
//     await th.db.query("UPDATE question SET validation = 'some' WHERE id = 1");

//     const q = await th.db.getRow<Question>("SELECT * FROM `question` WHERE id = 1", [], Question);
//     expect(q.validation).not.toBeNull();

//     q.validation = null;

//     await th.db.update({ object: q });

//     const gotten = await th.db.getRow<Question>("SELECT * FROM `question` WHERE id = 1", [], Question);
//     expect(gotten.validation).not.toBeNull("KeepNulls wasn't set, we should not have updated userUuid");

//     await th.db.update({ object: q, keepNulls: true });

//     const gotten2 = await th.db.getRow<Question>("SELECT * FROM `question` WHERE id = 1", [], Question);
//     expect(gotten2.validation).toBeNull("userUuid should be null now");

//     done();
//   });
// });

// describe("Where Clause Tests", () => {
//   it("tests add", () => {
//     const where = new WhereClause();

//     where.add("username = ?", 'jack');
//     where.add("date BETWEEN ? AND ?", 1500000, 1700000);

//     const sql = where.toSql();
//     const expectedSql = "WHERE username = ?\nAND date BETWEEN ? AND ?";
//     expect(sql).toBe(expectedSql);
//   })
// });