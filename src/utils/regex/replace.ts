const REGEX = {
  space: /\s/g,
  mime: /.wav/g,
} as const;

export function replace(origin: string, to: string, type: keyof typeof REGEX) {
  return origin.replace(REGEX[type], to);
}

export function replaceAll(origin: string, to: string, types: (keyof typeof REGEX)[]) {
  for (let type of types) {
    origin = origin.replace(REGEX[type], to);
  }

  return origin;
}
