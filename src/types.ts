// types.ts

export type Primitive = string | number | boolean | null | undefined;
export type Serializable = Primitive | SerializableArray | SerializableObject;
export interface SerializableArray extends Array<Serializable> {}
export interface SerializableObject {
  [key: string]: Serializable;
}

export type Chain = ReadonlyArray<ChainItem>;

export type FluentProxyStructure = { readonly chain: Chain };

export type ChainItem = {
  method: string;
  args: ReadonlyArray<any>;
  data: any;
  return: any;
};

export type ExtractChain<T, Depth extends number = 0> = 
  Depth extends 8 ? any 
  : T extends string ? string 
  : T extends number ? number
  : T extends boolean ? boolean
  : T extends null ? null
  : T extends undefined ? undefined
  : T extends FluentProxyStructure ? T['chain']
  : T extends ReadonlyArray<infer U> ? ExtractChain<U, AddOne<Depth>>[]
  : T extends { chain: Chain } ? T['chain']
  : T extends object ? { readonly [K in keyof T]: ExtractChain<T[K], AddOne<Depth>> }
  : never;

export type AddOne<T extends number> = [1, 2, 3, 4, 5, 6, 7, 8, 9][T];

export type ExtractThisParameter<T> = T extends (this: infer This, ...args: any[]) => any ? This extends object ? This : {} : {};

export interface FluentOptions {
  blocking?: boolean;
}

export type ApiContext<TApi> = UnionToIntersection<
  {
    [K in keyof TApi]: TApi[K] extends (...args: any[]) => any
      ? ExtractThisParameter<TApi[K]>
      : TApi[K] extends object
      ? ApiContext<TApi[K]>
      : never;
  }[keyof TApi]
> & {
  fluent?: FluentOptions;
};

export type UnionToIntersection<U> = 
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

export type HasRequiredProperties<T> = T extends object
  ? {} extends { [K in keyof T]: T[K] extends undefined ? never : K }
    ? false
    : true
  : false;

  export type FluentProxy<TRootApi, TCurrentApi, TChain extends Chain, TPath extends string = ""> = {
    readonly chain: TChain;
    run: TChain extends []
      ? never
      : TChain extends [infer First, ...any[]]
        ? First extends { data: infer TData }
          ? (data: TData) => TChain extends [...any[], infer Last]
            ? Last extends { data: any, return: infer TReturn }
              ? TReturn extends Promise<any> 
                ? Promise<TReturn extends Promise<infer R> ? R : never>
                : TReturn extends void ? Last['data'] : TReturn
              : never
            : never
          : never
        : never;
    goto: <T extends FluentProxyStructure>(
      fluentProxy: T
    ) => FluentProxy<TRootApi, TCurrentApi, [...TChain, ...T['chain']], TPath>;
    toString: () => string;
  } & {
    [K in keyof TRootApi | keyof TCurrentApi]: 
      K extends keyof TCurrentApi
        ? TCurrentApi[K] extends (data: infer TData, ...args: infer TArgs) => infer TReturn
          ? <T extends TArgs>(...args: T) => 
              FluentProxy<TRootApi, TCurrentApi, [...TChain, { method: `${TPath}${K & string}`; args: { [P in keyof T]: ExtractChain<T[P]> }; data: TData; return: TReturn extends void ? TData : TReturn }], TPath>
          : FluentProxy<TRootApi, TCurrentApi[K] extends object ? TCurrentApi[K] : TCurrentApi, TChain, `${TPath}${K & string}.`>
        : K extends keyof TRootApi
          ? TRootApi[K] extends (data: infer TData, ...args: infer TArgs) => infer TReturn
            ? <T extends TArgs>(...args: T) => 
                FluentProxy<TRootApi, TRootApi, [...TChain, { method: `${K & string}`; args: { [P in keyof T]: ExtractChain<T[P]> }; data: TData; return: TReturn extends void ? TData : TReturn }], "">
            : FluentProxy<TRootApi, TRootApi[K] extends object ? TRootApi[K] : TRootApi, TChain, `${K & string}.`>
          : never
  };

export type FluentConfig<TApi, TCtx, TInitialChain extends Chain = []> = {
  api: TApi;
  ctx?: TCtx;
  chain?: TInitialChain | string;
};