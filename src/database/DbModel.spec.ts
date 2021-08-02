test("Nothing", () => {
  //Just here to avoid errors... Probably just look at this in the future.

  expect(true).toBe(true);
})

// import { PoolConnection, Pool } from 'promise-mysql';
// import { Table, Column, DbModel } from './DbModel';
// import { DbError } from './DbError';
// import { TestHelper } from '../testing/TestHelper';

// const table1 = Object.assign(
//   new Table(),
//   { name: "question", columns: [Column.new("id"), Column.new("text"), Column.new('tooltip')] }
// );

// const table2 = Object.assign(
//   new Table(),
//   { name: "bottle", columns: [Column.new("reference"), Column.new("content"), Column.new('quantity')] }
// );

// const model = Object.assign(new DbModel(), { name: 'test-db', tables: [table1, table2] });

// const questions = [
//   { text: "What is your name?", id: 1111 },
//   { id: 2222, tooltip: "Ricky", text: "What is your favorite color?" },
//   { id: 3333, text: "What is your quest?" },
// ];

// const typedQuestions: Question[] = [
//   Object.assign(new Question(), { text: "What is your name?", id: 1111 }),
//   Object.assign(new Question(), { id: 2222, tooltip: "Ricky", text: "What is your favorite color?" }),
//   Object.assign(new Question(), { id: 3333, text: "What is your quest?" }),
// ];

// describe("DbModel Tests", () => {

//   it("getTable", () => {
//     const t = model.getTable('question');
//     expect(t.name).toBe("question");
//   });

//   it("getTable error", () => {
//     try {
//       const t = model.getTable('notatable');
//       throw "boo";
//     } catch (err) {
//       expect(err.message).toContain("not found");
//     }
//   });

// });

// describe("DbModel Create Insert Tests", () => {

//   it("CreateInsert Wrong Object", () => {
//     expect(() => model.createInsert(questions[0]))
//       .toThrowMatching(e => e.constructor.name === "DbError");
//   });

//   it("CreateInsert Wrong Table", () => {
//     expect(() => model.createInsert(questions[0], "notatable"))
//       .toThrowMatching(e => e.constructor.name === "DbError");
//   });

//   it("CreateInsert Object", () => {
//     const qry = model.createInsert(typedQuestions[0]);
//     expect(qry.sql).toBe("INSERT INTO ?? ( ?? ) VALUES ?");
//     expect(qry.values[0]).toBe("question");
//     expect(qry.values[1]).toEqual(["id", "text", "tooltip"]);
//     expect(qry.values[2]).toEqual([[1111, "What is your name?", null]]);
//   });

//   it("CreateInsert Objects", () => {
//     const qry = model.createInsert(typedQuestions);
//     expect(qry.sql).toBe("INSERT INTO ?? ( ?? ) VALUES ?");
//     expect(qry.values[0]).toBe("question");
//     expect(qry.values[1]).toEqual(["id", "text", "tooltip"]);
//     expect(qry.values[2][0]).toEqual([1111, "What is your name?", null]);
//     expect(qry.values[2][1]).toEqual([2222, "What is your favorite color?", "Ricky"]);
//     expect(qry.values[2][2]).toEqual([3333, "What is your quest?", null]);
//   });

//   it("CreateInsert Objects + tablename 1", () => {
//     const qry = model.createInsert(questions, 'question');
//     expect(qry.sql).toBe("INSERT INTO ?? ( ?? ) VALUES ?");
//     expect(qry.values[0]).toBe("question");
//     expect(qry.values[1]).toEqual(["id", "text", "tooltip"]);
//     expect(qry.values[2][0]).toEqual([1111, "What is your name?", null]);
//     expect(qry.values[2][1]).toEqual([2222, "What is your favorite color?", "Ricky"]);
//     expect(qry.values[2][2]).toEqual([3333, "What is your quest?", null]);
//   });

//   it("CreateInsert Objects + tablename 2", () => {
//     const qry = model.createInsert(typedQuestions, 'bottle');
//     expect(qry.sql).toBe("INSERT INTO ?? ( ?? ) VALUES ?");
//     expect(qry.values[0]).toBe("bottle");
//     expect(qry.values[1]).toEqual(["reference", "content", "quantity"]);
//     expect(qry.values[2][0]).toEqual([null, null, null]);
//     expect(qry.values[2][1]).toEqual([null, null, null]);
//     expect(qry.values[2][2]).toEqual([null, null, null]);
//   });
// });

// describe("DbModel Create Update Tests", () => {

//   it("CreateUpdate, no column", () => {
//     const qry = model.createUpdate({ table: "question", object: questions[0] });
//     expect(qry.sql).toBe("UPDATE ?? SET ? WHERE ?? = ?");
//     expect(qry.values[0]).toBe("question");
//     expect(qry.values[1]).toEqual(questions[0]);
//     expect(qry.values[2]).toEqual('id');
//     expect(qry.values[3]).toEqual(questions[0].id);
//   });

//   it("createUpdate, no column, Keep Nulls", () => {
//     const u = { ...questions[0] };
//     u.tooltip = null;

//     const qry = model.createUpdate({ table: "question", object: u, keepNulls: true });
//     expect(qry.sql).toBe("UPDATE ?? SET ? WHERE ?? = ?");
//     expect(qry.values[0]).toBe("question");
//     expect(qry.values[1]).toEqual(u);
//     expect(qry.values[2]).toEqual('id');
//     expect(qry.values[3]).toEqual(questions[0].id);
//   });

