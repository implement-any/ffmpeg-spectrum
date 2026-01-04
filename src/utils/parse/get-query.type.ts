export type ParsedQuery<T> = {
  [K in keyof T]: T[K];
};
