import"./chunk-QTnfLwEv.js";import{$n as e,Cn as t,Gn as n,Hn as r,Hr as i,Ht as a,In as o,Ir as s,Jn as c,Jt as l,Ln as u,Mn as d,Mt as f,Nr as p,Nt as m,On as h,Ot as g,Pr as _,Pt as v,Qn as y,Rn as b,Rr as ee,Sn as x,Sr as te,Tn as S,Ut as C,Xn as w,Xr as T,Yn as E,Yr as D,Yt as ne,Zn as O,Zr as k,Zt as re,_r as A,a as ie,an as ae,ar as oe,b as se,br as ce,cn as j,cr as le,dn as ue,er as M,hn as N,hr as de,jn as P,jt as fe,kn as F,l as pe,ln as me,lr as I,nn as he,o as ge,qr as L,rn as _e,sr as R,t as ve,ur as ye,wn as z,wr as be,wt as xe,xn as B,xt as Se,yr as Ce,zn as V}from"./css-C9zvLOX1.js";import{t as we}from"./toInteger-DPDP8BJY.js";import{r as Te,t as H}from"./_baseIteratee-DwacKOoJ.js";import{C as Ee,E as U,b as W,x as De,y as Oe}from"./css-X_PlH6gk.js";import{t as ke}from"./clamp-CE4Jg4bS.js";import{c as Ae,l as je,r as Me,t as Ne}from"./css-8MM_gQnj.js";import{i as Pe,n as Fe,t as Ie}from"./css-DfCY7ygu.js";import{i as G,n as Le,r as Re,t as ze}from"./css-C2sKSKjf.js";import{a as Be,n as Ve,o as He,r as Ue,t as We}from"./use-form-item-Dfk801jj.js";import{a as Ge,n as Ke,o as qe,r as Je,s as Ye,t as Xe}from"./Clipboard-CpJSmvcf.js";import{t as Ze}from"./css-DaECXKHq.js";import{t as Qe}from"./css-C9dsFUnv.js";import{O as K,a as q,ct as J,d as $e,m as Y,n as et,ot as tt,p as nt,u as rt}from"./index-BiYFFci2.js";var it=Math.max,X=Math.min;function at(e,t,n){var r=e==null?0:e.length;if(!r)return-1;var i=r-1;return n!==void 0&&(i=we(n),i=n<0?it(r+i,0):X(i,r-1)),Te(e,H(t,3),i,!0)}var ot={label:`label`,value:`value`,disabled:`disabled`,options:`options`};function st(e){let t=A({...ot,...e.props}),n={...e.props};return R(()=>e.props,e=>{Y(e,n)||(t.value={...ot,...e},n={...e})},{deep:!0}),{aliasProps:t,getLabel:e=>K(e,t.value.label),getValue:e=>K(e,t.value.value),getDisabled:e=>K(e,t.value.disabled),getOptions:e=>K(e,t.value.options)}}var ct=Symbol(`ElSelectGroup`),Z=Symbol(`ElSelect`),lt=`ElOption`,ut=fe({value:{type:[String,Number,Boolean,Object],required:!0},label:{type:[String,Number]},created:Boolean,disabled:Boolean});function Q(e,t){let n=o(Z);n||v(lt,`usage: <el-select><el-option /></el-select/>`);let r=o(ct,{disabled:!1}),i=B(()=>p(U(n.props.modelValue),e.value)),a=B(()=>{if(n.props.multiple){let e=U(n.props.modelValue??[]);return!i.value&&e.length>=n.props.multipleLimit&&n.props.multipleLimit>0}else return!1}),c=B(()=>e.label??(s(e.value)?``:e.value)),l=B(()=>e.value||e.label||``),u=B(()=>e.disabled||t.groupDisabled||a.value),f=d(),p=(t=[],r)=>{if(s(e.value)){let e=n.props.valueKey;return t&&t.some(t=>ce(K(t,e))===K(r,e))}else return t&&t.includes(r)};return R(()=>c.value,()=>{!e.created&&!n.props.remote&&n.setSelected()}),R(()=>e.value,(t,r)=>{let{remote:i,valueKey:a}=n.props;if((i?t!==r:!Y(t,r))&&(n.onOptionDestroy(r,f.proxy),n.onOptionCreate(f.proxy)),!e.created&&!i){if(a&&s(t)&&s(r)&&t[a]===r[a])return;n.setSelected()}}),R(()=>r.disabled,()=>{t.groupDisabled=r.disabled},{immediate:!0}),{select:n,currentLabel:c,currentValue:l,itemSelected:i,isDisabled:u,hoverItem:()=>{u.value||(n.states.hoveringIndex=n.optionsArray.indexOf(f.proxy))},updateOption:n=>{t.visible=new RegExp(Ge(n),`i`).test(String(c.value))||e.created}}}var dt=P({name:lt,componentName:lt,props:ut,setup(e){let t=j(`select`),n=Ue(),i=B(()=>[t.be(`dropdown`,`item`),t.is(`disabled`,be(c)),t.is(`selected`,be(s)),t.is(`hovering`,be(m))]),a=de({index:-1,groupDisabled:!1,visible:!0,hover:!1}),{currentLabel:o,itemSelected:s,isDisabled:c,select:l,hoverItem:u,updateOption:f}=Q(e,a),{visible:p,hover:m}=te(a),h=d().proxy;l.onOptionCreate(h),r(()=>{let e=h.value;V(()=>{let{selected:t}=l.states,n=t.some(e=>e.value===h.value);l.states.cachedOptions.get(e)===h&&!n&&l.states.cachedOptions.delete(e)}),l.onOptionDestroy(e,h)});function g(){c.value||l.handleOptionSelect(h)}return{ns:t,id:n,containerKls:i,currentLabel:o,itemSelected:s,isDisabled:c,select:l,visible:p,hover:m,states:a,hoverItem:u,updateOption:f,selectOptionClick:g}}}),ft=[`id`,`aria-disabled`,`aria-selected`];function pt(e,t,n,r,i,a){return ye((c(),S(`li`,{id:e.id,class:L(e.containerKls),role:`option`,"aria-disabled":e.isDisabled||void 0,"aria-selected":e.itemSelected,onMousemove:t[0]||=(...t)=>e.hoverItem&&e.hoverItem(...t),onClick:t[1]||=J((...t)=>e.selectOptionClick&&e.selectOptionClick(...t),[`stop`])},[O(e.$slots,`default`,{},()=>[x(`span`,null,T(e.currentLabel),1)])],42,ft)),[[tt,e.visible]])}var mt=Me(dt,[[`render`,pt]]),ht=P({name:`ElSelectDropdown`,componentName:`ElSelectDropdown`,setup(){let e=o(Z),t=j(`select`),r=B(()=>e.props.popperClass),i=B(()=>e.props.multiple),a=B(()=>e.props.fitInputWidth),s=A(``);function c(){let t=e.selectRef?.offsetWidth;t?s.value=`${t-2}px`:s.value=``}return n(()=>{c(),C(e.selectRef,c)}),{ns:t,minWidth:s,popperClass:r,isMultiple:i,isFitInputWidth:a}}});function gt(e,t,n,r,i,a){return c(),S(`div`,{class:L([e.ns.b(`dropdown`),e.ns.is(`multiple`,e.isMultiple),e.popperClass]),style:D({[e.isFitInputWidth?`width`:`minWidth`]:e.minWidth})},[e.$slots.header?(c(),S(`div`,{key:0,class:L(e.ns.be(`dropdown`,`header`))},[O(e.$slots,`header`)],2)):z(`v-if`,!0),O(e.$slots,`default`),e.$slots.footer?(c(),S(`div`,{key:1,class:L(e.ns.be(`dropdown`,`footer`))},[O(e.$slots,`footer`)],2)):z(`v-if`,!0)],6)}var _t=Me(ht,[[`render`,gt]]),vt=(e,t)=>{let{t:r}=nt(),i=oe(),a=Ue(),o=j(`select`),c=j(`input`),u=de({inputValue:``,options:new Map,cachedOptions:new Map,optionValues:[],selected:[],selectionWidth:0,collapseItemWidth:0,selectedLabel:``,hoveringIndex:-1,previousQuery:null,inputHovering:!1,menuVisibleOnFocus:!1,isBeforeHide:!1}),d=A(),f=A(),h=A(),g=A(),v=A(),y=A(),b=A(),x=A(),te=A(),S=A(),w=A(),T=A(!1),E=A(),D=A(!1),{form:O,formItem:k}=We(),{inputId:se}=Ve(e,{formItemContext:k}),{valueOnClear:ce,isEmptyValue:ue}=rt(e),{isComposing:M,handleCompositionStart:N,handleCompositionUpdate:P,handleCompositionEnd:fe}=Le({afterComposition:e=>tt(e)}),F=Be(),{wrapperRef:pe,isFocused:I,handleBlur:ge}=Re(v,{disabled:F,afterFocus(){e.automaticDropdown&&!T.value&&(T.value=!0,u.menuVisibleOnFocus=!0)},beforeBlur(e){return h.value?.isFocusInsideContent(e)||g.value?.isFocusInsideContent(e)},afterBlur(){var t;T.value=!1,u.menuVisibleOnFocus=!1,e.validateEvent&&((t=k?.validate)==null||t.call(k,`blur`).catch(e=>m(e)))}}),L=B(()=>p(e.modelValue)?e.modelValue.length>0:!ue(e.modelValue)),ve=B(()=>O?.statusIcon??!1),ye=B(()=>e.clearable&&!F.value&&L.value&&(I.value||u.inputHovering)),z=B(()=>e.remote&&e.filterable&&!e.remoteShowSuffix?``:e.suffixIcon),be=B(()=>o.is(`reverse`,!!(z.value&&T.value))),xe=B(()=>k?.validateState||``),Se=B(()=>xe.value&&ie[xe.value]),Ce=B(()=>e.remote?e.debounce:0),we=B(()=>e.remote&&!u.inputValue&&u.options.size===0),Te=B(()=>e.loading?e.loadingText||r(`el.select.loading`):e.filterable&&u.inputValue&&u.options.size>0&&H.value===0?e.noMatchText||r(`el.select.noMatch`):u.options.size===0?e.noDataText||r(`el.select.noData`):null),H=B(()=>W.value.filter(e=>e.visible).length),W=B(()=>{let e=Array.from(u.options.values()),t=[];return u.optionValues.forEach(n=>{let r=e.findIndex(e=>e.value===n);r>-1&&t.push(e[r])}),t.length>=e.length?t:e}),De=B(()=>Array.from(u.cachedOptions.values())),Oe=B(()=>{let t=W.value.filter(e=>!e.created).some(e=>e.currentLabel===u.inputValue);return e.filterable&&e.allowCreate&&u.inputValue!==``&&!t}),Ae=()=>{e.filterable&&_(e.filterMethod)||e.filterable&&e.remote&&_(e.remoteMethod)||W.value.forEach(e=>{var t;(t=e.updateOption)==null||t.call(e,u.inputValue)})},je=He(),Me=B(()=>[`small`].includes(je.value)?`small`:`default`),Ne=B({get(){return T.value&&(e.loading||!we.value||e.remote&&!!i.empty)&&(!D.value||!he(u.previousQuery))},set(e){T.value=e}}),Ie=B(()=>{if(e.multiple&&!ae(e.modelValue))return U(e.modelValue).length===0&&!u.inputValue;let t=p(e.modelValue)?e.modelValue[0]:e.modelValue;return e.filterable||ae(t)?!u.inputValue:!0}),G=B(()=>{let t=e.placeholder??r(`el.select.placeholder`);return e.multiple||!L.value?t:u.selectedLabel}),ze=B(()=>ne?null:`mouseenter`);R(()=>e.modelValue,(t,n)=>{e.multiple&&e.filterable&&!e.reserveKeyword&&(u.inputValue=``,Ge(``)),qe(),!Y(t,n)&&e.validateEvent&&k?.validate(`change`).catch(e=>m(e))},{flush:`post`,deep:!0}),R(()=>T.value,e=>{e?Ge(u.inputValue):(u.inputValue=``,u.previousQuery=null,u.isBeforeHide=!0,u.menuVisibleOnFocus=!1)}),R(()=>u.options.entries(),()=>{l&&(qe(),e.defaultFirstOption&&(e.filterable||e.remote)&&H.value&&Ke())},{flush:`post`}),R([()=>u.hoveringIndex,W],([e])=>{_e(e)&&e>-1?E.value=W.value[e]||{}:E.value={},W.value.forEach(e=>{e.hover=E.value===e})}),le(()=>{u.isBeforeHide||Ae()});let Ge=t=>{u.previousQuery===t||M.value||(u.previousQuery=t,e.filterable&&_(e.filterMethod)?e.filterMethod(t):e.filterable&&e.remote&&_(e.remoteMethod)&&e.remoteMethod(t),e.defaultFirstOption&&(e.filterable||e.remote)&&H.value?V(Ke):V(Ye))},Ke=()=>{let e=W.value.filter(e=>e.visible&&!e.disabled&&!e.states.groupDisabled),t=e.find(e=>e.created),n=e[0];u.hoveringIndex=ut(W.value.map(e=>e.value),t||n)},qe=()=>{if(e.multiple)u.selectedLabel=``;else{let t=Je(p(e.modelValue)?e.modelValue[0]:e.modelValue);u.selectedLabel=t.currentLabel,u.selected=[t];return}let t=[];ae(e.modelValue)||U(e.modelValue).forEach(e=>{t.push(Je(e))}),u.selected=t},Je=t=>{let n,r=ee(t);for(let i=u.cachedOptions.size-1;i>=0;i--){let a=De.value[i];if(r?K(a.value,e.valueKey)===K(t,e.valueKey):a.value===t){n={index:W.value.filter(e=>!e.created).indexOf(a),value:t,currentLabel:a.currentLabel,get isDisabled(){return a.isDisabled}};break}}return n||{index:-1,value:t,currentLabel:r?t.label:t??``}},Ye=()=>{let e=u.selected.length;if(e>0){let t=u.selected[e-1];u.hoveringIndex=W.value.findIndex(e=>St(t)===St(e))}else u.hoveringIndex=-1},Xe=()=>{u.selectionWidth=Number.parseFloat(window.getComputedStyle(f.value).width)},Ze=()=>{u.collapseItemWidth=S.value.getBoundingClientRect().width},Qe=()=>{var e,t;(t=(e=h.value)?.updatePopper)==null||t.call(e)},J=()=>{var e,t;(t=(e=g.value)?.updatePopper)==null||t.call(e)},$e=()=>{u.inputValue.length>0&&!T.value&&(T.value=!0),Ge(u.inputValue)},tt=t=>{if(u.inputValue=t.target.value,e.remote)D.value=!0,it();else return $e()},it=re(()=>{$e(),D.value=!1},Ce),X=n=>{Y(e.modelValue,n)||t(Fe,n)},ot=e=>at(e,e=>{let t=u.cachedOptions.get(e);return!t?.disabled&&!t?.states.groupDisabled}),st=n=>{let r=et(n);if(e.multiple&&r!==q.delete&&n.target.value.length<=0){let n=U(e.modelValue).slice(),r=ot(n);if(r<0)return;let i=n[r];n.splice(r,1),t(Pe,n),X(n),t(`remove-tag`,i)}},ct=(n,r)=>{let i=u.selected.indexOf(r);if(i>-1&&!F.value){let n=U(e.modelValue).slice();n.splice(i,1),t(Pe,n),X(n),t(`remove-tag`,r.value)}n.stopPropagation(),ht()},Z=n=>{n.stopPropagation();let r=e.multiple?[]:ce.value;if(e.multiple)for(let e of u.selected)e.isDisabled&&r.push(e.value);t(Pe,r),X(r),u.hoveringIndex=-1,T.value=!1,t(`clear`),ht()},lt=n=>{if(e.multiple){let r=U(e.modelValue??[]).slice(),i=ut(r,n);i>-1?r.splice(i,1):(e.multipleLimit<=0||r.length<e.multipleLimit)&&r.push(n.value),t(Pe,r),X(r),n.created&&Ge(``),e.filterable&&!e.reserveKeyword&&(u.inputValue=``)}else !Y(e.modelValue,n.value)&&t(`update:modelValue`,n.value),X(n.value),T.value=!1;ht(),!T.value&&V(()=>{Q(n)})},ut=(t,n)=>ae(n)?-1:s(n.value)?t.findIndex(t=>Y(K(t,e.valueKey),St(n))):t.indexOf(n.value),Q=e=>{var t,n;let r=p(e)?e[e.length-1]:e,i=null;if(!me(r?.value)){let e=W.value.filter(e=>e.value===r.value);e.length>0&&(i=e[0].$el)}if(h.value&&i){let e=((t=h.value?.popperRef?.contentRef)?.querySelector)?.call(t,`.${o.be(`dropdown`,`wrap`)}`);e&&Ee(e,i)}(n=w.value)==null||n.handleScroll()},dt=e=>{u.options.set(e.value,e),u.cachedOptions.set(e.value,e)},ft=(e,t)=>{u.options.get(e)===t&&u.options.delete(e)},pt=B(()=>h.value?.popperRef?.contentRef),mt=()=>{u.isBeforeHide=!1,V(()=>{var e;(e=w.value)==null||e.update(),Q(u.selected)})},ht=()=>{var e;(e=v.value)==null||e.focus()},gt=()=>{var e;if(T.value){T.value=!1,V(()=>v.value?.blur());return}(e=v.value)==null||e.blur()},_t=e=>{Z(e)},vt=e=>{if(T.value=!1,I.value){let t=new FocusEvent(`blur`,e);V(()=>ge(t))}},yt=()=>{u.inputValue.length>0?u.inputValue=``:T.value=!1},bt=t=>{F.value||e.filterable&&T.value&&t&&!b.value?.contains(t.target)||(ne&&(u.inputHovering=!0),u.menuVisibleOnFocus?u.menuVisibleOnFocus=!1:T.value=!T.value)},xt=()=>{if(!T.value)bt();else{let e=W.value[u.hoveringIndex];e&&!e.isDisabled&&lt(e)}},St=t=>s(t.value)?K(t.value,e.valueKey):t.value,Ct=B(()=>W.value.filter(e=>e.visible).every(e=>e.isDisabled)),wt=B(()=>e.multiple?e.collapseTags?u.selected.slice(0,e.maxCollapseTags):u.selected:[]),Tt=B(()=>e.multiple&&e.collapseTags?u.selected.slice(e.maxCollapseTags):[]),$=e=>{if(!T.value){T.value=!0;return}if(!(u.options.size===0||H.value===0||M.value)&&!Ct.value){e===`next`?(u.hoveringIndex++,u.hoveringIndex===u.options.size&&(u.hoveringIndex=0)):e===`prev`&&(u.hoveringIndex--,u.hoveringIndex<0&&(u.hoveringIndex=u.options.size-1));let t=W.value[u.hoveringIndex];(t.isDisabled||!t.visible)&&$(e),V(()=>Q(E.value))}},Et=(e,t,n,r)=>{for(let i=t;i>=0&&i<r;i+=n){let t=e[i];if(!t?.isDisabled&&t?.visible)return i}return null},Dt=(e,t)=>{let n=u.options.size;if(n===0)return;let r=ke(e,0,n-1),i=W.value,a=t===`up`?-1:1,o=Et(i,r,a,n)??Et(i,r-a,-a,n);o!=null&&(u.hoveringIndex=o,V(()=>Q(E.value)))},Ot=e=>{let t=et(e),n=!0;switch(t){case q.up:$(`prev`);break;case q.down:$(`next`);break;case q.enter:case q.numpadEnter:M.value||xt();break;case q.esc:yt();break;case q.backspace:n=!1,st(e);return;case q.home:if(!T.value)return;Dt(0,`down`);break;case q.end:if(!T.value)return;Dt(u.options.size-1,`up`);break;case q.pageUp:if(!T.value)return;Dt(u.hoveringIndex-10,`up`);break;case q.pageDown:if(!T.value)return;Dt(u.hoveringIndex+10,`down`);break;default:n=!1;break}n&&(e.preventDefault(),e.stopPropagation())},kt=()=>{if(!f.value)return 0;let e=window.getComputedStyle(f.value);return Number.parseFloat(e.gap||`6px`)},At=B(()=>{let t=kt(),n=e.filterable?t+11:0;return{maxWidth:`${S.value&&e.maxCollapseTags===1?u.selectionWidth-u.collapseItemWidth-t-n:u.selectionWidth-n}px`}}),jt=B(()=>({maxWidth:`${u.selectionWidth}px`})),Mt=e=>{t(`popup-scroll`,e)};C(f,Xe),C(pe,Qe),C(te,J),C(S,Ze);let Nt;return R(()=>Ne.value,e=>{e?Nt=C(x,Qe).stop:(Nt?.(),Nt=void 0),t(`visible-change`,e)}),n(()=>{qe()}),{inputId:se,contentId:a,nsSelect:o,nsInput:c,states:u,isFocused:I,expanded:T,optionsArray:W,hoverOption:E,selectSize:je,filteredOptionsCount:H,updateTooltip:Qe,updateTagTooltip:J,debouncedOnInputChange:it,onInput:tt,deletePrevTag:st,deleteTag:ct,deleteSelected:Z,handleOptionSelect:lt,scrollToOption:Q,hasModelValue:L,shouldShowPlaceholder:Ie,currentPlaceholder:G,mouseEnterEventName:ze,needStatusIcon:ve,showClearBtn:ye,iconComponent:z,iconReverse:be,validateState:xe,validateIcon:Se,showNewOption:Oe,updateOptions:Ae,collapseTagSize:Me,setSelected:qe,selectDisabled:F,emptyText:Te,handleCompositionStart:N,handleCompositionUpdate:P,handleCompositionEnd:fe,handleKeydown:Ot,onOptionCreate:dt,onOptionDestroy:ft,handleMenuEnter:mt,focus:ht,blur:gt,handleClearClick:_t,handleClickOutside:vt,handleEsc:yt,toggleMenu:bt,selectOption:xt,getValueKey:St,navigateOptions:$,dropdownMenuVisible:Ne,showTagList:wt,collapseTagList:Tt,popupScroll:Mt,getOption:Je,tagStyle:At,collapseTagStyle:jt,popperRef:pt,inputRef:v,tooltipRef:h,tagTooltipRef:g,prefixRef:y,suffixRef:b,selectRef:d,wrapperRef:pe,selectionRef:f,scrollbarRef:w,menuRef:x,tagMenuRef:te,collapseItemRef:S}},yt=P({name:`ElOptions`,setup(e,{slots:t}){let n=o(Z),r=[];return()=>{let e=t.default?.call(t),a=[];function o(e){p(e)&&e.forEach(e=>{let t=(e?.type||{})?.name;t===`ElOptionGroup`?o(!i(e.children)&&!p(e.children)&&_(e.children?.default)?e.children?.default():e.children):t===`ElOption`?a.push(e.props?.value):p(e.children)&&o(e.children)})}return e.length&&o(e[0]?.children),Y(a,r)||(r=a,n&&(n.states.optionValues=a)),e}}}),bt=fe({name:String,id:String,modelValue:{type:f([Array,String,Number,Boolean,Object]),default:void 0},autocomplete:{type:String,default:`off`},automaticDropdown:Boolean,size:g,effect:{type:f(String),default:`light`},disabled:{type:Boolean,default:void 0},clearable:Boolean,filterable:Boolean,allowCreate:Boolean,loading:Boolean,popperClass:{type:String,default:``},popperStyle:{type:f([String,Object])},popperOptions:{type:f(Object),default:()=>({})},remote:Boolean,debounce:{type:Number,default:300},loadingText:String,noMatchText:String,noDataText:String,remoteMethod:{type:f(Function)},filterMethod:{type:f(Function)},multiple:Boolean,multipleLimit:{type:Number,default:0},placeholder:{type:String},defaultFirstOption:Boolean,reserveKeyword:{type:Boolean,default:!0},valueKey:{type:String,default:`value`},collapseTags:Boolean,collapseTagsTooltip:Boolean,maxCollapseTags:{type:Number,default:1},teleported:Ae.teleported,persistent:{type:Boolean,default:!0},clearIcon:{type:ge,default:se},fitInputWidth:Boolean,suffixIcon:{type:ge,default:pe},tagType:{...Ye.type,default:`info`},tagEffect:{...Ye.effect,default:`light`},validateEvent:{type:Boolean,default:!0},remoteShowSuffix:Boolean,showArrow:{type:Boolean,default:!0},offset:{type:Number,default:12},placement:{type:f(String),values:je,default:`bottom-start`},fallbackPlacements:{type:f(Array),default:[`bottom-start`,`top-start`,`right`,`left`]},tabindex:{type:[String,Number],default:0},appendTo:Ae.appendTo,options:{type:f(Array)},props:{type:f(Object),default:()=>ot},...$e,...Ie([`ariaLabel`])});W.scroll;var xt=P({name:`ElOptionGroup`,componentName:`ElOptionGroup`,props:{label:String,disabled:Boolean},setup(e){let t=j(`select`),r=A(),i=d(),o=A([]);E(ct,de({...te(e)}));let s=B(()=>o.value.some(e=>e.visible===!0)),c=e=>e.type.name===`ElOption`&&!!e.component?.proxy,l=e=>{let t=U(e),n=[];return t.forEach(e=>{u(e)&&(c(e)?n.push(e.component.proxy):p(e.children)&&e.children.length?n.push(...l(e.children)):e.component?.subTree&&n.push(...l(e.component.subTree)))}),n},f=()=>{o.value=l(i.subTree)};return n(()=>{f()}),a(r,f,{attributes:!0,subtree:!0,childList:!0}),{groupRef:r,visible:s,ns:t}}});function St(e,t,n,r,i,a){return ye((c(),S(`ul`,{ref:`groupRef`,class:L(e.ns.be(`group`,`wrap`))},[x(`li`,{class:L(e.ns.be(`group`,`title`))},T(e.label),3),x(`li`,null,[x(`ul`,{class:L(e.ns.b(`group`))},[O(e.$slots,`default`)],2)])],2)),[[tt,e.visible]])}var Ct=Me(xt,[[`render`,St]]);function wt(){let e=Ce(),t=A(0),n=B(()=>({minWidth:`${Math.max(t.value,11)}px`}));return C(e,()=>{t.value=e.value?.getBoundingClientRect().width??0}),{calculatorRef:e,calculatorWidth:t,inputStyle:n}}var Tt=`ElSelect`,$=new WeakMap,Et=e=>(...t)=>{let n=t[0];if(!n||n.includes(`Slot "default" invoked outside of the render function`)&&t[2]?.includes(`ElTreeSelect`))return;let r=$.get(e)?.originalWarnHandler;if(r){r(...t);return}console.warn(...t)},Dt=e=>{let t=$.get(e);return t||(t={originalWarnHandler:e.config.warnHandler,handler:Et(e),count:0},$.set(e,t)),t},Ot=P({name:Tt,componentName:Tt,components:{ElSelectMenu:_t,ElOption:mt,ElOptions:yt,ElOptionGroup:Ct,ElTag:qe,ElScrollbar:Oe,ElTooltip:Ne,ElIcon:ve},directives:{ClickOutside:Je},props:bt,emits:[Pe,Fe,`remove-tag`,`clear`,`visible-change`,`focus`,`blur`,`popup-scroll`],setup(e,{emit:t,slots:n}){let i=d(),a=Dt(i.appContext);a.count+=1,i.appContext.config.warnHandler=a.handler;let o=B(()=>{let{modelValue:t,multiple:n}=e,r=n?[]:void 0;return p(t)?n?t:r:n?r:t}),c=de({...te(e),modelValue:o}),l=vt(c,t),{calculatorRef:u,inputStyle:f}=wt(),{getLabel:m,getValue:h,getOptions:g,getDisabled:_}=st(e),v=e=>({label:m(e),value:h(e),disabled:_(e)}),y=e=>e.reduce((e,t)=>(e.push(t),t.children&&t.children.length>0&&e.push(...y(t.children)),e),[]),b=e=>{De(e||[]).forEach(e=>{if(s(e)&&(e.type.name===`ElOption`||e.type.name===`ElTree`)){let t=e.type.name;if(t===`ElTree`)y(e.props?.data||[]).forEach(e=>{e.currentLabel=e.label||(s(e.value)?``:e.value),l.onOptionCreate(e)});else if(t===`ElOption`){let t={...e.props};t.currentLabel=t.label||(s(t.value)?``:t.value),l.onOptionCreate(t)}}})};R(()=>[n.default?.call(n),o.value],()=>{e.persistent||l.expanded.value||(l.states.options.clear(),b(n.default?.call(n)))},{immediate:!0}),E(Z,de({props:c,states:l.states,selectRef:l.selectRef,optionsArray:l.optionsArray,setSelected:l.setSelected,handleOptionSelect:l.handleOptionSelect,onOptionCreate:l.onOptionCreate,onOptionDestroy:l.onOptionDestroy}));let ee=B(()=>e.multiple?l.states.selected.map(e=>e.currentLabel):l.states.selectedLabel);return r(()=>{let e=$.get(i.appContext);e&&(--e.count,e.count<=0&&(i.appContext.config.warnHandler=e.originalWarnHandler,$.delete(i.appContext)))}),{...l,modelValue:o,selectedLabel:ee,calculatorRef:u,inputStyle:f,getLabel:m,getValue:h,getOptions:g,getDisabled:_,getOptionProps:v}}}),kt=[`id`,`value`,`name`,`disabled`,`autocomplete`,`tabindex`,`readonly`,`aria-activedescendant`,`aria-controls`,`aria-expanded`,`aria-label`],At=[`textContent`],jt={key:1};function Mt(n,r,i,a,o,s){let l=y(`el-tag`),u=y(`el-tooltip`),d=y(`el-icon`),f=y(`el-option`),p=y(`el-option-group`),m=y(`el-options`),g=y(`el-scrollbar`),_=y(`el-select-menu`),v=e(`click-outside`);return ye((c(),S(`div`,b({ref:`selectRef`,class:[n.nsSelect.b(),n.nsSelect.m(n.selectSize)]},{[k(n.mouseEnterEventName)]:r[10]||=e=>n.states.inputHovering=!0},{onMouseleave:r[11]||=e=>n.states.inputHovering=!1}),[F(u,{ref:`tooltipRef`,visible:n.dropdownMenuVisible,placement:n.placement,teleported:n.teleported,"popper-class":[n.nsSelect.e(`popper`),n.popperClass],"popper-style":n.popperStyle,"popper-options":n.popperOptions,"fallback-placements":n.fallbackPlacements,effect:n.effect,pure:``,trigger:`click`,transition:`${n.nsSelect.namespace.value}-zoom-in-top`,"stop-popper-mouse-event":!1,"gpu-acceleration":!1,persistent:n.persistent,"append-to":n.appendTo,"show-arrow":n.showArrow,offset:n.offset,onBeforeShow:n.handleMenuEnter,onHide:r[9]||=e=>n.states.isBeforeHide=!1},{default:I(()=>[x(`div`,{ref:`wrapperRef`,class:L([n.nsSelect.e(`wrapper`),n.nsSelect.is(`focused`,n.isFocused),n.nsSelect.is(`hovering`,n.states.inputHovering),n.nsSelect.is(`filterable`,n.filterable),n.nsSelect.is(`disabled`,n.selectDisabled)]),onClick:r[6]||=J((...e)=>n.toggleMenu&&n.toggleMenu(...e),[`prevent`])},[n.$slots.prefix?(c(),S(`div`,{key:0,ref:`prefixRef`,class:L(n.nsSelect.e(`prefix`))},[O(n.$slots,`prefix`)],2)):z(`v-if`,!0),x(`div`,{ref:`selectionRef`,class:L([n.nsSelect.e(`selection`),n.nsSelect.is(`near`,n.multiple&&!n.$slots.prefix&&!!n.states.selected.length)])},[n.multiple?O(n.$slots,`tag`,{key:0,data:n.states.selected,deleteTag:n.deleteTag,selectDisabled:n.selectDisabled},()=>[(c(!0),S(N,null,w(n.showTagList,e=>(c(),S(`div`,{key:n.getValueKey(e),class:L(n.nsSelect.e(`selected-item`))},[F(l,{closable:!n.selectDisabled&&!e.isDisabled,size:n.collapseTagSize,type:n.tagType,effect:n.tagEffect,"disable-transitions":``,style:D(n.tagStyle),onClose:t=>n.deleteTag(t,e)},{default:I(()=>[x(`span`,{class:L(n.nsSelect.e(`tags-text`))},[O(n.$slots,`label`,{index:e.index,label:e.currentLabel,value:e.value},()=>[h(T(e.currentLabel),1)])],2)]),_:2},1032,[`closable`,`size`,`type`,`effect`,`style`,`onClose`])],2))),128)),n.collapseTags&&n.states.selected.length>n.maxCollapseTags?(c(),t(u,{key:0,ref:`tagTooltipRef`,disabled:n.dropdownMenuVisible||!n.collapseTagsTooltip,"fallback-placements":[`bottom`,`top`,`right`,`left`],effect:n.effect,placement:`bottom`,"popper-class":n.popperClass,"popper-style":n.popperStyle,teleported:n.teleported,"popper-options":n.popperOptions},{default:I(()=>[x(`div`,{ref:`collapseItemRef`,class:L(n.nsSelect.e(`selected-item`))},[F(l,{closable:!1,size:n.collapseTagSize,type:n.tagType,effect:n.tagEffect,"disable-transitions":``,style:D(n.collapseTagStyle)},{default:I(()=>[x(`span`,{class:L(n.nsSelect.e(`tags-text`))},` + `+T(n.states.selected.length-n.maxCollapseTags),3)]),_:1},8,[`size`,`type`,`effect`,`style`])],2)]),content:I(()=>[x(`div`,{ref:`tagMenuRef`,class:L(n.nsSelect.e(`selection`))},[(c(!0),S(N,null,w(n.collapseTagList,e=>(c(),S(`div`,{key:n.getValueKey(e),class:L(n.nsSelect.e(`selected-item`))},[F(l,{class:`in-tooltip`,closable:!n.selectDisabled&&!e.isDisabled,size:n.collapseTagSize,type:n.tagType,effect:n.tagEffect,"disable-transitions":``,onClose:t=>n.deleteTag(t,e)},{default:I(()=>[x(`span`,{class:L(n.nsSelect.e(`tags-text`))},[O(n.$slots,`label`,{index:e.index,label:e.currentLabel,value:e.value},()=>[h(T(e.currentLabel),1)])],2)]),_:2},1032,[`closable`,`size`,`type`,`effect`,`onClose`])],2))),128))],2)]),_:3},8,[`disabled`,`effect`,`popper-class`,`popper-style`,`teleported`,`popper-options`])):z(`v-if`,!0)]):z(`v-if`,!0),x(`div`,{class:L([n.nsSelect.e(`selected-item`),n.nsSelect.e(`input-wrapper`),n.nsSelect.is(`hidden`,!n.filterable||n.selectDisabled)])},[x(`input`,{id:n.inputId,ref:`inputRef`,value:n.states.inputValue,type:`text`,name:n.name,class:L([n.nsSelect.e(`input`),n.nsSelect.is(n.selectSize)]),disabled:n.selectDisabled,autocomplete:n.autocomplete,style:D(n.inputStyle),tabindex:n.tabindex,role:`combobox`,readonly:!n.filterable,spellcheck:`false`,"aria-activedescendant":n.hoverOption?.id||``,"aria-controls":n.contentId,"aria-expanded":n.dropdownMenuVisible,"aria-label":n.ariaLabel,"aria-autocomplete":`none`,"aria-haspopup":`listbox`,onKeydown:r[0]||=(...e)=>n.handleKeydown&&n.handleKeydown(...e),onCompositionstart:r[1]||=(...e)=>n.handleCompositionStart&&n.handleCompositionStart(...e),onCompositionupdate:r[2]||=(...e)=>n.handleCompositionUpdate&&n.handleCompositionUpdate(...e),onCompositionend:r[3]||=(...e)=>n.handleCompositionEnd&&n.handleCompositionEnd(...e),onInput:r[4]||=(...e)=>n.onInput&&n.onInput(...e),onClick:r[5]||=J((...e)=>n.toggleMenu&&n.toggleMenu(...e),[`stop`])},null,46,kt),n.filterable?(c(),S(`span`,{key:0,ref:`calculatorRef`,"aria-hidden":`true`,class:L(n.nsSelect.e(`input-calculator`)),textContent:T(n.states.inputValue)},null,10,At)):z(`v-if`,!0)],2),n.shouldShowPlaceholder?(c(),S(`div`,{key:1,class:L([n.nsSelect.e(`selected-item`),n.nsSelect.e(`placeholder`),n.nsSelect.is(`transparent`,!n.hasModelValue||n.expanded&&!n.states.inputValue)])},[n.hasModelValue?O(n.$slots,`label`,{key:0,index:n.getOption(n.modelValue).index,label:n.currentPlaceholder,value:n.modelValue},()=>[x(`span`,null,T(n.currentPlaceholder),1)]):(c(),S(`span`,jt,T(n.currentPlaceholder),1))],2)):z(`v-if`,!0)],2),x(`div`,{ref:`suffixRef`,class:L(n.nsSelect.e(`suffix`))},[n.iconComponent&&!n.showClearBtn?(c(),t(d,{key:0,class:L([n.nsSelect.e(`caret`),n.nsSelect.e(`icon`),n.iconReverse])},{default:I(()=>[(c(),t(M(n.iconComponent)))]),_:1},8,[`class`])):z(`v-if`,!0),n.showClearBtn&&n.clearIcon?(c(),t(d,{key:1,class:L([n.nsSelect.e(`caret`),n.nsSelect.e(`icon`),n.nsSelect.e(`clear`)]),onClick:n.handleClearClick},{default:I(()=>[(c(),t(M(n.clearIcon)))]),_:1},8,[`class`,`onClick`])):z(`v-if`,!0),n.validateState&&n.validateIcon&&n.needStatusIcon?(c(),t(d,{key:2,class:L([n.nsInput.e(`icon`),n.nsInput.e(`validateIcon`),n.nsInput.is(`loading`,n.validateState===`validating`)])},{default:I(()=>[(c(),t(M(n.validateIcon)))]),_:1},8,[`class`])):z(`v-if`,!0)],2)],2)]),content:I(()=>[F(_,{ref:`menuRef`},{default:I(()=>[n.$slots.header?(c(),S(`div`,{key:0,class:L(n.nsSelect.be(`dropdown`,`header`)),onClick:r[7]||=J(()=>{},[`stop`])},[O(n.$slots,`header`)],2)):z(`v-if`,!0),ye(F(g,{id:n.contentId,ref:`scrollbarRef`,tag:`ul`,"wrap-class":n.nsSelect.be(`dropdown`,`wrap`),"view-class":n.nsSelect.be(`dropdown`,`list`),class:L([n.nsSelect.is(`empty`,n.filteredOptionsCount===0)]),role:`listbox`,"aria-label":n.ariaLabel,"aria-orientation":`vertical`,onScroll:n.popupScroll},{default:I(()=>[n.showNewOption?(c(),t(f,{key:0,value:n.states.inputValue,created:!0},null,8,[`value`])):z(`v-if`,!0),F(m,null,{default:I(()=>[O(n.$slots,`default`,{},()=>[(c(!0),S(N,null,w(n.options,(e,r)=>(c(),S(N,{key:r},[n.getOptions(e)?.length?(c(),t(p,{key:0,label:n.getLabel(e),disabled:n.getDisabled(e)},{default:I(()=>[(c(!0),S(N,null,w(n.getOptions(e),e=>(c(),t(f,b({key:n.getValue(e)},{ref_for:!0},n.getOptionProps(e)),null,16))),128))]),_:2},1032,[`label`,`disabled`])):(c(),t(f,b({key:1,ref_for:!0},n.getOptionProps(e)),null,16))],64))),128))])]),_:3})]),_:3},8,[`id`,`wrap-class`,`view-class`,`class`,`aria-label`,`onScroll`]),[[tt,n.states.options.size>0&&!n.loading]]),n.$slots.loading&&n.loading?(c(),S(`div`,{key:1,class:L(n.nsSelect.be(`dropdown`,`loading`))},[O(n.$slots,`loading`)],2)):n.loading||n.filteredOptionsCount===0?(c(),S(`div`,{key:2,class:L(n.nsSelect.be(`dropdown`,`empty`))},[O(n.$slots,`empty`,{},()=>[x(`span`,null,T(n.emptyText),1)])],2)):z(`v-if`,!0),n.$slots.footer?(c(),S(`div`,{key:3,class:L(n.nsSelect.be(`dropdown`,`footer`)),onClick:r[8]||=J(()=>{},[`stop`])},[O(n.$slots,`footer`)],2)):z(`v-if`,!0)]),_:3},512)]),_:3},8,[`visible`,`placement`,`teleported`,`popper-class`,`popper-style`,`popper-options`,`fallback-placements`,`effect`,`transition`,`persistent`,`append-to`,`show-arrow`,`offset`,`onBeforeShow`])],16)),[[v,n.handleClickOutside,n.popperRef]])}var Nt=Se(Me(Ot,[[`render`,Mt]]),{Option:mt,OptionGroup:Ct}),Pt=xe(mt);xe(Ct);var Ft=fe({tag:{type:String,default:`div`},span:{type:Number,default:24},offset:{type:Number,default:0},pull:{type:Number,default:0},push:{type:Number,default:0},xs:{type:f([Number,Object]),default:()=>G({})},sm:{type:f([Number,Object]),default:()=>G({})},md:{type:f([Number,Object]),default:()=>G({})},lg:{type:f([Number,Object]),default:()=>G({})},xl:{type:f([Number,Object]),default:()=>G({})}}),It=Symbol(`rowContextKey`),Lt=Se(P({name:`ElCol`,__name:`col`,props:Ft,setup(e){let n=e,{gutter:r}=o(It,{gutter:B(()=>0)}),i=j(`col`),a=B(()=>{let e={};return r.value&&(e.paddingLeft=e.paddingRight=`${r.value/2}px`),e}),l=B(()=>{let e=[];return[`span`,`offset`,`pull`,`push`].forEach(t=>{let r=n[t];_e(r)&&(t===`span`?e.push(i.b(`${n[t]}`)):r>0&&e.push(i.b(`${t}-${n[t]}`)))}),[`xs`,`sm`,`md`,`lg`,`xl`].forEach(t=>{_e(n[t])?e.push(i.b(`${t}-${n[t]}`)):s(n[t])&&Object.entries(n[t]).forEach(([n,r])=>{e.push(n===`span`?i.b(`${t}-${r}`):i.b(`${t}-${n}-${r}`))})}),r.value&&e.push(i.is(`guttered`)),[i.b(),e]});return(n,r)=>(c(),t(M(e.tag),{class:L(l.value),style:D(a.value)},{default:I(()=>[O(n.$slots,`default`)]),_:3},8,[`class`,`style`]))}})),Rt=Se(P({name:`ElRow`,__name:`row`,props:fe({tag:{type:String,default:`div`},gutter:{type:Number,default:0},justify:{type:String,values:[`start`,`center`,`end`,`space-around`,`space-between`,`space-evenly`],default:`start`},align:{type:String,values:[`top`,`middle`,`bottom`]}}),setup(e){let n=e,r=j(`row`);E(It,{gutter:B(()=>n.gutter)});let i=B(()=>{let e={};return n.gutter&&(e.marginRight=e.marginLeft=`-${n.gutter/2}px`),e}),a=B(()=>[r.b(),r.is(`justify-${n.justify}`,n.justify!==`start`),r.is(`align-${n.align}`,!!n.align)]);return(n,r)=>(c(),t(M(e.tag),{class:L(a.value),style:D(i.value)},{default:I(()=>[O(n.$slots,`default`)]),_:3},8,[`class`,`style`]))}}));function zt(e){return` `.repeat(Math.max(0,e))}function Bt(e,t){let n=e;for(let[e,r]of Object.entries(t))n=n.replace(RegExp(`{{${e}}}`,`g`),r);return n}function Vt(e){return e.split(`
`).map(e=>e.replace(/(^\s*)|(\s*$)/g,``)).join(`
`)}function Ht(e){return!e||e.length===0?``:e.map(e=>zt(e.level??0)+`- `+e.name+`
`+Ht(e.chidren||[])).join(`
`)}function Ut(e,t){return!e||e.length===0?``:e.map(e=>zt(t)+`- `+e.name+`
`+Ut(e.chidren||[],t+1)).join(`
`)}function Wt(){return`
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
`}var Gt=[{name:`审视文章优缺点和建议`,value:`review`,variables:[{name:`docTitle`,label:`文档标题`,value:`{{doc}}`,description:`输入的文档标题`},{name:`inputContent`,label:`输入内容`,value:`
{{fileContent}}
`,description:`文档的原始内容`}],template:`
你是文章审阅与知识分析专家。

${Wt()}

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

${Wt()}

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

      `,generate:e=>e.template.replace(`{{docTitle}}`,e.docTitle).replace(`{{docOutline}}`,e.docOutline).replace(`{{inputContent}}`,e.inputContent)}],Kt=P({props:{doc:{type:String,required:!0}},data(){return{showDrawer:!1,llmMode:`review`,query:``,presets:Gt,currentTemplate:null,variableValues:{}}},watch:{doc(){this.handleModeChange()}},computed:{isDark(){return this.$store.state.isDarkMode}},methods:{async renderTemplate(e){let t=await this.$services.docService.getDocFileInfo(this.doc),n=await this.$services.docService.getContentByDocId(this.doc),r=await this.$services.categoryService.getCategoryList(),i=this.$services.tagService.getTagList(),a={};for(let o of e.variables)switch(o.name){case`docTitle`:a[o.name]=this.doc;break;case`inputContent`:a[o.name]=`---\n${t.content}\n---`;break;case`docOutline`:a[o.name]=`---\n${this.contents2String(n)}\n---`;break;case`knowledgeCatalog`:a[o.name]=`---\n${this.categories2String(r,0)}\n---`;break;case`availableTags`:a[o.name]=i.join(`,`);break;default:a[o.name]=o.value.replace(`{{doc}}`,this.doc).replace(`{{fileContent}}`,t.content).replace(`{{outline}}`,this.contents2String(n)).replace(`{{allCategories}}`,this.categories2String(r,0)).replace(`{{tags}}`,i.join(`,`));break}return Vt(Bt(e.template,a))},show(){this.showDrawer=!0},async handleModeChange(){let e=this.presets.find(e=>e.value===this.llmMode);if(e){this.currentTemplate=e;let t=await this.$services.docService.getDocFileInfo(this.doc),n=await this.$services.docService.getContentByDocId(this.doc),r=await this.$services.categoryService.getCategoryList(),i=this.$services.tagService.getTagList();this.variableValues={};for(let a of e.variables)switch(a.name){case`docTitle`:this.variableValues[a.name]=this.doc;break;case`inputContent`:this.variableValues[a.name]=`\n${t.content}\n`;break;case`docOutline`:this.variableValues[a.name]=`\n${this.contents2String(n)}\n`;break;case`knowledgeCatalog`:this.variableValues[a.name]=`\n${this.categories2String(r,0)}\n`;break;case`availableTags`:this.variableValues[a.name]=i.join(`,`);break;default:this.variableValues[a.name]=a.value.replace(`{{doc}}`,this.doc).replace(`{{fileContent}}`,t.content).replace(`{{outline}}`,this.contents2String(n)).replace(`{{allCategories}}`,this.categories2String(r,0)).replace(`{{tags}}`,i.join(`,`));break}this.updateTemplateContent()}},contents2String(e){return Ht(e)},categories2String(e,t){return Ut(e,t)},tab(e){return zt(e)},updateTemplateContent(){this.currentTemplate&&(this.query=Vt(Bt(this.currentTemplate.template,this.variableValues)))},handleQueryKeyUp(e){},handleCopy(){Xe(this.query),Ke.success(`复制成功`)}},async created(){let e=this.presets.find(e=>e.value===`review`);e&&(this.currentTemplate=e,this.query=await this.renderTemplate(e),this.handleModeChange())}}),qt={class:`llm-container`},Jt={key:0,class:`variables-section`};function Yt(e,n,r,i,a,o){let s=Pt,l=Nt,u=Lt,d=Rt,f=ze,p=Ze,m=Qe;return c(),t(m,{modelValue:e.showDrawer,"onUpdate:modelValue":n[2]||=t=>e.showDrawer=t,size:e.$isMobile()?`75%`:`44%`,direction:e.$isMobile()?`btt`:`rtl`,title:`模板生成问题`,modal:!1,onClose:n[3]||=t=>e.$emit(`close`),"lock-scroll":!1,"modal-penetrable":``,resizable:``},{default:I(()=>[x(`div`,qt,[F(d,{gutter:12},{default:I(()=>[F(u,{span:24},{default:I(()=>[n[4]||=h(` 问题模板： `,-1),F(l,{modelValue:e.llmMode,"onUpdate:modelValue":n[0]||=t=>e.llmMode=t,onChange:e.handleModeChange,style:{width:`100%`}},{default:I(()=>[(c(!0),S(N,null,w(e.presets,e=>(c(),t(s,{key:e.value,value:e.value,label:e.name},{default:I(()=>[h(T(e.name),1)]),_:2},1032,[`value`,`label`]))),128))]),_:1},8,[`modelValue`,`onChange`])]),_:1})]),_:1}),e.currentTemplate&&e.currentTemplate.variables.length>0?(c(),S(`div`,Jt,[n[5]||=x(`h4`,null,`模板变量`,-1),(c(!0),S(N,null,w(e.currentTemplate.variables,n=>(c(),t(d,{gutter:12,key:n.name,style:{"margin-bottom":`12px`}},{default:I(()=>[F(u,{span:24},{default:I(()=>[x(`label`,null,T(n.label),1),F(f,{type:`textarea`,rows:3,modelValue:e.variableValues[n.name],"onUpdate:modelValue":t=>e.variableValues[n.name]=t,placeholder:n.description,onInput:e.updateTemplateContent},null,8,[`modelValue`,`onUpdate:modelValue`,`placeholder`,`onInput`])]),_:2},1024)]),_:2},1024))),128))])):z(``,!0),F(f,{type:`textarea`,rows:`15`,modelValue:e.query,"onUpdate:modelValue":n[1]||=t=>e.query=t,onKeyup:e.handleQueryKeyUp},null,8,[`modelValue`,`onKeyup`]),F(d,{gutter:12,style:{"margin-top":`10px`}},{default:I(()=>[F(u,{span:24},{default:I(()=>[F(p,{type:`success`,onClick:e.handleCopy,style:{width:`100%`}},{default:I(()=>[...n[6]||=[h(`复制提问`,-1)]]),_:1},8,[`onClick`])]),_:1})]),_:1})])]),_:1},8,[`modelValue`,`size`,`direction`])}var Xt=ue(Kt,[[`render`,Yt],[`__scopeId`,`data-v-d3be6d16`]]);export{Xt as default};