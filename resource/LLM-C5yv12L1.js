import"./rolldown-runtime-COiEfhsA.js";import{$n as e,$r as t,An as n,Bn as r,Bt as i,Cn as a,Dn as o,Dr as s,En as c,Et as l,Gr as u,Ir as d,Jt as f,Lr as p,Nn as m,Nt as h,Or as g,Pn as _,Qn as v,Qr as y,Rn as b,Sr as ee,Tn as x,Vn as S,Vr as te,Wn as ne,Xn as C,Xr as w,Zn as T,_n as E,_r as re,a as ie,c as ae,dr as D,ei as O,en as oe,er as k,fr as se,ht as A,jn as j,ln as ce,lr as M,nn as le,nr as N,o as P,on as ue,pn as de,qn as fe,rn as F,sn as pe,sr as me,t as he,tr as ge,un as _e,ur as ve,vt as ye,wn as I,wr as be,wt as L,xr as xe,xt as Se,y as Ce,yr as R,zn as we,zr as z,zt as Te}from"./css-BDCDcwVg.js";import{i as Ee,n as De,t as Oe}from"./css-C-TGl2gY.js";import{b as ke,n as B}from"./_arrayPush-CS18qtiM.js";import{t as V}from"./toInteger-BqAmG1cC.js";import{r as H,t as Ae}from"./_baseIteratee-CKfuzqiv.js";import{n as je,t as Me}from"./vnode-Df9Y5K8C.js";import{a as Ne,n as Pe,r as Fe,t as Ie}from"./css-D3_ykRHm.js";import{t as Le}from"./css-XvrsfRDB.js";import{D as Re,M as ze,O as Be,m as Ve}from"./HistoryList-l-OKA80n.js";import{a as He,c as U,f as Ue,t as We}from"./css-CpKYO8Qe.js";import{i as Ge,n as Ke,r as qe,s as Je,t as Ye}from"./use-form-item-BatuAkp9.js";import{t as W}from"./typescript-DOc6skV4.js";import{C as G,H as Xe,W as K,a as Ze,c as Qe,i as $e,v as et,w as q,y as J}from"./index-30DuSK13.js";import{c as tt,i as nt,l as rt,o as Y,s as it,u as at}from"./DocPage-Cx1JRKb2.js";function X(){if(!arguments.length)return[];var e=arguments[0];return ke(e)?e:[e]}var ot=Math.max,st=Math.min;function ct(e,t,n){var r=e==null?0:e.length;if(!r)return-1;var i=r-1;return n!==void 0&&(i=V(n),i=n<0?ot(r+i,0):st(i,r-1)),H(e,Ae(t,3),i,!0)}function lt(){let e=xe(),t=R(0),n=a(()=>({minWidth:`${Math.max(t.value,11)}px`}));return J(e,()=>{t.value=e.value?.getBoundingClientRect().width??0}),{calculatorRef:e,calculatorWidth:t,inputStyle:n}}var ut=Symbol(`ElSelectGroup`),Z=Symbol(`ElSelect`),dt={label:`label`,value:`value`,disabled:`disabled`,options:`options`};function ft(e){let t=R({...dt,...e.props}),n={...e.props};return M(()=>e.props,e=>{G(e,n)||(t.value={...dt,...e},n={...e})},{deep:!0}),{aliasProps:t,getLabel:e=>B(e,t.value.label),getValue:e=>B(e,t.value.value),getDisabled:e=>B(e,t.value.disabled),getOptions:e=>B(e,t.value.options)}}var pt=le({name:String,id:String,modelValue:{type:F([Array,String,Number,Boolean,Object]),default:void 0},autocomplete:{type:String,default:`off`},automaticDropdown:Boolean,size:Se,effect:{type:F(String),default:`light`},disabled:{type:Boolean,default:void 0},clearable:Boolean,filterable:Boolean,allowCreate:Boolean,loading:Boolean,popperClass:{type:F([String,Array,Object,Boolean]),default:``},popperStyle:{type:F([String,Array,Object,Boolean]),default:void 0},popperOptions:{type:F(Object),default:()=>({})},remote:Boolean,debounce:{type:Number,default:300},loadingText:String,noMatchText:String,noDataText:String,remoteMethod:{type:F(Function)},filterMethod:{type:F(Function)},multiple:Boolean,multipleLimit:{type:Number,default:0},placeholder:{type:String},defaultFirstOption:Boolean,reserveKeyword:{type:Boolean,default:!0},valueKey:{type:String,default:`value`},collapseTags:Boolean,collapseTagsTooltip:Boolean,tagTooltip:{type:F(Object),default:()=>({})},maxCollapseTags:{type:Number,default:1},teleported:He.teleported,persistent:{type:Boolean,default:!0},clearIcon:{type:P,default:Ce},fitInputWidth:Boolean,suffixIcon:{type:P,default:ae},tagType:{...Be.type,default:`info`},tagEffect:{...Be.effect,default:`light`},validateEvent:{type:Boolean,default:!0},remoteShowSuffix:Boolean,showArrow:{type:Boolean,default:!0},offset:{type:Number,default:12},placement:{type:F(String),values:Ue,default:`bottom-start`},fallbackPlacements:{type:F(Array),default:[`bottom-start`,`top-start`,`right`,`left`]},tabindex:{type:[String,Number],default:0},appendTo:He.appendTo,options:{type:F(Array)},props:{type:F(Object),default:()=>dt},...Ze,...Oe([`ariaLabel`])}),mt={[Ee]:e=>!0,[De]:e=>!0,"popup-scroll":rt.scroll,"end-reached":rt[`end-reached`],"remove-tag":e=>!0,"visible-change":e=>!0,focus:e=>e instanceof FocusEvent,blur:e=>e instanceof FocusEvent,clear:()=>!0},Q=`ElOption`,ht=le({value:{type:[String,Number,Boolean,Object],required:!0},label:{type:[String,Number]},created:Boolean,disabled:Boolean});function gt(e,t){let n=b(Z);n||oe(Q,`usage: <el-select><el-option /></el-select/>`);let r=b(ut,{disabled:!1}),i=a(()=>d(X(n.props.modelValue),e.value)),o=a(()=>{if(n.props.multiple){let e=X(n.props.modelValue??[]);return!i.value&&e.length>=n.props.multipleLimit&&n.props.multipleLimit>0}return!1}),s=a(()=>e.label??(z(e.value)?``:e.value)),c=a(()=>e.value||e.label||``),l=a(()=>e.disabled||t.groupDisabled||o.value),u=_(),d=(t=[],r)=>{if(z(e.value)){let e=n.props.valueKey;return t&&t.some(t=>ee(B(t,e))===B(r,e))}return t&&t.includes(r)};return M(()=>s.value,()=>{!e.created&&!n.props.remote&&n.setSelected()}),M(()=>e.value,(t,r)=>{let{remote:i,valueKey:a}=n.props;if((i?t!==r:!G(t,r))&&(n.onOptionDestroy(r,u.proxy),n.onOptionCreate(u.proxy)),!e.created&&!i){if(a&&z(t)&&z(r)&&t[a]===r[a])return;n.setSelected()}}),M(()=>r.disabled,()=>{t.groupDisabled=r.disabled},{immediate:!0}),{select:n,currentLabel:s,currentValue:c,itemSelected:i,isDisabled:l,hoverItem:()=>{l.value||(n.states.hoveringIndex=n.optionsArray.indexOf(u.proxy))},updateOption:n=>{t.visible=new RegExp(at(n),`i`).test(String(s.value))||e.created}}}var _t=m({name:Q,componentName:Q,props:ht,setup(e){let t=L(`select`),n=Je(),r=a(()=>[t.be(`dropdown`,`item`),t.is(`disabled`,s(d)),t.is(`selected`,s(u)),t.is(`hovering`,s(v))]),o=re({index:-1,groupDisabled:!1,visible:!0,hover:!1}),c=i?null:`mousemove`,{currentLabel:l,itemSelected:u,isDisabled:d,select:f,hoverItem:p,updateOption:m}=gt(e,o),{visible:g,hover:v}=be(o),y=_().proxy;f.onOptionCreate(y),ne(()=>{let e=y.value;S(()=>{let{selected:t}=f.states,n=t.some(e=>e.value===y.value);f.states.cachedOptions.get(e)===y&&!n&&f.states.cachedOptions.delete(e)}),f.onOptionDestroy(e,y)});function b(){d.value||f.handleOptionSelect(y)}return{ns:t,id:n,containerKls:r,currentLabel:l,itemSelected:u,isDisabled:d,select:f,visible:g,hover:v,states:o,mouseMoveEventName:c,hoverItem:p,handleMousedown:e=>{let t=e.target,n=e.currentTarget;for(;t&&t!==n;){if(h(t))return;t=t.parentElement}e.preventDefault()},updateOption:m,selectOptionClick:b}}}),vt=[`id`,`aria-disabled`,`aria-selected`];function yt(n,i,a,s,c,l){return se((C(),o(`li`,r({id:n.id,class:n.containerKls,role:`option`,"aria-disabled":n.isDisabled||void 0,"aria-selected":n.itemSelected},{[O(n.mouseMoveEventName)]:i[0]||=(...e)=>n.hoverItem&&n.hoverItem(...e)},{onMousedown:i[1]||=(...e)=>n.handleMousedown&&n.handleMousedown(...e),onClick:i[2]||=K((...e)=>n.selectOptionClick&&n.selectOptionClick(...e),[`stop`])}),[e(n.$slots,`default`,{},()=>[I(`span`,null,t(n.currentLabel),1)])],16,vt)),[[Xe,n.visible]])}var bt=U(_t,[[`render`,yt]]),xt=m({name:`ElOptionGroup`,componentName:`ElOptionGroup`,props:{label:String,disabled:Boolean},setup(e){let t=L(`select`),n=R(),r=_(),i=R([]);T(ut,re({...be(e)}));let o=a(()=>i.value.some(e=>e.visible===!0)),s=e=>e.type.name===`ElOption`&&!!e.component?.proxy,c=e=>{let t=X(e),n=[];return t.forEach(e=>{we(e)&&(s(e)?n.push(e.component.proxy):d(e.children)&&e.children.length?n.push(...c(e.children)):e.component?.subTree&&n.push(...c(e.component.subTree)))}),n},l=()=>{i.value=c(r.subTree)};return fe(()=>{l()}),et(n,l,{attributes:!0,subtree:!0,childList:!0}),{groupRef:n,visible:o,ns:t}}});function St(n,r,i,a,s,c){return se((C(),o(`ul`,{ref:`groupRef`,class:w(n.ns.be(`group`,`wrap`))},[I(`li`,{class:w(n.ns.be(`group`,`title`))},t(n.label),3),I(`li`,null,[I(`ul`,{class:w(n.ns.b(`group`))},[e(n.$slots,`default`)],2)])],2)),[[Xe,n.visible]])}var Ct=U(xt,[[`render`,St]]),wt=m({name:`ElSelectDropdown`,componentName:`ElSelectDropdown`,setup(){let e=b(Z),t=L(`select`),n=a(()=>e.props.popperClass),r=a(()=>e.props.multiple),i=a(()=>e.props.fitInputWidth),o=R(``);function s(){let t=e.selectRef?.offsetWidth;t?o.value=`${t-2}px`:o.value=``}return fe(()=>{s(),J(e.selectRef,()=>{Ne(s)})}),{ns:t,minWidth:o,popperClass:n,isMultiple:r,isFitInputWidth:i}}});function Tt(t,n,r,i,a,s){return C(),o(`div`,{class:w([t.ns.b(`dropdown`),t.ns.is(`multiple`,t.isMultiple),t.popperClass]),style:y({[t.isFitInputWidth?`width`:`minWidth`]:t.minWidth})},[t.$slots.header?(C(),o(`div`,{key:0,class:w(t.ns.be(`dropdown`,`header`))},[e(t.$slots,`header`)],2)):c(`v-if`,!0),e(t.$slots,`default`),t.$slots.footer?(C(),o(`div`,{key:1,class:w(t.ns.be(`dropdown`,`footer`))},[e(t.$slots,`footer`)],2)):c(`v-if`,!0)],6)}var Et=U(wt,[[`render`,Tt]]),Dt=(e,t)=>{let{t:n}=l(),r=me(),o=Je(),s=L(`select`),c=L(`input`),u=re({inputValue:``,options:new Map,cachedOptions:new Map,optionValues:[],selected:[],collapseItemWidth:0,selectedLabel:``,hoveringIndex:-1,previousQuery:null,inputHovering:!1,menuVisibleOnFocus:!1,isBeforeHide:!1}),m=R(),h=R(),_=R(),v=R(),y=R(),b=R(),ee=R(),x=R(),ne=R(),C=R(),w=R(),T=R(!1),E=R(),ae=R(!1),{form:D,formItem:O}=Ye(),{inputId:oe}=Ke(e,{formItemContext:O}),{valueOnClear:k,isEmptyValue:se}=$e(e),{isComposing:A,handleCompositionStart:j,handleCompositionUpdate:le,handleCompositionEnd:N}=Pe({afterComposition:e=>nt(e)}),P=qe(),{wrapperRef:de,isFocused:F,handleBlur:he}=Fe(y,{disabled:P,afterFocus(){e.automaticDropdown&&!T.value&&(T.value=!0,u.menuVisibleOnFocus=!0)},beforeBlur(e){return _.value?.isFocusInsideContent(e)||v.value?.isFocusInsideContent(e)},afterBlur(){T.value=!1,u.menuVisibleOnFocus=!1,e.validateEvent&&O?.validate?.(`blur`).catch(g)}}),ge=a(()=>d(e.modelValue)?e.modelValue.length>0:!se(e.modelValue)),ye=a(()=>D?.statusIcon??!1),I=a(()=>e.clearable&&!P.value&&ge.value&&(F.value||u.inputHovering)),be=a(()=>e.remote&&e.filterable&&!e.remoteShowSuffix?``:e.suffixIcon),xe=a(()=>s.is(`reverse`,!!(be.value&&T.value))),Se=a(()=>O?.validateState||``),Ce=a(()=>Se.value&&ie[Se.value]),we=a(()=>e.remote?e.debounce:0),Oe=a(()=>e.remote&&!u.inputValue&&u.options.size===0),ke=a(()=>e.loading?e.loadingText||n(`el.select.loading`):e.filterable&&u.inputValue&&u.options.size>0&&V.value===0?e.noMatchText||n(`el.select.noMatch`):u.options.size===0?e.noDataText||n(`el.select.noData`):null),V=a(()=>H.value.filter(e=>e.visible).length),H=a(()=>{let e=Array.from(u.options.values()),t=[];return u.optionValues.forEach(n=>{let r=e.findIndex(e=>e.value===n);r>-1&&t.push(e[r])}),t.length>=e.length?t:e}),Ae=a(()=>Array.from(u.cachedOptions.values())),Me=a(()=>{let t=H.value.filter(e=>!e.created).some(e=>e.currentLabel===u.inputValue);return e.filterable&&e.allowCreate&&u.inputValue!==``&&!t}),Ne=()=>{e.filterable&&p(e.filterMethod)||e.filterable&&e.remote&&p(e.remoteMethod)||H.value.forEach(e=>{e.updateOption?.(u.inputValue)})},Ie=Ge(),Le=a(()=>[`small`].includes(Ie.value)?`small`:`default`),Re=a({get(){return T.value&&(e.loading||!Oe.value||e.remote&&!!r.empty)&&(!ae.value||!ue(u.previousQuery)||u.options.size>0)},set(e){T.value=e}}),Be=a(()=>{if(e.multiple&&!ce(e.modelValue))return X(e.modelValue).length===0&&!u.inputValue;let t=d(e.modelValue)?e.modelValue[0]:e.modelValue;return e.filterable||ce(t)?!u.inputValue:!0}),Ve=a(()=>{let t=e.placeholder??n(`el.select.placeholder`);return e.multiple||!ge.value?t:u.selectedLabel}),He=i?null:`mouseenter`;M(()=>e.modelValue,(t,n)=>{e.multiple&&e.filterable&&!e.reserveKeyword&&(u.inputValue=``,U(``)),We(),!G(t,n)&&e.validateEvent&&O?.validate(`change`).catch(g)},{flush:`post`,deep:!0}),M(()=>T.value,e=>{e?U(u.inputValue):(u.inputValue=``,u.previousQuery=null,u.isBeforeHide=!0,u.menuVisibleOnFocus=!1)}),M(()=>u.options.entries(),()=>{Te&&(We(),e.defaultFirstOption&&(e.filterable||e.remote)&&V.value&&Ue())},{flush:`post`}),M([()=>u.hoveringIndex,H],([e])=>{pe(e)&&e>-1?E.value=H.value[e]||{}:E.value={},H.value.forEach(e=>{e.hover=E.value===e})}),ve(()=>{u.isBeforeHide||Ne()});let U=t=>{u.previousQuery===t||A.value||(u.previousQuery=t,e.filterable&&p(e.filterMethod)?e.filterMethod(t):e.filterable&&e.remote&&p(e.remoteMethod)&&e.remoteMethod(t),e.defaultFirstOption&&(e.filterable||e.remote)&&V.value?S(Ue):S(Xe))},Ue=()=>{let e=H.value.filter(e=>e.visible&&!e.disabled&&!e.states.groupDisabled),t=e.find(e=>e.created),n=e[0],r=H.value.map(e=>e.value);u.hoveringIndex=ut(r,t||n)},We=()=>{if(e.multiple)u.selectedLabel=``;else{let t=d(e.modelValue)?e.modelValue[0]:e.modelValue,n=W(t);u.selectedLabel=n.currentLabel,u.selected=[n];return}let t=[];ce(e.modelValue)||X(e.modelValue).forEach(e=>{t.push(W(e))}),u.selected=t},W=t=>{let n,r=te(t);for(let i=u.cachedOptions.size-1;i>=0;i--){let a=Ae.value[i];if(r?B(a.value,e.valueKey)===B(t,e.valueKey):a.value===t){n={index:H.value.filter(e=>!e.created).indexOf(a),value:t,currentLabel:a.currentLabel,get isDisabled(){return a.isDisabled}};break}}if(n)return n;let i=u.selected.find(n=>r?B(n.value,e.valueKey)===B(t,e.valueKey):n.value===t);return{index:-1,value:t,currentLabel:r?t.label:i?i.currentLabel:t??``}},Xe=()=>{let e=u.selected.length;if(e>0){let t=u.selected[e-1];u.hoveringIndex=H.value.findIndex(e=>xt(t)===xt(e))}else u.hoveringIndex=-1},K=()=>{u.collapseItemWidth=C.value.getBoundingClientRect().width},Ze=()=>{_.value?.updatePopper?.()},et=()=>{v.value?.updatePopper?.()},tt=()=>{u.inputValue.length>0&&!T.value&&(T.value=!0),U(u.inputValue)},nt=t=>{if(u.inputValue=t.target.value,e.remote)ae.value=!0,rt();else return tt()},rt=f(()=>{tt(),ae.value=!1},we),Y=n=>{G(e.modelValue,n)||t(De,n)},it=e=>ct(e,e=>{let t=u.cachedOptions.get(e);return!t?.disabled&&!t?.states.groupDisabled}),at=n=>{let r=Qe(n);if(e.multiple&&r!==q.delete&&n.target.value.length<=0){let n=X(e.modelValue).slice(),r=it(n);if(r<0)return;let i=n[r];n.splice(r,1),t(Ee,n),Y(n),t(`remove-tag`,i)}},ot=(n,r)=>{let i=u.selected.indexOf(r);if(i>-1&&!P.value){let n=X(e.modelValue).slice();n.splice(i,1),t(Ee,n),Y(n),t(`remove-tag`,r.value)}n.stopPropagation(),Q()},st=n=>{n.stopPropagation();let r=e.multiple?[]:k.value;if(e.multiple)for(let e of u.selected)e.isDisabled&&r.push(e.value);t(Ee,r),Y(r),u.hoveringIndex=-1,T.value=!1,t(`clear`),Q()},lt=n=>{if(e.multiple){let r=X(e.modelValue??[]).slice(),i=ut(r,n);i>-1?r.splice(i,1):(e.multipleLimit<=0||r.length<e.multipleLimit)&&r.push(n.value),t(Ee,r),Y(r),n.created&&U(``),e.filterable&&(n.created||!e.reserveKeyword)&&(u.inputValue=``)}else!G(e.modelValue,n.value)&&t(`update:modelValue`,n.value),Y(n.value),T.value=!1;Q(),!T.value&&S(()=>{Z(n)})},ut=(t,n)=>ce(n)?-1:z(n.value)?t.findIndex(t=>G(B(t,e.valueKey),xt(n))):t.indexOf(n.value),Z=e=>{let t=d(e)?e[e.length-1]:e,n=null;if(!_e(t?.value)){let e=H.value.filter(e=>e.value===t.value);e.length>0&&(n=e[0].$el)}if(_.value&&n){let e=_.value?.popperRef?.contentRef?.querySelector?.(`.${s.be(`dropdown`,`wrap`)}`);e&&ze(e,n)}w.value?.handleScroll()},dt=e=>{u.options.set(e.value,e),u.cachedOptions.set(e.value,e)},ft=(e,t)=>{u.options.get(e)===t&&u.options.delete(e)},pt=a(()=>_.value?.popperRef?.contentRef),mt=()=>{u.isBeforeHide=!1,S(()=>{w.value?.update(),Z(u.selected)})},Q=()=>{y.value?.focus()},ht=()=>{T.value?(T.value=!1,S(()=>y.value?.blur())):y.value?.blur()},gt=e=>{st(e)},_t=e=>{if(T.value=!1,F.value){let t=new FocusEvent(`blur`,e);S(()=>he(t))}},vt=()=>{u.inputValue.length>0?u.inputValue=``:T.value=!1},yt=t=>{P.value||e.filterable&&T.value&&t&&!ee.value?.contains(t.target)||(i&&(u.inputHovering=!0),u.menuVisibleOnFocus?u.menuVisibleOnFocus=!1:T.value=!T.value)},bt=()=>{if(!T.value)yt();else{let e=H.value[u.hoveringIndex];e&&!e.isDisabled&&lt(e)}},xt=t=>z(t.value)?B(t.value,e.valueKey):t.value,St=a(()=>H.value.filter(e=>e.visible).every(e=>e.isDisabled)),Ct=a(()=>e.multiple?e.collapseTags?u.selected.slice(0,e.maxCollapseTags):u.selected:[]),wt=a(()=>e.multiple&&e.collapseTags?u.selected.slice(e.maxCollapseTags):[]),Tt=e=>{if(!T.value)T.value=!0;else if(!(u.options.size===0||V.value===0||A.value)&&!St.value){e===`next`?(u.hoveringIndex++,u.hoveringIndex===u.options.size&&(u.hoveringIndex=0)):e===`prev`&&(u.hoveringIndex--,u.hoveringIndex<0&&(u.hoveringIndex=u.options.size-1));let t=H.value[u.hoveringIndex];(t.isDisabled||!t.visible)&&Tt(e),S(()=>Z(E.value))}},Et=(e,t,n,r)=>{for(let i=t;i>=0&&i<r;i+=n){let t=e[i];if(!t?.isDisabled&&t?.visible)return i}return null},Dt=(e,t)=>{let n=u.options.size;if(n===0)return;let r=je(e,0,n-1),i=H.value,a=t===`up`?-1:1,o=Et(i,r,a,n)??Et(i,r-a,-a,n);o!=null&&(u.hoveringIndex=o,S(()=>Z(E.value)))},Ot=e=>{let t=Qe(e),n=!0;switch(t){case q.up:Tt(`prev`);break;case q.down:Tt(`next`);break;case q.enter:case q.numpadEnter:A.value||bt();break;case q.esc:vt();break;case q.backspace:n=!1,at(e);return;case q.home:if(!T.value)return;Dt(0,`down`);break;case q.end:if(!T.value)return;Dt(u.options.size-1,`up`);break;case q.pageUp:if(!T.value)return;Dt(u.hoveringIndex-10,`up`);break;case q.pageDown:if(!T.value)return;Dt(u.hoveringIndex+10,`down`);break;default:n=!1}n&&(e.preventDefault(),e.stopPropagation())},kt=()=>{if(!h.value)return 0;let e=window.getComputedStyle(h.value);return Number.parseFloat(e.gap||`6px`)},$=a(()=>{let t=kt();return{maxWidth:`calc(100% - ${(e.filterable&&!P.value?t+11:0)+(C.value&&e.maxCollapseTags===1?u.collapseItemWidth+t:0)}px)`}}),At=e=>{t(`popup-scroll`,e)},jt=e=>{t(`end-reached`,e)};J(de,Ze),J(ne,et),J(C,K);let Mt;return M(()=>Re.value,e=>{e?Mt=J(x,Ze).stop:(Mt?.(),Mt=void 0),t(`visible-change`,e)}),fe(()=>{We()}),{inputId:oe,contentId:o,nsSelect:s,nsInput:c,states:u,isFocused:F,expanded:T,optionsArray:H,hoverOption:E,selectSize:Ie,filteredOptionsCount:V,updateTooltip:Ze,updateTagTooltip:et,debouncedOnInputChange:rt,onInput:nt,deletePrevTag:at,deleteTag:ot,deleteSelected:st,handleOptionSelect:lt,scrollToOption:Z,hasModelValue:ge,shouldShowPlaceholder:Be,currentPlaceholder:Ve,mouseEnterEventName:He,needStatusIcon:ye,showClearBtn:I,iconComponent:be,iconReverse:xe,validateState:Se,validateIcon:Ce,showNewOption:Me,updateOptions:Ne,collapseTagSize:Le,setSelected:We,selectDisabled:P,emptyText:ke,handleCompositionStart:j,handleCompositionUpdate:le,handleCompositionEnd:N,handleKeydown:Ot,onOptionCreate:dt,onOptionDestroy:ft,handleMenuEnter:mt,focus:Q,blur:ht,handleClearClick:gt,handleClickOutside:_t,handleEsc:vt,toggleMenu:yt,selectOption:bt,getValueKey:xt,navigateOptions:Tt,dropdownMenuVisible:Re,showTagList:Ct,collapseTagList:wt,popupScroll:At,getOption:W,endReached:jt,tagStyle:$,popperRef:pt,inputRef:y,tooltipRef:_,tagTooltipRef:v,prefixRef:b,suffixRef:ee,selectRef:m,wrapperRef:de,selectionRef:h,scrollbarRef:w,menuRef:x,tagMenuRef:ne,collapseItemRef:C}},Ot=m({name:`ElOptions`,setup(e,{slots:t}){let n=b(Z),r=[];return()=>{let e=t.default?.(),i=[];function a(e){d(e)&&e.forEach(e=>{let t=(e?.type||{})?.name;t===`ElOptionGroup`?a(!u(e.children)&&!d(e.children)&&p(e.children?.default)?e.children?.default():e.children):t===`ElOption`?i.push(e.props?.value):d(e.children)&&a(e.children)})}return e.length&&a(e[0]?.children),G(i,r)||(r=i,n&&(n.states.optionValues=i)),e}}}),kt=`ElSelect`,$=new WeakMap,At=e=>(...t)=>{let n=t[0];if(!n||n.includes(`Slot "default" invoked outside of the render function`)&&t[2]?.includes(`ElTreeSelect`))return;let r=$.get(e)?.originalWarnHandler;r?r(...t):console.warn(...t)},jt=e=>{let t=$.get(e);return t||(t={originalWarnHandler:e.config.warnHandler,handler:At(e),count:0},$.set(e,t)),t},Mt=m({name:kt,componentName:kt,components:{ElSelectMenu:Et,ElOption:bt,ElOptions:Ot,ElOptionGroup:Ct,ElTag:Re,ElScrollbar:tt,ElTooltip:We,ElIcon:he},directives:{ClickOutside:it},props:pt,emits:mt,setup(e,{emit:t,slots:n}){let r=_(),i=jt(r.appContext);i.count+=1,r.appContext.config.warnHandler=i.handler;let o=a(()=>{let{modelValue:t,multiple:n}=e,r=n?[]:void 0;return d(t)?n?t:r:n?r:t}),s=re({...be(e),modelValue:o}),c=Dt(s,t),{calculatorRef:l,inputStyle:u}=lt(),{getLabel:f,getValue:p,getOptions:m,getDisabled:h}=ft(e),g=e=>({label:f(e),value:p(e),disabled:h(e)}),v=e=>e.reduce((e,t)=>(e.push(t),t.children&&t.children.length>0&&e.push(...v(t.children)),e),[]),y=e=>{Me(e||[]).forEach(e=>{if(z(e)&&(e.type.name===`ElOption`||e.type.name===`ElTree`)){let t=e.type.name;if(t===`ElTree`){let t=e.props?.data||[];v(t).forEach(e=>{e.currentLabel=e.label??(z(e.value)?``:e.value),c.onOptionCreate(e)})}else if(t===`ElOption`){let t={...e.props};t.currentLabel=t.label??(z(t.value)?``:t.value),c.onOptionCreate(t)}}})};M(()=>[e.persistent||c.expanded.value||!n.default?void 0:n.default?.(),o.value],()=>{e.persistent||c.expanded.value||n.default&&(c.states.options.clear(),y(n.default?.()))},{immediate:!0}),T(Z,re({props:s,states:c.states,selectRef:c.selectRef,optionsArray:c.optionsArray,setSelected:c.setSelected,handleOptionSelect:c.handleOptionSelect,onOptionCreate:c.onOptionCreate,onOptionDestroy:c.onOptionDestroy}));let b=a(()=>e.multiple?c.states.selected.map(e=>e.currentLabel):c.states.selectedLabel);return ne(()=>{let e=$.get(r.appContext);e&&(--e.count,e.count<=0&&(r.appContext.config.warnHandler=e.originalWarnHandler,$.delete(r.appContext)))}),{...c,modelValue:o,selectedLabel:b,calculatorRef:l,inputStyle:u,getLabel:f,getValue:p,getOptions:m,getDisabled:h,getOptionProps:g}}}),Nt=[`id`,`value`,`name`,`disabled`,`autocomplete`,`tabindex`,`readonly`,`aria-activedescendant`,`aria-controls`,`aria-expanded`,`aria-label`],Pt=[`textContent`],Ft={key:1};function It(i,a,s,l,u,d){let f=k(`el-tag`),p=k(`el-tooltip`),m=k(`el-icon`),h=k(`el-option`),g=k(`el-option-group`),_=k(`el-options`),b=k(`el-scrollbar`),ee=k(`el-select-menu`),S=ge(`click-outside`);return se((C(),o(`div`,r({ref:`selectRef`,class:[i.nsSelect.b(),i.nsSelect.m(i.selectSize)]},{[O(i.mouseEnterEventName)]:a[11]||=e=>i.states.inputHovering=!0},{onMouseleave:a[12]||=e=>i.states.inputHovering=!1}),[j(p,{ref:`tooltipRef`,visible:i.dropdownMenuVisible,placement:i.placement,teleported:i.teleported,"popper-class":[i.nsSelect.e(`popper`),i.popperClass],"popper-style":i.popperStyle,"popper-options":i.popperOptions,"fallback-placements":i.fallbackPlacements,effect:i.effect,pure:``,trigger:`click`,transition:`${i.nsSelect.namespace.value}-zoom-in-top`,"stop-popper-mouse-event":!1,"gpu-acceleration":!1,persistent:i.persistent,"append-to":i.appendTo,"show-arrow":i.showArrow,offset:i.offset,onBeforeShow:i.handleMenuEnter,onHide:a[10]||=e=>i.states.isBeforeHide=!1},{default:D(()=>[I(`div`,{ref:`wrapperRef`,class:w([i.nsSelect.e(`wrapper`),i.nsSelect.is(`focused`,i.isFocused),i.nsSelect.is(`hovering`,i.states.inputHovering),i.nsSelect.is(`filterable`,i.filterable),i.nsSelect.is(`disabled`,i.selectDisabled)]),onClick:a[7]||=K((...e)=>i.toggleMenu&&i.toggleMenu(...e),[`prevent`])},[i.$slots.prefix?(C(),o(`div`,{key:0,ref:`prefixRef`,class:w(i.nsSelect.e(`prefix`))},[e(i.$slots,`prefix`)],2)):c(`v-if`,!0),I(`div`,{ref:`selectionRef`,class:w([i.nsSelect.e(`selection`),i.nsSelect.is(`near`,i.multiple&&!i.$slots.prefix&&!!i.states.selected.length)])},[i.multiple?e(i.$slots,`tag`,{key:0,data:i.states.selected,deleteTag:i.deleteTag,selectDisabled:i.selectDisabled},()=>[(C(!0),o(E,null,v(i.showTagList,r=>(C(),o(`div`,{key:i.getValueKey(r),class:w(i.nsSelect.e(`selected-item`)),style:y(i.tagStyle)},[j(f,{closable:!i.selectDisabled&&!r.isDisabled,size:i.collapseTagSize,type:i.tagType,effect:i.tagEffect,"disable-transitions":``,onClose:e=>i.deleteTag(e,r)},{default:D(()=>[I(`span`,{class:w(i.nsSelect.e(`tags-text`))},[e(i.$slots,`label`,{index:r.index,label:r.currentLabel,value:r.value},()=>[n(t(r.currentLabel),1)])],2)]),_:2},1032,[`closable`,`size`,`type`,`effect`,`onClose`])],6))),128)),i.collapseTags&&i.states.selected.length>i.maxCollapseTags?(C(),x(p,{key:0,ref:`tagTooltipRef`,disabled:i.dropdownMenuVisible||!i.collapseTagsTooltip,"fallback-placements":i.tagTooltip?.fallbackPlacements??[`bottom`,`top`,`right`,`left`],effect:i.tagTooltip?.effect??i.effect,placement:i.tagTooltip?.placement??`bottom`,"popper-class":i.tagTooltip?.popperClass??i.popperClass,"popper-style":i.tagTooltip?.popperStyle??i.popperStyle,teleported:i.tagTooltip?.teleported??i.teleported,"append-to":i.tagTooltip?.appendTo??i.appendTo,"popper-options":i.tagTooltip?.popperOptions??i.popperOptions,transition:i.tagTooltip?.transition,"show-after":i.tagTooltip?.showAfter,"hide-after":i.tagTooltip?.hideAfter,"auto-close":i.tagTooltip?.autoClose,offset:i.tagTooltip?.offset},{default:D(()=>[I(`div`,{ref:`collapseItemRef`,class:w([i.nsSelect.e(`selected-item`),i.nsSelect.e(`collapse-item`)])},[j(f,{closable:!1,size:i.collapseTagSize,type:i.tagType,effect:i.tagEffect,"disable-transitions":``},{default:D(()=>[I(`span`,{class:w(i.nsSelect.e(`tags-text`))},` + `+t(i.states.selected.length-i.maxCollapseTags),3)]),_:1},8,[`size`,`type`,`effect`])],2)]),content:D(()=>[I(`div`,{ref:`tagMenuRef`,class:w(i.nsSelect.e(`selection`))},[(C(!0),o(E,null,v(i.collapseTagList,r=>(C(),o(`div`,{key:i.getValueKey(r),class:w(i.nsSelect.e(`selected-item`))},[j(f,{class:`in-tooltip`,closable:!i.selectDisabled&&!r.isDisabled,size:i.collapseTagSize,type:i.tagType,effect:i.tagEffect,"disable-transitions":``,onClose:e=>i.deleteTag(e,r)},{default:D(()=>[I(`span`,{class:w(i.nsSelect.e(`tags-text`))},[e(i.$slots,`label`,{index:r.index,label:r.currentLabel,value:r.value},()=>[n(t(r.currentLabel),1)])],2)]),_:2},1032,[`closable`,`size`,`type`,`effect`,`onClose`])],2))),128))],2)]),_:3},8,[`disabled`,`fallback-placements`,`effect`,`placement`,`popper-class`,`popper-style`,`teleported`,`append-to`,`popper-options`,`transition`,`show-after`,`hide-after`,`auto-close`,`offset`])):c(`v-if`,!0)]):c(`v-if`,!0),I(`div`,{class:w([i.nsSelect.e(`selected-item`),i.nsSelect.e(`input-wrapper`),i.nsSelect.is(`hidden`,!i.filterable||i.selectDisabled||i.multiple&&!i.states.inputValue&&!i.isFocused)])},[I(`input`,{id:i.inputId,ref:`inputRef`,value:i.states.inputValue,type:`text`,name:i.name,class:w([i.nsSelect.e(`input`),i.nsSelect.is(i.selectSize)]),disabled:i.selectDisabled,autocomplete:i.autocomplete,style:y(i.inputStyle),tabindex:i.tabindex,role:`combobox`,readonly:!i.filterable,spellcheck:`false`,"aria-activedescendant":i.hoverOption?.id||``,"aria-controls":i.contentId,"aria-expanded":i.dropdownMenuVisible,"aria-label":i.ariaLabel,"aria-autocomplete":`none`,"aria-haspopup":`listbox`,onKeydown:a[0]||=(...e)=>i.handleKeydown&&i.handleKeydown(...e),onCompositionstart:a[1]||=(...e)=>i.handleCompositionStart&&i.handleCompositionStart(...e),onCompositionupdate:a[2]||=(...e)=>i.handleCompositionUpdate&&i.handleCompositionUpdate(...e),onCompositionend:a[3]||=(...e)=>i.handleCompositionEnd&&i.handleCompositionEnd(...e),onInput:a[4]||=(...e)=>i.onInput&&i.onInput(...e),onChange:a[5]||=K(()=>{},[`stop`]),onClick:a[6]||=K((...e)=>i.toggleMenu&&i.toggleMenu(...e),[`stop`])},null,46,Nt),i.filterable?(C(),o(`span`,{key:0,ref:`calculatorRef`,"aria-hidden":`true`,class:w(i.nsSelect.e(`input-calculator`)),textContent:t(i.states.inputValue)},null,10,Pt)):c(`v-if`,!0)],2),i.shouldShowPlaceholder?(C(),o(`div`,{key:1,class:w([i.nsSelect.e(`selected-item`),i.nsSelect.e(`placeholder`),i.nsSelect.is(`transparent`,!i.hasModelValue||i.expanded&&!i.states.inputValue)])},[i.hasModelValue?e(i.$slots,`label`,{key:0,index:i.getOption(i.modelValue).index,label:i.currentPlaceholder,value:i.modelValue},()=>[I(`span`,null,t(i.currentPlaceholder),1)]):(C(),o(`span`,Ft,t(i.currentPlaceholder),1))],2)):c(`v-if`,!0)],2),I(`div`,{ref:`suffixRef`,class:w(i.nsSelect.e(`suffix`))},[i.iconComponent&&!i.showClearBtn?(C(),x(m,{key:0,class:w([i.nsSelect.e(`caret`),i.nsSelect.e(`icon`),i.iconReverse])},{default:D(()=>[(C(),x(N(i.iconComponent)))]),_:1},8,[`class`])):c(`v-if`,!0),i.showClearBtn&&i.clearIcon?(C(),x(m,{key:1,class:w([i.nsSelect.e(`caret`),i.nsSelect.e(`icon`),i.nsSelect.e(`clear`)]),onClick:i.handleClearClick},{default:D(()=>[(C(),x(N(i.clearIcon)))]),_:1},8,[`class`,`onClick`])):c(`v-if`,!0),i.validateState&&i.validateIcon&&i.needStatusIcon?(C(),x(m,{key:2,class:w([i.nsInput.e(`icon`),i.nsInput.e(`validateIcon`),i.nsInput.is(`loading`,i.validateState===`validating`)])},{default:D(()=>[(C(),x(N(i.validateIcon)))]),_:1},8,[`class`])):c(`v-if`,!0)],2)],2)]),content:D(()=>[j(ee,{ref:`menuRef`},{default:D(()=>[i.$slots.header?(C(),o(`div`,{key:0,class:w(i.nsSelect.be(`dropdown`,`header`)),onClick:a[8]||=K(()=>{},[`stop`])},[e(i.$slots,`header`)],2)):c(`v-if`,!0),se(j(b,{id:i.contentId,ref:`scrollbarRef`,tag:`ul`,"wrap-class":i.nsSelect.be(`dropdown`,`wrap`),"view-class":i.nsSelect.be(`dropdown`,`list`),class:w([i.nsSelect.is(`empty`,i.filteredOptionsCount===0)]),role:`listbox`,"aria-label":i.ariaLabel,"aria-orientation":`vertical`,onScroll:i.popupScroll,onEndReached:i.endReached},{default:D(()=>[i.showNewOption?(C(),x(h,{key:0,value:i.states.inputValue,created:!0},null,8,[`value`])):c(`v-if`,!0),j(_,null,{default:D(()=>[e(i.$slots,`default`,{},()=>[(C(!0),o(E,null,v(i.options,(e,t)=>(C(),o(E,{key:t},[i.getOptions(e)?.length?(C(),x(g,{key:0,label:i.getLabel(e),disabled:i.getDisabled(e)},{default:D(()=>[(C(!0),o(E,null,v(i.getOptions(e),e=>(C(),x(h,r({key:i.getValue(e)},{ref_for:!0},i.getOptionProps(e)),null,16))),128))]),_:2},1032,[`label`,`disabled`])):(C(),x(h,r({key:1,ref_for:!0},i.getOptionProps(e)),null,16))],64))),128))])]),_:3})]),_:3},8,[`id`,`wrap-class`,`view-class`,`class`,`aria-label`,`onScroll`,`onEndReached`]),[[Xe,i.states.options.size>0&&!i.loading]]),i.$slots.loading&&i.loading?(C(),o(`div`,{key:1,class:w(i.nsSelect.be(`dropdown`,`loading`))},[e(i.$slots,`loading`)],2)):i.loading||i.filteredOptionsCount===0?(C(),o(`div`,{key:2,class:w(i.nsSelect.be(`dropdown`,`empty`))},[e(i.$slots,`empty`,{},()=>[I(`span`,null,t(i.emptyText),1)])],2)):c(`v-if`,!0),i.$slots.footer?(C(),o(`div`,{key:3,class:w(i.nsSelect.be(`dropdown`,`footer`)),onClick:a[9]||=K(()=>{},[`stop`])},[e(i.$slots,`footer`)],2)):c(`v-if`,!0)]),_:3},512)]),_:3},8,[`visible`,`placement`,`teleported`,`popper-class`,`popper-style`,`popper-options`,`fallback-placements`,`effect`,`transition`,`persistent`,`append-to`,`show-arrow`,`offset`,`onBeforeShow`])],16)),[[S,i.handleClickOutside,i.popperRef]])}var Lt=A(U(Mt,[[`render`,It]]),{Option:bt,OptionGroup:Ct}),Rt=ye(bt);ye(Ct);var zt=le({tag:{type:String,default:`div`},span:{type:Number,default:24},offset:{type:Number,default:0},pull:{type:Number,default:0},push:{type:Number,default:0},xs:{type:F([Number,Object]),default:()=>W({})},sm:{type:F([Number,Object]),default:()=>W({})},md:{type:F([Number,Object]),default:()=>W({})},lg:{type:F([Number,Object]),default:()=>W({})},xl:{type:F([Number,Object]),default:()=>W({})}}),Bt=le({tag:{type:String,default:`div`},gutter:{type:Number,default:0},justify:{type:String,values:[`start`,`center`,`end`,`space-around`,`space-between`,`space-evenly`],default:`start`},align:{type:String,values:[`top`,`middle`,`bottom`]}}),Vt=Symbol(`rowContextKey`),Ht=A(m({name:`ElRow`,__name:`row`,props:Bt,setup(t){let n=t,r=L(`row`),i=a(()=>n.gutter);T(Vt,{gutter:i});let o=a(()=>{let e={};return n.gutter&&(e.marginRight=e.marginLeft=`-${n.gutter/2}px`),e}),s=a(()=>[r.b(),r.is(`justify-${n.justify}`,n.justify!==`start`),r.is(`align-${n.align}`,!!n.align)]);return(n,r)=>(C(),x(N(t.tag),{class:w(s.value),style:y(o.value)},{default:D(()=>[e(n.$slots,`default`)]),_:3},8,[`class`,`style`]))}})),Ut=A(m({name:`ElCol`,__name:`col`,props:zt,setup(t){let n=t,{gutter:r}=b(Vt,{gutter:a(()=>0)}),i=L(`col`),o=a(()=>{let e={};return r.value&&(e.paddingLeft=e.paddingRight=`${r.value/2}px`),e}),s=a(()=>{let e=[];return[`span`,`offset`,`pull`,`push`].forEach(t=>{let r=n[t];pe(r)&&(t===`span`?e.push(i.b(`${n[t]}`)):r>0&&e.push(i.b(`${t}-${n[t]}`)))}),[`xs`,`sm`,`md`,`lg`,`xl`].forEach(t=>{pe(n[t])?e.push(i.b(`${t}-${n[t]}`)):z(n[t])&&Object.entries(n[t]).forEach(([n,r])=>{e.push(n===`span`?i.b(`${t}-${r}`):i.b(`${t}-${n}-${r}`))})}),r.value&&e.push(i.is(`guttered`)),[i.b(),e]});return(n,r)=>(C(),x(N(t.tag),{class:w(s.value),style:y(o.value)},{default:D(()=>[e(n.$slots,`default`)]),_:3},8,[`class`,`style`]))}}));function Wt(e){return` `.repeat(Math.max(0,e))}function Gt(e,t){let n=e;for(let[e,r]of Object.entries(t))n=n.replace(RegExp(`{{${e}}}`,`g`),r);return n}function Kt(e){return e.split(`
`).map(e=>e.replace(/(^\s*)|(\s*$)/g,``)).join(`
`)}function qt(e){return!e||e.length===0?``:e.map(e=>Wt(e.level??0)+`- `+e.name+`
`+qt(e.chidren||[])).join(`
`)}function Jt(e,t){return!e||e.length===0?``:e.map(e=>Wt(t)+`- `+e.name+`
`+Jt(e.chidren||[],t+1)).join(`
`)}function Yt(){return`
## 知识管理哲学

1. 本质、稳定优先原则
   * 追求技术背后的**第一性原理**
   * 关注**不变**的架构模式、设计思想、哲学基础
   * 从具体实现中抽象出**通用规律**
   * 所有解析必须穿透现象直达架构原理与设计哲学
   * 概念解释需揭示底层原理而非表面特征
   * 知识组织应体现从抽象到具体的认知层次
   * 稳定知识 = 原理层认知 + 架构思想 + 设计模式 + 工程哲学
   * 不稳定知识 = 具体API + 临时方案 + 未经验证的新特性
   * **关注** 原理、理论体系、组织协作
   * **忽略** 具体技术细节、临时内容、表面特征
   * 工具导向 → 思想导向
   * 分散知识 → 系统认知
   * 短期关注 → 长期沉淀
   * 技术思维 → 人文思维
   * 应用层 → 原理层

2. 知识结构化原则
   *  树形结构可以引导用户结构化思考
   *  网状结构可以展示知识间的关系
   *  标签元数据能对知识进行分类整理
`}var Xt=[{name:`审视文章优缺点和建议`,value:`review`,variables:[{name:`docTitle`,label:`文档标题`,value:`{{doc}}`,description:`输入的文档标题`},{name:`inputContent`,label:`输入内容`,value:`
{{fileContent}}
`,description:`文档的原始内容`}],template:`
你是文章审阅与知识分析专家。

${Yt()}

任务：对输入文章 ({{docTitle}}) 进行全面审视，输出文章的**优缺点分析与改进建议**，并根据文档类型动态适配分析维度。

---

【分析逻辑】：

1. **技术/系统架构文档**
   - **优点分析**：
     - 技术结构清晰性（架构、模块划分、层次性）
     - 概念准确性（核心概念、模型、边界）
     - 实用性（示例、可执行性、可复用性）
     - 可观测性与治理体系体现
   - **缺点分析**：
     - 抽象不足或概念混淆
     - 缺少可视化图表或模型关系
     - 部分设计原则不明确
     - 缺少演进趋势或选型参考
   - **改进建议**：
     - 增加抽象概念和模块化模型
     - 补充可视化能力树、流程图
     - 明确边界和职责
     - 加入演进趋势和选型方法论

2. **产品/业务方法论文档**
   - **优点分析**：
     - 核心原则明确
     - 流程/方法模型完整
     - 角色职责清晰
     - 与业务目标或价值关联
   - **缺点分析**：
     - 流程或能力模型不够抽象
     - 缺少实践示例或可量化指标
     - 逻辑顺序不够清晰
   - **改进建议**：
     - 梳理流程模型和能力树
     - 补充实践案例和可量化指标
     - 明确角色、责任、协作关系

3. **流程规范文档**
   - **优点分析**：
     - 流程步骤完整
     - 输入输出、角色职责清晰
     - 策略规则明确
   - **缺点分析**：
     - 流程抽象层次不足
     - 缺少优化或治理建议
     - 可视化图表不足
   - **改进建议**：
     - 增加流程图或泳道图
     - 明确策略与监控指标
     - 提供优化和演进方案

4. **知识概念/学科文档**
   - **优点分析**：
     - 核心概念定义准确
     - 分类体系完整
     - 应用场景和关联关系清晰
   - **缺点分析**：
     - 概念抽象度不够
     - 缺少发展趋势或演进分析
     - 逻辑层次不够清晰
   - **改改进**：
     - 强化概念抽象和边界定义
     - 补充发展趋势和应用示例
     - 增加分类关系图或概念图

有些知识可能不存在某些模块,或者列出的模块无法满足某些知识的描述需求，请参照具体的知识内容自行扩展。

---

【输出要求】：
1. 输出**优点分析**、**缺点分析**、**改进建议**三个部分
2. 每条分析建议都应简明、具体、可操作
3. 可使用表格或列表增强可读性
4. 逻辑清晰、条理分明，便于团队复用和改进

---

【输入文章】：
---
{{inputContent}}
---

      `,generate:e=>e.template.replace(`{{docTitle}}`,e.docTitle).replace(`{{inputContent}}`,e.inputContent)},{name:`文档升维处理`,value:`upscaling`,variables:[{name:`docTitle`,label:`文档标题`,value:`{{doc}}`,description:`输入的文档标题`},{name:`inputContent`,label:`输入内容`,value:`
{{fileContent}}
`,description:`文档的原始内容`}],template:`
你是知识体系专家和文档升维专家。

${Yt()}

任务：将输入的原始文档 ({{docTitle}}) 升维为高抽象度、体系化、逻辑严谨的知识文档。请输出完整知识文档版本。

---

【顶层结构模块选择】：

1. 技术/系统架构文档：
   - 概述（Overview）
   - 本质（Essence）
   - 模型（Model）
   - 能力体系（Capability System）
   - 架构模型（Architecture Model）
   - 类型体系（Taxonomy）
   - 边界与生态（Boundary & Ecosystem）
   - 治理体系（Governance System）
   - 演进趋势（Evolution）
   - 选型方法论（Selection Framework）
   - 总结（Conclusion）

2. 产品/业务方法论文档：
   - 概述/目标价值
   - 本质/核心原则
   - 流程模型（Process Model）
   - 能力模型（Capability Model）
   - 角色与职责（Roles & Responsibilities）
   - 治理体系（Governance System）
   - 演进趋势（Evolution）
   - 总结（Conclusion）

3. 流程规范文档：
   - 概述
   - 核心流程（Core Process）
   - 输入输出（Input/Output）
   - 角色职责（Roles & Responsibilities）
   - 策略规则（Policies & Rules）
   - 治理与监控（Governance & Monitoring）
   - 优化与演进（Optimization & Evolution）
   - 总结

4. 知识概念/学科文档：
   - 概述
   - 本质/定义
   - 核心概念（Core Concepts）
   - 分类体系（Taxonomy）
   - 应用场景（Use Cases / Applications）
   - 关联关系（Relations / Dependencies）
   - 发展趋势（Evolution / Trends）
   - 总结

有些知识可能不存在某些模块,或者列出的模块无法满足某些知识的描述需求，请参照具体的知识内容自行扩展。

---

【生成要求】：

1. 对每个模块：
   - 提炼核心概念、定义和作用
   - 可使用表格、流程图或 mermaid 图增强可读性
   - 抽象概念优先，工程或实践示例可选

2. 输出风格：
   - 知识文档风格、逻辑严谨、层次清晰
   - 大标题、小标题不要使用中文数字或者阿拉伯数字开头
   - 避免不必要的 emoji 表情
   - 概念和边界明确
   - 可作为团队内部标准参考

3. 可选增强：
   - 能力树图示
   - 流程图或模型关系图
   - 演进路线图
   - 选型/决策表格或决策树

---

【输入文档】：
---
{{inputContent}}
---
      `,generate:e=>e.template.replace(`{{docTitle}}`,e.docTitle).replace(`{{inputContent}}`,e.inputContent)},{name:`知识错误纠正`,value:`misconceptions`,variables:[{name:`docTitle`,label:`文档标题`,value:`{{doc}}`,description:`输入的文档标题`},{name:`inputContent`,label:`输入内容`,value:`---
{{fileContent}}
---`,description:`文档的原始内容`}],template:`
你是一名知识纠偏专家。

【任务目标】
指出所给出的《{{docTitle}}》中常见的有误的表述。

【输出格式要求】
1. 每条误解包含：
   - 错误表述
   - 正确表述
   - 简明解释
2. 使用 Markdown 列表

【输入数据】
{{inputContent}}

【重要规则】
- 误解必须基于所输入的数据，不要编造错误。

      `,generate:e=>e.template.replace(`{{docTitle}}`,e.docTitle).replace(`{{inputContent}}`,e.inputContent)},{name:`标签预测`,value:`predictTag`,variables:[{name:`docTitle`,label:`文档标题`,value:`{{doc}}`,description:`输入的文档标题`},{name:`availableTags`,label:`可用标签`,value:`{{tags}}`,description:`系统中所有可用的标签`},{name:`inputContent`,label:`输入内容`,value:`---
{{fileContent}}
---`,description:`文档的原始内容`}],template:`
你是一名文本分类与标签抽象专家。

【任务目标】
从标签列表中选出最适合《{{docTitle}}》内容的标签，如必要可生成新的抽象标签，但必须具有通用性。

【输出格式要求】
1. 输出"最终标签列表 (最多 5 个)"
2. 每个标签需附一句理由说明
3. 若生成新标签，需要说明其抽象语义

【输入数据】
标签列表：
{{availableTags}}

文本内容：
{{inputContent}}

【输出格式要求】
---
tags: ['标签1', '标签2', '标签3']
---

【重要规则】
- 不允许生成具体到"案例""年份""技术版本号"的标签。
- 所有标签必须与文本高度相关。

      `,generate:e=>e.template.replace(`{{docTitle}}`,e.docTitle).replace(`{{availableTags}}`,e.availableTags).replace(`{{inputContent}}`,e.inputContent)},{name:`概括总结`,value:`summary`,variables:[{name:`docTitle`,label:`文档标题`,value:`{{doc}}`,description:`输入的文档标题`},{name:`inputContent`,label:`输入内容`,value:`---
{{fileContent}}
---`,description:`文档的原始内容`}],template:`
你是一名文档摘要与知识提炼专家。

【任务目标】
对以下《{{docTitle}}》文本进行结构化总结，提炼主要思想。

【输出格式要求】
1. 使用 Markdown 输出以下四部分内容：
   - 核心观点摘要
   - 关键论点
   - 重要概念提炼
   - 适用场景与限制（如内容中可推导）
2. 结构清晰，避免无关内容。

【输入数据】
文本内容：
{{inputContent}}

【重要规则】
- 摘要必须可从原文推导，不得添加文中未出现的观点。

      `,generate:e=>e.template.replace(`{{docTitle}}`,e.docTitle).replace(`{{inputContent}}`,e.inputContent)},{name:`更新与趋势`,value:`trends`,variables:[{name:`docTitle`,label:`文档标题`,value:`{{doc}}`,description:`输入的文档标题`},{name:`docOutline`,label:`文档目录`,value:`---
{{outline}}
---`,description:`文档的目录结构`}],template:`
你是一名知识趋势追踪专家。

【任务目标】
结合当前模型知识，分析《{{docTitle}}》主题的"近年来趋势"，并尽可能标注年份。

【输出格式要求】
1. 按年份/阶段列出趋势
2. 使用 Markdown 列表
3. 若年份不确定，用"约 202x 年"表达

【输入数据】
目录：
{{docOutline}}

【重要规则】
- 年份必须是行业公认趋势，不得凭空创造特定事件。

      `,generate:e=>e.template.replace(`{{docTitle}}`,e.docTitle).replace(`{{docOutline}}`,e.docOutline)},{name:`历史背景`,value:`history`,variables:[{name:`docTitle`,label:`文档标题`,value:`{{doc}}`,description:`输入的文档标题`}],template:`
你是一名知识体系发展史研究员。

【任务目标】
基于结构与内容分析《{{docTitle}}》对应领域的演进脉络（抽象演化而非具体年份）。

【输出格式要求】
1. 起源阶段
2. 发展阶段
3. 体系成熟阶段
4. 当前状态
5. 全程禁止虚构具体年份

【重要规则】
- 若内容缺乏时间信息，则以"逻辑演进阶段"代替。

      `,generate:e=>e.template.replace(`{{docTitle}}`,e.docTitle)},{name:`未来发展`,value:`future`,variables:[{name:`docTitle`,label:`文档标题`,value:`{{doc}}`,description:`输入的文档标题`}],template:`
你是一名趋势分析专家。

【任务目标】
基于内容推断《{{docTitle}}》未来 3~5 年的可能发展方向与挑战。

【输出格式要求】
1. 推动力（技术/需求/限制）
2. 未来可能的演进方向
3. 潜在风险和挑战
4. 可能的突破点（如内容可推导）


【重要规则】
- 不得凭空编造具体年份预测。
- 所有趋势必须能从内容推导或来自通用行业规律。

      `,generate:e=>e.template.replace(`{{docTitle}}`,e.docTitle)},{name:`根据整个目录回答问题`,value:`answerByAllCategory`,variables:[{name:`knowledgeCatalog`,label:`知识体系目录`,value:`---
{{allCategories}}
---`,description:`整个知识体系的目录`}],template:`
你是一名知识体系分析专家。

【任务目标】
根据整个知识体系目录结构回答用户的问题。

【输出格式要求】
1. 输出应基于目录结构推论，不得凭空创造不存在的内容。
2. 回答保持结构化（使用 Markdown）。
3. 若目录无法提供足够信息，请明确指出信息不足之处。

【输入数据】
知识体系目录：
{{knowledgeCatalog}}

【重要规则】
- 只能利用目录中的主题推断，不得捏造细节内容。
- 避免输出与当前知识体系无关的内容。

【问题】（请在此处填写问题）

      `,generate:e=>e.template.replace(`{{knowledgeCatalog}}`,e.knowledgeCatalog)},{name:`根据内容回答问题`,value:`ansuwerByContent`,variables:[{name:`docTitle`,label:`文档标题`,value:`{{doc}}`,description:`输入的文档标题`},{name:`inputContent`,label:`输入内容`,value:`---
{{fileContent}}
---`,description:`文档的原始内容`}],template:`
你是一名内容理解与知识抽取专家。

【任务目标】
根据《{{docTitle}}》的全文内容回答用户的问题。

【输出格式要求】
1. 回答必须基于文本内容，不得超出文本范围。
2. 使用 Markdown 格式输出。
3. 若文本无相关内容，请明确指出。

【输入数据】
《{{docTitle}}》内容：
{{inputContent}}

【重要规则】
- 所有结论必须来源于内容。
- 不得脑补内容。
- 如内容不足，要提醒用户补充问题上下文。

【问题】

      `,generate:e=>e.template.replace(`{{docTitle}}`,e.docTitle).replace(`{{inputContent}}`,e.inputContent)},{name:`根据目录回答问题`,value:`ansuwerByCategory`,variables:[{name:`docTitle`,label:`文档标题`,value:`{{doc}}`,description:`输入的文档标题`},{name:`docOutline`,label:`文档目录`,value:`---
{{outline}}
---`,description:`文档的目录结构`}],template:`
你是一名文档结构理解与知识推理专家。

【任务目标】
根据《{{docTitle}}》的目录，回答用户提出的问题。

【输出格式要求】
1. 回答需与目录结构严格对应，不得臆造目录中不存在的主题。
2. 使用 Markdown 格式，结构清晰。
3. 若目录信息不足以回答问题，请明确说明。

【输入数据】
《{{docTitle}}》目录：
{{docOutline}}

【重要规则】
- 所有回答必须基于目录结构，不允许编造细节。
- 未在目录中出现的概念不要提供内容。

【问题】

      `,generate:e=>e.template.replace(`{{docTitle}}`,e.docTitle).replace(`{{docOutline}}`,e.docOutline)},{name:`补充目录`,value:`category`,variables:[{name:`docTitle`,label:`文档标题`,value:`{{doc}}`,description:`输入的文档标题`},{name:`docOutline`,label:`文档目录`,value:`---
{{outline}}
---`,description:`文档的目录结构`}],template:`
你是一名知识体系结构设计专家。

【任务目标】
分析《{{docTitle}}》当前目录结构，指出可补充的知识点、缺失部分或更合理的结构拓展方向。

【输出格式要求】
1. 使用 Markdown 列表格式，展示补充建议。
2. 按类别（基础概念 / 机制原理 / 设计哲学 / 实践应用 / 扩展阅读等）整理建议。
3. 不要修改现有结构，仅给出可补充内容。

【输入数据】
《{{docTitle}}》目录：
{{docOutline}}

【重要规则】
- 只能基于目录提出"合理可补充项"，不得幻想目录不存在的具体内容。
- 若当前目录已经较完整，需要说明"已较完整，可适当补充 xx"。

      `,generate:e=>e.template.replace(`{{docTitle}}`,e.docTitle).replace(`{{docOutline}}`,e.docOutline)},{name:`核心概念解释`,value:`concepts`,variables:[{name:`docTitle`,label:`文档标题`,value:`{{doc}}`,description:`输入的文档标题`},{name:`inputContent`,label:`输入内容`,value:`---
{{fileContent}}
---`,description:`文档的原始内容`}],template:`
你是《{{docTitle}}》领域的专业讲解者。

【任务目标】
解释该主题的核心概念、关键术语与本质思想。

【输出格式要求】
1. 包含以下部分：
   - 核心概念定义
   - 本质思想（核心逻辑）
   - 关键术语解释
   - 易混淆点澄清
   - 简单示例帮助理解
2. 全文使用 Markdown。

【输入数据】
{{inputContent}}

【重要规则】
- 定义必须可从文本推断，不得创造不存在的概念。

      `,generate:e=>e.template.replace(`{{docTitle}}`,e.docTitle).replace(`{{inputContent}}`,e.inputContent)},{name:`实践应用场景`,value:`applications`,variables:[{name:`docTitle`,label:`文档标题`,value:`{{doc}}`,description:`输入的文档标题`},{name:`inputContent`,label:`输入内容`,value:`---
{{fileContent}}
---`,description:`文档的原始内容`}],template:`
你是一名技术应用与场景分析专家。

【任务目标】
基于《{{docTitle}}》提取可应用的实践场景并解释如何落地使用。

【输出格式要求】
1. 按场景分类（如业务场景/技术场景/流程场景）
2. 每个场景必须包含：
   - 场景描述
   - 如何使用相关知识
   - 注意事项
3. Markdown 格式输出

【输入数据】
{{inputContent}}

【重要规则】
- 场景必须能由文档内容推导。

      `,generate:e=>e.template.replace(`{{docTitle}}`,e.docTitle).replace(`{{inputContent}}`,e.inputContent)},{name:`常见问题与解答`,value:`faq`,variables:[{name:`docTitle`,label:`文档标题`,value:`{{doc}}`,description:`输入的文档标题`},{name:`docOutline`,label:`文档目录`,value:`---
{{outline}}
---`,description:`文档的目录结构`},{name:`inputContent`,label:`输入内容`,value:`---
{{fileContent}}
---`,description:`文档的原始内容`}],template:`
        基于以下关于 《{{docTitle}}》 的内容和目录，请提出并回答可能遇到的常见问题。

        目录：
        {{docOutline}}

        内容：
        {{inputContent}}
      `,generate:e=>e.template.replace(`{{docTitle}}`,e.docTitle).replace(`{{docOutline}}`,e.docOutline).replace(`{{inputContent}}`,e.inputContent)},{name:`知识对比分析`,value:`comparison`,variables:[{name:`docTitle`,label:`文档标题`,value:`{{doc}}`,description:`输入的文档标题`},{name:`inputContent`,label:`输入内容`,value:`---
{{fileContent}}
---`,description:`文档的原始内容`}],template:`
你是一名知识对比与差异化分析专家。

【任务目标】
对《{{docTitle}}》与相关概念/技术进行对比分析。

【输出格式要求】
1. 输出对比表格（优势/劣势/适用场景）
2. 须包含以下部分：
   - 概念对比
   - 原理对比
   - 应用对比
   - 适用边界分析

【输入数据】
{{inputContent}}

【重要规则】
- 所有对比必须基于内容和行业常识。

      `,generate:e=>e.template.replace(`{{docTitle}}`,e.docTitle).replace(`{{inputContent}}`,e.inputContent)},{name:`学习路径规划`,value:`learningPath`,variables:[{name:`docTitle`,label:`文档标题`,value:`{{doc}}`,description:`输入的文档标题`},{name:`docOutline`,label:`文档目录`,value:`---
{{outline}}
---`,description:`文档的目录结构`},{name:`inputContent`,label:`输入内容`,value:`---
{{fileContent}}
---`,description:`文档的原始内容`}],template:`
你是一名学习路径设计专家。

【任务目标】
基于《{{docTitle}}》设计系统化学习路径，包括前置知识 → 核心学习 → 进阶扩展 → 实践建议。

【输出格式要求】
1. 学习分四阶段：
   - 前置知识
   - 基础理解
   - 深入进阶
   - 实践应用
2. 每阶段附学习建议与目标
3. 使用 Markdown

【输入数据】
目录：
{{docOutline}}
内容：
{{inputContent}}

【重要规则】
- 路径必须与文档结构一致。

      `,generate:e=>e.template.replace(`{{docTitle}}`,e.docTitle).replace(`{{docOutline}}`,e.docOutline).replace(`{{inputContent}}`,e.inputContent)},{name:`关键要点梳理`,value:`keyPoints`,variables:[{name:`docTitle`,label:`文档标题`,value:`{{doc}}`,description:`输入的文档标题`},{name:`inputContent`,label:`输入内容`,value:`---
{{fileContent}}
---`,description:`文档的原始内容`}],template:`
你是一名知识结构化与要点提炼专家。

【任务目标】
提炼《{{docTitle}}》的关键要点并按重要性排序。

【输出格式要求】
1. 输出"重要性排序列表"
2. 每个要点用一句话说明理由
3. 保持 Markdown 格式

【输入数据】
{{inputContent}}

【重要规则】
- 不得加入原文中未提到的要点。

      `,generate:e=>e.template.replace(`{{docTitle}}`,e.docTitle).replace(`{{inputContent}}`,e.inputContent)},{name:`案例分析`,value:`caseStudy`,variables:[{name:`docTitle`,label:`文档标题`,value:`{{doc}}`,description:`输入的文档标题`},{name:`inputContent`,label:`输入内容`,value:`---
{{fileContent}}
---`,description:`文档的原始内容`}],template:`
你是一名结构化案例分析专家。

【任务目标】
根据《{{docTitle}}》的内容，构造一个合理的示例案例（不依赖真实世界厂商/产品）。

【输出格式要求】
案例需包含：
1. 背景
2. 问题
3. 解决方案（应用文档知识）
4. 效果与启发
5. 使用 Markdown 展示

【输入数据】
{{inputContent}}

【重要规则】
- 案例必须是"抽象化案例"，避免虚构具体公司名称或真实数据。

      `,generate:e=>e.template.replace(`{{docTitle}}`,e.docTitle).replace(`{{inputContent}}`,e.inputContent)},{name:`知识关联图谱`,value:`relations`,variables:[{name:`docTitle`,label:`文档标题`,value:`{{doc}}`,description:`输入的文档标题`},{name:`docOutline`,label:`文档目录`,value:`---
{{outline}}
---`,description:`文档的目录结构`},{name:`inputContent`,label:`输入内容`,value:`---
{{fileContent}}
---`,description:`文档的原始内容`}],template:`
你是一名知识图谱构建专家。

【任务目标】
分析《{{docTitle}}》与其他知识点的关联，生成"关系说明列表"。

【输出格式要求】
1. 以 Markdown 列表展示以下内容：
   - 内部概念关联
   - 外部相关领域关联
   - 前置与后置关系
2. 如可推导，可给出"关系解释"

【输入数据】
目录：
{{docOutline}}
内容：
{{inputContent}}

【重要规则】
- 不创建不存在的概念节点。
- 所有关联必须符合文本或常识推理。

      `,generate:e=>e.template.replace(`{{docTitle}}`,e.docTitle).replace(`{{docOutline}}`,e.docOutline).replace(`{{inputContent}}`,e.inputContent)}],Zt=m({props:{doc:{type:String,required:!0}},data(){return{showDrawer:!1,llmMode:`review`,query:``,presets:Xt,currentTemplate:null,variableValues:{}}},watch:{doc(){this.handleModeChange()}},computed:{isDark(){return this.$store.state.isDarkMode}},methods:{async renderTemplate(e){let t=await this.$services.docService.getDocFileInfo(this.doc),n=await this.$services.docService.getContentByDocId(this.doc),r=await this.$services.categoryService.getCategoryList(),i=this.$services.tagService.getTagList(),a={};for(let o of e.variables)switch(o.name){case`docTitle`:a[o.name]=this.doc;break;case`inputContent`:a[o.name]=`---\n${t.content}\n---`;break;case`docOutline`:a[o.name]=`---\n${this.contents2String(n)}\n---`;break;case`knowledgeCatalog`:a[o.name]=`---\n${this.categories2String(r,0)}\n---`;break;case`availableTags`:a[o.name]=i.join(`,`);break;default:a[o.name]=o.value.replace(`{{doc}}`,this.doc).replace(`{{fileContent}}`,t.content).replace(`{{outline}}`,this.contents2String(n)).replace(`{{allCategories}}`,this.categories2String(r,0)).replace(`{{tags}}`,i.join(`,`))}return Kt(Gt(e.template,a))},show(){this.showDrawer=!0},async handleModeChange(){let e=this.presets.find(e=>e.value===this.llmMode);if(e){this.currentTemplate=e;let t=await this.$services.docService.getDocFileInfo(this.doc),n=await this.$services.docService.getContentByDocId(this.doc),r=await this.$services.categoryService.getCategoryList(),i=this.$services.tagService.getTagList();this.variableValues={};for(let a of e.variables)switch(a.name){case`docTitle`:this.variableValues[a.name]=this.doc;break;case`inputContent`:this.variableValues[a.name]=`\n${t.content}\n`;break;case`docOutline`:this.variableValues[a.name]=`\n${this.contents2String(n)}\n`;break;case`knowledgeCatalog`:this.variableValues[a.name]=`\n${this.categories2String(r,0)}\n`;break;case`availableTags`:this.variableValues[a.name]=i.join(`,`);break;default:this.variableValues[a.name]=a.value.replace(`{{doc}}`,this.doc).replace(`{{fileContent}}`,t.content).replace(`{{outline}}`,this.contents2String(n)).replace(`{{allCategories}}`,this.categories2String(r,0)).replace(`{{tags}}`,i.join(`,`))}this.updateTemplateContent()}},contents2String(e){return qt(e)},categories2String(e,t){return Jt(e,t)},tab(e){return Wt(e)},updateTemplateContent(){this.currentTemplate&&(this.query=Kt(Gt(this.currentTemplate.template,this.variableValues)))},handleQueryKeyUp(e){},handleCopy(){nt(this.query),Ve.success(`复制成功`)}},async created(){let e=this.presets.find(e=>e.value===`review`);e&&(this.currentTemplate=e,this.query=await this.renderTemplate(e),this.handleModeChange())}}),Qt={class:`llm-container`},$t={key:0,class:`variables-section`};function en(e,r,i,a,s,l){let u=Rt,d=Lt,f=Ut,p=Ht,m=Ie,h=Le,g=Y;return C(),x(g,{modelValue:e.showDrawer,"onUpdate:modelValue":r[2]||=t=>e.showDrawer=t,size:e.$isMobile()?`75%`:`44%`,direction:e.$isMobile()?`btt`:`rtl`,title:`模板生成问题`,modal:!1,onClose:r[3]||=t=>e.$emit(`close`),"lock-scroll":!1,"modal-penetrable":``,resizable:``},{default:D(()=>[I(`div`,Qt,[j(p,{gutter:12},{default:D(()=>[j(f,{span:24},{default:D(()=>[r[4]||=n(` 问题模板： `,-1),j(d,{modelValue:e.llmMode,"onUpdate:modelValue":r[0]||=t=>e.llmMode=t,onChange:e.handleModeChange,style:{width:`100%`}},{default:D(()=>[(C(!0),o(E,null,v(e.presets,e=>(C(),x(u,{key:e.value,value:e.value,label:e.name},{default:D(()=>[n(t(e.name),1)]),_:2},1032,[`value`,`label`]))),128))]),_:1},8,[`modelValue`,`onChange`])]),_:1})]),_:1}),e.currentTemplate&&e.currentTemplate.variables.length>0?(C(),o(`div`,$t,[r[5]||=I(`h4`,null,`模板变量`,-1),(C(!0),o(E,null,v(e.currentTemplate.variables,n=>(C(),x(p,{gutter:12,key:n.name,style:{"margin-bottom":`12px`}},{default:D(()=>[j(f,{span:24},{default:D(()=>[I(`label`,null,t(n.label),1),j(m,{type:`textarea`,rows:3,modelValue:e.variableValues[n.name],"onUpdate:modelValue":t=>e.variableValues[n.name]=t,placeholder:n.description,onInput:e.updateTemplateContent},null,8,[`modelValue`,`onUpdate:modelValue`,`placeholder`,`onInput`])]),_:2},1024)]),_:2},1024))),128))])):c(``,!0),j(m,{type:`textarea`,rows:`15`,modelValue:e.query,"onUpdate:modelValue":r[1]||=t=>e.query=t,onKeyup:e.handleQueryKeyUp},null,8,[`modelValue`,`onKeyup`]),j(p,{gutter:12,style:{"margin-top":`10px`}},{default:D(()=>[j(f,{span:24},{default:D(()=>[j(h,{type:`success`,onClick:e.handleCopy,style:{width:`100%`}},{default:D(()=>[...r[6]||=[n(`复制提问`,-1)]]),_:1},8,[`onClick`])]),_:1})]),_:1})])]),_:1},8,[`modelValue`,`size`,`direction`])}var tn=de(Zt,[[`render`,en],[`__scopeId`,`data-v-d3be6d16`]]);export{tn as default};