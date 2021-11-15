import * as fs from "fs";

export function readJson(name: string): string {
  let json = fs.readFileSync(name);
  return json.toString();
}

export function writeJson(name: string, data: string) {
  fs.writeFileSync(name, data);
}
