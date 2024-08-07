// src/fluent.ts
function fluent(api) {
  let chain = null;
  const createProxy = (parentCalls = [], path = []) => {
    const calls = [...parentCalls];
    const runMethod = (ctx, call) => {
      const { method: path2, args } = call;
      const method = path2.split(".").reduce((acc, key) => acc[key], api);
      return method(ctx, ...args || []);
    };
    const runPromises = async (ctx, firstResult, calls2) => {
      ctx = await firstResult;
      for (const call of calls2) {
        const result = runMethod(ctx, call);
        if (result instanceof Promise) {
          await result;
        }
        ctx = result;
      }
      return ctx;
    };
    const callIndex = (call, current) => {
      const remaining = calls.slice(current + 1);
      const gotoCall = JSON.stringify(call);
      const nextIndex = remaining.findIndex(
        (c) => JSON.stringify(c) === gotoCall
      );
      if (nextIndex > -1) {
        return nextIndex;
      }
      const start = calls.slice(0, current + 1);
      const prevIndex = start.findIndex(
        ({ goto, ...c }) => JSON.stringify(c) === gotoCall
      );
      return prevIndex;
    };
    const run = (ctx, from = 0) => {
      let goto = -1;
      for (let i = from; i < calls.length; i++) {
        let call = calls[i];
        if (call.goto && call.goto.args) {
          const index = callIndex(call.goto.args[0], i);
          if (index > -1) goto = index;
        }
        const result = runMethod(ctx, call);
        if (result instanceof Promise) {
          const remaining = calls.slice(calls.indexOf(call) + 1);
          return runPromises(ctx, result, remaining);
        }
        ctx = result;
        if (goto > -1)
          continue;
      }
      if (goto > -1) {
        setTimeout(() => run(ctx, goto), 0);
      }
      return ctx;
    };
    const handler = {
      get(_, prop) {
        if (prop === "run") return run;
        if (prop === "toJSON") return () => calls;
        if (prop === "goto")
          return (call) => {
            const goto = {
              method: "goto",
              args: JSON.parse(JSON.stringify(call))
            };
            calls[calls.length - 1].goto = goto;
            return createProxy([...calls], path);
          };
        if (typeof prop !== "string") return void 0;
        const baseTarget = prop in api ? api[prop] : void 0;
        const newPath = baseTarget ? [prop] : [...path, prop];
        const fullPath = newPath.join(".");
        const target = baseTarget || newPath.reduce((acc, key) => acc[key], api);
        if (typeof target === "object") {
          return createProxy(calls, newPath);
        }
        if (typeof target === "function") {
          const func = target;
          if (func.length <= 1) {
            return createProxy([...calls, { method: fullPath }], path);
          }
          return (...args) => {
            return createProxy([...calls, { method: fullPath, args }], path);
          };
        }
        return void 0;
      }
    };
    return new Proxy(() => {
    }, handler);
  };
  chain = createProxy();
  return chain;
}
var toChain = (op, fluent2) => {
  const config = typeof op === "string" ? JSON.parse(op) : JSON.parse(JSON.stringify(op));
  let current = fluent2;
  for (const { method, args } of config) {
    const methods = method.split(".");
    for (const m of methods) {
      if (methods.indexOf(m) === methods.length - 1 && (args == null ? void 0 : args.length)) {
        const _args = args.map((arg) => {
          const args2 = Array.isArray(arg) ? arg : [arg];
          const hasChain = args2.some((a) => a.method);
          return hasChain ? toChain(arg, fluent2) : arg;
        });
        current = current[m](..._args);
        continue;
      }
      current = current[m];
    }
  }
  return current;
};
export {
  fluent,
  toChain
};
//# sourceMappingURL=index.js.map