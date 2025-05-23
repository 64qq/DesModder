export async function pollForValue<T>(func: () => T) {
  return await new Promise<T>((resolve) => {
    const interval = setInterval(() => {
      const val = func();
      if (val !== null && val !== undefined) {
        clearInterval(interval);
        resolve(val);
      }
    }, 50);
  });
}

type ClassDict = Record<string, boolean>;

export type MaybeClassDict = string | ClassDict | undefined | null;

function updateClass(out: ClassDict, c: MaybeClassDict) {
  // mutates `out`, returns nothing
  if (c == null) {
    // no change
  } else if (typeof c === "string") {
    for (const cls of c.split(" ")) {
      out[cls] = true;
    }
  } else {
    Object.assign(out, c);
  }
}

export function mergeClass(c1: MaybeClassDict, c2: MaybeClassDict) {
  const out: ClassDict = {};
  updateClass(out, c1);
  updateClass(out, c2);
  return out;
}

export function jsx(
  tag: string,
  attrs: Record<string, string>,
  ...children: (Node | string)[]
) {
  const element = document.createElement(tag);

  // Set all defined/non-null attributes.
  Object.entries(attrs ?? {})
    .filter(([, value]) => value != null)
    .forEach(([name, value]) =>
      element.setAttribute(
        name,
        typeof value === "object"
          ? // handle class={{class1: true, class2: false}}
            Object.keys(value)
              .filter((key) => value[key])
              .join(" ")
          : // all other attribute changes
            value
      )
    );

  // Set all defined/non-null children.
  element.append(...children.flat().filter((e) => e != null));

  return element;
}

export function get<T extends object, K extends string | symbol | number>(
  t: T,
  prop: K
): K extends keyof T ? T[K] : undefined {
  const obj2 = t as {
    [Key in string | symbol | number]: Key extends keyof T ? T[Key] : undefined;
  };

  return obj2[prop];
}

export function isDescendant(elem: HTMLElement | null, target: HTMLElement) {
  while (elem instanceof HTMLElement) {
    if (elem === target) {
      return true;
    }
    elem = elem.parentElement;
  }
  return false;
}

// https://stackoverflow.com/questions/48230773/how-to-create-a-partial-like-that-requires-a-single-property-to-be-set
export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
  U[keyof U];

export type Interpolatable =
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined;

type AllKeys<T extends object> = T extends T ? keyof T : never;
type CommonKeys<T extends object> = keyof T;
type NonCommonKeys<T extends object> = Exclude<AllKeys<T>, CommonKeys<T>>;
/**
 * Takes a union of object types and converts it to a single object type with all possible keys.
 *
 * Use only if you are sure that T has no extra properties.
 */
export type MergeObjectUnion<T extends object> = Prettify<
  [T] extends [never]
    ? never
    : Pick<T, CommonKeys<T>> &
        SetReadonly<
          {
            [K in NonCommonKeys<T>]?: T extends T
              ? K extends keyof T
                ? T[K]
                : never
              : never;
          },
          ExtractReadonlyKeys<T, NonCommonKeys<T>>
        >
>;

type ExtractReadonlyKeys<T extends object, K> = T extends T
  ? K extends keyof T
    ? IsReadonly<T, K> extends true
      ? K
      : never
    : never
  : never;
export type PartitionByAssignability<T, U> = T extends U
  ? { assignable: T; unassignable: never }
  : { assignable: never; unassignable: T };
/**
 * Takes a union and converts object types in it to a single object type with all possible keys,
 * leaving the other types intact.
 *
 * Use only if you are sure that T has no extra properties.
 */
export type MergeUnion<T> =
  PartitionByAssignability<
    T extends object
      ? T extends unknown[] | FunctionType
        ? [false, T]
        : [true, T]
      : [false, T],
    [true, object]
  > extends infer P extends {
    assignable: [true, object];
    unassignable: [false, unknown];
  }
    ? P["unassignable"][1] | MergeObjectUnion<P["assignable"][1]>
    : never;

// argument type is contravariant, return type is covariant
export type FunctionType = (...args: never) => unknown;
export type ConstructorType = new (...args: never) => unknown;
export type AbstractConstructorType = abstract new (...args: never) => unknown;

export type Prettify<T> = unknown extends T
  ? T
  : T extends FunctionType
    ? T
    : { [K in keyof T]: T[K] };

// https://github.com/type-challenges/type-challenges/blob/b1baef1ccdb721256f14d105bb9ac7928b5ecfb7/utils/index.d.ts
type IsEqual<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

type SetReadonly<T extends object, K extends keyof T> = T extends T
  ? Prettify<Omit<T, K> & Readonly<Pick<T, K>>>
  : never;

type IsReadonly<T extends object, K extends keyof T> = IsEqual<
  Pick<T, K>,
  Readonly<Pick<T, K>>
>;

export type Concrete<C extends AbstractConstructorType> = new (
  ...args: ConstructorParameters<C>
) => InstanceType<C>;
