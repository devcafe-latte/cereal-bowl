import { Connection, Pool, QueryOptions } from 'mysql2/promise';
import { Serializer } from '../util/Serializer';
import { DbError } from './DbError';

export interface UpdateArgs {
  object: any,
  table?: string,
  column?: string,
  keepNulls?: boolean,
}

export class DbModel {
  tables: Table[] = [];

  constructor(public name?: string) { }

  getTable(name: string): Table {
    const table = this.tables.find(t => t.name === name);
    if (!table) throw DbError.new(`Table ${name} not found in Database ${this.name}.`, 'table-error');

    return table;
  }

  createUpdate(a: UpdateArgs): QueryOptions {
    if (!a.table) a.table = this.getTableName(a.object);
    if (!a.column) a.column = 'id';
    a.keepNulls = Boolean(a.keepNulls);

    //Does the object have the column we want?
    if (a.object[a.column] === undefined) {
      throw DbError.new(`Object does not have value for ${a.column}.`, 'where-error');
    } 

    const table = this.getTable(a.table);
    return table.createUpdate(a.object, a.column, a.keepNulls);
  }

  createInsert(objects: Object[]|Object, table?: string): QueryOptions {
    //Normalize
    if (!table) table = this.getTableName(objects);
    if (!Array.isArray(objects)) objects = [objects];

    if (!table) throw DbError.new("No Table Name", 'missing-table-name');

    return this.getTable(table).createInsert(objects);
  }

  private getTableName(value: any) {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) {
      if (value.length === 0) throw DbError.new("I need more than 0 objects to get a Table name", 'missing-table-name');
      value = value[0];
    }

    if (typeof value === "object") {
      const firstChar = value.constructor.name[0].toLowerCase();
      const name = firstChar + value.constructor.name.substring(1);
      if (name === "object") throw DbError.new("I need a better table name than 'object'", 'missing-table-name');
      return name;
    }

  }

  async loadModel(con: Connection | Pool) {
    this.tables = [];

    const [rows, fields]: any[] = await con.query("SHOW TABLES");
    if (rows.length === 0) throw DbError.new("Can't load database model.", 'no-database');

    //Get the first column
    let key: string;
    for (let k in rows[0]) {
      if (rows[0].hasOwnProperty(k)) {
        key = k;
        break;
      }
    }

    for (let r of rows) {
      const t = new Table(r[key]);
      await t.loadColumns(con);
      this.tables.push(t);
    }

  }
}

export class Table {
  columns: Column[] = [];

  constructor(public name?: string) { }

  getColumn(name: string): Column {
    return this.columns.find(c => c.name === name);
  }

  createUpdate(object: Object, keepNulls?: boolean): QueryOptions
  createUpdate(object: Object, column?: string, keepNulls?: boolean): QueryOptions;
  createUpdate(object: Object, column?: string | boolean, keepNulls = false): QueryOptions {
    let sql = "UPDATE ?? SET ?";

    if (typeof column === 'boolean') keepNulls = column;

    const data = this.convertObject(object, keepNulls);
    const values = [this.name, data];

    if (typeof column === "string") {
      if (!this.columns.find(c => c.name === column)) throw DbError.new(`Column '${column}' doesn't exist in table '${this.name}'.`, 'invalid-column');
      if (data[column] === null || data[column] === undefined) throw DbError.new(`Object doesn't have value for property ${column}`, 'no-value');

      sql += " WHERE ?? = ?";
      values.push(column, data[column]);
    }

    return { sql, values };
  }

  createInsert(object: Object[] | Object): QueryOptions {
    //Normalize
    let objects: Object[];
    if (Array.isArray(object)) {
      objects = object;
    } else {
      objects = [object];
    }

    let sql = "INSERT INTO ?? ( ?? ) VALUES ?";
    const cols = this.columns.map(c => c.name);
    let rows = [];

    for (let o of objects) {
      rows.push(this.convertObjectValuesToArray(o));
    }

    return { sql, values: [this.name, cols, rows] };
  }

  async loadColumns(con: Connection | Pool) {
    if (!this.name) throw DbError.new("No Table name!", 'missing-table-name');

    this.columns = [];
    const [rows, fields]: any[] = await con.query("SHOW COLUMNS FROM ??", this.name);
    for (let r of rows) {
      this.columns.push(Column.fromDb(r));
    }
  }

  private convertObjectValuesToArray(o: any) {
    let row = [];
    for (let c of this.columns) {
      row.push(this.convertValue(o[c.name], c.name));
    }
    return row;
  }

  private convertObject(input: any, keepNulls = false): any {
    const output: any = {};
    for (let c of this.columns) {
      if (!keepNulls && (input[c.name] === undefined || input[c.name] === null)) continue;

      output[c.name] = this.convertValue(input[c.name], c.name)
    }
    return output;
  }

  private convertValue(value: any, column: string) {
    if (value === undefined || value === null) return null;

    if (typeof value === "object") {
      //It can be a Date, 
      //  or it can be something we don't know what to do with.

      const constructor = value.constructor.name;
      const colType = this.getColumn(column).type;
      //If we have a json column, then just return the json.
      if (constructor === "Object" && colType === "json") {
        return JSON.stringify(value);
      }

      //If we have a blob column, then just return the Buffer.
      const blobs = ['tinyblob', 'blob', 'mediumblob', 'longblob'];
      if (Buffer.isBuffer(value) && blobs.includes(colType)) {
        return value;
      }

      //Use the serializers mappings to convert.
      const serialized = Serializer.serialize(value);
      if (typeof serialized !== 'object') return serialized;

      throw DbError.new(`Don't know how to convert class '${value.constructor.name}' to database value for column ${column}.`);
    }

    if (typeof value === "boolean") return Number(value);

    return value;
  }

}

export class Column {
  name: string;
  type: string;
  null: boolean;
  default: string;

  static new(name: string): Column {
    const c = new Column();
    c.name = name;
    return c;
  }

  static fromDb(data: ColumnResult): Column {
    const c = new Column();
    c.name = data.Field;
    c.default = data.Default;
    c.null = (data.Null === "YES");
    c.type = data.Type;
    return c;
  }
}

interface ColumnResult {
  Default: string;
  Extra: string;
  Field: string;
  Key: string;
  Null: string;
  Type: string;
}