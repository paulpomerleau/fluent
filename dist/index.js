// src/fluent.ts
function isObject(value) {
  return typeof value === "object" && value !== null;
}
function isApiCall(item) {
  return typeof item === "object" && item !== null && "method" in item && typeof item.method === "string" && "args" in item && Array.isArray(item.args);
}
function isGotoItem(item) {
  return typeof item === "object" && item !== null && "goto" in item && typeof item.goto === "string" && "args" in item && Array.isArray(item.args);
}
function isFluentProxy(value) {
  return typeof value === "object" && value !== null && "chain" in value && Array.isArray(value.chain);
}
function processArgument(arg, api, ctx) {
  if (isFluentProxy(arg)) {
    return fluent({ api, chain: arg.chain, ctx });
  }
  if (Array.isArray(arg)) {
    if (arg.every((a) => isApiCall(a) || isGotoItem(a))) {
      return fluent({ api, chain: arg, ctx });
    }
    return arg.map((item) => processArgument(item, api, ctx));
  }
  if (isApiCall(arg)) {
    return {
      ...arg,
      args: arg.args.map((a) => processArgument(a, api, ctx))
    };
  }
  if (isGotoItem(arg)) {
    return {
      ...arg,
      args: arg.args.map((a) => processArgument(a, api, ctx))
    };
  }
  if (typeof arg === "object" && arg !== null) {
    const processedArg = {};
    for (const key in arg) {
      processedArg[key] = processArgument(arg[key], api, ctx);
    }
    return processedArg;
  }
  return arg;
}
function chainItemToString(item) {
  if (isApiCall(item)) {
    const args = item.args.map((arg) => JSON.stringify(arg)).join(", ");
    return `${item.method}(${args})`;
  } else if (isGotoItem(item)) {
    const args = item.args.map((arg) => JSON.stringify(arg)).join(", ");
    return `goto(${item.goto}(${args}))`;
  }
  return "";
}
function createProxy(rootApi, currentApi, currentChain, path, options) {
  const target = {
    chain: currentChain,
    run: (data) => runChain(rootApi, data, currentChain, options),
    goto: (fluentProxy) => {
      console.log("Goto received:", fluentProxy);
      if (!isFluentProxy(fluentProxy) || fluentProxy.chain.length === 0 || !isApiCall(fluentProxy.chain[0])) {
        throw new Error("Goto must receive a non-empty FluentProxy with an ApiCall as its first chain item");
      }
      const firstApiCall = fluentProxy.chain[0];
      const gotoItem = {
        goto: firstApiCall.method,
        args: firstApiCall.args
      };
      return createProxy(rootApi, currentApi, [...currentChain, gotoItem], path, options);
    },
    toString: () => currentChain.map(chainItemToString).join(".").replace(/\.$/, "")
  };
  return new Proxy(target, {
    get(target2, prop) {
      if (prop in target2) {
        return target2[prop];
      }
      let nextApi;
      let nextPath;
      if (isObject(currentApi) && prop in currentApi) {
        nextApi = currentApi[prop];
        nextPath = `${path}${path ? "." : ""}${prop}`;
      } else if (isObject(rootApi) && prop in rootApi) {
        nextApi = rootApi[prop];
        nextPath = prop;
      } else {
        return void 0;
      }
      if (typeof nextApi === "function") {
        return (...args) => {
          const method = nextPath;
          const newChain = [
            ...currentChain,
            {
              method,
              args: args.map((arg) => isFluentProxy(arg) ? arg.chain[0] : arg),
              dataType: {},
              returnType: {}
            }
          ];
          return createProxy(rootApi, currentApi, newChain, path, options);
        };
      }
      if (isObject(nextApi)) {
        return createProxy(rootApi, nextApi, currentChain, nextPath, options);
      }
      return void 0;
    }
  });
}
function bindApiToContext(api, ctx = {}) {
  const boundApi = {};
  for (const key in api) {
    if (typeof api[key] === "function") {
      boundApi[key] = api[key].bind(ctx);
    } else if (typeof api[key] === "object" && api[key] !== null) {
      boundApi[key] = bindApiToContext(api[key], ctx);
    } else {
      boundApi[key] = api[key];
    }
  }
  return boundApi;
}
function parseInitialChain(api, ctx, chain) {
  if (!chain) return [];
  let jsonChain;
  if (typeof chain === "string") {
    const getChain = new Function("api", "fluent", `
      const root = fluent({ api });
      const { ${Object.keys(api).join(",")} } = root;
      const chain = ${chain};
      return chain.chain;
    `);
    jsonChain = getChain(api, fluent);
  } else {
    jsonChain = chain;
  }
  return jsonChain.map((item) => {
    if (isApiCall(item)) {
      return {
        ...item,
        args: item.args.map((arg) => processArgument(arg, api, ctx))
      };
    }
    if (isGotoItem(item)) {
      return {
        ...item,
        args: item.args.map((arg) => processArgument(arg, api, ctx))
      };
    }
    return item;
  });
}
function findGotoTarget(chain, gotoItem, currentIndex) {
  for (let i = currentIndex + 1; i < chain.length; i++) {
    if (matchesGotoTarget(chain[i], gotoItem)) {
      return i;
    }
  }
  for (let i = 0; i < currentIndex; i++) {
    if (matchesGotoTarget(chain[i], gotoItem)) {
      return i;
    }
  }
  return -1;
}
function matchesGotoTarget(chainItem, gotoItem) {
  if (!isApiCall(chainItem)) {
    return false;
  }
  return chainItem.method === gotoItem.goto && chainItem.args.length === gotoItem.args.length && chainItem.args.every((arg, index) => arg === gotoItem.args[index]);
}
var setImmediate = window.setImmediate || ((fn, ...args) => setTimeout(fn, 0, ...args));
function runChain(api, initialData, chain, options) {
  let data = initialData;
  let index = 0;
  let isAsync = false;
  function processNextItem() {
    if (index >= chain.length) {
      return data;
    }
    const item = chain[index];
    if (isGotoItem(item)) {
      const gotoIndex = findGotoTarget(chain, item, index);
      if (gotoIndex !== -1) {
        index = gotoIndex;
        isAsync = true;
        if (options.blocking) {
          processNextItem();
        } else {
          setImmediate(processNextItem);
        }
        return;
      }
    } else if (isApiCall(item)) {
      const method = item.method.split(".").reduce((obj, key) => obj[key], api);
      if (typeof method !== "function") {
        throw new Error(`Method ${item.method} not found in API`);
      }
      const result2 = method(data, ...item.args);
      if (result2 instanceof Promise) {
        return result2.then(
          (resolvedData) => runAsyncChain(api, resolvedData, chain.slice(index + 1), options)
        );
      }
      data = result2 === void 0 ? data : result2;
    }
    index++;
    return processNextItem();
  }
  const result = processNextItem();
  return isAsync ? new Promise((resolve) => setImmediate(() => resolve(result))) : result;
}
async function runAsyncChain(api, initialData, chain, options) {
  let data = initialData;
  let index = 0;
  while (index < chain.length) {
    const item = chain[index];
    if (isGotoItem(item)) {
      const gotoIndex = findGotoTarget(chain, item, index);
      if (gotoIndex !== -1) {
        index = gotoIndex;
        continue;
      }
    } else if (isApiCall(item)) {
      const method = item.method.split(".").reduce((obj, key) => obj[key], api);
      if (typeof method !== "function") {
        throw new Error(`Method ${item.method} not found in API`);
      }
      const result = await method(data, ...item.args);
      data = result === void 0 ? data : result;
    }
    index++;
  }
  return data;
}
function fluent(config) {
  const { api, ctx, chain: initialChain } = config;
  const boundApi = bindApiToContext(api, ctx);
  const parsedChain = parseInitialChain(boundApi, ctx || {}, initialChain);
  const options = (ctx == null ? void 0 : ctx.fluent) || { blocking: false };
  return createProxy(boundApi, boundApi, parsedChain, "", options);
}
export {
  fluent
};
//# sourceMappingURL=index.js.map