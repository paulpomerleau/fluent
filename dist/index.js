function C(n,r,o){let{method:t,args:e}=o;return t.split(".").reduce((g,s)=>g[s],n)(r,...e||[])}async function x(n,r,o,t){r=await o;for(let e of t){let i=C(n,r,e);i instanceof Promise&&await i,r=i===void 0?r:i}return r}function A(n,r,o){let t=n.slice(o+1),e=JSON.stringify(r),i=t.findIndex(u=>JSON.stringify(u)===e);return i>-1?i:n.slice(0,o+1).findIndex(({goto:u,...f})=>JSON.stringify(f)===e)}function m(n,r=[],o=[],t){let e=[...r],i=(s,u=0)=>{var a;let f=-1;for(let y=u;y<e.length;y++){let c=e[y];if(c.goto&&c.goto.args){let l=A(e,c.goto.args[0],y);l>-1&&(f=l)}let d=C(n,s,c);if(d instanceof Promise){let l=e.slice(e.indexOf(c)+1);return x(n,s,d,l)}s=d===void 0?s:d,f>-1}if(f>-1){if((a=t==null?void 0:t.fluent)!=null&&a.blocking)return i(s,f);setTimeout(()=>i(s,f),0)}return s},g={get(s,u){if(u==="run")return i;if(u==="toJSON")return()=>e;if(u==="goto")return d=>{let l={method:"goto",args:JSON.parse(JSON.stringify(d))};return e[e.length-1].goto=l,m(n,[...e],o,t)};if(u==="toString")return()=>p(e);if(typeof u!="string")return;let a=(u in n?n[u]:void 0)?[u]:[...o,u],y=a.join("."),c=a.reduce((d,l)=>d[l],n);if(typeof c=="object"&&c!==null)return m(n,e,a,t);if(typeof c=="function")return c.length<=1?m(n,[...e,{method:y}],o,t):(...l)=>m(n,[...e,{method:y,args:l}],o,t)}};return new Proxy(()=>{},g)}function T(n,r){let o={};for(let t in n)typeof n[t]=="function"?o[t]=n[t].bind(r):typeof n[t]=="object"&&n[t]!==null?o[t]=T(n[t],r):o[t]=n[t];return o}function b(n,r,o){return n.map(t=>(t.args&&(t.args=t.args.map(e=>h(e,r,o))),t))}function h(n,r,o){let t=Array.isArray(n),e=!t&&typeof n=="object"&&n!==null;if(t)return n.every(i=>"method"in i)?j({api:r,chain:n,ctx:o}):n.map(i=>h(i,r,o));if(e){for(let i in n)n[i]=h(n[i],r,o);return n}return n}function R(n,r){let o=/(\w+)(?:\(([^)]*)\))?/g,t=[],e=r,i=[];for(;;){let g=o.exec(n);if(!g)break;let[,s,u]=g;if(!e[s]&&r[s]&&(e=r,i=[]),typeof e[s]=="function"){let f=i.length?`${i.join(".")}.${s}`:s;t.push({method:f,args:u?u.split(",").map(a=>a.trim()):[]})}else typeof e[s]=="object"&&(e=e[s],i.push(s));n.slice(o.lastIndex).trim().startsWith(".")||(e=r,i=[])}return t}function p(n){return n.map(r=>{var t;let o=(t=r.args)!=null&&t.length?`(${r.args.join(", ")})`:"";return`${r.method}${o}`}).join(".")}function j({api:n,chain:r=[],ctx:o}){let t=T(n,o||{}),e=typeof r=="string"?R(r,t):r,i=e.length?e.slice(-1)[0].method.split(".").slice(0,-1):[],g=r?b(e,t,o):[];return m(t,g,i,o||{})}export{j as fluent,b as initChain};
//# sourceMappingURL=index.js.map