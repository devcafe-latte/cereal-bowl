import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { createConnection } from 'mysql2/promise';

import { Database, DbConfig } from '../database/Database';

export class TestHelper {

  db: Database;

  private config: DbConfig;
  constructor() { }

  public static setTestEnv() {
    dotenv.config({ "path": __dirname + '/../../test.env' });
    dotenv.config({ "path": __dirname + '/../../test-secrets.env' });
  }

  private async init() {
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
    if (this.db) await this.db.shutdown();
  }

  async sleep(ms: number) {
    return new Promise<void>((res, rej) => {
      setTimeout(() => res(), ms);
    });
  }

}