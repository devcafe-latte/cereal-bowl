import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { createConnection } from 'promise-mysql';

import { Database, DbConfig } from '../database/Database';

export class TestHelper {

  db: Database;

  private config: DbConfig;
  private _jasmineTimeout;
  constructor() { }

  public static setTestEnv() {
    dotenv.config({ "path": __dirname + '/../../test.env' });
    dotenv.config({ "path": __dirname + '/../../test-secrets.env' });
  }

  private async init() {
    this._jasmineTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60 * 1000;

    TestHelper.setTestEnv();
    this.config = {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      port: Number(process.env.DP_PORT) || 3306,
      multipleStatements: true,
    }

    if (!this.config.database.endsWith('-test')) {
      throw new Error("That doesn't look like a test database to me! Should end in '-test'");
    }

    //Reset the database
    const connection = await createConnection(this.config);
    await connection.query(readFileSync(__dirname + "/../assets/fixture.sql").toString());

    await connection.end();

    this.db = new Database(this.config);
    await this.db.ready();
  }

  static async new(): Promise<TestHelper> {
    const t = new TestHelper();
    await t.init();
    return t;
  }

  async shutdown() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = this._jasmineTimeout;
    if (this.db) await this.db.shutdown();
  }

}