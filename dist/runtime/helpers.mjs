export function getRecursiveProperty(obj, path, separator = ".") {
  const keys = path.split(separator);
  let current = obj;
  for (let i = 0; i < keys.length; i++) {
    if (current[keys[i]] === void 0) {
      return void 0;
    }
    current = current[keys[i]];
  }
  return current;
}
