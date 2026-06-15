import{$n as e,$r as t,$t as n,Bn as r,Cr as i,Dn as a,Dr as o,En as s,Fn as c,Ft as l,Gn as u,Gr as d,Gt as f,Hn as p,Ir as m,Jn as h,Lr as g,Mn as _,Mt as v,Nt as y,On as b,Pn as x,Pt as ee,Qn as te,Qr as S,Sr as ne,St as C,Tn as w,Tr as T,Tt as re,Vn as E,Vr as ie,Wt as ae,Xr as D,Xt as oe,Zn as O,Zt as se,a as ce,an as le,br as k,cr as ue,dn as A,dr as de,ei as fe,er as j,fn as pe,fr as M,in as me,jn as N,kt as he,l as ge,mn as _e,nr as ve,o as ye,pr as be,rr as P,sn as xe,t as Se,tr as F,ur as I,vn as L,vr as Ce,wn as R,x as we,zn as z,zr as B}from"./css-DsxGL-ra.js";import{t as Te}from"./toInteger-DPDP8BJY.js";import{r as Ee,t as V}from"./_baseIteratee-CgEJO1NW.js";import{_ as H,g as De,m as Oe,n as ke,v as Ae,x as U,y as je}from"./ConfigService-COZSB_rO.js";import{t as Me}from"./clamp-CE4Jg4bS.js";import{d as W,g as Ne,p as Pe}from"./css-hkAXo5Vo.js";import{i as Fe,n as Ie,t as Le}from"./css-tXrdKGxq.js";import{l as G,n as Re,r as ze,t as Be}from"./input-36kvn8xG.js";import{a as Ve,n as He,o as Ue,r as We,t as Ge}from"./use-form-item-CQG1Uupv.js";import{t as Ke}from"./css-CBCWl35J.js";import{a as K,i as qe,r as Je,t as Ye}from"./css-47LQj_bZ.js";import{t as Xe}from"./css-D8ouGBZ7.js";import{O as q,U as Ze,V as Qe,d as $e,gt as J,m as Y,mt as et,o as X,p as tt,r as nt,u as rt,z as Z}from"./index-BvRNQbzi.js";import"./css-CtGR4mJL.js";var it=Math.max,at=Math.min;function ot(e,t,n){var r=e==null?0:e.length;if(!r)return-1;var i=r-1;return n!==void 0&&(i=Te(n),i=n<0?it(r+i,0):at(i,r-1)),Ee(e,V(t,3),i,!0)}var st={label:`label`,value:`value`,disabled:`disabled`,options:`options`};function ct(e){let t=k({...st,...e.props}),n={...e.props};return I(()=>e.props,e=>{Y(e,n)||(t.value={...st,...e},n={...e})},{deep:!0}),{aliasProps:t,getLabel:e=>q(e,t.value.label),getValue:e=>q(e,t.value.value),getDisabled:e=>q(e,t.value.disabled),getOptions:e=>q(e,t.value.options)}}var lt=Symbol(`ElSelectGroup`),ut=Symbol(`ElSelect`),Q=`ElOption`,dt=v({value:{type:[String,Number,Boolean,Object],required:!0},label:{type:[String,Number]},created:Boolean,disabled:Boolean});function ft(e,t){let n=z(ut);n||l(Q,`usage: <el-select><el-option /></el-select/>`);let r=z(lt,{disabled:!1}),a=R(()=>p(U(n.props.modelValue),e.value)),o=R(()=>{if(n.props.multiple){let e=U(n.props.modelValue??[]);return!a.value&&e.length>=n.props.multipleLimit&&n.props.multipleLimit>0}else return!1}),s=R(()=>e.label??(B(e.value)?``:e.value)),u=R(()=>e.value||e.label||``),d=R(()=>e.disabled||t.groupDisabled||o.value),f=c(),p=(t=[],r)=>{if(B(e.value)){let e=n.props.valueKey;return t&&t.some(t=>i(q(t,e))===q(r,e))}else return t&&t.includes(r)};return I(()=>s.value,()=>{!e.created&&!n.props.remote&&n.setSelected()}),I(()=>e.value,(t,r)=>{let{remote:i,valueKey:a}=n.props;if((i?t!==r:!Y(t,r))&&(n.onOptionDestroy(r,f.proxy),n.onOptionCreate(f.proxy)),!e.created&&!i){if(a&&B(t)&&B(r)&&t[a]===r[a])return;n.setSelected()}}),I(()=>r.disabled,()=>{t.groupDisabled=r.disabled},{immediate:!0}),{select:n,currentLabel:s,currentValue:u,itemSelected:a,isDisabled:d,hoverItem:()=>{d.value||(n.states.hoveringIndex=n.optionsArray.indexOf(f.proxy))},updateOption:n=>{t.visible=new RegExp(Je(n),`i`).test(String(s.value))||e.created}}}var pt=x({name:Q,componentName:Q,props:dt,setup(e){let t=A(`select`),n=We(),r=R(()=>[t.be(`dropdown`,`item`),t.is(`disabled`,o(l)),t.is(`selected`,o(s)),t.is(`hovering`,o(g))]),i=Ce({index:-1,groupDisabled:!1,visible:!0,hover:!1}),{currentLabel:a,itemSelected:s,isDisabled:l,select:d,hoverItem:f,updateOption:m}=ft(e,i),{visible:h,hover:g}=T(i),_=c().proxy;d.onOptionCreate(_),u(()=>{let e=_.value;p(()=>{let{selected:t}=d.states,n=t.some(e=>e.value===_.value);d.states.cachedOptions.get(e)===_&&!n&&d.states.cachedOptions.delete(e)}),d.onOptionDestroy(e,_)});function v(){l.value||d.handleOptionSelect(_)}return{ns:t,id:n,containerKls:r,currentLabel:a,itemSelected:s,isDisabled:l,select:d,visible:h,hover:g,states:i,hoverItem:f,updateOption:m,selectOptionClick:v}}}),mt=[`id`,`aria-disabled`,`aria-selected`];function ht(e,n,r,i,a,o){return be((O(),b(`li`,{id:e.id,class:D(e.containerKls),role:`option`,"aria-disabled":e.isDisabled||void 0,"aria-selected":e.itemSelected,onMousemove:n[0]||=(...t)=>e.hoverItem&&e.hoverItem(...t),onClick:n[1]||=J((...t)=>e.selectOptionClick&&e.selectOptionClick(...t),[`stop`])},[j(e.$slots,`default`,{},()=>[w(`span`,null,t(e.currentLabel),1)])],42,mt)),[[et,e.visible]])}var gt=W(pt,[[`render`,ht]]),_t=x({name:`ElSelectDropdown`,componentName:`ElSelectDropdown`,setup(){let e=z(ut),t=A(`select`),n=R(()=>e.props.popperClass),r=R(()=>e.props.multiple),i=R(()=>e.props.fitInputWidth),a=k(``);function o(){let t=e.selectRef?.offsetWidth;t?a.value=`${t-2}px`:a.value=``}return h(()=>{o(),f(e.selectRef,o)}),{ns:t,minWidth:a,popperClass:n,isMultiple:r,isFitInputWidth:i}}});function vt(e,t,n,r,i,o){return O(),b(`div`,{class:D([e.ns.b(`dropdown`),e.ns.is(`multiple`,e.isMultiple),e.popperClass]),style:S({[e.isFitInputWidth?`width`:`minWidth`]:e.minWidth})},[e.$slots.header?(O(),b(`div`,{key:0,class:D(e.ns.be(`dropdown`,`header`))},[j(e.$slots,`header`)],2)):a(`v-if`,!0),j(e.$slots,`default`),e.$slots.footer?(O(),b(`div`,{key:1,class:D(e.ns.be(`dropdown`,`footer`))},[j(e.$slots,`footer`)],2)):a(`v-if`,!0)],6)}var yt=W(_t,[[`render`,vt]]),bt=(e,t)=>{let{t:r}=tt(),i=ue(),a=We(),o=A(`select`),s=A(`input`),c=Ce({inputValue:``,options:new Map,cachedOptions:new Map,optionValues:[],selected:[],selectionWidth:0,collapseItemWidth:0,selectedLabel:``,hoveringIndex:-1,previousQuery:null,inputHovering:!1,menuVisibleOnFocus:!1,isBeforeHide:!1}),l=k(),u=k(),d=k(),_=k(),v=k(),y=k(),b=k(),x=k(),te=k(),S=k(),ne=k(),C=k(!1),w=k(),T=k(!1),{form:re,formItem:E}=Ge(),{inputId:ae}=He(e,{formItemContext:E}),{valueOnClear:D,isEmptyValue:O}=rt(e),{isComposing:fe,handleCompositionStart:j,handleCompositionUpdate:M,handleCompositionEnd:N}=Re({afterComposition:e=>J(e)}),he=Ve(),{wrapperRef:ge,isFocused:_e,handleBlur:ve}=ze(v,{disabled:he,afterFocus(){e.automaticDropdown&&!C.value&&(C.value=!0,c.menuVisibleOnFocus=!0)},beforeBlur(e){return d.value?.isFocusInsideContent(e)||_.value?.isFocusInsideContent(e)},afterBlur(){var t;C.value=!1,c.menuVisibleOnFocus=!1,e.validateEvent&&((t=E?.validate)==null||t.call(E,`blur`).catch(e=>ee(e)))}}),ye=R(()=>m(e.modelValue)?e.modelValue.length>0:!O(e.modelValue)),be=R(()=>re?.statusIcon??!1),P=R(()=>e.clearable&&!he.value&&ye.value&&(_e.value||c.inputHovering)),Se=R(()=>e.remote&&e.filterable&&!e.remoteShowSuffix?``:e.suffixIcon),F=R(()=>o.is(`reverse`,!!(Se.value&&C.value))),L=R(()=>E?.validateState||``),we=R(()=>L.value&&ce[L.value]),z=R(()=>e.remote?e.debounce:0),Te=R(()=>e.remote&&!c.inputValue&&c.options.size===0),Ee=R(()=>e.loading?e.loadingText||r(`el.select.loading`):e.filterable&&c.inputValue&&c.options.size>0&&V.value===0?e.noMatchText||r(`el.select.noMatch`):c.options.size===0?e.noDataText||r(`el.select.noData`):null),V=R(()=>H.value.filter(e=>e.visible).length),H=R(()=>{let e=Array.from(c.options.values()),t=[];return c.optionValues.forEach(n=>{let r=e.findIndex(e=>e.value===n);r>-1&&t.push(e[r])}),t.length>=e.length?t:e}),De=R(()=>Array.from(c.cachedOptions.values())),Oe=R(()=>{let t=H.value.filter(e=>!e.created).some(e=>e.currentLabel===c.inputValue);return e.filterable&&e.allowCreate&&c.inputValue!==``&&!t}),ke=()=>{e.filterable&&g(e.filterMethod)||e.filterable&&e.remote&&g(e.remoteMethod)||H.value.forEach(e=>{var t;(t=e.updateOption)==null||t.call(e,c.inputValue)})},Ae=Ue(),je=R(()=>[`small`].includes(Ae.value)?`small`:`default`),W=R({get(){return C.value&&(e.loading||!Te.value||e.remote&&!!i.empty)&&(!T.value||!me(c.previousQuery))},set(e){C.value=e}}),Pe=R(()=>{if(e.multiple&&!xe(e.modelValue))return U(e.modelValue).length===0&&!c.inputValue;let t=m(e.modelValue)?e.modelValue[0]:e.modelValue;return e.filterable||xe(t)?!c.inputValue:!0}),Le=R(()=>{let t=e.placeholder??r(`el.select.placeholder`);return e.multiple||!ye.value?t:c.selectedLabel}),G=R(()=>se?null:`mouseenter`);I(()=>e.modelValue,(t,n)=>{e.multiple&&e.filterable&&!e.reserveKeyword&&(c.inputValue=``,Be(``)),K(),!Y(t,n)&&e.validateEvent&&E?.validate(`change`).catch(e=>ee(e))},{flush:`post`,deep:!0}),I(()=>C.value,e=>{e?Be(c.inputValue):(c.inputValue=``,c.previousQuery=null,c.isBeforeHide=!0,c.menuVisibleOnFocus=!1)}),I(()=>c.options.entries(),()=>{oe&&(K(),e.defaultFirstOption&&(e.filterable||e.remote)&&V.value&&Ke())},{flush:`post`}),I([()=>c.hoveringIndex,H],([e])=>{le(e)&&e>-1?w.value=H.value[e]||{}:w.value={},H.value.forEach(e=>{e.hover=w.value===e})}),de(()=>{c.isBeforeHide||ke()});let Be=t=>{c.previousQuery===t||fe.value||(c.previousQuery=t,e.filterable&&g(e.filterMethod)?e.filterMethod(t):e.filterable&&e.remote&&g(e.remoteMethod)&&e.remoteMethod(t),e.defaultFirstOption&&(e.filterable||e.remote)&&V.value?p(Ke):p(Je))},Ke=()=>{let e=H.value.filter(e=>e.visible&&!e.disabled&&!e.states.groupDisabled),t=e.find(e=>e.created),n=e[0];c.hoveringIndex=ut(H.value.map(e=>e.value),t||n)},K=()=>{if(e.multiple)c.selectedLabel=``;else{let t=qe(m(e.modelValue)?e.modelValue[0]:e.modelValue);c.selectedLabel=t.currentLabel,c.selected=[t];return}let t=[];xe(e.modelValue)||U(e.modelValue).forEach(e=>{t.push(qe(e))}),c.selected=t},qe=t=>{let n,r=ie(t);for(let i=c.cachedOptions.size-1;i>=0;i--){let a=De.value[i];if(r?q(a.value,e.valueKey)===q(t,e.valueKey):a.value===t){n={index:H.value.filter(e=>!e.created).indexOf(a),value:t,currentLabel:a.currentLabel,get isDisabled(){return a.isDisabled}};break}}return n||{index:-1,value:t,currentLabel:r?t.label:t??``}},Je=()=>{let e=c.selected.length;if(e>0){let t=c.selected[e-1];c.hoveringIndex=H.value.findIndex(e=>St(t)===St(e))}else c.hoveringIndex=-1},Ye=()=>{c.selectionWidth=Number.parseFloat(window.getComputedStyle(u.value).width)},Xe=()=>{c.collapseItemWidth=S.value.getBoundingClientRect().width},Ze=()=>{var e,t;(t=(e=d.value)?.updatePopper)==null||t.call(e)},Qe=()=>{var e,t;(t=(e=_.value)?.updatePopper)==null||t.call(e)},$e=()=>{c.inputValue.length>0&&!C.value&&(C.value=!0),Be(c.inputValue)},J=t=>{if(c.inputValue=t.target.value,e.remote)T.value=!0,et();else return $e()},et=n(()=>{$e(),T.value=!1},z),Z=n=>{Y(e.modelValue,n)||t(Ie,n)},it=e=>ot(e,e=>{let t=c.cachedOptions.get(e);return!t?.disabled&&!t?.states.groupDisabled}),at=n=>{let r=nt(n);if(e.multiple&&r!==X.delete&&n.target.value.length<=0){let n=U(e.modelValue).slice(),r=it(n);if(r<0)return;let i=n[r];n.splice(r,1),t(Fe,n),Z(n),t(`remove-tag`,i)}},st=(n,r)=>{let i=c.selected.indexOf(r);if(i>-1&&!he.value){let n=U(e.modelValue).slice();n.splice(i,1),t(Fe,n),Z(n),t(`remove-tag`,r.value)}n.stopPropagation(),ht()},ct=n=>{n.stopPropagation();let r=e.multiple?[]:D.value;if(e.multiple)for(let e of c.selected)e.isDisabled&&r.push(e.value);t(Fe,r),Z(r),c.hoveringIndex=-1,C.value=!1,t(`clear`),ht()},lt=n=>{if(e.multiple){let r=U(e.modelValue??[]).slice(),i=ut(r,n);i>-1?r.splice(i,1):(e.multipleLimit<=0||r.length<e.multipleLimit)&&r.push(n.value),t(Fe,r),Z(r),n.created&&Be(``),e.filterable&&!e.reserveKeyword&&(c.inputValue=``)}else !Y(e.modelValue,n.value)&&t(`update:modelValue`,n.value),Z(n.value),C.value=!1;ht(),!C.value&&p(()=>{Q(n)})},ut=(t,n)=>xe(n)?-1:B(n.value)?t.findIndex(t=>Y(q(t,e.valueKey),St(n))):t.indexOf(n.value),Q=e=>{var t,n;let r=m(e)?e[e.length-1]:e,i=null;if(!pe(r?.value)){let e=H.value.filter(e=>e.value===r.value);e.length>0&&(i=e[0].$el)}if(d.value&&i){let e=((t=d.value?.popperRef?.contentRef)?.querySelector)?.call(t,`.${o.be(`dropdown`,`wrap`)}`);e&&Ne(e,i)}(n=ne.value)==null||n.handleScroll()},dt=e=>{c.options.set(e.value,e),c.cachedOptions.set(e.value,e)},ft=(e,t)=>{c.options.get(e)===t&&c.options.delete(e)},pt=R(()=>d.value?.popperRef?.contentRef),mt=()=>{c.isBeforeHide=!1,p(()=>{var e;(e=ne.value)==null||e.update(),Q(c.selected)})},ht=()=>{var e;(e=v.value)==null||e.focus()},gt=()=>{var e;if(C.value){C.value=!1,p(()=>v.value?.blur());return}(e=v.value)==null||e.blur()},_t=e=>{ct(e)},vt=e=>{if(C.value=!1,_e.value){let t=new FocusEvent(`blur`,e);p(()=>ve(t))}},yt=()=>{c.inputValue.length>0?c.inputValue=``:C.value=!1},bt=t=>{he.value||e.filterable&&C.value&&t&&!b.value?.contains(t.target)||(se&&(c.inputHovering=!0),c.menuVisibleOnFocus?c.menuVisibleOnFocus=!1:C.value=!C.value)},xt=()=>{if(!C.value)bt();else{let e=H.value[c.hoveringIndex];e&&!e.isDisabled&&lt(e)}},St=t=>B(t.value)?q(t.value,e.valueKey):t.value,Ct=R(()=>H.value.filter(e=>e.visible).every(e=>e.isDisabled)),wt=R(()=>e.multiple?e.collapseTags?c.selected.slice(0,e.maxCollapseTags):c.selected:[]),Tt=R(()=>e.multiple&&e.collapseTags?c.selected.slice(e.maxCollapseTags):[]),Et=e=>{if(!C.value){C.value=!0;return}if(!(c.options.size===0||V.value===0||fe.value)&&!Ct.value){e===`next`?(c.hoveringIndex++,c.hoveringIndex===c.options.size&&(c.hoveringIndex=0)):e===`prev`&&(c.hoveringIndex--,c.hoveringIndex<0&&(c.hoveringIndex=c.options.size-1));let t=H.value[c.hoveringIndex];(t.isDisabled||!t.visible)&&Et(e),p(()=>Q(w.value))}},Dt=(e,t,n,r)=>{for(let i=t;i>=0&&i<r;i+=n){let t=e[i];if(!t?.isDisabled&&t?.visible)return i}return null},$=(e,t)=>{let n=c.options.size;if(n===0)return;let r=Me(e,0,n-1),i=H.value,a=t===`up`?-1:1,o=Dt(i,r,a,n)??Dt(i,r-a,-a,n);o!=null&&(c.hoveringIndex=o,p(()=>Q(w.value)))},Ot=e=>{let t=nt(e),n=!0;switch(t){case X.up:Et(`prev`);break;case X.down:Et(`next`);break;case X.enter:case X.numpadEnter:fe.value||xt();break;case X.esc:yt();break;case X.backspace:n=!1,at(e);return;case X.home:if(!C.value)return;$(0,`down`);break;case X.end:if(!C.value)return;$(c.options.size-1,`up`);break;case X.pageUp:if(!C.value)return;$(c.hoveringIndex-10,`up`);break;case X.pageDown:if(!C.value)return;$(c.hoveringIndex+10,`down`);break;default:n=!1;break}n&&(e.preventDefault(),e.stopPropagation())},kt=()=>{if(!u.value)return 0;let e=window.getComputedStyle(u.value);return Number.parseFloat(e.gap||`6px`)},At=R(()=>{let t=kt(),n=e.filterable?t+11:0;return{maxWidth:`${S.value&&e.maxCollapseTags===1?c.selectionWidth-c.collapseItemWidth-t-n:c.selectionWidth-n}px`}}),jt=R(()=>({maxWidth:`${c.selectionWidth}px`})),Mt=e=>{t(`popup-scroll`,e)};f(u,Ye),f(ge,Ze),f(te,Qe),f(S,Xe);let Nt;return I(()=>W.value,e=>{e?Nt=f(x,Ze).stop:(Nt?.(),Nt=void 0),t(`visible-change`,e)}),h(()=>{K()}),{inputId:ae,contentId:a,nsSelect:o,nsInput:s,states:c,isFocused:_e,expanded:C,optionsArray:H,hoverOption:w,selectSize:Ae,filteredOptionsCount:V,updateTooltip:Ze,updateTagTooltip:Qe,debouncedOnInputChange:et,onInput:J,deletePrevTag:at,deleteTag:st,deleteSelected:ct,handleOptionSelect:lt,scrollToOption:Q,hasModelValue:ye,shouldShowPlaceholder:Pe,currentPlaceholder:Le,mouseEnterEventName:G,needStatusIcon:be,showClearBtn:P,iconComponent:Se,iconReverse:F,validateState:L,validateIcon:we,showNewOption:Oe,updateOptions:ke,collapseTagSize:je,setSelected:K,selectDisabled:he,emptyText:Ee,handleCompositionStart:j,handleCompositionUpdate:M,handleCompositionEnd:N,handleKeydown:Ot,onOptionCreate:dt,onOptionDestroy:ft,handleMenuEnter:mt,focus:ht,blur:gt,handleClearClick:_t,handleClickOutside:vt,handleEsc:yt,toggleMenu:bt,selectOption:xt,getValueKey:St,navigateOptions:Et,dropdownMenuVisible:W,showTagList:wt,collapseTagList:Tt,popupScroll:Mt,getOption:qe,tagStyle:At,collapseTagStyle:jt,popperRef:pt,inputRef:v,tooltipRef:d,tagTooltipRef:_,prefixRef:y,suffixRef:b,selectRef:l,wrapperRef:ge,selectionRef:u,scrollbarRef:ne,menuRef:x,tagMenuRef:te,collapseItemRef:S}},xt=x({name:`ElOptions`,setup(e,{slots:t}){let n=z(ut),r=[];return()=>{let e=t.default?.call(t),i=[];function a(e){m(e)&&e.forEach(e=>{let t=(e?.type||{})?.name;t===`ElOptionGroup`?a(!d(e.children)&&!m(e.children)&&g(e.children?.default)?e.children?.default():e.children):t===`ElOption`?i.push(e.props?.value):m(e.children)&&a(e.children)})}return e.length&&a(e[0]?.children),Y(i,r)||(r=i,n&&(n.states.optionValues=i)),e}}}),St=v({name:String,id:String,modelValue:{type:y([Array,String,Number,Boolean,Object]),default:void 0},autocomplete:{type:String,default:`off`},automaticDropdown:Boolean,size:he,effect:{type:y(String),default:`light`},disabled:{type:Boolean,default:void 0},clearable:Boolean,filterable:Boolean,allowCreate:Boolean,loading:Boolean,popperClass:{type:String,default:``},popperStyle:{type:y([String,Object])},popperOptions:{type:y(Object),default:()=>({})},remote:Boolean,debounce:{type:Number,default:300},loadingText:String,noMatchText:String,noDataText:String,remoteMethod:{type:y(Function)},filterMethod:{type:y(Function)},multiple:Boolean,multipleLimit:{type:Number,default:0},placeholder:{type:String},defaultFirstOption:Boolean,reserveKeyword:{type:Boolean,default:!0},valueKey:{type:String,default:`value`},collapseTags:Boolean,collapseTagsTooltip:Boolean,maxCollapseTags:{type:Number,default:1},teleported:Ae.teleported,persistent:{type:Boolean,default:!0},clearIcon:{type:ye,default:we},fitInputWidth:Boolean,suffixIcon:{type:ye,default:ge},tagType:{...K.type,default:`info`},tagEffect:{...K.effect,default:`light`},validateEvent:{type:Boolean,default:!0},remoteShowSuffix:Boolean,showArrow:{type:Boolean,default:!0},offset:{type:Number,default:12},placement:{type:y(String),values:je,default:`bottom-start`},fallbackPlacements:{type:y(Array),default:[`bottom-start`,`top-start`,`right`,`left`]},tabindex:{type:[String,Number],default:0},appendTo:Ae.appendTo,options:{type:y(Array)},props:{type:y(Object),default:()=>st},...$e,...Le([`ariaLabel`])});H.scroll;var Ct=x({name:`ElOptionGroup`,componentName:`ElOptionGroup`,props:{label:String,disabled:Boolean},setup(e){let t=A(`select`),n=k(),i=c(),a=k([]);te(lt,Ce({...T(e)}));let o=R(()=>a.value.some(e=>e.visible===!0)),s=e=>e.type.name===`ElOption`&&!!e.component?.proxy,l=e=>{let t=U(e),n=[];return t.forEach(e=>{r(e)&&(s(e)?n.push(e.component.proxy):m(e.children)&&e.children.length?n.push(...l(e.children)):e.component?.subTree&&n.push(...l(e.component.subTree)))}),n},u=()=>{a.value=l(i.subTree)};return h(()=>{u()}),ae(n,u,{attributes:!0,subtree:!0,childList:!0}),{groupRef:n,visible:o,ns:t}}});function wt(e,n,r,i,a,o){return be((O(),b(`ul`,{ref:`groupRef`,class:D(e.ns.be(`group`,`wrap`))},[w(`li`,{class:D(e.ns.be(`group`,`title`))},t(e.label),3),w(`li`,null,[w(`ul`,{class:D(e.ns.b(`group`))},[j(e.$slots,`default`)],2)])],2)),[[et,e.visible]])}var Tt=W(Ct,[[`render`,wt]]);function Et(){let e=ne(),t=k(0),n=R(()=>({minWidth:`${Math.max(t.value,11)}px`}));return f(e,()=>{t.value=e.value?.getBoundingClientRect().width??0}),{calculatorRef:e,calculatorWidth:t,inputStyle:n}}var Dt=`ElSelect`,$=new WeakMap,Ot=e=>(...t)=>{let n=t[0];if(!n||n.includes(`Slot "default" invoked outside of the render function`)&&t[2]?.includes(`ElTreeSelect`))return;let r=$.get(e)?.originalWarnHandler;if(r){r(...t);return}console.warn(...t)},kt=e=>{let t=$.get(e);return t||(t={originalWarnHandler:e.config.warnHandler,handler:Ot(e),count:0},$.set(e,t)),t},At=x({name:Dt,componentName:Dt,components:{ElSelectMenu:yt,ElOption:gt,ElOptions:xt,ElOptionGroup:Tt,ElTag:qe,ElScrollbar:De,ElTooltip:Oe,ElIcon:Se},directives:{ClickOutside:Ye},props:St,emits:[Fe,Ie,`remove-tag`,`clear`,`visible-change`,`focus`,`blur`,`popup-scroll`],setup(e,{emit:t,slots:n}){let r=c(),i=kt(r.appContext);i.count+=1,r.appContext.config.warnHandler=i.handler;let a=R(()=>{let{modelValue:t,multiple:n}=e,r=n?[]:void 0;return m(t)?n?t:r:n?r:t}),o=Ce({...T(e),modelValue:a}),s=bt(o,t),{calculatorRef:l,inputStyle:d}=Et(),{getLabel:f,getValue:p,getOptions:h,getDisabled:g}=ct(e),_=e=>({label:f(e),value:p(e),disabled:g(e)}),v=e=>e.reduce((e,t)=>(e.push(t),t.children&&t.children.length>0&&e.push(...v(t.children)),e),[]),y=e=>{Pe(e||[]).forEach(e=>{if(B(e)&&(e.type.name===`ElOption`||e.type.name===`ElTree`)){let t=e.type.name;if(t===`ElTree`)v(e.props?.data||[]).forEach(e=>{e.currentLabel=e.label||(B(e.value)?``:e.value),s.onOptionCreate(e)});else if(t===`ElOption`){let t={...e.props};t.currentLabel=t.label||(B(t.value)?``:t.value),s.onOptionCreate(t)}}})};I(()=>[n.default?.call(n),a.value],()=>{e.persistent||s.expanded.value||(s.states.options.clear(),y(n.default?.call(n)))},{immediate:!0}),te(ut,Ce({props:o,states:s.states,selectRef:s.selectRef,optionsArray:s.optionsArray,setSelected:s.setSelected,handleOptionSelect:s.handleOptionSelect,onOptionCreate:s.onOptionCreate,onOptionDestroy:s.onOptionDestroy}));let b=R(()=>e.multiple?s.states.selected.map(e=>e.currentLabel):s.states.selectedLabel);return u(()=>{let e=$.get(r.appContext);e&&(--e.count,e.count<=0&&(r.appContext.config.warnHandler=e.originalWarnHandler,$.delete(r.appContext)))}),{...s,modelValue:a,selectedLabel:b,calculatorRef:l,inputStyle:d,getLabel:f,getValue:p,getOptions:h,getDisabled:g,getOptionProps:_}}}),jt=[`id`,`value`,`name`,`disabled`,`autocomplete`,`tabindex`,`readonly`,`aria-activedescendant`,`aria-controls`,`aria-expanded`,`aria-label`],Mt=[`textContent`],Nt={key:1};function Pt(n,r,i,o,c,l){let u=F(`el-tag`),d=F(`el-tooltip`),f=F(`el-icon`),p=F(`el-option`),m=F(`el-option-group`),h=F(`el-options`),g=F(`el-scrollbar`),v=F(`el-select-menu`),y=ve(`click-outside`);return be((O(),b(`div`,E({ref:`selectRef`,class:[n.nsSelect.b(),n.nsSelect.m(n.selectSize)]},{[fe(n.mouseEnterEventName)]:r[10]||=e=>n.states.inputHovering=!0},{onMouseleave:r[11]||=e=>n.states.inputHovering=!1}),[_(d,{ref:`tooltipRef`,visible:n.dropdownMenuVisible,placement:n.placement,teleported:n.teleported,"popper-class":[n.nsSelect.e(`popper`),n.popperClass],"popper-style":n.popperStyle,"popper-options":n.popperOptions,"fallback-placements":n.fallbackPlacements,effect:n.effect,pure:``,trigger:`click`,transition:`${n.nsSelect.namespace.value}-zoom-in-top`,"stop-popper-mouse-event":!1,"gpu-acceleration":!1,persistent:n.persistent,"append-to":n.appendTo,"show-arrow":n.showArrow,offset:n.offset,onBeforeShow:n.handleMenuEnter,onHide:r[9]||=e=>n.states.isBeforeHide=!1},{default:M(()=>[w(`div`,{ref:`wrapperRef`,class:D([n.nsSelect.e(`wrapper`),n.nsSelect.is(`focused`,n.isFocused),n.nsSelect.is(`hovering`,n.states.inputHovering),n.nsSelect.is(`filterable`,n.filterable),n.nsSelect.is(`disabled`,n.selectDisabled)]),onClick:r[6]||=J((...e)=>n.toggleMenu&&n.toggleMenu(...e),[`prevent`])},[n.$slots.prefix?(O(),b(`div`,{key:0,ref:`prefixRef`,class:D(n.nsSelect.e(`prefix`))},[j(n.$slots,`prefix`)],2)):a(`v-if`,!0),w(`div`,{ref:`selectionRef`,class:D([n.nsSelect.e(`selection`),n.nsSelect.is(`near`,n.multiple&&!n.$slots.prefix&&!!n.states.selected.length)])},[n.multiple?j(n.$slots,`tag`,{key:0,data:n.states.selected,deleteTag:n.deleteTag,selectDisabled:n.selectDisabled},()=>[(O(!0),b(L,null,e(n.showTagList,e=>(O(),b(`div`,{key:n.getValueKey(e),class:D(n.nsSelect.e(`selected-item`))},[_(u,{closable:!n.selectDisabled&&!e.isDisabled,size:n.collapseTagSize,type:n.tagType,effect:n.tagEffect,"disable-transitions":``,style:S(n.tagStyle),onClose:t=>n.deleteTag(t,e)},{default:M(()=>[w(`span`,{class:D(n.nsSelect.e(`tags-text`))},[j(n.$slots,`label`,{index:e.index,label:e.currentLabel,value:e.value},()=>[N(t(e.currentLabel),1)])],2)]),_:2},1032,[`closable`,`size`,`type`,`effect`,`style`,`onClose`])],2))),128)),n.collapseTags&&n.states.selected.length>n.maxCollapseTags?(O(),s(d,{key:0,ref:`tagTooltipRef`,disabled:n.dropdownMenuVisible||!n.collapseTagsTooltip,"fallback-placements":[`bottom`,`top`,`right`,`left`],effect:n.effect,placement:`bottom`,"popper-class":n.popperClass,"popper-style":n.popperStyle,teleported:n.teleported,"popper-options":n.popperOptions},{default:M(()=>[w(`div`,{ref:`collapseItemRef`,class:D(n.nsSelect.e(`selected-item`))},[_(u,{closable:!1,size:n.collapseTagSize,type:n.tagType,effect:n.tagEffect,"disable-transitions":``,style:S(n.collapseTagStyle)},{default:M(()=>[w(`span`,{class:D(n.nsSelect.e(`tags-text`))},` + `+t(n.states.selected.length-n.maxCollapseTags),3)]),_:1},8,[`size`,`type`,`effect`,`style`])],2)]),content:M(()=>[w(`div`,{ref:`tagMenuRef`,class:D(n.nsSelect.e(`selection`))},[(O(!0),b(L,null,e(n.collapseTagList,e=>(O(),b(`div`,{key:n.getValueKey(e),class:D(n.nsSelect.e(`selected-item`))},[_(u,{class:`in-tooltip`,closable:!n.selectDisabled&&!e.isDisabled,size:n.collapseTagSize,type:n.tagType,effect:n.tagEffect,"disable-transitions":``,onClose:t=>n.deleteTag(t,e)},{default:M(()=>[w(`span`,{class:D(n.nsSelect.e(`tags-text`))},[j(n.$slots,`label`,{index:e.index,label:e.currentLabel,value:e.value},()=>[N(t(e.currentLabel),1)])],2)]),_:2},1032,[`closable`,`size`,`type`,`effect`,`onClose`])],2))),128))],2)]),_:3},8,[`disabled`,`effect`,`popper-class`,`popper-style`,`teleported`,`popper-options`])):a(`v-if`,!0)]):a(`v-if`,!0),w(`div`,{class:D([n.nsSelect.e(`selected-item`),n.nsSelect.e(`input-wrapper`),n.nsSelect.is(`hidden`,!n.filterable||n.selectDisabled)])},[w(`input`,{id:n.inputId,ref:`inputRef`,value:n.states.inputValue,type:`text`,name:n.name,class:D([n.nsSelect.e(`input`),n.nsSelect.is(n.selectSize)]),disabled:n.selectDisabled,autocomplete:n.autocomplete,style:S(n.inputStyle),tabindex:n.tabindex,role:`combobox`,readonly:!n.filterable,spellcheck:`false`,"aria-activedescendant":n.hoverOption?.id||``,"aria-controls":n.contentId,"aria-expanded":n.dropdownMenuVisible,"aria-label":n.ariaLabel,"aria-autocomplete":`none`,"aria-haspopup":`listbox`,onKeydown:r[0]||=(...e)=>n.handleKeydown&&n.handleKeydown(...e),onCompositionstart:r[1]||=(...e)=>n.handleCompositionStart&&n.handleCompositionStart(...e),onCompositionupdate:r[2]||=(...e)=>n.handleCompositionUpdate&&n.handleCompositionUpdate(...e),onCompositionend:r[3]||=(...e)=>n.handleCompositionEnd&&n.handleCompositionEnd(...e),onInput:r[4]||=(...e)=>n.onInput&&n.onInput(...e),onClick:r[5]||=J((...e)=>n.toggleMenu&&n.toggleMenu(...e),[`stop`])},null,46,jt),n.filterable?(O(),b(`span`,{key:0,ref:`calculatorRef`,"aria-hidden":`true`,class:D(n.nsSelect.e(`input-calculator`)),textContent:t(n.states.inputValue)},null,10,Mt)):a(`v-if`,!0)],2),n.shouldShowPlaceholder?(O(),b(`div`,{key:1,class:D([n.nsSelect.e(`selected-item`),n.nsSelect.e(`placeholder`),n.nsSelect.is(`transparent`,!n.hasModelValue||n.expanded&&!n.states.inputValue)])},[n.hasModelValue?j(n.$slots,`label`,{key:0,index:n.getOption(n.modelValue).index,label:n.currentPlaceholder,value:n.modelValue},()=>[w(`span`,null,t(n.currentPlaceholder),1)]):(O(),b(`span`,Nt,t(n.currentPlaceholder),1))],2)):a(`v-if`,!0)],2),w(`div`,{ref:`suffixRef`,class:D(n.nsSelect.e(`suffix`))},[n.iconComponent&&!n.showClearBtn?(O(),s(f,{key:0,class:D([n.nsSelect.e(`caret`),n.nsSelect.e(`icon`),n.iconReverse])},{default:M(()=>[(O(),s(P(n.iconComponent)))]),_:1},8,[`class`])):a(`v-if`,!0),n.showClearBtn&&n.clearIcon?(O(),s(f,{key:1,class:D([n.nsSelect.e(`caret`),n.nsSelect.e(`icon`),n.nsSelect.e(`clear`)]),onClick:n.handleClearClick},{default:M(()=>[(O(),s(P(n.clearIcon)))]),_:1},8,[`class`,`onClick`])):a(`v-if`,!0),n.validateState&&n.validateIcon&&n.needStatusIcon?(O(),s(f,{key:2,class:D([n.nsInput.e(`icon`),n.nsInput.e(`validateIcon`),n.nsInput.is(`loading`,n.validateState===`validating`)])},{default:M(()=>[(O(),s(P(n.validateIcon)))]),_:1},8,[`class`])):a(`v-if`,!0)],2)],2)]),content:M(()=>[_(v,{ref:`menuRef`},{default:M(()=>[n.$slots.header?(O(),b(`div`,{key:0,class:D(n.nsSelect.be(`dropdown`,`header`)),onClick:r[7]||=J(()=>{},[`stop`])},[j(n.$slots,`header`)],2)):a(`v-if`,!0),be(_(g,{id:n.contentId,ref:`scrollbarRef`,tag:`ul`,"wrap-class":n.nsSelect.be(`dropdown`,`wrap`),"view-class":n.nsSelect.be(`dropdown`,`list`),class:D([n.nsSelect.is(`empty`,n.filteredOptionsCount===0)]),role:`listbox`,"aria-label":n.ariaLabel,"aria-orientation":`vertical`,onScroll:n.popupScroll},{default:M(()=>[n.showNewOption?(O(),s(p,{key:0,value:n.states.inputValue,created:!0},null,8,[`value`])):a(`v-if`,!0),_(h,null,{default:M(()=>[j(n.$slots,`default`,{},()=>[(O(!0),b(L,null,e(n.options,(t,r)=>(O(),b(L,{key:r},[n.getOptions(t)?.length?(O(),s(m,{key:0,label:n.getLabel(t),disabled:n.getDisabled(t)},{default:M(()=>[(O(!0),b(L,null,e(n.getOptions(t),e=>(O(),s(p,E({key:n.getValue(e)},{ref_for:!0},n.getOptionProps(e)),null,16))),128))]),_:2},1032,[`label`,`disabled`])):(O(),s(p,E({key:1,ref_for:!0},n.getOptionProps(t)),null,16))],64))),128))])]),_:3})]),_:3},8,[`id`,`wrap-class`,`view-class`,`class`,`aria-label`,`onScroll`]),[[et,n.states.options.size>0&&!n.loading]]),n.$slots.loading&&n.loading?(O(),b(`div`,{key:1,class:D(n.nsSelect.be(`dropdown`,`loading`))},[j(n.$slots,`loading`)],2)):n.loading||n.filteredOptionsCount===0?(O(),b(`div`,{key:2,class:D(n.nsSelect.be(`dropdown`,`empty`))},[j(n.$slots,`empty`,{},()=>[w(`span`,null,t(n.emptyText),1)])],2)):a(`v-if`,!0),n.$slots.footer?(O(),b(`div`,{key:3,class:D(n.nsSelect.be(`dropdown`,`footer`)),onClick:r[8]||=J(()=>{},[`stop`])},[j(n.$slots,`footer`)],2)):a(`v-if`,!0)]),_:3},512)]),_:3},8,[`visible`,`placement`,`teleported`,`popper-class`,`popper-style`,`popper-options`,`fallback-placements`,`effect`,`transition`,`persistent`,`append-to`,`show-arrow`,`offset`,`onBeforeShow`])],16)),[[y,n.handleClickOutside,n.popperRef]])}var Ft=C(W(At,[[`render`,Pt]]),{Option:gt,OptionGroup:Tt}),It=re(gt);re(Tt);var Lt=v({tag:{type:String,default:`div`},span:{type:Number,default:24},offset:{type:Number,default:0},pull:{type:Number,default:0},push:{type:Number,default:0},xs:{type:y([Number,Object]),default:()=>G({})},sm:{type:y([Number,Object]),default:()=>G({})},md:{type:y([Number,Object]),default:()=>G({})},lg:{type:y([Number,Object]),default:()=>G({})},xl:{type:y([Number,Object]),default:()=>G({})}}),Rt=Symbol(`rowContextKey`),zt=C(x({name:`ElCol`,__name:`col`,props:Lt,setup(e){let t=e,{gutter:n}=z(Rt,{gutter:R(()=>0)}),r=A(`col`),i=R(()=>{let e={};return n.value&&(e.paddingLeft=e.paddingRight=`${n.value/2}px`),e}),a=R(()=>{let e=[];return[`span`,`offset`,`pull`,`push`].forEach(n=>{let i=t[n];le(i)&&(n===`span`?e.push(r.b(`${t[n]}`)):i>0&&e.push(r.b(`${n}-${t[n]}`)))}),[`xs`,`sm`,`md`,`lg`,`xl`].forEach(n=>{le(t[n])?e.push(r.b(`${n}-${t[n]}`)):B(t[n])&&Object.entries(t[n]).forEach(([t,i])=>{e.push(t===`span`?r.b(`${n}-${i}`):r.b(`${n}-${t}-${i}`))})}),n.value&&e.push(r.is(`guttered`)),[r.b(),e]});return(t,n)=>(O(),s(P(e.tag),{class:D(a.value),style:S(i.value)},{default:M(()=>[j(t.$slots,`default`)]),_:3},8,[`class`,`style`]))}})),Bt=C(x({name:`ElRow`,__name:`row`,props:v({tag:{type:String,default:`div`},gutter:{type:Number,default:0},justify:{type:String,values:[`start`,`center`,`end`,`space-around`,`space-between`,`space-evenly`],default:`start`},align:{type:String,values:[`top`,`middle`,`bottom`]}}),setup(e){let t=e,n=A(`row`);te(Rt,{gutter:R(()=>t.gutter)});let r=R(()=>{let e={};return t.gutter&&(e.marginRight=e.marginLeft=`-${t.gutter/2}px`),e}),i=R(()=>[n.b(),n.is(`justify-${t.justify}`,t.justify!==`start`),n.is(`align-${t.align}`,!!t.align)]);return(t,n)=>(O(),s(P(e.tag),{class:D(i.value),style:S(r.value)},{default:M(()=>[j(t.$slots,`default`)]),_:3},8,[`class`,`style`]))}}));function Vt(){return`
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
`}var Ht=[{name:`审视文章优缺点和建议`,value:`review`,variables:[{name:`docTitle`,label:`文档标题`,value:`{{doc}}`,description:`输入的文档标题`},{name:`inputContent`,label:`输入内容`,value:`
{{fileContent}}
`,description:`文档的原始内容`}],template:`
你是文章审阅与知识分析专家。

${Vt()}

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

${Vt()}

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

      `,generate:e=>e.template.replace(`{{docTitle}}`,e.docTitle).replace(`{{docOutline}}`,e.docOutline).replace(`{{inputContent}}`,e.inputContent)}],Ut=x({props:{doc:{type:String,required:!0}},data(){return{showDrawer:!1,llmMode:`review`,query:``,presets:Ht,currentTemplate:null,variableValues:{}}},watch:{doc(){this.handleModeChange()}},computed:{isDark(){return this.$store.state.isDarkMode}},methods:{async renderTemplate(e){let t=await Qe.getDocFileInfo(this.doc),n=await Qe.getContentByDocId(this.doc),r=await Z.getCategoryList(),i=Ze.getTagList(),a={};for(let o of e.variables)switch(o.name){case`docTitle`:a[o.name]=this.doc;break;case`inputContent`:a[o.name]=`---\n${t.content}\n---`;break;case`docOutline`:a[o.name]=`---\n${this.contents2String(n)}\n---`;break;case`knowledgeCatalog`:a[o.name]=`---\n${this.categories2String(r,0)}\n---`;break;case`availableTags`:a[o.name]=i.join(`,`);break;default:a[o.name]=o.value.replace(`{{doc}}`,this.doc).replace(`{{fileContent}}`,t.content).replace(`{{outline}}`,this.contents2String(n)).replace(`{{allCategories}}`,this.categories2String(r,0)).replace(`{{tags}}`,i.join(`,`));break}let o=e.template;for(let[e,t]of Object.entries(a))o=o.replace(RegExp(`{{${e}}}`,`g`),t);return o.split(`
`).map(e=>e.replace(/(^\s*)|(\s*$)/g,``)).join(`
`)},show(){this.showDrawer=!0},async handleModeChange(){let e=this.presets.find(e=>e.value===this.llmMode);if(e){this.currentTemplate=e;let t=await Qe.getDocFileInfo(this.doc),n=await Qe.getContentByDocId(this.doc),r=await Z.getCategoryList(),i=Ze.getTagList();this.variableValues={};for(let a of e.variables)switch(a.name){case`docTitle`:this.variableValues[a.name]=this.doc;break;case`inputContent`:this.variableValues[a.name]=`\n${t.content}\n`;break;case`docOutline`:this.variableValues[a.name]=`\n${this.contents2String(n)}\n`;break;case`knowledgeCatalog`:this.variableValues[a.name]=`\n${this.categories2String(r,0)}\n`;break;case`availableTags`:this.variableValues[a.name]=i.join(`,`);break;default:this.variableValues[a.name]=a.value.replace(`{{doc}}`,this.doc).replace(`{{fileContent}}`,t.content).replace(`{{outline}}`,this.contents2String(n)).replace(`{{allCategories}}`,this.categories2String(r,0)).replace(`{{tags}}`,i.join(`,`));break}this.updateTemplateContent()}},contents2String(e){return!e||e.length===0?``:e.map(e=>this.tab(e.level)+`- `+e.name+`
`+this.contents2String(e.chidren||[])).join(`
`)},categories2String(e,t){return!e||e.length===0?``:e.map(e=>this.tab(t)+`- `+e.name+`
`+this.categories2String(e.chidren||[],t+1)).join(`
`)},tab(e){let t=``;for(let n=0;n<e;n++)t+=` `;return t},updateTemplateContent(){if(this.currentTemplate){let e=this.currentTemplate.template;for(let[t,n]of Object.entries(this.variableValues))e=e.replace(RegExp(`{{${t}}}`,`g`),n);this.query=e.split(`
`).map(e=>e.replace(/(^\s*)|(\s*$)/g,``)).join(`
`)}},handleQueryKeyUp(e){},handleCopy(){navigator.clipboard.writeText(this.query),ke.success(`复制成功`)}},async created(){let e=this.presets.find(e=>e.value===`review`);e&&(this.currentTemplate=e,this.query=await this.renderTemplate(e),this.handleModeChange())}}),Wt={class:`llm-container`},Gt={key:0,class:`variables-section`};function Kt(n,r,i,o,c,l){let u=It,d=Ft,f=zt,p=Bt,m=Be,h=Ke,g=Xe;return O(),s(g,{modelValue:n.showDrawer,"onUpdate:modelValue":r[2]||=e=>n.showDrawer=e,size:n.$isMobile()?`75%`:`44%`,direction:n.$isMobile()?`btt`:`rtl`,title:`模板生成问题`,modal:!1,onClose:r[3]||=e=>n.$emit(`close`),"lock-scroll":!1,"modal-penetrable":``,resizable:``},{default:M(()=>[w(`div`,Wt,[_(p,{gutter:12},{default:M(()=>[_(f,{span:24},{default:M(()=>[r[4]||=N(` 问题模板： `,-1),_(d,{modelValue:n.llmMode,"onUpdate:modelValue":r[0]||=e=>n.llmMode=e,onChange:n.handleModeChange,style:{width:`100%`}},{default:M(()=>[(O(!0),b(L,null,e(n.presets,e=>(O(),s(u,{key:e.value,value:e.value,label:e.name},{default:M(()=>[N(t(e.name),1)]),_:2},1032,[`value`,`label`]))),128))]),_:1},8,[`modelValue`,`onChange`])]),_:1})]),_:1}),n.currentTemplate&&n.currentTemplate.variables.length>0?(O(),b(`div`,Gt,[r[5]||=w(`h4`,null,`模板变量`,-1),(O(!0),b(L,null,e(n.currentTemplate.variables,e=>(O(),s(p,{gutter:12,key:e.name,style:{"margin-bottom":`12px`}},{default:M(()=>[_(f,{span:24},{default:M(()=>[w(`label`,null,t(e.label),1),_(m,{type:`textarea`,rows:3,modelValue:n.variableValues[e.name],"onUpdate:modelValue":t=>n.variableValues[e.name]=t,placeholder:e.description,onInput:n.updateTemplateContent},null,8,[`modelValue`,`onUpdate:modelValue`,`placeholder`,`onInput`])]),_:2},1024)]),_:2},1024))),128))])):a(``,!0),_(m,{type:`textarea`,rows:`15`,modelValue:n.query,"onUpdate:modelValue":r[1]||=e=>n.query=e,onKeyup:n.handleQueryKeyUp},null,8,[`modelValue`,`onKeyup`]),_(p,{gutter:12,style:{"margin-top":`10px`}},{default:M(()=>[_(f,{span:24},{default:M(()=>[_(h,{type:`success`,onClick:n.handleCopy,style:{width:`100%`}},{default:M(()=>[...r[6]||=[N(`复制提问`,-1)]]),_:1},8,[`onClick`])]),_:1})]),_:1})])]),_:1},8,[`modelValue`,`size`,`direction`])}var qt=_e(Ut,[[`render`,Kt],[`__scopeId`,`data-v-ffecb5d6`]]);export{qt as default};