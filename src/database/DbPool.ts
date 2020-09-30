import moment, { Moment } from 'moment';
import { QueryOptions } from 'mysql';

import { Type } from './Database';
import { DbError } from './DbError';
import { DbModel, UpdateArgs } from './DbModel';
import { SqlResult } from './SqlResults';
import { Serializer, ObjectMapping } from '../util/Serializer';

export class DbConnection {
  static TRANS_TIMEOUT_SECONDS = 10;

  isTransaction = false;

  private int: NodeJS.Timeout;
  private started: Moment

  constructor(private _conn: PoolOrConn, private _model: DbModel) {
  }

  static async newTransaction(conn: PoolOrConn, model: DbModel): Promise<DbConnection> {
    const db = new DbConnection(conn, model);
    db.isTransaction = true;
    console.log("Starting transaction");
    await conn.beginTransaction();

    db.started = moment();
    db.int = setInterval(() => {
      const seconds = moment().diff(db.started, 'second');
      console.warn(`Transaction running for ${seconds} seconds.`);
      if (seconds >= DbConnection.TRANS_TIMEOUT_SECONDS) {
        console.warn("Transaction Timed out. Rolling back.");
        db.rollback();
      }
    }, 1000)
    return db;
  }

  async commit() {
    if (!this.isTransaction) throw DbError.new("Not a transaction");
    console.log("Committing transaction");
    try {
      clearInterval(this.int);
      await this._conn.commit();
      await this._conn.release();
    } catch (err){ 
      await this._conn.release();
    }
  }
  async rollback() {
    if (!this.isTransaction) throw DbError.new("Not a transaction");
    console.log("Rolling back transaction");
    try {
      clearInterval(this.int);
      await this._conn.rollback();
      await this._conn.release();
    } catch (err){ 
      await this._conn.release();
    }
  }

  async delete(table: string, id: string | string[] | number | number[], column = 'id') {
    if (id === undefined || id === null) throw DbError.new("Delete statements need some IDs for the WHERE clause", 'missing-where-clause');

    const ids = Array.isArray(id) ? id : [id];
    if (ids.length === 0) throw DbError.new("Delete statements need some IDs for the WHERE clause", 'missing-where-clause');

    const sql = "DELETE FROM ?? WHERE ?? in (?)";
    const values = [table, column, ids];

    try {
      const result = await this._conn.query(sql, values);
      return result.affectedRows;
    } catch (err) {
      console.error("DELETE failed", err);
      console.info(sql, values);
      throw err;
    }
  }

  async update(args: UpdateArgs) {
    const qry = this._model.createUpdate(args);

    const hasWhereClause = Boolean(qry.sql.match(/(\sWHERE\s)/));
    if (!hasWhereClause) throw DbError.new("Updates need a WHERE clause!", 'missing-where-clause');

    const result = await this._conn.query(qry);
    return result.affectedRows;
  }

  async insert(objects: Object[], table?: string): Promise<void>;
  async insert(object: Object, table?: string): Promise<void>;
  async insert(objects: any, table?: string): Promise<void> {
    //Normalize to array
    if (!Array.isArray(objects)) objects = [objects];

    const qry = this._model.createInsert(objects, table);
    const result = await this._conn.query(qry);

    if (!result.insertId) return;

    //Set Ids
    //Note that insertId will be the id of the FIRST inserted row. 
    let insertId = result.insertId;
    for (let o of objects) {
      if (o.id !== undefined) o.id = insertId;
      insertId++;
    }

  }

  async getValue(sql: string, values?: any): Promise<any> {
    const results = await this.getValues(sql, values);
    const value = results[0];
    if (value === undefined) return null;
    return value;
  }

  async getValues(sql: string, values?: any): Promise<any[]> {
    const rows: any[] = await this.getRows(sql, values);
    if (rows.length === 0) return [];

    //Get the first column
    let key: string;
    for (let k in rows[0]) {
      if (rows[0].hasOwnProperty(k)) {
        key = k;
        break;
      }
    }

    const results = [];
    for (let r of rows) {
      results.push(r[key]);
    }
    return results;
  }

  async getAll<T>(table: string, orderBy = "id", type?: Type<T>): Promise<T[]> {
    return this.getRows<T>("SELECT * FROM ?? ORDER BY ??", [table, orderBy], type);
  }

  async getRow<T>(sql: string, values?: any, type?: Type<T>): Promise<T> {
    const rows = await this.getRows(sql, values, type);
    return rows[0] || null;
  }

  async getRows<T>(sql: string, values?: any, type?: Type<T>): Promise<T[]> {
    let rows: any[];
    try {
      rows = await this._conn.query(sql, values);
    } catch (err) {
      console.error("getRows error:", err);
      console.info(sql, values);
      throw err;
    }

    const results: T[] = [];

    for (let r of rows) {
      if (type && typeof type.deserialize === "function") {
        results.push(type.deserialize(r));
      } else if (type) {
        results.push(Serializer.deserialize(type, r));
      } else {
        results.push({ ...r });
      }
    }
    return results;
  }

  async getObjects(qry: QueryOptions, mapping?: ObjectMapping): Promise<SqlResult> {
    qry.nestTables = true;

    let result;
    try {
      result = SqlResult.new(await this._conn.query(qry));
    } catch (err) {
      console.error("getRows error:", err);
      console.info(qry.sql, qry.values);
      throw err;
    }

    if (!result.hasResults) return result;

    if (!mapping) mapping = {};
    for (let alias in mapping) {
      if (!mapping.hasOwnProperty(alias)) continue;
      result.cast(alias, mapping[alias]);
    }

    return result;
  }

  async query(options: QueryOptions): Promise<any>;
  async query(sql: string, values?: any): Promise<any>;
  async query(sql: any, values?: any): Promise<any> {
    return this._conn.query(sql, values);
  }
}

export interface PoolOrConn {
  query(options: QueryOptions): Promise<any>;
  query(sql: string, values?: any): Promise<any>;
  query(sql: any, values?: any): Promise<any>;

  beginTransaction?(): Promise<void>;
  rollback?(): Promise<void>;
  commit?(): Promise<void>;
  release?(): Promise<void>;
}