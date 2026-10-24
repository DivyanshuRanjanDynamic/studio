// ═══════════════════════════════════════════════════
// In-memory stand-in for the Admin SDK Firestore subset the API routes use,
// so route handlers run end to end in tests:
//   collection().doc(id?).get/set({merge})/update  ·  where(==|in|array-contains)
//   .limit().get()  ·  runTransaction (writes apply only if the callback resolves)
// update() treats dotted keys as field paths; set() keeps them literal — same as
// Firestore, so tests catch the set+merge "a.b" mistake.
// ═══════════════════════════════════════════════════

type Doc = Record<string, any>;
type Op = '==' | 'in' | 'array-contains';

const store = new Map<string, Map<string, Doc>>();
let autoId = 0;
let failNextTransaction = false;

const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

export function collectionData(name: string): Map<string, Doc> {
  if (!store.has(name)) store.set(name, new Map());
  return store.get(name)!;
}

export function resetFakeFirestore(): void {
  store.clear();
  autoId = 0;
  failNextTransaction = false;
}

/** The next runTransaction rejects (a transient Firestore error) */
export function failNextFakeTransaction(): void {
  failNextTransaction = true;
}

const getPath = (obj: Doc, path: string) =>
  path.split('.').reduce<any>((o, k) => (o == null ? undefined : o[k]), obj);

function setPath(obj: Doc, path: string, value: unknown) {
  const keys = path.split('.');
  let cur = obj;
  for (const k of keys.slice(0, -1)) cur = cur[k] = typeof cur[k] === 'object' && cur[k] !== null ? cur[k] : {};
  cur[keys[keys.length - 1]] = clone(value);
}

function deepMerge(target: Doc, src: Doc) {
  for (const [k, v] of Object.entries(src)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && typeof target[k] === 'object' && target[k] !== null) {
      deepMerge(target[k], v);
    } else {
      target[k] = clone(v);
    }
  }
}

function applySet(collection: string, id: string, data: Doc, opts?: { merge?: boolean }) {
  const existing = collectionData(collection).get(id);
  if (opts?.merge && existing) deepMerge(existing, data);
  else collectionData(collection).set(id, clone(data));
}

function applyUpdate(collection: string, id: string, data: Doc) {
  const existing = collectionData(collection).get(id);
  if (!existing) throw new Error(`NOT_FOUND: ${collection}/${id}`);
  for (const [path, value] of Object.entries(data)) setPath(existing, path, value);
}

function docRef(collection: string, id: string): any {
  const snapshot = () => {
    const data = collectionData(collection).get(id);
    return { id, ref: docRef(collection, id), exists: data !== undefined, data: () => clone(data) };
  };
  return {
    id,
    _collection: collection,
    _snapshot: snapshot,
    get: async () => snapshot(),
    set: async (data: Doc, opts?: { merge?: boolean }) => applySet(collection, id, data, opts),
    update: async (data: Doc) => applyUpdate(collection, id, data),
  };
}

function query(collection: string, filters: Array<[string, Op, unknown]>, max = Infinity): any {
  const matches = (d: Doc) =>
    filters.every(([field, op, value]) => {
      const actual = getPath(d, field);
      if (op === 'in') return Array.isArray(value) && value.includes(actual);
      if (op === 'array-contains') return Array.isArray(actual) && actual.includes(value);
      return actual === value;
    });
  return {
    where: (field: string, op: Op, value: unknown) => query(collection, [...filters, [field, op, value]], max),
    limit: (n: number) => query(collection, filters, n),
    get: async () => {
      const docs = [...collectionData(collection).entries()]
        .filter(([, d]) => matches(d))
        .slice(0, max)
        .map(([id]) => docRef(collection, id)._snapshot());
      return { size: docs.length, empty: docs.length === 0, docs, forEach: (fn: (d: unknown) => void) => docs.forEach(fn) };
    },
  };
}

export const fakeDb = {
  collection: (name: string) => ({
    doc: (id?: string) => docRef(name, id ?? `auto_${++autoId}`),
    ...query(name, []),
  }),
  runTransaction: async (fn: (tx: any) => Promise<unknown>) => {
    if (failNextTransaction) {
      failNextTransaction = false;
      throw new Error('UNAVAILABLE: transient');
    }
    const writes: Array<() => void> = [];
    const tx = {
      get: async (refOrQuery: any) => (refOrQuery._snapshot ? refOrQuery._snapshot() : refOrQuery.get()),
      update: (ref: any, data: Doc) => writes.push(() => applyUpdate(ref._collection, ref.id, data)),
      set: (ref: any, data: Doc, opts?: { merge?: boolean }) =>
        writes.push(() => applySet(ref._collection, ref.id, data, opts)),
    };
    const result = await fn(tx); // a throw leaves the store untouched
    writes.forEach((write) => write());
    return result;
  },
};