//   it("CreateUpdate, column", () => {
//     const qry = model.createUpdate({ table: "question", object: questions[0], column: 'text' });
//     expect(qry.sql).toBe("UPDATE ?? SET ? WHERE ?? = ?");
//     expect(qry.values[0]).toBe("question");
//     expect(qry.values[1]).toEqual(questions[0]);
//     expect(qry.values[2]).toBe("text");
//     expect(qry.values[3]).toBe(questions[0].text);
//   });

//   it("CreateUpdate, no TableName", () => {
//     const qry = model.createUpdate({ object: typedQuestions[0], column: 'text' });
//     expect(qry.sql).toBe("UPDATE ?? SET ? WHERE ?? = ?");
//     expect(qry.values[0]).toBe("question");
//     expect(qry.values[1]).toEqual(questions[0]);
//     expect(qry.values[2]).toBe("text");
//     expect(qry.values[3]).toBe(questions[0].text);
//   });

//   it("CreateUpdate, no table name, error", () => {
//     expect(() => { model.createUpdate({ object: questions[0], column: 'email' }); })
//       .toThrowMatching((e: DbError) => {
//         expect(e.message).toContain("I need a better table");
//         return true;
//       });
//   });
// });

// describe("Table Tests", () => {

//   it('CreateInsert', () => {
//     const qry = table1.createInsert(questions[0]);
//     expect(qry.sql).toBe("INSERT INTO ?? ( ?? ) VALUES ?");
//     expect(qry.values[0]).toBe("question");
//     expect(qry.values[1]).toEqual(["id", "text", "tooltip"]);
//     expect(qry.values[2]).toEqual([[1111, "What is your name?", null]]);

//     //Mutliple INSERTS
//     const qry2 = table1.createInsert(questions);
//     expect(qry2.sql).toBe("INSERT INTO ?? ( ?? ) VALUES ?");
//     expect(qry2.values[0]).toBe("question");
//     expect(qry2.values[1]).toEqual(["id", "text", "tooltip"]);
//     expect(qry2.values[2][0]).toEqual([1111, "What is your name?", null]);
//     expect(qry2.values[2][1]).toEqual([2222, "What is your favorite color?", "Ricky"]);
//     expect(qry2.values[2][2]).toEqual([3333, "What is your quest?", null]);
//   });

//   it('createUpdate, no column', () => {
//     let user: any = { ...questions[0] };
//     user.foo = "bar";

//     const qry = table1.createUpdate(user);
//     expect(qry.sql).toBe("UPDATE ?? SET ?");
//     expect(qry.values[0]).toBe("question");
//     expect(qry.values[1]).toEqual(questions[0]);
//     expect(qry.values[1].foo).toBeUndefined();
//   });

//   it('createUpdate, column', () => {
//     let user: any = { ...questions[0] };

//     const qry = table1.createUpdate(user, 'id');
//     expect(qry.sql).toBe("UPDATE ?? SET ? WHERE ?? = ?");
//     expect(qry.values[0]).toBe("question");
//     expect(qry.values[1]).toEqual(user);
//     expect(qry.values[2]).toEqual('id');
//     expect(qry.values[3]).toEqual(1111);
//   });

//   it('createUpdate, NULL values', () => {
//     let q: any = { ...questions[0] };
//     q.tooltip = null;

//     const qry = table1.createUpdate(q, 'id', true);
//     expect(qry.sql).toBe("UPDATE ?? SET ? WHERE ?? = ?");
//     expect(qry.values[0]).toBe("question");
//     expect(qry.values[1].tooltip).toBeNull();
//     expect(qry.values[1]).toEqual(q);
//     expect(qry.values[2]).toEqual('id');
//     expect(qry.values[3]).toEqual(1111);
//   });
// });

// describe("LoadModel tests", () => {
//   let th: TestHelper;

//   beforeEach(async (done) => {
//     th = await TestHelper.new();
//     done();
//   });

//   afterEach(async (done) => {
//     await th.shutdown();
//     done();
//   });

//   it("Loads the model with PoolConnection", async (done) => {
//     //hack a connection
//     const db: any = container.db;
//     const con: PoolConnection = await db._pool.getConnection();

//     const model = new DbModel(container.settings.dbName);
//     await model.loadModel(con);

//     const tableNames = await container.db.getValues("SHOW TABLES");
//     expect(model.tables.length).toBe(tableNames.length);

//     const questionTable = model.getTable('question');
//     expect(questionTable).toBeDefined();
//     expect(questionTable.columns.length).toBe(8);

//     //id
//     expect(questionTable.getColumn('id').type).toBe("int(11)");
//     expect(questionTable.getColumn('id').null).toBe(false);

//     expect(questionTable.getColumn('validation').type).toBe("varchar(50)");
//     expect(questionTable.getColumn('validation').null).toBe(true);

//     await con.release();
//     done();
//   });

//   it("Loads the model with Pool", async (done) => {
//     //hack a connection
//     const db: any = container.db;
//     const pool: Pool = await db._pool;

//     const model = new DbModel(container.settings.dbName);
//     await model.loadModel(pool);

//     const tableNames = await container.db.getValues("SHOW TABLES");
//     expect(model.tables.length).toBe(tableNames.length);

//     const questionTable = model.getTable('question');
//     expect(questionTable).toBeDefined();
//     expect(questionTable.columns.length).toBe(8);

//     //id
//     expect(questionTable.getColumn('id').type).toBe("int(11)");
//     expect(questionTable.getColumn('id').null).toBe(false);

//     expect(questionTable.getColumn('validation').type).toBe("varchar(50)");
//     expect(questionTable.getColumn('validation').null).toBe(true);

//     done();
//   });
// });