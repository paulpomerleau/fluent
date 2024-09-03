'use strict';

function A(n){return typeof n=="object"&&n!==null}function y(n){return typeof n=="object"&&n!==null&&"method"in n&&typeof n.method=="string"&&"args"in n&&Array.isArray(n.args)}function m(n){return typeof n=="object"&&n!==null&&"chain"in n&&Array.isArray(n.chain)}function h(n,o,t){if(m(n))return x({api:o,chain:n.chain,ctx:t});if(Array.isArray(n))return n.map(e=>h(e,o,t));if(y(n))return {...n,args:n.args.map(e=>h(e,o,t))};if(typeof n=="object"&&n!==null){let e={};for(let i in n)e[i]=h(n[i],o,t);return e}return n}function F(n){let o=n.args.map(t=>JSON.stringify(t)).join(", ");return `${n.method}(${o})`}function d(n,o,t,e,i){let s={chain:t,run:r=>w(n,r,t),goto:r=>{if(!m(r)||r.chain.length===0)throw new Error("Goto must receive a non-empty Fluent");return d(n,o,[...t,...r.chain],e)},toString:()=>t.map(F).join(".").replace(/\.$/,"")};return new Proxy(s,{get(r,a){if(a in r)return r[a];let f,u;if(A(o)&&a in o)f=o[a],u=`${e}${e?".":""}${a}`;else if(A(n)&&a in n)f=n[a],u=a;else return;if(typeof f=="function")return (...c)=>{let l=u,T={args:c},C=[...t,{method:l,args:T.args,data:{},return:{}}];return d(n,o,C,e)};if(A(f))return d(n,f,t,u)}})}function g(n,o={}){let t={};for(let e in n)typeof n[e]=="function"?t[e]=n[e].bind(o):typeof n[e]=="object"&&n[e]!==null?t[e]=g(n[e],o):t[e]=n[e];return t}function b(n,o,t){if(!t)return [];let e;return typeof t=="string"?e=new Function("api","fluent",`
      const root = fluent({ api });
      const { ${Object.keys(n).join(",")} } = root;
      const chain = ${t};
      return chain.chain;
    `)(n,x):e=t,e.map(i=>y(i)?{...i,args:i.args.map(s=>h(s,n,o))}:i)}function w(n,o,t,e){let i=o,s=0;function a(){if(s>=t.length)return i;let u=t[s];if(y(u)){let c=u.method.split(".").reduce((T,C)=>T[C],n);if(typeof c!="function")throw new Error(`Method ${u.method} not found in API`);let l=c(i,...u.args);if(l instanceof Promise)return l.then(T=>P(n,T,t.slice(s+1)));i=l===void 0?i:l;}return s++,a()}let f=a();return f}async function P(n,o,t,e){let i=o,s=0;for(;s<t.length;){let r=t[s];if(y(r)){let a=r.method.split(".").reduce((u,c)=>u[c],n);if(typeof a!="function")throw new Error(`Method ${r.method} not found in API`);let f=await a(i,...r.args);i=f===void 0?i:f;}s++;}return i}function x(n){let {api:o,ctx:t,chain:e}=n,i=g(o,t),s=b(i,t||{},e);t?.fluent||{blocking:!1};return d(i,i,s,"")}

exports.fluent = x;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map