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

type MapTo<T, U> = {
  [K in keyof T]: U;
};

type UnwrapInner<T extends ReadonlyArray<ReadonlyArray<unknown>>> = {
  [K in keyof T]: T[K][number];
};

export const zipWith = <
  const T extends ReadonlyArray<ReadonlyArray<unknown>>,
  F extends (...elems: UnwrapInner<T>) => unknown,
>(
  mapFn: F,
  ...tupleArray: T
) =>
  Array.from({ length: Math.min(...tupleArray.map((a) => a.length)) }, (_, i) =>
    mapFn(...(tupleArray.map((a) => a[i]) as UnwrapInner<T>))
  ) as MapTo<T[number], ReturnType<F>>;
