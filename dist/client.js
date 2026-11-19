window.__ModuleLoader__.load({id:"@chronicle-iras/dsh-wandao",factory:(require)=>{var module={exports:{}};var exports=module.exports;"use strict";var _=Object.defineProperty;var ga=Object.getOwnPropertyDescriptor;var fa=Object.getOwnPropertyNames;var ba=Object.prototype.hasOwnProperty;var xa=(r,o)=>{for(var t in o)_(r,t,{get:o[t],enumerable:!0})},ha=(r,o,t,n)=>{if(o&&typeof o=="object"||typeof o=="function")for(let a of fa(o))!ba.call(r,a)&&a!==t&&_(r,a,{get:()=>o[a],enumerable:!(n=ga(o,a))||n.enumerable});return r};var va=r=>ha(_({},"__esModule",{value:!0}),r);var Sa={};xa(Sa,{PANEL_ID:()=>J,WandaoIcon:()=>ma,apply:()=>Aa,inject:()=>Ca,name:()=>Na});module.exports=va(Sa);var S=require("react");var x=require("react");var $=require("react"),C=require("react/jsx-runtime");function Y({api:r,providerId:o,fields:t}){let[n,a]=(0,$.useState)({}),[d,c]=(0,$.useState)(""),[g,e]=(0,$.useState)(!1);return t.length?(0,C.jsxs)("details",{className:"wandao-credentials",children:[(0,C.jsx)("summary",{children:"\u8D26\u53F7\u4E0E API \u8BBE\u7F6E"}),(0,C.jsx)("p",{className:"wandao-muted",children:"\u4EC5\u4FDD\u5B58\u5230\u5BBF\u4E3B\u673A\uFF0C\u7559\u7A7A\u4FDD\u7559\u539F\u503C\u3002\u4E0D\u4F1A\u53D1\u9001\u7ED9\u6A21\u578B\u3002"}),(0,C.jsxs)("form",{onSubmit:async i=>{if(i.preventDefault(),!g){e(!0),c("");try{await r.saveCredentials(o,n),a({}),c("\u8BBE\u7F6E\u5DF2\u4FDD\u5B58")}catch(b){c(b instanceof Error?b.message:"\u4FDD\u5B58\u5931\u8D25")}finally{e(!1)}}},children:[t.map(i=>(0,C.jsxs)("label",{className:"wandao-field",children:[(0,C.jsx)("span",{children:i.label||i.name}),(0,C.jsx)("input",{type:"password",autoComplete:"new-password",value:n[i.name]??"",onChange:b=>a(h=>({...h,[i.name]:b.target.value}))})]},i.name)),(0,C.jsx)("button",{className:"wandao-button",type:"submit",disabled:g||!Object.values(n).some(Boolean),children:g?"\u4FDD\u5B58\u4E2D\u2026":"\u4FDD\u5B58\u8D26\u53F7\u8BBE\u7F6E"}),(0,C.jsx)("p",{role:"status",className:"wandao-muted",children:d})]})]}):null}var y=require("react/jsx-runtime");function aa({fields:r,values:o,options:t,onChange:n}){return(0,y.jsx)("div",{className:"wandao-fields",children:r.map(a=>{let d=`wandao-field-${a.name}`,c=a.label||a.name;if(a.type==="checkbox")return(0,y.jsxs)("label",{className:"wandao-check wandao-option",htmlFor:d,children:[(0,y.jsx)("input",{id:d,type:"checkbox",checked:o[a.name]===!0,onChange:e=>n(a.name,e.target.checked)}),c]},a.name);let g=t[a.name]??(a.options??[]).map(e=>typeof e=="string"?{value:e,label:e}:{...e,label:e.label??e.value});return(0,y.jsxs)("label",{className:"wandao-field",htmlFor:d,children:[(0,y.jsxs)("span",{children:[c,a.required?(0,y.jsx)("span",{className:"wandao-required",children:" *"}):null]}),a.type==="select"&&g.length?(0,y.jsxs)("select",{id:d,required:a.required,value:String(o[a.name]??""),onChange:e=>n(a.name,e.target.value),children:[(0,y.jsx)("option",{value:"",children:"\u8BF7\u9009\u62E9"}),g.map(e=>(0,y.jsx)("option",{value:e.value,children:e.label},e.value))]}):(0,y.jsx)("input",{id:d,type:a.type==="number"?"number":"text",step:a.type==="number"?"any":void 0,min:a.min,max:a.max,required:a.required,autoComplete:"off",value:String(o[a.name]??""),placeholder:a.type==="directory"||a.type==="file"?"\u8F93\u5165\u5BBF\u4E3B\u673A\u4E0A\u7684\u7EDD\u5BF9\u8DEF\u5F84":a.type==="select"?"\u5148\u5217\u51FA\u76EE\u6807\uFF0C\u518D\u586B\u5199\u76EE\u6807 ID":void 0,onChange:e=>n(a.name,a.type==="number"&&e.target.value!==""?Number(e.target.value):e.target.value)}),a.type==="directory"||a.type==="file"?(0,y.jsx)("small",{className:"wandao-field-help",children:a.name==="output"?"\u6587\u4EF6\u5C06\u4FDD\u5B58\u5230\u6B64\u76EE\u5F55":"\u586B\u5199\u8FD0\u884C DSH \u7684\u7535\u8111\u4E0A\u7684\u7EDD\u5BF9\u8DEF\u5F84"}):null]},a.name)})})}var ea=require("react"),f=require("react/jsx-runtime");function oa({rows:r,selected:o,selectionOnly:t,onSelect:n,onSelectionOnly:a}){let[d,c]=(0,ea.useState)(""),g=d.trim().toLocaleLowerCase(),e=r.filter(i=>`${i.title} ${i.id}`.toLocaleLowerCase().includes(g));return(0,f.jsxs)("section",{className:"wandao-documents","aria-label":"\u5DF2\u626B\u63CF\u6587\u6863",children:[(0,f.jsxs)("div",{className:"wandao-documents-heading",children:[(0,f.jsxs)("h3",{children:["\u5DF2\u626B\u63CF\u6587\u6863 ",(0,f.jsx)("span",{className:"wandao-badge",children:r.length})]}),(0,f.jsxs)("span",{className:"wandao-muted",role:"status",children:["\u5DF2\u9009 ",o.size," / ",r.length," \u7BC7"]})]}),(0,f.jsxs)("label",{className:"wandao-field wandao-document-search",children:[(0,f.jsx)("span",{className:"wandao-sr-only",children:"\u641C\u7D22\u5DF2\u626B\u63CF\u6587\u6863"}),(0,f.jsx)("input",{type:"search",onKeyDown:i=>{i.key==="Enter"&&i.preventDefault()},placeholder:"\u641C\u7D22\u6587\u6863\u540D\u79F0\u6216\u8DEF\u5F84\u2026",value:d,onChange:i=>c(i.target.value)})]}),(0,f.jsxs)("div",{className:"wandao-selection-tools",children:[(0,f.jsx)("button",{className:"wandao-button wandao-button-quiet",type:"button",disabled:!e.length,onClick:()=>n(new Set([...o,...e.map(i=>i.id)])),children:"\u5168\u9009\u5F53\u524D\u7ED3\u679C"}),(0,f.jsx)("button",{className:"wandao-button wandao-button-quiet",type:"button",disabled:!o.size,onClick:()=>n(new Set),children:"\u6E05\u7A7A\u9009\u62E9"})]}),(0,f.jsx)("ul",{children:e.map(i=>(0,f.jsx)("li",{children:(0,f.jsxs)("label",{className:"wandao-check",children:[(0,f.jsx)("input",{type:"checkbox",checked:o.has(i.id),onChange:b=>{let h=new Set(o);b.target.checked?h.add(i.id):h.delete(i.id),n(h)}}),(0,f.jsx)("span",{title:i.id,children:i.title})]})},i.id))}),e.length?null:(0,f.jsx)("p",{className:"wandao-no-results",children:"\u6CA1\u6709\u5339\u914D\u7684\u6587\u6863"}),(0,f.jsxs)("label",{className:"wandao-check",children:[(0,f.jsx)("input",{type:"checkbox",checked:t,onChange:i=>a(i.target.checked)}),"\u4EC5\u8FC1\u79FB\u52FE\u9009\u9879"]}),(0,f.jsx)("p",{className:"wandao-muted",children:"\u8FD9\u91CC\u53EA\u5C55\u793A\u90E8\u5206\u76EE\u5F55\u6458\u8981\uFF1B\u5173\u95ED\u201C\u4EC5\u8FC1\u79FB\u52FE\u9009\u9879\u201D\u53EF\u8FC1\u79FB\u5168\u90E8\u6587\u6863\u3002"})]})}function H(r,o){return r.fields.filter(t=>!t.private&&(!t.actions?.length||t.actions.includes(o)))}function na(r,o){return Object.fromEntries(r.fields.filter(t=>!t.private).map(t=>[t.name,t.name==="output"?`${o.replace(/[\\/]+$/,"")}${o.includes("\\")?"\\":"/"}${r.pluginId}`:t.default??(t.type==="checkbox"?!1:"")]))}function ta(r,o,t){return Object.fromEntries(H(r,o).filter(n=>t[n.name]!==""&&t[n.name]!==void 0).map(n=>[n.name,t[n.name]]))}function ra(r,o=""){return o.split(".").filter(Boolean).reduce((t,n)=>t&&typeof t=="object"?t[n]:void 0,r)}function ia(r,o){let t=r.toc,n=ra(o,t?.itemsPath??"nodes");return Array.isArray(n)?t?.adapter==="yinxiang-notebooks"?n.flatMap(a=>Array.isArray(a?.notes)?a.notes.filter(d=>d?.guid).map(d=>({id:String(d.guid),title:`${a.name||"\u7B14\u8BB0\u672C"} / ${d.title||d.guid}`})):[]):t?.adapter==="zsxq-column-groups"?n.flatMap((a,d)=>Array.isArray(a?.topics)?a.topics.filter(c=>c&&typeof c=="object").map((c,g)=>({id:String(c.key||`toc:${a.groupIndex??d}:${c.topicIndex??g}`),title:`${a.groupTitle||"\u4E13\u680F"} / ${c.title||"\u672A\u547D\u540D"}`})):[]):n.filter(a=>a&&typeof a=="object"&&(!t?.selectableKey||a[t.selectableKey]!==!1)).flatMap(a=>{let d=a[t?.exportIdKey??t?.idKey??"exportId"];return typeof d=="string"&&d||typeof d=="number"&&Number.isFinite(d)?[{id:String(d),title:String(a[t?.titleKey??"title"]??d)}]:[]}):[]}function sa(r,o){return Object.fromEntries((r.updates??[]).filter(t=>t.type==="options").map(t=>{let n=ra(o,t.path);return[t.field,Array.isArray(n)?n.filter(a=>a&&typeof a=="object").map(a=>({value:String(a[t.valueKey??"value"]??""),label:String(a[t.labelKey??"label"]??a[t.valueKey??"value"]??"")})).filter(a=>a.value):[]]}))}function R(r){try{return JSON.parse(r??"")}catch{return}}var z=r=>["completed","failed","killed"].includes(r);var l=require("react/jsx-runtime");function da({api:r,providerId:o,catalogue:t,tasks:n}){let[a,d]=(0,x.useState)(),[c,g]=(0,x.useState)(""),[e,i]=(0,x.useState)(""),[b,h]=(0,x.useState)({}),[F,M]=(0,x.useState)({}),[m,k]=(0,x.useState)(!1),[A,j]=(0,x.useState)(),[X,Z]=(0,x.useState)([]),[U,V]=(0,x.useState)(new Set),[L,K]=(0,x.useState)(!1),[P,D]=(0,x.useState)(),B=(0,x.useRef)(null),E=(0,x.useRef)(!0);(0,x.useEffect)(()=>(E.current=!0,()=>{E.current=!1}),[]),(0,x.useEffect)(()=>{let s=new AbortController;return r.describe(o,s.signal).then(w=>{s.signal.aborted||(d(w),h(na(w,t.outputRoot)),i((w.actions.find(N=>N.kind==="export")??w.actions.find(N=>N.kind==="import")??w.actions[0])?.id??""))}).catch(w=>{s.signal.aborted||g(w instanceof Error?w.message:"\u5E73\u53F0\u52A0\u8F7D\u5931\u8D25")}),()=>s.abort()},[r,o,t.outputRoot]),(0,x.useEffect)(()=>{P?B.current?.showModal():B.current?.close()},[P]),(0,x.useEffect)(()=>{if(!a||!A)return;let s=n.find(O=>O.jobId===A.id);if(!s||!z(s.status)||(j(void 0),!s.result))return;let w=R(s.result.preview),N=a.actions.find(O=>O.id===A.actionId);N?.kind==="scan"&&(Z(ia(a,w)),V(new Set),K(!1)),N&&M(O=>({...O,...sa(N,w)}))},[n,A,a]);async function Q(s){if(!m){k(!0),g("");try{let w=await r.start(s);E.current&&j({id:w.jobId,actionId:s.actionId})}catch(w){E.current&&g(w instanceof Error?w.message:"\u542F\u52A8\u5931\u8D25")}finally{E.current&&k(!1)}}}if(!a)return(0,l.jsx)("section",{className:"wandao-form-panel",children:(0,l.jsx)("p",{role:c?"alert":"status",children:c||"\u6B63\u5728\u52A0\u8F7D\u5E73\u53F0\u2026"})});let v=a.actions.find(s=>s.id===e),T=n.some(s=>!z(s.status))||!!(A&&!n.some(s=>s.jobId===A.id)),W=t.providers.find(s=>s.id===o),wa=v?.kind==="import"||!!(v?.confirm||v?.danger),G=["export","import"].includes(v?.kind??"")&&v?.includeSelection!==!1;return(0,l.jsxs)("section",{className:"wandao-form-panel","aria-label":"\u8FC1\u79FB\u8BBE\u7F6E",children:[(0,l.jsx)("div",{className:"wandao-panel-eyebrow",children:"\u8FC1\u79FB\u914D\u7F6E"}),(0,l.jsx)("h2",{children:W?.title}),(0,l.jsx)("p",{className:"wandao-muted",children:a.description}),W?.supported===!1?(0,l.jsx)("p",{role:"alert",className:"wandao-error",children:"\u5F53\u524D\u64CD\u4F5C\u7CFB\u7EDF\u4E0D\u652F\u6301\u8FD9\u4E2A\u5E73\u53F0\u3002"}):null,(0,l.jsx)(Y,{api:r,providerId:o,fields:a.fields.filter(s=>s.private)}),a.actions.length?(0,l.jsx)("form",{onSubmit:s=>{if(s.preventDefault(),!v||m||T)return;if(L&&G&&!U.size){g("\u8BF7\u81F3\u5C11\u52FE\u9009\u4E00\u7BC7\u6587\u6863\uFF0C\u6216\u5173\u95ED\u4EC5\u8FC1\u79FB\u52FE\u9009\u9879");return}let w={providerId:o,actionId:e,fields:ta(a,e,b),...L&&G?{docIds:[...U]}:{}};b.__resume===!0&&a.checkpoint.supported&&["export","import"].includes(v.kind)&&(w.resume=!0),wa?D(w):Q(w)},children:(0,l.jsxs)("fieldset",{className:"wandao-action-fields",disabled:m||T,children:[(0,l.jsxs)("label",{className:"wandao-field",children:[(0,l.jsx)("span",{children:"\u64CD\u4F5C\u6B65\u9AA4"}),(0,l.jsx)("select",{"aria-label":"\u64CD\u4F5C\u6B65\u9AA4",value:e,onChange:s=>{i(s.target.value),g("")},children:a.actions.map(s=>(0,l.jsx)("option",{value:s.id,children:s.label||s.id},s.id))})]}),v?.kind==="scan"?(0,l.jsx)("p",{className:"wandao-action-hint",children:"\u5148\u8BFB\u53D6\u76EE\u5F55\u4E86\u89E3\u6765\u6E90\u5185\u5BB9\uFF0C\u518D\u5207\u6362\u5230\u5BFC\u51FA\u6216\u5BFC\u5165\u6B65\u9AA4\u3002"}):null,(0,l.jsx)("div",{className:"wandao-field-divider"}),(0,l.jsx)(aa,{fields:H(a,e),values:b,options:F,onChange:(s,w)=>{h(N=>({...N,[s]:w})),typeof w=="string"&&s!=="output"&&(Z([]),V(new Set),K(!1))}}),a.checkpoint.supported&&["export","import"].includes(v?.kind??"")?(0,l.jsxs)("label",{className:"wandao-check",children:[(0,l.jsx)("input",{type:"checkbox",checked:b.__resume===!0,onChange:s=>h(w=>({...w,__resume:s.target.checked}))}),"\u4ECE\u4E0A\u6B21\u65AD\u70B9\u7EE7\u7EED"]}):null,X.length?(0,l.jsx)(oa,{rows:X,selected:U,selectionOnly:L,onSelect:V,onSelectionOnly:K}):null,(0,l.jsxs)("div",{className:"wandao-form-footer",children:[(0,l.jsx)("button",{className:"wandao-button wandao-button-primary",type:"submit",disabled:m||T||W?.supported===!1,children:m?"\u6B63\u5728\u542F\u52A8\u2026":T?"\u4EFB\u52A1\u6267\u884C\u4E2D":v?.label||"\u6267\u884C\u52A8\u4F5C"}),(0,l.jsx)("span",{className:"wandao-muted",children:v?.kind==="login"?"\u5728\u672C\u673A\u6D4F\u89C8\u5668\u5B8C\u6210\u767B\u5F55\u540E\uFF0C\u786E\u8BA4\u767B\u5F55\u4EFB\u52A1\u3002":v?.kind==="export"?"\u5DF2\u6709\u76EE\u6807\u6587\u4EF6\u53EF\u80FD\u88AB\u8986\u76D6\uFF0C\u8BF7\u9009\u62E9\u5408\u9002\u7684\u5BFC\u51FA\u76EE\u5F55\u3002":"\u4EFB\u52A1\u5728\u540E\u53F0\u6267\u884C\uFF0C\u53EF\u968F\u65F6\u67E5\u770B\u8FDB\u5EA6\u3002"})]})]})}):(0,l.jsx)("p",{children:"\u6B64\u5E73\u53F0\u63D0\u4F9B\u8FC1\u79FB\u6307\u5357\uFF0C\u8BF7\u5C55\u5F00\u4E0B\u65B9\u8BF4\u660E\u3002"}),c?(0,l.jsx)("p",{role:"alert",className:"wandao-error",children:c}):null,(0,l.jsxs)("details",{className:"wandao-guide",children:[(0,l.jsx)("summary",{children:"\u5E73\u53F0\u4F7F\u7528\u8BF4\u660E"}),(0,l.jsx)("pre",{children:a.guide||"\u6B64\u5E73\u53F0\u6682\u65E0\u9644\u52A0\u8BF4\u660E\u3002"})]}),(0,l.jsxs)("dialog",{className:"wandao-confirm",ref:B,onCancel:()=>D(void 0),onClose:()=>D(void 0),children:[(0,l.jsx)("h2",{children:"\u786E\u8BA4\u5199\u5165\u76EE\u6807\u5E73\u53F0"}),(0,l.jsxs)("p",{children:["\u5373\u5C06\u6267\u884C\u201C",v?.label,"\u201D\uFF0C\u5C06\u5411\u76EE\u6807\u5E73\u53F0\u521B\u5EFA\u6216\u66F4\u65B0\u5185\u5BB9\u3002\u8BF7\u786E\u8BA4\u8D26\u53F7\u3001\u76EE\u6807\u4F4D\u7F6E\u548C\u6765\u6E90\u76EE\u5F55\u3002"]}),(0,l.jsx)("dl",{children:Object.entries(P?.fields??{}).filter(([,s])=>typeof s=="string"&&s).map(([s,w])=>(0,l.jsxs)("div",{children:[(0,l.jsx)("dt",{children:a.fields.find(N=>N.name===s)?.label||s}),(0,l.jsx)("dd",{children:String(w)})]},s))}),(0,l.jsxs)("div",{className:"wandao-task-actions",children:[(0,l.jsx)("button",{className:"wandao-button",onClick:()=>D(void 0),children:"\u8FD4\u56DE\u68C0\u67E5"}),(0,l.jsx)("button",{className:"wandao-button wandao-button-primary",onClick:()=>{if(P){let s=P;D(void 0),Q({...s,confirmWrite:!0})}},children:"\u786E\u8BA4\u6267\u884C"})]})]})]})}var I=require("react");var p=require("react/jsx-runtime"),ya={running:"\u8FDB\u884C\u4E2D",completed:"\u5DF2\u5B8C\u6210",failed:"\u672A\u5B8C\u6210",killed:"\u5DF2\u505C\u6B62",paused:"\u9650\u6D41\u6682\u505C",partial:"\u90E8\u5206\u5B8C\u6210",stopped:"\u5DF2\u505C\u6B62"};function la(r){let[o,t]=(0,I.useState)([]),[n,a]=(0,I.useState)("");return(0,I.useEffect)(()=>{let d=new AbortController,c,g=async()=>{try{let e=await r.tasks(d.signal);d.signal.aborted||(t(e.tasks),a(""))}catch(e){d.signal.aborted||a(e instanceof Error?e.message:"\u4EFB\u52A1\u52A0\u8F7D\u5931\u8D25")}d.signal.aborted||(c=setTimeout(g,1e3))};return g(),()=>{d.abort(),clearTimeout(c)}},[r]),{tasks:o,error:n}}function pa({api:r,tasks:o,error:t}){let[n,a]=(0,I.useState)(""),[d,c]=(0,I.useState)("");async function g(e,i){c(e),a("");try{await i()}catch(b){a(b instanceof Error?b.message:"\u64CD\u4F5C\u5931\u8D25")}finally{c("")}}return(0,p.jsxs)("section",{className:"wandao-task-panel","aria-label":"\u8FC1\u79FB\u4EFB\u52A1",children:[(0,p.jsxs)("div",{className:"wandao-task-panel-heading",children:[(0,p.jsxs)("h2",{children:["\u8FC1\u79FB\u4EFB\u52A1 ",(0,p.jsx)("span",{className:"wandao-badge",children:o.length})]}),(0,p.jsx)("span",{className:"wandao-muted",children:o.some(e=>!z(e.status))?"\u6B63\u5728\u6267\u884C":"\u6700\u8FD1\u8BB0\u5F55"})]}),t||n?(0,p.jsx)("p",{role:"alert",className:"wandao-error",children:t||n}):null,o.length?(0,p.jsx)("ol",{className:"wandao-task-list",children:o.map(e=>{let i=R(e.result?.preview),b=e.result?.outcome??e.status;return(0,p.jsxs)("li",{children:[(0,p.jsxs)("div",{className:"wandao-task-heading",children:[(0,p.jsx)("strong",{children:e.label.replace(/^Wandao /,"")}),(0,p.jsx)("span",{className:`wandao-status wandao-status-${b}`,children:ya[b]??b})]}),(0,p.jsxs)("p",{className:"wandao-muted",children:[new Date(e.startedAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),e.progress?` \xB7 ${e.progress}`:""]}),z(e.status)?null:(0,p.jsx)("div",{className:"wandao-progress","aria-label":"\u4EFB\u52A1\u6267\u884C\u4E2D",children:(0,p.jsx)("span",{})}),e.detail&&e.detail!==e.result?.outcome?(0,p.jsx)("p",{className:"wandao-task-detail",children:e.detail}):null,i&&["totalDocs","successCount","failureCount"].some(h=>typeof i[h]=="number")?(0,p.jsx)("p",{className:"wandao-counts",children:typeof i.successCount=="number"?`\u603B\u6570 ${i.totalDocs??0} \xB7 \u6210\u529F ${i.successCount} \xB7 \u5931\u8D25 ${i.failureCount??0}`:`\u5171 ${i.totalDocs??0} \u9879`}):null,typeof i?.output=="string"&&i.output?(0,p.jsx)("p",{className:"wandao-path",children:i.output}):null,e.result&&!["login","saveConfig"].includes(e.result.actionId)?(0,p.jsxs)("details",{className:"wandao-result",children:[(0,p.jsx)("summary",{children:"\u67E5\u770B\u7ED3\u679C"}),(0,p.jsx)("pre",{children:e.result.preview}),e.result.truncated?(0,p.jsx)("p",{className:"wandao-muted",children:"\u663E\u793A\u7684\u662F\u6709\u9650\u6458\u8981\uFF0C\u5B8C\u6574\u7ED3\u679C\u4FDD\u7559\u5728\u5BBF\u4E3B\u673A\u3002"}):null]}):null,z(e.status)?null:(0,p.jsxs)("div",{className:"wandao-task-actions",children:[e.canConfirmLogin?(0,p.jsx)("button",{className:"wandao-button",disabled:d===e.jobId,onClick:()=>{g(e.jobId,()=>r.loginDone(e.jobId))},children:"\u6211\u5DF2\u5B8C\u6210\u7F51\u9875\u767B\u5F55"}):null,(0,p.jsx)("button",{className:"wandao-button wandao-button-quiet",disabled:d===e.jobId,onClick:()=>{g(e.jobId,()=>r.cancel(e.jobId))},children:"\u505C\u6B62\u4EFB\u52A1"})]})]},e.jobId)})}):(0,p.jsxs)("div",{className:"wandao-empty",children:[(0,p.jsx)("span",{className:"wandao-empty-icon","aria-hidden":"true",children:(0,p.jsx)("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:(0,p.jsx)("path",{d:"M7 4h10a2 2 0 0 1 2 2v14H5V6a2 2 0 0 1 2-2ZM9 4V2h6v2M9 10h6m-6 4h4"})})}),(0,p.jsx)("p",{children:"\u8FD8\u6CA1\u6709\u8FC1\u79FB\u4EFB\u52A1"}),(0,p.jsx)("p",{className:"wandao-muted",children:"\u9009\u62E9\u5E73\u53F0\u5E76\u6267\u884C\u52A8\u4F5C\uFF0C\u8FDB\u5EA6\u4F1A\u663E\u793A\u5728\u8FD9\u91CC\u3002"}),(0,p.jsxs)("ol",{className:"wandao-quick-start",children:[(0,p.jsx)("li",{children:"\u9009\u62E9\u8FC1\u79FB\u5E73\u53F0"}),(0,p.jsx)("li",{children:"\u586B\u5199\u76EE\u5F55\u4E0E\u5FC5\u8981\u8BBE\u7F6E"}),(0,p.jsx)("li",{children:"\u5F00\u59CB\u4EFB\u52A1\uFF0C\u67E5\u770B\u6267\u884C\u7ED3\u679C"})]})]})]})}var ca=`.wandao-page {
  --wa-bg: var(--dsw-alias-bg-base, #fff);
  --wa-layer: var(--dsw-alias-bg-layer-1, #f7f8fa);
  --wa-text: var(--dsw-alias-label-primary, #25262a);
  --wa-muted: var(--dsw-alias-label-secondary, #72757d);
  --wa-border: var(--dsw-alias-border-l4, #e4e5e8);
  --wa-accent: var(--dsw-alias-brand-primary, #4769e8);
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow: auto;
  background: var(--wa-bg);
  color: var(--wa-text);
  font: 14px/1.6 var(--dsw-font-family, system-ui, sans-serif);
  color-scheme: light dark;
}
.wandao-page * {
  box-sizing: border-box;
}
.wandao-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: calc(32px + var(--dsh-frame-top-clearance, 0px))
    clamp(20px, 4vw, 48px) 40px;
}
.wandao-page h1 {
  margin: 0;
  font-size: 24px;
  line-height: 28px;
  font-weight: 600;
}
.wandao-page h2 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
}
.wandao-page h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}
.wandao-page p {
  margin: 8px 0;
}
.wandao-page-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}
.wandao-title-group {
  display: flex;
  align-items: center;
  gap: 14px;
}
.wandao-title-group p {
  margin: 5px 0 0;
}
.wandao-app-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border: 1px solid var(--wa-border);
  background: var(--wa-layer);
  border-radius: 14px;
  flex-shrink: 0;
}
.wandao-muted,
.wandao-local-label,
.wandao-footnote {
  color: var(--wa-muted);
  font-size: 13px;
}
.wandao-local-label {
  white-space: nowrap;
  padding: 5px 10px;
  border: 1px solid var(--wa-border);
  border-radius: 20px;
  font-size: 12px;
}
.wandao-local-label:before {
  content: "";
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #59a281;
  margin-right: 8px;
}
.wandao-platform-picker {
  display: flex;
  align-items: flex-end;
  gap: 18px;
  margin-bottom: 24px;
  padding: 18px 20px;
  border-radius: 12px;
  background: var(--wa-layer);
}
.wandao-platform-picker > .wandao-field {
  flex: 1;
  margin: 0;
  max-width: 480px;
}
.wandao-platform-count {
  margin-left: auto;
  align-self: flex-end;
  padding-bottom: 12px;
  color: var(--wa-muted);
  font-size: 12px;
  white-space: nowrap;
}
.wandao-filter {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 3px;
  border: 1px solid var(--wa-border);
  border-radius: 9px;
  height: 44px;
}
.wandao-filter button {
  appearance: none;
  border: 0;
  border-radius: 6px;
  padding: 7px 14px;
  background: transparent;
  color: var(--wa-muted);
  font: inherit;
  cursor: pointer;
}
.wandao-filter button[aria-pressed="true"] {
  background: var(--wa-bg);
  box-shadow: 0 1px 3px #0000000d;
  color: var(--wa-text);
  font-weight: 600;
}
.wandao-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  align-items: start;
  gap: 28px;
}
.wandao-form-panel,
.wandao-task-panel {
  min-width: 0;
}
.wandao-action-fields {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}
.wandao-form-panel {
  border: 1px solid var(--wa-border);
  border-radius: 14px;
  padding: 24px;
}
.wandao-panel-eyebrow {
  color: var(--wa-muted);
  font-size: 12px;
  margin-bottom: 8px;
}
.wandao-form-panel h2 {
  font-size: 18px;
  line-height: 1.5;
}
.wandao-task-panel {
  padding-top: 4px;
}
.wandao-task-panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--wa-border);
}
.wandao-task-panel-heading h2 {
  margin: 0;
}
.wandao-badge {
  display: inline-block;
  padding: 1px 7px;
  margin-left: 4px;
  border-radius: 5px;
  font-size: 11px;
  line-height: 1.7;
  font-weight: 500;
  vertical-align: middle;
  background: var(--wa-layer);
  color: var(--wa-muted);
}
.wandao-form-panel > p {
  margin-bottom: 22px;
}
.wandao-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 20px;
}
.wandao-field > span {
  font-weight: 500;
}
.wandao-required {
  color: var(--wa-muted);
}
.wandao-field input,
.wandao-field select {
  width: 100%;
  height: 44px;
  padding: 8px 11px;
  border: 1px solid var(--wa-border);
  border-radius: 8px;
  background: var(--wa-bg);
  color: var(--wa-text);
  font-size: 14px;
  line-height: 1.4;
  font-family: inherit;
  outline-offset: 3px;
}
.wandao-field-help {
  color: var(--wa-muted);
  font-size: 12px;
  font-weight: 400;
}
.wandao-action-hint {
  color: var(--wa-muted);
  font-size: 12px;
  margin-top: -10px !important;
}
.wandao-field-divider {
  border-top: 1px solid var(--wa-border);
  margin: 22px 0;
}
.wandao-field input::placeholder {
  color: var(--wa-muted);
  font-size: 13px;
}
.wandao-check {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 12px 0;
  font-size: 13px;
  cursor: pointer;
}
.wandao-check input {
  margin: 0;
  width: 16px;
  height: 16px;
  accent-color: var(--wa-accent);
  flex-shrink: 0;
}
.wandao-check span {
  overflow-wrap: anywhere;
}
.wandao-option {
  padding: 10px 12px;
  margin: 8px 0;
  background: var(--wa-layer);
  border-radius: 7px;
  min-height: 42px;
}
.wandao-button {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  border: 1px solid var(--wa-border);
  border-radius: 8px;
  padding: 7px 13px;
  background: var(--wa-bg);
  color: var(--wa-text);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
  font-family: inherit;
  cursor: pointer;
}
.wandao-button:hover:not(:disabled) {
  background: var(--wa-layer);
}
.wandao-button-primary {
  background: var(--dsw-alias-button-primary-fill, #4769e8);
  border-color: var(--dsw-alias-button-primary-fill, #4769e8);
  color: var(--dsw-alias-label-primary-foreground, #fff);
}
.wandao-button-primary:hover:not(:disabled) {
  background: var(--dsw-alias-button-primary-hover, #3e5ed5);
  border-color: var(--dsw-alias-button-primary-hover, #3e5ed5);
}
.wandao-button-quiet {
  border-color: transparent;
  color: var(--wa-muted);
}
.wandao-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.wandao-page button:focus-visible,
.wandao-page input:focus-visible,
.wandao-page select:focus-visible,
.wandao-page summary:focus-visible {
  outline: 2px solid
    var(
      --dsw-focus-ring-color,
      var(--dsw-alias-state-business-primary, #4769e8)
    );
  outline-offset: 3px;
}
.wandao-form-footer {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 10px;
  margin-top: 24px;
  border-top: 1px solid var(--wa-border);
  padding-top: 22px;
}
.wandao-form-footer .wandao-button {
  min-width: 148px;
  min-height: 44px;
}
.wandao-credentials,
.wandao-guide {
  border-top: 1px solid var(--wa-border);
  border-bottom: 1px solid var(--wa-border);
  padding: 12px 0;
  margin: 18px 0;
}
.wandao-credentials summary,
.wandao-guide summary,
.wandao-result summary {
  cursor: pointer;
  font-size: 13px;
  color: var(--wa-muted);
}
.wandao-credentials form {
  margin-top: 18px;
}
.wandao-guide {
  margin-top: 28px;
  border-bottom: 0;
}
.wandao-guide pre,
.wandao-result pre {
  font: 12px/1.7 var(--ds-font-family-code, monospace);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-height: 300px;
  overflow: auto;
  background: var(--wa-layer);
  padding: 14px;
  border-radius: 8px;
}
.wandao-task-list {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
}
.wandao-task-list > li {
  padding: 18px 0;
  border-bottom: 1px solid var(--wa-border);
  overflow-wrap: anywhere;
}
.wandao-task-heading {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}
.wandao-task-heading strong {
  font-size: 13px;
  font-weight: 500;
  overflow-wrap: anywhere;
}
.wandao-status {
  font-size: 12px;
  white-space: nowrap;
  color: var(--wa-muted);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.wandao-status::before {
  content: "";
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}
.wandao-status-completed::before {
  background: #59a281;
}
.wandao-status-failed::before,
.wandao-status-partial::before,
.wandao-status-paused::before {
  background: #cf8451;
}
.wandao-task-detail {
  font-size: 13px;
  overflow-wrap: anywhere;
}
.wandao-task-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}
.wandao-counts {
  font-size: 12px;
  color: var(--wa-muted);
}
.wandao-path {
  font-size: 12px;
  overflow-wrap: anywhere;
}
.wandao-result {
  margin-top: 10px;
}
.wandao-empty {
  padding: 28px 20px;
  margin-top: 18px;
  border: 1px dashed var(--wa-border);
  border-radius: 12px;
}
.wandao-empty-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-bottom: 18px;
  border-radius: 12px;
  background: var(--wa-layer);
  color: var(--wa-muted);
}
.wandao-empty p {
  margin: 5px 0;
}
.wandao-empty .wandao-muted {
  max-width: 220px;
  margin: 8px 0;
}
.wandao-quick-start {
  margin: 22px 0 0;
  padding-left: 19px;
  color: var(--wa-muted);
  font-size: 12px;
}
.wandao-quick-start li {
  padding: 5px 0 5px 4px;
}
.wandao-progress {
  height: 3px;
  overflow: hidden;
  border-radius: 4px;
  background: var(--wa-layer);
  margin: 12px 0;
}
.wandao-progress span {
  display: block;
  width: 35%;
  height: 100%;
  background: var(--wa-accent);
  animation: wandao-progress 1.5s ease-in-out infinite;
}
.wandao-error {
  color: var(--dsw-alias-error, #c86565);
  font-size: 13px;
  overflow-wrap: anywhere;
}
.wandao-footnote {
  border-top: 1px solid var(--wa-border);
  padding-top: 20px;
  margin-top: 32px !important;
  font-size: 12px;
}
.wandao-documents {
  margin: 22px 0;
  padding: 16px 0;
  border-block: 1px solid var(--wa-border);
}
.wandao-document-search {
  margin: 14px 0 4px;
}
.wandao-selection-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.wandao-selection-tools .wandao-button {
  padding-inline: 8px;
}
.wandao-no-results {
  padding: 16px 0;
  text-align: center;
  color: var(--wa-muted);
}
.wandao-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.wandao-documents-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.wandao-documents ul {
  list-style: none;
  padding: 0;
  max-height: 240px;
  overflow: auto;
}
.wandao-documents li {
  border-top: 1px solid var(--wa-border);
}
.wandao-documents li .wandao-check {
  margin: 0;
  padding-block: 11px;
  min-height: 44px;
}
.wandao-confirm {
  width: min(520px, calc(100vw - 32px));
  padding: 26px;
  border: 1px solid var(--wa-border);
  border-radius: 14px;
  background: var(--wa-bg);
  color: var(--wa-text);
  font-size: 14px;
  font-family: inherit;
  line-height: 1.6;
  max-height: 80vh;
  overflow: auto;
}
.wandao-confirm::backdrop {
  background: #0008;
}
.wandao-confirm dl {
  font-size: 13px;
}
.wandao-confirm dt {
  color: var(--wa-muted);
}
.wandao-confirm dd {
  margin: 2px 0 12px;
  overflow-wrap: anywhere;
}
@keyframes wandao-progress {
  0% {
    transform: translateX(-110%);
  }
  100% {
    transform: translateX(390%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .wandao-progress span {
    animation: none;
    width: 100%;
    opacity: 0.4;
  }
}
@media (max-width: 900px) {
  .wandao-workspace {
    grid-template-columns: minmax(0, 1fr);
    gap: 30px;
  }
  .wandao-task-panel {
    padding: 0;
  }
  .wandao-empty {
    padding: 28px 10px;
  }
  .wandao-platform-picker {
    flex-wrap: wrap;
    gap: 14px;
  }
  .wandao-platform-picker > .wandao-field {
    min-width: 220px;
    max-width: none;
  }
  .wandao-platform-count {
    display: none;
  }
}
@media (max-width: 480px) {
  .wandao-platform-picker {
    display: block;
  }
  .wandao-filter {
    width: max-content;
    margin-bottom: 18px;
  }
  .wandao-content {
    padding-inline: 16px;
  }
  .wandao-local-label {
    display: none;
  }
  .wandao-app-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
  }
  .wandao-title-group {
    gap: 10px;
  }
  .wandao-form-panel {
    padding: 18px;
  }
  .wandao-platform-picker {
    padding: 16px;
  }
  .wandao-platform-picker > .wandao-field {
    min-width: 0;
  }
  .wandao-button {
    min-height: 44px;
  }
  .wandao-form-footer .wandao-button {
    width: 100%;
  }
}
`;var u=require("react/jsx-runtime");function ua({api:r}){let[o,t]=(0,S.useState)(),[n,a]=(0,S.useState)(""),[d,c]=(0,S.useState)(""),[g,e]=(0,S.useState)(0),[i,b]=(0,S.useState)("all"),{tasks:h,error:F}=la(r);(0,S.useEffect)(()=>{let m=new AbortController;return c(""),r.catalogue(m.signal).then(k=>{m.signal.aborted||(t(k),a(A=>A||k.providers.find(j=>j.id==="obsidian-export")?.id||k.providers[0]?.id||""))}).catch(k=>{m.signal.aborted||c(k instanceof Error?k.message:"\u5E73\u53F0\u52A0\u8F7D\u5931\u8D25")}),()=>m.abort()},[r,g]);let M=o?.providers.filter(m=>i==="all"||(i==="import"?m.id.includes("import"):!m.id.includes("import")))??[];return(0,u.jsxs)("main",{className:"wandao-page",children:[(0,u.jsx)("style",{children:ca}),(0,u.jsxs)("div",{className:"wandao-content",children:[(0,u.jsxs)("header",{className:"wandao-page-heading",children:[(0,u.jsxs)("div",{className:"wandao-title-group",children:[(0,u.jsx)("span",{className:"wandao-app-icon","aria-hidden":"true",children:(0,u.jsx)("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round",children:(0,u.jsx)("path",{d:"M4 7V4h16v3M4 13v7h16v-7M12 7v9m-4-4 4 4 4-4"})})}),(0,u.jsxs)("div",{children:[(0,u.jsx)("h1",{children:"\u4E07\u80FD\u5BFC"}),(0,u.jsx)("p",{className:"wandao-muted",children:"\u5BFC\u51FA\u3001\u5907\u4EFD\u548C\u8FC1\u79FB\u4F60\u7684\u77E5\u8BC6\u5E93"})]})]}),(0,u.jsx)("span",{className:"wandao-local-label",children:"\u672C\u673A\u8FD0\u884C"})]}),d?(0,u.jsxs)("div",{role:"alert",className:"wandao-error",children:[d," ",(0,u.jsx)("button",{className:"wandao-button",onClick:()=>e(m=>m+1),children:"\u91CD\u8BD5\u8FDE\u63A5"})]}):null,!o&&!d?(0,u.jsx)("p",{role:"status",children:"\u6B63\u5728\u52A0\u8F7D\u8FC1\u79FB\u5E73\u53F0\u2026"}):null,o?(0,u.jsxs)(u.Fragment,{children:[(0,u.jsxs)("section",{className:"wandao-platform-picker","aria-label":"\u5E73\u53F0\u4E0E\u8FC1\u79FB\u65B9\u5411",children:[(0,u.jsx)("div",{className:"wandao-filter",role:"group","aria-label":"\u8FC1\u79FB\u65B9\u5411",children:[["all","\u5168\u90E8"],["export","\u5BFC\u51FA"],["import","\u5BFC\u5165"]].map(([m,k])=>(0,u.jsx)("button",{"aria-pressed":i===m,onClick:()=>{b(m);let A=o.providers.find(j=>m==="all"||(m==="import"?j.id.includes("import"):!j.id.includes("import")));m!=="all"&&m==="import"!==n.includes("import")&&a(A?.id??"")},children:k},m))}),(0,u.jsxs)("label",{className:"wandao-field",children:[(0,u.jsx)("span",{children:"\u9009\u62E9\u5E73\u53F0"}),(0,u.jsx)("select",{"aria-label":"\u9009\u62E9\u5E73\u53F0",value:n,onChange:m=>a(m.target.value),children:M.map(m=>(0,u.jsxs)("option",{value:m.id,children:[m.title,m.supported?"":"\uFF08\u5F53\u524D\u7CFB\u7EDF\u4E0D\u652F\u6301\uFF09"]},m.id))})]}),(0,u.jsxs)("span",{className:"wandao-platform-count",children:[M.length," \u4E2A\u8FC1\u79FB\u65B9\u6848"]})]}),(0,u.jsxs)("div",{className:"wandao-workspace",children:[(0,u.jsx)(da,{api:r,catalogue:o,providerId:n,tasks:h},n),(0,u.jsx)(pa,{api:r,tasks:h,error:F})]}),(0,u.jsx)("p",{className:"wandao-footnote",children:"\u6765\u6E90\u76EE\u5F55\u548C\u5BFC\u51FA\u76EE\u5F55\u5747\u4F4D\u4E8E DSH \u5BBF\u4E3B\u673A\u3002\u7F51\u9875\u767B\u5F55\u9700\u8981\u672C\u673A\u6D4F\u89C8\u5668\uFF1B\u53D6\u6D88\u4EFB\u52A1\u540E\uFF0C\u72EC\u7ACB\u6D4F\u89C8\u5668\u7A97\u53E3\u53EF\u80FD\u9700\u8981\u624B\u52A8\u5173\u95ED\u3002"})]}):null]})]})}var q=require("react/jsx-runtime"),Na="wandao-page",Ca=["slots","connection"],J="wandao";function ma({size:r=20}){return(0,q.jsxs)("svg",{width:r,height:r,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",children:[(0,q.jsx)("path",{d:"M5 3h9l5 5v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"}),(0,q.jsx)("path",{d:"M14 3v5h5M8 12h7m-3-3 3 3-3 3M8 17h7"})]})}function Aa(r){async function o(n,a={},d){let c=await r.connection.rpc.call("/api",`wandao/${n}`,a,d);if(!c.ok)throw new Error(c.error.message);return c.value}let t={catalogue:n=>o("catalogue",{},n),describe:(n,a)=>o("describe",{providerId:n},a),start:n=>o("start",n),tasks:n=>o("tasks",{},n),cancel:n=>o("cancel",{jobId:n}),loginDone:n=>o("loginDone",{jobId:n}),saveCredentials:(n,a)=>o("saveCredentials",{providerId:n,fields:a})};r.slots.inject("main",()=>r.slots.register({name:"main",key:J,inject:()=>({api:t})},ua)),r.slots.inject("sidebar.panellist",()=>r.slots.register({name:"sidebar.panellist",id:J,order:30,label:"\u4E07\u80FD\u5BFC"},ma))}

return module.exports;}});
