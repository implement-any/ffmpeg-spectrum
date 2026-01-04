import url from "url";

import type { ParsedQuery } from "./get-query.type";

export function getQuery<T>(req: Request): ParsedQuery<T> {
  return url.parse(req.url, true).query as ParsedQuery<T>;
}
