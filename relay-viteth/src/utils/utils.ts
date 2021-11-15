import * as fs from "fs";

export function readJson(name: string): string {
  try {
    let json = fs.readFileSync(name);
    return json.toString();
  } catch (err) {
    if ((err as any).code === "ENOENT") {
      return "";
    } else {
      throw err;
    }
  }
}

export function writeJson(name: string, data: string) {
  fs.writeFileSync(name, data);
}
