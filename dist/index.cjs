var h=Object.defineProperty;var p=Object.getOwnPropertyDescriptor;var j=Object.getOwnPropertyNames;var P=Object.prototype.hasOwnProperty;var R=(n,e)=>{for(var o in e)h(n,o,{get:e[o],enumerable:!0})},S=(n,e,o,t)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of j(e))!P.call(n,r)&&r!==o&&h(n,r,{get:()=>e[r],enumerable:!(t=p(e,r))||t.enumerable});return n};var O=n=>S(h({},"__esModule",{value:!0}),n);var J={};R(J,{fluent:()=>b,initChain:()=>A});module.exports=O(J);function T(n,e,o){let{method:t,args:r}=o;return t.split(".").reduce((g,s)=>g[s],n)(e,...r||[])}async function I(n,e,o,t){await o,e=o===void 0?e:o;for(let r of t){let i=T(n,e,r);i instanceof Promise&&await i,e=i===void 0?e:i}return e}function N(n,e,o){let t=n.slice(o+1),r=JSON.stringify(e),i=t.findIndex(u=>JSON.stringify(u)===r);return i>-1?i:n.slice(0,o+1).findIndex(({goto:u,...f})=>JSON.stringify(f)===r)}function m(n,e,o,t){let r=[...e],i=(s,u=0)=>{var y;let f=-1;for(let a=u;a<r.length;a++){let c=r[a];if(c.goto&&c.goto.args){let l=N(r,c.goto.args[0],a);l>-1&&(f=l)}let d=T(n,s,c);if(d instanceof Promise){let l=r.slice(r.indexOf(c)+1);return I(n,s,d,l)}s=d===void 0?s:d,f>-1}if(f>-1){if((y=t==null?void 0:t.fluent)!=null&&y.blocking)return i(s,f);setTimeout(()=>i(s,f),0)}return s},g={get(s,u){if(u==="run")return i;if(u==="toJSON")return()=>r;if(u==="goto")return d=>{let l={method:"goto",args:JSON.parse(JSON.stringify(d))};return r[r.length-1].goto=l,m(n,[...r],o,t)};if(u==="toString")return()=>F(r);if(typeof u!="string")return;let y=(u in n?n[u]:void 0)?[u]:[...o,u],a=y.join("."),c=y.reduce((d,l)=>d[l],n);if(typeof c=="object"&&c!==null)return m(n,r,y,t);if(typeof c=="function")return c.length<=1?m(n,[...r,{method:a}],o,t):(...l)=>m(n,[...r,{method:a,args:l}],o,t)}};return new Proxy(()=>{},g)}function x(n,e){let o={};for(let t in n)typeof n[t]=="function"?o[t]=n[t].bind(e):typeof n[t]=="object"&&n[t]!==null?o[t]=x(n[t],e):o[t]=n[t];return o}function A(n,e,o){return n.map(t=>(t.args&&(t.args=t.args.map(r=>C(r,e,o))),t))}function C(n,e,o){let t=Array.isArray(n),r=!t&&typeof n=="object"&&n!==null;if(t)return n.every(i=>"method"in i)?b({api:e,chain:n,ctx:o}):n.map(i=>C(i,e,o));if(r){for(let i in n)n[i]=C(n[i],e,o);return n}return n}function w(n,e){let o=/(\w+)(?:\(([^)]*)\))?/g,t=[],r=e,i=[];for(;;){let g=o.exec(n);if(!g)break;let[,s,u]=g;if(!r[s]&&e[s]&&(r=e,i=[]),typeof r[s]=="function"){let f=i.length?`${i.join(".")}.${s}`:s;t.push({method:f,args:u?u.split(",").map(y=>y.trim()):[]})}else typeof r[s]=="object"&&(r=r[s],i.push(s));n.slice(o.lastIndex).trim().startsWith(".")||(r=e,i=[])}return t}function F(n){return n.map(e=>{var t;let o=(t=e.args)!=null&&t.length?`(${e.args.join(", ")})`:"";return`${e.method}${o}`}).join(".")}function b({api:n,chain:e=[],ctx:o}){let t=x(n,o||{}),r=typeof e=="string"?w(e,t):e,i=r.length?r.slice(-1)[0].method.split(".").slice(0,-1):[],g=e?A(r,t,o):[];return m(t,g,i,o||{})}0&&(module.exports={fluent,initChain});
//# sourceMappingURL=index.cjs.map