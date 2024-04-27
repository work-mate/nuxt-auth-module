export function getRecursiveProperty(obj: any, path: string, separator: string = "."): any {
  const keys = path.split(separator);
  let current = obj;
  for (let i = 0; i < keys.length; i++) {
    if (current[keys[i]] === undefined) {
      return undefined;
    }
    current = current[keys[i]];
  }

  return current;
}
