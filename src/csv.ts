import * as csv from "fast-csv";
import * as fs from "fs";

export async function readCsv<T>(
  file: string,
  options: csv.ParserOptionsArgs = {}
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const rows: T[] = [];
    const stream = fs
      .createReadStream(file)
      .pipe(csv.parse(options))
      .on("error", (error) => {
        stream.destroy();
        reject(error);
      })
      .on("data", (row) =>
        rows.push(
          ((Buffer.isBuffer(row) ? row.toString() : row) as unknown) as T
        )
      )
      .on("end", () => resolve(rows));
  });
}
