import { Pool, PoolOptions, QueryOptions, createPool } from 'mysql2/promise';

import { ObjectMapping } from '../util/Serializer';
import { DbModel, UpdateArgs } from './DbModel';
import { DbConnection } from './DbPool';
import { SqlResult } from './SqlResults';

export interface DbConfig extends PoolOptions {
  tinyIntToBool?: boolean;
  host: string;
  database: string;
  user?: string;
  password?: string;
  port?: number;
}

export class Database {
  private _pool: Pool;
  private _connection: DbConnection;
  private _ready: Promise<void>;
  private _model: DbModel;

  private config: DbConfig;
  private _defaultConfig: Partial<DbConfig> = {
    tinyIntToBool: true,
    charset: 'utf8mb4',
  }

  constructor(config: DbConfig) {
    this.config = Object.assign(this._defaultConfig, config);

    if (this.config.tinyIntToBool) {
      this.config.typeCast = (field, next) => {
        if (field.type === 'TINY') {
          //Convert tiny ints to bools.
          const value = field.string();
          if (value === null) return null;
          return (value === '1');
        } else {
          return next();
        }
      }
    }
  }

  public async ready() {
    if (!this._ready) this._ready = this.init();
    return this._ready;
  }

  private async init() {
    //Setup DB Connection
    this._pool = createPool(this.config);

    this._model = new DbModel(this.config.database);
    await this._model.loadModel(this._pool);

    this._connection = new DbConnection(this._pool, this._model);
  }

  async getTransaction() {
    throw "Not implemented";
    // return DbConnection.newTransaction(await this._pool.getConnection(), this._model);
  }

  async ping() {
    const c = await this._pool.getConnection();
    c.release();
  }

  async activeConnections(): Promise<number> {
    const result: any = await this.getRow("show status where variable_name = 'threads_connected';");
    return Number(result.Value);
  }

  async delete(table: string, id: string | string[] | number | number[], column = 'id') {
    return this._connection.delete(table, id, column);
  }

  async update(args: UpdateArgs) {
    return this._connection.update(args);
  }

  async insert(objects: Object[], table?: string): Promise<void>;
  async insert(object: Object, table?: string): Promise<void>;
  async insert(objects: any, table?: string): Promise<void> {
    return this._connection.insert(objects, table);
  }

  async getValue(sql: string, values?: any): Promise<any> {
    return this._connection.getValue(sql, values);
  }

  async getValues(sql: string, values?: any): Promise<any[]> {
    return this._connection.getValues(sql, values);
  }

  async getAll<T>(table: string, orderBy = "id", type?: Type<T>): Promise<T[]> {
    return this._connection.getAll(table, orderBy, type);
  }

  async getRow<T>(sql: string, values?: any, type?: Type<T>): Promise<T> {
    return this._connection.getRow<T>(sql, values, type);
  }

  async getRows<T>(sql: string, values?: any, type?: Type<T>): Promise<T[]> {
    return this._connection.getRows<T>(sql, values, type);
  }

  async getObjects(qry: QueryOptions, mapping?: ObjectMapping): Promise<SqlResult> {
    return this._connection.getObjects(qry, mapping);
  }

  async query(options: QueryOptions): Promise<any>;
  async query(sql: string, values?: any): Promise<any>;
  async query(sql: any, values?: any): Promise<any> {
    return this._connection.query(sql, values);
  }

  async shutdown() {
    console.log("Shutting down")
    if (!this._pool) return;

    await this._pool.end();
    delete this._pool;
  }

}

export interface Type<T> extends Function {
  new(...args: any[]): T;
  deserialize?: Function
}