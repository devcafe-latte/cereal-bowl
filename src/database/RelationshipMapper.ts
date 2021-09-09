import { SqlResult } from "./SqlResults";
import { DbError } from "./DbError";

export class RelationshipMapper {
  private source: Source;

  private dest: Destination;

  private type: "one" | "many" | "unknown" = "unknown";
  private result: SqlResult;

  static put(table: string, result: SqlResult): RelationshipMapper {
    const rm = new RelationshipMapper();
    rm.result = result;

    rm.source = {
      table,
      objects: result.get(table),
    };

    return rm;
  }

  into(table: string, property: string) {
    this.dest = {
      table,
      property,
      objects: this.result.get(table),
    };

    return this;
  }

  on(uniqueColumn: string, otherIdColumn: string = "id", index = 0): SqlResult {
    if (
      this.source.objects[index] &&
      this.source.objects[index][uniqueColumn] !== undefined
    ) {
      this.source.matchOn = uniqueColumn;
      this.dest.matchOn = otherIdColumn;
      this.type = "many";
    } else if (
      this.dest.objects[index] &&
      this.dest.objects[index][uniqueColumn] !== undefined
    ) {
      this.source.matchOn = otherIdColumn;
      this.dest.matchOn = uniqueColumn;
      this.type = "one";
    } else if (this.dest.objects.length > 0 && this.source.objects.length > 0) {
      //Increase the index and check again.
      index++;

      if (
        index > 1000 ||
        (index >= this.source.objects.length &&
          index >= this.dest.objects.length)
      ) {
        throw DbError.new(
          `Column ${uniqueColumn} found in source nor destination`,
          "mapping-error"
        );
      } else {
        return this.on(uniqueColumn, otherIdColumn, index);
      }
    } else {
      //Else, it's possible that the column we're matching on is on the table that returned 0 rows.
      //  That's not an error, we can just safely not process anything.
      return this.result;
    }

    this.process();
    return this.result;
  }

  private process() {
    //do things
    if (this.type === "one") {
      this.processOne();
    } else {
      this.processMany();
    }
  }

  private processOne() {
    const hashTable = {};
    for (let o of this.source.objects) {
      hashTable[o[this.source.matchOn]] = o;
    }

    for (let destObject of this.dest.objects) {
      //const obj = this.result.get(this.source.table, destObject[this.dest.matchOn]);
      const obj = hashTable[destObject[this.dest.matchOn]];

      destObject[this.dest.property] = obj;
    }
  }

  private processMany() {
    const hashTable: any = {};
    //Create hashTable with ncessary ids
    for (let srcObject of this.source.objects) {
      const id = srcObject[this.source.matchOn];
      if (!hashTable[id]) hashTable[id] = [];
      hashTable[id].push(srcObject);
    }

    //put them in the objects.
    for (let destObject of this.dest.objects) {
      destObject[this.dest.property] =
        hashTable[destObject[this.dest.matchOn]] || [];
    }
  }
}

interface Source {
  table: string;
  matchOn?: string;
  objects: any[];
}

interface Destination extends Source {
  property: string;
}
