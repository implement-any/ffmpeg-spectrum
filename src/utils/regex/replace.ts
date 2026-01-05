const REGEX = {
  space: /\s/g,
  mime: /.wav/g,
};

export function replace(origin: string, to: string, type: "space" | "mime") {
  return origin.replace(REGEX[type], to);
}
