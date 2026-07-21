import{n as e}from"./chunk-QTnfLwEv.js";import{An as t,Cn as n,En as r,Mn as i,Tn as a,Tr as o,Yn as s,Zr as c,at as l,fn as u,kn as d,t as f,ur as p}from"./css-B7oqn9nR.js";import{t as m}from"./DocUtils-D98sGPt4.js";import{$ as h,$a as g,$r as _,Ai as v,An as y,Ao as b,Ar as x,At as S,B as C,Ba as w,Bi as T,Bn as E,Br as D,Ca as O,Cr as k,Ct as A,Di as j,Dn as M,Do as N,Dr as ee,Dt as te,Ea as ne,En as re,Eo as ie,Et as ae,F as oe,Fi as se,Fr as ce,Ft as le,Gi as ue,Gn as de,Hi as fe,Ii as pe,In as me,Ir as he,It as ge,Ja as _e,Ji as ve,Jt as ye,Ka as be,Ki as xe,Li as Se,Ln as Ce,Lr as we,Mi as Te,Mn as Ee,Mr as De,Mt as Oe,Ni as ke,Nn as Ae,Nr as je,Nt as Me,Oi as Ne,Oo as Pe,Or as Fe,Ot as Ie,P as Le,Pn as Re,Pr as ze,Pt as Be,Qa as Ve,Qt as He,Ri as Ue,Rn as We,Rr as Ge,St as Ke,Ta as qe,Ti as Je,Tt as Ye,Ui as Xe,Un as Ze,Vi as Qe,Wi as $e,Wr as et,Xt as tt,Y as nt,Ya as rt,Za as it,_t as at,aa as ot,ao as st,ar as ct,at as lt,bo as ut,bt as dt,ca as ft,ct as pt,dr as mt,dt as ht,ea as gt,ei as _t,er as vt,et as yt,fo as bt,fr as xt,ft as St,go as Ct,gt as wt,ho as Tt,ht as Et,ir as Dt,ja as Ot,ji as kt,jr as At,jt,ka as Mt,ki as Nt,kn as Pt,ko as Ft,kr as It,kt as Lt,ln as Rt,lt as zt,mr as Bt,mt as Vt,n as Ht,na as Ut,ni as Wt,nn as Gt,no as Kt,nr as qt,nt as Jt,oo as Yt,or as Xt,po as Zt,pr as Qt,pt as $t,qi as en,qt as tn,rt as nn,s as rn,sn as an,so as on,sr as sn,st as cn,t as ln,ti as un,tn as dn,to as fn,tr as pn,tt as mn,ua as hn,ui as gn,uo as _n,ur as vn,ut as yn,va as bn,vn as xn,vo as Sn,vt as Cn,wa as wn,wi as Tn,wo as En,wt as Dn,xt as On,ya as kn,yt as An,za as jn,zr as Mn}from"./installCanvasRenderer-Cv2NAOOx.js";import{t as Nn}from"./css-CcdnTgy3.js";import"./css-Dkvpfl8N.js";import{t as Pn}from"./css-Djec94Zx.js";import{K as Fn,W as In,z as Ln}from"./index-oK-Eh7VH.js";import{t as Rn}from"./KnowledgeNetworkDataProcessor-DidUKgF4.js";import{d as zn,l as Bn,n as Vn,s as Hn,u as Un}from"./points-CxbdIisC.js";import{n as Wn,t as Gn}from"./install-A9ndNWP1.js";import{n as Kn,r as qn,t as Jn}from"./eChartMixin-CC2EHEcO.js";var Yn=e({createDimensions:()=>nn,createList:()=>Xn,createScale:()=>Qn,createSymbol:()=>ge,createTextStyle:()=>er,dataStack:()=>Zn,enableHoverEmphasis:()=>et,getECData:()=>_,getLayoutRect:()=>xn,mixinAxisModelCommonMethods:()=>$n});function Xn(e){return h(null,e)}var Zn={isDimensionStacked:Jt,enableDataStack:yt,getStackedDimension:mn};function Qn(e,t){var n=t;t instanceof Ze||(n=new Ze(t));var r=oe(n);return r.setExtent(e[0],e[1]),C(r,n),r}function $n(e){Sn(e,zn)}function er(e,t){return t||={},de(e,null,null,t.state!==`normal`)}var tr=[];function nr(e,t){for(var n=0;n<e.length;n++)Ot(e[n],e[n],t)}function rr(e,t,n,r){for(var i=0;i<e.length;i++){var a=e[i];r&&(a=r.project(a)),a&&isFinite(a[0])&&isFinite(a[1])&&(w(t,t,a),jn(n,n,a))}}function ir(e){for(var t=0,n=0,r=0,i=e.length,a=e[i-1][0],o=e[i-1][1],s=0;s<i;s++){var c=e[s][0],l=e[s][1],u=a*l-c*o;t+=u,n+=(a+c)*u,r+=(o+l)*u,a=c,o=l}return t?[n/t/3,r/t/3,t]:[e[0][0]||0,e[0][1]||0]}var ar=function(){function e(e){this.name=e}return e.prototype.setCenter=function(e){this._center=e},e.prototype.getCenter=function(){var e=this._center;return e||=this._center=this.calcCenter(),e},e}(),or=function(){function e(e,t){this.type=`polygon`,this.exterior=e,this.interiors=t}return e}(),sr=function(){function e(e){this.type=`linestring`,this.points=e}return e}(),cr=function(e){Pe(t,e);function t(t,n,r){var i=e.call(this,t)||this;return i.type=`geoJSON`,i.geometries=n,i._center=r&&[r[0],r[1]],i}return t.prototype.calcCenter=function(){for(var e=this.geometries,t,n=0,r=0;r<e.length;r++){var i=e[r],a=i.exterior,o=a&&a.length;o>n&&(t=i,n=o)}if(t)return ir(t.exterior);var s=this.getBoundingRect();return[s.x+s.width/2,s.y+s.height/2]},t.prototype.getBoundingRect=function(e){var t=this._rect;if(t&&!e)return t;var n=[1/0,1/0],r=[-1/0,-1/0],i=this.geometries;return g(i,function(t){t.type===`polygon`?rr(t.exterior,n,r,e):g(t.points,function(t){rr(t,n,r,e)})}),isFinite(n[0])&&isFinite(n[1])&&isFinite(r[0])&&isFinite(r[1])||(n[0]=n[1]=r[0]=r[1]=0),t=new kn(n[0],n[1],r[0]-n[0],r[1]-n[1]),e||(this._rect=t),t},t.prototype.contain=function(e){var t=this.getBoundingRect(),n=this.geometries;if(!t.contain(e[0],e[1]))return!1;loopGeo:for(var r=0,i=n.length;r<i;r++){var a=n[r];if(a.type===`polygon`){var o=a.exterior,s=a.interiors;if(Wn(o,e[0],e[1])){for(var c=0;c<(s?s.length:0);c++)if(Wn(s[c],e[0],e[1]))continue loopGeo;return!0}}}return!1},t.prototype.transformTo=function(e,t,n,r){var i=this.getBoundingRect(),a=i.width/i.height;n?r||=n/a:n=a*r;for(var o=new kn(e,t,n,r),s=i.calculateTransform(o),c=this.geometries,l=0;l<c.length;l++){var u=c[l];u.type===`polygon`?(nr(u.exterior,s),g(u.interiors,function(e){nr(e,s)})):g(u.points,function(e){nr(e,s)})}i=this._rect,i.copy(o),this._center=[i.x+i.width/2,i.y+i.height/2]},t.prototype.cloneShallow=function(e){e??=this.name;var n=new t(e,this.geometries,this._center);return n._rect=this._rect,n.transformTo=null,n},t}(ar);(function(e){Pe(t,e);function t(t,n){var r=e.call(this,t)||this;return r.type=`geoSVG`,r._elOnlyForCalculate=n,r}return t.prototype.calcCenter=function(){for(var e=this._elOnlyForCalculate,t=e.getBoundingRect(),n=[t.x+t.width/2,t.y+t.height/2],r=O(tr),i=e;i&&!i.isGeoSVGGraphicRoot;)ne(r,i.getLocalTransform(),r),i=i.parent;return wn(r,r),Ot(n,n,r),n},t})(ar);function lr(e){if(!e.UTF8Encoding)return e;var t=e,n=t.UTF8Scale;n??=1024;var r=t.features;return g(r,function(e){var t=e.geometry,r=t.encodeOffsets,i=t.coordinates;if(r)switch(t.type){case`LineString`:t.coordinates=dr(i,r,n);break;case`Polygon`:ur(i,r,n);break;case`MultiLineString`:ur(i,r,n);break;case`MultiPolygon`:g(i,function(e,t){return ur(e,r[t],n)})}}),t.UTF8Encoding=!1,t}function ur(e,t,n){for(var r=0;r<e.length;r++)e[r]=dr(e[r],t[r],n)}function dr(e,t,n){for(var r=[],i=t[0],a=t[1],o=0;o<e.length;o+=2){var s=e.charCodeAt(o)-64,c=e.charCodeAt(o+1)-64;s=s>>1^-(s&1),c=c>>1^-(c&1),s+=i,c+=a,i=s,a=c,r.push([s/n,c/n])}return r}function fr(e,t){return e=lr(e),Tt(Kt(e.features,function(e){return e.geometry&&e.properties&&e.geometry.coordinates.length>0}),function(e){var n=e.properties,r=e.geometry,i=[];switch(r.type){case`Polygon`:var a=r.coordinates;i.push(new or(a[0],a.slice(1)));break;case`MultiPolygon`:g(r.coordinates,function(e){e[0]&&i.push(new or(e[0],e.slice(1)))});break;case`LineString`:i.push(new sr([r.coordinates]));break;case`MultiLineString`:i.push(new sr(r.coordinates))}var o=new cr(n[t||`name`],i,n.cp);return o.properties=n,o})}var pr=e({MAX_SAFE_INTEGER:()=>Tn,asc:()=>Je,getPercentWithPrecision:()=>j,getPixelPrecision:()=>Ne,getPrecision:()=>Nt,getPrecisionSafe:()=>v,isNumeric:()=>kt,isRadianAroundZero:()=>Te,linearMap:()=>ke,nice:()=>se,numericToNumber:()=>pe,parseDate:()=>Se,parsePercent:()=>Ue,quantile:()=>T,quantity:()=>Qe,quantityExponent:()=>fe,reformIntervals:()=>Xe,remRadian:()=>$e,round:()=>ue}),mr=e({format:()=>Ce,parse:()=>Se,roundTime:()=>We}),hr=e({Arc:()=>De,BezierCurve:()=>je,BoundingRect:()=>kn,Circle:()=>D,CompoundPath:()=>At,Ellipse:()=>Mn,Group:()=>ve,Image:()=>Wt,IncrementalDisplayable:()=>Fe,Line:()=>ze,LinearGradient:()=>x,Polygon:()=>he,Polyline:()=>ce,RadialGradient:()=>It,Rect:()=>un,Ring:()=>we,Sector:()=>Ge,Text:()=>_t,clipPointsByRect:()=>vt,clipRectByRect:()=>pn,createIcon:()=>qt,extendPath:()=>Dt,extendShape:()=>ct,getShapeClass:()=>Xt,getTransform:()=>sn,initProps:()=>k,makeImage:()=>vn,makePath:()=>mt,mergePath:()=>xt,registerShape:()=>Qt,resizePath:()=>Bt,updateProps:()=>ee}),gr=e({addCommas:()=>re,capitalFirst:()=>M,encodeHTML:()=>Mt,formatTime:()=>Pt,formatTpl:()=>y,getTextRect:()=>me,getTooltipMarker:()=>Ee,normalizeCssArray:()=>Ae,toCamelCase:()=>Re,truncateText:()=>gn}),_r=e({bind:()=>_e,clone:()=>rt,curry:()=>it,defaults:()=>Ve,each:()=>g,extend:()=>fn,filter:()=>Kt,indexOf:()=>st,inherits:()=>Yt,isArray:()=>on,isFunction:()=>_n,isObject:()=>bt,isString:()=>Zt,map:()=>Tt,merge:()=>Ct,reduce:()=>ut});function vr(e){var t=Rt.extend(e);return Rt.registerClass(t),t}function yr(e){var t=tt.extend(e);return tt.registerClass(t),t}function br(e){var t=He.extend(e);return He.registerClass(t),t}function xr(e){var t=ye.extend(e);return ye.registerClass(t),t}var Sr=function(e){Pe(t,e);function t(){var t=e!==null&&e.apply(this,arguments)||this;return t.type=`dataset`,t}return t.prototype.init=function(t,n,r){e.prototype.init.call(this,t,n,r),this._sourceManager=new dn(this),Gt(this)},t.prototype.mergeOption=function(t,n){e.prototype.mergeOption.call(this,t,n),Gt(this)},t.prototype.optionUpdated=function(){this._sourceManager.dirty()},t.prototype.getSourceManager=function(){return this._sourceManager},t.type=`dataset`,t.defaultOption={seriesLayoutBy:an},t}(Rt),Cr=function(e){Pe(t,e);function t(){var t=e!==null&&e.apply(this,arguments)||this;return t.type=`dataset`,t}return t.type=`dataset`,t}(tt);function wr(e){e.registerComponentModel(Sr),e.registerComponentView(Cr)}var Tr=e({Axis:()=>Un,ChartView:()=>ye,ComponentModel:()=>Rt,ComponentView:()=>tt,List:()=>lt,Model:()=>Ze,PRIORITY:()=>cn,SeriesModel:()=>He,color:()=>Ut,connect:()=>pt,dataTool:()=>zt,default:()=>Er,dependencies:()=>yn,disConnect:()=>ht,disconnect:()=>St,dispose:()=>$t,env:()=>N,extendChartView:()=>xr,extendComponentModel:()=>vr,extendComponentView:()=>yr,extendSeriesModel:()=>br,format:()=>gr,getCoordinateSystemDimensions:()=>Vt,getInstanceByDom:()=>Et,getInstanceById:()=>wt,getMap:()=>at,graphic:()=>hr,helper:()=>Yn,init:()=>Cn,innerDrawElementOnCanvas:()=>le,matrix:()=>qe,number:()=>pr,parseGeoJSON:()=>fr,parseGeoJson:()=>fr,registerAction:()=>An,registerCoordinateSystem:()=>dt,registerCustomSeries:()=>On,registerLayout:()=>Ke,registerLoading:()=>A,registerLocale:()=>E,registerMap:()=>Dn,registerPostInit:()=>Ye,registerPostUpdate:()=>ae,registerPreprocessor:()=>te,registerProcessor:()=>Ie,registerTheme:()=>Lt,registerTransform:()=>S,registerUpdateLifecycle:()=>jt,registerVisual:()=>Oe,setCanvasCreator:()=>Me,setPlatformAPI:()=>ie,throttle:()=>tn,time:()=>mr,use:()=>Le,util:()=>_r,vector:()=>be,version:()=>Be,zrUtil:()=>En,zrender:()=>en});Le([ln,wr]);var Er={init:function(){return Cn.apply(null,arguments)}};Le(qn);function Dr(e,t,n){typeof t==`object`&&(n=t,t=null);var r=this,i;if(!(e instanceof Function))for(var a in i=[],e)e.hasOwnProperty(a)&&i.push(a);var o=function(t){if(r.apply(this,arguments),e instanceof Function?Or(this,e.call(this,t)):kr(this,e,i),this.constructor===o)for(var n=o.__initializers__,a=0;a<n.length;a++)n[a].apply(this,arguments)};o.__super__=r,r.__initializers__?o.__initializers__=r.__initializers__.slice():o.__initializers__=[],t&&o.__initializers__.push(t);var s=function(){};return s.prototype=r.prototype,o.prototype=new s,o.prototype.constructor=o,Or(o.prototype,n),o.extend=r.extend,o.derive=r.extend,o}function Or(e,t){if(t)for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n])}function kr(e,t,n){for(var r=0;r<n.length;r++){var i=n[r];e[i]=t[i]}}var Ar={extend:Dr,derive:Dr};function jr(e,t){this.action=e,this.context=t}var Mr={trigger:function(e){if(this.hasOwnProperty(`__handlers__`)&&this.__handlers__.hasOwnProperty(e)){var t=this.__handlers__[e],n=t.length,r=-1,i=arguments;switch(i.length){case 1:for(;++r<n;)t[r].action.call(t[r].context);return;case 2:for(;++r<n;)t[r].action.call(t[r].context,i[1]);return;case 3:for(;++r<n;)t[r].action.call(t[r].context,i[1],i[2]);return;case 4:for(;++r<n;)t[r].action.call(t[r].context,i[1],i[2],i[3]);return;case 5:for(;++r<n;)t[r].action.call(t[r].context,i[1],i[2],i[3],i[4]);return;default:for(;++r<n;)t[r].action.apply(t[r].context,Array.prototype.slice.call(i,1));return}}},on:function(e,t,n){if(!(!e||!t)){var r=this.__handlers__||={};if(!r[e])r[e]=[];else if(this.has(e,t))return;var i=new jr(t,n||this);return r[e].push(i),this}},once:function(e,t,n){if(!e||!t)return;var r=this;function i(){r.off(e,i),t.apply(this,arguments)}return this.on(e,i,n)},before:function(e,t,n){if(!(!e||!t))return e=`before`+e,this.on(e,t,n)},after:function(e,t,n){if(!(!e||!t))return e=`after`+e,this.on(e,t,n)},success:function(e,t){return this.once(`success`,e,t)},error:function(e,t){return this.once(`error`,e,t)},off:function(e,t){var n=this.__handlers__||={};if(!t){n[e]=[];return}if(n[e]){for(var r=n[e],i=[],a=0;a<r.length;a++)t&&r[a].action!==t&&i.push(r[a]);n[e]=i}return this},has:function(e,t){var n=this.__handlers__;if(!n||!n[e])return!1;for(var r=n[e],i=0;i<r.length;i++)if(r[i].action===t)return!0}},Nr=0,Pr=Array.prototype.forEach,Fr={genGUID:function(){return++Nr},relative2absolute:function(e,t){if(!t||e.match(/^\//))return e;for(var n=e.split(`/`),r=t.split(`/`),i=n[0];i===`.`||i===`..`;)i===`..`&&r.pop(),n.shift(),i=n[0];return r.join(`/`)+`/`+n.join(`/`)},extend:function(e,t){if(t)for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n]);return e},defaults:function(e,t){if(t)for(var n in t)e[n]===void 0&&(e[n]=t[n]);return e},extendWithPropList:function(e,t,n){if(t)for(var r=0;r<n.length;r++){var i=n[r];e[i]=t[i]}return e},defaultsWithPropList:function(e,t,n){if(t)for(var r=0;r<n.length;r++){var i=n[r];e[i]??(e[i]=t[i])}return e},each:function(e,t,n){if(e&&t)if(e.forEach&&e.forEach===Pr)e.forEach(t,n);else if(e.length===+e.length)for(var r=0,i=e.length;r<i;r++)t.call(n,e[r],r,e);else for(var a in e)e.hasOwnProperty(a)&&t.call(n,e[a],a,e)},isObject:function(e){return e===Object(e)},isArray:function(e){return Array.isArray(e)},isArrayLike:function(e){return e?e.length===+e.length:!1},clone:function(e){if(!Fr.isObject(e))return e;if(Fr.isArray(e))return e.slice();if(Fr.isArrayLike(e)){for(var t=new e.constructor(e.length),n=0;n<e.length;n++)t[n]=e[n];return t}else return Fr.extend({},e)}},Ir=function(){this.__uid__=Fr.genGUID()};Ir.__initializers__=[function(e){Fr.extend(this,e)}],Fr.extend(Ir,Ar),Fr.extend(Ir.prototype,Mr);var Lr=Array,Rr=Math.random,P={};P.create=function(){var e=new Lr(3);return e[0]=0,e[1]=0,e[2]=0,e},P.clone=function(e){var t=new Lr(3);return t[0]=e[0],t[1]=e[1],t[2]=e[2],t},P.fromValues=function(e,t,n){var r=new Lr(3);return r[0]=e,r[1]=t,r[2]=n,r},P.copy=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e},P.set=function(e,t,n,r){return e[0]=t,e[1]=n,e[2]=r,e},P.add=function(e,t,n){return e[0]=t[0]+n[0],e[1]=t[1]+n[1],e[2]=t[2]+n[2],e},P.subtract=function(e,t,n){return e[0]=t[0]-n[0],e[1]=t[1]-n[1],e[2]=t[2]-n[2],e},P.sub=P.subtract,P.multiply=function(e,t,n){return e[0]=t[0]*n[0],e[1]=t[1]*n[1],e[2]=t[2]*n[2],e},P.mul=P.multiply,P.divide=function(e,t,n){return e[0]=t[0]/n[0],e[1]=t[1]/n[1],e[2]=t[2]/n[2],e},P.div=P.divide,P.min=function(e,t,n){return e[0]=Math.min(t[0],n[0]),e[1]=Math.min(t[1],n[1]),e[2]=Math.min(t[2],n[2]),e},P.max=function(e,t,n){return e[0]=Math.max(t[0],n[0]),e[1]=Math.max(t[1],n[1]),e[2]=Math.max(t[2],n[2]),e},P.scale=function(e,t,n){return e[0]=t[0]*n,e[1]=t[1]*n,e[2]=t[2]*n,e},P.scaleAndAdd=function(e,t,n,r){return e[0]=t[0]+n[0]*r,e[1]=t[1]+n[1]*r,e[2]=t[2]+n[2]*r,e},P.distance=function(e,t){var n=t[0]-e[0],r=t[1]-e[1],i=t[2]-e[2];return Math.sqrt(n*n+r*r+i*i)},P.dist=P.distance,P.squaredDistance=function(e,t){var n=t[0]-e[0],r=t[1]-e[1],i=t[2]-e[2];return n*n+r*r+i*i},P.sqrDist=P.squaredDistance,P.length=function(e){var t=e[0],n=e[1],r=e[2];return Math.sqrt(t*t+n*n+r*r)},P.len=P.length,P.squaredLength=function(e){var t=e[0],n=e[1],r=e[2];return t*t+n*n+r*r},P.sqrLen=P.squaredLength,P.negate=function(e,t){return e[0]=-t[0],e[1]=-t[1],e[2]=-t[2],e},P.inverse=function(e,t){return e[0]=1/t[0],e[1]=1/t[1],e[2]=1/t[2],e},P.normalize=function(e,t){var n=t[0],r=t[1],i=t[2],a=n*n+r*r+i*i;return a>0&&(a=1/Math.sqrt(a),e[0]=t[0]*a,e[1]=t[1]*a,e[2]=t[2]*a),e},P.dot=function(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]},P.cross=function(e,t,n){var r=t[0],i=t[1],a=t[2],o=n[0],s=n[1],c=n[2];return e[0]=i*c-a*s,e[1]=a*o-r*c,e[2]=r*s-i*o,e},P.lerp=function(e,t,n,r){var i=t[0],a=t[1],o=t[2];return e[0]=i+r*(n[0]-i),e[1]=a+r*(n[1]-a),e[2]=o+r*(n[2]-o),e},P.random=function(e,t){t||=1;var n=Rr()*2*Math.PI,r=Rr()*2-1,i=Math.sqrt(1-r*r)*t;return e[0]=Math.cos(n)*i,e[1]=Math.sin(n)*i,e[2]=r*t,e},P.transformMat4=function(e,t,n){var r=t[0],i=t[1],a=t[2],o=n[3]*r+n[7]*i+n[11]*a+n[15];return o||=1,e[0]=(n[0]*r+n[4]*i+n[8]*a+n[12])/o,e[1]=(n[1]*r+n[5]*i+n[9]*a+n[13])/o,e[2]=(n[2]*r+n[6]*i+n[10]*a+n[14])/o,e},P.transformMat3=function(e,t,n){var r=t[0],i=t[1],a=t[2];return e[0]=r*n[0]+i*n[3]+a*n[6],e[1]=r*n[1]+i*n[4]+a*n[7],e[2]=r*n[2]+i*n[5]+a*n[8],e},P.transformQuat=function(e,t,n){var r=t[0],i=t[1],a=t[2],o=n[0],s=n[1],c=n[2],l=n[3],u=l*r+s*a-c*i,d=l*i+c*r-o*a,f=l*a+o*i-s*r,p=-o*r-s*i-c*a;return e[0]=u*l+p*-o+d*-c-f*-s,e[1]=d*l+p*-s+f*-o-u*-c,e[2]=f*l+p*-c+u*-s-d*-o,e},P.rotateX=function(e,t,n,r){var i=[],a=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],a[0]=i[0],a[1]=i[1]*Math.cos(r)-i[2]*Math.sin(r),a[2]=i[1]*Math.sin(r)+i[2]*Math.cos(r),e[0]=a[0]+n[0],e[1]=a[1]+n[1],e[2]=a[2]+n[2],e},P.rotateY=function(e,t,n,r){var i=[],a=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],a[0]=i[2]*Math.sin(r)+i[0]*Math.cos(r),a[1]=i[1],a[2]=i[2]*Math.cos(r)-i[0]*Math.sin(r),e[0]=a[0]+n[0],e[1]=a[1]+n[1],e[2]=a[2]+n[2],e},P.rotateZ=function(e,t,n,r){var i=[],a=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],a[0]=i[0]*Math.cos(r)-i[1]*Math.sin(r),a[1]=i[0]*Math.sin(r)+i[1]*Math.cos(r),a[2]=i[2],e[0]=a[0]+n[0],e[1]=a[1]+n[1],e[2]=a[2]+n[2],e},P.forEach=(function(){var e=P.create();return function(t,n,r,i,a,o){var s,c;for(n||=3,r||=0,c=i?Math.min(i*n+r,t.length):t.length,s=r;s<c;s+=n)e[0]=t[s],e[1]=t[s+1],e[2]=t[s+2],a(e,e,o),t[s]=e[0],t[s+1]=e[1],t[s+2]=e[2];return t}})(),P.angle=function(e,t){var n=P.fromValues(e[0],e[1],e[2]),r=P.fromValues(t[0],t[1],t[2]);P.normalize(n,n),P.normalize(r,r);var i=P.dot(n,r);return i>1?0:Math.acos(i)};var F=function(e,t,n){e||=0,t||=0,n||=0,this.array=P.fromValues(e,t,n),this._dirty=!0};F.prototype={constructor:F,add:function(e){return P.add(this.array,this.array,e.array),this._dirty=!0,this},set:function(e,t,n){return this.array[0]=e,this.array[1]=t,this.array[2]=n,this._dirty=!0,this},setArray:function(e){return this.array[0]=e[0],this.array[1]=e[1],this.array[2]=e[2],this._dirty=!0,this},clone:function(){return new F(this.x,this.y,this.z)},copy:function(e){return P.copy(this.array,e.array),this._dirty=!0,this},cross:function(e,t){return P.cross(this.array,e.array,t.array),this._dirty=!0,this},dist:function(e){return P.dist(this.array,e.array)},distance:function(e){return P.distance(this.array,e.array)},div:function(e){return P.div(this.array,this.array,e.array),this._dirty=!0,this},divide:function(e){return P.divide(this.array,this.array,e.array),this._dirty=!0,this},dot:function(e){return P.dot(this.array,e.array)},len:function(){return P.len(this.array)},length:function(){return P.length(this.array)},lerp:function(e,t,n){return P.lerp(this.array,e.array,t.array,n),this._dirty=!0,this},min:function(e){return P.min(this.array,this.array,e.array),this._dirty=!0,this},max:function(e){return P.max(this.array,this.array,e.array),this._dirty=!0,this},mul:function(e){return P.mul(this.array,this.array,e.array),this._dirty=!0,this},multiply:function(e){return P.multiply(this.array,this.array,e.array),this._dirty=!0,this},negate:function(){return P.negate(this.array,this.array),this._dirty=!0,this},normalize:function(){return P.normalize(this.array,this.array),this._dirty=!0,this},random:function(e){return P.random(this.array,e),this._dirty=!0,this},scale:function(e){return P.scale(this.array,this.array,e),this._dirty=!0,this},scaleAndAdd:function(e,t){return P.scaleAndAdd(this.array,this.array,e.array,t),this._dirty=!0,this},sqrDist:function(e){return P.sqrDist(this.array,e.array)},squaredDistance:function(e){return P.squaredDistance(this.array,e.array)},sqrLen:function(){return P.sqrLen(this.array)},squaredLength:function(){return P.squaredLength(this.array)},sub:function(e){return P.sub(this.array,this.array,e.array),this._dirty=!0,this},subtract:function(e){return P.subtract(this.array,this.array,e.array),this._dirty=!0,this},transformMat3:function(e){return P.transformMat3(this.array,this.array,e.array),this._dirty=!0,this},transformMat4:function(e){return P.transformMat4(this.array,this.array,e.array),this._dirty=!0,this},transformQuat:function(e){return P.transformQuat(this.array,this.array,e.array),this._dirty=!0,this},applyProjection:function(e){var t=this.array;if(e=e.array,e[15]===0){var n=-1/t[2];t[0]=e[0]*t[0]*n,t[1]=e[5]*t[1]*n,t[2]=(e[10]*t[2]+e[14])*n}else t[0]=e[0]*t[0]+e[12],t[1]=e[5]*t[1]+e[13],t[2]=e[10]*t[2]+e[14];return this._dirty=!0,this},eulerFromQuat:function(e,t){F.eulerFromQuat(this,e,t)},eulerFromMat3:function(e,t){F.eulerFromMat3(this,e,t)},toString:function(){return`[`+Array.prototype.join.call(this.array,`,`)+`]`},toArray:function(){return Array.prototype.slice.call(this.array)}};var zr=Object.defineProperty;if(zr){var Br=F.prototype;zr(Br,`x`,{get:function(){return this.array[0]},set:function(e){this.array[0]=e,this._dirty=!0}}),zr(Br,`y`,{get:function(){return this.array[1]},set:function(e){this.array[1]=e,this._dirty=!0}}),zr(Br,`z`,{get:function(){return this.array[2]},set:function(e){this.array[2]=e,this._dirty=!0}})}F.add=function(e,t,n){return P.add(e.array,t.array,n.array),e._dirty=!0,e},F.set=function(e,t,n,r){P.set(e.array,t,n,r),e._dirty=!0},F.copy=function(e,t){return P.copy(e.array,t.array),e._dirty=!0,e},F.cross=function(e,t,n){return P.cross(e.array,t.array,n.array),e._dirty=!0,e},F.dist=function(e,t){return P.distance(e.array,t.array)},F.distance=F.dist,F.div=function(e,t,n){return P.divide(e.array,t.array,n.array),e._dirty=!0,e},F.divide=F.div,F.dot=function(e,t){return P.dot(e.array,t.array)},F.len=function(e){return P.length(e.array)},F.lerp=function(e,t,n,r){return P.lerp(e.array,t.array,n.array,r),e._dirty=!0,e},F.min=function(e,t,n){return P.min(e.array,t.array,n.array),e._dirty=!0,e},F.max=function(e,t,n){return P.max(e.array,t.array,n.array),e._dirty=!0,e},F.mul=function(e,t,n){return P.multiply(e.array,t.array,n.array),e._dirty=!0,e},F.multiply=F.mul,F.negate=function(e,t){return P.negate(e.array,t.array),e._dirty=!0,e},F.normalize=function(e,t){return P.normalize(e.array,t.array),e._dirty=!0,e},F.random=function(e,t){return P.random(e.array,t),e._dirty=!0,e},F.scale=function(e,t,n){return P.scale(e.array,t.array,n),e._dirty=!0,e},F.scaleAndAdd=function(e,t,n,r){return P.scaleAndAdd(e.array,t.array,n.array,r),e._dirty=!0,e},F.sqrDist=function(e,t){return P.sqrDist(e.array,t.array)},F.squaredDistance=F.sqrDist,F.sqrLen=function(e){return P.sqrLen(e.array)},F.squaredLength=F.sqrLen,F.sub=function(e,t,n){return P.subtract(e.array,t.array,n.array),e._dirty=!0,e},F.subtract=F.sub,F.transformMat3=function(e,t,n){return P.transformMat3(e.array,t.array,n.array),e._dirty=!0,e},F.transformMat4=function(e,t,n){return P.transformMat4(e.array,t.array,n.array),e._dirty=!0,e},F.transformQuat=function(e,t,n){return P.transformQuat(e.array,t.array,n.array),e._dirty=!0,e};function Vr(e,t,n){return e<t?t:e>n?n:e}var Hr=Math.atan2,Ur=Math.asin,Wr=Math.abs;F.eulerFromQuat=function(e,t,n){e._dirty=!0,t=t.array;var r=e.array,i=t[0],a=t[1],o=t[2],s=t[3],c=i*i,l=a*a,u=o*o,d=s*s,n=(n||`XYZ`).toUpperCase();switch(n){case`XYZ`:r[0]=Hr(2*(i*s-a*o),d-c-l+u),r[1]=Ur(Vr(2*(i*o+a*s),-1,1)),r[2]=Hr(2*(o*s-i*a),d+c-l-u);break;case`YXZ`:r[0]=Ur(Vr(2*(i*s-a*o),-1,1)),r[1]=Hr(2*(i*o+a*s),d-c-l+u),r[2]=Hr(2*(i*a+o*s),d-c+l-u);break;case`ZXY`:r[0]=Ur(Vr(2*(i*s+a*o),-1,1)),r[1]=Hr(2*(a*s-o*i),d-c-l+u),r[2]=Hr(2*(o*s-i*a),d-c+l-u);break;case`ZYX`:r[0]=Hr(2*(i*s+o*a),d-c-l+u),r[1]=Ur(Vr(2*(a*s-i*o),-1,1)),r[2]=Hr(2*(i*a+o*s),d+c-l-u);break;case`YZX`:r[0]=Hr(2*(i*s-o*a),d-c+l-u),r[1]=Hr(2*(a*s-i*o),d+c-l-u),r[2]=Ur(Vr(2*(i*a+o*s),-1,1));break;case`XZY`:r[0]=Hr(2*(i*s+a*o),d-c+l-u),r[1]=Hr(2*(i*o+a*s),d+c-l-u),r[2]=Ur(Vr(2*(o*s-i*a),-1,1));break;default:console.warn(`Unkown order: `+n)}return e},F.eulerFromMat3=function(e,t,n){var r=t.array,i=r[0],a=r[3],o=r[6],s=r[1],c=r[4],l=r[7],u=r[2],d=r[5],f=r[8],p=e.array,n=(n||`XYZ`).toUpperCase();switch(n){case`XYZ`:p[1]=Ur(Vr(o,-1,1)),Wr(o)<.99999?(p[0]=Hr(-l,f),p[2]=Hr(-a,i)):(p[0]=Hr(d,c),p[2]=0);break;case`YXZ`:p[0]=Ur(-Vr(l,-1,1)),Wr(l)<.99999?(p[1]=Hr(o,f),p[2]=Hr(s,c)):(p[1]=Hr(-u,i),p[2]=0);break;case`ZXY`:p[0]=Ur(Vr(d,-1,1)),Wr(d)<.99999?(p[1]=Hr(-u,f),p[2]=Hr(-a,c)):(p[1]=0,p[2]=Hr(s,i));break;case`ZYX`:p[1]=Ur(-Vr(u,-1,1)),Wr(u)<.99999?(p[0]=Hr(d,f),p[2]=Hr(s,i)):(p[0]=0,p[2]=Hr(-a,c));break;case`YZX`:p[2]=Ur(Vr(s,-1,1)),Wr(s)<.99999?(p[0]=Hr(-l,c),p[1]=Hr(-u,i)):(p[0]=0,p[1]=Hr(o,f));break;case`XZY`:p[2]=Ur(-Vr(a,-1,1)),Wr(a)<.99999?(p[0]=Hr(d,c),p[1]=Hr(o,i)):(p[0]=Hr(-l,f),p[1]=0);break;default:console.warn(`Unkown order: `+n)}return e._dirty=!0,e},Object.defineProperties(F,{POSITIVE_X:{get:function(){return new F(1,0,0)}},NEGATIVE_X:{get:function(){return new F(-1,0,0)}},POSITIVE_Y:{get:function(){return new F(0,1,0)}},NEGATIVE_Y:{get:function(){return new F(0,-1,0)}},POSITIVE_Z:{get:function(){return new F(0,0,1)}},NEGATIVE_Z:{get:function(){return new F(0,0,-1)}},UP:{get:function(){return new F(0,1,0)}},ZERO:{get:function(){return new F}}});var I={};I.create=function(){var e=new Lr(4);return e[0]=0,e[1]=0,e[2]=0,e[3]=0,e},I.clone=function(e){var t=new Lr(4);return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t},I.fromValues=function(e,t,n,r){var i=new Lr(4);return i[0]=e,i[1]=t,i[2]=n,i[3]=r,i},I.copy=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e},I.set=function(e,t,n,r,i){return e[0]=t,e[1]=n,e[2]=r,e[3]=i,e},I.add=function(e,t,n){return e[0]=t[0]+n[0],e[1]=t[1]+n[1],e[2]=t[2]+n[2],e[3]=t[3]+n[3],e},I.subtract=function(e,t,n){return e[0]=t[0]-n[0],e[1]=t[1]-n[1],e[2]=t[2]-n[2],e[3]=t[3]-n[3],e},I.sub=I.subtract,I.multiply=function(e,t,n){return e[0]=t[0]*n[0],e[1]=t[1]*n[1],e[2]=t[2]*n[2],e[3]=t[3]*n[3],e},I.mul=I.multiply,I.divide=function(e,t,n){return e[0]=t[0]/n[0],e[1]=t[1]/n[1],e[2]=t[2]/n[2],e[3]=t[3]/n[3],e},I.div=I.divide,I.min=function(e,t,n){return e[0]=Math.min(t[0],n[0]),e[1]=Math.min(t[1],n[1]),e[2]=Math.min(t[2],n[2]),e[3]=Math.min(t[3],n[3]),e},I.max=function(e,t,n){return e[0]=Math.max(t[0],n[0]),e[1]=Math.max(t[1],n[1]),e[2]=Math.max(t[2],n[2]),e[3]=Math.max(t[3],n[3]),e},I.scale=function(e,t,n){return e[0]=t[0]*n,e[1]=t[1]*n,e[2]=t[2]*n,e[3]=t[3]*n,e},I.scaleAndAdd=function(e,t,n,r){return e[0]=t[0]+n[0]*r,e[1]=t[1]+n[1]*r,e[2]=t[2]+n[2]*r,e[3]=t[3]+n[3]*r,e},I.distance=function(e,t){var n=t[0]-e[0],r=t[1]-e[1],i=t[2]-e[2],a=t[3]-e[3];return Math.sqrt(n*n+r*r+i*i+a*a)},I.dist=I.distance,I.squaredDistance=function(e,t){var n=t[0]-e[0],r=t[1]-e[1],i=t[2]-e[2],a=t[3]-e[3];return n*n+r*r+i*i+a*a},I.sqrDist=I.squaredDistance,I.length=function(e){var t=e[0],n=e[1],r=e[2],i=e[3];return Math.sqrt(t*t+n*n+r*r+i*i)},I.len=I.length,I.squaredLength=function(e){var t=e[0],n=e[1],r=e[2],i=e[3];return t*t+n*n+r*r+i*i},I.sqrLen=I.squaredLength,I.negate=function(e,t){return e[0]=-t[0],e[1]=-t[1],e[2]=-t[2],e[3]=-t[3],e},I.inverse=function(e,t){return e[0]=1/t[0],e[1]=1/t[1],e[2]=1/t[2],e[3]=1/t[3],e},I.normalize=function(e,t){var n=t[0],r=t[1],i=t[2],a=t[3],o=n*n+r*r+i*i+a*a;return o>0&&(o=1/Math.sqrt(o),e[0]=t[0]*o,e[1]=t[1]*o,e[2]=t[2]*o,e[3]=t[3]*o),e},I.dot=function(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]+e[3]*t[3]},I.lerp=function(e,t,n,r){var i=t[0],a=t[1],o=t[2],s=t[3];return e[0]=i+r*(n[0]-i),e[1]=a+r*(n[1]-a),e[2]=o+r*(n[2]-o),e[3]=s+r*(n[3]-s),e},I.random=function(e,t){return t||=1,e[0]=Rr(),e[1]=Rr(),e[2]=Rr(),e[3]=Rr(),I.normalize(e,e),I.scale(e,e,t),e},I.transformMat4=function(e,t,n){var r=t[0],i=t[1],a=t[2],o=t[3];return e[0]=n[0]*r+n[4]*i+n[8]*a+n[12]*o,e[1]=n[1]*r+n[5]*i+n[9]*a+n[13]*o,e[2]=n[2]*r+n[6]*i+n[10]*a+n[14]*o,e[3]=n[3]*r+n[7]*i+n[11]*a+n[15]*o,e},I.transformQuat=function(e,t,n){var r=t[0],i=t[1],a=t[2],o=n[0],s=n[1],c=n[2],l=n[3],u=l*r+s*a-c*i,d=l*i+c*r-o*a,f=l*a+o*i-s*r,p=-o*r-s*i-c*a;return e[0]=u*l+p*-o+d*-c-f*-s,e[1]=d*l+p*-s+f*-o-u*-c,e[2]=f*l+p*-c+u*-s-d*-o,e},I.forEach=(function(){var e=I.create();return function(t,n,r,i,a,o){var s,c;for(n||=4,r||=0,c=i?Math.min(i*n+r,t.length):t.length,s=r;s<c;s+=n)e[0]=t[s],e[1]=t[s+1],e[2]=t[s+2],e[3]=t[s+3],a(e,e,o),t[s]=e[0],t[s+1]=e[1],t[s+2]=e[2],t[s+3]=e[3];return t}})();var L={};L.create=function(){var e=new Lr(9);return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=1,e[5]=0,e[6]=0,e[7]=0,e[8]=1,e},L.fromMat4=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[4],e[4]=t[5],e[5]=t[6],e[6]=t[8],e[7]=t[9],e[8]=t[10],e},L.clone=function(e){var t=new Lr(9);return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[4]=e[4],t[5]=e[5],t[6]=e[6],t[7]=e[7],t[8]=e[8],t},L.copy=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[8]=t[8],e},L.identity=function(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=1,e[5]=0,e[6]=0,e[7]=0,e[8]=1,e},L.transpose=function(e,t){if(e===t){var n=t[1],r=t[2],i=t[5];e[1]=t[3],e[2]=t[6],e[3]=n,e[5]=t[7],e[6]=r,e[7]=i}else e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8];return e},L.invert=function(e,t){var n=t[0],r=t[1],i=t[2],a=t[3],o=t[4],s=t[5],c=t[6],l=t[7],u=t[8],d=u*o-s*l,f=-u*a+s*c,p=l*a-o*c,m=n*d+r*f+i*p;return m?(m=1/m,e[0]=d*m,e[1]=(-u*r+i*l)*m,e[2]=(s*r-i*o)*m,e[3]=f*m,e[4]=(u*n-i*c)*m,e[5]=(-s*n+i*a)*m,e[6]=p*m,e[7]=(-l*n+r*c)*m,e[8]=(o*n-r*a)*m,e):null},L.adjoint=function(e,t){var n=t[0],r=t[1],i=t[2],a=t[3],o=t[4],s=t[5],c=t[6],l=t[7],u=t[8];return e[0]=o*u-s*l,e[1]=i*l-r*u,e[2]=r*s-i*o,e[3]=s*c-a*u,e[4]=n*u-i*c,e[5]=i*a-n*s,e[6]=a*l-o*c,e[7]=r*c-n*l,e[8]=n*o-r*a,e},L.determinant=function(e){var t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*(l*a-o*c)+n*(-l*i+o*s)+r*(c*i-a*s)},L.multiply=function(e,t,n){var r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=t[6],u=t[7],d=t[8],f=n[0],p=n[1],m=n[2],h=n[3],g=n[4],_=n[5],v=n[6],y=n[7],b=n[8];return e[0]=f*r+p*o+m*l,e[1]=f*i+p*s+m*u,e[2]=f*a+p*c+m*d,e[3]=h*r+g*o+_*l,e[4]=h*i+g*s+_*u,e[5]=h*a+g*c+_*d,e[6]=v*r+y*o+b*l,e[7]=v*i+y*s+b*u,e[8]=v*a+y*c+b*d,e},L.mul=L.multiply,L.translate=function(e,t,n){var r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=t[6],u=t[7],d=t[8],f=n[0],p=n[1];return e[0]=r,e[1]=i,e[2]=a,e[3]=o,e[4]=s,e[5]=c,e[6]=f*r+p*o+l,e[7]=f*i+p*s+u,e[8]=f*a+p*c+d,e},L.rotate=function(e,t,n){var r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=t[6],u=t[7],d=t[8],f=Math.sin(n),p=Math.cos(n);return e[0]=p*r+f*o,e[1]=p*i+f*s,e[2]=p*a+f*c,e[3]=p*o-f*r,e[4]=p*s-f*i,e[5]=p*c-f*a,e[6]=l,e[7]=u,e[8]=d,e},L.scale=function(e,t,n){var r=n[0],i=n[1];return e[0]=r*t[0],e[1]=r*t[1],e[2]=r*t[2],e[3]=i*t[3],e[4]=i*t[4],e[5]=i*t[5],e[6]=t[6],e[7]=t[7],e[8]=t[8],e},L.fromMat2d=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=0,e[3]=t[2],e[4]=t[3],e[5]=0,e[6]=t[4],e[7]=t[5],e[8]=1,e},L.fromQuat=function(e,t){var n=t[0],r=t[1],i=t[2],a=t[3],o=n+n,s=r+r,c=i+i,l=n*o,u=r*o,d=r*s,f=i*o,p=i*s,m=i*c,h=a*o,g=a*s,_=a*c;return e[0]=1-d-m,e[3]=u-_,e[6]=f+g,e[1]=u+_,e[4]=1-l-m,e[7]=p-h,e[2]=f-g,e[5]=p+h,e[8]=1-l-d,e},L.normalFromMat4=function(e,t){var n=t[0],r=t[1],i=t[2],a=t[3],o=t[4],s=t[5],c=t[6],l=t[7],u=t[8],d=t[9],f=t[10],p=t[11],m=t[12],h=t[13],g=t[14],_=t[15],v=n*s-r*o,y=n*c-i*o,b=n*l-a*o,x=r*c-i*s,S=r*l-a*s,C=i*l-a*c,w=u*h-d*m,T=u*g-f*m,E=u*_-p*m,D=d*g-f*h,O=d*_-p*h,k=f*_-p*g,A=v*k-y*O+b*D+x*E-S*T+C*w;return A?(A=1/A,e[0]=(s*k-c*O+l*D)*A,e[1]=(c*E-o*k-l*T)*A,e[2]=(o*O-s*E+l*w)*A,e[3]=(i*O-r*k-a*D)*A,e[4]=(n*k-i*E+a*T)*A,e[5]=(r*E-n*O-a*w)*A,e[6]=(h*C-g*S+_*x)*A,e[7]=(g*b-m*C-_*y)*A,e[8]=(m*S-h*b+_*v)*A,e):null},L.frob=function(e){return Math.sqrt(e[0]**2+e[1]**2+e[2]**2+e[3]**2+e[4]**2+e[5]**2+e[6]**2+e[7]**2+e[8]**2)};var R={};R.create=function(){var e=new Lr(4);return e[0]=0,e[1]=0,e[2]=0,e[3]=1,e},R.rotationTo=(function(){var e=P.create(),t=P.fromValues(1,0,0),n=P.fromValues(0,1,0);return function(r,i,a){var o=P.dot(i,a);return o<-.999999?(P.cross(e,t,i),P.length(e)<1e-6&&P.cross(e,n,i),P.normalize(e,e),R.setAxisAngle(r,e,Math.PI),r):o>.999999?(r[0]=0,r[1]=0,r[2]=0,r[3]=1,r):(P.cross(e,i,a),r[0]=e[0],r[1]=e[1],r[2]=e[2],r[3]=1+o,R.normalize(r,r))}})(),R.setAxes=(function(){var e=L.create();return function(t,n,r,i){return e[0]=r[0],e[3]=r[1],e[6]=r[2],e[1]=i[0],e[4]=i[1],e[7]=i[2],e[2]=-n[0],e[5]=-n[1],e[8]=-n[2],R.normalize(t,R.fromMat3(t,e))}})(),R.clone=I.clone,R.fromValues=I.fromValues,R.copy=I.copy,R.set=I.set,R.identity=function(e){return e[0]=0,e[1]=0,e[2]=0,e[3]=1,e},R.setAxisAngle=function(e,t,n){n*=.5;var r=Math.sin(n);return e[0]=r*t[0],e[1]=r*t[1],e[2]=r*t[2],e[3]=Math.cos(n),e},R.add=I.add,R.multiply=function(e,t,n){var r=t[0],i=t[1],a=t[2],o=t[3],s=n[0],c=n[1],l=n[2],u=n[3];return e[0]=r*u+o*s+i*l-a*c,e[1]=i*u+o*c+a*s-r*l,e[2]=a*u+o*l+r*c-i*s,e[3]=o*u-r*s-i*c-a*l,e},R.mul=R.multiply,R.scale=I.scale,R.rotateX=function(e,t,n){n*=.5;var r=t[0],i=t[1],a=t[2],o=t[3],s=Math.sin(n),c=Math.cos(n);return e[0]=r*c+o*s,e[1]=i*c+a*s,e[2]=a*c-i*s,e[3]=o*c-r*s,e},R.rotateY=function(e,t,n){n*=.5;var r=t[0],i=t[1],a=t[2],o=t[3],s=Math.sin(n),c=Math.cos(n);return e[0]=r*c-a*s,e[1]=i*c+o*s,e[2]=a*c+r*s,e[3]=o*c-i*s,e},R.rotateZ=function(e,t,n){n*=.5;var r=t[0],i=t[1],a=t[2],o=t[3],s=Math.sin(n),c=Math.cos(n);return e[0]=r*c+i*s,e[1]=i*c-r*s,e[2]=a*c+o*s,e[3]=o*c-a*s,e},R.calculateW=function(e,t){var n=t[0],r=t[1],i=t[2];return e[0]=n,e[1]=r,e[2]=i,e[3]=Math.sqrt(Math.abs(1-n*n-r*r-i*i)),e},R.dot=I.dot,R.lerp=I.lerp,R.slerp=function(e,t,n,r){var i=t[0],a=t[1],o=t[2],s=t[3],c=n[0],l=n[1],u=n[2],d=n[3],f,p=i*c+a*l+o*u+s*d,m,h,g;return p<0&&(p=-p,c=-c,l=-l,u=-u,d=-d),1-p>1e-6?(f=Math.acos(p),m=Math.sin(f),h=Math.sin((1-r)*f)/m,g=Math.sin(r*f)/m):(h=1-r,g=r),e[0]=h*i+g*c,e[1]=h*a+g*l,e[2]=h*o+g*u,e[3]=h*s+g*d,e},R.invert=function(e,t){var n=t[0],r=t[1],i=t[2],a=t[3],o=n*n+r*r+i*i+a*a,s=o?1/o:0;return e[0]=-n*s,e[1]=-r*s,e[2]=-i*s,e[3]=a*s,e},R.conjugate=function(e,t){return e[0]=-t[0],e[1]=-t[1],e[2]=-t[2],e[3]=t[3],e},R.length=I.length,R.len=R.length,R.squaredLength=I.squaredLength,R.sqrLen=R.squaredLength,R.normalize=I.normalize,R.fromMat3=function(e,t){var n=t[0]+t[4]+t[8],r;if(n>0)r=Math.sqrt(n+1),e[3]=.5*r,r=.5/r,e[0]=(t[5]-t[7])*r,e[1]=(t[6]-t[2])*r,e[2]=(t[1]-t[3])*r;else{var i=0;t[4]>t[0]&&(i=1),t[8]>t[i*3+i]&&(i=2);var a=(i+1)%3,o=(i+2)%3;r=Math.sqrt(t[i*3+i]-t[a*3+a]-t[o*3+o]+1),e[i]=.5*r,r=.5/r,e[3]=(t[a*3+o]-t[o*3+a])*r,e[a]=(t[a*3+i]+t[i*3+a])*r,e[o]=(t[o*3+i]+t[i*3+o])*r}return e};var z=function(e,t,n,r){e||=0,t||=0,n||=0,r=r===void 0?1:r,this.array=R.fromValues(e,t,n,r),this._dirty=!0};z.prototype={constructor:z,add:function(e){return R.add(this.array,this.array,e.array),this._dirty=!0,this},calculateW:function(){return R.calculateW(this.array,this.array),this._dirty=!0,this},set:function(e,t,n,r){return this.array[0]=e,this.array[1]=t,this.array[2]=n,this.array[3]=r,this._dirty=!0,this},setArray:function(e){return this.array[0]=e[0],this.array[1]=e[1],this.array[2]=e[2],this.array[3]=e[3],this._dirty=!0,this},clone:function(){return new z(this.x,this.y,this.z,this.w)},conjugate:function(){return R.conjugate(this.array,this.array),this._dirty=!0,this},copy:function(e){return R.copy(this.array,e.array),this._dirty=!0,this},dot:function(e){return R.dot(this.array,e.array)},fromMat3:function(e){return R.fromMat3(this.array,e.array),this._dirty=!0,this},fromMat4:(function(){var e=L.create();return function(t){return L.fromMat4(e,t.array),L.transpose(e,e),R.fromMat3(this.array,e),this._dirty=!0,this}})(),identity:function(){return R.identity(this.array),this._dirty=!0,this},invert:function(){return R.invert(this.array,this.array),this._dirty=!0,this},len:function(){return R.len(this.array)},length:function(){return R.length(this.array)},lerp:function(e,t,n){return R.lerp(this.array,e.array,t.array,n),this._dirty=!0,this},mul:function(e){return R.mul(this.array,this.array,e.array),this._dirty=!0,this},mulLeft:function(e){return R.multiply(this.array,e.array,this.array),this._dirty=!0,this},multiply:function(e){return R.multiply(this.array,this.array,e.array),this._dirty=!0,this},multiplyLeft:function(e){return R.multiply(this.array,e.array,this.array),this._dirty=!0,this},normalize:function(){return R.normalize(this.array,this.array),this._dirty=!0,this},rotateX:function(e){return R.rotateX(this.array,this.array,e),this._dirty=!0,this},rotateY:function(e){return R.rotateY(this.array,this.array,e),this._dirty=!0,this},rotateZ:function(e){return R.rotateZ(this.array,this.array,e),this._dirty=!0,this},rotationTo:function(e,t){return R.rotationTo(this.array,e.array,t.array),this._dirty=!0,this},setAxes:function(e,t,n){return R.setAxes(this.array,e.array,t.array,n.array),this._dirty=!0,this},setAxisAngle:function(e,t){return R.setAxisAngle(this.array,e.array,t),this._dirty=!0,this},slerp:function(e,t,n){return R.slerp(this.array,e.array,t.array,n),this._dirty=!0,this},sqrLen:function(){return R.sqrLen(this.array)},squaredLength:function(){return R.squaredLength(this.array)},fromEuler:function(e,t){return z.fromEuler(this,e,t)},toString:function(){return`[`+Array.prototype.join.call(this.array,`,`)+`]`},toArray:function(){return Array.prototype.slice.call(this.array)}};var Gr=Object.defineProperty;if(Gr){var Kr=z.prototype;Gr(Kr,`x`,{get:function(){return this.array[0]},set:function(e){this.array[0]=e,this._dirty=!0}}),Gr(Kr,`y`,{get:function(){return this.array[1]},set:function(e){this.array[1]=e,this._dirty=!0}}),Gr(Kr,`z`,{get:function(){return this.array[2]},set:function(e){this.array[2]=e,this._dirty=!0}}),Gr(Kr,`w`,{get:function(){return this.array[3]},set:function(e){this.array[3]=e,this._dirty=!0}})}z.add=function(e,t,n){return R.add(e.array,t.array,n.array),e._dirty=!0,e},z.set=function(e,t,n,r,i){R.set(e.array,t,n,r,i),e._dirty=!0},z.copy=function(e,t){return R.copy(e.array,t.array),e._dirty=!0,e},z.calculateW=function(e,t){return R.calculateW(e.array,t.array),e._dirty=!0,e},z.conjugate=function(e,t){return R.conjugate(e.array,t.array),e._dirty=!0,e},z.identity=function(e){return R.identity(e.array),e._dirty=!0,e},z.invert=function(e,t){return R.invert(e.array,t.array),e._dirty=!0,e},z.dot=function(e,t){return R.dot(e.array,t.array)},z.len=function(e){return R.length(e.array)},z.lerp=function(e,t,n,r){return R.lerp(e.array,t.array,n.array,r),e._dirty=!0,e},z.slerp=function(e,t,n,r){return R.slerp(e.array,t.array,n.array,r),e._dirty=!0,e},z.mul=function(e,t,n){return R.multiply(e.array,t.array,n.array),e._dirty=!0,e},z.multiply=z.mul,z.rotateX=function(e,t,n){return R.rotateX(e.array,t.array,n),e._dirty=!0,e},z.rotateY=function(e,t,n){return R.rotateY(e.array,t.array,n),e._dirty=!0,e},z.rotateZ=function(e,t,n){return R.rotateZ(e.array,t.array,n),e._dirty=!0,e},z.setAxisAngle=function(e,t,n){return R.setAxisAngle(e.array,t.array,n),e._dirty=!0,e},z.normalize=function(e,t){return R.normalize(e.array,t.array),e._dirty=!0,e},z.sqrLen=function(e){return R.sqrLen(e.array)},z.squaredLength=z.sqrLen,z.fromMat3=function(e,t){return R.fromMat3(e.array,t.array),e._dirty=!0,e},z.setAxes=function(e,t,n,r){return R.setAxes(e.array,t.array,n.array,r.array),e._dirty=!0,e},z.rotationTo=function(e,t,n){return R.rotationTo(e.array,t.array,n.array),e._dirty=!0,e},z.fromEuler=function(e,t,n){e._dirty=!0,t=t.array;var r=e.array,i=Math.cos(t[0]/2),a=Math.cos(t[1]/2),o=Math.cos(t[2]/2),s=Math.sin(t[0]/2),c=Math.sin(t[1]/2),l=Math.sin(t[2]/2),n=(n||`XYZ`).toUpperCase();switch(n){case`XYZ`:r[0]=s*a*o+i*c*l,r[1]=i*c*o-s*a*l,r[2]=i*a*l+s*c*o,r[3]=i*a*o-s*c*l;break;case`YXZ`:r[0]=s*a*o+i*c*l,r[1]=i*c*o-s*a*l,r[2]=i*a*l-s*c*o,r[3]=i*a*o+s*c*l;break;case`ZXY`:r[0]=s*a*o-i*c*l,r[1]=i*c*o+s*a*l,r[2]=i*a*l+s*c*o,r[3]=i*a*o-s*c*l;break;case`ZYX`:r[0]=s*a*o-i*c*l,r[1]=i*c*o+s*a*l,r[2]=i*a*l-s*c*o,r[3]=i*a*o+s*c*l;break;case`YZX`:r[0]=s*a*o+i*c*l,r[1]=i*c*o+s*a*l,r[2]=i*a*l-s*c*o,r[3]=i*a*o-s*c*l;break;case`XZY`:r[0]=s*a*o-i*c*l,r[1]=i*c*o-s*a*l,r[2]=i*a*l+s*c*o,r[3]=i*a*o+s*c*l;break}};var B={};B.create=function(){var e=new Lr(16);return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e},B.clone=function(e){var t=new Lr(16);return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[4]=e[4],t[5]=e[5],t[6]=e[6],t[7]=e[7],t[8]=e[8],t[9]=e[9],t[10]=e[10],t[11]=e[11],t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15],t},B.copy=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15],e},B.identity=function(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e},B.transpose=function(e,t){if(e===t){var n=t[1],r=t[2],i=t[3],a=t[6],o=t[7],s=t[11];e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=n,e[6]=t[9],e[7]=t[13],e[8]=r,e[9]=a,e[11]=t[14],e[12]=i,e[13]=o,e[14]=s}else e[0]=t[0],e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=t[1],e[5]=t[5],e[6]=t[9],e[7]=t[13],e[8]=t[2],e[9]=t[6],e[10]=t[10],e[11]=t[14],e[12]=t[3],e[13]=t[7],e[14]=t[11],e[15]=t[15];return e},B.invert=function(e,t){var n=t[0],r=t[1],i=t[2],a=t[3],o=t[4],s=t[5],c=t[6],l=t[7],u=t[8],d=t[9],f=t[10],p=t[11],m=t[12],h=t[13],g=t[14],_=t[15],v=n*s-r*o,y=n*c-i*o,b=n*l-a*o,x=r*c-i*s,S=r*l-a*s,C=i*l-a*c,w=u*h-d*m,T=u*g-f*m,E=u*_-p*m,D=d*g-f*h,O=d*_-p*h,k=f*_-p*g,A=v*k-y*O+b*D+x*E-S*T+C*w;return A?(A=1/A,e[0]=(s*k-c*O+l*D)*A,e[1]=(i*O-r*k-a*D)*A,e[2]=(h*C-g*S+_*x)*A,e[3]=(f*S-d*C-p*x)*A,e[4]=(c*E-o*k-l*T)*A,e[5]=(n*k-i*E+a*T)*A,e[6]=(g*b-m*C-_*y)*A,e[7]=(u*C-f*b+p*y)*A,e[8]=(o*O-s*E+l*w)*A,e[9]=(r*E-n*O-a*w)*A,e[10]=(m*S-h*b+_*v)*A,e[11]=(d*b-u*S-p*v)*A,e[12]=(s*T-o*D-c*w)*A,e[13]=(n*D-r*T+i*w)*A,e[14]=(h*y-m*x-g*v)*A,e[15]=(u*x-d*y+f*v)*A,e):null},B.adjoint=function(e,t){var n=t[0],r=t[1],i=t[2],a=t[3],o=t[4],s=t[5],c=t[6],l=t[7],u=t[8],d=t[9],f=t[10],p=t[11],m=t[12],h=t[13],g=t[14],_=t[15];return e[0]=s*(f*_-p*g)-d*(c*_-l*g)+h*(c*p-l*f),e[1]=-(r*(f*_-p*g)-d*(i*_-a*g)+h*(i*p-a*f)),e[2]=r*(c*_-l*g)-s*(i*_-a*g)+h*(i*l-a*c),e[3]=-(r*(c*p-l*f)-s*(i*p-a*f)+d*(i*l-a*c)),e[4]=-(o*(f*_-p*g)-u*(c*_-l*g)+m*(c*p-l*f)),e[5]=n*(f*_-p*g)-u*(i*_-a*g)+m*(i*p-a*f),e[6]=-(n*(c*_-l*g)-o*(i*_-a*g)+m*(i*l-a*c)),e[7]=n*(c*p-l*f)-o*(i*p-a*f)+u*(i*l-a*c),e[8]=o*(d*_-p*h)-u*(s*_-l*h)+m*(s*p-l*d),e[9]=-(n*(d*_-p*h)-u*(r*_-a*h)+m*(r*p-a*d)),e[10]=n*(s*_-l*h)-o*(r*_-a*h)+m*(r*l-a*s),e[11]=-(n*(s*p-l*d)-o*(r*p-a*d)+u*(r*l-a*s)),e[12]=-(o*(d*g-f*h)-u*(s*g-c*h)+m*(s*f-c*d)),e[13]=n*(d*g-f*h)-u*(r*g-i*h)+m*(r*f-i*d),e[14]=-(n*(s*g-c*h)-o*(r*g-i*h)+m*(r*c-i*s)),e[15]=n*(s*f-c*d)-o*(r*f-i*d)+u*(r*c-i*s),e},B.determinant=function(e){var t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=t*c-i*a,b=n*s-r*o,x=n*c-i*o,S=r*c-i*s,C=l*m-u*p,w=l*h-d*p,T=l*g-f*p,E=u*h-d*m,D=u*g-f*m;return _*(d*g-f*h)-v*D+y*E+b*T-x*w+S*C},B.multiply=function(e,t,n){var r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=t[6],u=t[7],d=t[8],f=t[9],p=t[10],m=t[11],h=t[12],g=t[13],_=t[14],v=t[15],y=n[0],b=n[1],x=n[2],S=n[3];return e[0]=y*r+b*s+x*d+S*h,e[1]=y*i+b*c+x*f+S*g,e[2]=y*a+b*l+x*p+S*_,e[3]=y*o+b*u+x*m+S*v,y=n[4],b=n[5],x=n[6],S=n[7],e[4]=y*r+b*s+x*d+S*h,e[5]=y*i+b*c+x*f+S*g,e[6]=y*a+b*l+x*p+S*_,e[7]=y*o+b*u+x*m+S*v,y=n[8],b=n[9],x=n[10],S=n[11],e[8]=y*r+b*s+x*d+S*h,e[9]=y*i+b*c+x*f+S*g,e[10]=y*a+b*l+x*p+S*_,e[11]=y*o+b*u+x*m+S*v,y=n[12],b=n[13],x=n[14],S=n[15],e[12]=y*r+b*s+x*d+S*h,e[13]=y*i+b*c+x*f+S*g,e[14]=y*a+b*l+x*p+S*_,e[15]=y*o+b*u+x*m+S*v,e},B.multiplyAffine=function(e,t,n){var r=t[0],i=t[1],a=t[2],o=t[4],s=t[5],c=t[6],l=t[8],u=t[9],d=t[10],f=t[12],p=t[13],m=t[14],h=n[0],g=n[1],_=n[2];return e[0]=h*r+g*o+_*l,e[1]=h*i+g*s+_*u,e[2]=h*a+g*c+_*d,h=n[4],g=n[5],_=n[6],e[4]=h*r+g*o+_*l,e[5]=h*i+g*s+_*u,e[6]=h*a+g*c+_*d,h=n[8],g=n[9],_=n[10],e[8]=h*r+g*o+_*l,e[9]=h*i+g*s+_*u,e[10]=h*a+g*c+_*d,h=n[12],g=n[13],_=n[14],e[12]=h*r+g*o+_*l+f,e[13]=h*i+g*s+_*u+p,e[14]=h*a+g*c+_*d+m,e},B.mul=B.multiply,B.mulAffine=B.multiplyAffine,B.translate=function(e,t,n){var r=n[0],i=n[1],a=n[2],o,s,c,l,u,d,f,p,m,h,g,_;return t===e?(e[12]=t[0]*r+t[4]*i+t[8]*a+t[12],e[13]=t[1]*r+t[5]*i+t[9]*a+t[13],e[14]=t[2]*r+t[6]*i+t[10]*a+t[14],e[15]=t[3]*r+t[7]*i+t[11]*a+t[15]):(o=t[0],s=t[1],c=t[2],l=t[3],u=t[4],d=t[5],f=t[6],p=t[7],m=t[8],h=t[9],g=t[10],_=t[11],e[0]=o,e[1]=s,e[2]=c,e[3]=l,e[4]=u,e[5]=d,e[6]=f,e[7]=p,e[8]=m,e[9]=h,e[10]=g,e[11]=_,e[12]=o*r+u*i+m*a+t[12],e[13]=s*r+d*i+h*a+t[13],e[14]=c*r+f*i+g*a+t[14],e[15]=l*r+p*i+_*a+t[15]),e},B.scale=function(e,t,n){var r=n[0],i=n[1],a=n[2];return e[0]=t[0]*r,e[1]=t[1]*r,e[2]=t[2]*r,e[3]=t[3]*r,e[4]=t[4]*i,e[5]=t[5]*i,e[6]=t[6]*i,e[7]=t[7]*i,e[8]=t[8]*a,e[9]=t[9]*a,e[10]=t[10]*a,e[11]=t[11]*a,e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15],e},B.rotate=function(e,t,n,r){var i=r[0],a=r[1],o=r[2],s=Math.sqrt(i*i+a*a+o*o),c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j;return Math.abs(s)<1e-6?null:(s=1/s,i*=s,a*=s,o*=s,c=Math.sin(n),l=Math.cos(n),u=1-l,d=t[0],f=t[1],p=t[2],m=t[3],h=t[4],g=t[5],_=t[6],v=t[7],y=t[8],b=t[9],x=t[10],S=t[11],C=i*i*u+l,w=a*i*u+o*c,T=o*i*u-a*c,E=i*a*u-o*c,D=a*a*u+l,O=o*a*u+i*c,k=i*o*u+a*c,A=a*o*u-i*c,j=o*o*u+l,e[0]=d*C+h*w+y*T,e[1]=f*C+g*w+b*T,e[2]=p*C+_*w+x*T,e[3]=m*C+v*w+S*T,e[4]=d*E+h*D+y*O,e[5]=f*E+g*D+b*O,e[6]=p*E+_*D+x*O,e[7]=m*E+v*D+S*O,e[8]=d*k+h*A+y*j,e[9]=f*k+g*A+b*j,e[10]=p*k+_*A+x*j,e[11]=m*k+v*A+S*j,t!==e&&(e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e)},B.rotateX=function(e,t,n){var r=Math.sin(n),i=Math.cos(n),a=t[4],o=t[5],s=t[6],c=t[7],l=t[8],u=t[9],d=t[10],f=t[11];return t!==e&&(e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[4]=a*i+l*r,e[5]=o*i+u*r,e[6]=s*i+d*r,e[7]=c*i+f*r,e[8]=l*i-a*r,e[9]=u*i-o*r,e[10]=d*i-s*r,e[11]=f*i-c*r,e},B.rotateY=function(e,t,n){var r=Math.sin(n),i=Math.cos(n),a=t[0],o=t[1],s=t[2],c=t[3],l=t[8],u=t[9],d=t[10],f=t[11];return t!==e&&(e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=a*i-l*r,e[1]=o*i-u*r,e[2]=s*i-d*r,e[3]=c*i-f*r,e[8]=a*r+l*i,e[9]=o*r+u*i,e[10]=s*r+d*i,e[11]=c*r+f*i,e},B.rotateZ=function(e,t,n){var r=Math.sin(n),i=Math.cos(n),a=t[0],o=t[1],s=t[2],c=t[3],l=t[4],u=t[5],d=t[6],f=t[7];return t!==e&&(e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=a*i+l*r,e[1]=o*i+u*r,e[2]=s*i+d*r,e[3]=c*i+f*r,e[4]=l*i-a*r,e[5]=u*i-o*r,e[6]=d*i-s*r,e[7]=f*i-c*r,e},B.fromRotationTranslation=function(e,t,n){var r=t[0],i=t[1],a=t[2],o=t[3],s=r+r,c=i+i,l=a+a,u=r*s,d=r*c,f=r*l,p=i*c,m=i*l,h=a*l,g=o*s,_=o*c,v=o*l;return e[0]=1-(p+h),e[1]=d+v,e[2]=f-_,e[3]=0,e[4]=d-v,e[5]=1-(u+h),e[6]=m+g,e[7]=0,e[8]=f+_,e[9]=m-g,e[10]=1-(u+p),e[11]=0,e[12]=n[0],e[13]=n[1],e[14]=n[2],e[15]=1,e},B.fromQuat=function(e,t){var n=t[0],r=t[1],i=t[2],a=t[3],o=n+n,s=r+r,c=i+i,l=n*o,u=r*o,d=r*s,f=i*o,p=i*s,m=i*c,h=a*o,g=a*s,_=a*c;return e[0]=1-d-m,e[1]=u+_,e[2]=f-g,e[3]=0,e[4]=u-_,e[5]=1-l-m,e[6]=p+h,e[7]=0,e[8]=f+g,e[9]=p-h,e[10]=1-l-d,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e},B.frustum=function(e,t,n,r,i,a,o){var s=1/(n-t),c=1/(i-r),l=1/(a-o);return e[0]=a*2*s,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a*2*c,e[6]=0,e[7]=0,e[8]=(n+t)*s,e[9]=(i+r)*c,e[10]=(o+a)*l,e[11]=-1,e[12]=0,e[13]=0,e[14]=o*a*2*l,e[15]=0,e},B.perspective=function(e,t,n,r,i){var a=1/Math.tan(t/2),o=1/(r-i);return e[0]=a/n,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=(i+r)*o,e[11]=-1,e[12]=0,e[13]=0,e[14]=2*i*r*o,e[15]=0,e},B.ortho=function(e,t,n,r,i,a,o){var s=1/(t-n),c=1/(r-i),l=1/(a-o);return e[0]=-2*s,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=-2*c,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=2*l,e[11]=0,e[12]=(t+n)*s,e[13]=(i+r)*c,e[14]=(o+a)*l,e[15]=1,e},B.lookAt=function(e,t,n,r){var i,a,o,s,c,l,u,d,f,p,m=t[0],h=t[1],g=t[2],_=r[0],v=r[1],y=r[2],b=n[0],x=n[1],S=n[2];return Math.abs(m-b)<1e-6&&Math.abs(h-x)<1e-6&&Math.abs(g-S)<1e-6?B.identity(e):(u=m-b,d=h-x,f=g-S,p=1/Math.sqrt(u*u+d*d+f*f),u*=p,d*=p,f*=p,i=v*f-y*d,a=y*u-_*f,o=_*d-v*u,p=Math.sqrt(i*i+a*a+o*o),p?(p=1/p,i*=p,a*=p,o*=p):(i=0,a=0,o=0),s=d*o-f*a,c=f*i-u*o,l=u*a-d*i,p=Math.sqrt(s*s+c*c+l*l),p?(p=1/p,s*=p,c*=p,l*=p):(s=0,c=0,l=0),e[0]=i,e[1]=s,e[2]=u,e[3]=0,e[4]=a,e[5]=c,e[6]=d,e[7]=0,e[8]=o,e[9]=l,e[10]=f,e[11]=0,e[12]=-(i*m+a*h+o*g),e[13]=-(s*m+c*h+l*g),e[14]=-(u*m+d*h+f*g),e[15]=1,e)},B.frob=function(e){return Math.sqrt(e[0]**2+e[1]**2+e[2]**2+e[3]**2+e[4]**2+e[5]**2+e[6]**2+e[7]**2+e[8]**2+e[9]**2+e[10]**2+e[11]**2+e[12]**2+e[13]**2+e[14]**2+e[15]**2)};var V=function(){this._axisX=new F,this._axisY=new F,this._axisZ=new F,this.array=B.create(),this._dirty=!0};V.prototype={constructor:V,setArray:function(e){for(var t=0;t<this.array.length;t++)this.array[t]=e[t];return this._dirty=!0,this},adjoint:function(){return B.adjoint(this.array,this.array),this._dirty=!0,this},clone:function(){return new V().copy(this)},copy:function(e){return B.copy(this.array,e.array),this._dirty=!0,this},determinant:function(){return B.determinant(this.array)},fromQuat:function(e){return B.fromQuat(this.array,e.array),this._dirty=!0,this},fromRotationTranslation:function(e,t){return B.fromRotationTranslation(this.array,e.array,t.array),this._dirty=!0,this},fromMat2d:function(e){return V.fromMat2d(this,e),this},frustum:function(e,t,n,r,i,a){return B.frustum(this.array,e,t,n,r,i,a),this._dirty=!0,this},identity:function(){return B.identity(this.array),this._dirty=!0,this},invert:function(){return B.invert(this.array,this.array),this._dirty=!0,this},lookAt:function(e,t,n){return B.lookAt(this.array,e.array,t.array,n.array),this._dirty=!0,this},mul:function(e){return B.mul(this.array,this.array,e.array),this._dirty=!0,this},mulLeft:function(e){return B.mul(this.array,e.array,this.array),this._dirty=!0,this},multiply:function(e){return B.multiply(this.array,this.array,e.array),this._dirty=!0,this},multiplyLeft:function(e){return B.multiply(this.array,e.array,this.array),this._dirty=!0,this},ortho:function(e,t,n,r,i,a){return B.ortho(this.array,e,t,n,r,i,a),this._dirty=!0,this},perspective:function(e,t,n,r){return B.perspective(this.array,e,t,n,r),this._dirty=!0,this},rotate:function(e,t){return B.rotate(this.array,this.array,e,t.array),this._dirty=!0,this},rotateX:function(e){return B.rotateX(this.array,this.array,e),this._dirty=!0,this},rotateY:function(e){return B.rotateY(this.array,this.array,e),this._dirty=!0,this},rotateZ:function(e){return B.rotateZ(this.array,this.array,e),this._dirty=!0,this},scale:function(e){return B.scale(this.array,this.array,e.array),this._dirty=!0,this},translate:function(e){return B.translate(this.array,this.array,e.array),this._dirty=!0,this},transpose:function(){return B.transpose(this.array,this.array),this._dirty=!0,this},decomposeMatrix:(function(){var e=P.create(),t=P.create(),n=P.create(),r=L.create();return function(i,a,o){var s=this.array;P.set(e,s[0],s[1],s[2]),P.set(t,s[4],s[5],s[6]),P.set(n,s[8],s[9],s[10]);var c=P.length(e),l=P.length(t),u=P.length(n);this.determinant()<0&&(c=-c),i&&i.set(c,l,u),o.set(s[12],s[13],s[14]),L.fromMat4(r,s),r[0]/=c,r[1]/=c,r[2]/=c,r[3]/=l,r[4]/=l,r[5]/=l,r[6]/=u,r[7]/=u,r[8]/=u,R.fromMat3(a.array,r),R.normalize(a.array,a.array),a._dirty=!0,o._dirty=!0}})(),toString:function(){return`[`+Array.prototype.join.call(this.array,`,`)+`]`},toArray:function(){return Array.prototype.slice.call(this.array)}};var qr=Object.defineProperty;if(qr){var Jr=V.prototype;qr(Jr,`z`,{get:function(){var e=this.array;return this._axisZ.set(e[8],e[9],e[10]),this._axisZ},set:function(e){var t=this.array;e=e.array,t[8]=e[0],t[9]=e[1],t[10]=e[2],this._dirty=!0}}),qr(Jr,`y`,{get:function(){var e=this.array;return this._axisY.set(e[4],e[5],e[6]),this._axisY},set:function(e){var t=this.array;e=e.array,t[4]=e[0],t[5]=e[1],t[6]=e[2],this._dirty=!0}}),qr(Jr,`x`,{get:function(){var e=this.array;return this._axisX.set(e[0],e[1],e[2]),this._axisX},set:function(e){var t=this.array;e=e.array,t[0]=e[0],t[1]=e[1],t[2]=e[2],this._dirty=!0}})}V.adjoint=function(e,t){return B.adjoint(e.array,t.array),e._dirty=!0,e},V.copy=function(e,t){return B.copy(e.array,t.array),e._dirty=!0,e},V.determinant=function(e){return B.determinant(e.array)},V.identity=function(e){return B.identity(e.array),e._dirty=!0,e},V.ortho=function(e,t,n,r,i,a,o){return B.ortho(e.array,t,n,r,i,a,o),e._dirty=!0,e},V.perspective=function(e,t,n,r,i){return B.perspective(e.array,t,n,r,i),e._dirty=!0,e},V.lookAt=function(e,t,n,r){return B.lookAt(e.array,t.array,n.array,r.array),e._dirty=!0,e},V.invert=function(e,t){return B.invert(e.array,t.array),e._dirty=!0,e},V.mul=function(e,t,n){return B.mul(e.array,t.array,n.array),e._dirty=!0,e},V.multiply=V.mul,V.fromQuat=function(e,t){return B.fromQuat(e.array,t.array),e._dirty=!0,e},V.fromRotationTranslation=function(e,t,n){return B.fromRotationTranslation(e.array,t.array,n.array),e._dirty=!0,e},V.fromMat2d=function(e,t){e._dirty=!0;var t=t.array,e=e.array;return e[0]=t[0],e[4]=t[2],e[12]=t[4],e[1]=t[1],e[5]=t[3],e[13]=t[5],e},V.rotate=function(e,t,n,r){return B.rotate(e.array,t.array,n,r.array),e._dirty=!0,e},V.rotateX=function(e,t,n){return B.rotateX(e.array,t.array,n),e._dirty=!0,e},V.rotateY=function(e,t,n){return B.rotateY(e.array,t.array,n),e._dirty=!0,e},V.rotateZ=function(e,t,n){return B.rotateZ(e.array,t.array,n),e._dirty=!0,e},V.scale=function(e,t,n){return B.scale(e.array,t.array,n.array),e._dirty=!0,e},V.transpose=function(e,t){return B.transpose(e.array,t.array),e._dirty=!0,e},V.translate=function(e,t,n){return B.translate(e.array,t.array,n.array),e._dirty=!0,e};var Yr=P.set,Xr=P.copy,Zr=function(e,t){this.min=e||new F(1/0,1/0,1/0),this.max=t||new F(-1/0,-1/0,-1/0),this.vertices=null};Zr.prototype={constructor:Zr,updateFromVertices:function(e){if(e.length>0){var t=this.min,n=this.max,r=t.array,i=n.array;Xr(r,e[0]),Xr(i,e[0]);for(var a=1;a<e.length;a++){var o=e[a];o[0]<r[0]&&(r[0]=o[0]),o[1]<r[1]&&(r[1]=o[1]),o[2]<r[2]&&(r[2]=o[2]),o[0]>i[0]&&(i[0]=o[0]),o[1]>i[1]&&(i[1]=o[1]),o[2]>i[2]&&(i[2]=o[2])}t._dirty=!0,n._dirty=!0}},union:function(e){var t=this.min,n=this.max;return P.min(t.array,t.array,e.min.array),P.max(n.array,n.array,e.max.array),t._dirty=!0,n._dirty=!0,this},intersection:function(e){var t=this.min,n=this.max;return P.max(t.array,t.array,e.min.array),P.min(n.array,n.array,e.max.array),t._dirty=!0,n._dirty=!0,this},intersectBoundingBox:function(e){var t=this.min.array,n=this.max.array,r=e.min.array,i=e.max.array;return!(t[0]>i[0]||t[1]>i[1]||t[2]>i[2]||n[0]<r[0]||n[1]<r[1]||n[2]<r[2])},containBoundingBox:function(e){var t=this.min.array,n=this.max.array,r=e.min.array,i=e.max.array;return t[0]<=r[0]&&t[1]<=r[1]&&t[2]<=r[2]&&n[0]>=i[0]&&n[1]>=i[1]&&n[2]>=i[2]},containPoint:function(e){var t=this.min.array,n=this.max.array,r=e.array;return t[0]<=r[0]&&t[1]<=r[1]&&t[2]<=r[2]&&n[0]>=r[0]&&n[1]>=r[1]&&n[2]>=r[2]},isFinite:function(){var e=this.min.array,t=this.max.array;return isFinite(e[0])&&isFinite(e[1])&&isFinite(e[2])&&isFinite(t[0])&&isFinite(t[1])&&isFinite(t[2])},applyTransform:function(e){this.transformFrom(this,e)},transformFrom:(function(){var e=P.create(),t=P.create(),n=P.create(),r=P.create(),i=P.create(),a=P.create();return function(o,s){var c=o.min.array,l=o.max.array,u=s.array;return e[0]=u[0]*c[0],e[1]=u[1]*c[0],e[2]=u[2]*c[0],t[0]=u[0]*l[0],t[1]=u[1]*l[0],t[2]=u[2]*l[0],n[0]=u[4]*c[1],n[1]=u[5]*c[1],n[2]=u[6]*c[1],r[0]=u[4]*l[1],r[1]=u[5]*l[1],r[2]=u[6]*l[1],i[0]=u[8]*c[2],i[1]=u[9]*c[2],i[2]=u[10]*c[2],a[0]=u[8]*l[2],a[1]=u[9]*l[2],a[2]=u[10]*l[2],c=this.min.array,l=this.max.array,c[0]=Math.min(e[0],t[0])+Math.min(n[0],r[0])+Math.min(i[0],a[0])+u[12],c[1]=Math.min(e[1],t[1])+Math.min(n[1],r[1])+Math.min(i[1],a[1])+u[13],c[2]=Math.min(e[2],t[2])+Math.min(n[2],r[2])+Math.min(i[2],a[2])+u[14],l[0]=Math.max(e[0],t[0])+Math.max(n[0],r[0])+Math.max(i[0],a[0])+u[12],l[1]=Math.max(e[1],t[1])+Math.max(n[1],r[1])+Math.max(i[1],a[1])+u[13],l[2]=Math.max(e[2],t[2])+Math.max(n[2],r[2])+Math.max(i[2],a[2])+u[14],this.min._dirty=!0,this.max._dirty=!0,this}})(),applyProjection:function(e){var t=this.min.array,n=this.max.array,r=e.array,i=t[0],a=t[1],o=t[2],s=n[0],c=n[1],l=t[2],u=n[0],d=n[1],f=n[2];if(r[15]===1)t[0]=r[0]*i+r[12],t[1]=r[5]*a+r[13],n[2]=r[10]*o+r[14],n[0]=r[0]*u+r[12],n[1]=r[5]*d+r[13],t[2]=r[10]*f+r[14];else{var p=-1/o;t[0]=r[0]*i*p,t[1]=r[5]*a*p,n[2]=(r[10]*o+r[14])*p,p=-1/l,n[0]=r[0]*s*p,n[1]=r[5]*c*p,p=-1/f,t[2]=(r[10]*f+r[14])*p}return this.min._dirty=!0,this.max._dirty=!0,this},updateVertices:function(){var e=this.vertices;if(!e){e=[];for(var t=0;t<8;t++)e[t]=P.fromValues(0,0,0);this.vertices=e}var n=this.min.array,r=this.max.array;return Yr(e[0],n[0],n[1],n[2]),Yr(e[1],n[0],r[1],n[2]),Yr(e[2],r[0],n[1],n[2]),Yr(e[3],r[0],r[1],n[2]),Yr(e[4],n[0],n[1],r[2]),Yr(e[5],n[0],r[1],r[2]),Yr(e[6],r[0],n[1],r[2]),Yr(e[7],r[0],r[1],r[2]),this},copy:function(e){var t=this.min,n=this.max;return Xr(t.array,e.min.array),Xr(n.array,e.max.array),t._dirty=!0,n._dirty=!0,this},clone:function(){var e=new Zr;return e.copy(this),e}};var Qr=0,$r=Ir.extend({name:``,position:null,rotation:null,scale:null,worldTransform:null,localTransform:null,autoUpdateLocalTransform:!0,_parent:null,_scene:null,_needsUpdateWorldTransform:!0,_inIterating:!1,__depth:0},function(){this.name||=(this.type||`NODE`)+`_`+ Qr++,this.position||=new F,this.rotation||=new z,this.scale||=new F(1,1,1),this.worldTransform=new V,this.localTransform=new V,this._children=[]},{target:null,invisible:!1,isSkinnedMesh:function(){return!1},isRenderable:function(){return!1},setName:function(e){var t=this._scene;if(t){var n=t._nodeRepository;delete n[this.name],n[e]=this}this.name=e},add:function(e){var t=e._parent;if(t!==this){t&&t.remove(e),e._parent=this,this._children.push(e);var n=this._scene;n&&n!==e.scene&&e.traverse(this._addSelfToScene,this),e._needsUpdateWorldTransform=!0}},remove:function(e){var t=this._children,n=t.indexOf(e);n<0||(t.splice(n,1),e._parent=null,this._scene&&e.traverse(this._removeSelfFromScene,this))},removeAll:function(){for(var e=this._children,t=0;t<e.length;t++)e[t]._parent=null,this._scene&&e[t].traverse(this._removeSelfFromScene,this);this._children=[]},getScene:function(){return this._scene},getParent:function(){return this._parent},_removeSelfFromScene:function(e){e._scene.removeFromScene(e),e._scene=null},_addSelfToScene:function(e){this._scene.addToScene(e),e._scene=this._scene},isAncestor:function(e){for(var t=e._parent;t;){if(t===this)return!0;t=t._parent}return!1},children:function(){return this._children.slice()},childAt:function(e){return this._children[e]},getChildByName:function(e){for(var t=this._children,n=0;n<t.length;n++)if(t[n].name===e)return t[n]},getDescendantByName:function(e){for(var t=this._children,n=0;n<t.length;n++){var r=t[n];if(r.name===e)return r;var i=r.getDescendantByName(e);if(i)return i}},queryNode:function(e){if(e){for(var t=e.split(`/`),n=this,r=0;r<t.length;r++){var i=t[r];if(i){for(var a=!1,o=n._children,s=0;s<o.length;s++){var c=o[s];if(c.name===i){n=c,a=!0;break}}if(!a)return}}return n}},getPath:function(e){if(!this._parent)return`/`;for(var t=this._parent,n=this.name;t._parent&&(n=t.name+`/`+n,t._parent!=e);)t=t._parent;return!t._parent&&e?null:n},traverse:function(e,t){e.call(t,this);for(var n=this._children,r=0,i=n.length;r<i;r++)n[r].traverse(e,t)},eachChild:function(e,t){for(var n=this._children,r=0,i=n.length;r<i;r++){var a=n[r];e.call(t,a,r)}},setLocalTransform:function(e){B.copy(this.localTransform.array,e.array),this.decomposeLocalTransform()},decomposeLocalTransform:function(e){var t=e?null:this.scale;this.localTransform.decomposeMatrix(t,this.rotation,this.position)},setWorldTransform:function(e){B.copy(this.worldTransform.array,e.array),this.decomposeWorldTransform()},decomposeWorldTransform:(function(){var e=B.create();return function(t){var n=this.localTransform,r=this.worldTransform;this._parent?(B.invert(e,this._parent.worldTransform.array),B.multiply(n.array,e,r.array)):B.copy(n.array,r.array);var i=t?null:this.scale;n.decomposeMatrix(i,this.rotation,this.position)}})(),transformNeedsUpdate:function(){return this.position._dirty||this.rotation._dirty||this.scale._dirty},updateLocalTransform:function(){var e=this.position,t=this.rotation,n=this.scale;if(this.transformNeedsUpdate()){var r=this.localTransform.array;B.fromRotationTranslation(r,t.array,e.array),B.scale(r,r,n.array),t._dirty=!1,n._dirty=!1,e._dirty=!1,this._needsUpdateWorldTransform=!0}},_updateWorldTransformTopDown:function(){var e=this.localTransform.array,t=this.worldTransform.array;this._parent?B.multiplyAffine(t,this._parent.worldTransform.array,e):B.copy(t,e)},updateWorldTransform:function(){for(var e=this;e&&e.getParent()&&e.getParent().transformNeedsUpdate();)e=e.getParent();e.update()},update:function(e){this.autoUpdateLocalTransform?this.updateLocalTransform():e=!0,(e||this._needsUpdateWorldTransform)&&(this._updateWorldTransformTopDown(),e=!0,this._needsUpdateWorldTransform=!1);for(var t=this._children,n=0,r=t.length;n<r;n++)t[n].update(e)},getBoundingBox:(function(){function e(e){return!e.invisible&&e.geometry}var t=new Zr,n=new V,r=new V;return function(i,a){return a||=new Zr,i||=e,this._parent?V.invert(r,this._parent.worldTransform):V.identity(r),this.traverse(function(e){e.geometry&&e.geometry.boundingBox&&(t.copy(e.geometry.boundingBox),V.multiply(n,r,e.worldTransform),t.applyTransform(n),a.union(t))},this,e),a}})(),getWorldPosition:function(e){this.transformNeedsUpdate()&&this.updateWorldTransform();var t=this.worldTransform.array;if(e){var n=e.array;return n[0]=t[12],n[1]=t[13],n[2]=t[14],e}else return new F(t[12],t[13],t[14])},clone:function(){var e=new this.constructor,t=this._children;e.setName(this.name),e.position.copy(this.position),e.rotation.copy(this.rotation),e.scale.copy(this.scale);for(var n=0;n<t.length;n++)e.add(t[n].clone());return e},rotateAround:(function(){var e=new F,t=new V;return function(n,r,i){e.copy(this.position).subtract(n);var a=this.localTransform;a.identity(),a.translate(n),a.rotate(i,r),t.fromRotationTranslation(this.rotation,e),a.multiply(t),a.scale(this.scale),this.decomposeLocalTransform(),this._needsUpdateWorldTransform=!0}})(),lookAt:(function(){var e=new V;return function(t,n){e.lookAt(this.position,t,n||this.localTransform.y).invert(),this.setLocalTransform(e),this.target=t}})()}),H={DEPTH_BUFFER_BIT:256,STENCIL_BUFFER_BIT:1024,COLOR_BUFFER_BIT:16384,POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,ZERO:0,ONE:1,SRC_COLOR:768,ONE_MINUS_SRC_COLOR:769,SRC_ALPHA:770,ONE_MINUS_SRC_ALPHA:771,DST_ALPHA:772,ONE_MINUS_DST_ALPHA:773,DST_COLOR:774,ONE_MINUS_DST_COLOR:775,SRC_ALPHA_SATURATE:776,FUNC_ADD:32774,BLEND_EQUATION:32777,BLEND_EQUATION_RGB:32777,BLEND_EQUATION_ALPHA:34877,FUNC_SUBTRACT:32778,FUNC_REVERSE_SUBTRACT:32779,BLEND_DST_RGB:32968,BLEND_SRC_RGB:32969,BLEND_DST_ALPHA:32970,BLEND_SRC_ALPHA:32971,CONSTANT_COLOR:32769,ONE_MINUS_CONSTANT_COLOR:32770,CONSTANT_ALPHA:32771,ONE_MINUS_CONSTANT_ALPHA:32772,BLEND_COLOR:32773,ARRAY_BUFFER:34962,ELEMENT_ARRAY_BUFFER:34963,ARRAY_BUFFER_BINDING:34964,ELEMENT_ARRAY_BUFFER_BINDING:34965,STREAM_DRAW:35040,STATIC_DRAW:35044,DYNAMIC_DRAW:35048,BUFFER_SIZE:34660,BUFFER_USAGE:34661,CURRENT_VERTEX_ATTRIB:34342,FRONT:1028,BACK:1029,FRONT_AND_BACK:1032,CULL_FACE:2884,BLEND:3042,DITHER:3024,STENCIL_TEST:2960,DEPTH_TEST:2929,SCISSOR_TEST:3089,POLYGON_OFFSET_FILL:32823,SAMPLE_ALPHA_TO_COVERAGE:32926,SAMPLE_COVERAGE:32928,NO_ERROR:0,INVALID_ENUM:1280,INVALID_VALUE:1281,INVALID_OPERATION:1282,OUT_OF_MEMORY:1285,CW:2304,CCW:2305,LINE_WIDTH:2849,ALIASED_POINT_SIZE_RANGE:33901,ALIASED_LINE_WIDTH_RANGE:33902,CULL_FACE_MODE:2885,FRONT_FACE:2886,DEPTH_RANGE:2928,DEPTH_WRITEMASK:2930,DEPTH_CLEAR_VALUE:2931,DEPTH_FUNC:2932,STENCIL_CLEAR_VALUE:2961,STENCIL_FUNC:2962,STENCIL_FAIL:2964,STENCIL_PASS_DEPTH_FAIL:2965,STENCIL_PASS_DEPTH_PASS:2966,STENCIL_REF:2967,STENCIL_VALUE_MASK:2963,STENCIL_WRITEMASK:2968,STENCIL_BACK_FUNC:34816,STENCIL_BACK_FAIL:34817,STENCIL_BACK_PASS_DEPTH_FAIL:34818,STENCIL_BACK_PASS_DEPTH_PASS:34819,STENCIL_BACK_REF:36003,STENCIL_BACK_VALUE_MASK:36004,STENCIL_BACK_WRITEMASK:36005,VIEWPORT:2978,SCISSOR_BOX:3088,COLOR_CLEAR_VALUE:3106,COLOR_WRITEMASK:3107,UNPACK_ALIGNMENT:3317,PACK_ALIGNMENT:3333,MAX_TEXTURE_SIZE:3379,MAX_VIEWPORT_DIMS:3386,SUBPIXEL_BITS:3408,RED_BITS:3410,GREEN_BITS:3411,BLUE_BITS:3412,ALPHA_BITS:3413,DEPTH_BITS:3414,STENCIL_BITS:3415,POLYGON_OFFSET_UNITS:10752,POLYGON_OFFSET_FACTOR:32824,TEXTURE_BINDING_2D:32873,SAMPLE_BUFFERS:32936,SAMPLES:32937,SAMPLE_COVERAGE_VALUE:32938,SAMPLE_COVERAGE_INVERT:32939,COMPRESSED_TEXTURE_FORMATS:34467,DONT_CARE:4352,FASTEST:4353,NICEST:4354,GENERATE_MIPMAP_HINT:33170,BYTE:5120,UNSIGNED_BYTE:5121,SHORT:5122,UNSIGNED_SHORT:5123,INT:5124,UNSIGNED_INT:5125,FLOAT:5126,DEPTH_COMPONENT:6402,ALPHA:6406,RGB:6407,RGBA:6408,LUMINANCE:6409,LUMINANCE_ALPHA:6410,UNSIGNED_SHORT_4_4_4_4:32819,UNSIGNED_SHORT_5_5_5_1:32820,UNSIGNED_SHORT_5_6_5:33635,FRAGMENT_SHADER:35632,VERTEX_SHADER:35633,MAX_VERTEX_ATTRIBS:34921,MAX_VERTEX_UNIFORM_VECTORS:36347,MAX_VARYING_VECTORS:36348,MAX_COMBINED_TEXTURE_IMAGE_UNITS:35661,MAX_VERTEX_TEXTURE_IMAGE_UNITS:35660,MAX_TEXTURE_IMAGE_UNITS:34930,MAX_FRAGMENT_UNIFORM_VECTORS:36349,SHADER_TYPE:35663,DELETE_STATUS:35712,LINK_STATUS:35714,VALIDATE_STATUS:35715,ATTACHED_SHADERS:35717,ACTIVE_UNIFORMS:35718,ACTIVE_ATTRIBUTES:35721,SHADING_LANGUAGE_VERSION:35724,CURRENT_PROGRAM:35725,NEVER:512,LESS:513,EQUAL:514,LEQUAL:515,GREATER:516,NOTEQUAL:517,GEQUAL:518,ALWAYS:519,KEEP:7680,REPLACE:7681,INCR:7682,DECR:7683,INVERT:5386,INCR_WRAP:34055,DECR_WRAP:34056,VENDOR:7936,RENDERER:7937,VERSION:7938,NEAREST:9728,LINEAR:9729,NEAREST_MIPMAP_NEAREST:9984,LINEAR_MIPMAP_NEAREST:9985,NEAREST_MIPMAP_LINEAR:9986,LINEAR_MIPMAP_LINEAR:9987,TEXTURE_MAG_FILTER:10240,TEXTURE_MIN_FILTER:10241,TEXTURE_WRAP_S:10242,TEXTURE_WRAP_T:10243,TEXTURE_2D:3553,TEXTURE:5890,TEXTURE_CUBE_MAP:34067,TEXTURE_BINDING_CUBE_MAP:34068,TEXTURE_CUBE_MAP_POSITIVE_X:34069,TEXTURE_CUBE_MAP_NEGATIVE_X:34070,TEXTURE_CUBE_MAP_POSITIVE_Y:34071,TEXTURE_CUBE_MAP_NEGATIVE_Y:34072,TEXTURE_CUBE_MAP_POSITIVE_Z:34073,TEXTURE_CUBE_MAP_NEGATIVE_Z:34074,MAX_CUBE_MAP_TEXTURE_SIZE:34076,TEXTURE0:33984,TEXTURE1:33985,TEXTURE2:33986,TEXTURE3:33987,TEXTURE4:33988,TEXTURE5:33989,TEXTURE6:33990,TEXTURE7:33991,TEXTURE8:33992,TEXTURE9:33993,TEXTURE10:33994,TEXTURE11:33995,TEXTURE12:33996,TEXTURE13:33997,TEXTURE14:33998,TEXTURE15:33999,TEXTURE16:34e3,TEXTURE17:34001,TEXTURE18:34002,TEXTURE19:34003,TEXTURE20:34004,TEXTURE21:34005,TEXTURE22:34006,TEXTURE23:34007,TEXTURE24:34008,TEXTURE25:34009,TEXTURE26:34010,TEXTURE27:34011,TEXTURE28:34012,TEXTURE29:34013,TEXTURE30:34014,TEXTURE31:34015,ACTIVE_TEXTURE:34016,REPEAT:10497,CLAMP_TO_EDGE:33071,MIRRORED_REPEAT:33648,FLOAT_VEC2:35664,FLOAT_VEC3:35665,FLOAT_VEC4:35666,INT_VEC2:35667,INT_VEC3:35668,INT_VEC4:35669,BOOL:35670,BOOL_VEC2:35671,BOOL_VEC3:35672,BOOL_VEC4:35673,FLOAT_MAT2:35674,FLOAT_MAT3:35675,FLOAT_MAT4:35676,SAMPLER_2D:35678,SAMPLER_CUBE:35680,VERTEX_ATTRIB_ARRAY_ENABLED:34338,VERTEX_ATTRIB_ARRAY_SIZE:34339,VERTEX_ATTRIB_ARRAY_STRIDE:34340,VERTEX_ATTRIB_ARRAY_TYPE:34341,VERTEX_ATTRIB_ARRAY_NORMALIZED:34922,VERTEX_ATTRIB_ARRAY_POINTER:34373,VERTEX_ATTRIB_ARRAY_BUFFER_BINDING:34975,COMPILE_STATUS:35713,LOW_FLOAT:36336,MEDIUM_FLOAT:36337,HIGH_FLOAT:36338,LOW_INT:36339,MEDIUM_INT:36340,HIGH_INT:36341,FRAMEBUFFER:36160,RENDERBUFFER:36161,RGBA4:32854,RGB5_A1:32855,RGB565:36194,DEPTH_COMPONENT16:33189,STENCIL_INDEX:6401,STENCIL_INDEX8:36168,DEPTH_STENCIL:34041,RENDERBUFFER_WIDTH:36162,RENDERBUFFER_HEIGHT:36163,RENDERBUFFER_INTERNAL_FORMAT:36164,RENDERBUFFER_RED_SIZE:36176,RENDERBUFFER_GREEN_SIZE:36177,RENDERBUFFER_BLUE_SIZE:36178,RENDERBUFFER_ALPHA_SIZE:36179,RENDERBUFFER_DEPTH_SIZE:36180,RENDERBUFFER_STENCIL_SIZE:36181,FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE:36048,FRAMEBUFFER_ATTACHMENT_OBJECT_NAME:36049,FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL:36050,FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE:36051,COLOR_ATTACHMENT0:36064,DEPTH_ATTACHMENT:36096,STENCIL_ATTACHMENT:36128,DEPTH_STENCIL_ATTACHMENT:33306,NONE:0,FRAMEBUFFER_COMPLETE:36053,FRAMEBUFFER_INCOMPLETE_ATTACHMENT:36054,FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:36055,FRAMEBUFFER_INCOMPLETE_DIMENSIONS:36057,FRAMEBUFFER_UNSUPPORTED:36061,FRAMEBUFFER_BINDING:36006,RENDERBUFFER_BINDING:36007,MAX_RENDERBUFFER_SIZE:34024,INVALID_FRAMEBUFFER_OPERATION:1286,UNPACK_FLIP_Y_WEBGL:37440,UNPACK_PREMULTIPLY_ALPHA_WEBGL:37441,CONTEXT_LOST_WEBGL:37442,UNPACK_COLORSPACE_CONVERSION_WEBGL:37443,BROWSER_DEFAULT_WEBGL:37444},ei=$r.extend({material:null,geometry:null,mode:H.TRIANGLES,_renderInfo:null},{__program:null,lightGroup:0,renderOrder:0,culling:!0,cullFace:H.BACK,frontFace:H.CCW,frustumCulling:!0,receiveShadow:!0,castShadow:!0,ignorePicking:!1,ignorePreZ:!1,ignoreGBuffer:!1,isRenderable:function(){return this.geometry&&this.material&&this.material.shader&&!this.invisible&&this.geometry.vertexCount>0},beforeRender:function(e){},afterRender:function(e,t){},getBoundingBox:function(e,t){return t=$r.prototype.getBoundingBox.call(this,e,t),this.geometry&&this.geometry.boundingBox&&t.union(this.geometry.boundingBox),t},clone:(function(){var e=[`castShadow`,`receiveShadow`,`mode`,`culling`,`cullFace`,`frontFace`,`frustumCulling`,`renderOrder`,`lineWidth`,`ignorePicking`,`ignorePreZ`,`ignoreGBuffer`];return function(){var t=$r.prototype.clone.call(this);t.geometry=this.geometry,t.material=this.material;for(var n=0;n<e.length;n++){var r=e[n];t[r]!==this[r]&&(t[r]=this[r])}return t}})()});ei.POINTS=H.POINTS,ei.LINES=H.LINES,ei.LINE_LOOP=H.LINE_LOOP,ei.LINE_STRIP=H.LINE_STRIP,ei.TRIANGLES=H.TRIANGLES,ei.TRIANGLE_STRIP=H.TRIANGLE_STRIP,ei.TRIANGLE_FAN=H.TRIANGLE_FAN,ei.BACK=H.BACK,ei.FRONT=H.FRONT,ei.FRONT_AND_BACK=H.FRONT_AND_BACK,ei.CW=H.CW,ei.CCW=H.CCW;var ti=ei.extend({skeleton:null,joints:null},function(){this.joints||=[]},{offsetMatrix:null,isInstancedMesh:function(){return!1},isSkinnedMesh:function(){return!!(this.skeleton&&this.joints&&this.joints.length>0)},clone:function(){var e=ei.prototype.clone.call(this);return e.skeleton=this.skeleton,this.joints&&(e.joints=this.joints.slice()),e}});ti.POINTS=H.POINTS,ti.LINES=H.LINES,ti.LINE_LOOP=H.LINE_LOOP,ti.LINE_STRIP=H.LINE_STRIP,ti.TRIANGLES=H.TRIANGLES,ti.TRIANGLE_STRIP=H.TRIANGLE_STRIP,ti.TRIANGLE_FAN=H.TRIANGLE_FAN,ti.BACK=H.BACK,ti.FRONT=H.FRONT,ti.FRONT_AND_BACK=H.FRONT_AND_BACK,ti.CW=H.CW,ti.CCW=H.CCW;var ni=[`OES_texture_float`,`OES_texture_half_float`,`OES_texture_float_linear`,`OES_texture_half_float_linear`,`OES_standard_derivatives`,`OES_vertex_array_object`,`OES_element_index_uint`,`WEBGL_compressed_texture_s3tc`,`WEBGL_depth_texture`,`EXT_texture_filter_anisotropic`,`EXT_shader_texture_lod`,`WEBGL_draw_buffers`,`EXT_frag_depth`,`EXT_sRGB`,`ANGLE_instanced_arrays`],ri=[`MAX_TEXTURE_SIZE`,`MAX_CUBE_MAP_TEXTURE_SIZE`];function ii(e){for(var t={},n={},r=0;r<ni.length;r++){var i=ni[r];o(i)}for(var r=0;r<ri.length;r++){var a=ri[r];n[a]=e.getParameter(e[a])}this.getExtension=function(e){return e in t||o(e),t[e]},this.getParameter=function(e){return n[e]};function o(n){if(e.getExtension){var r=e.getExtension(n);r||=e.getExtension(`MOZ_`+n),r||=e.getExtension(`WEBKIT_`+n),t[n]=r}}}function ai(e){var t=new XMLHttpRequest;t.open(`get`,e.url),t.responseType=e.responseType||`text`,e.onprogress&&(t.onprogress=function(t){if(t.lengthComputable){var n=t.loaded/t.total;e.onprogress(n,t.loaded,t.total)}else e.onprogress(null)}),t.onload=function(n){t.status>=400?e.onerror&&e.onerror():e.onload&&e.onload(t.response)},e.onerror&&(t.onerror=e.onerror),t.send(null)}var oi={get:ai},si,U={};U.supportWebGL=function(){if(si==null)try{var e=document.createElement(`canvas`);if(!(e.getContext(`webgl`)||e.getContext(`experimental-webgl`)))throw Error()}catch{si=!1}return si},U.Int8Array=typeof Int8Array>`u`?Array:Int8Array,U.Uint8Array=typeof Uint8Array>`u`?Array:Uint8Array,U.Uint16Array=typeof Uint16Array>`u`?Array:Uint16Array,U.Uint32Array=typeof Uint32Array>`u`?Array:Uint32Array,U.Int16Array=typeof Int16Array>`u`?Array:Int16Array,U.Float32Array=typeof Float32Array>`u`?Array:Float32Array,U.Float64Array=typeof Float64Array>`u`?Array:Float64Array;var ci={};typeof window<`u`?ci=window:typeof global<`u`&&(ci=global),U.requestAnimationFrame=ci.requestAnimationFrame||ci.msRequestAnimationFrame||ci.mozRequestAnimationFrame||ci.webkitRequestAnimationFrame||function(e){setTimeout(e,16)},U.createCanvas=function(){return document.createElement(`canvas`)},U.createImage=function(){return new ci.Image},U.request={get:oi.get},U.addEventListener=function(e,t,n,r){e.addEventListener(t,n,r)},U.removeEventListener=function(e,t,n){e.removeEventListener(t,n)};var li=function(){this.head=null,this.tail=null,this._length=0};li.prototype.insert=function(e){var t=new li.Entry(e);return this.insertEntry(t),t},li.prototype.insertAt=function(e,t){if(!(e<0)){for(var n=this.head,r=0;n&&r!=e;)n=n.next,r++;if(n){var i=new li.Entry(t),a=n.prev;a?(a.next=i,i.prev=a):this.head=i,i.next=n,n.prev=i}else this.insert(t)}},li.prototype.insertBeforeEntry=function(e,t){var n=new li.Entry(e),r=t.prev;r?(r.next=n,n.prev=r):this.head=n,n.next=t,t.prev=n,this._length++},li.prototype.insertEntry=function(e){this.head?(this.tail.next=e,e.prev=this.tail,this.tail=e):this.head=this.tail=e,this._length++},li.prototype.remove=function(e){var t=e.prev,n=e.next;t?t.next=n:this.head=n,n?n.prev=t:this.tail=t,e.next=e.prev=null,this._length--},li.prototype.removeAt=function(e){if(!(e<0)){for(var t=this.head,n=0;t&&n!=e;)t=t.next,n++;if(t)return this.remove(t),t.value}},li.prototype.getHead=function(){if(this.head)return this.head.value},li.prototype.getTail=function(){if(this.tail)return this.tail.value},li.prototype.getAt=function(e){if(!(e<0)){for(var t=this.head,n=0;t&&n!=e;)t=t.next,n++;return t.value}},li.prototype.indexOf=function(e){for(var t=this.head,n=0;t;){if(t.value===e)return n;t=t.next,n++}},li.prototype.length=function(){return this._length},li.prototype.isEmpty=function(){return this._length===0},li.prototype.forEach=function(e,t){for(var n=this.head,r=0,i=t!==void 0;n;)i?e.call(t,n.value,r):e(n.value,r),n=n.next,r++},li.prototype.clear=function(){this.tail=this.head=null,this._length=0},li.Entry=function(e){this.value=e,this.next=null,this.prev=null};var ui=function(e){this._list=new li,this._map={},this._maxSize=e||10};ui.prototype.setMaxSize=function(e){this._maxSize=e},ui.prototype.put=function(e,t){if(!this._map.hasOwnProperty(e)){var n=this._list.length();if(n>=this._maxSize&&n>0){var r=this._list.head;this._list.remove(r),delete this._map[r.key]}var i=this._list.insert(t);i.key=e,this._map[e]=i}},ui.prototype.get=function(e){var t=this._map[e];if(this._map.hasOwnProperty(e))return t!==this._list.tail&&(this._list.remove(t),this._list.insertEntry(t)),t.value},ui.prototype.remove=function(e){var t=this._map[e];t!==void 0&&(delete this._map[e],this._list.remove(t))},ui.prototype.clear=function(){this._list.clear(),this._map={}};var di={},fi={transparent:[0,0,0,0],aliceblue:[240,248,255,1],antiquewhite:[250,235,215,1],aqua:[0,255,255,1],aquamarine:[127,255,212,1],azure:[240,255,255,1],beige:[245,245,220,1],bisque:[255,228,196,1],black:[0,0,0,1],blanchedalmond:[255,235,205,1],blue:[0,0,255,1],blueviolet:[138,43,226,1],brown:[165,42,42,1],burlywood:[222,184,135,1],cadetblue:[95,158,160,1],chartreuse:[127,255,0,1],chocolate:[210,105,30,1],coral:[255,127,80,1],cornflowerblue:[100,149,237,1],cornsilk:[255,248,220,1],crimson:[220,20,60,1],cyan:[0,255,255,1],darkblue:[0,0,139,1],darkcyan:[0,139,139,1],darkgoldenrod:[184,134,11,1],darkgray:[169,169,169,1],darkgreen:[0,100,0,1],darkgrey:[169,169,169,1],darkkhaki:[189,183,107,1],darkmagenta:[139,0,139,1],darkolivegreen:[85,107,47,1],darkorange:[255,140,0,1],darkorchid:[153,50,204,1],darkred:[139,0,0,1],darksalmon:[233,150,122,1],darkseagreen:[143,188,143,1],darkslateblue:[72,61,139,1],darkslategray:[47,79,79,1],darkslategrey:[47,79,79,1],darkturquoise:[0,206,209,1],darkviolet:[148,0,211,1],deeppink:[255,20,147,1],deepskyblue:[0,191,255,1],dimgray:[105,105,105,1],dimgrey:[105,105,105,1],dodgerblue:[30,144,255,1],firebrick:[178,34,34,1],floralwhite:[255,250,240,1],forestgreen:[34,139,34,1],fuchsia:[255,0,255,1],gainsboro:[220,220,220,1],ghostwhite:[248,248,255,1],gold:[255,215,0,1],goldenrod:[218,165,32,1],gray:[128,128,128,1],green:[0,128,0,1],greenyellow:[173,255,47,1],grey:[128,128,128,1],honeydew:[240,255,240,1],hotpink:[255,105,180,1],indianred:[205,92,92,1],indigo:[75,0,130,1],ivory:[255,255,240,1],khaki:[240,230,140,1],lavender:[230,230,250,1],lavenderblush:[255,240,245,1],lawngreen:[124,252,0,1],lemonchiffon:[255,250,205,1],lightblue:[173,216,230,1],lightcoral:[240,128,128,1],lightcyan:[224,255,255,1],lightgoldenrodyellow:[250,250,210,1],lightgray:[211,211,211,1],lightgreen:[144,238,144,1],lightgrey:[211,211,211,1],lightpink:[255,182,193,1],lightsalmon:[255,160,122,1],lightseagreen:[32,178,170,1],lightskyblue:[135,206,250,1],lightslategray:[119,136,153,1],lightslategrey:[119,136,153,1],lightsteelblue:[176,196,222,1],lightyellow:[255,255,224,1],lime:[0,255,0,1],limegreen:[50,205,50,1],linen:[250,240,230,1],magenta:[255,0,255,1],maroon:[128,0,0,1],mediumaquamarine:[102,205,170,1],mediumblue:[0,0,205,1],mediumorchid:[186,85,211,1],mediumpurple:[147,112,219,1],mediumseagreen:[60,179,113,1],mediumslateblue:[123,104,238,1],mediumspringgreen:[0,250,154,1],mediumturquoise:[72,209,204,1],mediumvioletred:[199,21,133,1],midnightblue:[25,25,112,1],mintcream:[245,255,250,1],mistyrose:[255,228,225,1],moccasin:[255,228,181,1],navajowhite:[255,222,173,1],navy:[0,0,128,1],oldlace:[253,245,230,1],olive:[128,128,0,1],olivedrab:[107,142,35,1],orange:[255,165,0,1],orangered:[255,69,0,1],orchid:[218,112,214,1],palegoldenrod:[238,232,170,1],palegreen:[152,251,152,1],paleturquoise:[175,238,238,1],palevioletred:[219,112,147,1],papayawhip:[255,239,213,1],peachpuff:[255,218,185,1],peru:[205,133,63,1],pink:[255,192,203,1],plum:[221,160,221,1],powderblue:[176,224,230,1],purple:[128,0,128,1],red:[255,0,0,1],rosybrown:[188,143,143,1],royalblue:[65,105,225,1],saddlebrown:[139,69,19,1],salmon:[250,128,114,1],sandybrown:[244,164,96,1],seagreen:[46,139,87,1],seashell:[255,245,238,1],sienna:[160,82,45,1],silver:[192,192,192,1],skyblue:[135,206,235,1],slateblue:[106,90,205,1],slategray:[112,128,144,1],slategrey:[112,128,144,1],snow:[255,250,250,1],springgreen:[0,255,127,1],steelblue:[70,130,180,1],tan:[210,180,140,1],teal:[0,128,128,1],thistle:[216,191,216,1],tomato:[255,99,71,1],turquoise:[64,224,208,1],violet:[238,130,238,1],wheat:[245,222,179,1],white:[255,255,255,1],whitesmoke:[245,245,245,1],yellow:[255,255,0,1],yellowgreen:[154,205,50,1]};function pi(e){return e=Math.round(e),e<0?0:e>255?255:e}function mi(e){return e=Math.round(e),e<0?0:e>360?360:e}function hi(e){return e<0?0:e>1?1:e}function gi(e){return e.length&&e.charAt(e.length-1)===`%`?pi(parseFloat(e)/100*255):pi(parseInt(e,10))}function _i(e){return e.length&&e.charAt(e.length-1)===`%`?hi(parseFloat(e)/100):hi(parseFloat(e))}function vi(e,t,n){return n<0?n+=1:n>1&&--n,n*6<1?e+(t-e)*n*6:n*2<1?t:n*3<2?e+(t-e)*(2/3-n)*6:e}function yi(e,t,n){return e+(t-e)*n}function bi(e,t,n,r,i){return e[0]=t,e[1]=n,e[2]=r,e[3]=i,e}function xi(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e}var Si=new ui(20),Ci=null;function wi(e,t){Ci&&xi(Ci,t),Ci=Si.put(e,Ci||t.slice())}di.parse=function(e,t){if(e){t||=[];var n=Si.get(e);if(n)return xi(t,n);e+=``;var r=e.replace(/ /g,``).toLowerCase();if(r in fi)return xi(t,fi[r]),wi(e,t),t;if(r.charAt(0)===`#`){if(r.length===4){var i=parseInt(r.substr(1),16);if(!(i>=0&&i<=4095)){bi(t,0,0,0,1);return}return bi(t,(i&3840)>>4|(i&3840)>>8,i&240|(i&240)>>4,i&15|(i&15)<<4,1),wi(e,t),t}else if(r.length===7){var i=parseInt(r.substr(1),16);if(!(i>=0&&i<=16777215)){bi(t,0,0,0,1);return}return bi(t,(i&16711680)>>16,(i&65280)>>8,i&255,1),wi(e,t),t}return}var a=r.indexOf(`(`),o=r.indexOf(`)`);if(a!==-1&&o+1===r.length){var s=r.substr(0,a),c=r.substr(a+1,o-(a+1)).split(`,`),l=1;switch(s){case`rgba`:if(c.length!==4){bi(t,0,0,0,1);return}l=_i(c.pop());case`rgb`:if(c.length!==3){bi(t,0,0,0,1);return}return bi(t,gi(c[0]),gi(c[1]),gi(c[2]),l),wi(e,t),t;case`hsla`:if(c.length!==4){bi(t,0,0,0,1);return}return c[3]=_i(c[3]),Ti(c,t),wi(e,t),t;case`hsl`:if(c.length!==3){bi(t,0,0,0,1);return}return Ti(c,t),wi(e,t),t;default:return}}bi(t,0,0,0,1)}},di.parseToFloat=function(e,t){if(t=di.parse(e,t),t)return t[0]/=255,t[1]/=255,t[2]/=255,t};function Ti(e,t){var n=(parseFloat(e[0])%360+360)%360/360,r=_i(e[1]),i=_i(e[2]),a=i<=.5?i*(r+1):i+r-i*r,o=i*2-a;return t||=[],bi(t,pi(vi(o,a,n+1/3)*255),pi(vi(o,a,n)*255),pi(vi(o,a,n-1/3)*255),1),e.length===4&&(t[3]=e[3]),t}function Ei(e){if(e){var t=e[0]/255,n=e[1]/255,r=e[2]/255,i=Math.min(t,n,r),a=Math.max(t,n,r),o=a-i,s=(a+i)/2,c,l;if(o===0)c=0,l=0;else{l=s<.5?o/(a+i):o/(2-a-i);var u=((a-t)/6+o/2)/o,d=((a-n)/6+o/2)/o,f=((a-r)/6+o/2)/o;t===a?c=f-d:n===a?c=1/3+u-f:r===a&&(c=2/3+d-u),c<0&&(c+=1),c>1&&--c}var p=[c*360,l,s];return e[3]!=null&&p.push(e[3]),p}}di.lift=function(e,t){var n=di.parse(e);if(n){for(var r=0;r<3;r++)t<0?n[r]=n[r]*(1-t)|0:n[r]=(255-n[r])*t+n[r]|0;return di.stringify(n,n.length===4?`rgba`:`rgb`)}},di.toHex=function(e){var t=di.parse(e);if(t)return((1<<24)+(t[0]<<16)+(t[1]<<8)+ +t[2]).toString(16).slice(1)},di.fastLerp=function(e,t,n){if(!(!(t&&t.length)||!(e>=0&&e<=1))){n||=[];var r=e*(t.length-1),i=Math.floor(r),a=Math.ceil(r),o=t[i],s=t[a],c=r-i;return n[0]=pi(yi(o[0],s[0],c)),n[1]=pi(yi(o[1],s[1],c)),n[2]=pi(yi(o[2],s[2],c)),n[3]=hi(yi(o[3],s[3],c)),n}},di.fastMapToColor=di.fastLerp,di.lerp=function(e,t,n){if(!(!(t&&t.length)||!(e>=0&&e<=1))){var r=e*(t.length-1),i=Math.floor(r),a=Math.ceil(r),o=di.parse(t[i]),s=di.parse(t[a]),c=r-i,l=di.stringify([pi(yi(o[0],s[0],c)),pi(yi(o[1],s[1],c)),pi(yi(o[2],s[2],c)),hi(yi(o[3],s[3],c))],`rgba`);return n?{color:l,leftIndex:i,rightIndex:a,value:r}:l}},di.mapToColor=di.lerp,di.modifyHSL=function(e,t,n,r){if(e=di.parse(e),e)return e=Ei(e),t!=null&&(e[0]=mi(t)),n!=null&&(e[1]=_i(n)),r!=null&&(e[2]=_i(r)),di.stringify(Ti(e),`rgba`)},di.modifyAlpha=function(e,t){if(e=di.parse(e),e&&t!=null)return e[3]=hi(t),di.stringify(e,`rgba`)},di.stringify=function(e,t){if(!(!e||!e.length)){var n=e[0]+`,`+e[1]+`,`+e[2];return(t===`rgba`||t===`hsva`||t===`hsla`)&&(n+=`,`+e[3]),t+`(`+n+`)`}};var Di=di.parseToFloat,Oi={};function ki(e){var t=Object.keys(e);t.sort();for(var n=[],r=0;r<t.length;r++){var i=t[r],a=e[i];a===null?n.push(i):n.push(i+` `+a.toString())}return n.join(`
`)}function Ai(e,t,n){n.sort();for(var r=[],i=0;i<n.length;i++){var a=n[i];r.push(a)}var o=ki(e)+`
`+ki(t)+`
`+r.join(`
`);if(Oi[o])return Oi[o];var s=Fr.genGUID();return Oi[o]=s,s}var ji=Ir.extend(function(){return{name:``,depthTest:!0,depthMask:!0,transparent:!1,blend:null,autoUpdateTextureStatus:!0,uniforms:{},vertexDefines:{},fragmentDefines:{},_textureStatus:{},_enabledUniforms:null}},function(){this.name||=`MATERIAL_`+this.__uid__,this.shader&&this.attachShader(this.shader,!0)},{precision:`highp`,setUniform:function(e,t){t===void 0&&console.warn(`Uniform value "`+e+`" is undefined`);var n=this.uniforms[e];n&&(typeof t==`string`&&(t=Di(t)||t),n.value=t,this.autoUpdateTextureStatus&&n.type===`t`&&(t?this.enableTexture(e):this.disableTexture(e)))},setUniforms:function(e){for(var t in e){var n=e[t];this.setUniform(t,n)}},isUniformEnabled:function(e){return this._enabledUniforms.indexOf(e)>=0},getEnabledUniforms:function(){return this._enabledUniforms},getTextureUniforms:function(){return this._textureUniforms},set:function(e,t){if(typeof e==`object`)for(var n in e){var r=e[n];this.setUniform(n,r)}else this.setUniform(e,t)},get:function(e){var t=this.uniforms[e];if(t)return t.value},attachShader:function(e,t){var n=this.uniforms;this.uniforms=e.createUniforms(),this.shader=e;var r=this.uniforms;this._enabledUniforms=Object.keys(r),this._enabledUniforms.sort(),this._textureUniforms=this._enabledUniforms.filter(function(e){var t=this.uniforms[e].type;return t===`t`||t===`tv`},this);var i=this.vertexDefines,a=this.fragmentDefines;if(this.vertexDefines=Fr.clone(e.vertexDefines),this.fragmentDefines=Fr.clone(e.fragmentDefines),t){for(var o in n)r[o]&&(r[o].value=n[o].value);Fr.defaults(this.vertexDefines,i),Fr.defaults(this.fragmentDefines,a)}var s={};for(var c in e.textures)s[c]={shaderType:e.textures[c].shaderType,type:e.textures[c].type,enabled:t&&this._textureStatus[c]?this._textureStatus[c].enabled:!1};this._textureStatus=s,this._programKey=``},clone:function(){var e=new this.constructor({name:this.name,shader:this.shader});for(var t in this.uniforms)e.uniforms[t].value=this.uniforms[t].value;return e.depthTest=this.depthTest,e.depthMask=this.depthMask,e.transparent=this.transparent,e.blend=this.blend,e.vertexDefines=Fr.clone(this.vertexDefines),e.fragmentDefines=Fr.clone(this.fragmentDefines),e.enableTexture(this.getEnabledTextures()),e.precision=this.precision,e},define:function(e,t,n){var r=this.vertexDefines,i=this.fragmentDefines;e!==`vertex`&&e!==`fragment`&&e!==`both`&&arguments.length<3&&(n=t,t=e,e=`both`),n??=null,(e===`vertex`||e===`both`)&&r[t]!==n&&(r[t]=n,this._programKey=``),(e===`fragment`||e===`both`)&&i[t]!==n&&(i[t]=n,e!==`both`&&(this._programKey=``))},undefine:function(e,t){e!==`vertex`&&e!==`fragment`&&e!==`both`&&arguments.length<2&&(t=e,e=`both`),(e===`vertex`||e===`both`)&&this.isDefined(`vertex`,t)&&(delete this.vertexDefines[t],this._programKey=``),(e===`fragment`||e===`both`)&&this.isDefined(`fragment`,t)&&(delete this.fragmentDefines[t],e!==`both`&&(this._programKey=``))},isDefined:function(e,t){switch(e){case`vertex`:return this.vertexDefines[t]!==void 0;case`fragment`:return this.fragmentDefines[t]!==void 0}},getDefine:function(e,t){switch(e){case`vertex`:return this.vertexDefines[t];case`fragment`:return this.fragmentDefines[t]}},enableTexture:function(e){if(Array.isArray(e)){for(var t=0;t<e.length;t++)this.enableTexture(e[t]);return}var n=this._textureStatus[e];n&&(n.enabled||(n.enabled=!0,this._programKey=``))},enableTexturesAll:function(){var e=this._textureStatus;for(var t in e)e[t].enabled=!0;this._programKey=``},disableTexture:function(e){if(Array.isArray(e)){for(var t=0;t<e.length;t++)this.disableTexture(e[t]);return}var n=this._textureStatus[e];n&&n.enabled&&(n.enabled=!1,this._programKey=``)},disableTexturesAll:function(){var e=this._textureStatus;for(var t in e)e[t].enabled=!1;this._programKey=``},isTextureEnabled:function(e){var t=this._textureStatus;return!!t[e]&&t[e].enabled},getEnabledTextures:function(){var e=[],t=this._textureStatus;for(var n in t)t[n].enabled&&e.push(n);return e},dirtyDefines:function(){this._programKey=``},getProgramKey:function(){return this._programKey||=Ai(this.vertexDefines,this.fragmentDefines,this.getEnabledTextures()),this._programKey}}),W={};W.create=function(){var e=new Lr(2);return e[0]=0,e[1]=0,e},W.clone=function(e){var t=new Lr(2);return t[0]=e[0],t[1]=e[1],t},W.fromValues=function(e,t){var n=new Lr(2);return n[0]=e,n[1]=t,n},W.copy=function(e,t){return e[0]=t[0],e[1]=t[1],e},W.set=function(e,t,n){return e[0]=t,e[1]=n,e},W.add=function(e,t,n){return e[0]=t[0]+n[0],e[1]=t[1]+n[1],e},W.subtract=function(e,t,n){return e[0]=t[0]-n[0],e[1]=t[1]-n[1],e},W.sub=W.subtract,W.multiply=function(e,t,n){return e[0]=t[0]*n[0],e[1]=t[1]*n[1],e},W.mul=W.multiply,W.divide=function(e,t,n){return e[0]=t[0]/n[0],e[1]=t[1]/n[1],e},W.div=W.divide,W.min=function(e,t,n){return e[0]=Math.min(t[0],n[0]),e[1]=Math.min(t[1],n[1]),e},W.max=function(e,t,n){return e[0]=Math.max(t[0],n[0]),e[1]=Math.max(t[1],n[1]),e},W.scale=function(e,t,n){return e[0]=t[0]*n,e[1]=t[1]*n,e},W.scaleAndAdd=function(e,t,n,r){return e[0]=t[0]+n[0]*r,e[1]=t[1]+n[1]*r,e},W.distance=function(e,t){var n=t[0]-e[0],r=t[1]-e[1];return Math.sqrt(n*n+r*r)},W.dist=W.distance,W.squaredDistance=function(e,t){var n=t[0]-e[0],r=t[1]-e[1];return n*n+r*r},W.sqrDist=W.squaredDistance,W.length=function(e){var t=e[0],n=e[1];return Math.sqrt(t*t+n*n)},W.len=W.length,W.squaredLength=function(e){var t=e[0],n=e[1];return t*t+n*n},W.sqrLen=W.squaredLength,W.negate=function(e,t){return e[0]=-t[0],e[1]=-t[1],e},W.inverse=function(e,t){return e[0]=1/t[0],e[1]=1/t[1],e},W.normalize=function(e,t){var n=t[0],r=t[1],i=n*n+r*r;return i>0&&(i=1/Math.sqrt(i),e[0]=t[0]*i,e[1]=t[1]*i),e},W.dot=function(e,t){return e[0]*t[0]+e[1]*t[1]},W.cross=function(e,t,n){var r=t[0]*n[1]-t[1]*n[0];return e[0]=e[1]=0,e[2]=r,e},W.lerp=function(e,t,n,r){var i=t[0],a=t[1];return e[0]=i+r*(n[0]-i),e[1]=a+r*(n[1]-a),e},W.random=function(e,t){t||=1;var n=GLMAT_RANDOM()*2*Math.PI;return e[0]=Math.cos(n)*t,e[1]=Math.sin(n)*t,e},W.transformMat2=function(e,t,n){var r=t[0],i=t[1];return e[0]=n[0]*r+n[2]*i,e[1]=n[1]*r+n[3]*i,e},W.transformMat2d=function(e,t,n){var r=t[0],i=t[1];return e[0]=n[0]*r+n[2]*i+n[4],e[1]=n[1]*r+n[3]*i+n[5],e},W.transformMat3=function(e,t,n){var r=t[0],i=t[1];return e[0]=n[0]*r+n[3]*i+n[6],e[1]=n[1]*r+n[4]*i+n[7],e},W.transformMat4=function(e,t,n){var r=t[0],i=t[1];return e[0]=n[0]*r+n[4]*i+n[12],e[1]=n[1]*r+n[5]*i+n[13],e},W.forEach=(function(){var e=W.create();return function(t,n,r,i,a,o){var s,c;for(n||=2,r||=0,c=i?Math.min(i*n+r,t.length):t.length,s=r;s<c;s+=n)e[0]=t[s],e[1]=t[s+1],a(e,e,o),t[s]=e[0],t[s+1]=e[1];return t}})();var G=function(e,t){e||=0,t||=0,this.array=W.fromValues(e,t),this._dirty=!0};if(G.prototype={constructor:G,add:function(e){return W.add(this.array,this.array,e.array),this._dirty=!0,this},set:function(e,t){return this.array[0]=e,this.array[1]=t,this._dirty=!0,this},setArray:function(e){return this.array[0]=e[0],this.array[1]=e[1],this._dirty=!0,this},clone:function(){return new G(this.x,this.y)},copy:function(e){return W.copy(this.array,e.array),this._dirty=!0,this},cross:function(e,t){return W.cross(e.array,this.array,t.array),e._dirty=!0,this},dist:function(e){return W.dist(this.array,e.array)},distance:function(e){return W.distance(this.array,e.array)},div:function(e){return W.div(this.array,this.array,e.array),this._dirty=!0,this},divide:function(e){return W.divide(this.array,this.array,e.array),this._dirty=!0,this},dot:function(e){return W.dot(this.array,e.array)},len:function(){return W.len(this.array)},length:function(){return W.length(this.array)},lerp:function(e,t,n){return W.lerp(this.array,e.array,t.array,n),this._dirty=!0,this},min:function(e){return W.min(this.array,this.array,e.array),this._dirty=!0,this},max:function(e){return W.max(this.array,this.array,e.array),this._dirty=!0,this},mul:function(e){return W.mul(this.array,this.array,e.array),this._dirty=!0,this},multiply:function(e){return W.multiply(this.array,this.array,e.array),this._dirty=!0,this},negate:function(){return W.negate(this.array,this.array),this._dirty=!0,this},normalize:function(){return W.normalize(this.array,this.array),this._dirty=!0,this},random:function(e){return W.random(this.array,e),this._dirty=!0,this},scale:function(e){return W.scale(this.array,this.array,e),this._dirty=!0,this},scaleAndAdd:function(e,t){return W.scaleAndAdd(this.array,this.array,e.array,t),this._dirty=!0,this},sqrDist:function(e){return W.sqrDist(this.array,e.array)},squaredDistance:function(e){return W.squaredDistance(this.array,e.array)},sqrLen:function(){return W.sqrLen(this.array)},squaredLength:function(){return W.squaredLength(this.array)},sub:function(e){return W.sub(this.array,this.array,e.array),this._dirty=!0,this},subtract:function(e){return W.subtract(this.array,this.array,e.array),this._dirty=!0,this},transformMat2:function(e){return W.transformMat2(this.array,this.array,e.array),this._dirty=!0,this},transformMat2d:function(e){return W.transformMat2d(this.array,this.array,e.array),this._dirty=!0,this},transformMat3:function(e){return W.transformMat3(this.array,this.array,e.array),this._dirty=!0,this},transformMat4:function(e){return W.transformMat4(this.array,this.array,e.array),this._dirty=!0,this},toString:function(){return`[`+Array.prototype.join.call(this.array,`,`)+`]`},toArray:function(){return Array.prototype.slice.call(this.array)}},Object.defineProperty){var Mi=G.prototype;Object.defineProperty(Mi,"x",{get:function(){return this.array[0]},set:function(e){this.array[0]=e,this._dirty=!0}}),Object.defineProperty(Mi,"y",{get:function(){return this.array[1]},set:function(e){this.array[1]=e,this._dirty=!0}})}G.add=function(e,t,n){return W.add(e.array,t.array,n.array),e._dirty=!0,e},G.set=function(e,t,n){return W.set(e.array,t,n),e._dirty=!0,e},G.copy=function(e,t){return W.copy(e.array,t.array),e._dirty=!0,e},G.cross=function(e,t,n){return W.cross(e.array,t.array,n.array),e._dirty=!0,e},G.dist=function(e,t){return W.distance(e.array,t.array)},G.distance=G.dist,G.div=function(e,t,n){return W.divide(e.array,t.array,n.array),e._dirty=!0,e},G.divide=G.div,G.dot=function(e,t){return W.dot(e.array,t.array)},G.len=function(e){return W.length(e.array)},G.lerp=function(e,t,n,r){return W.lerp(e.array,t.array,n.array,r),e._dirty=!0,e},G.min=function(e,t,n){return W.min(e.array,t.array,n.array),e._dirty=!0,e},G.max=function(e,t,n){return W.max(e.array,t.array,n.array),e._dirty=!0,e},G.mul=function(e,t,n){return W.multiply(e.array,t.array,n.array),e._dirty=!0,e},G.multiply=G.mul,G.negate=function(e,t){return W.negate(e.array,t.array),e._dirty=!0,e},G.normalize=function(e,t){return W.normalize(e.array,t.array),e._dirty=!0,e},G.random=function(e,t){return W.random(e.array,t),e._dirty=!0,e},G.scale=function(e,t,n){return W.scale(e.array,t.array,n),e._dirty=!0,e},G.scaleAndAdd=function(e,t,n,r){return W.scaleAndAdd(e.array,t.array,n.array,r),e._dirty=!0,e},G.sqrDist=function(e,t){return W.sqrDist(e.array,t.array)},G.squaredDistance=G.sqrDist,G.sqrLen=function(e){return W.sqrLen(e.array)},G.squaredLength=G.sqrLen,G.sub=function(e,t,n){return W.subtract(e.array,t.array,n.array),e._dirty=!0,e},G.subtract=G.sub,G.transformMat2=function(e,t,n){return W.transformMat2(e.array,t.array,n.array),e._dirty=!0,e},G.transformMat2d=function(e,t,n){return W.transformMat2d(e.array,t.array,n.array),e._dirty=!0,e},G.transformMat3=function(e,t,n){return W.transformMat3(e.array,t.array,n.array),e._dirty=!0,e},G.transformMat4=function(e,t,n){return W.transformMat4(e.array,t.array,n.array),e._dirty=!0,e};var Ni=1,Pi=2,Fi=3,Ii={};function Li(e){for(var t=e.split(`
`),n=0,r=t.length;n<r;n++)t[n]=n+1+`: `+t[n];return t.join(`
`)}function Ri(e,t,n){if(!e.getShaderParameter(t,e.COMPILE_STATUS))return[e.getShaderInfoLog(t),Li(n)].join(`
`)}var zi=new U.Float32Array(16),Bi=Ir.extend({uniformSemantics:{},attributes:{}},function(){this._locations={},this._textureSlot=0,this._program=null},{bind:function(e){this._textureSlot=0,e.gl.useProgram(this._program)},hasUniform:function(e){return this._locations[e]!=null},useTextureSlot:function(e,t,n){t&&(e.gl.activeTexture(e.gl.TEXTURE0+n),t.isRenderable()?t.bind(e):t.unbind(e))},currentTextureSlot:function(){return this._textureSlot},resetTextureSlot:function(e){this._textureSlot=e||0},takeCurrentTextureSlot:function(e,t){var n=this._textureSlot;return this.useTextureSlot(e,t,n),this._textureSlot++,n},setUniform:function(e,t,n,r){var i=this._locations[n];if(i==null)return!1;switch(t){case`m4`:if(!(r instanceof Float32Array)){for(var a=0;a<r.length;a++)zi[a]=r[a];r=zi}e.uniformMatrix4fv(i,!1,r);break;case`2i`:e.uniform2i(i,r[0],r[1]);break;case`2f`:e.uniform2f(i,r[0],r[1]);break;case`3i`:e.uniform3i(i,r[0],r[1],r[2]);break;case`3f`:e.uniform3f(i,r[0],r[1],r[2]);break;case`4i`:e.uniform4i(i,r[0],r[1],r[2],r[3]);break;case`4f`:e.uniform4f(i,r[0],r[1],r[2],r[3]);break;case`1i`:e.uniform1i(i,r);break;case`1f`:e.uniform1f(i,r);break;case`1fv`:e.uniform1fv(i,r);break;case`1iv`:e.uniform1iv(i,r);break;case`2iv`:e.uniform2iv(i,r);break;case`2fv`:e.uniform2fv(i,r);break;case`3iv`:e.uniform3iv(i,r);break;case`3fv`:e.uniform3fv(i,r);break;case`4iv`:e.uniform4iv(i,r);break;case`4fv`:e.uniform4fv(i,r);break;case`m2`:case`m2v`:e.uniformMatrix2fv(i,!1,r);break;case`m3`:case`m3v`:e.uniformMatrix3fv(i,!1,r);break;case`m4v`:if(Array.isArray(r)&&Array.isArray(r[0])){for(var o=new U.Float32Array(r.length*16),s=0,a=0;a<r.length;a++)for(var c=r[a],l=0;l<16;l++)o[s++]=c[l];e.uniformMatrix4fv(i,!1,o)}else e.uniformMatrix4fv(i,!1,r);break}return!0},setUniformOfSemantic:function(e,t,n){var r=this.uniformSemantics[t];return r?this.setUniform(e,r.type,r.symbol,n):!1},enableAttributes:function(e,t,n){var r=e.gl,i=this._program,a=this._locations,o=n?n.__enabledAttributeList:Ii[e.__uid__];o||=n?n.__enabledAttributeList=[]:Ii[e.__uid__]=[];for(var s=[],c=0;c<t.length;c++){var l=t[c];if(!this.attributes[l]){s[c]=-1;continue}var u=a[l];if(u==null){if(u=r.getAttribLocation(i,l),u===-1){s[c]=-1;continue}a[l]=u}s[c]=u,o[u]?o[u]=Pi:o[u]=Ni}for(var c=0;c<o.length;c++)switch(o[c]){case Ni:r.enableVertexAttribArray(c),o[c]=Fi;break;case Pi:o[c]=Fi;break;case Fi:r.disableVertexAttribArray(c),o[c]=0;break}return s},getAttribLocation:function(e,t){var n=this._locations,r=n[t];return r??(r=e.getAttribLocation(this._program,t),n[t]=r),r},buildProgram:function(e,t,n,r){var i=e.createShader(e.VERTEX_SHADER),a=e.createProgram();e.shaderSource(i,n),e.compileShader(i);var o=e.createShader(e.FRAGMENT_SHADER);e.shaderSource(o,r),e.compileShader(o);var s=Ri(e,i,n);if(s||(s=Ri(e,o,r),s))return s;if(e.attachShader(a,i),e.attachShader(a,o),t.attributeSemantics.POSITION)e.bindAttribLocation(a,0,t.attributeSemantics.POSITION.symbol);else{var c=Object.keys(this.attributes);e.bindAttribLocation(a,0,c[0])}if(e.linkProgram(a),e.deleteShader(i),e.deleteShader(o),this._program=a,this.vertexCode=n,this.fragmentCode=r,!e.getProgramParameter(a,e.LINK_STATUS))return`Could not link program
`+e.getProgramInfoLog(a);for(var l=0;l<t.uniforms.length;l++){var u=t.uniforms[l];this._locations[u]=e.getUniformLocation(a,u)}}}),Vi=/for\s*?\(int\s*?_idx_\s*\=\s*([\w-]+)\;\s*_idx_\s*<\s*([\w-]+);\s*_idx_\s*\+\+\s*\)\s*\{\{([\s\S]+?)(?=\}\})\}\}/g;function Hi(e,t,n){function r(e,n,r,a){var o=``;isNaN(n)&&(n=n in t?t[n]:i[n]),isNaN(r)&&(r=r in t?t[r]:i[r]);for(var s=parseInt(n);s<parseInt(r);s++)o+=`{`+a.replace(/float\s*\(\s*_idx_\s*\)/g,s.toFixed(1)).replace(/_idx_/g,s)+`}`;return o}var i={};for(var a in n)i[a+`_COUNT`]=n[a];return e.replace(Vi,r)}function Ui(e,t,n){var r=[];if(t)for(var i in t){var a=t[i];a>0&&r.push(`#define `+i.toUpperCase()+`_COUNT `+a)}if(n)for(var o=0;o<n.length;o++){var s=n[o];r.push(`#define `+s.toUpperCase()+`_ENABLED`)}for(var s in e){var c=e[s];c===null?r.push(`#define `+s):r.push(`#define `+s+` `+c.toString())}return r.join(`
`)}function Wi(e){for(var t=[],n=0;n<e.length;n++)t.push(`#extension GL_`+e[n]+` : enable`);return t.join(`
`)}function Gi(e){return[`precision`,e,`float`].join(` `)+`;
`+[`precision`,e,`int`].join(` `)+`;
`+[`precision`,e,`sampler2D`].join(` `)+`;
`}function Ki(e){this._renderer=e,this._cache={}}Ki.prototype.getProgram=function(e,t,n){var r=this._cache,i=e.isSkinnedMesh&&e.isSkinnedMesh(),a=e.isInstancedMesh&&e.isInstancedMesh(),o=`s`+t.shader.shaderID+`m`+t.getProgramKey();n&&(o+=`se`+n.getProgramKey(e.lightGroup)),i&&(o+=`,sk`+e.joints.length),a&&(o+=`,is`);var s=r[o];if(s)return s;var c=n?n.getLightsNumbers(e.lightGroup):{},l=this._renderer,u=l.gl,d=t.getEnabledTextures(),f=``;if(i){var p={SKINNING:null,JOINT_COUNT:e.joints.length};e.joints.length>l.getMaxJointNumber()&&(p.USE_SKIN_MATRICES_TEXTURE=null),f+=`
`+Ui(p)+`
`}a&&(f+=`
#define INSTANCING
`);var m=f+Ui(t.vertexDefines,c,d),h=f+Ui(t.fragmentDefines,c,d),g=m+`
`+t.shader.vertex,_=[`OES_standard_derivatives`,`EXT_shader_texture_lod`].filter(function(e){return l.getGLExtension(e)!=null});_.indexOf(`EXT_shader_texture_lod`)>=0&&(h+=`
#define SUPPORT_TEXTURE_LOD`),_.indexOf(`OES_standard_derivatives`)>=0&&(h+=`
#define SUPPORT_STANDARD_DERIVATIVES`);var v=Wi(_)+`
`+Gi(t.precision)+`
`+h+`
`+t.shader.fragment,y=Hi(g,t.vertexDefines,c),b=Hi(v,t.fragmentDefines,c),s=new Bi;return s.uniformSemantics=t.shader.uniformSemantics,s.attributes=t.shader.attributes,s.__error=s.buildProgram(u,t.shader,y,b),r[o]=s,s};var qi=/uniform\s+(bool|float|int|vec2|vec3|vec4|ivec2|ivec3|ivec4|mat2|mat3|mat4|sampler2D|samplerCube)\s+([\s\S]*?);/g,Ji=/attribute\s+(float|int|vec2|vec3|vec4)\s+([\s\S]*?);/g,Yi=/#define\s+(\w+)?(\s+[\d-.]+)?\s*;?\s*\n/g,Xi={bool:`1i`,int:`1i`,sampler2D:`t`,samplerCube:`t`,float:`1f`,vec2:`2f`,vec3:`3f`,vec4:`4f`,ivec2:`2i`,ivec3:`3i`,ivec4:`4i`,mat2:`m2`,mat3:`m3`,mat4:`m4`};function Zi(e){for(var t=[],n=0;n<e;n++)t[n]=0;return t}var Qi={bool:function(){return!0},int:function(){return 0},float:function(){return 0},sampler2D:function(){return null},samplerCube:function(){return null},vec2:function(){return Zi(2)},vec3:function(){return Zi(3)},vec4:function(){return Zi(4)},ivec2:function(){return Zi(2)},ivec3:function(){return Zi(3)},ivec4:function(){return Zi(4)},mat2:function(){return Zi(4)},mat3:function(){return Zi(9)},mat4:function(){return Zi(16)},array:function(){return[]}},$i=[`POSITION`,`NORMAL`,`BINORMAL`,`TANGENT`,`TEXCOORD`,`TEXCOORD_0`,`TEXCOORD_1`,`COLOR`,`JOINT`,`WEIGHT`],ea=[`SKIN_MATRIX`,`VIEWPORT_SIZE`,`VIEWPORT`,`DEVICEPIXELRATIO`,`WINDOW_SIZE`,`NEAR`,`FAR`,`TIME`],ta=[`WORLD`,`VIEW`,`PROJECTION`,`WORLDVIEW`,`VIEWPROJECTION`,`WORLDVIEWPROJECTION`,`WORLDINVERSE`,`VIEWINVERSE`,`PROJECTIONINVERSE`,`WORLDVIEWINVERSE`,`VIEWPROJECTIONINVERSE`,`WORLDVIEWPROJECTIONINVERSE`,`WORLDTRANSPOSE`,`VIEWTRANSPOSE`,`PROJECTIONTRANSPOSE`,`WORLDVIEWTRANSPOSE`,`VIEWPROJECTIONTRANSPOSE`,`WORLDVIEWPROJECTIONTRANSPOSE`,`WORLDINVERSETRANSPOSE`,`VIEWINVERSETRANSPOSE`,`PROJECTIONINVERSETRANSPOSE`,`WORLDVIEWINVERSETRANSPOSE`,`VIEWPROJECTIONINVERSETRANSPOSE`,`WORLDVIEWPROJECTIONINVERSETRANSPOSE`],na={vec4:4,vec3:3,vec2:2,float:1},ra={},ia={};function aa(e,t){var n=`vertex:`+e+`fragment:`+t;if(ra[n])return ra[n];var r=Fr.genGUID();return ra[n]=r,ia[r]={vertex:e,fragment:t},r}function oa(e){return e.replace(/[ \t]*\/\/.*\n/g,``).replace(/[ \t]*\/\*[\s\S]*?\*\//g,``)}function sa(){console.error(`Wrong uniform/attributes syntax`)}function ca(e,t){for(var n=/[,=\(\):]/,r=t.replace(/:\s*\[\s*(.*)\s*\]/g,`=`+e+`($1)`).replace(/\s+/g,``).split(/(?=[,=\(\):])/g),i=[],a=0;a<r.length;a++)r[a].match(n)?i.push(r[a].charAt(0),r[a].slice(1)):i.push(r[a]);r=i;var o=0,s=1,c=2,l=3,u=4,d=5,f=o,p={},m=null,h;g(r[0]);function g(e){e||sa();var t=e.match(/\[(.*?)\]/);h=e.replace(/\[(.*?)\]/,``),p[h]={},t&&(p[h].isArray=!0,p[h].arraySize=t[1])}for(var a=1;a<r.length;a++){var _=r[a];if(_){if(_===`=`){if(f!==o&&f!==l){sa();break}f=s;continue}else if(_===`:`){f=u;continue}else if(_===`,`){if(f===c){if(!(m instanceof Array)){sa();break}m.push(+r[++a])}else f=d;continue}else if(_===`)`){p[h].value=new U.Float32Array(m),m=null,f=d;continue}else if(_===`(`){if(f!==c){sa();break}if(!(m instanceof Array)){sa();break}m.push(+r[++a]);continue}else if(_.indexOf(`vec`)>=0){if(f!==s&&f!==u){sa();break}f=c,m=[];continue}else if(f===s){e===`bool`?p[h].value=_===`true`:p[h].value=parseFloat(_),m=null;continue}else if(f===u){var v=_;$i.indexOf(v)>=0||ea.indexOf(v)>=0||ta.indexOf(v)>=0?p[h].semantic=v:v===`ignore`||v===`unconfigurable`?p[h].ignore=!0:e===`bool`?p[h].value=v===`true`:p[h].value=parseFloat(v);continue}g(_),f=o}}return p}function K(e,t){typeof e==`object`&&(t=e.fragment,e=e.vertex),e=oa(e),t=oa(t),this._shaderID=aa(e,t),this._vertexCode=K.parseImport(e),this._fragmentCode=K.parseImport(t),this.attributeSemantics={},this.matrixSemantics={},this.uniformSemantics={},this.matrixSemanticKeys=[],this.uniformTemplates={},this.attributes={},this.textures={},this.vertexDefines={},this.fragmentDefines={},this._parseAttributes(),this._parseUniforms(),this._parseDefines()}K.prototype={constructor:K,createUniforms:function(){var e={};for(var t in this.uniformTemplates){var n=this.uniformTemplates[t];e[t]={type:n.type,value:n.value()}}return e},_parseImport:function(){this._vertexCode=K.parseImport(this.vertex),this._fragmentCode=K.parseImport(this.fragment)},_addSemanticUniform:function(e,t,n){if($i.indexOf(n)>=0)this.attributeSemantics[n]={symbol:e,type:t};else if(ta.indexOf(n)>=0){var r=!1,i=n;n.match(/TRANSPOSE$/)&&(r=!0,i=n.slice(0,-9)),this.matrixSemantics[n]={symbol:e,type:t,isTranspose:r,semanticNoTranspose:i}}else ea.indexOf(n)>=0&&(this.uniformSemantics[n]={symbol:e,type:t})},_addMaterialUniform:function(e,t,n,r,i,a){a[e]={type:n,value:i?Qi.array:r||Qi[t],semantic:null}},_parseUniforms:function(){var e={},t=this,n=`vertex`;this._uniformList=[],this._vertexCode=this._vertexCode.replace(qi,i),n=`fragment`,this._fragmentCode=this._fragmentCode.replace(qi,i),t.matrixSemanticKeys=Object.keys(this.matrixSemantics);function r(e){return e==null?null:function(){return e}}function i(i,a,o){var s=ca(a,o),c=[];for(var l in s){var u=s[l],d=u.semantic,f=l,p=Xi[a],m=r(s[l].value);s[l].isArray&&(f+=`[`+s[l].arraySize+`]`,p+=`v`),c.push(f),t._uniformList.push(l),u.ignore||((a===`sampler2D`||a===`samplerCube`)&&(t.textures[l]={shaderType:n,type:a}),d?t._addSemanticUniform(l,p,d):t._addMaterialUniform(l,a,p,m,s[l].isArray,e))}return c.length>0?`uniform `+a+` `+c.join(`,`)+`;
`:``}this.uniformTemplates=e},_parseAttributes:function(){var e={},t=this;this._vertexCode=this._vertexCode.replace(Ji,n);function n(n,r,i){var a=ca(r,i),o=na[r]||1,s=[];for(var c in a){var l=a[c].semantic;if(e[c]={type:`float`,size:o,semantic:l||null},l){if($i.indexOf(l)<0)throw Error(`Unkown semantic "`+l+`"`);t.attributeSemantics[l]={symbol:c,type:r}}s.push(c)}return`attribute `+r+` `+s.join(`,`)+`;
`}this.attributes=e},_parseDefines:function(){var e=this,t=`vertex`;this._vertexCode=this._vertexCode.replace(Yi,n),t=`fragment`,this._fragmentCode=this._fragmentCode.replace(Yi,n);function n(n,r,i){var a=t===`vertex`?e.vertexDefines:e.fragmentDefines;return a[r]||(i===`false`?a[r]=!1:i===`true`?a[r]=!0:a[r]=i?isNaN(parseFloat(i))?i.trim():parseFloat(i):null),``}},clone:function(){var e=ia[this._shaderID];return new K(e.vertex,e.fragment)}},Object.defineProperty&&(Object.defineProperty(K.prototype,"shaderID",{get:function(){return this._shaderID}}),Object.defineProperty(K.prototype,"vertex",{get:function(){return this._vertexCode}}),Object.defineProperty(K.prototype,"fragment",{get:function(){return this._fragmentCode}}),Object.defineProperty(K.prototype,"uniforms",{get:function(){return this._uniformList}}));var la=/(@import)\s*([0-9a-zA-Z_\-\.]*)/g;K.parseImport=function(e){return e=e.replace(la,function(e,t,n){var e=K.source(n);return e?K.parseImport(e):(console.error(`Shader chunk "`+n+`" not existed in library`),``)}),e};var ua=/(@export)\s*([0-9a-zA-Z_\-\.]*)\s*\n([\s\S]*?)@end/g;K.import=function(e){e.replace(ua,function(e,t,n,r){var r=r.replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+\x24)/g,``);if(r){for(var i=n.split(`.`),a=K.codes,o=0,s;o<i.length-1;)s=i[o++],a[s]||(a[s]={}),a=a[s];s=i[o],a[s]=r}return r})},K.codes={},K.source=function(e){for(var t=e.split(`.`),n=K.codes,r=0;n&&r<t.length;){var i=t[r++];n=n[i]}return typeof n==`string`?n:(console.error(`Shader "`+e+`" not existed in library`),``)};var da=`@export clay.prez.vertex
uniform mat4 WVP : WORLDVIEWPROJECTION;
attribute vec3 pos : POSITION;
attribute vec2 uv : TEXCOORD_0;
uniform vec2 uvRepeat : [1.0, 1.0];
uniform vec2 uvOffset : [0.0, 0.0];
@import clay.chunk.skinning_header
@import clay.chunk.instancing_header
varying vec2 v_Texcoord;
void main()
{
 vec4 P = vec4(pos, 1.0);
#ifdef SKINNING
 @import clay.chunk.skin_matrix
 P = skinMatrixWS * P;
#endif
#ifdef INSTANCING
 @import clay.chunk.instancing_matrix
 P = instanceMat * P;
#endif
 gl_Position = WVP * P;
 v_Texcoord = uv * uvRepeat + uvOffset;
}
@end
@export clay.prez.fragment
uniform sampler2D alphaMap;
uniform float alphaCutoff: 0.0;
varying vec2 v_Texcoord;
void main()
{
 if (alphaCutoff > 0.0) {
 if (texture2D(alphaMap, v_Texcoord).a <= alphaCutoff) {
 discard;
 }
 }
 gl_FragColor = vec4(0.0,0.0,0.0,1.0);
}
@end`;K.import(da);var fa=B.create,pa={};function ma(e){return e.material}function ha(e,t,n){return t.uniforms[n].value}function ga(e,t,n,r){return n!==r}function _a(e){return!0}function va(){}var ya={float:H.FLOAT,byte:H.BYTE,ubyte:H.UNSIGNED_BYTE,short:H.SHORT,ushort:H.UNSIGNED_SHORT};function ba(e,t,n){this.availableAttributes=e,this.availableAttributeSymbols=t,this.indicesBuffer=n,this.vao=null}function xa(e){var t,n;this.bind=function(e){t||(t=U.createCanvas(),t.width=t.height=1,t.getContext(`2d`));var r=e.gl,i=!n;i&&(n=r.createTexture()),r.bindTexture(r.TEXTURE_2D,n),i&&r.texImage2D(r.TEXTURE_2D,0,r.RGBA,r.RGBA,r.UNSIGNED_BYTE,t)},this.unbind=function(e){e.gl.bindTexture(e.gl.TEXTURE_2D,null)},this.isRenderable=function(){return!0}}var Sa=Ir.extend(function(){return{canvas:null,_width:100,_height:100,devicePixelRatio:typeof window<`u`&&window.devicePixelRatio||1,clearColor:[0,0,0,0],clearBit:17664,alpha:!0,depth:!0,stencil:!1,antialias:!0,premultipliedAlpha:!0,preserveDrawingBuffer:!1,throwError:!0,gl:null,viewport:{},maxJointNumber:20,__currentFrameBuffer:null,_viewportStack:[],_clearStack:[],_sceneRendering:null}},function(){this.canvas||=U.createCanvas();var e=this.canvas;try{var t={alpha:this.alpha,depth:this.depth,stencil:this.stencil,antialias:this.antialias,premultipliedAlpha:this.premultipliedAlpha,preserveDrawingBuffer:this.preserveDrawingBuffer};if(this.gl=e.getContext(`webgl`,t)||e.getContext(`experimental-webgl`,t),!this.gl)throw Error();this._glinfo=new ii(this.gl),this.gl.targetRenderer&&console.error(`Already created a renderer`),this.gl.targetRenderer=this,this.resize()}catch(e){throw`Error creating WebGL Context `+e}this._programMgr=new Ki(this),this._placeholderTexture=new xa(this)},{resize:function(e,t){var n=this.canvas,r=this.devicePixelRatio;e==null?(this._width=n.width/r,this._height=n.height/r):(n.style&&(n.style.width=e+`px`,n.style.height=t+`px`),n.width=e*r,n.height=t*r,this._width=e,this._height=t),this.setViewport(0,0,this._width,this._height)},getWidth:function(){return this._width},getHeight:function(){return this._height},getViewportAspect:function(){var e=this.viewport;return e.width/e.height},setDevicePixelRatio:function(e){this.devicePixelRatio=e,this.resize(this._width,this._height)},getDevicePixelRatio:function(){return this.devicePixelRatio},getGLExtension:function(e){return this._glinfo.getExtension(e)},getGLParameter:function(e){return this._glinfo.getParameter(e)},setViewport:function(e,t,n,r,i){if(typeof e==`object`){var a=e;e=a.x,t=a.y,n=a.width,r=a.height,i=a.devicePixelRatio}i||=this.devicePixelRatio,this.gl.viewport(e*i,t*i,n*i,r*i),this.viewport={x:e,y:t,width:n,height:r,devicePixelRatio:i}},saveViewport:function(){this._viewportStack.push(this.viewport)},restoreViewport:function(){this._viewportStack.length>0&&this.setViewport(this._viewportStack.pop())},saveClear:function(){this._clearStack.push({clearBit:this.clearBit,clearColor:this.clearColor})},restoreClear:function(){if(this._clearStack.length>0){var e=this._clearStack.pop();this.clearColor=e.clearColor,this.clearBit=e.clearBit}},bindSceneRendering:function(e){this._sceneRendering=e},render:function(e,t,n,r){var i=this.gl,a=this.clearColor;if(this.clearBit){i.colorMask(!0,!0,!0,!0),i.depthMask(!0);var o=this.viewport,s=!1,c=o.devicePixelRatio;(o.width!==this._width||o.height!==this._height||c&&c!==this.devicePixelRatio||o.x||o.y)&&(s=!0,i.enable(i.SCISSOR_TEST),i.scissor(o.x*c,o.y*c,o.width*c,o.height*c)),i.clearColor(a[0],a[1],a[2],a[3]),i.clear(this.clearBit),s&&i.disable(i.SCISSOR_TEST)}if(n||e.update(!1),e.updateLights(),t||=e.getMainCamera(),!t){console.error(`Can't find camera in the scene.`);return}t.update();var l=e.updateRenderList(t,!0);this._sceneRendering=e;var u=l.opaque,d=l.transparent,f=e.material;e.trigger(`beforerender`,this,e,t,l),r?(this.renderPreZ(u,e,t),i.depthFunc(i.LEQUAL)):i.depthFunc(i.LESS);for(var p=fa(),m=P.create(),h=0;h<d.length;h++){var g=d[h];B.multiplyAffine(p,t.viewMatrix.array,g.worldTransform.array),P.transformMat4(m,g.position.array,p),g.__depth=m[2]}this.renderPass(u,t,{getMaterial:function(e){return f||e.material},sortCompare:this.opaqueSortCompare}),this.renderPass(d,t,{getMaterial:function(e){return f||e.material},sortCompare:this.transparentSortCompare}),e.trigger(`afterrender`,this,e,t,l),this._sceneRendering=null},getProgram:function(e,t,n){return t||=e.material,this._programMgr.getProgram(e,t,n)},validateProgram:function(e){if(e.__error){var t=e.__error;if(pa[e.__uid__])return;if(pa[e.__uid__]=!0,this.throwError)throw Error(t);this.trigger(`error`,t)}},updatePrograms:function(e,t,n){var r=n&&n.getMaterial||ma;t||=null;for(var i=0;i<e.length;i++){var a=e[i],o=r.call(this,a);if(i>0){var s=e[i-1],c=s.joints?s.joints.length:0;if((a.joints?a.joints.length:0)===c&&a.material===s.material&&a.lightGroup===s.lightGroup){a.__program=s.__program;continue}}var l=this._programMgr.getProgram(a,o,t);this.validateProgram(l),a.__program=l}},renderPass:function(e,t,n){this.trigger(`beforerenderpass`,this,e,t,n),n||={},n.getMaterial=n.getMaterial||ma,n.getUniform=n.getUniform||ha,n.isMaterialChanged=n.isMaterialChanged||ga,n.beforeRender=n.beforeRender||va,n.afterRender=n.afterRender||va;var r=n.ifRender||_a;this.updatePrograms(e,this._sceneRendering,n),n.sortCompare&&e.sort(n.sortCompare);var i=this.viewport,a=i.devicePixelRatio,o=[i.x*a,i.y*a,i.width*a,i.height*a],s=this.devicePixelRatio,c=this.__currentFrameBuffer?[this.__currentFrameBuffer.getTextureWidth(),this.__currentFrameBuffer.getTextureHeight()]:[this._width*s,this._height*s],l=[o[2],o[3]],u=Date.now();t?(B.copy(Ca.VIEW,t.viewMatrix.array),B.copy(Ca.PROJECTION,t.projectionMatrix.array),B.copy(Ca.VIEWINVERSE,t.worldTransform.array)):(B.identity(Ca.VIEW),B.identity(Ca.PROJECTION),B.identity(Ca.VIEWINVERSE)),B.multiply(Ca.VIEWPROJECTION,Ca.PROJECTION,Ca.VIEW),B.invert(Ca.PROJECTIONINVERSE,Ca.PROJECTION),B.invert(Ca.VIEWPROJECTIONINVERSE,Ca.VIEWPROJECTION);for(var d=this.gl,f=this._sceneRendering,p,m,h,g,_,v,y,b,x,S,C,w,T=null,E=0;E<e.length;E++){var D=e[E],O=D.worldTransform!=null,k;if(r(D)){O&&(k=D.isSkinnedMesh&&D.isSkinnedMesh()?D.offsetMatrix?D.offsetMatrix.array:Ca.IDENTITY:D.worldTransform.array);var A=D.geometry,j=n.getMaterial.call(this,D),M=D.__program,N=j.shader,ee=A.__uid__+`-`+M.__uid__,te=ee!==S;S=ee,te&&T&&T.bindVertexArrayOES(null),O&&(B.copy(Ca.WORLD,k),B.multiply(Ca.WORLDVIEWPROJECTION,Ca.VIEWPROJECTION,k),B.multiplyAffine(Ca.WORLDVIEW,Ca.VIEW,k),(N.matrixSemantics.WORLDINVERSE||N.matrixSemantics.WORLDINVERSETRANSPOSE)&&B.invert(Ca.WORLDINVERSE,k),(N.matrixSemantics.WORLDVIEWINVERSE||N.matrixSemantics.WORLDVIEWINVERSETRANSPOSE)&&B.invert(Ca.WORLDVIEWINVERSE,Ca.WORLDVIEW),(N.matrixSemantics.WORLDVIEWPROJECTIONINVERSE||N.matrixSemantics.WORLDVIEWPROJECTIONINVERSETRANSPOSE)&&B.invert(Ca.WORLDVIEWPROJECTIONINVERSE,Ca.WORLDVIEWPROJECTION)),D.beforeRender&&D.beforeRender(this),n.beforeRender.call(this,D,j,p);var ne=M!==m;ne?(M.bind(this),M.setUniformOfSemantic(d,`VIEWPORT`,o),M.setUniformOfSemantic(d,`WINDOW_SIZE`,c),t&&(M.setUniformOfSemantic(d,`NEAR`,t.near),M.setUniformOfSemantic(d,`FAR`,t.far)),M.setUniformOfSemantic(d,`DEVICEPIXELRATIO`,a),M.setUniformOfSemantic(d,`TIME`,u),M.setUniformOfSemantic(d,`VIEWPORT_SIZE`,l),f&&f.setLightUniforms(M,D.lightGroup,this)):M=m,(ne||n.isMaterialChanged(D,h,j,p))&&(j.depthTest!==g&&(j.depthTest?d.enable(d.DEPTH_TEST):d.disable(d.DEPTH_TEST),g=j.depthTest),j.depthMask!==_&&(d.depthMask(j.depthMask),_=j.depthMask),j.transparent!==x&&(j.transparent?d.enable(d.BLEND):d.disable(d.BLEND),x=j.transparent),j.transparent&&(j.blend?j.blend(d):(d.blendEquationSeparate(d.FUNC_ADD,d.FUNC_ADD),d.blendFuncSeparate(d.SRC_ALPHA,d.ONE_MINUS_SRC_ALPHA,d.ONE,d.ONE_MINUS_SRC_ALPHA))),w=this._bindMaterial(D,j,M,h||null,p||null,m||null,n.getUniform),p=j);var re=N.matrixSemanticKeys;if(O)for(var ie=0;ie<re.length;ie++){var ae=re[ie],oe=N.matrixSemantics[ae],se=Ca[ae];if(oe.isTranspose){var ce=Ca[oe.semanticNoTranspose];B.transpose(se,ce)}M.setUniform(d,oe.type,oe.symbol,se)}D.cullFace!==y&&(y=D.cullFace,d.cullFace(y)),D.frontFace!==b&&(b=D.frontFace,d.frontFace(b)),D.culling!==v&&(v=D.culling,v?d.enable(d.CULL_FACE):d.disable(d.CULL_FACE)),this._updateSkeleton(D,M,w),te&&(C=this._bindVAO(T,N,A,M)),this._renderObject(D,C,M),n.afterRender(this,D),D.afterRender&&D.afterRender(this),m=M,h=D}}T&&T.bindVertexArrayOES(null),this.trigger(`afterrenderpass`,this,e,t,n)},getMaxJointNumber:function(){return this.maxJointNumber},_updateSkeleton:function(e,t,n){var r=this.gl,i=e.skeleton;if(i)if(i.update(),e.joints.length>this.getMaxJointNumber()){var a=i.getSubSkinMatricesTexture(e.__uid__,e.joints);t.useTextureSlot(this,a,n),t.setUniform(r,`1i`,`skinMatricesTexture`,n),t.setUniform(r,`1f`,`skinMatricesTextureSize`,a.width)}else{var o=i.getSubSkinMatrices(e.__uid__,e.joints);t.setUniformOfSemantic(r,`SKIN_MATRIX`,o)}},_renderObject:function(e,t,n){var r=this.gl,i=e.geometry,a=e.mode;a??=4;var o=null,s=e.isInstancedMesh&&e.isInstancedMesh();if(s&&(o=this.getGLExtension(`ANGLE_instanced_arrays`),!o)){console.warn(`Device not support ANGLE_instanced_arrays extension`);return}var c;if(s&&(c=this._bindInstancedAttributes(e,n,o)),t.indicesBuffer){var l=this.getGLExtension(`OES_element_index_uint`)&&i.indices instanceof Uint32Array?r.UNSIGNED_INT:r.UNSIGNED_SHORT;s?o.drawElementsInstancedANGLE(a,t.indicesBuffer.count,l,0,e.getInstanceCount()):r.drawElements(a,t.indicesBuffer.count,l,0)}else s?o.drawArraysInstancedANGLE(a,0,i.vertexCount,e.getInstanceCount()):r.drawArrays(a,0,i.vertexCount);if(s)for(var u=0;u<c.length;u++)r.disableVertexAttribArray(c[u])},_bindInstancedAttributes:function(e,t,n){for(var r=this.gl,i=e.getInstancedAttributesBuffers(this),a=[],o=0;o<i.length;o++){var s=i[o],c=t.getAttribLocation(r,s.symbol);if(!(c<0)){var l=ya[s.type]||r.FLOAT;r.enableVertexAttribArray(c),r.bindBuffer(r.ARRAY_BUFFER,s.buffer),r.vertexAttribPointer(c,s.size,l,!1,0,0),n.vertexAttribDivisorANGLE(c,s.divisor),a.push(c)}}return a},_bindMaterial:function(e,t,n,r,i,a,o){for(var s=this.gl,c=a===n,l=n.currentTextureSlot(),u=t.getEnabledUniforms(),d=t.getTextureUniforms(),f=this._placeholderTexture,p=0;p<d.length;p++){var m=d[p],h=o(e,t,m),g=t.uniforms[m].type;if(g===`t`&&h)h.__slot=-1;else if(g===`tv`)for(var _=0;_<h.length;_++)h[_]&&(h[_].__slot=-1)}f.__slot=-1;for(var p=0;p<u.length;p++){var m=u[p],v=t.uniforms[m],h=o(e,t,m),g=v.type,y=g===`t`;if(y&&(!h||!h.isRenderable())&&(h=f),i&&c){var b=o(r,i,m);if(y&&(!b||!b.isRenderable())&&(b=f),b===h){if(y)n.takeCurrentTextureSlot(this,null);else if(g===`tv`&&h)for(var _=0;_<h.length;_++)n.takeCurrentTextureSlot(this,null);continue}}if(h!=null)if(y)if(h.__slot<0){var x=n.currentTextureSlot();n.setUniform(s,`1i`,m,x)&&(n.takeCurrentTextureSlot(this,h),h.__slot=x)}else n.setUniform(s,`1i`,m,h.__slot);else if(Array.isArray(h)){if(h.length===0)continue;if(g===`tv`){if(!n.hasUniform(m))continue;for(var S=[],_=0;_<h.length;_++){var C=h[_];if(C.__slot<0){var x=n.currentTextureSlot();S.push(x),n.takeCurrentTextureSlot(this,C),C.__slot=x}else S.push(C.__slot)}n.setUniform(s,`1iv`,m,S)}else n.setUniform(s,v.type,m,h)}else n.setUniform(s,v.type,m,h)}var w=n.currentTextureSlot();return n.resetTextureSlot(l),w},_bindVAO:function(e,t,n,r){var i=!n.dynamic,a=this.gl,o=this.__uid__+`-`+r.__uid__,s=n.__vaoCache[o];if(!s){var c=n.getBufferChunks(this);if(!c||!c.length)return;for(var l=c[0],u=l.attributeBuffers,d=l.indicesBuffer,f=[],p=[],m=0;m<u.length;m++){var h=u[m],g=h.name,_=h.semantic,v;if(_){var y=t.attributeSemantics[_];v=y&&y.symbol}else v=g;v&&r.attributes[v]&&(f.push(h),p.push(v))}s=new ba(f,p,d),i&&(n.__vaoCache[o]=s)}var b=!0;e&&i&&(s.vao==null?s.vao=e.createVertexArrayOES():b=!1,e.bindVertexArrayOES(s.vao));var f=s.availableAttributes,d=s.indicesBuffer;if(b){for(var x=r.enableAttributes(this,s.availableAttributeSymbols,e&&i&&s),m=0;m<f.length;m++){var S=x[m];if(S!==-1){var h=f[m],C=h.buffer,w=h.size,T=ya[h.type]||a.FLOAT;a.bindBuffer(a.ARRAY_BUFFER,C),a.vertexAttribPointer(S,w,T,!1,0,0)}}n.isUseIndices()&&a.bindBuffer(a.ELEMENT_ARRAY_BUFFER,d.buffer)}return s},renderPreZ:function(e,t,n){var r=this.gl,i=this._prezMaterial||new ji({shader:new K(K.source(`clay.prez.vertex`),K.source(`clay.prez.fragment`))});this._prezMaterial=i,r.colorMask(!1,!1,!1,!1),r.depthMask(!0),this.renderPass(e,n,{ifRender:function(e){return!e.ignorePreZ},isMaterialChanged:function(e,t){var n=e.material,r=t.material;return n.get(`diffuseMap`)!==r.get(`diffuseMap`)||(n.get(`alphaCutoff`)||0)!==(r.get(`alphaCutoff`)||0)},getUniform:function(e,t,n){return n===`alphaMap`?e.material.get(`diffuseMap`):n===`alphaCutoff`?e.material.isDefined(`fragment`,`ALPHA_TEST`)&&e.material.get(`diffuseMap`)&&e.material.get(`alphaCutoff`)||0:n===`uvRepeat`?e.material.get(`uvRepeat`):n===`uvOffset`?e.material.get(`uvOffset`):t.get(n)},getMaterial:function(){return i},sort:this.opaqueSortCompare}),r.colorMask(!0,!0,!0,!0),r.depthMask(!0)},disposeScene:function(e){this.disposeNode(e,!0,!0),e.dispose()},disposeNode:function(e,t,n){e.getParent()&&e.getParent().remove(e);var r={};e.traverse(function(e){var i=e.material;if(e.geometry&&t&&e.geometry.dispose(this),n&&i&&!r[i.__uid__]){for(var a=i.getTextureUniforms(),o=0;o<a.length;o++){var s=a[o],c=i.uniforms[s].value,l=i.uniforms[s].type;if(c){if(l===`t`)c.dispose&&c.dispose(this);else if(l===`tv`)for(var u=0;u<c.length;u++)c[u]&&c[u].dispose&&c[u].dispose(this)}}r[i.__uid__]=!0}e.dispose&&e.dispose(this)},this)},disposeGeometry:function(e){e.dispose(this)},disposeTexture:function(e){e.dispose(this)},disposeFrameBuffer:function(e){e.dispose(this)},dispose:function(){},screenToNDC:function(e,t,n){n||=new G,t=this._height-t;var r=this.viewport,i=n.array;return i[0]=(e-r.x)/r.width,i[0]=i[0]*2-1,i[1]=(t-r.y)/r.height,i[1]=i[1]*2-1,n}});Sa.opaqueSortCompare=Sa.prototype.opaqueSortCompare=function(e,t){return e.renderOrder===t.renderOrder?e.__program===t.__program?e.material===t.material?e.geometry.__uid__-t.geometry.__uid__:e.material.__uid__-t.material.__uid__:e.__program&&t.__program?e.__program.__uid__-t.__program.__uid__:0:e.renderOrder-t.renderOrder},Sa.transparentSortCompare=Sa.prototype.transparentSortCompare=function(e,t){return e.renderOrder===t.renderOrder?e.__depth===t.__depth?e.__program===t.__program?e.material===t.material?e.geometry.__uid__-t.geometry.__uid__:e.material.__uid__-t.material.__uid__:e.__program&&t.__program?e.__program.__uid__-t.__program.__uid__:0:e.__depth-t.__depth:e.renderOrder-t.renderOrder};var Ca={IDENTITY:fa(),WORLD:fa(),VIEW:fa(),PROJECTION:fa(),WORLDVIEW:fa(),VIEWPROJECTION:fa(),WORLDVIEWPROJECTION:fa(),WORLDINVERSE:fa(),VIEWINVERSE:fa(),PROJECTIONINVERSE:fa(),WORLDVIEWINVERSE:fa(),VIEWPROJECTIONINVERSE:fa(),WORLDVIEWPROJECTIONINVERSE:fa(),WORLDTRANSPOSE:fa(),VIEWTRANSPOSE:fa(),PROJECTIONTRANSPOSE:fa(),WORLDVIEWTRANSPOSE:fa(),VIEWPROJECTIONTRANSPOSE:fa(),WORLDVIEWPROJECTIONTRANSPOSE:fa(),WORLDINVERSETRANSPOSE:fa(),VIEWINVERSETRANSPOSE:fa(),PROJECTIONINVERSETRANSPOSE:fa(),WORLDVIEWINVERSETRANSPOSE:fa(),VIEWPROJECTIONINVERSETRANSPOSE:fa(),WORLDVIEWPROJECTIONINVERSETRANSPOSE:fa()};Sa.COLOR_BUFFER_BIT=H.COLOR_BUFFER_BIT,Sa.DEPTH_BUFFER_BIT=H.DEPTH_BUFFER_BIT,Sa.STENCIL_BUFFER_BIT=H.STENCIL_BUFFER_BIT;var wa=`__dt__`,Ta=function(){this._contextId=0,this._caches=[],this._context={}};Ta.prototype={use:function(e,t){var n=this._caches;n[e]||(n[e]={},t&&(n[e]=t())),this._contextId=e,this._context=n[e]},put:function(e,t){this._context[e]=t},get:function(e){return this._context[e]},dirty:function(e){e||=``;var t=wa+e;this.put(t,!0)},dirtyAll:function(e){e||=``;for(var t=wa+e,n=this._caches,r=0;r<n.length;r++)n[r]&&(n[r][t]=!0)},fresh:function(e){e||=``;var t=wa+e;this.put(t,!1)},freshAll:function(e){e||=``;for(var t=wa+e,n=this._caches,r=0;r<n.length;r++)n[r]&&(n[r][t]=!1)},isDirty:function(e){e||=``;var t=wa+e,n=this._context;return!n.hasOwnProperty(t)||n[t]===!0},deleteContext:function(e){delete this._caches[e],this._context={}},delete:function(e){delete this._context[e]},clearAll:function(){this._caches={}},getContext:function(){return this._context},eachContext:function(e,t){Object.keys(this._caches).forEach(function(n){e&&e.call(t,n)})},miss:function(e){return!this._context.hasOwnProperty(e)}},Ta.prototype.constructor=Ta;var q=Ir.extend({width:512,height:512,type:H.UNSIGNED_BYTE,format:H.RGBA,wrapS:H.REPEAT,wrapT:H.REPEAT,minFilter:H.LINEAR_MIPMAP_LINEAR,magFilter:H.LINEAR,useMipmap:!0,anisotropic:1,flipY:!0,sRGB:!0,unpackAlignment:4,premultiplyAlpha:!1,dynamic:!1,NPOT:!1,__used:0},function(){this._cache=new Ta},{getWebGLTexture:function(e){var t=e.gl,n=this._cache;return n.use(e.__uid__),n.miss(`webgl_texture`)&&n.put(`webgl_texture`,t.createTexture()),this.dynamic?this.update(e):n.isDirty()&&(this.update(e),n.fresh()),n.get(`webgl_texture`)},bind:function(){},unbind:function(){},dirty:function(){this._cache&&this._cache.dirtyAll()},update:function(e){},updateCommon:function(e){var t=e.gl;t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,this.flipY),t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL,this.premultiplyAlpha),t.pixelStorei(t.UNPACK_ALIGNMENT,this.unpackAlignment),this.format===H.DEPTH_COMPONENT&&(this.useMipmap=!1);var n=e.getGLExtension(`EXT_sRGB`);this.format===q.SRGB&&!n&&(this.format=q.RGB),this.format===q.SRGB_ALPHA&&!n&&(this.format=q.RGBA),this.NPOT=!this.isPowerOfTwo()},getAvailableWrapS:function(){return this.NPOT?H.CLAMP_TO_EDGE:this.wrapS},getAvailableWrapT:function(){return this.NPOT?H.CLAMP_TO_EDGE:this.wrapT},getAvailableMinFilter:function(){var e=this.minFilter;return this.NPOT||!this.useMipmap?e===H.NEAREST_MIPMAP_NEAREST||e===H.NEAREST_MIPMAP_LINEAR?H.NEAREST:e===H.LINEAR_MIPMAP_LINEAR||e===H.LINEAR_MIPMAP_NEAREST?H.LINEAR:e:e},getAvailableMagFilter:function(){return this.magFilter},nextHighestPowerOfTwo:function(e){--e;for(var t=1;t<32;t<<=1)e|=e>>t;return e+1},dispose:function(e){var t=this._cache;t.use(e.__uid__);var n=t.get(`webgl_texture`);n&&e.gl.deleteTexture(n),t.deleteContext(e.__uid__)},isRenderable:function(){},isPowerOfTwo:function(){}});Object.defineProperty(q.prototype,"width",{get:function(){return this._width},set:function(e){this._width=e}}),Object.defineProperty(q.prototype,"height",{get:function(){return this._height},set:function(e){this._height=e}}),q.BYTE=H.BYTE,q.UNSIGNED_BYTE=H.UNSIGNED_BYTE,q.SHORT=H.SHORT,q.UNSIGNED_SHORT=H.UNSIGNED_SHORT,q.INT=H.INT,q.UNSIGNED_INT=H.UNSIGNED_INT,q.FLOAT=H.FLOAT,q.HALF_FLOAT=36193,q.UNSIGNED_INT_24_8_WEBGL=34042,q.DEPTH_COMPONENT=H.DEPTH_COMPONENT,q.DEPTH_STENCIL=H.DEPTH_STENCIL,q.ALPHA=H.ALPHA,q.RGB=H.RGB,q.RGBA=H.RGBA,q.LUMINANCE=H.LUMINANCE,q.LUMINANCE_ALPHA=H.LUMINANCE_ALPHA,q.SRGB=35904,q.SRGB_ALPHA=35906,q.COMPRESSED_RGB_S3TC_DXT1_EXT=33776,q.COMPRESSED_RGBA_S3TC_DXT1_EXT=33777,q.COMPRESSED_RGBA_S3TC_DXT3_EXT=33778,q.COMPRESSED_RGBA_S3TC_DXT5_EXT=33779,q.NEAREST=H.NEAREST,q.LINEAR=H.LINEAR,q.NEAREST_MIPMAP_NEAREST=H.NEAREST_MIPMAP_NEAREST,q.LINEAR_MIPMAP_NEAREST=H.LINEAR_MIPMAP_NEAREST,q.NEAREST_MIPMAP_LINEAR=H.NEAREST_MIPMAP_LINEAR,q.LINEAR_MIPMAP_LINEAR=H.LINEAR_MIPMAP_LINEAR,q.REPEAT=H.REPEAT,q.CLAMP_TO_EDGE=H.CLAMP_TO_EDGE,q.MIRRORED_REPEAT=H.MIRRORED_REPEAT;var Ea={};Ea.isPowerOfTwo=function(e){return(e&e-1)==0},Ea.nextPowerOfTwo=function(e){return e--,e|=e>>1,e|=e>>2,e|=e>>4,e|=e>>8,e|=e>>16,e++,e},Ea.nearestPowerOfTwo=function(e){return 2**Math.round(Math.log(e)/Math.LN2)};var Da=Ea.isPowerOfTwo;function Oa(e){return 2**Math.round(Math.log(e)/Math.LN2)}function ka(e,t){var n=Oa(e.width),r=Oa(e.height);return t||=document.createElement(`canvas`),t.width=n,t.height=r,t.getContext(`2d`).drawImage(e.image,0,0,n,r),t}var J=q.extend(function(){return{image:null,pixels:null,mipmaps:[],convertToPOT:!1}},{textureType:`texture2D`,update:function(e){var t=e.gl;t.bindTexture(t.TEXTURE_2D,this._cache.get(`webgl_texture`)),this.updateCommon(e);var n=this.format,r=this.type,i=!!(this.convertToPOT&&!this.mipmaps.length&&this.image&&(this.wrapS===q.REPEAT||this.wrapT===q.REPEAT)&&this.NPOT);t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,i?this.wrapS:this.getAvailableWrapS()),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,i?this.wrapT:this.getAvailableWrapT()),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,i?this.magFilter:this.getAvailableMagFilter()),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,i?this.minFilter:this.getAvailableMinFilter());var a=e.getGLExtension(`EXT_texture_filter_anisotropic`);if(a&&this.anisotropic>1&&t.texParameterf(t.TEXTURE_2D,a.TEXTURE_MAX_ANISOTROPY_EXT,this.anisotropic),r===36193&&(e.getGLExtension(`OES_texture_half_float`)||(r=H.FLOAT)),this.mipmaps.length)for(var o=this.width,s=this.height,c=0;c<this.mipmaps.length;c++){var l=this.mipmaps[c];this._updateTextureData(t,l,c,o,s,n,r,!1),o/=2,s/=2}else this._updateTextureData(t,this,0,this.width,this.height,n,r,i),this.useMipmap&&(!this.NPOT||i)&&t.generateMipmap(t.TEXTURE_2D);t.bindTexture(t.TEXTURE_2D,null)},_updateTextureData:function(e,t,n,r,i,a,o,s){if(t.image){var c=t.image;s&&(this._potCanvas=ka(this,this._potCanvas),c=this._potCanvas),e.texImage2D(e.TEXTURE_2D,n,a,a,o,c)}else a<=q.COMPRESSED_RGBA_S3TC_DXT5_EXT&&a>=q.COMPRESSED_RGB_S3TC_DXT1_EXT?e.compressedTexImage2D(e.TEXTURE_2D,n,a,r,i,0,t.pixels):e.texImage2D(e.TEXTURE_2D,n,a,r,i,0,a,o,t.pixels)},generateMipmap:function(e){var t=e.gl;this.useMipmap&&!this.NPOT&&(t.bindTexture(t.TEXTURE_2D,this._cache.get(`webgl_texture`)),t.generateMipmap(t.TEXTURE_2D))},isPowerOfTwo:function(){return Da(this.width)&&Da(this.height)},isRenderable:function(){return this.image?this.image.width>0&&this.image.height>0:!!(this.width&&this.height)},bind:function(e){e.gl.bindTexture(e.gl.TEXTURE_2D,this.getWebGLTexture(e))},unbind:function(e){e.gl.bindTexture(e.gl.TEXTURE_2D,null)},load:function(e,t){var n=U.createImage();t&&(n.crossOrigin=t);var r=this;return n.onload=function(){r.dirty(),r.trigger(`success`,r)},n.onerror=function(){r.trigger(`error`,r)},n.src=e,this.image=n,this}});Object.defineProperty(J.prototype,"width",{get:function(){return this.image?this.image.width:this._width},set:function(e){this.image?console.warn(`Texture from image can't set width`):(this._width!==e&&this.dirty(),this._width=e)}}),Object.defineProperty(J.prototype,"height",{get:function(){return this.image?this.image.height:this._height},set:function(e){this.image?console.warn(`Texture from image can't set height`):(this._height!==e&&this.dirty(),this._height=e)}});function Aa(e){return{byte:U.Int8Array,ubyte:U.Uint8Array,short:U.Int16Array,ushort:U.Uint16Array}[e]||U.Float32Array}function ja(e){return`attr_`+e}function Ma(e,t,n,r){switch(this.name=e,this.type=t,this.size=n,this.semantic=r||``,this.value=null,n){case 1:this.get=function(e){return this.value[e]},this.set=function(e,t){this.value[e]=t},this.copy=function(e,t){this.value[e]=this.value[e]};break;case 2:this.get=function(e,t){var n=this.value;return t[0]=n[e*2],t[1]=n[e*2+1],t},this.set=function(e,t){var n=this.value;n[e*2]=t[0],n[e*2+1]=t[1]},this.copy=function(e,t){var n=this.value;t*=2,e*=2,n[e]=n[t],n[e+1]=n[t+1]};break;case 3:this.get=function(e,t){var n=e*3,r=this.value;return t[0]=r[n],t[1]=r[n+1],t[2]=r[n+2],t},this.set=function(e,t){var n=e*3,r=this.value;r[n]=t[0],r[n+1]=t[1],r[n+2]=t[2]},this.copy=function(e,t){var n=this.value;t*=3,e*=3,n[e]=n[t],n[e+1]=n[t+1],n[e+2]=n[t+2]};break;case 4:this.get=function(e,t){var n=this.value,r=e*4;return t[0]=n[r],t[1]=n[r+1],t[2]=n[r+2],t[3]=n[r+3],t},this.set=function(e,t){var n=this.value,r=e*4;n[r]=t[0],n[r+1]=t[1],n[r+2]=t[2],n[r+3]=t[3]},this.copy=function(e,t){var n=this.value;t*=4,e*=4,n[e]=n[t],n[e+1]=n[t+1],n[e+2]=n[t+2],n[e+3]=n[t+3]}}}Ma.prototype.init=function(e){if(!this.value||this.value.length!==e*this.size){var t=Aa(this.type);this.value=new t(e*this.size)}},Ma.prototype.fromArray=function(e){var t=Aa(this.type),n;if(e[0]&&e[0].length){var r=0,i=this.size;n=new t(e.length*i);for(var a=0;a<e.length;a++)for(var o=0;o<i;o++)n[r++]=e[a][o]}else n=new t(e);this.value=n},Ma.prototype.clone=function(e){var t=new Ma(this.name,this.type,this.size,this.semantic);return e&&console.warn(`todo`),t};function Na(e,t,n,r,i){this.name=e,this.type=t,this.buffer=n,this.size=r,this.semantic=i,this.symbol=``,this.needsRemove=!1}function Pa(e){this.buffer=e,this.count=0}var Fa=Ir.extend(function(){return{attributes:{},indices:null,dynamic:!0,_enabledAttributes:null,__used:0}},function(){this._cache=new Ta,this._attributeList=Object.keys(this.attributes),this.__vaoCache={}},{mainAttribute:``,pick:null,pickByRay:null,dirty:function(){for(var e=this.getEnabledAttributes(),t=0;t<e.length;t++)this.dirtyAttribute(e[t]);this.dirtyIndices(),this._enabledAttributes=null,this._cache.dirty(`any`)},dirtyIndices:function(){this._cache.dirtyAll(`indices`)},dirtyAttribute:function(e){this._cache.dirtyAll(ja(e)),this._cache.dirtyAll(`attributes`)},getTriangleIndices:function(e,t){if(e<this.triangleCount&&e>=0){t||=[];var n=this.indices;return t[0]=n[e*3],t[1]=n[e*3+1],t[2]=n[e*3+2],t}},setTriangleIndices:function(e,t){var n=this.indices;n[e*3]=t[0],n[e*3+1]=t[1],n[e*3+2]=t[2]},isUseIndices:function(){return!!this.indices},initIndicesFromArray:function(e){var t,n=this.vertexCount>65535?U.Uint32Array:U.Uint16Array;if(e[0]&&e[0].length){var r=0,i=3;t=new n(e.length*i);for(var a=0;a<e.length;a++)for(var o=0;o<i;o++)t[r++]=e[a][o]}else t=new n(e);this.indices=t},createAttribute:function(e,t,n,r){var i=new Ma(e,t,n,r);return this.attributes[e]&&this.removeAttribute(e),this.attributes[e]=i,this._attributeList.push(e),i},removeAttribute:function(e){var t=this._attributeList,n=t.indexOf(e);return n>=0?(t.splice(n,1),delete this.attributes[e],!0):!1},getAttribute:function(e){return this.attributes[e]},getEnabledAttributes:function(){var e=this._enabledAttributes,t=this._attributeList;if(e)return e;for(var n=[],r=this.vertexCount,i=0;i<t.length;i++){var a=t[i],o=this.attributes[a];o.value&&o.value.length===r*o.size&&n.push(a)}return this._enabledAttributes=n,n},getBufferChunks:function(e){var t=this._cache;t.use(e.__uid__);var n=t.isDirty(`attributes`),r=t.isDirty(`indices`);if(n||r){this._updateBuffer(e.gl,n,r);for(var i=this.getEnabledAttributes(),a=0;a<i.length;a++)t.fresh(ja(i[a]));t.fresh(`attributes`),t.fresh(`indices`)}return t.fresh(`any`),t.get(`chunks`)},_updateBuffer:function(e,t,n){var r=this._cache,i=r.get(`chunks`),a=!1;i||(i=[],i[0]={attributeBuffers:[],indicesBuffer:null},r.put(`chunks`,i),a=!0);var o=i[0],s=o.attributeBuffers,c=o.indicesBuffer;if(t||a){var l=this.getEnabledAttributes(),u={};if(!a)for(var d=0;d<s.length;d++)u[s[d].name]=s[d];for(var f=0;f<l.length;f++){var p=l[f],m=this.attributes[p],h;a||(h=u[p]);var g=h?h.buffer:e.createBuffer();r.isDirty(ja(p))&&(e.bindBuffer(e.ARRAY_BUFFER,g),e.bufferData(e.ARRAY_BUFFER,m.value,this.dynamic?e.DYNAMIC_DRAW:e.STATIC_DRAW)),s[f]=new Na(p,m.type,g,m.size,m.semantic)}for(var d=f;d<s.length;d++)e.deleteBuffer(s[d].buffer);s.length=f}this.isUseIndices()&&(n||a)&&(c||(c=new Pa(e.createBuffer()),o.indicesBuffer=c),c.count=this.indices.length,e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,c.buffer),e.bufferData(e.ELEMENT_ARRAY_BUFFER,this.indices,this.dynamic?e.DYNAMIC_DRAW:e.STATIC_DRAW))},dispose:function(e){var t=this._cache;t.use(e.__uid__);var n=t.get(`chunks`);if(n)for(var r=0;r<n.length;r++){for(var i=n[r],a=0;a<i.attributeBuffers.length;a++){var o=i.attributeBuffers[a];e.gl.deleteBuffer(o.buffer)}i.indicesBuffer&&e.gl.deleteBuffer(i.indicesBuffer.buffer)}if(this.__vaoCache){var s=e.getGLExtension(`OES_vertex_array_object`);for(var c in this.__vaoCache){var l=this.__vaoCache[c].vao;l&&s.deleteVertexArrayOES(l)}}this.__vaoCache={},t.deleteContext(e.__uid__)}});Object.defineProperty&&(Object.defineProperty(Fa.prototype,"vertexCount",{enumerable:!1,get:function(){var e=this.attributes[this.mainAttribute];return e||=this.attributes[this._attributeList[0]],!e||!e.value?0:e.value.length/e.size}}),Object.defineProperty(Fa.prototype,"triangleCount",{enumerable:!1,get:function(){var e=this.indices;return e?e.length/3:0}})),Fa.STATIC_DRAW=H.STATIC_DRAW,Fa.DYNAMIC_DRAW=H.DYNAMIC_DRAW,Fa.STREAM_DRAW=H.STREAM_DRAW,Fa.AttributeBuffer=Na,Fa.IndicesBuffer=Pa,Fa.Attribute=Ma;var Ia=P.create,La=P.add,Ra=P.set,za=Fa.Attribute,Ba=Fa.extend(function(){return{attributes:{position:new za(`position`,`float`,3,`POSITION`),texcoord0:new za(`texcoord0`,`float`,2,`TEXCOORD_0`),texcoord1:new za(`texcoord1`,`float`,2,`TEXCOORD_1`),normal:new za(`normal`,`float`,3,`NORMAL`),tangent:new za(`tangent`,`float`,4,`TANGENT`),color:new za(`color`,`float`,4,`COLOR`),weight:new za(`weight`,`float`,3,`WEIGHT`),joint:new za(`joint`,`float`,4,`JOINT`),barycentric:new za(`barycentric`,`float`,3,null)},boundingBox:null}},{mainAttribute:`position`,updateBoundingBox:function(){var e=this.boundingBox;e||=this.boundingBox=new Zr;var t=this.attributes.position.value;if(t&&t.length){var n=e.min,r=e.max,i=n.array,a=r.array;P.set(i,t[0],t[1],t[2]),P.set(a,t[0],t[1],t[2]);for(var o=3;o<t.length;){var s=t[o++],c=t[o++],l=t[o++];s<i[0]&&(i[0]=s),c<i[1]&&(i[1]=c),l<i[2]&&(i[2]=l),s>a[0]&&(a[0]=s),c>a[1]&&(a[1]=c),l>a[2]&&(a[2]=l)}n._dirty=!0,r._dirty=!0}},generateVertexNormals:function(){if(this.vertexCount){var e=this.indices,t=this.attributes,n=t.position.value,r=t.normal.value;if(!r||r.length!==n.length)r=t.normal.value=new U.Float32Array(n.length);else for(var i=0;i<r.length;i++)r[i]=0;for(var a=Ia(),o=Ia(),s=Ia(),c=Ia(),l=Ia(),u=Ia(),d=e?e.length:this.vertexCount,f,p,m,h=0;h<d;){e?(f=e[h++],p=e[h++],m=e[h++]):(f=h++,p=h++,m=h++),Ra(a,n[f*3],n[f*3+1],n[f*3+2]),Ra(o,n[p*3],n[p*3+1],n[p*3+2]),Ra(s,n[m*3],n[m*3+1],n[m*3+2]),P.sub(c,a,o),P.sub(l,o,s),P.cross(u,c,l);for(var i=0;i<3;i++)r[f*3+i]=r[f*3+i]+u[i],r[p*3+i]=r[p*3+i]+u[i],r[m*3+i]=r[m*3+i]+u[i]}for(var i=0;i<r.length;)Ra(u,r[i],r[i+1],r[i+2]),P.normalize(u,u),r[i++]=u[0],r[i++]=u[1],r[i++]=u[2];this.dirty()}},generateFaceNormals:function(){if(this.vertexCount){this.isUniqueVertex()||this.generateUniqueVertex();var e=this.indices,t=this.attributes,n=t.position.value,r=t.normal.value,i=Ia(),a=Ia(),o=Ia(),s=Ia(),c=Ia(),l=Ia();r||=t.normal.value=new Float32Array(n.length);for(var u=e?e.length:this.vertexCount,d,f,p,m=0;m<u;){e?(d=e[m++],f=e[m++],p=e[m++]):(d=m++,f=m++,p=m++),Ra(i,n[d*3],n[d*3+1],n[d*3+2]),Ra(a,n[f*3],n[f*3+1],n[f*3+2]),Ra(o,n[p*3],n[p*3+1],n[p*3+2]),P.sub(s,i,a),P.sub(c,a,o),P.cross(l,s,c),P.normalize(l,l);for(var h=0;h<3;h++)r[d*3+h]=l[h],r[f*3+h]=l[h],r[p*3+h]=l[h]}this.dirty()}},generateTangents:function(){if(this.vertexCount){var e=this.vertexCount,t=this.attributes;t.tangent.value||(t.tangent.value=new Float32Array(e*4));var n=t.texcoord0.value,r=t.position.value,i=t.tangent.value,a=t.normal.value;if(!n){console.warn(`Geometry without texcoords can't generate tangents.`);return}for(var o=[],s=[],c=0;c<e;c++)o[c]=[0,0,0],s[c]=[0,0,0];for(var l=[0,0,0],u=[0,0,0],d=this.indices,f=d?d.length:this.vertexCount,p,m,h,c=0;c<f;){d?(p=d[c++],m=d[c++],h=d[c++]):(p=c++,m=c++,h=c++);var g=n[p*2],_=n[m*2],v=n[h*2],y=n[p*2+1],b=n[m*2+1],x=n[h*2+1],S=r[p*3],C=r[m*3],w=r[h*3],T=r[p*3+1],E=r[m*3+1],D=r[h*3+1],O=r[p*3+2],k=r[m*3+2],A=r[h*3+2],j=C-S,M=w-S,N=E-T,ee=D-T,te=k-O,ne=A-O,re=_-g,ie=v-g,ae=b-y,oe=x-y,se=1/(re*oe-ae*ie);l[0]=(oe*j-ae*M)*se,l[1]=(oe*N-ae*ee)*se,l[2]=(oe*te-ae*ne)*se,u[0]=(re*M-ie*j)*se,u[1]=(re*ee-ie*N)*se,u[2]=(re*ne-ie*te)*se,La(o[p],o[p],l),La(o[m],o[m],l),La(o[h],o[h],l),La(s[p],s[p],u),La(s[m],s[m],u),La(s[h],s[h],u)}for(var ce=Ia(),le=Ia(),ue=Ia(),c=0;c<e;c++){ue[0]=a[c*3],ue[1]=a[c*3+1],ue[2]=a[c*3+2];var de=o[c];P.scale(ce,ue,P.dot(ue,de)),P.sub(ce,de,ce),P.normalize(ce,ce),P.cross(le,ue,de),i[c*4]=ce[0],i[c*4+1]=ce[1],i[c*4+2]=ce[2],i[c*4+3]=P.dot(le,s[c])<0?-1:1}this.dirty()}},isUniqueVertex:function(){return this.isUseIndices()?this.vertexCount===this.indices.length:!0},generateUniqueVertex:function(){if(!(!this.vertexCount||!this.indices)){this.indices.length>65535&&(this.indices=new U.Uint32Array(this.indices));for(var e=this.attributes,t=this.indices,n=this.getEnabledAttributes(),r={},i=0;i<n.length;i++){var a=n[i];r[a]=e[a].value,e[a].init(this.indices.length)}for(var o=0,s=0;s<t.length;s++){for(var c=t[s],i=0;i<n.length;i++)for(var a=n[i],l=e[a].value,u=e[a].size,d=0;d<u;d++)l[o*u+d]=r[a][c*u+d];t[s]=o,o++}this.dirty()}},generateBarycentric:function(){if(this.vertexCount){this.isUniqueVertex()||this.generateUniqueVertex();var e=this.attributes,t=e.barycentric.value,n=this.indices;if(!(t&&t.length===n.length*3)){t=e.barycentric.value=new Float32Array(n.length*3);for(var r=0;r<(n?n.length:this.vertexCount/3);)for(var i=0;i<3;i++){var a=n?n[r++]:r*3+i;t[a*3+i]=1}this.dirty()}}},applyTransform:function(e){var t=this.attributes,n=t.position.value,r=t.normal.value,i=t.tangent.value;e=e.array;var a=B.create();B.invert(a,e),B.transpose(a,a);var o=P.transformMat4,s=P.forEach;s(n,3,0,null,o,e),r&&s(r,3,0,null,o,a),i&&s(i,4,0,null,o,a),this.boundingBox&&this.updateBoundingBox()},dispose:function(e){var t=this._cache;t.use(e.__uid__);var n=t.get(`chunks`);if(n)for(var r=0;r<n.length;r++){for(var i=n[r],a=0;a<i.attributeBuffers.length;a++){var o=i.attributeBuffers[a];e.gl.deleteBuffer(o.buffer)}i.indicesBuffer&&e.gl.deleteBuffer(i.indicesBuffer.buffer)}if(this.__vaoCache){var s=e.getGLExtension(`OES_vertex_array_object`);for(var c in this.__vaoCache){var l=this.__vaoCache[c].vao;l&&s.deleteVertexArrayOES(l)}}this.__vaoCache={},t.deleteContext(e.__uid__)}});Ba.STATIC_DRAW=Fa.STATIC_DRAW,Ba.DYNAMIC_DRAW=Fa.DYNAMIC_DRAW,Ba.STREAM_DRAW=Fa.STREAM_DRAW,Ba.AttributeBuffer=Fa.AttributeBuffer,Ba.IndicesBuffer=Fa.IndicesBuffer,Ba.Attribute=za;var Va=`vec3 calcAmbientSHLight(int idx, vec3 N) {
 int offset = 9 * idx;
 return ambientSHLightCoefficients[0]
 + ambientSHLightCoefficients[1] * N.x
 + ambientSHLightCoefficients[2] * N.y
 + ambientSHLightCoefficients[3] * N.z
 + ambientSHLightCoefficients[4] * N.x * N.z
 + ambientSHLightCoefficients[5] * N.z * N.y
 + ambientSHLightCoefficients[6] * N.y * N.x
 + ambientSHLightCoefficients[7] * (3.0 * N.z * N.z - 1.0)
 + ambientSHLightCoefficients[8] * (N.x * N.x - N.y * N.y);
}`,Ha=`uniform vec3 `,Ua=`uniform float `,Wa=`@export clay.header.`,Ga=`@end`,Ka=`:unconfigurable;`,qa=[Wa+`directional_light`,Ha+`directionalLightDirection[DIRECTIONAL_LIGHT_COUNT]`+Ka,Ha+`directionalLightColor[DIRECTIONAL_LIGHT_COUNT]`+Ka,Ga,Wa+`ambient_light`,Ha+`ambientLightColor[AMBIENT_LIGHT_COUNT]`+Ka,Ga,Wa+`ambient_sh_light`,Ha+`ambientSHLightColor[AMBIENT_SH_LIGHT_COUNT]`+Ka,Ha+`ambientSHLightCoefficients[AMBIENT_SH_LIGHT_COUNT * 9]`+Ka,Va,Ga,Wa+`ambient_cubemap_light`,Ha+`ambientCubemapLightColor[AMBIENT_CUBEMAP_LIGHT_COUNT]`+Ka,`uniform samplerCube ambientCubemapLightCubemap[AMBIENT_CUBEMAP_LIGHT_COUNT]`+Ka,`uniform sampler2D ambientCubemapLightBRDFLookup[AMBIENT_CUBEMAP_LIGHT_COUNT]`+Ka,Ga,Wa+`point_light`,Ha+`pointLightPosition[POINT_LIGHT_COUNT]`+Ka,Ua+`pointLightRange[POINT_LIGHT_COUNT]`+Ka,Ha+`pointLightColor[POINT_LIGHT_COUNT]`+Ka,Ga,Wa+`spot_light`,Ha+`spotLightPosition[SPOT_LIGHT_COUNT]`+Ka,Ha+`spotLightDirection[SPOT_LIGHT_COUNT]`+Ka,Ua+`spotLightRange[SPOT_LIGHT_COUNT]`+Ka,Ua+`spotLightUmbraAngleCosine[SPOT_LIGHT_COUNT]`+Ka,Ua+`spotLightPenumbraAngleCosine[SPOT_LIGHT_COUNT]`+Ka,Ua+`spotLightFalloffFactor[SPOT_LIGHT_COUNT]`+Ka,Ha+`spotLightColor[SPOT_LIGHT_COUNT]`+Ka,Ga].join(`
`);K.import(qa);var Ja=$r.extend(function(){return{color:[1,1,1],intensity:1,castShadow:!0,shadowResolution:512,group:0}},{type:``,clone:function(){var e=$r.prototype.clone.call(this);return e.color=Array.prototype.slice.call(this.color),e.intensity=this.intensity,e.castShadow=this.castShadow,e.shadowResolution=this.shadowResolution,e}}),Ya=function(e,t){this.normal=e||new F(0,1,0),this.distance=t||0};Ya.prototype={constructor:Ya,distanceToPoint:function(e){return P.dot(e.array,this.normal.array)-this.distance},projectPoint:function(e,t){t||=new F;var n=this.distanceToPoint(e);return P.scaleAndAdd(t.array,e.array,this.normal.array,-n),t._dirty=!0,t},normalize:function(){var e=1/P.len(this.normal.array);P.scale(this.normal.array,e),this.distance*=e},intersectFrustum:function(e){for(var t=e.vertices,n=this.normal.array,r=P.dot(t[0].array,n)>this.distance,i=1;i<8;i++)if(P.dot(t[i].array,n)>this.distance!=r)return!0},intersectLine:(function(){var e=P.create();return function(t,n,r){var i=this.distanceToPoint(t),a=this.distanceToPoint(n);if(i>0&&a>0||i<0&&a<0)return null;var o=this.normal.array,s=this.distance,c=t.array;P.sub(e,n.array,t.array),P.normalize(e,e);var l=P.dot(o,e);if(l===0)return null;r||=new F;var u=(P.dot(o,c)-s)/l;return P.scaleAndAdd(r.array,c,e,-u),r._dirty=!0,r}})(),applyTransform:(function(){var e=B.create(),t=I.create(),n=I.create();return n[3]=1,function(r){r=r.array,P.scale(n,this.normal.array,this.distance),I.transformMat4(n,n,r),this.distance=P.dot(n,this.normal.array),B.invert(e,r),B.transpose(e,e),t[3]=0,P.copy(t,this.normal.array),I.transformMat4(t,t,e),P.copy(this.normal.array,t)}})(),copy:function(e){P.copy(this.normal.array,e.normal.array),this.normal._dirty=!0,this.distance=e.distance},clone:function(){var e=new Ya;return e.copy(this),e}};var Xa=P.set,Za=P.copy,Qa=P.transformMat4,$a=Math.min,eo=Math.max,to=function(){this.planes=[];for(var e=0;e<6;e++)this.planes.push(new Ya);this.boundingBox=new Zr,this.vertices=[];for(var e=0;e<8;e++)this.vertices[e]=P.fromValues(0,0,0)};to.prototype={setFromProjection:function(e){var t=this.planes,n=e.array,r=n[0],i=n[1],a=n[2],o=n[3],s=n[4],c=n[5],l=n[6],u=n[7],d=n[8],f=n[9],p=n[10],m=n[11],h=n[12],g=n[13],_=n[14],v=n[15];Xa(t[0].normal.array,o-r,u-s,m-d),t[0].distance=-(v-h),t[0].normalize(),Xa(t[1].normal.array,o+r,u+s,m+d),t[1].distance=-(v+h),t[1].normalize(),Xa(t[2].normal.array,o+i,u+c,m+f),t[2].distance=-(v+g),t[2].normalize(),Xa(t[3].normal.array,o-i,u-c,m-f),t[3].distance=-(v-g),t[3].normalize(),Xa(t[4].normal.array,o-a,u-l,m-p),t[4].distance=-(v-_),t[4].normalize(),Xa(t[5].normal.array,o+a,u+l,m+p),t[5].distance=-(v+_),t[5].normalize();var y=this.boundingBox,b=this.vertices;if(v===0){var x=c/r,S=-_/(p-1),C=-_/(p+1),w=-C/c,T=-S/c;y.min.set(-w*x,-w,C),y.max.set(w*x,w,S),Xa(b[0],-w*x,-w,C),Xa(b[1],-w*x,w,C),Xa(b[2],w*x,-w,C),Xa(b[3],w*x,w,C),Xa(b[4],-T*x,-T,S),Xa(b[5],-T*x,T,S),Xa(b[6],T*x,-T,S),Xa(b[7],T*x,T,S)}else{var E=(-1-h)/r,D=(1-h)/r,O=(1-g)/c,k=(-1-g)/c,A=(-1-_)/p,j=(1-_)/p;y.min.set(Math.min(E,D),Math.min(k,O),Math.min(j,A)),y.max.set(Math.max(D,E),Math.max(O,k),Math.max(A,j));var M=y.min.array,N=y.max.array;Xa(b[0],M[0],M[1],M[2]),Xa(b[1],M[0],N[1],M[2]),Xa(b[2],N[0],M[1],M[2]),Xa(b[3],N[0],N[1],M[2]),Xa(b[4],M[0],M[1],N[2]),Xa(b[5],M[0],N[1],N[2]),Xa(b[6],N[0],M[1],N[2]),Xa(b[7],N[0],N[1],N[2])}},getTransformedBoundingBox:(function(){var e=P.create();return function(t,n){var r=this.vertices,i=n.array,a=t.min,o=t.max,s=a.array,c=o.array,l=r[0];Qa(e,l,i),Za(s,e),Za(c,e);for(var u=1;u<8;u++)l=r[u],Qa(e,l,i),s[0]=$a(e[0],s[0]),s[1]=$a(e[1],s[1]),s[2]=$a(e[2],s[2]),c[0]=eo(e[0],c[0]),c[1]=eo(e[1],c[1]),c[2]=eo(e[2],c[2]);return a._dirty=!0,o._dirty=!0,t}})()};var no=1e-5,ro=function(e,t){this.origin=e||new F,this.direction=t||new F};ro.prototype={constructor:ro,intersectPlane:function(e,t){var n=e.normal.array,r=e.distance,i=this.origin.array,a=this.direction.array,o=P.dot(n,a);if(o===0)return null;t||=new F;var s=(P.dot(n,i)-r)/o;return P.scaleAndAdd(t.array,i,a,-s),t._dirty=!0,t},mirrorAgainstPlane:function(e){var t=P.dot(e.normal.array,this.direction.array);P.scaleAndAdd(this.direction.array,this.direction.array,e.normal.array,-t*2),this.direction._dirty=!0},distanceToPoint:(function(){var e=P.create();return function(t){P.sub(e,t,this.origin.array);var n=P.dot(e,this.direction.array);if(n<0)return P.distance(this.origin.array,t);var r=P.lenSquared(e);return Math.sqrt(r-n*n)}})(),intersectSphere:(function(){var e=P.create();return function(t,n,r){var i=this.origin.array,a=this.direction.array;t=t.array,P.sub(e,t,i);var o=P.dot(e,a),s=P.squaredLength(e)-o*o,c=n*n;if(!(s>c)){var l=Math.sqrt(c-s),u=o-l,d=o+l;return r||=new F,u<0?d<0?null:(P.scaleAndAdd(r.array,i,a,d),r):(P.scaleAndAdd(r.array,i,a,u),r)}}})(),intersectBoundingBox:function(e,t){var n=this.direction.array,r=this.origin.array,i=e.min.array,a=e.max.array,o=1/n[0],s=1/n[1],c=1/n[2],l,u,d,f,p,m;if(o>=0?(l=(i[0]-r[0])*o,u=(a[0]-r[0])*o):(u=(i[0]-r[0])*o,l=(a[0]-r[0])*o),s>=0?(d=(i[1]-r[1])*s,f=(a[1]-r[1])*s):(f=(i[1]-r[1])*s,d=(a[1]-r[1])*s),l>f||d>u||((d>l||l!==l)&&(l=d),(f<u||u!==u)&&(u=f),c>=0?(p=(i[2]-r[2])*c,m=(a[2]-r[2])*c):(m=(i[2]-r[2])*c,p=(a[2]-r[2])*c),l>m||p>u)||((p>l||l!==l)&&(l=p),(m<u||u!==u)&&(u=m),u<0))return null;var h=l>=0?l:u;return t||=new F,P.scaleAndAdd(t.array,r,n,h),t},intersectTriangle:(function(){var e=P.create(),t=P.create(),n=P.create(),r=P.create();return function(i,a,o,s,c,l){var u=this.direction.array,d=this.origin.array;i=i.array,a=a.array,o=o.array,P.sub(e,a,i),P.sub(t,o,i),P.cross(r,t,u);var f=P.dot(e,r);if(s){if(f>-no)return null}else if(f>-no&&f<no)return null;P.sub(n,d,i);var p=P.dot(r,n)/f;if(p<0||p>1)return null;P.cross(r,e,n);var m=P.dot(u,r)/f;if(m<0||m>1||p+m>1)return null;P.cross(r,e,t);var h=-P.dot(n,r)/f;return h<0?null:(c||=new F,l&&F.set(l,1-p-m,p,m),P.scaleAndAdd(c.array,d,u,h),c)}})(),applyTransform:function(e){F.add(this.direction,this.direction,this.origin),F.transformMat4(this.origin,this.origin,e),F.transformMat4(this.direction,this.direction,e),F.sub(this.direction,this.direction,this.origin),F.normalize(this.direction,this.direction)},copy:function(e){F.copy(this.origin,e.origin),F.copy(this.direction,e.direction)},clone:function(){var e=new ro;return e.copy(this),e}};var io=$r.extend(function(){return{projectionMatrix:new V,invProjectionMatrix:new V,viewMatrix:new V,frustum:new to}},function(){this.update(!0)},{update:function(e){$r.prototype.update.call(this,e),V.invert(this.viewMatrix,this.worldTransform),this.updateProjectionMatrix(),V.invert(this.invProjectionMatrix,this.projectionMatrix),this.frustum.setFromProjection(this.projectionMatrix)},setViewMatrix:function(e){V.copy(this.viewMatrix,e),V.invert(this.worldTransform,e),this.decomposeWorldTransform()},decomposeProjectionMatrix:function(){},setProjectionMatrix:function(e){V.copy(this.projectionMatrix,e),V.invert(this.invProjectionMatrix,e),this.decomposeProjectionMatrix()},updateProjectionMatrix:function(){},castRay:(function(){var e=I.create();return function(t,n){var r=n===void 0?new ro:n,i=t.array[0],a=t.array[1];return I.set(e,i,a,-1,1),I.transformMat4(e,e,this.invProjectionMatrix.array),I.transformMat4(e,e,this.worldTransform.array),P.scale(r.origin.array,e,1/e[3]),I.set(e,i,a,1,1),I.transformMat4(e,e,this.invProjectionMatrix.array),I.transformMat4(e,e,this.worldTransform.array),P.scale(e,e,1/e[3]),P.sub(r.direction.array,e,r.origin.array),P.normalize(r.direction.array,r.direction.array),r.direction._dirty=!0,r.origin._dirty=!0,r}})()}),ao=B.create(),oo=B.create(),so={};function co(e){var t=[],n=Object.keys(e);n.sort();for(var r=0;r<n.length;r++){var i=n[r];t.push(i+` `+e[i])}var a=t.join(`
`);if(so[a])return so[a];var o=Fr.genGUID();return so[a]=o,o}function lo(){this.opaque=[],this.transparent=[],this._opaqueCount=0,this._transparentCount=0}lo.prototype.startCount=function(){this._opaqueCount=0,this._transparentCount=0},lo.prototype.add=function(e,t){t?this.transparent[this._transparentCount++]=e:this.opaque[this._opaqueCount++]=e},lo.prototype.endCount=function(){this.transparent.length=this._transparentCount,this.opaque.length=this._opaqueCount};var uo=$r.extend(function(){return{material:null,lights:[],viewBoundingBoxLastFrame:new Zr,shadowUniforms:{},_cameraList:[],_lightUniforms:{},_previousLightNumber:{},_lightNumber:{},_lightProgramKeys:{},_nodeRepository:{},_renderLists:new ui(20)}},function(){this._scene=this},{addToScene:function(e){e instanceof io?(this._cameraList.length>0&&console.warn(`Found multiple camera in one scene. Use the fist one.`),this._cameraList.push(e)):e instanceof Ja&&this.lights.push(e),e.name&&(this._nodeRepository[e.name]=e)},removeFromScene:function(e){var t;e instanceof io?(t=this._cameraList.indexOf(e),t>=0&&this._cameraList.splice(t,1)):e instanceof Ja&&(t=this.lights.indexOf(e),t>=0&&this.lights.splice(t,1)),e.name&&delete this._nodeRepository[e.name]},getNode:function(e){return this._nodeRepository[e]},setMainCamera:function(e){var t=this._cameraList.indexOf(e);t>=0&&this._cameraList.splice(t,1),this._cameraList.unshift(e)},getMainCamera:function(){return this._cameraList[0]},getLights:function(){return this.lights},updateLights:function(){var e=this.lights;this._previousLightNumber=this._lightNumber;for(var t={},n=0;n<e.length;n++){var r=e[n];if(!r.invisible){var i=r.group;t[i]||(t[i]={}),t[i][r.type]=t[i][r.type]||0,t[i][r.type]++}}for(var a in this._lightNumber=t,t)this._lightProgramKeys[a]=co(t[a]);this._updateLightUniforms()},cloneNode:function(e){var t=e.clone(),n={};function r(e,t){n[e.__uid__]=t;for(var i=0;i<e._children.length;i++){var a=e._children[i],o=t._children[i];r(a,o)}}return r(e,t),t.traverse(function(e){e.skeleton&&=e.skeleton.clone(n),e.material&&=e.material.clone()}),t},updateRenderList:function(e,t){var n=e.__uid__,r=this._renderLists.get(n);r||(r=new lo,this._renderLists.put(n,r)),r.startCount(),t&&(this.viewBoundingBoxLastFrame.min.set(1/0,1/0,1/0),this.viewBoundingBoxLastFrame.max.set(-1/0,-1/0,-1/0));var i=this.material&&this.material.transparent||!1;return this._doUpdateRenderList(this,e,i,r,t),r.endCount(),r},getRenderList:function(e){return this._renderLists.get(e.__uid__)},_doUpdateRenderList:function(e,t,n,r,i){if(!e.invisible)for(var a=0;a<e._children.length;a++){var o=e._children[a];if(o.isRenderable()){var s=o.isSkinnedMesh()?ao:o.worldTransform.array,c=o.geometry;B.multiplyAffine(oo,t.viewMatrix.array,s),(i&&!c.boundingBox||!this.isFrustumCulled(o,t,oo))&&r.add(o,o.material.transparent||n)}o._children.length>0&&this._doUpdateRenderList(o,t,n,r,i)}},isFrustumCulled:(function(){var e=new Zr,t=new V;return function(n,r,i){var a=n.boundingBox;if(a||=n.skeleton&&n.skeleton.boundingBox?n.skeleton.boundingBox:n.geometry.boundingBox,!a)return!1;if(t.array=i,e.transformFrom(a,t),n.castShadow&&this.viewBoundingBoxLastFrame.union(e),n.frustumCulling){if(!e.intersectBoundingBox(r.frustum.boundingBox))return!0;t.array=r.projectionMatrix.array,e.max.array[2]>0&&e.min.array[2]<0&&(e.max.array[2]=-1e-20),e.applyProjection(t);var o=e.min.array,s=e.max.array;if(s[0]<-1||o[0]>1||s[1]<-1||o[1]>1||s[2]<-1||o[2]>1)return!0}return!1}})(),_updateLightUniforms:function(){var e=this.lights;e.sort(fo);var t=this._lightUniforms;for(var n in t)for(var r in t[n])t[n][r].value.length=0;for(var i=0;i<e.length;i++){var a=e[i];if(!a.invisible){var n=a.group;for(var r in a.uniformTemplates){var o=a.uniformTemplates[r],s=o.value(a);if(s!=null){t[n]||(t[n]={}),t[n][r]||(t[n][r]={type:``,value:[]});var c=t[n][r];switch(c.type=o.type+`v`,o.type){case`1i`:case`1f`:case`t`:c.value.push(s);break;case`2f`:case`3f`:case`4f`:for(var l=0;l<s.length;l++)c.value.push(s[l]);break;default:console.error(`Unkown light uniform type `+o.type)}}}}}},getLightGroups:function(){var e=[];for(var t in this._lightNumber)e.push(t);return e},getNumberChangedLightGroups:function(){var e=[];for(var t in this._lightNumber)this.isLightNumberChanged(t)&&e.push(t);return e},isLightNumberChanged:function(e){var t=this._previousLightNumber,n=this._lightNumber;for(var r in n[e])if(!t[e]||n[e][r]!==t[e][r])return!0;for(var r in t[e])if(!n[e]||n[e][r]!==t[e][r])return!0;return!1},getLightsNumbers:function(e){return this._lightNumber[e]},getProgramKey:function(e){return this._lightProgramKeys[e]},setLightUniforms:(function(){function e(e,t,n){for(var r in e){var i=e[r];if(i.type===`tv`){if(!t.hasUniform(r))continue;for(var a=[],o=0;o<i.value.length;o++){var s=i.value[o],c=t.takeCurrentTextureSlot(n,s);a.push(c)}t.setUniform(n.gl,`1iv`,r,a)}else t.setUniform(n.gl,i.type,r,i.value)}}return function(t,n,r){e(this._lightUniforms[n],t,r),e(this.shadowUniforms,t,r)}})(),dispose:function(){this.material=null,this._opaqueList=[],this._transparentList=[],this.lights=[],this._lightUniforms={},this._lightNumber={},this._nodeRepository={}}});function fo(e,t){if(t.castShadow&&!e.castShadow)return!0}var po=Ea.isPowerOfTwo,mo=[`px`,`nx`,`py`,`ny`,`pz`,`nz`],ho=q.extend(function(){return{image:{px:null,nx:null,py:null,ny:null,pz:null,nz:null},pixels:{px:null,nx:null,py:null,ny:null,pz:null,nz:null},mipmaps:[]}},{textureType:`textureCube`,update:function(e){var t=e.gl;t.bindTexture(t.TEXTURE_CUBE_MAP,this._cache.get(`webgl_texture`)),this.updateCommon(e);var n=this.format,r=this.type;t.texParameteri(t.TEXTURE_CUBE_MAP,t.TEXTURE_WRAP_S,this.getAvailableWrapS()),t.texParameteri(t.TEXTURE_CUBE_MAP,t.TEXTURE_WRAP_T,this.getAvailableWrapT()),t.texParameteri(t.TEXTURE_CUBE_MAP,t.TEXTURE_MAG_FILTER,this.getAvailableMagFilter()),t.texParameteri(t.TEXTURE_CUBE_MAP,t.TEXTURE_MIN_FILTER,this.getAvailableMinFilter());var i=e.getGLExtension(`EXT_texture_filter_anisotropic`);if(i&&this.anisotropic>1&&t.texParameterf(t.TEXTURE_CUBE_MAP,i.TEXTURE_MAX_ANISOTROPY_EXT,this.anisotropic),r===36193&&(e.getGLExtension(`OES_texture_half_float`)||(r=H.FLOAT)),this.mipmaps.length)for(var a=this.width,o=this.height,s=0;s<this.mipmaps.length;s++){var c=this.mipmaps[s];this._updateTextureData(t,c,s,a,o,n,r),a/=2,o/=2}else this._updateTextureData(t,this,0,this.width,this.height,n,r),!this.NPOT&&this.useMipmap&&t.generateMipmap(t.TEXTURE_CUBE_MAP);t.bindTexture(t.TEXTURE_CUBE_MAP,null)},_updateTextureData:function(e,t,n,r,i,a,o){for(var s=0;s<6;s++){var c=mo[s],l=t.image&&t.image[c];l?e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+s,n,a,a,o,l):e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+s,n,a,r,i,0,a,o,t.pixels&&t.pixels[c])}},generateMipmap:function(e){var t=e.gl;this.useMipmap&&!this.NPOT&&(t.bindTexture(t.TEXTURE_CUBE_MAP,this._cache.get(`webgl_texture`)),t.generateMipmap(t.TEXTURE_CUBE_MAP))},bind:function(e){e.gl.bindTexture(e.gl.TEXTURE_CUBE_MAP,this.getWebGLTexture(e))},unbind:function(e){e.gl.bindTexture(e.gl.TEXTURE_CUBE_MAP,null)},isPowerOfTwo:function(){return this.image.px?po(this.image.px.width)&&po(this.image.px.height):po(this.width)&&po(this.height)},isRenderable:function(){return this.image.px?go(this.image.px)&&go(this.image.nx)&&go(this.image.py)&&go(this.image.ny)&&go(this.image.pz)&&go(this.image.nz):!!(this.width&&this.height)},load:function(e,t){var n=0,r=this;return Fr.each(e,function(e,i){var a=U.createImage();t&&(a.crossOrigin=t),a.onload=function(){n--,n===0&&(r.dirty(),r.trigger(`success`,r))},a.onerror=function(){n--},n++,a.src=e,r.image[i]=a}),this}});Object.defineProperty(ho.prototype,"width",{get:function(){return this.image&&this.image.px?this.image.px.width:this._width},set:function(e){this.image&&this.image.px?console.warn(`Texture from image can't set width`):(this._width!==e&&this.dirty(),this._width=e)}}),Object.defineProperty(ho.prototype,"height",{get:function(){return this.image&&this.image.px?this.image.px.height:this._height},set:function(e){this.image&&this.image.px?console.warn(`Texture from image can't set height`):(this._height!==e&&this.dirty(),this._height=e)}});function go(e){return e.width>0&&e.height>0}var _o=io.extend({fov:50,aspect:1,near:.1,far:2e3},{updateProjectionMatrix:function(){var e=this.fov/180*Math.PI;this.projectionMatrix.perspective(e,this.aspect,this.near,this.far)},decomposeProjectionMatrix:function(){var e=this.projectionMatrix.array,t=Math.atan(1/e[5])*2;this.fov=t/Math.PI*180,this.aspect=e[5]/e[0],this.near=e[14]/(e[10]-1),this.far=e[14]/(e[10]+1)},clone:function(){var e=io.prototype.clone.call(this);return e.fov=this.fov,e.aspect=this.aspect,e.near=this.near,e.far=this.far,e}}),vo=`framebuffer`,yo=`renderbuffer`,bo=yo+`_width`,xo=yo+`_height`,So=yo+`_attached`,Co=`depthtexture_attached`,wo=H.FRAMEBUFFER,To=H.RENDERBUFFER,Eo=H.DEPTH_ATTACHMENT,Do=H.COLOR_ATTACHMENT0,Oo=Ir.extend({depthBuffer:!0,viewport:null,_width:0,_height:0,_textures:null,_boundRenderer:null},function(){this._cache=new Ta,this._textures={}},{getTextureWidth:function(){return this._width},getTextureHeight:function(){return this._height},bind:function(e){if(e.__currentFrameBuffer){if(e.__currentFrameBuffer===this)return;console.warn(`Renderer already bound with another framebuffer. Unbind it first`)}e.__currentFrameBuffer=this;var t=e.gl;t.bindFramebuffer(wo,this._getFrameBufferGL(e)),this._boundRenderer=e;var n=this._cache;n.put(`viewport`,e.viewport);var r=!1,i,a;for(var o in this._textures){r=!0;var s=this._textures[o];s&&(i=s.texture.width,a=s.texture.height,this._doAttach(e,s.texture,o,s.target))}this._width=i,this._height=a,!r&&this.depthBuffer&&console.error(`Must attach texture before bind, or renderbuffer may have incorrect width and height.`),this.viewport?e.setViewport(this.viewport):e.setViewport(0,0,i,a,1);var c=n.get(`attached_textures`);if(c){for(var o in c)if(!this._textures[o]){var l=c[o];this._doDetach(t,o,l)}}if(!n.get(Co)&&this.depthBuffer){n.miss(yo)&&n.put(yo,t.createRenderbuffer());var u=n.get(yo);(i!==n.get(bo)||a!==n.get(xo))&&(t.bindRenderbuffer(To,u),t.renderbufferStorage(To,t.DEPTH_COMPONENT16,i,a),n.put(bo,i),n.put(xo,a),t.bindRenderbuffer(To,null)),n.get(So)||(t.framebufferRenderbuffer(wo,Eo,To,u),n.put(So,!0))}},unbind:function(e){e.__currentFrameBuffer=null,e.gl.bindFramebuffer(wo,null),this._boundRenderer=null,this._cache.use(e.__uid__);var t=this._cache.get(`viewport`);t&&e.setViewport(t),this.updateMipmap(e)},updateMipmap:function(e){var t=e.gl;for(var n in this._textures){var r=this._textures[n];if(r){var i=r.texture;if(!i.NPOT&&i.useMipmap&&i.minFilter===q.LINEAR_MIPMAP_LINEAR){var a=i.textureType===`textureCube`?H.TEXTURE_CUBE_MAP:H.TEXTURE_2D;t.bindTexture(a,i.getWebGLTexture(e)),t.generateMipmap(a),t.bindTexture(a,null)}}}},checkStatus:function(e){return e.checkFramebufferStatus(wo)},_getFrameBufferGL:function(e){var t=this._cache;return t.use(e.__uid__),t.miss(vo)&&t.put(vo,e.gl.createFramebuffer()),t.get(vo)},attach:function(e,t,n){if(!e.width)throw Error(`The texture attached to color buffer is not a valid.`);t||=Do,n||=H.TEXTURE_2D;var r=this._boundRenderer,i=r&&r.gl,a;if(i){var o=this._cache;o.use(r.__uid__),a=o.get(`attached_textures`)}var s=this._textures[t];if(!(s&&s.target===n&&s.texture===e&&a&&a[t]!=null)){var c=!0;r&&(c=this._doAttach(r,e,t,n),this.viewport||r.setViewport(0,0,e.width,e.height,1)),c&&(this._textures[t]=this._textures[t]||{},this._textures[t].texture=e,this._textures[t].target=n)}},_doAttach:function(e,t,n,r){var i=e.gl,a=t.getWebGLTexture(e),o=this._cache.get(`attached_textures`);if(o&&o[n]){var s=o[n];if(s.texture===t&&s.target===r)return}n=+n;var c=!0;if((n===Eo||n===H.DEPTH_STENCIL_ATTACHMENT)&&(e.getGLExtension(`WEBGL_depth_texture`)||(console.error(`Depth texture is not supported by the browser`),c=!1),t.format!==H.DEPTH_COMPONENT&&t.format!==H.DEPTH_STENCIL&&(console.error(`The texture attached to depth buffer is not a valid.`),c=!1),c)){var l=this._cache.get(yo);l&&(i.framebufferRenderbuffer(wo,Eo,To,null),i.deleteRenderbuffer(l),this._cache.put(yo,!1)),this._cache.put(So,!1),this._cache.put(Co,!0)}return i.framebufferTexture2D(wo,n,r,a,0),o||(o={},this._cache.put(`attached_textures`,o)),o[n]=o[n]||{},o[n].texture=t,o[n].target=r,c},_doDetach:function(e,t,n){e.framebufferTexture2D(wo,t,n,null,0);var r=this._cache.get(`attached_textures`);r&&r[t]&&(r[t]=null),(t===Eo||t===H.DEPTH_STENCIL_ATTACHMENT)&&this._cache.put(Co,!1)},detach:function(e,t){this._textures[e]=null,this._boundRenderer&&(this._cache.use(this._boundRenderer.__uid__),this._doDetach(this._boundRenderer.gl,e,t))},dispose:function(e){var t=e.gl,n=this._cache;n.use(e.__uid__);var r=n.get(yo);r&&t.deleteRenderbuffer(r);var i=n.get(vo);i&&t.deleteFramebuffer(i),n.deleteContext(e.__uid__),this._textures={}}});Oo.DEPTH_ATTACHMENT=Eo,Oo.COLOR_ATTACHMENT0=Do,Oo.STENCIL_ATTACHMENT=H.STENCIL_ATTACHMENT,Oo.DEPTH_STENCIL_ATTACHMENT=H.DEPTH_STENCIL_ATTACHMENT;var ko=[`px`,`nx`,`py`,`ny`,`pz`,`nz`],Ao=Ir.extend(function(){var e={position:new F,far:1e3,near:.1,texture:null,shadowMapPass:null},t=e._cameras={px:new _o({fov:90}),nx:new _o({fov:90}),py:new _o({fov:90}),ny:new _o({fov:90}),pz:new _o({fov:90}),nz:new _o({fov:90})};return t.px.lookAt(F.POSITIVE_X,F.NEGATIVE_Y),t.nx.lookAt(F.NEGATIVE_X,F.NEGATIVE_Y),t.py.lookAt(F.POSITIVE_Y,F.POSITIVE_Z),t.ny.lookAt(F.NEGATIVE_Y,F.NEGATIVE_Z),t.pz.lookAt(F.POSITIVE_Z,F.NEGATIVE_Y),t.nz.lookAt(F.NEGATIVE_Z,F.NEGATIVE_Y),e._frameBuffer=new Oo,e},{getCamera:function(e){return this._cameras[e]},render:function(e,t,n){var r=e.gl;n||t.update();for(var i=this.texture.width,a=2*Math.atan(i/(i-.5))/Math.PI*180,o=0;o<6;o++){var s=ko[o],c=this._cameras[s];if(F.copy(c.position,this.position),c.far=this.far,c.near=this.near,c.fov=a,this.shadowMapPass){c.update();var l=t.getBoundingBox();l.applyTransform(c.viewMatrix),t.viewBoundingBoxLastFrame.copy(l),this.shadowMapPass.render(e,t,c,!0)}this._frameBuffer.attach(this.texture,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+o),this._frameBuffer.bind(e),e.render(t,c,!0),this._frameBuffer.unbind(e)}},dispose:function(e){this._frameBuffer.dispose(e)}}),jo=Ba.extend({dynamic:!1,widthSegments:1,heightSegments:1},function(){this.build()},{build:function(){for(var e=this.heightSegments,t=this.widthSegments,n=this.attributes,r=[],i=[],a=[],o=[],s=0;s<=e;s++)for(var c=s/e,l=0;l<=t;l++){var u=l/t;if(r.push([2*u-1,2*c-1,0]),i&&i.push([u,c]),a&&a.push([0,0,1]),l<t&&s<e){var d=l+s*(t+1);o.push([d,d+1,d+t+1]),o.push([d+t+1,d+1,d+t+2])}}n.position.fromArray(r),n.texcoord0.fromArray(i),n.normal.fromArray(a),this.initIndicesFromArray(o),this.boundingBox=new Zr,this.boundingBox.min.set(-1,-1,0),this.boundingBox.max.set(1,1,0)}}),Mo=new V,No=Ba.extend({dynamic:!1,widthSegments:1,heightSegments:1,depthSegments:1,inside:!1},function(){this.build()},{build:function(){var e={px:Po(`px`,this.depthSegments,this.heightSegments),nx:Po(`nx`,this.depthSegments,this.heightSegments),py:Po(`py`,this.widthSegments,this.depthSegments),ny:Po(`ny`,this.widthSegments,this.depthSegments),pz:Po(`pz`,this.widthSegments,this.heightSegments),nz:Po(`nz`,this.widthSegments,this.heightSegments)},t=[`position`,`texcoord0`,`normal`],n=0,r=0;for(var i in e)n+=e[i].vertexCount,r+=e[i].indices.length;for(var a=0;a<t.length;a++)this.attributes[t[a]].init(n);this.indices=new U.Uint16Array(r);var o=0,s=0;for(var i in e){for(var c=e[i],a=0;a<t.length;a++)for(var l=t[a],u=c.attributes[l].value,d=c.attributes[l].size,f=l===`normal`,p=0;p<u.length;p++){var m=u[p];this.inside&&f&&(m=-m),this.attributes[l].value[p+d*s]=m}for(var h=c.indices.length,p=0;p<c.indices.length;p++)this.indices[p+o]=s+c.indices[this.inside?h-p-1:p];o+=c.indices.length,s+=c.vertexCount}this.boundingBox=new Zr,this.boundingBox.max.set(1,1,1),this.boundingBox.min.set(-1,-1,-1)}});function Po(e,t,n){Mo.identity();var r=new jo({widthSegments:t,heightSegments:n});switch(e){case`px`:V.translate(Mo,Mo,F.POSITIVE_X),V.rotateY(Mo,Mo,Math.PI/2);break;case`nx`:V.translate(Mo,Mo,F.NEGATIVE_X),V.rotateY(Mo,Mo,-Math.PI/2);break;case`py`:V.translate(Mo,Mo,F.POSITIVE_Y),V.rotateX(Mo,Mo,-Math.PI/2);break;case`ny`:V.translate(Mo,Mo,F.NEGATIVE_Y),V.rotateX(Mo,Mo,Math.PI/2);break;case`pz`:V.translate(Mo,Mo,F.POSITIVE_Z);break;case`nz`:V.translate(Mo,Mo,F.NEGATIVE_Z),V.rotateY(Mo,Mo,Math.PI);break}return r.applyTransform(Mo),r}K.import(`@export clay.skybox.vertex
#define SHADER_NAME skybox
uniform mat4 world : WORLD;
uniform mat4 worldViewProjection : WORLDVIEWPROJECTION;
attribute vec3 position : POSITION;
varying vec3 v_WorldPosition;
void main()
{
 v_WorldPosition = (world * vec4(position, 1.0)).xyz;
 gl_Position = worldViewProjection * vec4(position, 1.0);
}
@end
@export clay.skybox.fragment
#define PI 3.1415926
uniform mat4 viewInverse : VIEWINVERSE;
#ifdef EQUIRECTANGULAR
uniform sampler2D environmentMap;
#else
uniform samplerCube environmentMap;
#endif
uniform float lod: 0.0;
varying vec3 v_WorldPosition;
@import clay.util.rgbm
@import clay.util.srgb
@import clay.util.ACES
void main()
{
 vec3 eyePos = viewInverse[3].xyz;
 vec3 V = normalize(v_WorldPosition - eyePos);
#ifdef EQUIRECTANGULAR
 float phi = acos(V.y);
 float theta = atan(-V.x, V.z) + PI * 0.5;
 vec2 uv = vec2(theta / 2.0 / PI, phi / PI);
 vec4 texel = decodeHDR(texture2D(environmentMap, fract(uv)));
#else
 #if defined(LOD) || defined(SUPPORT_TEXTURE_LOD)
 vec4 texel = decodeHDR(textureCubeLodEXT(environmentMap, V, lod));
 #else
 vec4 texel = decodeHDR(textureCube(environmentMap, V));
 #endif
#endif
#ifdef SRGB_DECODE
 texel = sRGBToLinear(texel);
#endif
#ifdef TONEMAPPING
 texel.rgb = ACESToneMapping(texel.rgb);
#endif
#ifdef SRGB_ENCODE
 texel = linearTosRGB(texel);
#endif
 gl_FragColor = encodeHDR(vec4(texel.rgb, 1.0));
}
@end`);var Fo=ti.extend(function(){var e=new ji({shader:new K({vertex:K.source(`clay.skybox.vertex`),fragment:K.source(`clay.skybox.fragment`)}),depthMask:!1});return{scene:null,geometry:new No,material:e,environmentMap:null,culling:!1,_dummyCamera:new _o}},function(){var e=this.scene;e&&this.attachScene(e),this.environmentMap&&this.setEnvironmentMap(this.environmentMap)},{attachScene:function(e){this.scene&&this.detachScene(),e.skybox=this,this.scene=e,e.on(`beforerender`,this._beforeRenderScene,this)},detachScene:function(){this.scene&&(this.scene.off(`beforerender`,this._beforeRenderScene),this.scene.skybox=null),this.scene=null},dispose:function(e){this.detachScene(),this.geometry.dispose(e)},setEnvironmentMap:function(e){e.textureType===`texture2D`?(this.material.define(`EQUIRECTANGULAR`),e.minFilter=q.LINEAR):this.material.undefine(`EQUIRECTANGULAR`),this.material.set(`environmentMap`,e)},getEnvironmentMap:function(){return this.material.get(`environmentMap`)},_beforeRenderScene:function(e,t,n){this.renderSkybox(e,n)},renderSkybox:function(e,t){var n=this._dummyCamera;n.aspect=e.getViewportAspect(),n.fov=t.fov||50,n.updateProjectionMatrix(),V.invert(n.invProjectionMatrix,n.projectionMatrix),n.worldTransform.copy(t.worldTransform),n.viewMatrix.copy(t.viewMatrix),this.position.copy(t.getWorldPosition()),this.update(),e.gl.disable(e.gl.BLEND),this.material.get(`lod`)>0?this.material.define(`fragment`,`LOD`):this.material.undefine(`fragment`,`LOD`),e.renderPass([this],n)}}),Io=Fo,Lo=542327876,Ro=131072,zo=512,Bo=4;function Vo(e){return e.charCodeAt(0)+(e.charCodeAt(1)<<8)+(e.charCodeAt(2)<<16)+(e.charCodeAt(3)<<24)}var Ho=31,Uo=Vo(`DXT1`),Wo=Vo(`DXT3`),Go=Vo(`DXT5`),Ko=0,qo=1,Jo=2,Yo=3,Xo=4,Zo=7,Qo=20,$o=21,es=28,ts={parse:function(e,t){var n=new Int32Array(e,0,Ho);if(n[Ko]!==Lo||!n(Qo)&Bo)return null;var r=n($o),i=n[Xo],a=n[Yo],o=n[es]&zo,s=n[Jo]&Ro,c,l;switch(r){case Uo:c=8,l=q.COMPRESSED_RGB_S3TC_DXT1_EXT;break;case Wo:c=16,l=q.COMPRESSED_RGBA_S3TC_DXT3_EXT;break;case Go:c=16,l=q.COMPRESSED_RGBA_S3TC_DXT5_EXT;break;default:return null}var u=n[qo]+4,d=o?6:1,f=1;s&&(f=Math.max(1,n[Zo]));for(var p=[],m=0;m<d;m++){var h=i,g=a;p[m]=new J({width:h,height:g,format:l});for(var _=[],v=0;v<f;v++){var y=Math.max(4,h)/4*Math.max(4,g)/4*c,b=new Uint8Array(e,u,y);u+=y,h*=.5,g*=.5,_[v]=b}p[m].pixels=_[0],s&&(p[m].mipmaps=_)}if(t)t.width=p[0].width,t.height=p[0].height,t.format=p[0].format,t.pixels=p[0].pixels,t.mipmaps=p[0].mipmaps;else return p[0]}},ns=String.fromCharCode,rs=8,is=32767;function as(e,t,n,r){if(e[3]>0){var i=2**(e[3]-128-8+r);t[n+0]=e[0]*i,t[n+1]=e[1]*i,t[n+2]=e[2]*i}else t[n+0]=0,t[n+1]=0,t[n+2]=0;return t[n+3]=1,t}function os(e,t,n){for(var r=``,i=t;i<n;i++)r+=ns(e[i]);return r}function ss(e,t){t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3]}function cs(e,t,n,r){for(var i=0,a=0,o=r;o>0;)if(e[a][0]=t[n++],e[a][1]=t[n++],e[a][2]=t[n++],e[a][3]=t[n++],e[a][0]===1&&e[a][1]===1&&e[a][2]===1){for(var s=e[a][3]<<i>>>0;s>0;s--)ss(e[a-1],e[a]),a++,o--;i+=8}else a++,o--,i=0;return n}function ls(e,t,n,r){if(r<rs|r>is)return cs(e,t,n,r);var i=t[n++];if(i!=2)return cs(e,t,n-1,r);if(e[0][1]=t[n++],e[0][2]=t[n++],i=t[n++],(e[0][2]<<8>>>0|i)>>>0!==r)return null;for(var i=0;i<4;i++)for(var a=0;a<r;){var o=t[n++];if(o>128){o=(o&127)>>>0;for(var s=t[n++];o--;)e[a++][i]=s}else for(;o--;)e[a++][i]=t[n++]}return n}var us={parseRGBE:function(e,t,n){n??=0;var r=new Uint8Array(e),i=r.length;if(os(r,0,2)===`#?`){for(var a=2;a<i&&!(ns(r[a])===`
`&&ns(r[a+1])===`
`);a++);if(!(a>=i)){a+=2;for(var o=``;a<i;a++){var s=ns(r[a]);if(s===`
`)break;o+=s}var c=o.split(` `),l=parseInt(c[1]),u=parseInt(c[3]);if(!(!u||!l)){for(var d=a+1,f=[],p=0;p<u;p++){f[p]=[];for(var m=0;m<4;m++)f[p][m]=0}for(var h=new Float32Array(u*l*4),g=0,_=0;_<l;_++){var d=ls(f,r,d,u);if(!d)return null;for(var p=0;p<u;p++)as(f[p],h,g,n),g+=4}return t||=new J,t.width=u,t.height=l,t.pixels=h,t.type=q.FLOAT,t}}}},parseRGBEFromPNG:function(e){}},ds={loadTexture:function(e,t,n,r){var i;if(typeof t==`function`?(n=t,r=n,t={}):t||={},typeof e==`string`){if(e.match(/.hdr$/)||t.fileType===`hdr`)return i=new J({width:0,height:0,sRGB:!1}),ds._fetchTexture(e,function(e){us.parseRGBE(e,i,t.exposure),i.dirty(),n&&n(i)},r),i;e.match(/.dds$/)||t.fileType===`dds`?(i=new J({width:0,height:0}),ds._fetchTexture(e,function(e){ts.parse(e,i),i.dirty(),n&&n(i)},r)):(i=new J,i.load(e),i.success(n),i.error(r))}else typeof e==`object`&&e.px!==void 0&&(i=new ho,i.load(e),i.success(n),i.error(r));return i},loadPanorama:function(e,t,n,r,i,a){var o=this;typeof r==`function`?(i=r,a=i,r={}):r||={},ds.loadTexture(t,r,function(t){t.flipY=r.flipY||!1,o.panoramaToCubeMap(e,t,n,r),t.dispose(e),i&&i(n)},a)},panoramaToCubeMap:function(e,t,n,r){var i=new Ao,a=new Io({scene:new uo});return a.setEnvironmentMap(t),r||={},r.encodeRGBM&&a.material.define(`fragment`,`RGBM_ENCODE`),n.sRGB=t.sRGB,i.texture=n,i.render(e,a.scene),i.texture=null,i.dispose(e),n},heightToNormal:function(e,t){var n=document.createElement(`canvas`),r=n.width=e.width,i=n.height=e.height,a=n.getContext(`2d`);a.drawImage(e,0,0,r,i),t||=!1;for(var o=a.getImageData(0,0,r,i),s=a.createImageData(r,i),c=0;c<o.data.length;c+=4){if(t){var l=o.data[c],u=o.data[c+1],d=o.data[c+2];if(Math.abs(l-u)+Math.abs(u-d)>20)return console.warn(`Given image is not a height map`),e}var f,p,m,h;c%(r*4)==0?(f=o.data[c],m=o.data[c+4]):c%(r*4)==(r-1)*4?(f=o.data[c-4],m=o.data[c]):(f=o.data[c-4],m=o.data[c+4]),c<r*4?(p=o.data[c],h=o.data[c+r*4]):c>r*(i-1)*4?(p=o.data[c-r*4],h=o.data[c]):(p=o.data[c-r*4],h=o.data[c+r*4]),s.data[c]=f-m+127,s.data[c+1]=p-h+127,s.data[c+2]=255,s.data[c+3]=255}return a.putImageData(s,0,0),n},isHeightImage:function(e,t,n){if(!e||!e.width||!e.height)return!1;var r=document.createElement(`canvas`),i=r.getContext(`2d`),a=t||32;n||=20,r.width=r.height=a,i.drawImage(e,0,0,a,a);for(var o=i.getImageData(0,0,a,a),s=0;s<o.data.length;s+=4){var c=o.data[s],l=o.data[s+1],u=o.data[s+2];if(Math.abs(c-l)+Math.abs(l-u)>n)return!1}return!0},_fetchTexture:function(e,t,n){U.request.get({url:e,responseType:`arraybuffer`,onload:t,onerror:n})},createChessboard:function(e,t,n,r){e||=512,t||=64,n||=`black`,r||=`white`;var i=Math.ceil(e/t),a=document.createElement(`canvas`);a.width=e,a.height=e;var o=a.getContext(`2d`);o.fillStyle=r,o.fillRect(0,0,e,e),o.fillStyle=n;for(var s=0;s<i;s++)for(var c=0;c<i;c++)(c%2?s%2:s%2-1)&&o.fillRect(s*t,c*t,t,t);return new J({image:a,anisotropic:8})},createBlank:function(e){var t=document.createElement(`canvas`);t.width=1,t.height=1;var n=t.getContext(`2d`);return n.fillStyle=e,n.fillRect(0,0,1,1),new J({image:t})}};function fs(e,t){if(!e.__ECGLOnRefresh){e.__ECGLOnRefresh=!0;var n=e._refresh?`_refresh`:`refreshImmediately`,r=e[n];e[n]=function(){r.apply(this,arguments),t()}}}var ps=[`mousedown`,`mouseup`,`mousemove`,`mouseover`,`mouseout`,`click`,`dblclick`,`contextmenu`];function ms(e){return`_on`+e}var hs=function(e){var t=this;this._texture=new J({anisotropic:32,flipY:!1,surface:this,dispose:function(e){t.dispose(),J.prototype.dispose.call(this,e)}}),ps.forEach(function(e){this[ms(e)]=function(t){t.triangle&&this._meshes.forEach(function(n){this.dispatchEvent(e,n,t.triangle,t.point)},this)}},this),this._meshes=[],e&&this.setECharts(e),this.onupdate=null};hs.prototype={constructor:hs,getTexture:function(){return this._texture},setECharts:function(e){this._chart=e;var t=e.getDom();if(!(t instanceof HTMLCanvasElement))console.error(`ECharts must init on canvas if it is used as texture.`),t=document.createElement(`canvas`);else{var n=this;fs(e.getZr(),function(){n._texture.dirty(),n.onupdate&&n.onupdate()})}this._texture.image=t,this._texture.dirty(),this.onupdate&&this.onupdate()},dispatchEvent:function(){var e=new F,t=new F,n=new F,r=new G,i=new G,a=new G,o=new G,s=new F;return function(c,l,u,d){var f=l.geometry,p=f.attributes.position,m=f.attributes.texcoord0,h=F.dot,g=F.cross;p.get(u[0],e.array),p.get(u[1],t.array),p.get(u[2],n.array),m.get(u[0],r.array),m.get(u[1],i.array),m.get(u[2],a.array),g(s,t,n);var _=h(e,s),v=h(d,s)/_;g(s,n,e);var y=h(d,s)/_;g(s,e,t);var b=h(d,s)/_;G.scale(o,r,v),G.scaleAndAdd(o,o,i,y),G.scaleAndAdd(o,o,a,b);var x=o.x*this._chart.getWidth(),S=o.y*this._chart.getHeight();this._chart.getZr().handler.dispatch(c,{zrX:x,zrY:S})}}(),attachToMesh:function(e){this._meshes.indexOf(e)>=0||(ps.forEach(function(t){e.on(t,this[ms(t)],this)},this),this._meshes.push(e))},detachFromMesh:function(e){var t=this._meshes.indexOf(e);t>=0&&this._meshes.splice(t,1),ps.forEach(function(t){e.off(t,this[ms(t)])},this)},dispose:function(){this._meshes.forEach(function(e){this.detachFromMesh(e)},this)}};var gs=io.extend({left:-1,right:1,near:-1,far:1,top:1,bottom:-1},{updateProjectionMatrix:function(){this.projectionMatrix.ortho(this.left,this.right,this.bottom,this.top,this.near,this.far)},decomposeProjectionMatrix:function(){var e=this.projectionMatrix.array;this.left=(-1-e[12])/e[0],this.right=(1-e[12])/e[0],this.top=(1-e[13])/e[5],this.bottom=(-1-e[13])/e[5],this.near=-(-1-e[14])/e[10],this.far=-(1-e[14])/e[10]},clone:function(){var e=io.prototype.clone.call(this);return e.left=this.left,e.right=this.right,e.near=this.near,e.far=this.far,e.top=this.top,e.bottom=this.bottom,e}});K.import(`
@export clay.compositor.vertex
uniform mat4 worldViewProjection : WORLDVIEWPROJECTION;
attribute vec3 position : POSITION;
attribute vec2 texcoord : TEXCOORD_0;
varying vec2 v_Texcoord;
void main()
{
 v_Texcoord = texcoord;
 gl_Position = worldViewProjection * vec4(position, 1.0);
}
@end`);var _s=new ti({geometry:new jo,frustumCulling:!1}),vs=new gs,ys=Ir.extend(function(){return{fragment:``,outputs:null,material:null,blendWithPrevious:!1,clearColor:!1,clearDepth:!0}},function(){var e=new ji({shader:new K(K.source(`clay.compositor.vertex`),this.fragment)});e.enableTexturesAll(),this.material=e},{setUniform:function(e,t){this.material.setUniform(e,t)},getUniform:function(e){var t=this.material.uniforms[e];if(t)return t.value},attachOutput:function(e,t){this.outputs||={},t||=H.COLOR_ATTACHMENT0,this.outputs[t]=e},detachOutput:function(e){for(var t in this.outputs)this.outputs[t]===e&&(this.outputs[t]=null)},bind:function(e,t){if(this.outputs)for(var n in this.outputs){var r=this.outputs[n];r&&t.attach(r,n)}t&&t.bind(e)},unbind:function(e,t){t.unbind(e)},render:function(e,t){var n=e.gl;if(t){this.bind(e,t);var r=e.getGLExtension(`EXT_draw_buffers`);if(r&&this.outputs){var i=[];for(var a in this.outputs)a=+a,a>=n.COLOR_ATTACHMENT0&&a<=n.COLOR_ATTACHMENT0+8&&i.push(a);r.drawBuffersEXT(i)}}this.trigger(`beforerender`,this,e);var o=this.clearDepth?n.DEPTH_BUFFER_BIT:0;if(n.depthMask(!0),this.clearColor){o|=n.COLOR_BUFFER_BIT,n.colorMask(!0,!0,!0,!0);var s=this.clearColor;Array.isArray(s)&&n.clearColor(s[0],s[1],s[2],s[3])}n.clear(o),this.blendWithPrevious?(n.enable(n.BLEND),this.material.transparent=!0):(n.disable(n.BLEND),this.material.transparent=!1),this.renderQuad(e),this.trigger(`afterrender`,this,e),t&&this.unbind(e,t)},renderQuad:function(e){_s.material=this.material,e.renderPass([_s],vs)},dispose:function(e){}}),bs=`#define SAMPLE_NUMBER 1024
#define PI 3.14159265358979
uniform sampler2D normalDistribution;
uniform vec2 viewportSize : [512, 256];
const vec3 N = vec3(0.0, 0.0, 1.0);
const float fSampleNumber = float(SAMPLE_NUMBER);
vec3 importanceSampleNormal(float i, float roughness, vec3 N) {
 vec3 H = texture2D(normalDistribution, vec2(roughness, i)).rgb;
 vec3 upVector = abs(N.y) > 0.999 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
 vec3 tangentX = normalize(cross(N, upVector));
 vec3 tangentZ = cross(N, tangentX);
 return normalize(tangentX * H.x + N * H.y + tangentZ * H.z);
}
float G_Smith(float roughness, float NoV, float NoL) {
 float k = roughness * roughness / 2.0;
 float G1V = NoV / (NoV * (1.0 - k) + k);
 float G1L = NoL / (NoL * (1.0 - k) + k);
 return G1L * G1V;
}
void main() {
 vec2 uv = gl_FragCoord.xy / viewportSize;
 float NoV = uv.x;
 float roughness = uv.y;
 vec3 V;
 V.x = sqrt(1.0 - NoV * NoV);
 V.y = 0.0;
 V.z = NoV;
 float A = 0.0;
 float B = 0.0;
 for (int i = 0; i < SAMPLE_NUMBER; i++) {
 vec3 H = importanceSampleNormal(float(i) / fSampleNumber, roughness, N);
 vec3 L = reflect(-V, H);
 float NoL = clamp(L.z, 0.0, 1.0);
 float NoH = clamp(H.z, 0.0, 1.0);
 float VoH = clamp(dot(V, H), 0.0, 1.0);
 if (NoL > 0.0) {
 float G = G_Smith(roughness, NoV, NoL);
 float G_Vis = G * VoH / (NoH * NoV);
 float Fc = pow(1.0 - VoH, 5.0);
 A += (1.0 - Fc) * G_Vis;
 B += Fc * G_Vis;
 }
 }
 gl_FragColor = vec4(vec2(A, B) / fSampleNumber, 0.0, 1.0);
}
`,xs=`#define SHADER_NAME prefilter
#define SAMPLE_NUMBER 1024
#define PI 3.14159265358979
uniform mat4 viewInverse : VIEWINVERSE;
uniform samplerCube environmentMap;
uniform sampler2D normalDistribution;
uniform float roughness : 0.5;
varying vec2 v_Texcoord;
varying vec3 v_WorldPosition;
@import clay.util.rgbm
vec3 importanceSampleNormal(float i, float roughness, vec3 N) {
 vec3 H = texture2D(normalDistribution, vec2(roughness, i)).rgb;
 vec3 upVector = abs(N.y) > 0.999 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
 vec3 tangentX = normalize(cross(N, upVector));
 vec3 tangentZ = cross(N, tangentX);
 return normalize(tangentX * H.x + N * H.y + tangentZ * H.z);
}
void main() {
 vec3 eyePos = viewInverse[3].xyz;
 vec3 V = normalize(v_WorldPosition - eyePos);
 vec3 N = V;
 vec3 prefilteredColor = vec3(0.0);
 float totalWeight = 0.0;
 float fMaxSampleNumber = float(SAMPLE_NUMBER);
 for (int i = 0; i < SAMPLE_NUMBER; i++) {
 vec3 H = importanceSampleNormal(float(i) / fMaxSampleNumber, roughness, N);
 vec3 L = reflect(-V, H);
 float NoL = clamp(dot(N, L), 0.0, 1.0);
 if (NoL > 0.0) {
 prefilteredColor += decodeHDR(textureCube(environmentMap, L)).rgb * NoL;
 totalWeight += NoL;
 }
 }
 gl_FragColor = encodeHDR(vec4(prefilteredColor / totalWeight, 1.0));
}
`,Ss={},Cs=[`px`,`nx`,`py`,`ny`,`pz`,`nz`];Ss.prefilterEnvironmentMap=function(e,t,n,r,i){(!i||!r)&&(r=Ss.generateNormalDistribution(),i=Ss.integrateBRDF(e,r)),n||={};var a=n.width||64,o=n.height||64,s=n.type||t.type,c=new ho({width:a,height:o,type:s,flipY:!1,mipmaps:[]});c.isPowerOfTwo()||console.warn(`Width and height must be power of two to enable mipmap.`);var l=Math.log(Math.min(a,o))/Math.log(2)+1,u=new ji({shader:new K({vertex:K.source(`clay.skybox.vertex`),fragment:xs})});u.set(`normalDistribution`,r),n.encodeRGBM&&u.define(`fragment`,`RGBM_ENCODE`),n.decodeRGBM&&u.define(`fragment`,`RGBM_DECODE`);var d=new uo,f;if(t.textureType===`texture2D`){var p=new ho({width:a,height:o,type:s===q.FLOAT?q.HALF_FLOAT:s});ds.panoramaToCubeMap(e,t,p,{encodeRGBM:n.decodeRGBM}),t=p}f=new Fo({scene:d,material:u}),f.material.set(`environmentMap`,t);var m=new Ao({texture:c});n.encodeRGBM&&(s=c.type=q.UNSIGNED_BYTE);for(var h=new J({width:a,height:o,type:s}),g=new Oo({depthBuffer:!1}),_=U[s===q.UNSIGNED_BYTE?`Uint8Array`:`Float32Array`],v=0;v<l;v++){c.mipmaps[v]={pixels:{}},f.material.set(`roughness`,v/(l-1));for(var y=h.width,b=2*Math.atan(y/(y-.5))/Math.PI*180,x=0;x<Cs.length;x++){var S=new _(h.width*h.height*4);g.attach(h),g.bind(e);var C=m.getCamera(Cs[x]);C.fov=b,e.render(d,C),e.gl.readPixels(0,0,h.width,h.height,q.RGBA,s,S),g.unbind(e),c.mipmaps[v].pixels[Cs[x]]=S}h.width/=2,h.height/=2,h.dirty()}return g.dispose(e),h.dispose(e),f.dispose(e),r.dispose(e),{environmentMap:c,brdfLookup:i,normalDistribution:r,maxMipmapLevel:l}},Ss.integrateBRDF=function(e,t){t||=Ss.generateNormalDistribution();var n=new Oo({depthBuffer:!1}),r=new ys({fragment:bs}),i=new J({width:512,height:256,type:q.HALF_FLOAT,wrapS:q.CLAMP_TO_EDGE,wrapT:q.CLAMP_TO_EDGE,minFilter:q.NEAREST,magFilter:q.NEAREST,useMipmap:!1});return r.setUniform(`normalDistribution`,t),r.setUniform(`viewportSize`,[512,256]),r.attachOutput(i),r.render(e,n),n.dispose(e),i},Ss.generateNormalDistribution=function(e,t){for(var e=e||256,t=t||1024,n=new J({width:e,height:t,type:q.FLOAT,minFilter:q.NEAREST,magFilter:q.NEAREST,wrapS:q.CLAMP_TO_EDGE,wrapT:q.CLAMP_TO_EDGE,useMipmap:!1}),r=new Float32Array(t*e*4),i=[],a=0;a<e;a++){for(var o=a/e,s=o*o,c=0;c<t;c++){var l=(c<<16|c>>>16)>>>0;l=((l&1431655765)<<1|(l&2863311530)>>>1)>>>0,l=((l&858993459)<<2|(l&3435973836)>>>2)>>>0,l=((l&252645135)<<4|(l&4042322160)>>>4)>>>0,l=(((l&16711935)<<8|(l&4278255360)>>>8)>>>0)/4294967296;var u=Math.sqrt((1-l)/(1+(s*s-1)*l));i[c]=u}for(var c=0;c<t;c++){var d=(c*e+a)*4,u=i[c],f=Math.sqrt(1-u*u),p=c/t,m=2*Math.PI*p;r[d]=f*Math.cos(m),r[d+1]=u,r[d+2]=f*Math.sin(m),r[d+3]=1}}return n.pixels=r,n};var ws=Ja.extend({cubemap:null,castShadow:!1,_normalDistribution:null,_brdfLookup:null},{type:`AMBIENT_CUBEMAP_LIGHT`,prefilter:function(e,t){if(!e.getGLExtension(`EXT_shader_texture_lod`)){console.warn(`Device not support textureCubeLodEXT`);return}this._brdfLookup||=(this._normalDistribution=Ss.generateNormalDistribution(),Ss.integrateBRDF(e,this._normalDistribution));var n=this.cubemap;if(!n.__prefiltered){var r=Ss.prefilterEnvironmentMap(e,n,{encodeRGBM:!0,width:t,height:t},this._normalDistribution,this._brdfLookup);this.cubemap=r.environmentMap,this.cubemap.__prefiltered=!0,n.dispose(e)}},getBRDFLookup:function(){return this._brdfLookup},uniformTemplates:{ambientCubemapLightColor:{type:`3f`,value:function(e){var t=e.color,n=e.intensity;return[t[0]*n,t[1]*n,t[2]*n]}},ambientCubemapLightCubemap:{type:`t`,value:function(e){return e.cubemap}},ambientCubemapLightBRDFLookup:{type:`t`,value:function(e){return e._brdfLookup}}}}),Ts=Ja.extend({castShadow:!1,coefficients:[]},function(){this._coefficientsTmpArr=new U.Float32Array(27)},{type:`AMBIENT_SH_LIGHT`,uniformTemplates:{ambientSHLightColor:{type:`3f`,value:function(e){var t=e.color,n=e.intensity;return[t[0]*n,t[1]*n,t[2]*n]}},ambientSHLightCoefficients:{type:`3f`,value:function(e){for(var t=e._coefficientsTmpArr,n=0;n<e.coefficients.length;n++)t[n]=e.coefficients[n];return t}}}}),Es={},Ds=[`px`,`nx`,`py`,`ny`,`pz`,`nz`];function Os(e,t){var n=e[0],r=e[1],i=e[2];return t===0?1:t===1?n:t===2?r:t===3?i:t===4?n*i:t===5?r*i:t===6?n*r:t===7?3*i*i-1:n*n-r*r}var ks={px:[2,1,0,-1,-1,1],nx:[2,1,0,1,-1,-1],py:[0,2,1,1,-1,-1],ny:[0,2,1,1,1,1],pz:[0,1,2,-1,-1,-1],nz:[0,1,2,1,-1,1]};function As(e,t,n,r){for(var i=new U.Float32Array(27),a=P.create(),o=P.create(),s=P.create(),c=0;c<9;c++){for(var l=P.create(),u=0;u<Ds.length;u++){for(var d=t[Ds[u]],f=P.create(),p=0,m=0,h=ks[Ds[u]],g=0;g<r;g++)for(var _=0;_<n;_++){a[0]=_/(n-1)*2-1,a[1]=g/(r-1)*2-1,a[2]=-1,P.normalize(a,a),s[0]=a[h[0]]*h[3],s[1]=a[h[1]]*h[4],s[2]=a[h[2]]*h[5],o[0]=d[m++]/255,o[1]=d[m++]/255,o[2]=d[m++]/255;var v=d[m++]/255*8.12;o[0]*=v,o[1]*=v,o[2]*=v,P.scaleAndAdd(f,f,o,Os(s,c)*-a[2]),p+=-a[2]}P.scaleAndAdd(l,l,f,1/p)}i[c*3]=l[0]/6,i[c*3+1]=l[1]/6,i[c*3+2]=l[2]/6}return i}Es.projectEnvironmentMap=function(e,t,n){n||={},n.lod=n.lod||0;var r,i=new uo,a=64;t.textureType===`texture2D`?r=new Io({scene:i,environmentMap:t}):(a=t.image&&t.image.px?t.image.px.width:t.width,r=new Fo({scene:i,environmentMap:t}));var o=Math.ceil(a/2**n.lod),s=Math.ceil(a/2**n.lod),c=new J({width:o,height:s}),l=new Oo;r.material.define(`fragment`,`RGBM_ENCODE`),n.decodeRGBM&&r.material.define(`fragment`,`RGBM_DECODE`),r.material.set(`lod`,n.lod);for(var u=new Ao({texture:c}),d={},f=0;f<Ds.length;f++){d[Ds[f]]=new Uint8Array(o*s*4);var p=u.getCamera(Ds[f]);p.fov=90,l.attach(c),l.bind(e),e.render(i,p),e.gl.readPixels(0,0,o,s,q.RGBA,q.UNSIGNED_BYTE,d[Ds[f]]),l.unbind(e)}return r.dispose(e),l.dispose(e),c.dispose(e),As(e,d,o,s)};var js={firstNotNull:function(){for(var e=0,t=arguments.length;e<t;e++)if(arguments[e]!=null)return arguments[e]},queryDataIndex:function(e,t){if(t.dataIndexInside!=null)return t.dataIndexInside;if(t.dataIndex!=null)return on(t.dataIndex)?Tt(t.dataIndex,function(t){return e.indexOfRawIndex(t)}):e.indexOfRawIndex(t.dataIndex);if(t.name!=null)return on(t.name)?Tt(t.name,function(t){return e.indexOfName(t)}):e.indexOfName(t.name)}},Ms=Ba.extend({dynamic:!1,widthSegments:40,heightSegments:20,phiStart:0,phiLength:Math.PI*2,thetaStart:0,thetaLength:Math.PI,radius:1},function(){this.build()},{build:function(){var e=this.heightSegments,t=this.widthSegments,n=this.attributes.position,r=this.attributes.texcoord0,i=this.attributes.normal,a=(t+1)*(e+1);n.init(a),r.init(a),i.init(a);var o=a>65535?Uint32Array:Uint16Array,s=this.indices=new o(t*e*6),c,l,u,d,f,p,m,h=this.radius,g=this.phiStart,_=this.phiLength,v=this.thetaStart,y=this.thetaLength,h=this.radius,b=[],x=[],S=0,C=1/h;for(m=0;m<=e;m++)for(p=0;p<=t;p++)d=p/t,f=m/e,c=-h*Math.cos(g+d*_)*Math.sin(v+f*y),l=h*Math.cos(v+f*y),u=h*Math.sin(g+d*_)*Math.sin(v+f*y),b[0]=c,b[1]=l,b[2]=u,x[0]=d,x[1]=f,n.set(S,b),r.set(S,x),b[0]*=C,b[1]*=C,b[2]*=C,i.set(S,b),S++;var w,T,E,D,O=t+1,k=0;for(m=0;m<e;m++)for(p=0;p<t;p++)T=m*O+p,w=m*O+p+1,D=(m+1)*O+p+1,E=(m+1)*O+p,s[k++]=w,s[k++]=T,s[k++]=D,s[k++]=T,s[k++]=E,s[k++]=D;this.boundingBox=new Zr,this.boundingBox.max.set(h,h,h),this.boundingBox.min.set(-h,-h,-h)}}),Ns=Ja.extend({castShadow:!1},{type:`AMBIENT_LIGHT`,uniformTemplates:{ambientLightColor:{type:`3f`,value:function(e){var t=e.color,n=e.intensity;return[t[0]*n,t[1]*n,t[2]*n]}}}}),Ps=Ja.extend({shadowBias:.001,shadowSlopeScale:2,shadowCascade:1,cascadeSplitLogFactor:.2},{type:`DIRECTIONAL_LIGHT`,uniformTemplates:{directionalLightDirection:{type:`3f`,value:function(e){return e.__dir=e.__dir||new F,e.__dir.copy(e.worldTransform.z).normalize().negate().array}},directionalLightColor:{type:`3f`,value:function(e){var t=e.color,n=e.intensity;return[t[0]*n,t[1]*n,t[2]*n]}}},clone:function(){var e=Ja.prototype.clone.call(this);return e.shadowBias=this.shadowBias,e.shadowSlopeScale=this.shadowSlopeScale,e}}),Fs=Ja.extend({range:100,castShadow:!1},{type:`POINT_LIGHT`,uniformTemplates:{pointLightPosition:{type:`3f`,value:function(e){return e.getWorldPosition().array}},pointLightRange:{type:`1f`,value:function(e){return e.range}},pointLightColor:{type:`3f`,value:function(e){var t=e.color,n=e.intensity;return[t[0]*n,t[1]*n,t[2]*n]}}},clone:function(){var e=Ja.prototype.clone.call(this);return e.range=this.range,e}}),Is=Ja.extend({range:20,umbraAngle:30,penumbraAngle:45,falloffFactor:2,shadowBias:.001,shadowSlopeScale:2},{type:`SPOT_LIGHT`,uniformTemplates:{spotLightPosition:{type:`3f`,value:function(e){return e.getWorldPosition().array}},spotLightRange:{type:`1f`,value:function(e){return e.range}},spotLightUmbraAngleCosine:{type:`1f`,value:function(e){return Math.cos(e.umbraAngle*Math.PI/180)}},spotLightPenumbraAngleCosine:{type:`1f`,value:function(e){return Math.cos(e.penumbraAngle*Math.PI/180)}},spotLightFalloffFactor:{type:`1f`,value:function(e){return e.falloffFactor}},spotLightDirection:{type:`3f`,value:function(e){return e.__dir=e.__dir||new F,e.__dir.copy(e.worldTransform.z).negate().array}},spotLightColor:{type:`3f`,value:function(e){var t=e.color,n=e.intensity;return[t[0]*n,t[1]*n,t[2]*n]}}},clone:function(){var e=Ja.prototype.clone.call(this);return e.range=this.range,e.umbraAngle=this.umbraAngle,e.penumbraAngle=this.penumbraAngle,e.falloffFactor=this.falloffFactor,e.shadowBias=this.shadowBias,e.shadowSlopeScale=this.shadowSlopeScale,e}}),Y=function(e,t,n,r){e||=0,t||=0,n||=0,r||=0,this.array=I.fromValues(e,t,n,r),this._dirty=!0};Y.prototype={constructor:Y,add:function(e){return I.add(this.array,this.array,e.array),this._dirty=!0,this},set:function(e,t,n,r){return this.array[0]=e,this.array[1]=t,this.array[2]=n,this.array[3]=r,this._dirty=!0,this},setArray:function(e){return this.array[0]=e[0],this.array[1]=e[1],this.array[2]=e[2],this.array[3]=e[3],this._dirty=!0,this},clone:function(){return new Y(this.x,this.y,this.z,this.w)},copy:function(e){return I.copy(this.array,e.array),this._dirty=!0,this},dist:function(e){return I.dist(this.array,e.array)},distance:function(e){return I.distance(this.array,e.array)},div:function(e){return I.div(this.array,this.array,e.array),this._dirty=!0,this},divide:function(e){return I.divide(this.array,this.array,e.array),this._dirty=!0,this},dot:function(e){return I.dot(this.array,e.array)},len:function(){return I.len(this.array)},length:function(){return I.length(this.array)},lerp:function(e,t,n){return I.lerp(this.array,e.array,t.array,n),this._dirty=!0,this},min:function(e){return I.min(this.array,this.array,e.array),this._dirty=!0,this},max:function(e){return I.max(this.array,this.array,e.array),this._dirty=!0,this},mul:function(e){return I.mul(this.array,this.array,e.array),this._dirty=!0,this},multiply:function(e){return I.multiply(this.array,this.array,e.array),this._dirty=!0,this},negate:function(){return I.negate(this.array,this.array),this._dirty=!0,this},normalize:function(){return I.normalize(this.array,this.array),this._dirty=!0,this},random:function(e){return I.random(this.array,e),this._dirty=!0,this},scale:function(e){return I.scale(this.array,this.array,e),this._dirty=!0,this},scaleAndAdd:function(e,t){return I.scaleAndAdd(this.array,this.array,e.array,t),this._dirty=!0,this},sqrDist:function(e){return I.sqrDist(this.array,e.array)},squaredDistance:function(e){return I.squaredDistance(this.array,e.array)},sqrLen:function(){return I.sqrLen(this.array)},squaredLength:function(){return I.squaredLength(this.array)},sub:function(e){return I.sub(this.array,this.array,e.array),this._dirty=!0,this},subtract:function(e){return I.subtract(this.array,this.array,e.array),this._dirty=!0,this},transformMat4:function(e){return I.transformMat4(this.array,this.array,e.array),this._dirty=!0,this},transformQuat:function(e){return I.transformQuat(this.array,this.array,e.array),this._dirty=!0,this},toString:function(){return`[`+Array.prototype.join.call(this.array,`,`)+`]`},toArray:function(){return Array.prototype.slice.call(this.array)}};var Ls=Object.defineProperty;if(Ls){var Rs=Y.prototype;Ls(Rs,`x`,{get:function(){return this.array[0]},set:function(e){this.array[0]=e,this._dirty=!0}}),Ls(Rs,`y`,{get:function(){return this.array[1]},set:function(e){this.array[1]=e,this._dirty=!0}}),Ls(Rs,`z`,{get:function(){return this.array[2]},set:function(e){this.array[2]=e,this._dirty=!0}}),Ls(Rs,`w`,{get:function(){return this.array[3]},set:function(e){this.array[3]=e,this._dirty=!0}})}Y.add=function(e,t,n){return I.add(e.array,t.array,n.array),e._dirty=!0,e},Y.set=function(e,t,n,r,i){I.set(e.array,t,n,r,i),e._dirty=!0},Y.copy=function(e,t){return I.copy(e.array,t.array),e._dirty=!0,e},Y.dist=function(e,t){return I.distance(e.array,t.array)},Y.distance=Y.dist,Y.div=function(e,t,n){return I.divide(e.array,t.array,n.array),e._dirty=!0,e},Y.divide=Y.div,Y.dot=function(e,t){return I.dot(e.array,t.array)},Y.len=function(e){return I.length(e.array)},Y.lerp=function(e,t,n,r){return I.lerp(e.array,t.array,n.array,r),e._dirty=!0,e},Y.min=function(e,t,n){return I.min(e.array,t.array,n.array),e._dirty=!0,e},Y.max=function(e,t,n){return I.max(e.array,t.array,n.array),e._dirty=!0,e},Y.mul=function(e,t,n){return I.multiply(e.array,t.array,n.array),e._dirty=!0,e},Y.multiply=Y.mul,Y.negate=function(e,t){return I.negate(e.array,t.array),e._dirty=!0,e},Y.normalize=function(e,t){return I.normalize(e.array,t.array),e._dirty=!0,e},Y.random=function(e,t){return I.random(e.array,t),e._dirty=!0,e},Y.scale=function(e,t,n){return I.scale(e.array,t.array,n),e._dirty=!0,e},Y.scaleAndAdd=function(e,t,n,r){return I.scaleAndAdd(e.array,t.array,n.array,r),e._dirty=!0,e},Y.sqrDist=function(e,t){return I.sqrDist(e.array,t.array)},Y.squaredDistance=Y.sqrDist,Y.sqrLen=function(e){return I.sqrLen(e.array)},Y.squaredLength=Y.sqrLen,Y.sub=function(e,t,n){return I.subtract(e.array,t.array,n.array),e._dirty=!0,e},Y.subtract=Y.sub,Y.transformMat4=function(e,t,n){return I.transformMat4(e.array,t.array,n.array),e._dirty=!0,e},Y.transformQuat=function(e,t,n){return I.transformQuat(e.array,t.array,n.array),e._dirty=!0,e};var X={};X.create=function(){var e=new Lr(4);return e[0]=1,e[1]=0,e[2]=0,e[3]=1,e},X.clone=function(e){var t=new Lr(4);return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t},X.copy=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e},X.identity=function(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=1,e},X.transpose=function(e,t){if(e===t){var n=t[1];e[1]=t[2],e[2]=n}else e[0]=t[0],e[1]=t[2],e[2]=t[1],e[3]=t[3];return e},X.invert=function(e,t){var n=t[0],r=t[1],i=t[2],a=t[3],o=n*a-i*r;return o?(o=1/o,e[0]=a*o,e[1]=-r*o,e[2]=-i*o,e[3]=n*o,e):null},X.adjoint=function(e,t){var n=t[0];return e[0]=t[3],e[1]=-t[1],e[2]=-t[2],e[3]=n,e},X.determinant=function(e){return e[0]*e[3]-e[2]*e[1]},X.multiply=function(e,t,n){var r=t[0],i=t[1],a=t[2],o=t[3],s=n[0],c=n[1],l=n[2],u=n[3];return e[0]=r*s+a*c,e[1]=i*s+o*c,e[2]=r*l+a*u,e[3]=i*l+o*u,e},X.mul=X.multiply,X.rotate=function(e,t,n){var r=t[0],i=t[1],a=t[2],o=t[3],s=Math.sin(n),c=Math.cos(n);return e[0]=r*c+a*s,e[1]=i*c+o*s,e[2]=r*-s+a*c,e[3]=i*-s+o*c,e},X.scale=function(e,t,n){var r=t[0],i=t[1],a=t[2],o=t[3],s=n[0],c=n[1];return e[0]=r*s,e[1]=i*s,e[2]=a*c,e[3]=o*c,e},X.frob=function(e){return Math.sqrt(e[0]**2+e[1]**2+e[2]**2+e[3]**2)},X.LDU=function(e,t,n,r){return e[2]=r[2]/r[0],n[0]=r[0],n[1]=r[1],n[3]=r[3]-e[2]*n[1],[e,t,n]};var zs=function(){this.array=X.create(),this._dirty=!0};zs.prototype={constructor:zs,setArray:function(e){for(var t=0;t<this.array.length;t++)this.array[t]=e[t];return this._dirty=!0,this},clone:function(){return new zs().copy(this)},copy:function(e){return X.copy(this.array,e.array),this._dirty=!0,this},adjoint:function(){return X.adjoint(this.array,this.array),this._dirty=!0,this},determinant:function(){return X.determinant(this.array)},identity:function(){return X.identity(this.array),this._dirty=!0,this},invert:function(){return X.invert(this.array,this.array),this._dirty=!0,this},mul:function(e){return X.mul(this.array,this.array,e.array),this._dirty=!0,this},mulLeft:function(e){return X.mul(this.array,e.array,this.array),this._dirty=!0,this},multiply:function(e){return X.multiply(this.array,this.array,e.array),this._dirty=!0,this},multiplyLeft:function(e){return X.multiply(this.array,e.array,this.array),this._dirty=!0,this},rotate:function(e){return X.rotate(this.array,this.array,e),this._dirty=!0,this},scale:function(e){return X.scale(this.array,this.array,e.array),this._dirty=!0,this},transpose:function(){return X.transpose(this.array,this.array),this._dirty=!0,this},toString:function(){return`[`+Array.prototype.join.call(this.array,`,`)+`]`},toArray:function(){return Array.prototype.slice.call(this.array)}},zs.adjoint=function(e,t){return X.adjoint(e.array,t.array),e._dirty=!0,e},zs.copy=function(e,t){return X.copy(e.array,t.array),e._dirty=!0,e},zs.determinant=function(e){return X.determinant(e.array)},zs.identity=function(e){return X.identity(e.array),e._dirty=!0,e},zs.invert=function(e,t){return X.invert(e.array,t.array),e._dirty=!0,e},zs.mul=function(e,t,n){return X.mul(e.array,t.array,n.array),e._dirty=!0,e},zs.multiply=zs.mul,zs.rotate=function(e,t,n){return X.rotate(e.array,t.array,n),e._dirty=!0,e},zs.scale=function(e,t,n){return X.scale(e.array,t.array,n.array),e._dirty=!0,e},zs.transpose=function(e,t){return X.transpose(e.array,t.array),e._dirty=!0,e};var Z={};Z.create=function(){var e=new Lr(6);return e[0]=1,e[1]=0,e[2]=0,e[3]=1,e[4]=0,e[5]=0,e},Z.clone=function(e){var t=new Lr(6);return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[4]=e[4],t[5]=e[5],t},Z.copy=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[4]=t[4],e[5]=t[5],e},Z.identity=function(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=1,e[4]=0,e[5]=0,e},Z.invert=function(e,t){var n=t[0],r=t[1],i=t[2],a=t[3],o=t[4],s=t[5],c=n*a-r*i;return c?(c=1/c,e[0]=a*c,e[1]=-r*c,e[2]=-i*c,e[3]=n*c,e[4]=(i*s-a*o)*c,e[5]=(r*o-n*s)*c,e):null},Z.determinant=function(e){return e[0]*e[3]-e[1]*e[2]},Z.multiply=function(e,t,n){var r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=n[0],u=n[1],d=n[2],f=n[3],p=n[4],m=n[5];return e[0]=r*l+a*u,e[1]=i*l+o*u,e[2]=r*d+a*f,e[3]=i*d+o*f,e[4]=r*p+a*m+s,e[5]=i*p+o*m+c,e},Z.mul=Z.multiply,Z.rotate=function(e,t,n){var r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=Math.sin(n),u=Math.cos(n);return e[0]=r*u+a*l,e[1]=i*u+o*l,e[2]=r*-l+a*u,e[3]=i*-l+o*u,e[4]=s,e[5]=c,e},Z.scale=function(e,t,n){var r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=n[0],u=n[1];return e[0]=r*l,e[1]=i*l,e[2]=a*u,e[3]=o*u,e[4]=s,e[5]=c,e},Z.translate=function(e,t,n){var r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=n[0],u=n[1];return e[0]=r,e[1]=i,e[2]=a,e[3]=o,e[4]=r*l+a*u+s,e[5]=i*l+o*u+c,e},Z.frob=function(e){return Math.sqrt(e[0]**2+e[1]**2+e[2]**2+e[3]**2+e[4]**2+e[5]**2+1)};var Bs=function(){this.array=Z.create(),this._dirty=!0};Bs.prototype={constructor:Bs,setArray:function(e){for(var t=0;t<this.array.length;t++)this.array[t]=e[t];return this._dirty=!0,this},clone:function(){return new Bs().copy(this)},copy:function(e){return Z.copy(this.array,e.array),this._dirty=!0,this},determinant:function(){return Z.determinant(this.array)},identity:function(){return Z.identity(this.array),this._dirty=!0,this},invert:function(){return Z.invert(this.array,this.array),this._dirty=!0,this},mul:function(e){return Z.mul(this.array,this.array,e.array),this._dirty=!0,this},mulLeft:function(e){return Z.mul(this.array,e.array,this.array),this._dirty=!0,this},multiply:function(e){return Z.multiply(this.array,this.array,e.array),this._dirty=!0,this},multiplyLeft:function(e){return Z.multiply(this.array,e.array,this.array),this._dirty=!0,this},rotate:function(e){return Z.rotate(this.array,this.array,e),this._dirty=!0,this},scale:function(e){return Z.scale(this.array,this.array,e.array),this._dirty=!0,this},translate:function(e){return Z.translate(this.array,this.array,e.array),this._dirty=!0,this},toString:function(){return`[`+Array.prototype.join.call(this.array,`,`)+`]`},toArray:function(){return Array.prototype.slice.call(this.array)}},Bs.copy=function(e,t){return Z.copy(e.array,t.array),e._dirty=!0,e},Bs.determinant=function(e){return Z.determinant(e.array)},Bs.identity=function(e){return Z.identity(e.array),e._dirty=!0,e},Bs.invert=function(e,t){return Z.invert(e.array,t.array),e._dirty=!0,e},Bs.mul=function(e,t,n){return Z.mul(e.array,t.array,n.array),e._dirty=!0,e},Bs.multiply=Bs.mul,Bs.rotate=function(e,t,n){return Z.rotate(e.array,t.array,n),e._dirty=!0,e},Bs.scale=function(e,t,n){return Z.scale(e.array,t.array,n.array),e._dirty=!0,e},Bs.translate=function(e,t,n){return Z.translate(e.array,t.array,n.array),e._dirty=!0,e};var Vs=function(){this.array=L.create(),this._dirty=!0};Vs.prototype={constructor:Vs,setArray:function(e){for(var t=0;t<this.array.length;t++)this.array[t]=e[t];return this._dirty=!0,this},adjoint:function(){return L.adjoint(this.array,this.array),this._dirty=!0,this},clone:function(){return new Vs().copy(this)},copy:function(e){return L.copy(this.array,e.array),this._dirty=!0,this},determinant:function(){return L.determinant(this.array)},fromMat2d:function(e){return L.fromMat2d(this.array,e.array),this._dirty=!0,this},fromMat4:function(e){return L.fromMat4(this.array,e.array),this._dirty=!0,this},fromQuat:function(e){return L.fromQuat(this.array,e.array),this._dirty=!0,this},identity:function(){return L.identity(this.array),this._dirty=!0,this},invert:function(){return L.invert(this.array,this.array),this._dirty=!0,this},mul:function(e){return L.mul(this.array,this.array,e.array),this._dirty=!0,this},mulLeft:function(e){return L.mul(this.array,e.array,this.array),this._dirty=!0,this},multiply:function(e){return L.multiply(this.array,this.array,e.array),this._dirty=!0,this},multiplyLeft:function(e){return L.multiply(this.array,e.array,this.array),this._dirty=!0,this},rotate:function(e){return L.rotate(this.array,this.array,e),this._dirty=!0,this},scale:function(e){return L.scale(this.array,this.array,e.array),this._dirty=!0,this},translate:function(e){return L.translate(this.array,this.array,e.array),this._dirty=!0,this},normalFromMat4:function(e){return L.normalFromMat4(this.array,e.array),this._dirty=!0,this},transpose:function(){return L.transpose(this.array,this.array),this._dirty=!0,this},toString:function(){return`[`+Array.prototype.join.call(this.array,`,`)+`]`},toArray:function(){return Array.prototype.slice.call(this.array)}},Vs.adjoint=function(e,t){return L.adjoint(e.array,t.array),e._dirty=!0,e},Vs.copy=function(e,t){return L.copy(e.array,t.array),e._dirty=!0,e},Vs.determinant=function(e){return L.determinant(e.array)},Vs.identity=function(e){return L.identity(e.array),e._dirty=!0,e},Vs.invert=function(e,t){return L.invert(e.array,t.array),e},Vs.mul=function(e,t,n){return L.mul(e.array,t.array,n.array),e._dirty=!0,e},Vs.multiply=Vs.mul,Vs.fromMat2d=function(e,t){return L.fromMat2d(e.array,t.array),e._dirty=!0,e},Vs.fromMat4=function(e,t){return L.fromMat4(e.array,t.array),e._dirty=!0,e},Vs.fromQuat=function(e,t){return L.fromQuat(e.array,t.array),e._dirty=!0,e},Vs.normalFromMat4=function(e,t){return L.normalFromMat4(e.array,t.array),e._dirty=!0,e},Vs.rotate=function(e,t,n){return L.rotate(e.array,t.array,n),e._dirty=!0,e},Vs.scale=function(e,t,n){return L.scale(e.array,t.array,n.array),e._dirty=!0,e},Vs.transpose=function(e,t){return L.transpose(e.array,t.array),e._dirty=!0,e},Vs.translate=function(e,t,n){return L.translate(e.array,t.array,n.array),e._dirty=!0,e},Object.assign($r.prototype,{_animators:null,getAnimators:function(){return this._animators=this._animators||[],this._animators},animate:function(e,t){this._animators=this._animators||[];var n=this,r;if(e){for(var i=e.split(`.`),a=n,o=0,s=i.length;o<s;o++)a&&=a[i[o]];a&&(r=a)}else r=n;if(r==null)throw Error(`Target `+e+` not exists`);var c=this._animators,l=new gt(r,t),u=this;return l.during(function(){u.__zr&&u.__zr.refresh()}).done(function(){var e=c.indexOf(l);e>=0&&c.splice(e,1)}),c.push(l),this.__zr&&this.__zr.animation.addAnimator(l),l},stopAnimation:function(e){this._animators=this._animators||[];for(var t=this._animators,n=t.length,r=0;r<n;r++)t[r].stop(e);return t.length=0,this},addAnimatorsToZr:function(e){if(this._animators)for(var t=0;t<this._animators.length;t++)e.animation.addAnimator(this._animators[t])},removeAnimatorsFromZr:function(e){if(this._animators)for(var t=0;t<this._animators.length;t++)e.animation.removeAnimator(this._animators[t])}}),K.import(`
@export clay.util.rand
highp float rand(vec2 uv) {
 const highp float a = 12.9898, b = 78.233, c = 43758.5453;
 highp float dt = dot(uv.xy, vec2(a,b)), sn = mod(dt, 3.141592653589793);
 return fract(sin(sn) * c);
}
@end
@export clay.util.calculate_attenuation
uniform float attenuationFactor : 5.0;
float lightAttenuation(float dist, float range)
{
 float attenuation = 1.0;
 attenuation = dist*dist/(range*range+1.0);
 float att_s = attenuationFactor;
 attenuation = 1.0/(attenuation*att_s+1.0);
 att_s = 1.0/(att_s+1.0);
 attenuation = attenuation - att_s;
 attenuation /= 1.0 - att_s;
 return clamp(attenuation, 0.0, 1.0);
}
@end
@export clay.util.edge_factor
#ifdef SUPPORT_STANDARD_DERIVATIVES
float edgeFactor(float width)
{
 vec3 d = fwidth(v_Barycentric);
 vec3 a3 = smoothstep(vec3(0.0), d * width, v_Barycentric);
 return min(min(a3.x, a3.y), a3.z);
}
#else
float edgeFactor(float width)
{
 return 1.0;
}
#endif
@end
@export clay.util.encode_float
vec4 encodeFloat(const in float depth)
{
 const vec4 bitShifts = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0);
 const vec4 bit_mask = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);
 vec4 res = fract(depth * bitShifts);
 res -= res.xxyz * bit_mask;
 return res;
}
@end
@export clay.util.decode_float
float decodeFloat(const in vec4 color)
{
 const vec4 bitShifts = vec4(1.0/(256.0*256.0*256.0), 1.0/(256.0*256.0), 1.0/256.0, 1.0);
 return dot(color, bitShifts);
}
@end
@export clay.util.float
@import clay.util.encode_float
@import clay.util.decode_float
@end
@export clay.util.rgbm_decode
vec3 RGBMDecode(vec4 rgbm, float range) {
 return range * rgbm.rgb * rgbm.a;
}
@end
@export clay.util.rgbm_encode
vec4 RGBMEncode(vec3 color, float range) {
 if (dot(color, color) == 0.0) {
 return vec4(0.0);
 }
 vec4 rgbm;
 color /= range;
 rgbm.a = clamp(max(max(color.r, color.g), max(color.b, 1e-6)), 0.0, 1.0);
 rgbm.a = ceil(rgbm.a * 255.0) / 255.0;
 rgbm.rgb = color / rgbm.a;
 return rgbm;
}
@end
@export clay.util.rgbm
@import clay.util.rgbm_decode
@import clay.util.rgbm_encode
vec4 decodeHDR(vec4 color)
{
#if defined(RGBM_DECODE) || defined(RGBM)
 return vec4(RGBMDecode(color, 8.12), 1.0);
#else
 return color;
#endif
}
vec4 encodeHDR(vec4 color)
{
#if defined(RGBM_ENCODE) || defined(RGBM)
 return RGBMEncode(color.xyz, 8.12);
#else
 return color;
#endif
}
@end
@export clay.util.srgb
vec4 sRGBToLinear(in vec4 value) {
 return vec4(mix(pow(value.rgb * 0.9478672986 + vec3(0.0521327014), vec3(2.4)), value.rgb * 0.0773993808, vec3(lessThanEqual(value.rgb, vec3(0.04045)))), value.w);
}
vec4 linearTosRGB(in vec4 value) {
 return vec4(mix(pow(value.rgb, vec3(0.41666)) * 1.055 - vec3(0.055), value.rgb * 12.92, vec3(lessThanEqual(value.rgb, vec3(0.0031308)))), value.w);
}
@end
@export clay.chunk.skinning_header
#ifdef SKINNING
attribute vec3 weight : WEIGHT;
attribute vec4 joint : JOINT;
#ifdef USE_SKIN_MATRICES_TEXTURE
uniform sampler2D skinMatricesTexture : ignore;
uniform float skinMatricesTextureSize: ignore;
mat4 getSkinMatrix(sampler2D tex, float idx) {
 float j = idx * 4.0;
 float x = mod(j, skinMatricesTextureSize);
 float y = floor(j / skinMatricesTextureSize) + 0.5;
 vec2 scale = vec2(skinMatricesTextureSize);
 return mat4(
 texture2D(tex, vec2(x + 0.5, y) / scale),
 texture2D(tex, vec2(x + 1.5, y) / scale),
 texture2D(tex, vec2(x + 2.5, y) / scale),
 texture2D(tex, vec2(x + 3.5, y) / scale)
 );
}
mat4 getSkinMatrix(float idx) {
 return getSkinMatrix(skinMatricesTexture, idx);
}
#else
uniform mat4 skinMatrix[JOINT_COUNT] : SKIN_MATRIX;
mat4 getSkinMatrix(float idx) {
 return skinMatrix[int(idx)];
}
#endif
#endif
@end
@export clay.chunk.skin_matrix
mat4 skinMatrixWS = getSkinMatrix(joint.x) * weight.x;
if (weight.y > 1e-4)
{
 skinMatrixWS += getSkinMatrix(joint.y) * weight.y;
}
if (weight.z > 1e-4)
{
 skinMatrixWS += getSkinMatrix(joint.z) * weight.z;
}
float weightW = 1.0-weight.x-weight.y-weight.z;
if (weightW > 1e-4)
{
 skinMatrixWS += getSkinMatrix(joint.w) * weightW;
}
@end
@export clay.chunk.instancing_header
#ifdef INSTANCING
attribute vec4 instanceMat1;
attribute vec4 instanceMat2;
attribute vec4 instanceMat3;
#endif
@end
@export clay.chunk.instancing_matrix
mat4 instanceMat = mat4(
 vec4(instanceMat1.xyz, 0.0),
 vec4(instanceMat2.xyz, 0.0),
 vec4(instanceMat3.xyz, 0.0),
 vec4(instanceMat1.w, instanceMat2.w, instanceMat3.w, 1.0)
);
@end
@export clay.util.parallax_correct
vec3 parallaxCorrect(in vec3 dir, in vec3 pos, in vec3 boxMin, in vec3 boxMax) {
 vec3 first = (boxMax - pos) / dir;
 vec3 second = (boxMin - pos) / dir;
 vec3 further = max(first, second);
 float dist = min(further.x, min(further.y, further.z));
 vec3 fixedPos = pos + dir * dist;
 vec3 boxCenter = (boxMax + boxMin) * 0.5;
 return normalize(fixedPos - boxCenter);
}
@end
@export clay.util.clamp_sample
vec4 clampSample(const in sampler2D texture, const in vec2 coord)
{
#ifdef STEREO
 float eye = step(0.5, coord.x) * 0.5;
 vec2 coordClamped = clamp(coord, vec2(eye, 0.0), vec2(0.5 + eye, 1.0));
#else
 vec2 coordClamped = clamp(coord, vec2(0.0), vec2(1.0));
#endif
 return texture2D(texture, coordClamped);
}
@end
@export clay.util.ACES
vec3 ACESToneMapping(vec3 color)
{
 const float A = 2.51;
 const float B = 0.03;
 const float C = 2.43;
 const float D = 0.59;
 const float E = 0.14;
 return (color * (A * color + B)) / (color * (C * color + D) + E);
}
@end`),K.import(da),K.import(`
@export ecgl.common.transformUniforms
uniform mat4 worldViewProjection : WORLDVIEWPROJECTION;
uniform mat4 worldInverseTranspose : WORLDINVERSETRANSPOSE;
uniform mat4 world : WORLD;
@end

@export ecgl.common.attributes
attribute vec3 position : POSITION;
attribute vec2 texcoord : TEXCOORD_0;
attribute vec3 normal : NORMAL;
@end

@export ecgl.common.uv.header
uniform vec2 uvRepeat : [1.0, 1.0];
uniform vec2 uvOffset : [0.0, 0.0];
uniform vec2 detailUvRepeat : [1.0, 1.0];
uniform vec2 detailUvOffset : [0.0, 0.0];

varying vec2 v_Texcoord;
varying vec2 v_DetailTexcoord;
@end

@export ecgl.common.uv.main
v_Texcoord = texcoord * uvRepeat + uvOffset;
v_DetailTexcoord = texcoord * detailUvRepeat + detailUvOffset;
@end

@export ecgl.common.uv.fragmentHeader
varying vec2 v_Texcoord;
varying vec2 v_DetailTexcoord;
@end


@export ecgl.common.albedo.main

 vec4 albedoTexel = vec4(1.0);
#ifdef DIFFUSEMAP_ENABLED
 albedoTexel = texture2D(diffuseMap, v_Texcoord);
 #ifdef SRGB_DECODE
 albedoTexel = sRGBToLinear(albedoTexel);
 #endif
#endif

#ifdef DETAILMAP_ENABLED
 vec4 detailTexel = texture2D(detailMap, v_DetailTexcoord);
 #ifdef SRGB_DECODE
 detailTexel = sRGBToLinear(detailTexel);
 #endif
 albedoTexel.rgb = mix(albedoTexel.rgb, detailTexel.rgb, detailTexel.a);
 albedoTexel.a = detailTexel.a + (1.0 - detailTexel.a) * albedoTexel.a;
#endif

@end

@export ecgl.common.wireframe.vertexHeader

#ifdef WIREFRAME_QUAD
attribute vec4 barycentric;
varying vec4 v_Barycentric;
#elif defined(WIREFRAME_TRIANGLE)
attribute vec3 barycentric;
varying vec3 v_Barycentric;
#endif

@end

@export ecgl.common.wireframe.vertexMain

#if defined(WIREFRAME_QUAD) || defined(WIREFRAME_TRIANGLE)
 v_Barycentric = barycentric;
#endif

@end


@export ecgl.common.wireframe.fragmentHeader

uniform float wireframeLineWidth : 1;
uniform vec4 wireframeLineColor: [0, 0, 0, 0.5];

#ifdef WIREFRAME_QUAD
varying vec4 v_Barycentric;
float edgeFactor () {
 vec4 d = fwidth(v_Barycentric);
 vec4 a4 = smoothstep(vec4(0.0), d * wireframeLineWidth, v_Barycentric);
 return min(min(min(a4.x, a4.y), a4.z), a4.w);
}
#elif defined(WIREFRAME_TRIANGLE)
varying vec3 v_Barycentric;
float edgeFactor () {
 vec3 d = fwidth(v_Barycentric);
 vec3 a3 = smoothstep(vec3(0.0), d * wireframeLineWidth, v_Barycentric);
 return min(min(a3.x, a3.y), a3.z);
}
#endif

@end


@export ecgl.common.wireframe.fragmentMain

#if defined(WIREFRAME_QUAD) || defined(WIREFRAME_TRIANGLE)
 if (wireframeLineWidth > 0.) {
 vec4 lineColor = wireframeLineColor;
#ifdef SRGB_DECODE
 lineColor = sRGBToLinear(lineColor);
#endif

 gl_FragColor.rgb = mix(gl_FragColor.rgb, lineColor.rgb, (1.0 - edgeFactor()) * lineColor.a);
 }
#endif
@end




@export ecgl.common.bumpMap.header

#ifdef BUMPMAP_ENABLED
uniform sampler2D bumpMap;
uniform float bumpScale : 1.0;


vec3 bumpNormal(vec3 surfPos, vec3 surfNormal, vec3 baseNormal)
{
 vec2 dSTdx = dFdx(v_Texcoord);
 vec2 dSTdy = dFdy(v_Texcoord);

 float Hll = bumpScale * texture2D(bumpMap, v_Texcoord).x;
 float dHx = bumpScale * texture2D(bumpMap, v_Texcoord + dSTdx).x - Hll;
 float dHy = bumpScale * texture2D(bumpMap, v_Texcoord + dSTdy).x - Hll;

 vec3 vSigmaX = dFdx(surfPos);
 vec3 vSigmaY = dFdy(surfPos);
 vec3 vN = surfNormal;

 vec3 R1 = cross(vSigmaY, vN);
 vec3 R2 = cross(vN, vSigmaX);

 float fDet = dot(vSigmaX, R1);

 vec3 vGrad = sign(fDet) * (dHx * R1 + dHy * R2);
 return normalize(abs(fDet) * baseNormal - vGrad);

}
#endif

@end

@export ecgl.common.normalMap.vertexHeader

#ifdef NORMALMAP_ENABLED
attribute vec4 tangent : TANGENT;
varying vec3 v_Tangent;
varying vec3 v_Bitangent;
#endif

@end

@export ecgl.common.normalMap.vertexMain

#ifdef NORMALMAP_ENABLED
 if (dot(tangent, tangent) > 0.0) {
 v_Tangent = normalize((worldInverseTranspose * vec4(tangent.xyz, 0.0)).xyz);
 v_Bitangent = normalize(cross(v_Normal, v_Tangent) * tangent.w);
 }
#endif

@end


@export ecgl.common.normalMap.fragmentHeader

#ifdef NORMALMAP_ENABLED
uniform sampler2D normalMap;
varying vec3 v_Tangent;
varying vec3 v_Bitangent;
#endif

@end

@export ecgl.common.normalMap.fragmentMain
#ifdef NORMALMAP_ENABLED
 if (dot(v_Tangent, v_Tangent) > 0.0) {
 vec3 normalTexel = texture2D(normalMap, v_DetailTexcoord).xyz;
 if (dot(normalTexel, normalTexel) > 0.0) { N = normalTexel * 2.0 - 1.0;
 mat3 tbn = mat3(v_Tangent, v_Bitangent, v_Normal);
 N = normalize(tbn * N);
 }
 }
#endif
@end



@export ecgl.common.vertexAnimation.header

#ifdef VERTEX_ANIMATION
attribute vec3 prevPosition;
attribute vec3 prevNormal;
uniform float percent;
#endif

@end

@export ecgl.common.vertexAnimation.main

#ifdef VERTEX_ANIMATION
 vec3 pos = mix(prevPosition, position, percent);
 vec3 norm = mix(prevNormal, normal, percent);
#else
 vec3 pos = position;
 vec3 norm = normal;
#endif

@end


@export ecgl.common.ssaoMap.header
#ifdef SSAOMAP_ENABLED
uniform sampler2D ssaoMap;
uniform vec4 viewport : VIEWPORT;
#endif
@end

@export ecgl.common.ssaoMap.main
 float ao = 1.0;
#ifdef SSAOMAP_ENABLED
 ao = texture2D(ssaoMap, (gl_FragCoord.xy - viewport.xy) / viewport.zw).r;
#endif
@end




@export ecgl.common.diffuseLayer.header

#if (LAYER_DIFFUSEMAP_COUNT > 0)
uniform float layerDiffuseIntensity[LAYER_DIFFUSEMAP_COUNT];
uniform sampler2D layerDiffuseMap[LAYER_DIFFUSEMAP_COUNT];
#endif

@end

@export ecgl.common.emissiveLayer.header

#if (LAYER_EMISSIVEMAP_COUNT > 0)
uniform float layerEmissionIntensity[LAYER_EMISSIVEMAP_COUNT];
uniform sampler2D layerEmissiveMap[LAYER_EMISSIVEMAP_COUNT];
#endif

@end

@export ecgl.common.layers.header
@import ecgl.common.diffuseLayer.header
@import ecgl.common.emissiveLayer.header
@end

@export ecgl.common.diffuseLayer.main

#if (LAYER_DIFFUSEMAP_COUNT > 0)
 for (int _idx_ = 0; _idx_ < LAYER_DIFFUSEMAP_COUNT; _idx_++) {{
 float intensity = layerDiffuseIntensity[_idx_];
 vec4 texel2 = texture2D(layerDiffuseMap[_idx_], v_Texcoord);
 #ifdef SRGB_DECODE
 texel2 = sRGBToLinear(texel2);
 #endif
 albedoTexel.rgb = mix(albedoTexel.rgb, texel2.rgb * intensity, texel2.a);
 albedoTexel.a = texel2.a + (1.0 - texel2.a) * albedoTexel.a;
 }}
#endif

@end

@export ecgl.common.emissiveLayer.main

#if (LAYER_EMISSIVEMAP_COUNT > 0)
 for (int _idx_ = 0; _idx_ < LAYER_EMISSIVEMAP_COUNT; _idx_++)
 {{
 vec4 texel2 = texture2D(layerEmissiveMap[_idx_], v_Texcoord) * layerEmissionIntensity[_idx_];
 #ifdef SRGB_DECODE
 texel2 = sRGBToLinear(texel2);
 #endif
 float intensity = layerEmissionIntensity[_idx_];
 gl_FragColor.rgb += texel2.rgb * texel2.a * intensity;
 }}
#endif

@end
`),K.import(`@export ecgl.color.vertex

uniform mat4 worldViewProjection : WORLDVIEWPROJECTION;

@import ecgl.common.uv.header

attribute vec2 texcoord : TEXCOORD_0;
attribute vec3 position: POSITION;

@import ecgl.common.wireframe.vertexHeader

#ifdef VERTEX_COLOR
attribute vec4 a_Color : COLOR;
varying vec4 v_Color;
#endif

#ifdef VERTEX_ANIMATION
attribute vec3 prevPosition;
uniform float percent : 1.0;
#endif

#ifdef ATMOSPHERE_ENABLED
attribute vec3 normal: NORMAL;
uniform mat4 worldInverseTranspose : WORLDINVERSETRANSPOSE;
varying vec3 v_Normal;
#endif

void main()
{
#ifdef VERTEX_ANIMATION
 vec3 pos = mix(prevPosition, position, percent);
#else
 vec3 pos = position;
#endif

 gl_Position = worldViewProjection * vec4(pos, 1.0);

 @import ecgl.common.uv.main

#ifdef VERTEX_COLOR
 v_Color = a_Color;
#endif

#ifdef ATMOSPHERE_ENABLED
 v_Normal = normalize((worldInverseTranspose * vec4(normal, 0.0)).xyz);
#endif

 @import ecgl.common.wireframe.vertexMain

}

@end

@export ecgl.color.fragment

#define LAYER_DIFFUSEMAP_COUNT 0
#define LAYER_EMISSIVEMAP_COUNT 0

uniform sampler2D diffuseMap;
uniform sampler2D detailMap;

uniform vec4 color : [1.0, 1.0, 1.0, 1.0];

#ifdef ATMOSPHERE_ENABLED
uniform mat4 viewTranspose: VIEWTRANSPOSE;
uniform vec3 glowColor;
uniform float glowPower;
varying vec3 v_Normal;
#endif

#ifdef VERTEX_COLOR
varying vec4 v_Color;
#endif

@import ecgl.common.layers.header

@import ecgl.common.uv.fragmentHeader

@import ecgl.common.wireframe.fragmentHeader

@import clay.util.srgb

void main()
{
#ifdef SRGB_DECODE
 gl_FragColor = sRGBToLinear(color);
#else
 gl_FragColor = color;
#endif

#ifdef VERTEX_COLOR
 gl_FragColor *= v_Color;
#endif

 @import ecgl.common.albedo.main

 @import ecgl.common.diffuseLayer.main

 gl_FragColor *= albedoTexel;

#ifdef ATMOSPHERE_ENABLED
 float atmoIntensity = pow(1.0 - dot(v_Normal, (viewTranspose * vec4(0.0, 0.0, 1.0, 0.0)).xyz), glowPower);
 gl_FragColor.rgb += glowColor * atmoIntensity;
#endif

 @import ecgl.common.emissiveLayer.main

 @import ecgl.common.wireframe.fragmentMain

}
@end`),K.import(`/**
 * http: */

@export ecgl.lambert.vertex

@import ecgl.common.transformUniforms

@import ecgl.common.uv.header


@import ecgl.common.attributes

@import ecgl.common.wireframe.vertexHeader

#ifdef VERTEX_COLOR
attribute vec4 a_Color : COLOR;
varying vec4 v_Color;
#endif


@import ecgl.common.vertexAnimation.header


varying vec3 v_Normal;
varying vec3 v_WorldPosition;

void main()
{
 @import ecgl.common.uv.main

 @import ecgl.common.vertexAnimation.main


 gl_Position = worldViewProjection * vec4(pos, 1.0);

 v_Normal = normalize((worldInverseTranspose * vec4(norm, 0.0)).xyz);
 v_WorldPosition = (world * vec4(pos, 1.0)).xyz;

#ifdef VERTEX_COLOR
 v_Color = a_Color;
#endif

 @import ecgl.common.wireframe.vertexMain
}

@end


@export ecgl.lambert.fragment

#define LAYER_DIFFUSEMAP_COUNT 0
#define LAYER_EMISSIVEMAP_COUNT 0

#define NORMAL_UP_AXIS 1
#define NORMAL_FRONT_AXIS 2

@import ecgl.common.uv.fragmentHeader

varying vec3 v_Normal;
varying vec3 v_WorldPosition;

uniform sampler2D diffuseMap;
uniform sampler2D detailMap;

@import ecgl.common.layers.header

uniform float emissionIntensity: 1.0;

uniform vec4 color : [1.0, 1.0, 1.0, 1.0];

uniform mat4 viewInverse : VIEWINVERSE;

#ifdef ATMOSPHERE_ENABLED
uniform mat4 viewTranspose: VIEWTRANSPOSE;
uniform vec3 glowColor;
uniform float glowPower;
#endif

#ifdef AMBIENT_LIGHT_COUNT
@import clay.header.ambient_light
#endif
#ifdef AMBIENT_SH_LIGHT_COUNT
@import clay.header.ambient_sh_light
#endif

#ifdef DIRECTIONAL_LIGHT_COUNT
@import clay.header.directional_light
#endif

#ifdef VERTEX_COLOR
varying vec4 v_Color;
#endif


@import ecgl.common.ssaoMap.header

@import ecgl.common.bumpMap.header

@import clay.util.srgb

@import ecgl.common.wireframe.fragmentHeader

@import clay.plugin.compute_shadow_map

void main()
{
#ifdef SRGB_DECODE
 gl_FragColor = sRGBToLinear(color);
#else
 gl_FragColor = color;
#endif

#ifdef VERTEX_COLOR
 #ifdef SRGB_DECODE
 gl_FragColor *= sRGBToLinear(v_Color);
 #else
 gl_FragColor *= v_Color;
 #endif
#endif

 @import ecgl.common.albedo.main

 @import ecgl.common.diffuseLayer.main

 gl_FragColor *= albedoTexel;

 vec3 N = v_Normal;
#ifdef DOUBLE_SIDED
 vec3 eyePos = viewInverse[3].xyz;
 vec3 V = normalize(eyePos - v_WorldPosition);

 if (dot(N, V) < 0.0) {
 N = -N;
 }
#endif

 float ambientFactor = 1.0;

#ifdef BUMPMAP_ENABLED
 N = bumpNormal(v_WorldPosition, v_Normal, N);
 ambientFactor = dot(v_Normal, N);
#endif

 vec3 N2 = vec3(N.x, N[NORMAL_UP_AXIS], N[NORMAL_FRONT_AXIS]);

 vec3 diffuseColor = vec3(0.0, 0.0, 0.0);

 @import ecgl.common.ssaoMap.main

#ifdef AMBIENT_LIGHT_COUNT
 for(int i = 0; i < AMBIENT_LIGHT_COUNT; i++)
 {
 diffuseColor += ambientLightColor[i] * ambientFactor * ao;
 }
#endif
#ifdef AMBIENT_SH_LIGHT_COUNT
 for(int _idx_ = 0; _idx_ < AMBIENT_SH_LIGHT_COUNT; _idx_++)
 {{
 diffuseColor += calcAmbientSHLight(_idx_, N2) * ambientSHLightColor[_idx_] * ao;
 }}
#endif
#ifdef DIRECTIONAL_LIGHT_COUNT
#if defined(DIRECTIONAL_LIGHT_SHADOWMAP_COUNT)
 float shadowContribsDir[DIRECTIONAL_LIGHT_COUNT];
 if(shadowEnabled)
 {
 computeShadowOfDirectionalLights(v_WorldPosition, shadowContribsDir);
 }
#endif
 for(int i = 0; i < DIRECTIONAL_LIGHT_COUNT; i++)
 {
 vec3 lightDirection = -directionalLightDirection[i];
 vec3 lightColor = directionalLightColor[i];

 float shadowContrib = 1.0;
#if defined(DIRECTIONAL_LIGHT_SHADOWMAP_COUNT)
 if (shadowEnabled)
 {
 shadowContrib = shadowContribsDir[i];
 }
#endif

 float ndl = dot(N, normalize(lightDirection)) * shadowContrib;

 diffuseColor += lightColor * clamp(ndl, 0.0, 1.0);
 }
#endif

 gl_FragColor.rgb *= diffuseColor;

#ifdef ATMOSPHERE_ENABLED
 float atmoIntensity = pow(1.0 - dot(v_Normal, (viewTranspose * vec4(0.0, 0.0, 1.0, 0.0)).xyz), glowPower);
 gl_FragColor.rgb += glowColor * atmoIntensity;
#endif

 @import ecgl.common.emissiveLayer.main

 @import ecgl.common.wireframe.fragmentMain
}

@end`),K.import(`@export ecgl.realistic.vertex

@import ecgl.common.transformUniforms

@import ecgl.common.uv.header

@import ecgl.common.attributes


@import ecgl.common.wireframe.vertexHeader

#ifdef VERTEX_COLOR
attribute vec4 a_Color : COLOR;
varying vec4 v_Color;
#endif

#ifdef NORMALMAP_ENABLED
attribute vec4 tangent : TANGENT;
varying vec3 v_Tangent;
varying vec3 v_Bitangent;
#endif

@import ecgl.common.vertexAnimation.header

varying vec3 v_Normal;
varying vec3 v_WorldPosition;

void main()
{

 @import ecgl.common.uv.main

 @import ecgl.common.vertexAnimation.main

 gl_Position = worldViewProjection * vec4(pos, 1.0);

 v_Normal = normalize((worldInverseTranspose * vec4(norm, 0.0)).xyz);
 v_WorldPosition = (world * vec4(pos, 1.0)).xyz;

#ifdef VERTEX_COLOR
 v_Color = a_Color;
#endif

#ifdef NORMALMAP_ENABLED
 v_Tangent = normalize((worldInverseTranspose * vec4(tangent.xyz, 0.0)).xyz);
 v_Bitangent = normalize(cross(v_Normal, v_Tangent) * tangent.w);
#endif

 @import ecgl.common.wireframe.vertexMain

}

@end



@export ecgl.realistic.fragment

#define LAYER_DIFFUSEMAP_COUNT 0
#define LAYER_EMISSIVEMAP_COUNT 0
#define PI 3.14159265358979
#define ROUGHNESS_CHANEL 0
#define METALNESS_CHANEL 1

#define NORMAL_UP_AXIS 1
#define NORMAL_FRONT_AXIS 2

#ifdef VERTEX_COLOR
varying vec4 v_Color;
#endif

@import ecgl.common.uv.fragmentHeader

varying vec3 v_Normal;
varying vec3 v_WorldPosition;

uniform sampler2D diffuseMap;

uniform sampler2D detailMap;
uniform sampler2D metalnessMap;
uniform sampler2D roughnessMap;

@import ecgl.common.layers.header

uniform float emissionIntensity: 1.0;

uniform vec4 color : [1.0, 1.0, 1.0, 1.0];

uniform float metalness : 0.0;
uniform float roughness : 0.5;

uniform mat4 viewInverse : VIEWINVERSE;

#ifdef ATMOSPHERE_ENABLED
uniform mat4 viewTranspose: VIEWTRANSPOSE;
uniform vec3 glowColor;
uniform float glowPower;
#endif

#ifdef AMBIENT_LIGHT_COUNT
@import clay.header.ambient_light
#endif

#ifdef AMBIENT_SH_LIGHT_COUNT
@import clay.header.ambient_sh_light
#endif

#ifdef AMBIENT_CUBEMAP_LIGHT_COUNT
@import clay.header.ambient_cubemap_light
#endif

#ifdef DIRECTIONAL_LIGHT_COUNT
@import clay.header.directional_light
#endif

@import ecgl.common.normalMap.fragmentHeader

@import ecgl.common.ssaoMap.header

@import ecgl.common.bumpMap.header

@import clay.util.srgb

@import clay.util.rgbm

@import ecgl.common.wireframe.fragmentHeader

@import clay.plugin.compute_shadow_map

vec3 F_Schlick(float ndv, vec3 spec) {
 return spec + (1.0 - spec) * pow(1.0 - ndv, 5.0);
}

float D_Phong(float g, float ndh) {
 float a = pow(8192.0, g);
 return (a + 2.0) / 8.0 * pow(ndh, a);
}

void main()
{
 vec4 albedoColor = color;

 vec3 eyePos = viewInverse[3].xyz;
 vec3 V = normalize(eyePos - v_WorldPosition);
#ifdef VERTEX_COLOR
 #ifdef SRGB_DECODE
 albedoColor *= sRGBToLinear(v_Color);
 #else
 albedoColor *= v_Color;
 #endif
#endif

 @import ecgl.common.albedo.main

 @import ecgl.common.diffuseLayer.main

 albedoColor *= albedoTexel;

 float m = metalness;

#ifdef METALNESSMAP_ENABLED
 float m2 = texture2D(metalnessMap, v_DetailTexcoord)[METALNESS_CHANEL];
 m = clamp(m2 + (m - 0.5) * 2.0, 0.0, 1.0);
#endif

 vec3 baseColor = albedoColor.rgb;
 albedoColor.rgb = baseColor * (1.0 - m);
 vec3 specFactor = mix(vec3(0.04), baseColor, m);

 float g = 1.0 - roughness;

#ifdef ROUGHNESSMAP_ENABLED
 float g2 = 1.0 - texture2D(roughnessMap, v_DetailTexcoord)[ROUGHNESS_CHANEL];
 g = clamp(g2 + (g - 0.5) * 2.0, 0.0, 1.0);
#endif

 vec3 N = v_Normal;

#ifdef DOUBLE_SIDED
 if (dot(N, V) < 0.0) {
 N = -N;
 }
#endif

 float ambientFactor = 1.0;

#ifdef BUMPMAP_ENABLED
 N = bumpNormal(v_WorldPosition, v_Normal, N);
 ambientFactor = dot(v_Normal, N);
#endif

@import ecgl.common.normalMap.fragmentMain

 vec3 N2 = vec3(N.x, N[NORMAL_UP_AXIS], N[NORMAL_FRONT_AXIS]);

 vec3 diffuseTerm = vec3(0.0);
 vec3 specularTerm = vec3(0.0);

 float ndv = clamp(dot(N, V), 0.0, 1.0);
 vec3 fresnelTerm = F_Schlick(ndv, specFactor);

 @import ecgl.common.ssaoMap.main

#ifdef AMBIENT_LIGHT_COUNT
 for(int _idx_ = 0; _idx_ < AMBIENT_LIGHT_COUNT; _idx_++)
 {{
 diffuseTerm += ambientLightColor[_idx_] * ambientFactor * ao;
 }}
#endif

#ifdef AMBIENT_SH_LIGHT_COUNT
 for(int _idx_ = 0; _idx_ < AMBIENT_SH_LIGHT_COUNT; _idx_++)
 {{
 diffuseTerm += calcAmbientSHLight(_idx_, N2) * ambientSHLightColor[_idx_] * ao;
 }}
#endif

#ifdef DIRECTIONAL_LIGHT_COUNT
#if defined(DIRECTIONAL_LIGHT_SHADOWMAP_COUNT)
 float shadowContribsDir[DIRECTIONAL_LIGHT_COUNT];
 if(shadowEnabled)
 {
 computeShadowOfDirectionalLights(v_WorldPosition, shadowContribsDir);
 }
#endif
 for(int _idx_ = 0; _idx_ < DIRECTIONAL_LIGHT_COUNT; _idx_++)
 {{
 vec3 L = -directionalLightDirection[_idx_];
 vec3 lc = directionalLightColor[_idx_];

 vec3 H = normalize(L + V);
 float ndl = clamp(dot(N, normalize(L)), 0.0, 1.0);
 float ndh = clamp(dot(N, H), 0.0, 1.0);

 float shadowContrib = 1.0;
#if defined(DIRECTIONAL_LIGHT_SHADOWMAP_COUNT)
 if (shadowEnabled)
 {
 shadowContrib = shadowContribsDir[_idx_];
 }
#endif

 vec3 li = lc * ndl * shadowContrib;

 diffuseTerm += li;
 specularTerm += li * fresnelTerm * D_Phong(g, ndh);
 }}
#endif


#ifdef AMBIENT_CUBEMAP_LIGHT_COUNT
 vec3 L = reflect(-V, N);
 L = vec3(L.x, L[NORMAL_UP_AXIS], L[NORMAL_FRONT_AXIS]);
 float rough2 = clamp(1.0 - g, 0.0, 1.0);
 float bias2 = rough2 * 5.0;
 vec2 brdfParam2 = texture2D(ambientCubemapLightBRDFLookup[0], vec2(rough2, ndv)).xy;
 vec3 envWeight2 = specFactor * brdfParam2.x + brdfParam2.y;
 vec3 envTexel2;
 for(int _idx_ = 0; _idx_ < AMBIENT_CUBEMAP_LIGHT_COUNT; _idx_++)
 {{
 envTexel2 = RGBMDecode(textureCubeLodEXT(ambientCubemapLightCubemap[_idx_], L, bias2), 8.12);
 specularTerm += ambientCubemapLightColor[_idx_] * envTexel2 * envWeight2 * ao;
 }}
#endif

 gl_FragColor.rgb = albedoColor.rgb * diffuseTerm + specularTerm;
 gl_FragColor.a = albedoColor.a;

#ifdef ATMOSPHERE_ENABLED
 float atmoIntensity = pow(1.0 - dot(v_Normal, (viewTranspose * vec4(0.0, 0.0, 1.0, 0.0)).xyz), glowPower);
 gl_FragColor.rgb += glowColor * atmoIntensity;
#endif

#ifdef SRGB_ENCODE
 gl_FragColor = linearTosRGB(gl_FragColor);
#endif

 @import ecgl.common.emissiveLayer.main

 @import ecgl.common.wireframe.fragmentMain
}

@end`),K.import(`@export ecgl.hatching.vertex

@import ecgl.realistic.vertex

@end


@export ecgl.hatching.fragment

#define NORMAL_UP_AXIS 1
#define NORMAL_FRONT_AXIS 2

@import ecgl.common.uv.fragmentHeader

varying vec3 v_Normal;
varying vec3 v_WorldPosition;

uniform vec4 color : [0.0, 0.0, 0.0, 1.0];
uniform vec4 paperColor : [1.0, 1.0, 1.0, 1.0];

uniform mat4 viewInverse : VIEWINVERSE;

#ifdef AMBIENT_LIGHT_COUNT
@import clay.header.ambient_light
#endif
#ifdef AMBIENT_SH_LIGHT_COUNT
@import clay.header.ambient_sh_light
#endif

#ifdef DIRECTIONAL_LIGHT_COUNT
@import clay.header.directional_light
#endif

#ifdef VERTEX_COLOR
varying vec4 v_Color;
#endif


@import ecgl.common.ssaoMap.header

@import ecgl.common.bumpMap.header

@import clay.util.srgb

@import ecgl.common.wireframe.fragmentHeader

@import clay.plugin.compute_shadow_map

uniform sampler2D hatch1;
uniform sampler2D hatch2;
uniform sampler2D hatch3;
uniform sampler2D hatch4;
uniform sampler2D hatch5;
uniform sampler2D hatch6;

float shade(in float tone) {
 vec4 c = vec4(1. ,1., 1., 1.);
 float step = 1. / 6.;
 vec2 uv = v_DetailTexcoord;
 if (tone <= step / 2.0) {
 c = mix(vec4(0.), texture2D(hatch6, uv), 12. * tone);
 }
 else if (tone <= step) {
 c = mix(texture2D(hatch6, uv), texture2D(hatch5, uv), 6. * tone);
 }
 if(tone > step && tone <= 2. * step){
 c = mix(texture2D(hatch5, uv), texture2D(hatch4, uv) , 6. * (tone - step));
 }
 if(tone > 2. * step && tone <= 3. * step){
 c = mix(texture2D(hatch4, uv), texture2D(hatch3, uv), 6. * (tone - 2. * step));
 }
 if(tone > 3. * step && tone <= 4. * step){
 c = mix(texture2D(hatch3, uv), texture2D(hatch2, uv), 6. * (tone - 3. * step));
 }
 if(tone > 4. * step && tone <= 5. * step){
 c = mix(texture2D(hatch2, uv), texture2D(hatch1, uv), 6. * (tone - 4. * step));
 }
 if(tone > 5. * step){
 c = mix(texture2D(hatch1, uv), vec4(1.), 6. * (tone - 5. * step));
 }

 return c.r;
}

const vec3 w = vec3(0.2125, 0.7154, 0.0721);

void main()
{
#ifdef SRGB_DECODE
 vec4 inkColor = sRGBToLinear(color);
#else
 vec4 inkColor = color;
#endif

#ifdef VERTEX_COLOR
 #ifdef SRGB_DECODE
 inkColor *= sRGBToLinear(v_Color);
 #else
 inkColor *= v_Color;
 #endif
#endif

 vec3 N = v_Normal;
#ifdef DOUBLE_SIDED
 vec3 eyePos = viewInverse[3].xyz;
 vec3 V = normalize(eyePos - v_WorldPosition);

 if (dot(N, V) < 0.0) {
 N = -N;
 }
#endif

 float tone = 0.0;

 float ambientFactor = 1.0;

#ifdef BUMPMAP_ENABLED
 N = bumpNormal(v_WorldPosition, v_Normal, N);
 ambientFactor = dot(v_Normal, N);
#endif

 vec3 N2 = vec3(N.x, N[NORMAL_UP_AXIS], N[NORMAL_FRONT_AXIS]);

 @import ecgl.common.ssaoMap.main

#ifdef AMBIENT_LIGHT_COUNT
 for(int i = 0; i < AMBIENT_LIGHT_COUNT; i++)
 {
 tone += dot(ambientLightColor[i], w) * ambientFactor * ao;
 }
#endif
#ifdef AMBIENT_SH_LIGHT_COUNT
 for(int _idx_ = 0; _idx_ < AMBIENT_SH_LIGHT_COUNT; _idx_++)
 {{
 tone += dot(calcAmbientSHLight(_idx_, N2) * ambientSHLightColor[_idx_], w) * ao;
 }}
#endif
#ifdef DIRECTIONAL_LIGHT_COUNT
#if defined(DIRECTIONAL_LIGHT_SHADOWMAP_COUNT)
 float shadowContribsDir[DIRECTIONAL_LIGHT_COUNT];
 if(shadowEnabled)
 {
 computeShadowOfDirectionalLights(v_WorldPosition, shadowContribsDir);
 }
#endif
 for(int i = 0; i < DIRECTIONAL_LIGHT_COUNT; i++)
 {
 vec3 lightDirection = -directionalLightDirection[i];
 float lightTone = dot(directionalLightColor[i], w);

 float shadowContrib = 1.0;
#if defined(DIRECTIONAL_LIGHT_SHADOWMAP_COUNT)
 if (shadowEnabled)
 {
 shadowContrib = shadowContribsDir[i];
 }
#endif

 float ndl = dot(N, normalize(lightDirection)) * shadowContrib;

 tone += lightTone * clamp(ndl, 0.0, 1.0);
 }
#endif

 gl_FragColor = mix(inkColor, paperColor, shade(clamp(tone, 0.0, 1.0)));
 }
@end
`),K.import(`@export ecgl.sm.depth.vertex

uniform mat4 worldViewProjection : WORLDVIEWPROJECTION;

attribute vec3 position : POSITION;
attribute vec2 texcoord : TEXCOORD_0;

#ifdef VERTEX_ANIMATION
attribute vec3 prevPosition;
uniform float percent : 1.0;
#endif

varying vec4 v_ViewPosition;
varying vec2 v_Texcoord;

void main(){

#ifdef VERTEX_ANIMATION
 vec3 pos = mix(prevPosition, position, percent);
#else
 vec3 pos = position;
#endif

 v_ViewPosition = worldViewProjection * vec4(pos, 1.0);
 gl_Position = v_ViewPosition;

 v_Texcoord = texcoord;

}
@end



@export ecgl.sm.depth.fragment

@import clay.sm.depth.fragment

@end`);function Hs(e){return!e||e===`none`}function Us(e){return e instanceof HTMLCanvasElement||e instanceof HTMLImageElement||e instanceof Image}function Ws(e){return e.getZr&&e.setOption}var Gs=uo.prototype.addToScene,Ks=uo.prototype.removeFromScene;uo.prototype.addToScene=function(e){if(Gs.call(this,e),this.__zr){var t=this.__zr;e.traverse(function(e){e.__zr=t,e.addAnimatorsToZr&&e.addAnimatorsToZr(t)})}},uo.prototype.removeFromScene=function(e){Ks.call(this,e),e.traverse(function(e){var t=e.__zr;e.__zr=null,t&&e.removeAnimatorsFromZr&&e.removeAnimatorsFromZr(t)})},ji.prototype.setTextureImage=function(e,t,n,r){if(this.shader){var i=n.getZr(),a=this,o;return a.autoUpdateTextureStatus=!1,a.disableTexture(e),Hs(t)||(o=Q.loadTexture(t,n,r,function(t){a.enableTexture(e),i&&i.refresh()}),a.set(e,o)),o}};var Q={};Q.Renderer=Sa,Q.Node=$r,Q.Mesh=ti,Q.Shader=K,Q.Material=ji,Q.Texture=q,Q.Texture2D=J,Q.Geometry=Ba,Q.SphereGeometry=Ms,Q.PlaneGeometry=jo,Q.CubeGeometry=No,Q.AmbientLight=Ns,Q.DirectionalLight=Ps,Q.PointLight=Fs,Q.SpotLight=Is,Q.PerspectiveCamera=_o,Q.OrthographicCamera=gs,Q.Vector2=G,Q.Vector3=F,Q.Vector4=Y,Q.Quaternion=z,Q.Matrix2=zs,Q.Matrix2d=Bs,Q.Matrix3=Vs,Q.Matrix4=V,Q.Plane=Ya,Q.Ray=ro,Q.BoundingBox=Zr,Q.Frustum=to;var qs=null;function Js(){return qs===null&&(qs=ds.createBlank(`rgba(255,255,255,0)`).image),qs}function Ys(e){return 2**Math.round(Math.log(e)/Math.LN2)}function Xs(e){if((e.wrapS===q.REPEAT||e.wrapT===q.REPEAT)&&e.image){var t=Ys(e.width),n=Ys(e.height);if(t!==e.width||n!==e.height){var r=document.createElement(`canvas`);r.width=t,r.height=n,r.getContext(`2d`).drawImage(e.image,0,0,t,n),e.image=r}}}Q.loadTexture=function(e,t,n,r){typeof n==`function`&&(r=n,n={}),n||={};for(var i=Object.keys(n).sort(),a=``,o=0;o<i.length;o++)a+=i[o]+`_`+n[i[o]]+`_`;var s=t.__textureCache=t.__textureCache||new hn(20);if(Ws(e)){var c=e.__textureid__,l=s.get(a+c);if(l)l.texture.surface.setECharts(e),r&&r(l.texture);else{var u=new hs(e);u.onupdate=function(){t.getZr().refresh()},l={texture:u.getTexture()};for(var o=0;o<i.length;o++)l.texture[i[o]]=n[i[o]];c=e.__textureid__||`__ecgl_ec__`+l.texture.__uid__,e.__textureid__=c,s.put(a+c,l),r&&r(l.texture)}return l.texture}else if(Us(e)){var c=e.__textureid__,l=s.get(a+c);if(!l){l={texture:new Q.Texture2D({image:e})};for(var o=0;o<i.length;o++)l.texture[i[o]]=n[i[o]];c=e.__textureid__||`__ecgl_image__`+l.texture.__uid__,e.__textureid__=c,s.put(a+c,l),Xs(l.texture),r&&r(l.texture)}return l.texture}else{var l=s.get(a+e);if(l)l.callbacks?l.callbacks.push(r):r&&r(l.texture);else if(e.match(/.hdr$|^data:application\/octet-stream/)){l={callbacks:[r]};var d=ds.loadTexture(e,{exposure:n.exposure,fileType:`hdr`},function(){d.dirty(),l.callbacks.forEach(function(e){e&&e(d)}),l.callbacks=null});l.texture=d,s.put(a+e,l)}else{for(var d=new Q.Texture2D({image:new Image}),o=0;o<i.length;o++)d[i[o]]=n[i[o]];l={texture:d,callbacks:[r]};var f=d.image;f.onload=function(){d.image=f,Xs(d),d.dirty(),l.callbacks.forEach(function(e){e&&e(d)}),l.callbacks=null},f.crossOrigin=`Anonymous`,f.src=e,d.image=Js(),s.put(a+e,l)}return l.texture}},Q.createAmbientCubemap=function(e,t,n,r){e||={};var i=e.texture,a=js.firstNotNull(e.exposure,1),o=new ws({intensity:js.firstNotNull(e.specularIntensity,1)}),s=new Ts({intensity:js.firstNotNull(e.diffuseIntensity,1),coefficients:[.844,.712,.691,-.037,.083,.167,.343,.288,.299,-.041,-.021,-.009,-.003,-.041,-.064,-.011,-.007,-.004,-.031,.034,.081,-.06,-.049,-.06,.046,.056,.05]});return o.cubemap=Q.loadTexture(i,n,{exposure:a},function(){o.cubemap.flipY=!1,o.prefilter(t,32),s.coefficients=Es.projectEnvironmentMap(t,o.cubemap,{lod:1}),r&&r()}),{specular:o,diffuse:s}},Q.createBlankTexture=ds.createBlank,Q.isImage=Us,Q.additiveBlend=function(e){e.blendEquation(e.FUNC_ADD),e.blendFunc(e.SRC_ALPHA,e.ONE)},Q.parseColor=function(e,t){return e instanceof Array?(t||=[],t[0]=e[0],t[1]=e[1],t[2]=e[2],e.length>3?t[3]=e[3]:t[3]=1,t):(t=ft(e||`#000`,t)||[0,0,0,0],t[0]/=255,t[1]/=255,t[2]/=255,t)},Q.directionFromAlphaBeta=function(e,t){var n=e/180*Math.PI+Math.PI/2,r=-t/180*Math.PI+Math.PI/2,i=[],a=Math.sin(n);return i[0]=a*Math.cos(r),i[1]=-Math.cos(n),i[2]=a*Math.sin(r),i},Q.getShadowResolution=function(e){var t=1024;switch(e){case`low`:t=512;break;case`medium`:break;case`high`:t=2048;break;case`ultra`:t=4096;break}return t},Q.COMMON_SHADERS=[`lambert`,`color`,`realistic`,`hatching`,`shadow`],Q.createShader=function(e){e===`ecgl.shadow`&&(e=`ecgl.displayShadow`);var t=K.source(e+`.vertex`),n=K.source(e+`.fragment`);t||console.error(`Vertex shader of '%s' not exits`,e),n||console.error(`Fragment shader of '%s' not exits`,e);var r=new K(t,n);return r.name=e,r},Q.createMaterial=function(e,t){t instanceof Array||(t=[t]);var n=new ji({shader:Q.createShader(e)});return t.forEach(function(e){typeof e==`string`&&n.define(e)}),n},Q.setMaterialFromModel=function(e,t,n,r){t.autoUpdateTextureStatus=!1;var i=n.getModel(e+`Material`),a=i.get(`detailTexture`),o=js.firstNotNull(i.get(`textureTiling`),1),s=js.firstNotNull(i.get(`textureOffset`),0);typeof o==`number`&&(o=[o,o]),typeof s==`number`&&(s=[s,s]);var c=o[0]>1||o[1]>1?Q.Texture.REPEAT:Q.Texture.CLAMP_TO_EDGE,l={anisotropic:8,wrapS:c,wrapT:c};if(e===`realistic`){var u=i.get(`roughness`),d=i.get(`metalness`);d==null?d=0:isNaN(d)&&(t.setTextureImage(`metalnessMap`,d,r,l),d=js.firstNotNull(i.get(`metalnessAdjust`),.5)),u==null?u=.5:isNaN(u)&&(t.setTextureImage(`roughnessMap`,u,r,l),u=js.firstNotNull(i.get(`roughnessAdjust`),.5));var f=i.get(`normalTexture`);t.setTextureImage(`detailMap`,a,r,l),t.setTextureImage(`normalMap`,f,r,l),t.set({roughness:u,metalness:d,detailUvRepeat:o,detailUvOffset:s})}else if(e===`lambert`)t.setTextureImage(`detailMap`,a,r,l),t.set({detailUvRepeat:o,detailUvOffset:s});else if(e===`color`)t.setTextureImage(`detailMap`,a,r,l),t.set({detailUvRepeat:o,detailUvOffset:s});else if(e===`hatching`){var p=i.get(`hatchingTextures`)||[];p.length;for(var m=0;m<6;m++)t.setTextureImage(`hatch`+(m+1),p[m],r,{anisotropic:8,wrapS:Q.Texture.REPEAT,wrapT:Q.Texture.REPEAT});t.set({detailUvRepeat:o,detailUvOffset:s})}},Q.updateVertexAnimation=function(e,t,n,r){var i=r.get(`animation`),a=r.get(`animationDurationUpdate`),o=r.get(`animationEasingUpdate`),s=n.shadowDepthMaterial;if(i&&t&&a>0&&t.geometry.vertexCount===n.geometry.vertexCount){n.material.define(`vertex`,`VERTEX_ANIMATION`),n.ignorePreZ=!0,s&&s.define(`vertex`,`VERTEX_ANIMATION`);for(var c=0;c<e.length;c++)n.geometry.attributes[e[c][0]].value=t.geometry.attributes[e[c][1]].value;n.geometry.dirty(),n.__percent=0,n.material.set(`percent`,0),n.stopAnimation(),n.animate().when(a,{__percent:1}).during(function(){n.material.set(`percent`,n.__percent),s&&s.set(`percent`,n.__percent)}).done(function(){n.ignorePreZ=!1,n.material.undefine(`vertex`,`VERTEX_ANIMATION`),s&&s.undefine(`vertex`,`VERTEX_ANIMATION`)}).start(o)}else n.material.undefine(`vertex`,`VERTEX_ANIMATION`),s&&s.undefine(`vertex`,`VERTEX_ANIMATION`)};var Zs=Ir.extend({scene:null,camera:null,renderer:null},function(){this._ray=new ro,this._ndc=new G},{pick:function(e,t,n){return this.pickAll(e,t,[],n)[0]||null},pickAll:function(e,t,n,r){return this.renderer.screenToNDC(e,t,this._ndc),this.camera.castRay(this._ndc,this._ray),n||=[],this._intersectNode(this.scene,n,r||!1),n.sort(this._intersectionCompareFunc),n},_intersectNode:function(e,t,n){e instanceof ei&&e.isRenderable()&&(!e.ignorePicking||n)&&(e.mode===H.TRIANGLES&&e.geometry.isUseIndices()||e.geometry.pickByRay||e.geometry.pick)&&this._intersectRenderable(e,t);for(var r=0;r<e._children.length;r++)this._intersectNode(e._children[r],t,n)},_intersectRenderable:(function(){var e=new F,t=new F,n=new F,r=new ro,i=new V;return function(a,o){var s=a.isSkinnedMesh();r.copy(this._ray),V.invert(i,a.worldTransform),s||r.applyTransform(i);var c=a.geometry,l=s?a.skeleton.boundingBox:c.boundingBox;if(!(l&&!r.intersectBoundingBox(l))){if(c.pick){c.pick(this._ndc.x,this._ndc.y,this.renderer,this.camera,a,o);return}else if(c.pickByRay){c.pickByRay(r,a,o);return}var u=a.cullFace===H.BACK&&a.frontFace===H.CCW||a.cullFace===H.FRONT&&a.frontFace===H.CW,d,f=c.indices,p=c.attributes.position,m=c.attributes.weight,h=c.attributes.joint,g,_=[];if(!(!p||!p.value||!f)){if(s){g=a.skeleton.getSubSkinMatrices(a.__uid__,a.joints);for(var v=0;v<a.joints.length;v++){_[v]=_[v]||[];for(var y=0;y<16;y++)_[v][y]=g[v*16+y]}var b=[],x=[],S=[],C=[],w=[],T=c.attributes.skinnedPosition;(!T||!T.value)&&(c.createAttribute(`skinnedPosition`,`f`,3),T=c.attributes.skinnedPosition,T.init(c.vertexCount));for(var v=0;v<c.vertexCount;v++){p.get(v,b),m.get(v,x),h.get(v,S),x[3]=1-x[0]-x[1]-x[2],P.set(C,0,0,0);for(var y=0;y<4;y++)S[y]>=0&&x[y]>1e-4&&(P.transformMat4(w,b,_[S[y]]),P.scaleAndAdd(C,C,w,x[y]));T.set(v,C)}}for(var v=0;v<f.length;v+=3){var E=f[v],D=f[v+1],O=f[v+2],k=s?c.attributes.skinnedPosition:p;if(k.get(E,e.array),k.get(D,t.array),k.get(O,n.array),d=u?r.intersectTriangle(e,t,n,a.culling):r.intersectTriangle(e,n,t,a.culling),d){var A=new F;s?F.copy(A,d):F.transformMat4(A,d,a.worldTransform),o.push(new Zs.Intersection(d,A,a,[E,D,O],v/3,F.dist(A,this._ray.origin)))}}}}}})(),_intersectionCompareFunc:function(e,t){return e.distance-t.distance}});Zs.Intersection=function(e,t,n,r,i,a){this.point=e,this.pointWorld=t,this.target=n,this.triangle=r,this.triangleIndex=i,this.distance=a};var Qs=function(e,t){this.id=e,this.zr=t;try{this.renderer=new Sa({clearBit:0,devicePixelRatio:t.painter.dpr,preserveDrawingBuffer:!0,premultipliedAlpha:!0}),this.renderer.resize(t.painter.getWidth(),t.painter.getHeight())}catch(e){this.renderer=null,this.dom=document.createElement(`div`),this.dom.style.cssText=`position:absolute; left: 0; top: 0; right: 0; bottom: 0;`,this.dom.className=`ecgl-nowebgl`,this.dom.innerHTML=`Sorry, your browser does not support WebGL`,console.error(e);return}this.onglobalout=this.onglobalout.bind(this),t.on(`globalout`,this.onglobalout),this.dom=this.renderer.canvas;var n=this.dom.style;n.position=`absolute`,n.left=`0`,n.top=`0`,this.views=[],this._picking=new Zs({renderer:this.renderer}),this._viewsToDispose=[],this._accumulatingId=0,this._zrEventProxy=new un({shape:{x:-1,y:-1,width:2,height:2},__isGLToZRProxy:!0}),this._backgroundColor=null,this._disposed=!1};Qs.prototype.setUnpainted=function(){},Qs.prototype.addView=function(e){if(e.layer!==this){var t=this._viewsToDispose.indexOf(e);t>=0&&this._viewsToDispose.splice(t,1),this.views.push(e),e.layer=this;var n=this.zr;e.scene.traverse(function(e){e.__zr=n,e.addAnimatorsToZr&&e.addAnimatorsToZr(n)})}};function $s(e){var t=e.__zr;e.__zr=null,t&&e.removeAnimatorsFromZr&&e.removeAnimatorsFromZr(t)}Qs.prototype.removeView=function(e){if(e.layer===this){var t=this.views.indexOf(e);t>=0&&(this.views.splice(t,1),e.scene.traverse($s,this),e.layer=null,this._viewsToDispose.push(e))}},Qs.prototype.removeViewsAll=function(){this.views.forEach(function(e){e.scene.traverse($s,this),e.layer=null,this._viewsToDispose.push(e)},this),this.views.length=0},Qs.prototype.resize=function(e,t){this.renderer.resize(e,t)},Qs.prototype.clear=function(){var e=this.renderer.gl,t=this._backgroundColor||[0,0,0,0];e.clearColor(t[0],t[1],t[2],t[3]),e.depthMask(!0),e.colorMask(!0,!0,!0,!0),e.clear(e.DEPTH_BUFFER_BIT|e.COLOR_BUFFER_BIT)},Qs.prototype.clearDepth=function(){var e=this.renderer.gl;e.clear(e.DEPTH_BUFFER_BIT)},Qs.prototype.clearColor=function(){var e=this.renderer.gl;e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT)},Qs.prototype.needsRefresh=function(){this.zr.refresh()},Qs.prototype.refresh=function(e){this._backgroundColor=e?Q.parseColor(e):[0,0,0,0],this.renderer.clearColor=this._backgroundColor;for(var t=0;t<this.views.length;t++)this.views[t].prepareRender(this.renderer);this._doRender(!1),this._trackAndClean();for(var t=0;t<this._viewsToDispose.length;t++)this._viewsToDispose[t].dispose(this.renderer);this._viewsToDispose.length=0,this._startAccumulating()},Qs.prototype.renderToCanvas=function(e){this._startAccumulating(!0),e.drawImage(this.dom,0,0,e.canvas.width,e.canvas.height)},Qs.prototype._doRender=function(e){this.clear(),this.renderer.saveViewport();for(var t=0;t<this.views.length;t++)this.views[t].render(this.renderer,e);this.renderer.restoreViewport()},Qs.prototype._stopAccumulating=function(){this._accumulatingId=0,clearTimeout(this._accumulatingTimeout)};var ec=1;Qs.prototype._startAccumulating=function(e){var t=this;this._stopAccumulating();for(var n=!1,r=0;r<this.views.length;r++)n=this.views[r].needsAccumulate()||n;if(!n)return;function i(r){if(!(!t._accumulatingId||r!==t._accumulatingId)){for(var a=!0,o=0;o<t.views.length;o++)a=t.views[o].isAccumulateFinished()&&n;a||(t._doRender(!0),e?i(r):bn(function(){i(r)}))}}this._accumulatingId=ec++,e?i(t._accumulatingId):this._accumulatingTimeout=setTimeout(function(){i(t._accumulatingId)},50)},Qs.prototype._trackAndClean=function(){var e=[],t=[];this._textureList&&(tc(this._textureList),tc(this._geometriesList));for(var n=0;n<this.views.length;n++)ic(this.views[n].scene,e,t);this._textureList&&(nc(this.renderer,this._textureList),nc(this.renderer,this._geometriesList)),this._textureList=e,this._geometriesList=t};function tc(e){for(var t=0;t<e.length;t++)e[t].__used__=0}function nc(e,t){for(var n=0;n<t.length;n++)t[n].__used__||t[n].dispose(e)}function rc(e,t){e.__used__=e.__used__||0,e.__used__++,e.__used__===1&&t.push(e)}function ic(e,t,n){var r,i;e.traverse(function(e){if(e.isRenderable()){var a=e.geometry,o=e.material;if(o!==r)for(var s=o.getTextureUniforms(),c=0;c<s.length;c++){var l=s[c],u=o.uniforms[l].value;if(u){if(u instanceof q)rc(u,t);else if(u instanceof Array)for(var d=0;d<u.length;d++)u[d]instanceof q&&rc(u[d],t)}}a!==i&&rc(a,n),r=o,i=a}});for(var a=0;a<e.lights.length;a++)e.lights[a].cubemap&&rc(e.lights[a].cubemap,t)}Qs.prototype.dispose=function(){this._disposed||=(this._stopAccumulating(),this._textureList&&(tc(this._textureList),tc(this._geometriesList),nc(this.renderer,this._textureList),nc(this.renderer,this._geometriesList)),this.zr.off(`globalout`,this.onglobalout),!0)},Qs.prototype.onmousedown=function(e){if(!(e.target&&e.target.__isGLToZRProxy)){e=e.event;var t=this.pickObject(e.offsetX,e.offsetY);t&&(this._dispatchEvent(`mousedown`,e,t),this._dispatchDataEvent(`mousedown`,e,t)),this._downX=e.offsetX,this._downY=e.offsetY}},Qs.prototype.onmousemove=function(e){if(!(e.target&&e.target.__isGLToZRProxy)){e=e.event;var t=this.pickObject(e.offsetX,e.offsetY),n=t&&t.target,r=this._hovered;this._hovered=t,r&&n!==r.target&&(r.relatedTarget=n,this._dispatchEvent(`mouseout`,e,r),this.zr.setCursorStyle(`default`)),this._dispatchEvent(`mousemove`,e,t),t&&(this.zr.setCursorStyle(`pointer`),(!r||n!==r.target)&&this._dispatchEvent(`mouseover`,e,t)),this._dispatchDataEvent(`mousemove`,e,t)}},Qs.prototype.onmouseup=function(e){if(!(e.target&&e.target.__isGLToZRProxy)){e=e.event;var t=this.pickObject(e.offsetX,e.offsetY);t&&(this._dispatchEvent(`mouseup`,e,t),this._dispatchDataEvent(`mouseup`,e,t)),this._upX=e.offsetX,this._upY=e.offsetY}},Qs.prototype.onclick=Qs.prototype.dblclick=function(e){if(!(e.target&&e.target.__isGLToZRProxy)){var t=this._upX-this._downX,n=this._upY-this._downY;if(!(Math.sqrt(t*t+n*n)>20)){e=e.event;var r=this.pickObject(e.offsetX,e.offsetY);r&&(this._dispatchEvent(e.type,e,r),this._dispatchDataEvent(e.type,e,r));var i=this._clickToSetFocusPoint(e);i&&i.view.setDOFFocusOnPoint(i.distance)&&this.zr.refresh()}}},Qs.prototype._clickToSetFocusPoint=function(e){for(var t=this.renderer,n=t.viewport,r=this.views.length-1;r>=0;r--){var i=this.views[r];if(i.hasDOF()&&i.containPoint(e.offsetX,e.offsetY)){this._picking.scene=i.scene,this._picking.camera=i.camera,t.viewport=i.viewport;var a=this._picking.pick(e.offsetX,e.offsetY,!0);if(a)return a.view=i,a}}t.viewport=n},Qs.prototype.onglobalout=function(e){var t=this._hovered;t&&this._dispatchEvent(`mouseout`,e,{target:t.target})},Qs.prototype.pickObject=function(e,t){for(var n=[],r=this.renderer,i=r.viewport,a=0;a<this.views.length;a++){var o=this.views[a];o.containPoint(e,t)&&(this._picking.scene=o.scene,this._picking.camera=o.camera,r.viewport=o.viewport,this._picking.pickAll(e,t,n))}return r.viewport=i,n.sort(function(e,t){return e.distance-t.distance}),n[0]},Qs.prototype._dispatchEvent=function(e,t,n){n||={};var r=n.target;for(n.cancelBubble=!1,n.event=t,n.type=e,n.offsetX=t.offsetX,n.offsetY=t.offsetY;r&&(r.trigger(e,n),r=r.getParent(),!n.cancelBubble););this._dispatchToView(e,n)},Qs.prototype._dispatchDataEvent=function(e,t,n){var r=n&&n.target,i=r&&r.dataIndex,a=r&&r.seriesIndex,o=r&&r.eventData,s=!1,c=this._zrEventProxy;c.x=t.offsetX,c.y=t.offsetY,c.update();var l={target:c};let u=_(c);e===`mousemove`&&(i==null?o!=null&&o!==this._lastEventData&&(this._lastEventData!=null&&(u.eventData=this._lastEventData,this.zr.handler.dispatchToElement(l,`mouseout`,t)),s=!0):i!==this._lastDataIndex&&(parseInt(this._lastDataIndex,10)>=0&&(u.dataIndex=this._lastDataIndex,u.seriesIndex=this._lastSeriesIndex,this.zr.handler.dispatchToElement(l,`mouseout`,t)),s=!0),this._lastEventData=o,this._lastDataIndex=i,this._lastSeriesIndex=a),u.eventData=o,u.dataIndex=i,u.seriesIndex=a,(o!=null||parseInt(i,10)>=0&&parseInt(a,10)>=0)&&(this.zr.handler.dispatchToElement(l,e,t),s&&this.zr.handler.dispatchToElement(l,`mouseover`,t))},Qs.prototype._dispatchToView=function(e,t){for(var n=0;n<this.views.length;n++)this.views[n].containPoint(t.offsetX,t.offsetY)&&this.views[n].trigger(e,t)},Object.assign(Qs.prototype,Mr);var ac=[`bar3D`,`line3D`,`map3D`,`scatter3D`,`surface`,`lines3D`,`scatterGL`,`scatter3D`];function oc(e,t){if(e&&e[t]&&(e[t].normal||e[t].emphasis)){var n=e[t].normal,r=e[t].emphasis;n&&(e[t]=n),r&&(e.emphasis=e.emphasis||{},e.emphasis[t]=r)}}function sc(e){oc(e,`itemStyle`),oc(e,`lineStyle`),oc(e,`areaStyle`),oc(e,`label`)}function cc(e){e&&(e instanceof Array||(e=[e]),g(e,function(e){if(e.axisLabel){var t=e.axisLabel;Object.assign(t,t.textStyle),t.textStyle=null}}))}function lc(e){g(e.series,function(t){st(ac,t.type)>=0&&(sc(t),t.coordinateSystem===`mapbox`&&(t.coordinateSystem=`mapbox3D`,e.mapbox3D=e.mapbox))}),cc(e.xAxis3D),cc(e.yAxis3D),cc(e.zAxis3D),cc(e.grid3D),oc(e.geo3D)}function uc(e,t,n){try{return Object.defineProperty(e,t,{value:n,configurable:!0,writable:!0}),!0}catch{}try{return Reflect.set(e,t,n)}catch{}return!1}var dc=Tr;uc(dc,`graphicGL`,Q);function fc(e){this._layers={},this._zr=e}fc.prototype.update=function(e,t){var n=this,r=t.getZr();if(!r.getWidth()||!r.getHeight()){console.warn(`Dom has no width or height`);return}function i(e){r.setSleepAfterStill(0);var t=(e.coordinateSystem&&e.coordinateSystem.model,e.get(`zlevel`)),i=n._layers,a=i[t];if(!a){if(a=i[t]=new Qs(`gl-`+t,r),r.painter.isSingleCanvas()){a.virtual=!0;var o=new dc.graphic.Image({z:1e4,style:{image:a.renderer.canvas},silent:!0});a.__hostImage=o,r.add(o)}r.painter.insertLayer(t,a)}return a.__hostImage&&a.__hostImage.setStyle({width:a.renderer.getWidth(),height:a.renderer.getHeight()}),a}function a(e,t){e&&e.traverse(function(e){e.isRenderable&&e.isRenderable()&&(e.ignorePicking=e.$ignorePicking==null?t:e.$ignorePicking)})}for(var o in this._layers)this._layers[o].removeViewsAll();e.eachComponent(function(n,r){if(n!==`series`){var o=t.getViewOfComponentModel(r),s=r.coordinateSystem;if(o.__ecgl__){var c;if(s){if(!s.viewGL){console.error(`Can't find viewGL in coordinateSystem of component `+r.id);return}c=s.viewGL}else{if(!r.viewGL){console.error(`Can't find viewGL of component `+r.id);return}c=s.viewGL}var c=s.viewGL,l=i(r);l.addView(c),o.afterRender&&o.afterRender(r,e,t,l),a(o.groupGL,r.get(`silent`))}}}),e.eachSeries(function(n){var r=t.getViewOfSeriesModel(n),o=n.coordinateSystem;if(r.__ecgl__){if(o&&!o.viewGL&&!r.viewGL){console.error(`Can't find viewGL of series `+r.id);return}var s=o&&o.viewGL||r.viewGL,c=i(n);c.addView(s),r.afterRender&&r.afterRender(n,e,t,c),a(r.groupGL,n.get(`silent`))}})},dc.registerPostInit(function(e){var t=e.getZr(),n=t.painter.dispose;t.painter.dispose=function(){typeof this.eachOtherLayer==`function`&&this.eachOtherLayer(function(e){e instanceof Qs&&e.dispose()}),n.call(this)}}),dc.registerPostUpdate(function(e,t){var n=t.getZr();(n.__egl=n.__egl||new fc(n)).update(e,t)}),dc.registerPreprocessor(lc);var pc={vec2:W,vec3:P,vec4:I,mat2:X,mat2d:Z,mat3:L,mat4:B,quat:R},mc={};mc.getFormattedLabel=function(e,t,n,r,i){n||=`normal`;var a=e.getData(r).getItemModel(t),o=e.getDataParams(t,r);i!=null&&o.value instanceof Array&&(o.value=o.value[i]);var s=a.get(n===`normal`?[`label`,`formatter`]:[`emphasis`,`label`,`formatter`]);s??=a.get([`label`,`formatter`]);var c;return typeof s==`function`?(o.status=n,c=s(o)):typeof s==`string`&&(c=y(s,o)),c},mc.normalizeToArray=function(e){return e instanceof Array?e:e==null?[]:[e]};function hc(e){let t=e.getVisual(`style`);if(t)return t[e.getVisual(`drawType`)]}function gc(e){return e.getVisual(`style`).opacity}function _c(e,t){let n=e.getItemVisual(t,`style`);if(n)return n[e.getVisual(`drawType`)]}function vc(e,t){let n=e.getItemVisual(t,`style`);return n&&n.opacity}function yc(e,t){var n=[];return g(e.dimensions,function(r){var i=e.getDimensionInfo(r),a=i.otherDims[t];a!=null&&a!==!1&&(n[a]=i.name)}),n}function bc(e,t,n){function r(e){var r=!0,a=[],o=yc(i,`tooltip`);o.length?g(o,function(e){s(i.get(e,t),e)}):g(e,s);function s(e,t){var o=i.getDimensionInfo(t);if(!(!o||o.otherDims.tooltip===!1)){var s=o.type,c=(r?`- `+(o.tooltipName||o.name)+`: `:``)+(s===`ordinal`?e+``:s===`time`?n?``:Pt(`yyyy/MM/dd hh:mm:ss`,e):re(e));c&&a.push(Mt(c))}}return(r?`<br/>`:``)+a.join(r?`<br/>`:`, `)}var i=e.getData(),a=e.getRawValue(t),o=on(a)?r(a):Mt(re(a)),s=i.getName(t),c=_c(i,t);bt(c)&&c.colorStops&&(c=(c.colorStops[0]||{}).color),c||=`transparent`;var l=Ee(c),u=e.name;return u===`\0-`&&(u=``),u=u?Mt(u)+(n?`: `:`<br/>`):``,n?l+u+o:u+l+(s?Mt(s)+`: `+o:o)}function xc(e,t,n){n||=e.getSource();var r=t||Vt(e.get(`coordinateSystem`))||[`x`,`y`,`z`],i=nn(n,{dimensionsDefine:n.dimensionsDefine||e.get(`dimensions`),encodeDefine:n.encodeDefine||e.get(`encode`),coordDimensions:r.map(function(t){var n=e.getReferringComponents(t+`Axis3D`).models[0];return{type:n&&n.get(`type`)===`category`?`ordinal`:`float`,name:t}})});e.get(`coordinateSystem`)===`cartesian3D`&&i.forEach(function(t){if(r.indexOf(t.coordDim)>=0){var n=e.getReferringComponents(t.coordDim+`Axis3D`).models[0];n&&n.get(`type`)===`category`&&(t.ordinalMeta=n.getOrdinalMeta())}});var a=Zn.enableDataStack(e,i,{byIndex:!0,stackedCoordDimension:`z`}),o=new lt(i,e);return o.setCalculationInfo(a),o.initData(n),o}var Sc={convertToDynamicArray:function(e){e&&this.resetOffset();var t=this.attributes;for(var n in t)e||!t[n].value?t[n].value=[]:t[n].value=Array.prototype.slice.call(t[n].value);e||!this.indices?this.indices=[]:this.indices=Array.prototype.slice.call(this.indices)},convertToTypedArray:function(){var e=this.attributes;for(var t in e)e[t].value&&e[t].value.length>0?e[t].value=new Float32Array(e[t].value):e[t].value=null;this.indices&&this.indices.length>0&&(this.indices=this.vertexCount>65535?new Uint32Array(this.indices):new Uint16Array(this.indices)),this.dirty()}};function Cc(e,t,n){var r=e[t];e[t]=e[n],e[n]=r}function wc(e,t,n,r,i){var a=n,o=e[t];Cc(e,t,r);for(var s=n;s<r;s++)i(e[s],o)<0&&(Cc(e,s,a),a++);return Cc(e,r,a),a}function Tc(e,t,n,r){if(n<r){var i=wc(e,Math.floor((n+r)/2),n,r,t);Tc(e,t,n,i-1),Tc(e,t,i+1,r)}}function Ec(){this._parts=[]}Ec.prototype.step=function(e,t,n){var r=e.length;if(n===0){this._parts=[],this._sorted=!1;var i=Math.floor(r/2);this._parts.push({pivot:i,left:0,right:r-1}),this._currentSortPartIdx=0}if(!this._sorted){var a=this._parts;if(a.length===0)return this._sorted=!0,!0;if(a.length<512){for(var o=0;o<a.length;o++)a[o].pivot=wc(e,a[o].pivot,a[o].left,a[o].right,t);for(var s=[],o=0;o<a.length;o++){var c=a[o].left,l=a[o].pivot-1;l>c&&s.push({pivot:Math.floor((l+c)/2),left:c,right:l});var c=a[o].pivot+1,l=a[o].right;l>c&&s.push({pivot:Math.floor((l+c)/2),left:c,right:l})}a=this._parts=s}else for(var o=0;o<Math.floor(a.length/10);o++){var u=a.length-1-this._currentSortPartIdx;if(Tc(e,t,a[u].left,a[u].right),this._currentSortPartIdx++,this._currentSortPartIdx===a.length)return this._sorted=!0,!0}return!1}},Ec.sort=Tc;function Dc(e,t,n,r,i,a,o){this._zr=e,this._x=0,this._y=0,this._rowHeight=0,this.width=r,this.height=i,this.offsetX=t,this.offsetY=n,this.dpr=o,this.gap=a}Dc.prototype={constructor:Dc,clear:function(){this._x=0,this._y=0,this._rowHeight=0},add:function(e,t,n){var r=e.getBoundingRect();t??=r.width,n??=r.height,t*=this.dpr,n*=this.dpr,this._fitElement(e,t,n);var i=this._x,a=this._y,o=this.width*this.dpr,s=this.height*this.dpr,c=this.gap;if(i+t+c>o&&(i=this._x=0,a+=this._rowHeight+c,this._y=a,this._rowHeight=0),this._x+=t+c,this._rowHeight=Math.max(this._rowHeight,n),a+n+c>s)return null;e.x+=this.offsetX*this.dpr+i,e.y+=this.offsetY*this.dpr+a,this._zr.add(e);var l=[this.offsetX/this.width,this.offsetY/this.height];return[[i/o+l[0],a/s+l[1]],[(i+t)/o+l[0],(a+n)/s+l[1]]]},_fitElement:function(e,t,n){var r=e.getBoundingRect(),i=t/r.width,a=n/r.height;e.x=-r.x*i,e.y=-r.y*a,e.scaleX=i,e.scaleY=a,e.update()}};function Oc(e){e||={},e.width=e.width||512,e.height=e.height||512,e.devicePixelRatio=e.devicePixelRatio||1,e.gap=e.gap==null?2:e.gap;var t=document.createElement(`canvas`);t.width=e.width*e.devicePixelRatio,t.height=e.height*e.devicePixelRatio,this._canvas=t,this._texture=new J({image:t,flipY:!1});var n=this;this._zr=xe(t),fs(this._zr,function(){n._texture.dirty(),n.onupdate&&n.onupdate()}),this._dpr=e.devicePixelRatio,this._coords={},this.onupdate=e.onupdate,this._gap=e.gap,this._textureAtlasNodes=[new Dc(this._zr,0,0,e.width,e.height,this._gap,this._dpr)],this._nodeWidth=e.width,this._nodeHeight=e.height,this._currentNodeIdx=0}Oc.prototype={clear:function(){for(var e=0;e<this._textureAtlasNodes.length;e++)this._textureAtlasNodes[e].clear();this._currentNodeIdx=0,this._zr.clear(),this._coords={}},getWidth:function(){return this._width},getHeight:function(){return this._height},getTexture:function(){return this._texture},getDevicePixelRatio:function(){return this._dpr},getZr:function(){return this._zr},_getCurrentNode:function(){return this._textureAtlasNodes[this._currentNodeIdx]},_expand:function(){if(this._currentNodeIdx++,this._textureAtlasNodes[this._currentNodeIdx])return this._textureAtlasNodes[this._currentNodeIdx];var e=4096/this._dpr,t=this._textureAtlasNodes.length,n=t*this._nodeWidth%e,r=Math.floor(t*this._nodeWidth/e)*this._nodeHeight;if(!(r>=e)){var i=(n+this._nodeWidth)*this._dpr,a=(r+this._nodeHeight)*this._dpr;try{this._zr.resize({width:i,height:a})}catch{this._canvas.width=i,this._canvas.height=a}var o=new Dc(this._zr,n,r,this._nodeWidth,this._nodeHeight,this._gap,this._dpr);return this._textureAtlasNodes.push(o),o}},add:function(e,t,n){if(this._coords[e.id])return this._coords[e.id];var r=this._getCurrentNode().add(e,t,n);if(!r){var i=this._expand();if(!i)return;r=i.add(e,t,n)}return this._coords[e.id]=r,r},getCoordsScale:function(){var e=this._dpr;return[this._nodeWidth/this._canvas.width*e,this._nodeHeight/this._canvas.height*e]},getCoords:function(e){return this._coords[e]},dispose:function(){this._zr.dispose()}};var kc=[0,1,2,0,2,3],Ac=Ba.extend(function(){return{attributes:{position:new Ba.Attribute(`position`,`float`,3,`POSITION`),texcoord:new Ba.Attribute(`texcoord`,`float`,2,`TEXCOORD_0`),offset:new Ba.Attribute(`offset`,`float`,2),color:new Ba.Attribute(`color`,`float`,4,`COLOR`)}}},{resetOffset:function(){this._vertexOffset=0,this._faceOffset=0},setSpriteCount:function(e){this._spriteCount=e;var t=e*4,n=e*2;this.vertexCount!==t&&(this.attributes.position.init(t),this.attributes.offset.init(t),this.attributes.color.init(t)),this.triangleCount!==n&&(this.indices=t>65535?new Uint32Array(n*3):new Uint16Array(n*3))},setSpriteAlign:function(e,t,n,r,i){n??=`left`,r??=`top`;var a,o,s,c;switch(i||=0,n){case`left`:a=i,s=t[0]+i;break;case`center`:case`middle`:a=-t[0]/2,s=t[0]/2;break;case`right`:a=-t[0]-i,s=-i;break}switch(r){case`bottom`:o=i,c=t[1]+i;break;case`middle`:o=-t[1]/2,c=t[1]/2;break;case`top`:o=-t[1]-i,c=-i;break}var l=e*4,u=this.attributes.offset;u.set(l,[a,c]),u.set(l+1,[s,c]),u.set(l+2,[s,o]),u.set(l+3,[a,o])},addSprite:function(e,t,n,r,i,a){var o=this._vertexOffset;this.setSprite(this._vertexOffset/4,e,t,n,r,i,a);for(var s=0;s<kc.length;s++)this.indices[this._faceOffset*3+s]=kc[s]+o;return this._faceOffset+=2,this._vertexOffset+=4,o/4},setSprite:function(e,t,n,r,i,a,o){for(var s=e*4,c=this.attributes,l=0;l<4;l++)c.position.set(s+l,t);var u=c.texcoord;u.set(s,[r[0][0],r[0][1]]),u.set(s+1,[r[1][0],r[0][1]]),u.set(s+2,[r[1][0],r[1][1]]),u.set(s+3,[r[0][0],r[1][1]]),this.setSpriteAlign(e,n,i,a,o)}});Ve(Ac.prototype,Sc),Q.Shader.import(`@export ecgl.labels.vertex

attribute vec3 position: POSITION;
attribute vec2 texcoord: TEXCOORD_0;
attribute vec2 offset;
#ifdef VERTEX_COLOR
attribute vec4 a_Color : COLOR;
varying vec4 v_Color;
#endif

uniform mat4 worldViewProjection : WORLDVIEWPROJECTION;
uniform vec4 viewport : VIEWPORT;

varying vec2 v_Texcoord;

void main()
{
 vec4 proj = worldViewProjection * vec4(position, 1.0);

 vec2 screen = (proj.xy / abs(proj.w) + 1.0) * 0.5 * viewport.zw;

 screen += offset;

 proj.xy = (screen / viewport.zw - 0.5) * 2.0 * abs(proj.w);
 gl_Position = proj;
#ifdef VERTEX_COLOR
 v_Color = a_Color;
#endif
 v_Texcoord = texcoord;
}
@end


@export ecgl.labels.fragment

uniform vec3 color : [1.0, 1.0, 1.0];
uniform float alpha : 1.0;
uniform sampler2D textureAtlas;
uniform vec2 uvScale: [1.0, 1.0];

#ifdef VERTEX_COLOR
varying vec4 v_Color;
#endif
varying float v_Miter;

varying vec2 v_Texcoord;

void main()
{
 gl_FragColor = vec4(color, alpha) * texture2D(textureAtlas, v_Texcoord * uvScale);
#ifdef VERTEX_COLOR
 gl_FragColor *= v_Color;
#endif
}

@end`);var jc=Q.Mesh.extend(function(){return{geometry:new Ac({dynamic:!0}),material:new Q.Material({shader:Q.createShader(`ecgl.labels`),transparent:!0,depthMask:!1}),culling:!1,castShadow:!1,ignorePicking:!0}}),Mc=1,Nc=2;function Pc(e,t,n){this._labelsMesh=new jc,this._labelTextureSurface=new Oc({width:512,height:512,devicePixelRatio:n.getDevicePixelRatio(),onupdate:function(){n.getZr().refresh()}}),this._api=n,this._labelsMesh.material.set(`textureAtlas`,this._labelTextureSurface.getTexture())}Pc.prototype.getLabelPosition=function(e,t,n){return[0,0,0]},Pc.prototype.getLabelDistance=function(e,t,n){return 0},Pc.prototype.getMesh=function(){return this._labelsMesh},Pc.prototype.updateData=function(e,t,n){t??=0,n??=e.count(),(!this._labelsVisibilitiesBits||this._labelsVisibilitiesBits.length!==n-t)&&(this._labelsVisibilitiesBits=new Uint8Array(n-t));for(var r=[`label`,`show`],i=[`emphasis`,`label`,`show`],a=t;a<n;a++){var o=e.getItemModel(a),s=o.get(r),c=o.get(i);c??=s;var l=(s?Mc:0)|(c?Nc:0);this._labelsVisibilitiesBits[a-t]=l}this._start=t,this._end=n,this._data=e},Pc.prototype.updateLabels=function(e){if(this._data){e||=[];for(var t=e.length>0,n={},r=0;r<e.length;r++)n[e[r]]=!0;this._labelsMesh.geometry.convertToDynamicArray(!0),this._labelTextureSurface.clear();for(var i=[`label`],a=[`emphasis`,`label`],o=this._data.hostModel,s=this._data,c=o.getModel(i),l=o.getModel(a,c),u={left:`right`,right:`left`,top:`center`,bottom:`center`},d={left:`middle`,right:`middle`,top:`bottom`,bottom:`top`},f=this._start;f<this._end;f++){var p=!1;if(t&&n[f]&&(p=!0),this._labelsVisibilitiesBits[f-this._start]&(p?Nc:Mc)){var m=s.getItemModel(f).getModel(p?a:i,p?l:c),h=m.get(`distance`)||0,g=m.get(`position`),_=this._api.getDevicePixelRatio(),v=o.getFormattedLabel(f,p?`emphasis`:`normal`);if(v==null||v===``)return;var y=new _t({style:de(m,{text:v,fill:m.get(`color`)||_c(s,f)||`#000`,align:`left`,verticalAlign:`top`,opacity:js.firstNotNull(m.get(`opacity`),vc(s,f),1)})}),b=y.getBoundingRect();b.height*=1.2;var x=this._labelTextureSurface.add(y),S=u[g]||`center`,C=d[g]||`bottom`;this._labelsMesh.geometry.addSprite(this.getLabelPosition(f,g,h),[b.width*_,b.height*_],x,S,C,this.getLabelDistance(f,g,h)*_)}}this._labelsMesh.material.set(`uvScale`,this._labelTextureSurface.getCoordsScale()),this._labelTextureSurface.getZr().refreshImmediately(),this._labelsMesh.geometry.convertToTypedArray(),this._labelsMesh.geometry.dirty()}},Pc.prototype.dispose=function(){this._labelTextureSurface.dispose()};var Fc=pc.vec3,Ic=[[0,0],[1,1]],Lc=Ba.extend(function(){return{segmentScale:1,dynamic:!0,useNativeLine:!0,attributes:{position:new Ba.Attribute(`position`,`float`,3,`POSITION`),positionPrev:new Ba.Attribute(`positionPrev`,`float`,3),positionNext:new Ba.Attribute(`positionNext`,`float`,3),prevPositionPrev:new Ba.Attribute(`prevPositionPrev`,`float`,3),prevPosition:new Ba.Attribute(`prevPosition`,`float`,3),prevPositionNext:new Ba.Attribute(`prevPositionNext`,`float`,3),offset:new Ba.Attribute(`offset`,`float`,1),color:new Ba.Attribute(`color`,`float`,4,`COLOR`)}}},{resetOffset:function(){this._vertexOffset=0,this._triangleOffset=0,this._itemVertexOffsets=[]},setVertexCount:function(e){var t=this.attributes;this.vertexCount!==e&&(t.position.init(e),t.color.init(e),this.useNativeLine||(t.positionPrev.init(e),t.positionNext.init(e),t.offset.init(e)),e>65535?this.indices instanceof Uint16Array&&(this.indices=new Uint32Array(this.indices)):this.indices instanceof Uint32Array&&(this.indices=new Uint16Array(this.indices)))},setTriangleCount:function(e){this.triangleCount!==e&&(e===0?this.indices=null:this.indices=this.vertexCount>65535?new Uint32Array(e*3):new Uint16Array(e*3))},_getCubicCurveApproxStep:function(e,t,n,r){return 1/(Fc.dist(e,t)+Fc.dist(n,t)+Fc.dist(r,n)+1)*this.segmentScale},getCubicCurveVertexCount:function(e,t,n,r){var i=this._getCubicCurveApproxStep(e,t,n,r),a=Math.ceil(1/i);return this.useNativeLine?a*2:a*2+2},getCubicCurveTriangleCount:function(e,t,n,r){var i=this._getCubicCurveApproxStep(e,t,n,r),a=Math.ceil(1/i);return this.useNativeLine?0:a*2},getLineVertexCount:function(){return this.getPolylineVertexCount(Ic)},getLineTriangleCount:function(){return this.getPolylineTriangleCount(Ic)},getPolylineVertexCount:function(e){var t=typeof e==`number`?e:typeof e[0]==`number`?e.length/3:e.length;return this.useNativeLine?(t-1)*2:(t-1)*2+2},getPolylineTriangleCount:function(e){var t=typeof e==`number`?e:typeof e[0]==`number`?e.length/3:e.length;return this.useNativeLine?0:Math.max(t-1,0)*2},addCubicCurve:function(e,t,n,r,i,a){a??=1;for(var o=e[0],s=e[1],c=e[2],l=t[0],u=t[1],d=t[2],f=n[0],p=n[1],m=n[2],h=r[0],g=r[1],_=r[2],v=this._getCubicCurveApproxStep(e,t,n,r),y=v*v,b=y*v,x=3*v,S=3*y,C=6*y,w=6*b,T=o-l*2+f,E=s-u*2+p,D=c-d*2+m,O=(l-f)*3-o+h,k=(u-p)*3-s+g,A=(d-m)*3-c+_,j=o,M=s,N=c,ee=(l-o)*x+T*S+O*b,te=(u-s)*x+E*S+k*b,ne=(d-c)*x+D*S+A*b,re=T*C+O*w,ie=E*C+k*w,ae=D*C+A*w,oe=O*w,se=k*w,ce=A*w,le=0,ue=0,de=Math.ceil(1/v),fe=new Float32Array((de+1)*3),fe=[],pe=0,ue=0;ue<de+1;ue++)fe[pe++]=j,fe[pe++]=M,fe[pe++]=N,j+=ee,M+=te,N+=ne,ee+=re,te+=ie,ne+=ae,re+=oe,ie+=se,ae+=ce,le+=v,le>1&&(j=ee>0?Math.min(j,h):Math.max(j,h),M=te>0?Math.min(M,g):Math.max(M,g),N=ne>0?Math.min(N,_):Math.max(N,_));return this.addPolyline(fe,i,a)},addLine:function(e,t,n,r){return this.addPolyline([e,t],n,r)},addPolyline:function(e,t,n,r,i){if(e.length){var a=typeof e[0]!=`number`;if(i??=a?e.length:e.length/3,!(i<2)){r??=0,n??=1,this._itemVertexOffsets.push(this._vertexOffset);var a=typeof e[0]!=`number`,o=a?typeof t[0]!=`number`:t.length/4===i,s=this.attributes.position,c=this.attributes.positionPrev,l=this.attributes.positionNext,u=this.attributes.color,d=this.attributes.offset,f=this.indices,p=this._vertexOffset,m,h;n=Math.max(n,.01);for(var g=r;g<i;g++){if(a)m=e[g],h=o?t[g]:t;else{var _=g*3;if(m||=[],m[0]=e[_],m[1]=e[_+1],m[2]=e[_+2],o){var v=g*4;h||=[],h[0]=t[v],h[1]=t[v+1],h[2]=t[v+2],h[3]=t[v+3]}else h=t}if(this.useNativeLine?g>1&&(s.copy(p,p-1),u.copy(p,p-1),p++):(g<i-1&&(c.set(p+2,m),c.set(p+3,m)),g>0&&(l.set(p-2,m),l.set(p-1,m)),s.set(p,m),s.set(p+1,m),u.set(p,h),u.set(p+1,h),d.set(p,n/2),d.set(p+1,-n/2),p+=2),this.useNativeLine)u.set(p,h),s.set(p,m),p++;else if(g>0){var y=this._triangleOffset*3,f=this.indices;f[y]=p-4,f[y+1]=p-3,f[y+2]=p-2,f[y+3]=p-3,f[y+4]=p-1,f[y+5]=p-2,this._triangleOffset+=2}}if(!this.useNativeLine){var b=this._vertexOffset,x=this._vertexOffset+i*2;c.copy(b,b+2),c.copy(b+1,b+3),l.copy(x-1,x-3),l.copy(x-2,x-4)}return this._vertexOffset=p,this._vertexOffset}}},setItemColor:function(e,t){for(var n=this._itemVertexOffsets[e],r=e<this._itemVertexOffsets.length-1?this._itemVertexOffsets[e+1]:this._vertexOffset,i=n;i<r;i++)this.attributes.color.set(i,t);this.dirty(`color`)},currentTriangleOffset:function(){return this._triangleOffset},currentVertexOffset:function(){return this._vertexOffset}});Ve(Lc.prototype,Sc);var Rc=`@export ecgl.lines3D.vertex

uniform mat4 worldViewProjection : WORLDVIEWPROJECTION;

attribute vec3 position: POSITION;
attribute vec4 a_Color : COLOR;
varying vec4 v_Color;

void main()
{
 gl_Position = worldViewProjection * vec4(position, 1.0);
 v_Color = a_Color;
}

@end

@export ecgl.lines3D.fragment

uniform vec4 color : [1.0, 1.0, 1.0, 1.0];

varying vec4 v_Color;

@import clay.util.srgb

void main()
{
#ifdef SRGB_DECODE
 gl_FragColor = sRGBToLinear(color * v_Color);
#else
 gl_FragColor = color * v_Color;
#endif
}
@end



@export ecgl.lines3D.clipNear

vec4 clipNear(vec4 p1, vec4 p2) {
 float n = (p1.w - near) / (p1.w - p2.w);
 return vec4(mix(p1.xy, p2.xy, n), -near, near);
}

@end

@export ecgl.lines3D.expandLine
#ifdef VERTEX_ANIMATION
 vec4 prevProj = worldViewProjection * vec4(mix(prevPositionPrev, positionPrev, percent), 1.0);
 vec4 currProj = worldViewProjection * vec4(mix(prevPosition, position, percent), 1.0);
 vec4 nextProj = worldViewProjection * vec4(mix(prevPositionNext, positionNext, percent), 1.0);
#else
 vec4 prevProj = worldViewProjection * vec4(positionPrev, 1.0);
 vec4 currProj = worldViewProjection * vec4(position, 1.0);
 vec4 nextProj = worldViewProjection * vec4(positionNext, 1.0);
#endif

 if (currProj.w < 0.0) {
 if (nextProj.w > 0.0) {
 currProj = clipNear(currProj, nextProj);
 }
 else if (prevProj.w > 0.0) {
 currProj = clipNear(currProj, prevProj);
 }
 }

 vec2 prevScreen = (prevProj.xy / abs(prevProj.w) + 1.0) * 0.5 * viewport.zw;
 vec2 currScreen = (currProj.xy / abs(currProj.w) + 1.0) * 0.5 * viewport.zw;
 vec2 nextScreen = (nextProj.xy / abs(nextProj.w) + 1.0) * 0.5 * viewport.zw;

 vec2 dir;
 float len = offset;
 if (position == positionPrev) {
 dir = normalize(nextScreen - currScreen);
 }
 else if (position == positionNext) {
 dir = normalize(currScreen - prevScreen);
 }
 else {
 vec2 dirA = normalize(currScreen - prevScreen);
 vec2 dirB = normalize(nextScreen - currScreen);

 vec2 tanget = normalize(dirA + dirB);

 float miter = 1.0 / max(dot(tanget, dirA), 0.5);
 len *= miter;
 dir = tanget;
 }

 dir = vec2(-dir.y, dir.x) * len;
 currScreen += dir;

 currProj.xy = (currScreen / viewport.zw - 0.5) * 2.0 * abs(currProj.w);
@end


@export ecgl.meshLines3D.vertex

attribute vec3 position: POSITION;
attribute vec3 positionPrev;
attribute vec3 positionNext;
attribute float offset;
attribute vec4 a_Color : COLOR;

#ifdef VERTEX_ANIMATION
attribute vec3 prevPosition;
attribute vec3 prevPositionPrev;
attribute vec3 prevPositionNext;
uniform float percent : 1.0;
#endif

uniform mat4 worldViewProjection : WORLDVIEWPROJECTION;
uniform vec4 viewport : VIEWPORT;
uniform float near : NEAR;

varying vec4 v_Color;

@import ecgl.common.wireframe.vertexHeader

@import ecgl.lines3D.clipNear

void main()
{
 @import ecgl.lines3D.expandLine

 gl_Position = currProj;

 v_Color = a_Color;

 @import ecgl.common.wireframe.vertexMain
}
@end


@export ecgl.meshLines3D.fragment

uniform vec4 color : [1.0, 1.0, 1.0, 1.0];

varying vec4 v_Color;

@import ecgl.common.wireframe.fragmentHeader

@import clay.util.srgb

void main()
{
#ifdef SRGB_DECODE
 gl_FragColor = sRGBToLinear(color * v_Color);
#else
 gl_FragColor = color * v_Color;
#endif

 @import ecgl.common.wireframe.fragmentMain
}

@end`,zc=He.extend({type:`series.scatter3D`,dependencies:[`globe`,`grid3D`,`geo3D`],visualStyleAccessPath:`itemStyle`,hasSymbolVisual:!0,getInitialData:function(e,t){return xc(this)},getFormattedLabel:function(e,t,n,r){var i=mc.getFormattedLabel(this,e,t,n,r);if(i==null){var a=this.getData(),o=a.dimensions[a.dimensions.length-1];i=a.get(o,e)}return i},formatTooltip:function(e){return bc(this,e)},defaultOption:{coordinateSystem:`cartesian3D`,zlevel:-10,progressive:1e5,progressiveThreshold:1e5,grid3DIndex:0,globeIndex:0,symbol:`circle`,symbolSize:10,blendMode:`source-over`,label:{show:!1,position:`right`,distance:5,textStyle:{fontSize:14,color:`#000`,backgroundColor:`rgba(255,255,255,0.7)`,padding:3,borderRadius:3}},itemStyle:{opacity:.8},emphasis:{label:{show:!0}},animationDurationUpdate:500}});function Bc(e,t,n){var t=t||document.createElement(`canvas`);t.width=e,t.height=e;var r=t.getContext(`2d`);return n&&n(r),t}function Vc(e,t,n,r){on(t)||(t=[t,t]);var i=Uc.getMarginByStyle(n,r),a=t[0]+i.left+i.right,o=t[1]+i.top+i.bottom,s=ge(e,0,0,t[0],t[1]),c=Math.max(a,o);s.x=i.left,s.y=i.top,a>o?s.y+=(c-o)/2:s.x+=(c-a)/2;var l=s.getBoundingRect();return s.x-=l.x,s.y-=l.y,s.setStyle(n),s.update(),s.__size=c,s}function Hc(e,t,n){var r=t.width,i=t.height,a=e.canvas.width,o=e.canvas.height,s=r/a,c=i/o;function l(e){return e<128?1:-1}function u(e,a){var o=1/0;e=Math.floor(e*s),a=Math.floor(a*c);for(var u=a*r+e,d=t.data[u*4],f=l(d),p=Math.max(a-n,0);p<Math.min(a+n,i);p++)for(var m=Math.max(e-n,0);m<Math.min(e+n,r);m++){var u=p*r+m,h=t.data[u*4],g=l(h),_=m-e,v=p-a;if(f!==g){var y=_*_+v*v;y<o&&(o=y)}}return f*Math.sqrt(o)}for(var d=e.createImageData(a,o),f=0;f<o;f++)for(var p=0;p<a;p++){var m=u(p,f)/n*.5+.5,h=(f*a+p)*4;d.data[h++]=(1-m)*255,d.data[h++]=(1-m)*255,d.data[h++]=(1-m)*255,d.data[h++]=255}return d}var Uc={getMarginByStyle:function(e){var t=e.minMargin||0,n=0;e.stroke&&e.stroke!==`none`&&(n=e.lineWidth==null?1:e.lineWidth);var r=e.shadowBlur||0,i=e.shadowOffsetX||0,a=e.shadowOffsetY||0,o={};return o.left=Math.max(n/2,-i+r,t),o.right=Math.max(n/2,i+r,t),o.top=Math.max(n/2,-a+r,t),o.bottom=Math.max(n/2,a+r,t),o},createSymbolSprite:function(e,t,n,r){var i=Vc(e,t,n),a=Uc.getMarginByStyle(n);return{image:Bc(i.__size,r,function(e){le(e,i)}),margin:a}},createSDFFromCanvas:function(e,t,n,r){return Bc(t,r,function(t){var r=e.getContext(`2d`).getImageData(0,0,e.width,e.height);t.putImageData(Hc(t,r,n),0,0)})},createSimpleSprite:function(e,t){return Bc(e,t,function(t){var n=e/2;t.beginPath(),t.arc(n,n,60,0,Math.PI*2,!1),t.closePath();var r=t.createRadialGradient(n,n,0,n,n,n);r.addColorStop(0,`rgba(255, 255, 255, 1)`),r.addColorStop(.5,`rgba(255, 255, 255, 0.5)`),r.addColorStop(1,`rgba(255, 255, 255, 0)`),t.fillStyle=r,t.fill()})}},Wc=pc.vec3,Gc={needsSortVertices:function(){return this.sortVertices},needsSortVerticesProgressively:function(){return this.needsSortVertices()&&this.vertexCount>=2e4},doSortVertices:function(e,t){var n=this.indices,r=Wc.create();if(!n){n=this.indices=this.vertexCount>65535?new Uint32Array(this.vertexCount):new Uint16Array(this.vertexCount);for(var i=0;i<n.length;i++)n[i]=i}if(t===0){var a=this.attributes.position,e=e.array,o=0;(!this._zList||this._zList.length!==this.vertexCount)&&(this._zList=new Float32Array(this.vertexCount));for(var s,i=0;i<this.vertexCount;i++){a.get(i,r);var c=Wc.sqrDist(r,e);isNaN(c)&&(c=1e7,o++),i===0?(s=c,c=0):c-=s,this._zList[i]=c}this._noneCount=o}if(this.vertexCount<2e4)t===0&&this._simpleSort(this._noneCount/this.vertexCount>.05);else for(var i=0;i<3;i++)this._progressiveQuickSort(t*3+i);this.dirtyIndices()},_simpleSort:function(e){var t=this._zList,n=this.indices;function r(e,n){return t[n]-t[e]}e?Array.prototype.sort.call(n,r):Ec.sort(n,r,0,n.length-1)},_progressiveQuickSort:function(e){var t=this._zList,n=this.indices;this._quickSort=this._quickSort||new Ec,this._quickSort.step(n,function(e,n){return t[n]-t[e]},e)}},Kc=`@export ecgl.sdfSprite.vertex

uniform mat4 worldViewProjection : WORLDVIEWPROJECTION;
uniform float elapsedTime : 0;

attribute vec3 position : POSITION;

#ifdef VERTEX_SIZE
attribute float size;
#else
uniform float u_Size;
#endif

#ifdef VERTEX_COLOR
attribute vec4 a_FillColor: COLOR;
varying vec4 v_Color;
#endif

#ifdef VERTEX_ANIMATION
attribute vec3 prevPosition;
attribute float prevSize;
uniform float percent : 1.0;
#endif


#ifdef POSITIONTEXTURE_ENABLED
uniform sampler2D positionTexture;
#endif

varying float v_Size;

void main()
{

#ifdef POSITIONTEXTURE_ENABLED
 gl_Position = worldViewProjection * vec4(texture2D(positionTexture, position.xy).xy, -10.0, 1.0);
#else

 #ifdef VERTEX_ANIMATION
 vec3 pos = mix(prevPosition, position, percent);
 #else
 vec3 pos = position;
 #endif
 gl_Position = worldViewProjection * vec4(pos, 1.0);
#endif

#ifdef VERTEX_SIZE
#ifdef VERTEX_ANIMATION
 v_Size = mix(prevSize, size, percent);
#else
 v_Size = size;
#endif
#else
 v_Size = u_Size;
#endif

#ifdef VERTEX_COLOR
 v_Color = a_FillColor;
 #endif

 gl_PointSize = v_Size;
}

@end

@export ecgl.sdfSprite.fragment

uniform vec4 color: [1, 1, 1, 1];
uniform vec4 strokeColor: [1, 1, 1, 1];
uniform float smoothing: 0.07;

uniform float lineWidth: 0.0;

#ifdef VERTEX_COLOR
varying vec4 v_Color;
#endif

varying float v_Size;

uniform sampler2D sprite;

@import clay.util.srgb

void main()
{
 gl_FragColor = color;

 vec4 _strokeColor = strokeColor;

#ifdef VERTEX_COLOR
 gl_FragColor *= v_Color;
 #endif

#ifdef SPRITE_ENABLED
 float d = texture2D(sprite, gl_PointCoord).r;
 gl_FragColor.a *= smoothstep(0.5 - smoothing, 0.5 + smoothing, d);

 if (lineWidth > 0.0) {
 float sLineWidth = lineWidth / 2.0;

 float outlineMaxValue0 = 0.5 + sLineWidth;
 float outlineMaxValue1 = 0.5 + sLineWidth + smoothing;
 float outlineMinValue0 = 0.5 - sLineWidth - smoothing;
 float outlineMinValue1 = 0.5 - sLineWidth;

 if (d <= outlineMaxValue1 && d >= outlineMinValue0) {
 float a = _strokeColor.a;
 if (d <= outlineMinValue1) {
 a = a * smoothstep(outlineMinValue0, outlineMinValue1, d);
 }
 else {
 a = a * smoothstep(outlineMaxValue1, outlineMaxValue0, d);
 }
 gl_FragColor.rgb = mix(gl_FragColor.rgb * gl_FragColor.a, _strokeColor.rgb, a);
 gl_FragColor.a = gl_FragColor.a * (1.0 - a) + a;
 }
 }
#endif

#ifdef SRGB_DECODE
 gl_FragColor = sRGBToLinear(gl_FragColor);
#endif
}
@end`,qc=pc.vec4;Q.Shader.import(Kc);var Jc=Q.Mesh.extend(function(){var e=new Q.Geometry({dynamic:!0,attributes:{color:new Q.Geometry.Attribute(`color`,`float`,4,`COLOR`),position:new Q.Geometry.Attribute(`position`,`float`,3,`POSITION`),size:new Q.Geometry.Attribute(`size`,`float`,1),prevPosition:new Q.Geometry.Attribute(`prevPosition`,`float`,3),prevSize:new Q.Geometry.Attribute(`prevSize`,`float`,1)}});Object.assign(e,Gc);var t=new Q.Material({shader:Q.createShader(`ecgl.sdfSprite`),transparent:!0,depthMask:!1});t.enableTexture(`sprite`),t.define(`both`,`VERTEX_COLOR`),t.define(`both`,`VERTEX_SIZE`);var n=new Q.Texture2D({image:document.createElement(`canvas`),flipY:!1});return t.set(`sprite`,n),e.pick=this._pick.bind(this),{geometry:e,material:t,mode:Q.Mesh.POINTS,sizeScale:1}},{_pick:function(e,t,n,r,i,a){var o=this._positionNDC;if(o)for(var s=n.viewport,c=2/s.width,l=2/s.height,u=this.geometry.vertexCount-1;u>=0;u--){var d=this.geometry.indices?this.geometry.indices[u]:u,f=o[d*2],p=o[d*2+1],m=this.geometry.attributes.size.get(d)/this.sizeScale/2;if(e>f-m*c&&e<f+m*c&&t>p-m*l&&t<p+m*l){var h=new Q.Vector3,g=new Q.Vector3;this.geometry.attributes.position.get(d,h.array),Q.Vector3.transformMat4(g,h,this.worldTransform),a.push({vertexIndex:d,point:h,pointWorld:g,target:this,distance:g.distance(r.getWorldPosition())})}}},updateNDCPosition:function(e,t,n){var r=this._positionNDC,i=this.geometry;(!r||r.length/2!==i.vertexCount)&&(r=this._positionNDC=new Float32Array(i.vertexCount*2));for(var a=qc.create(),o=0;o<i.vertexCount;o++)i.attributes.position.get(o,a),a[3]=1,qc.transformMat4(a,a,e.array),qc.scale(a,a,1/a[3]),r[o*2]=a[0],r[o*2+1]=a[1]}}),Yc=20,Xc=-10;function Zc(e,t){return e&&t&&e[0]===t[0]&&e[1]===t[1]}function Qc(e,t){this.rootNode=new Q.Node,this.is2D=e,this._labelsBuilder=new Pc(256,256,t),this._labelsBuilder.getMesh().renderOrder=100,this.rootNode.add(this._labelsBuilder.getMesh()),this._api=t,this._spriteImageCanvas=document.createElement(`canvas`),this._startDataIndex=0,this._endDataIndex=0,this._sizeScale=1}Qc.prototype={constructor:Qc,highlightOnMouseover:!0,update:function(e,t,n,r,i){var a=this._prevMesh;this._prevMesh=this._mesh,this._mesh=a;var o=e.getData();if(r??=0,i??=o.count(),this._startDataIndex=r,this._endDataIndex=i-1,!this._mesh){var s=this._prevMesh&&this._prevMesh.material;this._mesh=new Jc({renderOrder:10,frustumCulling:!1}),s&&(this._mesh.material=s)}var s=this._mesh.material,c=this._mesh.geometry,l=c.attributes;this.rootNode.remove(this._prevMesh),this.rootNode.add(this._mesh),this._setPositionTextureToMesh(this._mesh,this._positionTexture);var u=this._getSymbolInfo(e,r,i),d=n.getDevicePixelRatio(),f=e.getModel(`itemStyle`).getItemStyle(),p=e.get(`large`),m=1;u.maxSize>2?(m=this._updateSymbolSprite(e,f,u,d),s.enableTexture(`sprite`)):s.disableTexture(`sprite`),l.position.init(i-r);var h=[];if(p){s.undefine(`VERTEX_SIZE`),s.undefine(`VERTEX_COLOR`);var g=hc(o),_=gc(o);Q.parseColor(g,h),h[3]*=_,s.set({color:h,u_Size:u.maxSize*this._sizeScale})}else s.set({color:[1,1,1,1]}),s.define(`VERTEX_SIZE`),s.define(`VERTEX_COLOR`),l.size.init(i-r),l.color.init(i-r),this._originalOpacity=new Float32Array(i-r);for(var v=o.getLayout(`points`),y=l.position.value,b=0;b<i-r;b++){var x=b*3,S=b*2;if(this.is2D?(y[x]=v[S],y[x+1]=v[S+1],y[x+2]=Xc):(y[x]=v[x],y[x+1]=v[x+1],y[x+2]=v[x+2]),!p){var g=_c(o,b),_=vc(o,b);Q.parseColor(g,h),h[3]*=_,l.color.set(b,h),h[3];var C=o.getItemVisual(b,`symbolSize`);C=C instanceof Array?Math.max(C[0],C[1]):C,isNaN(C)&&(C=0),l.size.value[b]=C*m*this._sizeScale,this._originalOpacity[b]=h[3]}}this._mesh.sizeScale=m,c.updateBoundingBox(),c.dirty(),this._updateMaterial(e,f);var w=e.coordinateSystem;w&&w.viewGL&&s[w.viewGL.isLinearSpace()?`define`:`undefine`](`fragment`,`SRGB_DECODE`),p||this._updateLabelBuilder(e,r,i),this._updateHandler(e,t,n),this._updateAnimation(e),this._api=n},getPointsMesh:function(){return this._mesh},updateLabels:function(e){this._labelsBuilder.updateLabels(e)},hideLabels:function(){this.rootNode.remove(this._labelsBuilder.getMesh())},showLabels:function(){this.rootNode.add(this._labelsBuilder.getMesh())},dispose:function(){this._labelsBuilder.dispose()},_updateSymbolSprite:function(e,t,n,r){n.maxSize=Math.min(n.maxSize*2,200);var i=[];return n.aspect>1?(i[0]=n.maxSize,i[1]=n.maxSize/n.aspect):(i[1]=n.maxSize,i[0]=n.maxSize*n.aspect),i[0]=i[0]||1,i[1]=i[1]||1,(this._symbolType!==n.type||!Zc(this._symbolSize,i)||this._lineWidth!==t.lineWidth)&&(Uc.createSymbolSprite(n.type,i,{fill:`#fff`,lineWidth:t.lineWidth,stroke:`transparent`,shadowColor:`transparent`,minMargin:Math.min(i[0]/2,10)},this._spriteImageCanvas),Uc.createSDFFromCanvas(this._spriteImageCanvas,Math.min(this._spriteImageCanvas.width,32),Yc,this._mesh.material.get(`sprite`).image),this._symbolType=n.type,this._symbolSize=i,this._lineWidth=t.lineWidth),this._spriteImageCanvas.width/n.maxSize*r},_updateMaterial:function(e,t){var n=e.get(`blendMode`)===`lighter`?Q.additiveBlend:null,r=this._mesh.material;r.blend=n,r.set(`lineWidth`,t.lineWidth/Yc);var i=Q.parseColor(t.stroke);r.set(`strokeColor`,i),r.transparent=!0,r.depthMask=!1,r.depthTest=!this.is2D,r.sortVertices=!this.is2D},_updateLabelBuilder:function(e,t,n){var r=e.getData(),i=this._mesh.geometry,a=i.attributes.position.value,t=this._startDataIndex,o=this._mesh.sizeScale;this._labelsBuilder.updateData(r,t,n),this._labelsBuilder.getLabelPosition=function(e,n,r){var i=(e-t)*3;return[a[i],a[i+1],a[i+2]]},this._labelsBuilder.getLabelDistance=function(e,n,r){return i.attributes.size.get(e-t)/o/2+r},this._labelsBuilder.updateLabels()},_updateAnimation:function(e){Q.updateVertexAnimation([[`prevPosition`,`position`],[`prevSize`,`size`]],this._prevMesh,this._mesh,e)},_updateHandler:function(e,t,n){var r=e.getData(),i=this._mesh,a=this,o=-1,s=e.coordinateSystem&&e.coordinateSystem.type===`cartesian3D`,c;s&&(c=e.coordinateSystem.model),i.seriesIndex=e.seriesIndex,i.off(`mousemove`),i.off(`mouseout`),i.on(`mousemove`,function(t){var l=t.vertexIndex+a._startDataIndex;l!==o&&(this.highlightOnMouseover&&(this.downplay(r,o),this.highlight(r,l),this._labelsBuilder.updateLabels([l])),s&&n.dispatchAction({type:`grid3DShowAxisPointer`,value:[r.get(e.coordDimToDataDim(`x`)[0],l),r.get(e.coordDimToDataDim(`y`)[0],l),r.get(e.coordDimToDataDim(`z`)[0],l)],grid3DIndex:c.componentIndex})),i.dataIndex=l,o=l},this),i.on(`mouseout`,function(e){var t=e.vertexIndex+a._startDataIndex;this.highlightOnMouseover&&(this.downplay(r,t),this._labelsBuilder.updateLabels()),o=-1,i.dataIndex=-1,s&&n.dispatchAction({type:`grid3DHideAxisPointer`,grid3DIndex:c.componentIndex})},this)},updateLayout:function(e,t,n){var r=e.getData();if(this._mesh){var i=this._mesh.geometry.attributes.position.value,a=r.getLayout(`points`);if(this.is2D)for(var o=0;o<a.length/2;o++){var s=o*3,c=o*2;i[s]=a[c],i[s+1]=a[c+1],i[s+2]=Xc}else for(var o=0;o<a.length;o++)i[o]=a[o];this._mesh.geometry.dirty(),n.getZr().refresh()}},updateView:function(e){if(this._mesh){var t=new V;V.mul(t,e.viewMatrix,this._mesh.worldTransform),V.mul(t,e.projectionMatrix,t),this._mesh.updateNDCPosition(t,this.is2D,this._api)}},highlight:function(e,t){if(!(t>this._endDataIndex||t<this._startDataIndex)){var n=e.getItemModel(t).getModel(`emphasis.itemStyle`),r=n.get(`color`),i=n.get(`opacity`);r??=ot(_c(e,t),-.4),i??=vc(e,t);var a=Q.parseColor(r);a[3]*=i,this._mesh.geometry.attributes.color.set(t-this._startDataIndex,a),this._mesh.geometry.dirtyAttribute(`color`),this._api.getZr().refresh()}},downplay:function(e,t){if(!(t>this._endDataIndex||t<this._startDataIndex)){var n=_c(e,t),r=vc(e,t),i=Q.parseColor(n);i[3]*=r,this._mesh.geometry.attributes.color.set(t-this._startDataIndex,i),this._mesh.geometry.dirtyAttribute(`color`),this._api.getZr().refresh()}},fadeOutAll:function(e){if(this._originalOpacity){for(var t=this._mesh.geometry,n=0;n<t.vertexCount;n++){var r=this._originalOpacity[n]*e;t.attributes.color.value[n*4+3]=r}t.dirtyAttribute(`color`),this._api.getZr().refresh()}},fadeInAll:function(){this.fadeOutAll(1)},setPositionTexture:function(e){this._mesh&&this._setPositionTextureToMesh(this._mesh,e),this._positionTexture=e},removePositionTexture:function(){this._positionTexture=null,this._mesh&&this._setPositionTextureToMesh(this._mesh,null)},setSizeScale:function(e){if(e!==this._sizeScale){if(this._mesh){var t=this._mesh.material.get(`u_Size`);this._mesh.material.set(`u_Size`,t/this._sizeScale*e);var n=this._mesh.geometry.attributes;if(n.size.value)for(var r=0;r<n.size.value.length;r++)n.size.value[r]=n.size.value[r]/this._sizeScale*e}this._sizeScale=e}},_setPositionTextureToMesh:function(e,t){t&&e.material.set(`positionTexture`,t),e.material[t?`enableTexture`:`disableTexture`](`positionTexture`)},_getSymbolInfo:function(e,t,n){if(e.get(`large`)){var r=js.firstNotNull(e.get(`symbolSize`),1),i,a;return r instanceof Array?(i=Math.max(r[0],r[1]),a=r[0]/r[1]):(i=r,a=1),{maxSize:r,type:e.get(`symbol`),aspect:a}}for(var o=e.getData(),a,s=o.getItemVisual(0,`symbol`)||`circle`,i=0,c=t;c<n;c++){var r=o.getItemVisual(c,`symbolSize`),l=o.getItemVisual(c,`symbol`),u;if(r instanceof Array)u=r[0]/r[1],i=Math.max(Math.max(r[0],r[1]),i);else{if(isNaN(r))continue;u=1,i=Math.max(r,i)}s=l,a=u}return{maxSize:i,type:s,aspect:a}}};var $c=ye.extend({type:`scatter3D`,hasSymbolVisual:!0,__ecgl__:!0,init:function(e,t){this.groupGL=new Q.Node,this._pointsBuilderList=[],this._currentStep=0},render:function(e,t,n){if(this.groupGL.removeAll(),e.getData().count()){var r=e.coordinateSystem;if(r&&r.viewGL){r.viewGL.add(this.groupGL),this._camera=r.viewGL.camera;var i=this._pointsBuilderList[0];i||=this._pointsBuilderList[0]=new Qc(!1,n),this._pointsBuilderList.length=1,this.groupGL.add(i.rootNode),i.update(e,t,n),i.updateView(r.viewGL.camera)}}},incrementalPrepareRender:function(e,t,n){var r=e.coordinateSystem;r&&r.viewGL&&(r.viewGL.add(this.groupGL),this._camera=r.viewGL.camera),this.groupGL.removeAll(),this._currentStep=0},incrementalRender:function(e,t,n,r){if(!(e.end<=e.start)){var i=this._pointsBuilderList[this._currentStep];i||(i=new Qc(!1,r),this._pointsBuilderList[this._currentStep]=i),this.groupGL.add(i.rootNode),i.update(t,n,r,e.start,e.end),i.updateView(t.coordinateSystem.viewGL.camera),this._currentStep++}},updateCamera:function(){this._pointsBuilderList.forEach(function(e){e.updateView(this._camera)},this)},highlight:function(e,t,n,r){this._toggleStatus(`highlight`,e,t,n,r)},downplay:function(e,t,n,r){this._toggleStatus(`downplay`,e,t,n,r)},_toggleStatus:function(e,t,n,r,i){var a=t.getData(),o=js.queryDataIndex(a,i),s=e===`highlight`;o==null?a.each(function(e){for(var t=0;t<this._pointsBuilderList.length;t++){var n=this._pointsBuilderList[t];s?n.highlight(a,e):n.downplay(a,e)}}):g(mc.normalizeToArray(o),function(e){for(var t=0;t<this._pointsBuilderList.length;t++){var n=this._pointsBuilderList[t];s?n.highlight(a,e):n.downplay(a,e)}},this)},dispose:function(){this._pointsBuilderList.forEach(function(e){e.dispose()}),this.groupGL.removeAll()},remove:function(){this.groupGL.removeAll()}});function el(e){e.registerChartView($c),e.registerSeriesModel(zc),e.registerLayout({seriesType:`scatter3D`,reset:function(e){var t=e.coordinateSystem;if(t){var n=t.dimensions;if(n.length<3)return;var r=n.map(function(t){return e.coordDimToDataDim(t)[0]}),i=[],a=[];return{progress:function(e,n){for(var o=new Float32Array((e.end-e.start)*3),s=e.start;s<e.end;s++){var c=(s-e.start)*3;i[0]=n.get(r[0],s),i[1]=n.get(r[1],s),i[2]=n.get(r[2],s),t.dataToPoint(i,a),o[c]=a[0],o[c+1]=a[1],o[c+2]=a[2]}n.setLayout(`points`,o)}}}}})}var tl={defaultOption:{viewControl:{projection:`perspective`,autoRotate:!1,autoRotateDirection:`cw`,autoRotateSpeed:10,autoRotateAfterStill:3,damping:.8,rotateSensitivity:1,zoomSensitivity:1,panSensitivity:1,panMouseButton:`middle`,rotateMouseButton:`left`,distance:150,minDistance:40,maxDistance:400,orthographicSize:150,maxOrthographicSize:400,minOrthographicSize:20,center:[0,0,0],alpha:0,beta:0,minAlpha:-90,maxAlpha:90}},setView:function(e){e||={},this.option.viewControl=this.option.viewControl||{},e.alpha!=null&&(this.option.viewControl.alpha=e.alpha),e.beta!=null&&(this.option.viewControl.beta=e.beta),e.distance!=null&&(this.option.viewControl.distance=e.distance),e.center!=null&&(this.option.viewControl.center=e.center)}},nl={defaultOption:{postEffect:{enable:!1,bloom:{enable:!0,intensity:.1},depthOfField:{enable:!1,focalRange:20,focalDistance:50,blurRadius:10,fstop:2.8,quality:`medium`},screenSpaceAmbientOcclusion:{enable:!1,radius:2,quality:`medium`,intensity:1},screenSpaceReflection:{enable:!1,quality:`medium`,maxRoughness:.8},colorCorrection:{enable:!0,exposure:0,brightness:0,contrast:1,saturation:1,lookupTexture:``},edge:{enable:!1},FXAA:{enable:!1}},temporalSuperSampling:{enable:`auto`}}},rl={defaultOption:{light:{main:{shadow:!1,shadowQuality:`high`,color:`#fff`,intensity:1,alpha:0,beta:0},ambient:{color:`#fff`,intensity:.2},ambientCubemap:{texture:null,exposure:1,diffuseIntensity:.5,specularIntensity:.5}}}},il=function(){this._pool={},this._allocatedTextures=[]};il.prototype={constructor:il,get:function(e){var t=sl(e);this._pool.hasOwnProperty(t)||(this._pool[t]=[]);var n=this._pool[t];if(!n.length){var r=new J(e);return this._allocatedTextures.push(r),r}return n.pop()},put:function(e){var t=sl(e);this._pool.hasOwnProperty(t)||(this._pool[t]=[]),this._pool[t].push(e)},clear:function(e){for(var t=0;t<this._allocatedTextures.length;t++)this._allocatedTextures[t].dispose(e);this._pool={},this._allocatedTextures=[]}};var al={width:512,height:512,type:H.UNSIGNED_BYTE,format:H.RGBA,wrapS:H.CLAMP_TO_EDGE,wrapT:H.CLAMP_TO_EDGE,minFilter:H.LINEAR_MIPMAP_LINEAR,magFilter:H.LINEAR,useMipmap:!0,anisotropic:1,flipY:!0,unpackAlignment:4,premultiplyAlpha:!1},ol=Object.keys(al);function sl(e){Fr.defaultsWithPropList(e,al,ol),cl(e);for(var t=``,n=0;n<ol.length;n++){var r=e[ol[n]].toString();t+=r}return t}function cl(e){var t=ll(e.width,e.height);e.format===H.DEPTH_COMPONENT&&(e.useMipmap=!1),(!t||!e.useMipmap)&&(e.minFilter==H.NEAREST_MIPMAP_NEAREST||e.minFilter==H.NEAREST_MIPMAP_LINEAR?e.minFilter=H.NEAREST:(e.minFilter==H.LINEAR_MIPMAP_LINEAR||e.minFilter==H.LINEAR_MIPMAP_NEAREST)&&(e.minFilter=H.LINEAR)),t||(e.wrapS=H.CLAMP_TO_EDGE,e.wrapT=H.CLAMP_TO_EDGE)}function ll(e,t){return(e&e-1)==0&&(t&t-1)==0}var ul=`@export clay.sm.depth.vertex
uniform mat4 worldViewProjection : WORLDVIEWPROJECTION;
attribute vec3 position : POSITION;
attribute vec2 texcoord : TEXCOORD_0;
uniform vec2 uvRepeat = vec2(1.0, 1.0);
uniform vec2 uvOffset = vec2(0.0, 0.0);
@import clay.chunk.skinning_header
@import clay.chunk.instancing_header
varying vec4 v_ViewPosition;
varying vec2 v_Texcoord;
void main(){
 vec4 P = vec4(position, 1.0);
#ifdef SKINNING
 @import clay.chunk.skin_matrix
 P = skinMatrixWS * P;
#endif
#ifdef INSTANCING
 @import clay.chunk.instancing_matrix
 P = instanceMat * P;
#endif
 v_ViewPosition = worldViewProjection * P;
 gl_Position = v_ViewPosition;
 v_Texcoord = texcoord * uvRepeat + uvOffset;
}
@end
@export clay.sm.depth.fragment
varying vec4 v_ViewPosition;
varying vec2 v_Texcoord;
uniform float bias : 0.001;
uniform float slopeScale : 1.0;
uniform sampler2D alphaMap;
uniform float alphaCutoff: 0.0;
@import clay.util.encode_float
void main(){
 float depth = v_ViewPosition.z / v_ViewPosition.w;
 if (alphaCutoff > 0.0) {
 if (texture2D(alphaMap, v_Texcoord).a <= alphaCutoff) {
 discard;
 }
 }
#ifdef USE_VSM
 depth = depth * 0.5 + 0.5;
 float moment1 = depth;
 float moment2 = depth * depth;
 #ifdef SUPPORT_STANDARD_DERIVATIVES
 float dx = dFdx(depth);
 float dy = dFdy(depth);
 moment2 += 0.25*(dx*dx+dy*dy);
 #endif
 gl_FragColor = vec4(moment1, moment2, 0.0, 1.0);
#else
 #ifdef SUPPORT_STANDARD_DERIVATIVES
 float dx = dFdx(depth);
 float dy = dFdy(depth);
 depth += sqrt(dx*dx + dy*dy) * slopeScale + bias;
 #else
 depth += bias;
 #endif
 gl_FragColor = encodeFloat(depth * 0.5 + 0.5);
#endif
}
@end
@export clay.sm.debug_depth
uniform sampler2D depthMap;
varying vec2 v_Texcoord;
@import clay.util.decode_float
void main() {
 vec4 tex = texture2D(depthMap, v_Texcoord);
#ifdef USE_VSM
 gl_FragColor = vec4(tex.rgb, 1.0);
#else
 float depth = decodeFloat(tex);
 gl_FragColor = vec4(depth, depth, depth, 1.0);
#endif
}
@end
@export clay.sm.distance.vertex
uniform mat4 worldViewProjection : WORLDVIEWPROJECTION;
uniform mat4 world : WORLD;
attribute vec3 position : POSITION;
@import clay.chunk.skinning_header
varying vec3 v_WorldPosition;
void main (){
 vec4 P = vec4(position, 1.0);
#ifdef SKINNING
 @import clay.chunk.skin_matrix
 P = skinMatrixWS * P;
#endif
#ifdef INSTANCING
 @import clay.chunk.instancing_matrix
 P = instanceMat * P;
#endif
 gl_Position = worldViewProjection * P;
 v_WorldPosition = (world * P).xyz;
}
@end
@export clay.sm.distance.fragment
uniform vec3 lightPosition;
uniform float range : 100;
varying vec3 v_WorldPosition;
@import clay.util.encode_float
void main(){
 float dist = distance(lightPosition, v_WorldPosition);
#ifdef USE_VSM
 gl_FragColor = vec4(dist, dist * dist, 0.0, 0.0);
#else
 dist = dist / range;
 gl_FragColor = encodeFloat(dist);
#endif
}
@end
@export clay.plugin.shadow_map_common
@import clay.util.decode_float
float tapShadowMap(sampler2D map, vec2 uv, float z){
 vec4 tex = texture2D(map, uv);
 return step(z, decodeFloat(tex) * 2.0 - 1.0);
}
float pcf(sampler2D map, vec2 uv, float z, float textureSize, vec2 scale) {
 float shadowContrib = tapShadowMap(map, uv, z);
 vec2 offset = vec2(1.0 / textureSize) * scale;
#ifdef PCF_KERNEL_SIZE
 for (int _idx_ = 0; _idx_ < PCF_KERNEL_SIZE; _idx_++) {{
 shadowContrib += tapShadowMap(map, uv + offset * pcfKernel[_idx_], z);
 }}
 return shadowContrib / float(PCF_KERNEL_SIZE + 1);
#else
 shadowContrib += tapShadowMap(map, uv+vec2(offset.x, 0.0), z);
 shadowContrib += tapShadowMap(map, uv+vec2(offset.x, offset.y), z);
 shadowContrib += tapShadowMap(map, uv+vec2(-offset.x, offset.y), z);
 shadowContrib += tapShadowMap(map, uv+vec2(0.0, offset.y), z);
 shadowContrib += tapShadowMap(map, uv+vec2(-offset.x, 0.0), z);
 shadowContrib += tapShadowMap(map, uv+vec2(-offset.x, -offset.y), z);
 shadowContrib += tapShadowMap(map, uv+vec2(offset.x, -offset.y), z);
 shadowContrib += tapShadowMap(map, uv+vec2(0.0, -offset.y), z);
 return shadowContrib / 9.0;
#endif
}
float pcf(sampler2D map, vec2 uv, float z, float textureSize) {
 return pcf(map, uv, z, textureSize, vec2(1.0));
}
float chebyshevUpperBound(vec2 moments, float z){
 float p = 0.0;
 z = z * 0.5 + 0.5;
 if (z <= moments.x) {
 p = 1.0;
 }
 float variance = moments.y - moments.x * moments.x;
 variance = max(variance, 0.0000001);
 float mD = moments.x - z;
 float pMax = variance / (variance + mD * mD);
 pMax = clamp((pMax-0.4)/(1.0-0.4), 0.0, 1.0);
 return max(p, pMax);
}
float computeShadowContrib(
 sampler2D map, mat4 lightVPM, vec3 position, float textureSize, vec2 scale, vec2 offset
) {
 vec4 posInLightSpace = lightVPM * vec4(position, 1.0);
 posInLightSpace.xyz /= posInLightSpace.w;
 float z = posInLightSpace.z;
 if(all(greaterThan(posInLightSpace.xyz, vec3(-0.99, -0.99, -1.0))) &&
 all(lessThan(posInLightSpace.xyz, vec3(0.99, 0.99, 1.0)))){
 vec2 uv = (posInLightSpace.xy+1.0) / 2.0;
 #ifdef USE_VSM
 vec2 moments = texture2D(map, uv * scale + offset).xy;
 return chebyshevUpperBound(moments, z);
 #else
 return pcf(map, uv * scale + offset, z, textureSize, scale);
 #endif
 }
 return 1.0;
}
float computeShadowContrib(sampler2D map, mat4 lightVPM, vec3 position, float textureSize) {
 return computeShadowContrib(map, lightVPM, position, textureSize, vec2(1.0), vec2(0.0));
}
float computeShadowContribOmni(samplerCube map, vec3 direction, float range)
{
 float dist = length(direction);
 vec4 shadowTex = textureCube(map, direction);
#ifdef USE_VSM
 vec2 moments = shadowTex.xy;
 float variance = moments.y - moments.x * moments.x;
 float mD = moments.x - dist;
 float p = variance / (variance + mD * mD);
 if(moments.x + 0.001 < dist){
 return clamp(p, 0.0, 1.0);
 }else{
 return 1.0;
 }
#else
 return step(dist, (decodeFloat(shadowTex) + 0.0002) * range);
#endif
}
@end
@export clay.plugin.compute_shadow_map
#if defined(SPOT_LIGHT_SHADOWMAP_COUNT) || defined(DIRECTIONAL_LIGHT_SHADOWMAP_COUNT) || defined(POINT_LIGHT_SHADOWMAP_COUNT)
#ifdef SPOT_LIGHT_SHADOWMAP_COUNT
uniform sampler2D spotLightShadowMaps[SPOT_LIGHT_SHADOWMAP_COUNT]:unconfigurable;
uniform mat4 spotLightMatrices[SPOT_LIGHT_SHADOWMAP_COUNT]:unconfigurable;
uniform float spotLightShadowMapSizes[SPOT_LIGHT_SHADOWMAP_COUNT]:unconfigurable;
#endif
#ifdef DIRECTIONAL_LIGHT_SHADOWMAP_COUNT
#if defined(SHADOW_CASCADE)
uniform sampler2D directionalLightShadowMaps[1]:unconfigurable;
uniform mat4 directionalLightMatrices[SHADOW_CASCADE]:unconfigurable;
uniform float directionalLightShadowMapSizes[1]:unconfigurable;
uniform float shadowCascadeClipsNear[SHADOW_CASCADE]:unconfigurable;
uniform float shadowCascadeClipsFar[SHADOW_CASCADE]:unconfigurable;
#else
uniform sampler2D directionalLightShadowMaps[DIRECTIONAL_LIGHT_SHADOWMAP_COUNT]:unconfigurable;
uniform mat4 directionalLightMatrices[DIRECTIONAL_LIGHT_SHADOWMAP_COUNT]:unconfigurable;
uniform float directionalLightShadowMapSizes[DIRECTIONAL_LIGHT_SHADOWMAP_COUNT]:unconfigurable;
#endif
#endif
#ifdef POINT_LIGHT_SHADOWMAP_COUNT
uniform samplerCube pointLightShadowMaps[POINT_LIGHT_SHADOWMAP_COUNT]:unconfigurable;
#endif
uniform bool shadowEnabled : true;
#ifdef PCF_KERNEL_SIZE
uniform vec2 pcfKernel[PCF_KERNEL_SIZE];
#endif
@import clay.plugin.shadow_map_common
#if defined(SPOT_LIGHT_SHADOWMAP_COUNT)
void computeShadowOfSpotLights(vec3 position, inout float shadowContribs[SPOT_LIGHT_COUNT] ) {
 float shadowContrib;
 for(int _idx_ = 0; _idx_ < SPOT_LIGHT_SHADOWMAP_COUNT; _idx_++) {{
 shadowContrib = computeShadowContrib(
 spotLightShadowMaps[_idx_], spotLightMatrices[_idx_], position,
 spotLightShadowMapSizes[_idx_]
 );
 shadowContribs[_idx_] = shadowContrib;
 }}
 for(int _idx_ = SPOT_LIGHT_SHADOWMAP_COUNT; _idx_ < SPOT_LIGHT_COUNT; _idx_++){{
 shadowContribs[_idx_] = 1.0;
 }}
}
#endif
#if defined(DIRECTIONAL_LIGHT_SHADOWMAP_COUNT)
#ifdef SHADOW_CASCADE
void computeShadowOfDirectionalLights(vec3 position, inout float shadowContribs[DIRECTIONAL_LIGHT_COUNT]){
 float depth = (2.0 * gl_FragCoord.z - gl_DepthRange.near - gl_DepthRange.far)
 / (gl_DepthRange.far - gl_DepthRange.near);
 float shadowContrib;
 shadowContribs[0] = 1.0;
 for (int _idx_ = 0; _idx_ < SHADOW_CASCADE; _idx_++) {{
 if (
 depth >= shadowCascadeClipsNear[_idx_] &&
 depth <= shadowCascadeClipsFar[_idx_]
 ) {
 shadowContrib = computeShadowContrib(
 directionalLightShadowMaps[0], directionalLightMatrices[_idx_], position,
 directionalLightShadowMapSizes[0],
 vec2(1.0 / float(SHADOW_CASCADE), 1.0),
 vec2(float(_idx_) / float(SHADOW_CASCADE), 0.0)
 );
 shadowContribs[0] = shadowContrib;
 }
 }}
 for(int _idx_ = DIRECTIONAL_LIGHT_SHADOWMAP_COUNT; _idx_ < DIRECTIONAL_LIGHT_COUNT; _idx_++) {{
 shadowContribs[_idx_] = 1.0;
 }}
}
#else
void computeShadowOfDirectionalLights(vec3 position, inout float shadowContribs[DIRECTIONAL_LIGHT_COUNT]){
 float shadowContrib;
 for(int _idx_ = 0; _idx_ < DIRECTIONAL_LIGHT_SHADOWMAP_COUNT; _idx_++) {{
 shadowContrib = computeShadowContrib(
 directionalLightShadowMaps[_idx_], directionalLightMatrices[_idx_], position,
 directionalLightShadowMapSizes[_idx_]
 );
 shadowContribs[_idx_] = shadowContrib;
 }}
 for(int _idx_ = DIRECTIONAL_LIGHT_SHADOWMAP_COUNT; _idx_ < DIRECTIONAL_LIGHT_COUNT; _idx_++) {{
 shadowContribs[_idx_] = 1.0;
 }}
}
#endif
#endif
#if defined(POINT_LIGHT_SHADOWMAP_COUNT)
void computeShadowOfPointLights(vec3 position, inout float shadowContribs[POINT_LIGHT_COUNT] ){
 vec3 lightPosition;
 vec3 direction;
 for(int _idx_ = 0; _idx_ < POINT_LIGHT_SHADOWMAP_COUNT; _idx_++) {{
 lightPosition = pointLightPosition[_idx_];
 direction = position - lightPosition;
 shadowContribs[_idx_] = computeShadowContribOmni(pointLightShadowMaps[_idx_], direction, pointLightRange[_idx_]);
 }}
 for(int _idx_ = POINT_LIGHT_SHADOWMAP_COUNT; _idx_ < POINT_LIGHT_COUNT; _idx_++) {{
 shadowContribs[_idx_] = 1.0;
 }}
}
#endif
#endif
@end`,dl=[`px`,`nx`,`py`,`ny`,`pz`,`nz`];K.import(ul);function fl(e,t,n){return n===`alphaMap`?e.material.get(`diffuseMap`):n===`alphaCutoff`?e.material.isDefined(`fragment`,`ALPHA_TEST`)&&e.material.get(`diffuseMap`)&&e.material.get(`alphaCutoff`)||0:n===`uvRepeat`?e.material.get(`uvRepeat`):n===`uvOffset`?e.material.get(`uvOffset`):t.get(n)}function pl(e,t){var n=e.material,r=t.material;return n.get(`diffuseMap`)!==r.get(`diffuseMap`)||(n.get(`alphaCutoff`)||0)!==(r.get(`alphaCutoff`)||0)}var ml=Ir.extend(function(){return{softShadow:ml.PCF,shadowBlur:1,lightFrustumBias:`auto`,kernelPCF:new Float32Array([1,0,1,1,-1,1,0,1,-1,0,-1,-1,1,-1,0,-1]),precision:`highp`,_lastRenderNotCastShadow:!1,_frameBuffer:new Oo,_textures:{},_shadowMapNumber:{POINT_LIGHT:0,DIRECTIONAL_LIGHT:0,SPOT_LIGHT:0},_depthMaterials:{},_distanceMaterials:{},_receivers:[],_lightsCastShadow:[],_lightCameras:{},_lightMaterials:{},_texturePool:new il}},function(){this._gaussianPassH=new ys({fragment:K.source(`clay.compositor.gaussian_blur`)}),this._gaussianPassV=new ys({fragment:K.source(`clay.compositor.gaussian_blur`)}),this._gaussianPassH.setUniform(`blurSize`,this.shadowBlur),this._gaussianPassH.setUniform(`blurDir`,0),this._gaussianPassV.setUniform(`blurSize`,this.shadowBlur),this._gaussianPassV.setUniform(`blurDir`,1),this._outputDepthPass=new ys({fragment:K.source(`clay.sm.debug_depth`)})},{render:function(e,t,n,r){n||=t.getMainCamera(),this.trigger(`beforerender`,this,e,t,n),this._renderShadowPass(e,t,n,r),this.trigger(`afterrender`,this,e,t,n)},renderDebug:function(e,t){e.saveClear();var n=e.viewport,r=0,i=0,a=t||n.width/4,o=a;for(var s in this.softShadow===ml.VSM?this._outputDepthPass.material.define(`fragment`,`USE_VSM`):this._outputDepthPass.material.undefine(`fragment`,`USE_VSM`),this._textures){var c=this._textures[s];e.setViewport(r,i,a*c.width/c.height,o),this._outputDepthPass.setUniform(`depthMap`,c),this._outputDepthPass.render(e),r+=a*c.width/c.height}e.setViewport(n),e.restoreClear()},_updateReceivers:function(e,t){if(t.receiveShadow?(this._receivers.push(t),t.material.set(`shadowEnabled`,1),t.material.set(`pcfKernel`,this.kernelPCF)):t.material.set(`shadowEnabled`,0),this.softShadow===ml.VSM)t.material.define(`fragment`,`USE_VSM`),t.material.undefine(`fragment`,`PCF_KERNEL_SIZE`);else{t.material.undefine(`fragment`,`USE_VSM`);var n=this.kernelPCF;n&&n.length?t.material.define(`fragment`,`PCF_KERNEL_SIZE`,n.length/2):t.material.undefine(`fragment`,`PCF_KERNEL_SIZE`)}},_update:function(e,t){var n=this;t.traverse(function(t){t.isRenderable()&&n._updateReceivers(e,t)});for(var r=0;r<t.lights.length;r++){var i=t.lights[r];i.castShadow&&!i.invisible&&this._lightsCastShadow.push(i)}},_renderShadowPass:function(e,t,n,r){for(var i in this._shadowMapNumber)this._shadowMapNumber[i]=0;this._lightsCastShadow.length=0,this._receivers.length=0;var a=e.gl;if(r||t.update(),n&&n.update(),t.updateLights(),this._update(e,t),!this._lightsCastShadow.length&&this._lastRenderNotCastShadow)return;this._lastRenderNotCastShadow=this._lightsCastShadow===0,a.enable(a.DEPTH_TEST),a.depthMask(!0),a.disable(a.BLEND),a.clearColor(1,1,1,1);for(var o=[],s=[],c=[],l=[],u=[],d=[],f,p=0;p<this._lightsCastShadow.length;p++){var m=this._lightsCastShadow[p];if(m.type===`DIRECTIONAL_LIGHT`){if(f){console.warn(`Only one direectional light supported with shadow cascade`);continue}if(m.shadowCascade>4){console.warn(`Support at most 4 cascade`);continue}m.shadowCascade>1&&(f=m),this.renderDirectionalLightShadow(e,t,n,m,u,l,c)}else m.type===`SPOT_LIGHT`?this.renderSpotLightShadow(e,t,m,s,o):m.type===`POINT_LIGHT`&&this.renderPointLightShadow(e,t,m,d);this._shadowMapNumber[m.type]++}for(var h in this._shadowMapNumber)for(var g=this._shadowMapNumber[h],_=h+`_SHADOWMAP_COUNT`,p=0;p<this._receivers.length;p++){var v=this._receivers[p],y=v.material;y.fragmentDefines[_]!==g&&(g>0?y.define(`fragment`,_,g):y.isDefined(`fragment`,_)&&y.undefine(`fragment`,_))}for(var p=0;p<this._receivers.length;p++){var v=this._receivers[p],y=v.material;f?y.define(`fragment`,`SHADOW_CASCADE`,f.shadowCascade):y.undefine(`fragment`,`SHADOW_CASCADE`)}var b=t.shadowUniforms;function x(e){return e.height}if(c.length>0){var S=c.map(x);if(b.directionalLightShadowMaps={value:c,type:`tv`},b.directionalLightMatrices={value:l,type:`m4v`},b.directionalLightShadowMapSizes={value:S,type:`1fv`},f){var C=u.slice(),w=u.slice();C.pop(),w.shift(),C.reverse(),w.reverse(),l.reverse(),b.shadowCascadeClipsNear={value:C,type:`1fv`},b.shadowCascadeClipsFar={value:w,type:`1fv`}}}if(o.length>0){var T=o.map(x),b=t.shadowUniforms;b.spotLightShadowMaps={value:o,type:`tv`},b.spotLightMatrices={value:s,type:`m4v`},b.spotLightShadowMapSizes={value:T,type:`1fv`}}d.length>0&&(b.pointLightShadowMaps={value:d,type:`tv`})},renderDirectionalLightShadow:(function(){var e=new to,t=new V,n=new Zr,r=new V,i=new V,a=new V,o=new V;return function(s,c,l,u,d,f,p){var m=this._getDepthMaterial(u),h={getMaterial:function(e){return e.shadowDepthMaterial||m},isMaterialChanged:pl,getUniform:fl,ifRender:function(e){return e.castShadow},sortCompare:Sa.opaqueSortCompare};if(!c.viewBoundingBoxLastFrame.isFinite()){var g=c.getBoundingBox();c.viewBoundingBoxLastFrame.copy(g).applyTransform(l.viewMatrix)}var _=Math.min(-c.viewBoundingBoxLastFrame.min.z,l.far),v=Math.max(-c.viewBoundingBoxLastFrame.max.z,l.near),y=this._getDirectionalLightCamera(u,c,l),b=a.array;o.copy(y.projectionMatrix),B.invert(i.array,y.worldTransform.array),B.multiply(i.array,i.array,l.worldTransform.array),B.multiply(b,o.array,i.array);for(var x=[],S=l instanceof _o,C=(l.near+l.far)/(l.near-l.far),w=2*l.near*l.far/(l.near-l.far),T=0;T<=u.shadowCascade;T++){var E=v*(_/v)**+(T/u.shadowCascade),D=v+(_-v)*T/u.shadowCascade,O=E*u.cascadeSplitLogFactor+D*(1-u.cascadeSplitLogFactor);x.push(O),d.push(-(-O*C+w)/-O)}var k=this._getTexture(u,u.shadowCascade);p.push(k);var A=s.viewport,j=s.gl;this._frameBuffer.attach(k),this._frameBuffer.bind(s),j.clear(j.COLOR_BUFFER_BIT|j.DEPTH_BUFFER_BIT);for(var T=0;T<u.shadowCascade;T++){var M=x[T],N=x[T+1];S?B.perspective(t.array,l.fov/180*Math.PI,l.aspect,M,N):B.ortho(t.array,l.left,l.right,l.bottom,l.top,M,N),e.setFromProjection(t),e.getTransformedBoundingBox(n,i),n.applyProjection(o);var ee=n.min.array,te=n.max.array;ee[0]=Math.max(ee[0],-1),ee[1]=Math.max(ee[1],-1),te[0]=Math.min(te[0],1),te[1]=Math.min(te[1],1),r.ortho(ee[0],te[0],ee[1],te[1],1,-1),y.projectionMatrix.multiplyLeft(r);var ne=u.shadowResolution||512;s.setViewport((u.shadowCascade-T-1)*ne,0,ne,ne,1);var re=c.updateRenderList(y);s.renderPass(re.opaque,y,h),this.softShadow===ml.VSM&&this._gaussianFilter(s,k,k.width);var ie=new V;ie.copy(y.viewMatrix).multiplyLeft(y.projectionMatrix),f.push(ie.array),y.projectionMatrix.copy(o)}this._frameBuffer.unbind(s),s.setViewport(A)}})(),renderSpotLightShadow:function(e,t,n,r,i){var a=this._getTexture(n),o=this._getSpotLightCamera(n),s=e.gl;this._frameBuffer.attach(a),this._frameBuffer.bind(e),s.clear(s.COLOR_BUFFER_BIT|s.DEPTH_BUFFER_BIT);var c=this._getDepthMaterial(n),l={getMaterial:function(e){return e.shadowDepthMaterial||c},isMaterialChanged:pl,getUniform:fl,ifRender:function(e){return e.castShadow},sortCompare:Sa.opaqueSortCompare},u=t.updateRenderList(o);e.renderPass(u.opaque,o,l),this._frameBuffer.unbind(e),this.softShadow===ml.VSM&&this._gaussianFilter(e,a,a.width);var d=new V;d.copy(o.worldTransform).invert().multiplyLeft(o.projectionMatrix),i.push(a),r.push(d.array)},renderPointLightShadow:function(e,t,n,r){var i=this._getTexture(n),a=e.gl;r.push(i);var o=this._getDepthMaterial(n),s={getMaterial:function(e){return e.shadowDepthMaterial||o},getUniform:fl,sortCompare:Sa.opaqueSortCompare},c={px:[],py:[],pz:[],nx:[],ny:[],nz:[]},l=new Zr,u=n.getWorldPosition().array,d=new Zr,f=n.range;d.min.setArray(u),d.max.setArray(u);var p=new F(f,f,f);d.max.add(p),d.min.sub(p);var m={px:!1,py:!1,pz:!1,nx:!1,ny:!1,nz:!1};t.traverse(function(e){if(e.isRenderable()&&e.castShadow){var t=e.geometry;if(!t.boundingBox){for(var n=0;n<dl.length;n++)c[dl[n]].push(e);return}if(l.transformFrom(t.boundingBox,e.worldTransform),!l.intersectBoundingBox(d))return;l.updateVertices();for(var n=0;n<dl.length;n++)m[dl[n]]=!1;for(var n=0;n<8;n++){var r=l.vertices[n],i=r[0]-u[0],a=r[1]-u[1],o=r[2]-u[2],s=Math.abs(i),f=Math.abs(a),p=Math.abs(o);s>f?s>p?m[i>0?`px`:`nx`]=!0:m[o>0?`pz`:`nz`]=!0:f>p?m[a>0?`py`:`ny`]=!0:m[o>0?`pz`:`nz`]=!0}for(var n=0;n<dl.length;n++)m[dl[n]]&&c[dl[n]].push(e)}});for(var h=0;h<6;h++){var g=dl[h],_=this._getPointLightCamera(n,g);this._frameBuffer.attach(i,a.COLOR_ATTACHMENT0,a.TEXTURE_CUBE_MAP_POSITIVE_X+h),this._frameBuffer.bind(e),a.clear(a.COLOR_BUFFER_BIT|a.DEPTH_BUFFER_BIT),e.renderPass(c[g],_,s)}this._frameBuffer.unbind(e)},_getDepthMaterial:function(e){var t=this._lightMaterials[e.__uid__],n=e.type===`POINT_LIGHT`;if(!t){var r=n?`clay.sm.distance.`:`clay.sm.depth.`;t=new ji({precision:this.precision,shader:new K(K.source(r+`vertex`),K.source(r+`fragment`))}),this._lightMaterials[e.__uid__]=t}return e.shadowSlopeScale!=null&&t.setUniform(`slopeScale`,e.shadowSlopeScale),e.shadowBias!=null&&t.setUniform(`bias`,e.shadowBias),this.softShadow===ml.VSM?t.define(`fragment`,`USE_VSM`):t.undefine(`fragment`,`USE_VSM`),n&&(t.set(`lightPosition`,e.getWorldPosition().array),t.set(`range`,e.range)),t},_gaussianFilter:function(e,t,n){var r={width:n,height:n,type:q.FLOAT},i=this._texturePool.get(r);this._frameBuffer.attach(i),this._frameBuffer.bind(e),this._gaussianPassH.setUniform(`texture`,t),this._gaussianPassH.setUniform(`textureWidth`,n),this._gaussianPassH.render(e),this._frameBuffer.attach(t),this._gaussianPassV.setUniform(`texture`,i),this._gaussianPassV.setUniform(`textureHeight`,n),this._gaussianPassV.render(e),this._frameBuffer.unbind(e),this._texturePool.put(i)},_getTexture:function(e,t){var n=e.__uid__,r=this._textures[n],i=e.shadowResolution||512;return t||=1,r||(r=e.type===`POINT_LIGHT`?new ho:new J,r.width=i*t,r.height=i,this.softShadow===ml.VSM?(r.type=q.FLOAT,r.anisotropic=4):(r.minFilter=H.NEAREST,r.magFilter=H.NEAREST,r.useMipmap=!1),this._textures[n]=r),r},_getPointLightCamera:function(e,t){this._lightCameras.point||(this._lightCameras.point={px:new _o,nx:new _o,py:new _o,ny:new _o,pz:new _o,nz:new _o});var n=this._lightCameras.point[t];switch(n.far=e.range,n.fov=90,n.position.set(0,0,0),t){case`px`:n.lookAt(F.POSITIVE_X,F.NEGATIVE_Y);break;case`nx`:n.lookAt(F.NEGATIVE_X,F.NEGATIVE_Y);break;case`py`:n.lookAt(F.POSITIVE_Y,F.POSITIVE_Z);break;case`ny`:n.lookAt(F.NEGATIVE_Y,F.NEGATIVE_Z);break;case`pz`:n.lookAt(F.POSITIVE_Z,F.NEGATIVE_Y);break;case`nz`:n.lookAt(F.NEGATIVE_Z,F.NEGATIVE_Y);break}return e.getWorldPosition(n.position),n.update(),n},_getDirectionalLightCamera:(function(){var e=new V,t=new Zr,n=new Zr;return function(r,i,a){this._lightCameras.directional||(this._lightCameras.directional=new gs);var o=this._lightCameras.directional;t.copy(i.viewBoundingBoxLastFrame),t.intersection(a.frustum.boundingBox),o.position.copy(t.min).add(t.max).scale(.5).transformMat4(a.worldTransform),o.rotation.copy(r.rotation),o.scale.copy(r.scale),o.updateWorldTransform(),V.invert(e,o.worldTransform),V.multiply(e,e,a.worldTransform),n.copy(t).applyTransform(e);var s=n.min.array,c=n.max.array;return o.position.set((s[0]+c[0])/2,(s[1]+c[1])/2,c[2]).transformMat4(o.worldTransform),o.near=0,o.far=-s[2]+c[2],isNaN(this.lightFrustumBias)?o.far*=4:o.far+=this.lightFrustumBias,o.left=s[0],o.right=c[0],o.top=c[1],o.bottom=s[1],o.update(!0),o}})(),_getSpotLightCamera:function(e){this._lightCameras.spot||(this._lightCameras.spot=new _o);var t=this._lightCameras.spot;return t.fov=e.penumbraAngle*2,t.far=e.range,t.worldTransform.copy(e.worldTransform),t.updateProjectionMatrix(),B.invert(t.viewMatrix.array,t.worldTransform.array),t},dispose:function(e){var t=e.gl||e;for(var n in this._frameBuffer&&this._frameBuffer.dispose(t),this._textures)this._textures[n].dispose(t);this._texturePool.clear(e.gl),this._depthMaterials={},this._distanceMaterials={},this._textures={},this._lightCameras={},this._shadowMapNumber={POINT_LIGHT:0,DIRECTIONAL_LIGHT:0,SPOT_LIGHT:0},this._meshMaterials={};for(var r=0;r<this._receivers.length;r++){var i=this._receivers[r];if(i.material){var a=i.material;a.undefine(`fragment`,`POINT_LIGHT_SHADOW_COUNT`),a.undefine(`fragment`,`DIRECTIONAL_LIGHT_SHADOW_COUNT`),a.undefine(`fragment`,`AMBIENT_LIGHT_SHADOW_COUNT`),a.set(`shadowEnabled`,0)}}this._receivers=[],this._lightsCastShadow=[]}});ml.VSM=1,ml.PCF=2;var hl=Ir.extend(function(){return{name:``,inputLinks:{},outputLinks:{},_prevOutputTextures:{},_outputTextures:{},_outputReferences:{},_rendering:!1,_rendered:!1,_compositor:null}},{updateParameter:function(e,t){var n=this.outputs[e],r=n.parameters,i=n._parametersCopy;if(i||=n._parametersCopy={},r)for(var a in r)a!==`width`&&a!==`height`&&(i[a]=r[a]);var o=r.width instanceof Function?r.width.call(this,t):r.width,s=r.height instanceof Function?r.height.call(this,t):r.height;return(i.width!==o||i.height!==s)&&this._outputTextures[e]&&this._outputTextures[e].dispose(t.gl),i.width=o,i.height=s,i},setParameter:function(e,t){},getParameter:function(e){},setParameters:function(e){for(var t in e)this.setParameter(t,e[t])},render:function(){},getOutput:function(e,t){if(t==null)return t=e,this._outputTextures[t];var n=this.outputs[t];if(n)return this._rendered?n.outputLastFrame?this._prevOutputTextures[t]:this._outputTextures[t]:this._rendering?(this._prevOutputTextures[t]||(this._prevOutputTextures[t]=this._compositor.allocateTexture(n.parameters||{})),this._prevOutputTextures[t]):(this.render(e),this._outputTextures[t])},removeReference:function(e){this._outputReferences[e]--,this._outputReferences[e]===0&&(this.outputs[e].keepLastFrame?(this._prevOutputTextures[e]&&this._compositor.releaseTexture(this._prevOutputTextures[e]),this._prevOutputTextures[e]=this._outputTextures[e]):this._compositor.releaseTexture(this._outputTextures[e]))},link:function(e,t,n){this.inputLinks[e]={node:t,pin:n},t.outputLinks[n]||(t.outputLinks[n]=[]),t.outputLinks[n].push({node:this,pin:e}),this.pass.material.enableTexture(e)},clear:function(){this.inputLinks={},this.outputLinks={}},updateReference:function(e){if(!this._rendering){for(var t in this._rendering=!0,this.inputLinks){var n=this.inputLinks[t];n.node.updateReference(n.pin)}this._rendering=!1}e&&this._outputReferences[e]++},beforeFrame:function(){for(var e in this._rendered=!1,this.outputLinks)this._outputReferences[e]=0},afterFrame:function(){for(var e in this.outputLinks)this._outputReferences[e]>0&&(this.outputs[e].keepLastFrame?(this._prevOutputTextures[e]&&this._compositor.releaseTexture(this._prevOutputTextures[e]),this._prevOutputTextures[e]=this._outputTextures[e]):this._compositor.releaseTexture(this._outputTextures[e]))}}),gl=Ir.extend(function(){return{nodes:[]}},{dirty:function(){this._dirty=!0},addNode:function(e){this.nodes.indexOf(e)>=0||(this.nodes.push(e),this._dirty=!0)},removeNode:function(e){typeof e==`string`&&(e=this.getNodeByName(e));var t=this.nodes.indexOf(e);t>=0&&(this.nodes.splice(t,1),this._dirty=!0)},getNodeByName:function(e){for(var t=0;t<this.nodes.length;t++)if(this.nodes[t].name===e)return this.nodes[t]},update:function(){for(var e=0;e<this.nodes.length;e++)this.nodes[e].clear();for(var e=0;e<this.nodes.length;e++){var t=this.nodes[e];if(t.inputs){for(var n in t.inputs)if(t.inputs[n]){if(t.pass&&!t.pass.material.isUniformEnabled(n)){console.warn(`Pin `+t.name+`.`+n+` not used.`);continue}var r=t.inputs[n],i=this.findPin(r);i?t.link(n,i.node,i.pin):console.warn(typeof r==`string`?`Node `+r+` not exist`:`Pin of `+r.node+`.`+r.pin+` not exist`)}}}},findPin:function(e){var t;if((typeof e==`string`||e instanceof hl)&&(e={node:e}),typeof e.node==`string`)for(var n=0;n<this.nodes.length;n++){var r=this.nodes[n];r.name===e.node&&(t=r)}else t=e.node;if(t){var i=e.pin;if(i||t.outputs&&(i=Object.keys(t.outputs)[0]),t.outputs[i])return{node:t,pin:i}}}}),_l=gl.extend(function(){return{_outputs:[],_texturePool:new il,_frameBuffer:new Oo({depthBuffer:!1})}},{addNode:function(e){gl.prototype.addNode.call(this,e),e._compositor=this},render:function(e,t){if(this._dirty){this.update(),this._dirty=!1,this._outputs.length=0;for(var n=0;n<this.nodes.length;n++)this.nodes[n].outputs||this._outputs.push(this.nodes[n])}for(var n=0;n<this.nodes.length;n++)this.nodes[n].beforeFrame();for(var n=0;n<this._outputs.length;n++)this._outputs[n].updateReference();for(var n=0;n<this._outputs.length;n++)this._outputs[n].render(e,t);for(var n=0;n<this.nodes.length;n++)this.nodes[n].afterFrame()},allocateTexture:function(e){return this._texturePool.get(e)},releaseTexture:function(e){this._texturePool.put(e)},getFrameBuffer:function(){return this._frameBuffer},dispose:function(e){this._texturePool.clear(e)}}),vl=hl.extend({name:`scene`,scene:null,camera:null,autoUpdateScene:!0,preZ:!1},function(){this.frameBuffer=new Oo},{render:function(e){this._rendering=!0;var t=e.gl;this.trigger(`beforerender`);var n;if(!this.outputs)n=e.render(this.scene,this.camera,!this.autoUpdateScene,this.preZ);else{var r=this.frameBuffer;for(var i in this.outputs){var a=this.updateParameter(i,e),o=this.outputs[i],s=this._compositor.allocateTexture(a);this._outputTextures[i]=s;var c=o.attachment||t.COLOR_ATTACHMENT0;typeof c==`string`&&(c=t[c]),r.attach(s,c)}r.bind(e);var l=e.getGLExtension(`EXT_draw_buffers`);if(l){var u=[];for(var c in this.outputs)c=parseInt(c),c>=t.COLOR_ATTACHMENT0&&c<=t.COLOR_ATTACHMENT0+8&&u.push(c);l.drawBuffersEXT(u)}e.saveClear(),e.clearBit=H.DEPTH_BUFFER_BIT|H.COLOR_BUFFER_BIT,n=e.render(this.scene,this.camera,!this.autoUpdateScene,this.preZ),e.restoreClear(),r.unbind(e)}this.trigger(`afterrender`,n),this._rendering=!1,this._rendered=!0}}),yl=hl.extend(function(){return{texture:null,outputs:{color:{}}}},function(){},{getOutput:function(e,t){return this.texture},beforeFrame:function(){},afterFrame:function(){}}),bl=hl.extend(function(){return{name:``,inputs:{},outputs:null,shader:``,inputLinks:{},outputLinks:{},pass:null,_prevOutputTextures:{},_outputTextures:{},_outputReferences:{},_rendering:!1,_rendered:!1,_compositor:null}},function(){var e=new ys({fragment:this.shader});this.pass=e},{render:function(e,t){this.trigger(`beforerender`,e),this._rendering=!0;var n=e.gl;for(var r in this.inputLinks){var i=this.inputLinks[r],a=i.node.getOutput(e,i.pin);this.pass.setUniform(r,a)}if(!this.outputs)this.pass.outputs=null,this._compositor.getFrameBuffer().unbind(e),this.pass.render(e,t);else{this.pass.outputs={};var o={};for(var s in this.outputs){var c=this.updateParameter(s,e);isNaN(c.width)&&this.updateParameter(s,e);var l=this.outputs[s],u=this._compositor.allocateTexture(c);this._outputTextures[s]=u;var d=l.attachment||n.COLOR_ATTACHMENT0;typeof d==`string`&&(d=n[d]),o[d]=u}for(var d in this._compositor.getFrameBuffer().bind(e),o)this._compositor.getFrameBuffer().attach(o[d],d);this.pass.render(e),this._compositor.getFrameBuffer().updateMipmap(e)}for(var r in this.inputLinks){var i=this.inputLinks[r];i.node.removeReference(i.pin)}this._rendering=!1,this._rendered=!0,this.trigger(`afterrender`,e)},updateParameter:function(e,t){var n=this.outputs[e],r=n.parameters,i=n._parametersCopy;if(i||=n._parametersCopy={},r)for(var a in r)a!==`width`&&a!==`height`&&(i[a]=r[a]);var o=typeof r.width==`function`?r.width.call(this,t):r.width,s=typeof r.height==`function`?r.height.call(this,t):r.height;return o=Math.ceil(o),s=Math.ceil(s),(i.width!==o||i.height!==s)&&this._outputTextures[e]&&this._outputTextures[e].dispose(t),i.width=o,i.height=s,i},setParameter:function(e,t){this.pass.setUniform(e,t)},getParameter:function(e){return this.pass.getUniform(e)},setParameters:function(e){for(var t in e)this.setParameter(t,e[t])},define:function(e,t){this.pass.material.define(`fragment`,e,t)},undefine:function(e){this.pass.material.undefine(`fragment`,e)},removeReference:function(e){this._outputReferences[e]--,this._outputReferences[e]===0&&(this.outputs[e].keepLastFrame?(this._prevOutputTextures[e]&&this._compositor.releaseTexture(this._prevOutputTextures[e]),this._prevOutputTextures[e]=this._outputTextures[e]):this._compositor.releaseTexture(this._outputTextures[e]))},clear:function(){hl.prototype.clear.call(this),this.pass.material.disableTexturesAll()}}),xl=`@export clay.compositor.coloradjust
varying vec2 v_Texcoord;
uniform sampler2D texture;
uniform float brightness : 0.0;
uniform float contrast : 1.0;
uniform float exposure : 0.0;
uniform float gamma : 1.0;
uniform float saturation : 1.0;
const vec3 w = vec3(0.2125, 0.7154, 0.0721);
void main()
{
 vec4 tex = texture2D( texture, v_Texcoord);
 vec3 color = clamp(tex.rgb + vec3(brightness), 0.0, 1.0);
 color = clamp( (color-vec3(0.5))*contrast+vec3(0.5), 0.0, 1.0);
 color = clamp( color * pow(2.0, exposure), 0.0, 1.0);
 color = clamp( pow(color, vec3(gamma)), 0.0, 1.0);
 float luminance = dot( color, w );
 color = mix(vec3(luminance), color, saturation);
 gl_FragColor = vec4(color, tex.a);
}
@end
@export clay.compositor.brightness
varying vec2 v_Texcoord;
uniform sampler2D texture;
uniform float brightness : 0.0;
void main()
{
 vec4 tex = texture2D( texture, v_Texcoord);
 vec3 color = tex.rgb + vec3(brightness);
 gl_FragColor = vec4(color, tex.a);
}
@end
@export clay.compositor.contrast
varying vec2 v_Texcoord;
uniform sampler2D texture;
uniform float contrast : 1.0;
void main()
{
 vec4 tex = texture2D( texture, v_Texcoord);
 vec3 color = (tex.rgb-vec3(0.5))*contrast+vec3(0.5);
 gl_FragColor = vec4(color, tex.a);
}
@end
@export clay.compositor.exposure
varying vec2 v_Texcoord;
uniform sampler2D texture;
uniform float exposure : 0.0;
void main()
{
 vec4 tex = texture2D(texture, v_Texcoord);
 vec3 color = tex.rgb * pow(2.0, exposure);
 gl_FragColor = vec4(color, tex.a);
}
@end
@export clay.compositor.gamma
varying vec2 v_Texcoord;
uniform sampler2D texture;
uniform float gamma : 1.0;
void main()
{
 vec4 tex = texture2D(texture, v_Texcoord);
 vec3 color = pow(tex.rgb, vec3(gamma));
 gl_FragColor = vec4(color, tex.a);
}
@end
@export clay.compositor.saturation
varying vec2 v_Texcoord;
uniform sampler2D texture;
uniform float saturation : 1.0;
const vec3 w = vec3(0.2125, 0.7154, 0.0721);
void main()
{
 vec4 tex = texture2D(texture, v_Texcoord);
 vec3 color = tex.rgb;
 float luminance = dot(color, w);
 color = mix(vec3(luminance), color, saturation);
 gl_FragColor = vec4(color, tex.a);
}
@end`,Sl=`@export clay.compositor.kernel.gaussian_9
float gaussianKernel[9];
gaussianKernel[0] = 0.07;
gaussianKernel[1] = 0.09;
gaussianKernel[2] = 0.12;
gaussianKernel[3] = 0.14;
gaussianKernel[4] = 0.16;
gaussianKernel[5] = 0.14;
gaussianKernel[6] = 0.12;
gaussianKernel[7] = 0.09;
gaussianKernel[8] = 0.07;
@end
@export clay.compositor.kernel.gaussian_13
float gaussianKernel[13];
gaussianKernel[0] = 0.02;
gaussianKernel[1] = 0.03;
gaussianKernel[2] = 0.06;
gaussianKernel[3] = 0.08;
gaussianKernel[4] = 0.11;
gaussianKernel[5] = 0.13;
gaussianKernel[6] = 0.14;
gaussianKernel[7] = 0.13;
gaussianKernel[8] = 0.11;
gaussianKernel[9] = 0.08;
gaussianKernel[10] = 0.06;
gaussianKernel[11] = 0.03;
gaussianKernel[12] = 0.02;
@end
@export clay.compositor.gaussian_blur
#define SHADER_NAME gaussian_blur
uniform sampler2D texture;varying vec2 v_Texcoord;
uniform float blurSize : 2.0;
uniform vec2 textureSize : [512.0, 512.0];
uniform float blurDir : 0.0;
@import clay.util.rgbm
@import clay.util.clamp_sample
void main (void)
{
 @import clay.compositor.kernel.gaussian_9
 vec2 off = blurSize / textureSize;
 off *= vec2(1.0 - blurDir, blurDir);
 vec4 sum = vec4(0.0);
 float weightAll = 0.0;
 for (int i = 0; i < 9; i++) {
 float w = gaussianKernel[i];
 vec4 texel = decodeHDR(clampSample(texture, v_Texcoord + float(i - 4) * off));
 sum += texel * w;
 weightAll += w;
 }
 gl_FragColor = encodeHDR(sum / max(weightAll, 0.01));
}
@end
`,Cl=`@export clay.compositor.hdr.log_lum
varying vec2 v_Texcoord;
uniform sampler2D texture;
const vec3 w = vec3(0.2125, 0.7154, 0.0721);
@import clay.util.rgbm
void main()
{
 vec4 tex = decodeHDR(texture2D(texture, v_Texcoord));
 float luminance = dot(tex.rgb, w);
 luminance = log(luminance + 0.001);
 gl_FragColor = encodeHDR(vec4(vec3(luminance), 1.0));
}
@end
@export clay.compositor.hdr.lum_adaption
varying vec2 v_Texcoord;
uniform sampler2D adaptedLum;
uniform sampler2D currentLum;
uniform float frameTime : 0.02;
@import clay.util.rgbm
void main()
{
 float fAdaptedLum = decodeHDR(texture2D(adaptedLum, vec2(0.5, 0.5))).r;
 float fCurrentLum = exp(encodeHDR(texture2D(currentLum, vec2(0.5, 0.5))).r);
 fAdaptedLum += (fCurrentLum - fAdaptedLum) * (1.0 - pow(0.98, 30.0 * frameTime));
 gl_FragColor = encodeHDR(vec4(vec3(fAdaptedLum), 1.0));
}
@end
@export clay.compositor.lum
varying vec2 v_Texcoord;
uniform sampler2D texture;
const vec3 w = vec3(0.2125, 0.7154, 0.0721);
void main()
{
 vec4 tex = texture2D( texture, v_Texcoord );
 float luminance = dot(tex.rgb, w);
 gl_FragColor = vec4(vec3(luminance), 1.0);
}
@end`,wl=`
@export clay.compositor.lut
varying vec2 v_Texcoord;
uniform sampler2D texture;
uniform sampler2D lookup;
void main()
{
 vec4 tex = texture2D(texture, v_Texcoord);
 float blueColor = tex.b * 63.0;
 vec2 quad1;
 quad1.y = floor(floor(blueColor) / 8.0);
 quad1.x = floor(blueColor) - (quad1.y * 8.0);
 vec2 quad2;
 quad2.y = floor(ceil(blueColor) / 8.0);
 quad2.x = ceil(blueColor) - (quad2.y * 8.0);
 vec2 texPos1;
 texPos1.x = (quad1.x * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * tex.r);
 texPos1.y = (quad1.y * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * tex.g);
 vec2 texPos2;
 texPos2.x = (quad2.x * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * tex.r);
 texPos2.y = (quad2.y * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * tex.g);
 vec4 newColor1 = texture2D(lookup, texPos1);
 vec4 newColor2 = texture2D(lookup, texPos2);
 vec4 newColor = mix(newColor1, newColor2, fract(blueColor));
 gl_FragColor = vec4(newColor.rgb, tex.w);
}
@end`,Tl=`@export clay.compositor.vignette
#define OUTPUT_ALPHA
varying vec2 v_Texcoord;
uniform sampler2D texture;
uniform float darkness: 1;
uniform float offset: 1;
@import clay.util.rgbm
void main()
{
 vec4 texel = decodeHDR(texture2D(texture, v_Texcoord));
 gl_FragColor.rgb = texel.rgb;
 vec2 uv = (v_Texcoord - vec2(0.5)) * vec2(offset);
 gl_FragColor = encodeHDR(vec4(mix(texel.rgb, vec3(1.0 - darkness), dot(uv, uv)), texel.a));
}
@end`,El=`@export clay.compositor.output
#define OUTPUT_ALPHA
varying vec2 v_Texcoord;
uniform sampler2D texture;
@import clay.util.rgbm
void main()
{
 vec4 tex = decodeHDR(texture2D(texture, v_Texcoord));
 gl_FragColor.rgb = tex.rgb;
#ifdef OUTPUT_ALPHA
 gl_FragColor.a = tex.a;
#else
 gl_FragColor.a = 1.0;
#endif
 gl_FragColor = encodeHDR(gl_FragColor);
#ifdef PREMULTIPLY_ALPHA
 gl_FragColor.rgb *= gl_FragColor.a;
#endif
}
@end`,Dl=`@export clay.compositor.bright
uniform sampler2D texture;
uniform float threshold : 1;
uniform float scale : 1.0;
uniform vec2 textureSize: [512, 512];
varying vec2 v_Texcoord;
const vec3 lumWeight = vec3(0.2125, 0.7154, 0.0721);
@import clay.util.rgbm
vec4 median(vec4 a, vec4 b, vec4 c)
{
 return a + b + c - min(min(a, b), c) - max(max(a, b), c);
}
void main()
{
 vec4 texel = decodeHDR(texture2D(texture, v_Texcoord));
#ifdef ANTI_FLICKER
 vec3 d = 1.0 / textureSize.xyx * vec3(1.0, 1.0, 0.0);
 vec4 s1 = decodeHDR(texture2D(texture, v_Texcoord - d.xz));
 vec4 s2 = decodeHDR(texture2D(texture, v_Texcoord + d.xz));
 vec4 s3 = decodeHDR(texture2D(texture, v_Texcoord - d.zy));
 vec4 s4 = decodeHDR(texture2D(texture, v_Texcoord + d.zy));
 texel = median(median(texel, s1, s2), s3, s4);
#endif
 float lum = dot(texel.rgb , lumWeight);
 vec4 color;
 if (lum > threshold && texel.a > 0.0)
 {
 color = vec4(texel.rgb * scale, texel.a * scale);
 }
 else
 {
 color = vec4(0.0);
 }
 gl_FragColor = encodeHDR(color);
}
@end
`,Ol=`@export clay.compositor.downsample
uniform sampler2D texture;
uniform vec2 textureSize : [512, 512];
varying vec2 v_Texcoord;
@import clay.util.rgbm
float brightness(vec3 c)
{
 return max(max(c.r, c.g), c.b);
}
@import clay.util.clamp_sample
void main()
{
 vec4 d = vec4(-1.0, -1.0, 1.0, 1.0) / textureSize.xyxy;
#ifdef ANTI_FLICKER
 vec3 s1 = decodeHDR(clampSample(texture, v_Texcoord + d.xy)).rgb;
 vec3 s2 = decodeHDR(clampSample(texture, v_Texcoord + d.zy)).rgb;
 vec3 s3 = decodeHDR(clampSample(texture, v_Texcoord + d.xw)).rgb;
 vec3 s4 = decodeHDR(clampSample(texture, v_Texcoord + d.zw)).rgb;
 float s1w = 1.0 / (brightness(s1) + 1.0);
 float s2w = 1.0 / (brightness(s2) + 1.0);
 float s3w = 1.0 / (brightness(s3) + 1.0);
 float s4w = 1.0 / (brightness(s4) + 1.0);
 float oneDivideSum = 1.0 / (s1w + s2w + s3w + s4w);
 vec4 color = vec4(
 (s1 * s1w + s2 * s2w + s3 * s3w + s4 * s4w) * oneDivideSum,
 1.0
 );
#else
 vec4 color = decodeHDR(clampSample(texture, v_Texcoord + d.xy));
 color += decodeHDR(clampSample(texture, v_Texcoord + d.zy));
 color += decodeHDR(clampSample(texture, v_Texcoord + d.xw));
 color += decodeHDR(clampSample(texture, v_Texcoord + d.zw));
 color *= 0.25;
#endif
 gl_FragColor = encodeHDR(color);
}
@end`,kl=`
@export clay.compositor.upsample
#define HIGH_QUALITY
uniform sampler2D texture;
uniform vec2 textureSize : [512, 512];
uniform float sampleScale: 0.5;
varying vec2 v_Texcoord;
@import clay.util.rgbm
@import clay.util.clamp_sample
void main()
{
#ifdef HIGH_QUALITY
 vec4 d = vec4(1.0, 1.0, -1.0, 0.0) / textureSize.xyxy * sampleScale;
 vec4 s;
 s = decodeHDR(clampSample(texture, v_Texcoord - d.xy));
 s += decodeHDR(clampSample(texture, v_Texcoord - d.wy)) * 2.0;
 s += decodeHDR(clampSample(texture, v_Texcoord - d.zy));
 s += decodeHDR(clampSample(texture, v_Texcoord + d.zw)) * 2.0;
 s += decodeHDR(clampSample(texture, v_Texcoord )) * 4.0;
 s += decodeHDR(clampSample(texture, v_Texcoord + d.xw)) * 2.0;
 s += decodeHDR(clampSample(texture, v_Texcoord + d.zy));
 s += decodeHDR(clampSample(texture, v_Texcoord + d.wy)) * 2.0;
 s += decodeHDR(clampSample(texture, v_Texcoord + d.xy));
 gl_FragColor = encodeHDR(s / 16.0);
#else
 vec4 d = vec4(-1.0, -1.0, +1.0, +1.0) / textureSize.xyxy;
 vec4 s;
 s = decodeHDR(clampSample(texture, v_Texcoord + d.xy));
 s += decodeHDR(clampSample(texture, v_Texcoord + d.zy));
 s += decodeHDR(clampSample(texture, v_Texcoord + d.xw));
 s += decodeHDR(clampSample(texture, v_Texcoord + d.zw));
 gl_FragColor = encodeHDR(s / 4.0);
#endif
}
@end`,Al=`@export clay.compositor.hdr.composite
#define TONEMAPPING
uniform sampler2D texture;
#ifdef BLOOM_ENABLED
uniform sampler2D bloom;
#endif
#ifdef LENSFLARE_ENABLED
uniform sampler2D lensflare;
uniform sampler2D lensdirt;
#endif
#ifdef LUM_ENABLED
uniform sampler2D lum;
#endif
#ifdef LUT_ENABLED
uniform sampler2D lut;
#endif
#ifdef COLOR_CORRECTION
uniform float brightness : 0.0;
uniform float contrast : 1.0;
uniform float saturation : 1.0;
#endif
#ifdef VIGNETTE
uniform float vignetteDarkness: 1.0;
uniform float vignetteOffset: 1.0;
#endif
uniform float exposure : 1.0;
uniform float bloomIntensity : 0.25;
uniform float lensflareIntensity : 1;
varying vec2 v_Texcoord;
@import clay.util.srgb
vec3 ACESToneMapping(vec3 color)
{
 const float A = 2.51;
 const float B = 0.03;
 const float C = 2.43;
 const float D = 0.59;
 const float E = 0.14;
 return (color * (A * color + B)) / (color * (C * color + D) + E);
}
float eyeAdaption(float fLum)
{
 return mix(0.2, fLum, 0.5);
}
#ifdef LUT_ENABLED
vec3 lutTransform(vec3 color) {
 float blueColor = color.b * 63.0;
 vec2 quad1;
 quad1.y = floor(floor(blueColor) / 8.0);
 quad1.x = floor(blueColor) - (quad1.y * 8.0);
 vec2 quad2;
 quad2.y = floor(ceil(blueColor) / 8.0);
 quad2.x = ceil(blueColor) - (quad2.y * 8.0);
 vec2 texPos1;
 texPos1.x = (quad1.x * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * color.r);
 texPos1.y = (quad1.y * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * color.g);
 vec2 texPos2;
 texPos2.x = (quad2.x * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * color.r);
 texPos2.y = (quad2.y * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * color.g);
 vec4 newColor1 = texture2D(lut, texPos1);
 vec4 newColor2 = texture2D(lut, texPos2);
 vec4 newColor = mix(newColor1, newColor2, fract(blueColor));
 return newColor.rgb;
}
#endif
@import clay.util.rgbm
void main()
{
 vec4 texel = vec4(0.0);
 vec4 originalTexel = vec4(0.0);
#ifdef TEXTURE_ENABLED
 texel = decodeHDR(texture2D(texture, v_Texcoord));
 originalTexel = texel;
#endif
#ifdef BLOOM_ENABLED
 vec4 bloomTexel = decodeHDR(texture2D(bloom, v_Texcoord));
 texel.rgb += bloomTexel.rgb * bloomIntensity;
 texel.a += bloomTexel.a * bloomIntensity;
#endif
#ifdef LENSFLARE_ENABLED
 texel += decodeHDR(texture2D(lensflare, v_Texcoord)) * texture2D(lensdirt, v_Texcoord) * lensflareIntensity;
#endif
 texel.a = min(texel.a, 1.0);
#ifdef LUM_ENABLED
 float fLum = texture2D(lum, vec2(0.5, 0.5)).r;
 float adaptedLumDest = 3.0 / (max(0.1, 1.0 + 10.0*eyeAdaption(fLum)));
 float exposureBias = adaptedLumDest * exposure;
#else
 float exposureBias = exposure;
#endif
#ifdef TONEMAPPING
 texel.rgb *= exposureBias;
 texel.rgb = ACESToneMapping(texel.rgb);
#endif
 texel = linearTosRGB(texel);
#ifdef LUT_ENABLED
 texel.rgb = lutTransform(clamp(texel.rgb,vec3(0.0),vec3(1.0)));
#endif
#ifdef COLOR_CORRECTION
 texel.rgb = clamp(texel.rgb + vec3(brightness), 0.0, 1.0);
 texel.rgb = clamp((texel.rgb - vec3(0.5))*contrast+vec3(0.5), 0.0, 1.0);
 float lum = dot(texel.rgb, vec3(0.2125, 0.7154, 0.0721));
 texel.rgb = mix(vec3(lum), texel.rgb, saturation);
#endif
#ifdef VIGNETTE
 vec2 uv = (v_Texcoord - vec2(0.5)) * vec2(vignetteOffset);
 texel.rgb = mix(texel.rgb, vec3(1.0 - vignetteDarkness), dot(uv, uv));
#endif
 gl_FragColor = encodeHDR(texel);
#ifdef DEBUG
 #if DEBUG == 1
 gl_FragColor = encodeHDR(decodeHDR(texture2D(texture, v_Texcoord)));
 #elif DEBUG == 2
 gl_FragColor = encodeHDR(decodeHDR(texture2D(bloom, v_Texcoord)) * bloomIntensity);
 #elif DEBUG == 3
 gl_FragColor = encodeHDR(decodeHDR(texture2D(lensflare, v_Texcoord) * lensflareIntensity));
 #endif
#endif
 if (originalTexel.a <= 0.01 && gl_FragColor.a > 1e-5) {
 gl_FragColor.a = dot(gl_FragColor.rgb, vec3(0.2125, 0.7154, 0.0721));
 }
#ifdef PREMULTIPLY_ALPHA
 gl_FragColor.rgb *= gl_FragColor.a;
#endif
}
@end`,jl=`@export clay.compositor.lensflare
#define SAMPLE_NUMBER 8
uniform sampler2D texture;
uniform sampler2D lenscolor;
uniform vec2 textureSize : [512, 512];
uniform float dispersal : 0.3;
uniform float haloWidth : 0.4;
uniform float distortion : 1.0;
varying vec2 v_Texcoord;
@import clay.util.rgbm
vec4 textureDistorted(
 in vec2 texcoord,
 in vec2 direction,
 in vec3 distortion
) {
 return vec4(
 decodeHDR(texture2D(texture, texcoord + direction * distortion.r)).r,
 decodeHDR(texture2D(texture, texcoord + direction * distortion.g)).g,
 decodeHDR(texture2D(texture, texcoord + direction * distortion.b)).b,
 1.0
 );
}
void main()
{
 vec2 texcoord = -v_Texcoord + vec2(1.0); vec2 textureOffset = 1.0 / textureSize;
 vec2 ghostVec = (vec2(0.5) - texcoord) * dispersal;
 vec2 haloVec = normalize(ghostVec) * haloWidth;
 vec3 distortion = vec3(-textureOffset.x * distortion, 0.0, textureOffset.x * distortion);
 vec4 result = vec4(0.0);
 for (int i = 0; i < SAMPLE_NUMBER; i++)
 {
 vec2 offset = fract(texcoord + ghostVec * float(i));
 float weight = length(vec2(0.5) - offset) / length(vec2(0.5));
 weight = pow(1.0 - weight, 10.0);
 result += textureDistorted(offset, normalize(ghostVec), distortion) * weight;
 }
 result *= texture2D(lenscolor, vec2(length(vec2(0.5) - texcoord)) / length(vec2(0.5)));
 float weight = length(vec2(0.5) - fract(texcoord + haloVec)) / length(vec2(0.5));
 weight = pow(1.0 - weight, 10.0);
 vec2 offset = fract(texcoord + haloVec);
 result += textureDistorted(offset, normalize(ghostVec), distortion) * weight;
 gl_FragColor = result;
}
@end`,Ml=`@export clay.compositor.blend
#define SHADER_NAME blend
#ifdef TEXTURE1_ENABLED
uniform sampler2D texture1;
uniform float weight1 : 1.0;
#endif
#ifdef TEXTURE2_ENABLED
uniform sampler2D texture2;
uniform float weight2 : 1.0;
#endif
#ifdef TEXTURE3_ENABLED
uniform sampler2D texture3;
uniform float weight3 : 1.0;
#endif
#ifdef TEXTURE4_ENABLED
uniform sampler2D texture4;
uniform float weight4 : 1.0;
#endif
#ifdef TEXTURE5_ENABLED
uniform sampler2D texture5;
uniform float weight5 : 1.0;
#endif
#ifdef TEXTURE6_ENABLED
uniform sampler2D texture6;
uniform float weight6 : 1.0;
#endif
varying vec2 v_Texcoord;
@import clay.util.rgbm
void main()
{
 vec4 tex = vec4(0.0);
#ifdef TEXTURE1_ENABLED
 tex += decodeHDR(texture2D(texture1, v_Texcoord)) * weight1;
#endif
#ifdef TEXTURE2_ENABLED
 tex += decodeHDR(texture2D(texture2, v_Texcoord)) * weight2;
#endif
#ifdef TEXTURE3_ENABLED
 tex += decodeHDR(texture2D(texture3, v_Texcoord)) * weight3;
#endif
#ifdef TEXTURE4_ENABLED
 tex += decodeHDR(texture2D(texture4, v_Texcoord)) * weight4;
#endif
#ifdef TEXTURE5_ENABLED
 tex += decodeHDR(texture2D(texture5, v_Texcoord)) * weight5;
#endif
#ifdef TEXTURE6_ENABLED
 tex += decodeHDR(texture2D(texture6, v_Texcoord)) * weight6;
#endif
 gl_FragColor = encodeHDR(tex);
}
@end`,Nl=`@export clay.compositor.fxaa
uniform sampler2D texture;
uniform vec4 viewport : VIEWPORT;
varying vec2 v_Texcoord;
#define FXAA_REDUCE_MIN (1.0/128.0)
#define FXAA_REDUCE_MUL (1.0/8.0)
#define FXAA_SPAN_MAX 8.0
@import clay.util.rgbm
void main()
{
 vec2 resolution = 1.0 / viewport.zw;
 vec3 rgbNW = decodeHDR( texture2D( texture, ( gl_FragCoord.xy + vec2( -1.0, -1.0 ) ) * resolution ) ).xyz;
 vec3 rgbNE = decodeHDR( texture2D( texture, ( gl_FragCoord.xy + vec2( 1.0, -1.0 ) ) * resolution ) ).xyz;
 vec3 rgbSW = decodeHDR( texture2D( texture, ( gl_FragCoord.xy + vec2( -1.0, 1.0 ) ) * resolution ) ).xyz;
 vec3 rgbSE = decodeHDR( texture2D( texture, ( gl_FragCoord.xy + vec2( 1.0, 1.0 ) ) * resolution ) ).xyz;
 vec4 rgbaM = decodeHDR( texture2D( texture, gl_FragCoord.xy * resolution ) );
 vec3 rgbM = rgbaM.xyz;
 float opacity = rgbaM.w;
 vec3 luma = vec3( 0.299, 0.587, 0.114 );
 float lumaNW = dot( rgbNW, luma );
 float lumaNE = dot( rgbNE, luma );
 float lumaSW = dot( rgbSW, luma );
 float lumaSE = dot( rgbSE, luma );
 float lumaM = dot( rgbM, luma );
 float lumaMin = min( lumaM, min( min( lumaNW, lumaNE ), min( lumaSW, lumaSE ) ) );
 float lumaMax = max( lumaM, max( max( lumaNW, lumaNE) , max( lumaSW, lumaSE ) ) );
 vec2 dir;
 dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
 dir.y = ((lumaNW + lumaSW) - (lumaNE + lumaSE));
 float dirReduce = max( ( lumaNW + lumaNE + lumaSW + lumaSE ) * ( 0.25 * FXAA_REDUCE_MUL ), FXAA_REDUCE_MIN );
 float rcpDirMin = 1.0 / ( min( abs( dir.x ), abs( dir.y ) ) + dirReduce );
 dir = min( vec2( FXAA_SPAN_MAX, FXAA_SPAN_MAX),
 max( vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),
 dir * rcpDirMin)) * resolution;
 vec3 rgbA = decodeHDR( texture2D( texture, gl_FragCoord.xy * resolution + dir * ( 1.0 / 3.0 - 0.5 ) ) ).xyz;
 rgbA += decodeHDR( texture2D( texture, gl_FragCoord.xy * resolution + dir * ( 2.0 / 3.0 - 0.5 ) ) ).xyz;
 rgbA *= 0.5;
 vec3 rgbB = decodeHDR( texture2D( texture, gl_FragCoord.xy * resolution + dir * -0.5 ) ).xyz;
 rgbB += decodeHDR( texture2D( texture, gl_FragCoord.xy * resolution + dir * 0.5 ) ).xyz;
 rgbB *= 0.25;
 rgbB += rgbA * 0.5;
 float lumaB = dot( rgbB, luma );
 if ( ( lumaB < lumaMin ) || ( lumaB > lumaMax ) )
 {
 gl_FragColor = vec4( rgbA, opacity );
 }
 else {
 gl_FragColor = vec4( rgbB, opacity );
 }
}
@end`;function Pl(e){e.import(xl),e.import(Sl),e.import(Cl),e.import(wl),e.import(Tl),e.import(El),e.import(Dl),e.import(Ol),e.import(kl),e.import(Al),e.import(jl),e.import(Ml),e.import(Nl)}Pl(K);var Fl=/^#source\((.*?)\)/;function Il(e,t){var n=new _l;t||={};var r={textures:{},parameters:{}},i=function(i,a){for(var o=0;o<e.nodes.length;o++){var s=e.nodes[o],c=Ll(s,r,t);c&&n.addNode(c)}};for(var a in e.parameters){var o=e.parameters[a];r.parameters[a]=Bl(o)}return Vl(e,r,t,function(e){r.textures=e,i()}),n}function Ll(e,t,n){var r=e.type||`filter`,i,a,o;if(r===`filter`){var s=e.shader.trim(),c=Fl.exec(s);if(c?i=K.source(c[1].trim()):s.charAt(0)===`#`&&(i=t.shaders[s.substr(1)]),i||=s,!i)return}if(e.inputs)for(var l in a={},e.inputs)typeof e.inputs[l]==`string`?a[l]=e.inputs[l]:a[l]={node:e.inputs[l].node,pin:e.inputs[l].pin};if(e.outputs)for(var l in o={},e.outputs){var u=e.outputs[l];o[l]={},u.attachment!=null&&(o[l].attachment=u.attachment),u.keepLastFrame!=null&&(o[l].keepLastFrame=u.keepLastFrame),u.outputLastFrame!=null&&(o[l].outputLastFrame=u.outputLastFrame),u.parameters&&(o[l].parameters=Bl(u.parameters))}var d=r===`scene`?new vl({name:e.name,scene:n.scene,camera:n.camera,outputs:o}):r===`texture`?new yl({name:e.name,outputs:o}):new bl({name:e.name,shader:i,inputs:a,outputs:o});if(d){if(e.parameters)for(var l in e.parameters){var f=e.parameters[l];typeof f==`string`?(f=f.trim(),f.charAt(0)===`#`?f=t.textures[f.substr(1)]:d.on(`beforerender`,Hl(l,Wl(f)))):typeof f==`function`&&d.on(`beforerender`,f),d.setParameter(l,f)}if(e.defines&&d.pass)for(var l in e.defines){var f=e.defines[l];d.pass.material.define(`fragment`,l,f)}}return d}function Rl(e,t){return e}function zl(e,t){return t}function Bl(e){var t={};if(!e)return t;[`type`,`minFilter`,`magFilter`,`wrapS`,`wrapT`,`flipY`,`useMipmap`].forEach(function(n){var r=e[n];r!=null&&(typeof r==`string`&&(r=q[r]),t[n]=r)});var n=e.scale||1;return[`width`,`height`].forEach(function(r){if(e[r]!=null){var i=e[r];typeof i==`string`?(i=i.trim(),t[r]=Ul(r,Wl(i),n)):t[r]=i}}),t.width||=Rl,t.height||=zl,e.useMipmap!=null&&(t.useMipmap=e.useMipmap),t}function Vl(e,t,n,r){if(!e.textures){r({});return}var i={},a=0,o=!1,s=n.textureRootPath;Fr.each(e.textures,function(e,t){var n,c=e.path,l=Bl(e.parameters);if(Array.isArray(c)&&c.length===6)s&&(c=c.map(function(e){return Fr.relative2absolute(e,s)})),n=new ho(l);else if(typeof c==`string`)s&&(c=Fr.relative2absolute(c,s)),n=new J(l);else return;n.load(c),a++,n.once(`success`,function(){i[t]=n,a--,a===0&&(r(i),o=!0)})}),a===0&&!o&&r(i)}function Hl(e,t){return function(n){var r=n.getDevicePixelRatio(),i=t(n.getWidth(),n.getHeight(),r);this.setParameter(e,i)}}function Ul(e,t,n){return n||=1,function(e){var r=e.getDevicePixelRatio();return t(e.getWidth()*n,e.getHeight()*n,r)}}function Wl(e){var t=/^expr\((.*)\)$/.exec(e);if(t)try{var n=Function(`width`,`height`,`dpr`,`return `+t[1]);return n(1,1),n}catch{throw Error(`Invalid expression.`)}}var Gl=Il;function Kl(e,t){for(var n=0,r=1/t,i=e;i>0;)n+=i%t*r,i=Math.floor(i/t),r/=t;return n}K.import(`@export ecgl.ssao.estimate

uniform sampler2D depthTex;

uniform sampler2D normalTex;

uniform sampler2D noiseTex;

uniform vec2 depthTexSize;

uniform vec2 noiseTexSize;

uniform mat4 projection;

uniform mat4 projectionInv;

uniform mat4 viewInverseTranspose;

uniform vec3 kernel[KERNEL_SIZE];

uniform float radius : 1;

uniform float power : 1;

uniform float bias: 1e-2;

uniform float intensity: 1.0;

varying vec2 v_Texcoord;

float ssaoEstimator(in vec3 originPos, in mat3 kernelBasis) {
 float occlusion = 0.0;

 for (int i = 0; i < KERNEL_SIZE; i++) {
 vec3 samplePos = kernel[i];
#ifdef NORMALTEX_ENABLED
 samplePos = kernelBasis * samplePos;
#endif
 samplePos = samplePos * radius + originPos;

 vec4 texCoord = projection * vec4(samplePos, 1.0);
 texCoord.xy /= texCoord.w;

 vec4 depthTexel = texture2D(depthTex, texCoord.xy * 0.5 + 0.5);

 float sampleDepth = depthTexel.r * 2.0 - 1.0;
 if (projection[3][3] == 0.0) {
 sampleDepth = projection[3][2] / (sampleDepth * projection[2][3] - projection[2][2]);
 }
 else {
 sampleDepth = (sampleDepth - projection[3][2]) / projection[2][2];
 }
 
 float rangeCheck = smoothstep(0.0, 1.0, radius / abs(originPos.z - sampleDepth));
 occlusion += rangeCheck * step(samplePos.z, sampleDepth - bias);
 }
#ifdef NORMALTEX_ENABLED
 occlusion = 1.0 - occlusion / float(KERNEL_SIZE);
#else
 occlusion = 1.0 - clamp((occlusion / float(KERNEL_SIZE) - 0.6) * 2.5, 0.0, 1.0);
#endif
 return pow(occlusion, power);
}

void main()
{

 vec4 depthTexel = texture2D(depthTex, v_Texcoord);

#ifdef NORMALTEX_ENABLED
 vec4 tex = texture2D(normalTex, v_Texcoord);
 if (dot(tex.rgb, tex.rgb) == 0.0) {
 gl_FragColor = vec4(1.0);
 return;
 }
 vec3 N = tex.rgb * 2.0 - 1.0;
 N = (viewInverseTranspose * vec4(N, 0.0)).xyz;

 vec2 noiseTexCoord = depthTexSize / vec2(noiseTexSize) * v_Texcoord;
 vec3 rvec = texture2D(noiseTex, noiseTexCoord).rgb * 2.0 - 1.0;
 vec3 T = normalize(rvec - N * dot(rvec, N));
 vec3 BT = normalize(cross(N, T));
 mat3 kernelBasis = mat3(T, BT, N);
#else
 if (depthTexel.r > 0.99999) {
 gl_FragColor = vec4(1.0);
 return;
 }
 mat3 kernelBasis;
#endif

 float z = depthTexel.r * 2.0 - 1.0;

 vec4 projectedPos = vec4(v_Texcoord * 2.0 - 1.0, z, 1.0);
 vec4 p4 = projectionInv * projectedPos;

 vec3 position = p4.xyz / p4.w;

 float ao = ssaoEstimator(position, kernelBasis);
 ao = clamp(1.0 - (1.0 - ao) * intensity, 0.0, 1.0);
 gl_FragColor = vec4(vec3(ao), 1.0);
}

@end


@export ecgl.ssao.blur
#define SHADER_NAME SSAO_BLUR

uniform sampler2D ssaoTexture;

#ifdef NORMALTEX_ENABLED
uniform sampler2D normalTex;
#endif

varying vec2 v_Texcoord;

uniform vec2 textureSize;
uniform float blurSize : 1.0;

uniform int direction: 0.0;

#ifdef DEPTHTEX_ENABLED
uniform sampler2D depthTex;
uniform mat4 projection;
uniform float depthRange : 0.5;

float getLinearDepth(vec2 coord)
{
 float depth = texture2D(depthTex, coord).r * 2.0 - 1.0;
 return projection[3][2] / (depth * projection[2][3] - projection[2][2]);
}
#endif

void main()
{
 float kernel[5];
 kernel[0] = 0.122581;
 kernel[1] = 0.233062;
 kernel[2] = 0.288713;
 kernel[3] = 0.233062;
 kernel[4] = 0.122581;

 vec2 off = vec2(0.0);
 if (direction == 0) {
 off[0] = blurSize / textureSize.x;
 }
 else {
 off[1] = blurSize / textureSize.y;
 }

 vec2 coord = v_Texcoord;

 float sum = 0.0;
 float weightAll = 0.0;

#ifdef NORMALTEX_ENABLED
 vec3 centerNormal = texture2D(normalTex, v_Texcoord).rgb * 2.0 - 1.0;
#endif
#if defined(DEPTHTEX_ENABLED)
 float centerDepth = getLinearDepth(v_Texcoord);
#endif

 for (int i = 0; i < 5; i++) {
 vec2 coord = clamp(v_Texcoord + vec2(float(i) - 2.0) * off, vec2(0.0), vec2(1.0));

 float w = kernel[i];
#ifdef NORMALTEX_ENABLED
 vec3 normal = texture2D(normalTex, coord).rgb * 2.0 - 1.0;
 w *= clamp(dot(normal, centerNormal), 0.0, 1.0);
#endif
#ifdef DEPTHTEX_ENABLED
 float d = getLinearDepth(coord);
 w *= (1.0 - smoothstep(abs(centerDepth - d) / depthRange, 0.0, 1.0));
#endif

 weightAll += w;
 sum += texture2D(ssaoTexture, coord).r * w;
 }

 gl_FragColor = vec4(vec3(sum / weightAll), 1.0);
}

@end
`);function ql(e){for(var t=new Uint8Array(e*e*4),n=0,r=new F,i=0;i<e;i++)for(var a=0;a<e;a++)r.set(Math.random()*2-1,Math.random()*2-1,0).normalize(),t[n++]=(r.x*.5+.5)*255,t[n++]=(r.y*.5+.5)*255,t[n++]=0,t[n++]=255;return t}function Jl(e){return new J({pixels:ql(e),wrapS:q.REPEAT,wrapT:q.REPEAT,width:e,height:e})}function Yl(e,t,n){var r=new Float32Array(e*3);t||=0;for(var i=0;i<e;i++){var a=Kl(i+t,2)*(n?1:2)*Math.PI,o=Kl(i+t,3)*Math.PI,s=Math.random(),c=Math.cos(a)*Math.sin(o)*s,l=Math.cos(o)*s,u=Math.sin(a)*Math.sin(o)*s;r[i*3]=c,r[i*3+1]=l,r[i*3+2]=u}return r}function Xl(e){e||={},this._ssaoPass=new ys({fragment:K.source(`ecgl.ssao.estimate`)}),this._blurPass=new ys({fragment:K.source(`ecgl.ssao.blur`)}),this._framebuffer=new Oo({depthBuffer:!1}),this._ssaoTexture=new J,this._blurTexture=new J,this._blurTexture2=new J,this._depthTex=e.depthTexture,this._normalTex=e.normalTexture,this.setNoiseSize(4),this.setKernelSize(e.kernelSize||12),e.radius!=null&&this.setParameter(`radius`,e.radius),e.power!=null&&this.setParameter(`power`,e.power),this._normalTex||(this._ssaoPass.material.disableTexture(`normalTex`),this._blurPass.material.disableTexture(`normalTex`)),this._depthTex||this._blurPass.material.disableTexture(`depthTex`),this._blurPass.material.setUniform(`normalTex`,this._normalTex),this._blurPass.material.setUniform(`depthTex`,this._depthTex)}Xl.prototype.setDepthTexture=function(e){this._depthTex=e},Xl.prototype.setNormalTexture=function(e){this._normalTex=e,this._ssaoPass.material[e?`enableTexture`:`disableTexture`](`normalTex`),this.setKernelSize(this._kernelSize)},Xl.prototype.update=function(e,t,n){var r=e.getWidth(),i=e.getHeight(),a=this._ssaoPass,o=this._blurPass;a.setUniform(`kernel`,this._kernels[n%this._kernels.length]),a.setUniform(`depthTex`,this._depthTex),this._normalTex!=null&&a.setUniform(`normalTex`,this._normalTex),a.setUniform(`depthTexSize`,[this._depthTex.width,this._depthTex.height]);var s=new V;V.transpose(s,t.worldTransform),a.setUniform(`projection`,t.projectionMatrix.array),a.setUniform(`projectionInv`,t.invProjectionMatrix.array),a.setUniform(`viewInverseTranspose`,s.array);var c=this._ssaoTexture,l=this._blurTexture,u=this._blurTexture2;c.width=r/2,c.height=i/2,l.width=r,l.height=i,u.width=r,u.height=i,this._framebuffer.attach(c),this._framebuffer.bind(e),e.gl.clearColor(1,1,1,1),e.gl.clear(e.gl.COLOR_BUFFER_BIT),a.render(e),o.setUniform(`textureSize`,[r/2,i/2]),o.setUniform(`projection`,t.projectionMatrix.array),this._framebuffer.attach(l),o.setUniform(`direction`,0),o.setUniform(`ssaoTexture`,c),o.render(e),this._framebuffer.attach(u),o.setUniform(`textureSize`,[r,i]),o.setUniform(`direction`,1),o.setUniform(`ssaoTexture`,l),o.render(e),this._framebuffer.unbind(e);var d=e.clearColor;e.gl.clearColor(d[0],d[1],d[2],d[3])},Xl.prototype.getTargetTexture=function(){return this._blurTexture2},Xl.prototype.setParameter=function(e,t){e===`noiseTexSize`?this.setNoiseSize(t):e===`kernelSize`?this.setKernelSize(t):e===`intensity`?this._ssaoPass.material.set(`intensity`,t):this._ssaoPass.setUniform(e,t)},Xl.prototype.setKernelSize=function(e){this._kernelSize=e,this._ssaoPass.material.define(`fragment`,`KERNEL_SIZE`,e),this._kernels=this._kernels||[];for(var t=0;t<30;t++)this._kernels[t]=Yl(e,t*e,!!this._normalTex)},Xl.prototype.setNoiseSize=function(e){var t=this._ssaoPass.getUniform(`noiseTex`);t?(t.data=ql(e),t.width=t.height=e,t.dirty()):(t=Jl(e),this._ssaoPass.setUniform(`noiseTex`,Jl(e))),this._ssaoPass.setUniform(`noiseTexSize`,[e,e])},Xl.prototype.dispose=function(e){this._blurTexture.dispose(e),this._ssaoTexture.dispose(e),this._blurTexture2.dispose(e)},K.import(`@export ecgl.ssr.main

#define SHADER_NAME SSR
#define MAX_ITERATION 20;
#define SAMPLE_PER_FRAME 5;
#define TOTAL_SAMPLES 128;

uniform sampler2D sourceTexture;
uniform sampler2D gBufferTexture1;
uniform sampler2D gBufferTexture2;
uniform sampler2D gBufferTexture3;
uniform samplerCube specularCubemap;
uniform float specularIntensity: 1;

uniform mat4 projection;
uniform mat4 projectionInv;
uniform mat4 toViewSpace;
uniform mat4 toWorldSpace;

uniform float maxRayDistance: 200;

uniform float pixelStride: 16;
uniform float pixelStrideZCutoff: 50; 
uniform float screenEdgeFadeStart: 0.9; 
uniform float eyeFadeStart : 0.2; uniform float eyeFadeEnd: 0.8; 
uniform float minGlossiness: 0.2; uniform float zThicknessThreshold: 1;

uniform float nearZ;
uniform vec2 viewportSize : VIEWPORT_SIZE;

uniform float jitterOffset: 0;

varying vec2 v_Texcoord;

#ifdef DEPTH_DECODE
@import clay.util.decode_float
#endif

#ifdef PHYSICALLY_CORRECT
uniform sampler2D normalDistribution;
uniform float sampleOffset: 0;
uniform vec2 normalDistributionSize;

vec3 transformNormal(vec3 H, vec3 N) {
 vec3 upVector = N.y > 0.999 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
 vec3 tangentX = normalize(cross(N, upVector));
 vec3 tangentZ = cross(N, tangentX);
 return normalize(tangentX * H.x + N * H.y + tangentZ * H.z);
}
vec3 importanceSampleNormalGGX(float i, float roughness, vec3 N) {
 float p = fract((i + sampleOffset) / float(TOTAL_SAMPLES));
 vec3 H = texture2D(normalDistribution,vec2(roughness, p)).rgb;
 return transformNormal(H, N);
}
float G_Smith(float g, float ndv, float ndl) {
 float roughness = 1.0 - g;
 float k = roughness * roughness / 2.0;
 float G1V = ndv / (ndv * (1.0 - k) + k);
 float G1L = ndl / (ndl * (1.0 - k) + k);
 return G1L * G1V;
}
vec3 F_Schlick(float ndv, vec3 spec) {
 return spec + (1.0 - spec) * pow(1.0 - ndv, 5.0);
}
#endif

float fetchDepth(sampler2D depthTexture, vec2 uv)
{
 vec4 depthTexel = texture2D(depthTexture, uv);
 return depthTexel.r * 2.0 - 1.0;
}

float linearDepth(float depth)
{
 if (projection[3][3] == 0.0) {
 return projection[3][2] / (depth * projection[2][3] - projection[2][2]);
 }
 else {
 return (depth - projection[3][2]) / projection[2][2];
 }
}

bool rayIntersectDepth(float rayZNear, float rayZFar, vec2 hitPixel)
{
 if (rayZFar > rayZNear)
 {
 float t = rayZFar; rayZFar = rayZNear; rayZNear = t;
 }
 float cameraZ = linearDepth(fetchDepth(gBufferTexture2, hitPixel));
 return rayZFar <= cameraZ && rayZNear >= cameraZ - zThicknessThreshold;
}


bool traceScreenSpaceRay(
 vec3 rayOrigin, vec3 rayDir, float jitter,
 out vec2 hitPixel, out vec3 hitPoint, out float iterationCount
)
{
 float rayLength = ((rayOrigin.z + rayDir.z * maxRayDistance) > -nearZ)
 ? (-nearZ - rayOrigin.z) / rayDir.z : maxRayDistance;

 vec3 rayEnd = rayOrigin + rayDir * rayLength;

 vec4 H0 = projection * vec4(rayOrigin, 1.0);
 vec4 H1 = projection * vec4(rayEnd, 1.0);

 float k0 = 1.0 / H0.w, k1 = 1.0 / H1.w;

 vec3 Q0 = rayOrigin * k0, Q1 = rayEnd * k1;

 vec2 P0 = (H0.xy * k0 * 0.5 + 0.5) * viewportSize;
 vec2 P1 = (H1.xy * k1 * 0.5 + 0.5) * viewportSize;

 P1 += dot(P1 - P0, P1 - P0) < 0.0001 ? 0.01 : 0.0;
 vec2 delta = P1 - P0;

 bool permute = false;
 if (abs(delta.x) < abs(delta.y)) {
 permute = true;
 delta = delta.yx;
 P0 = P0.yx;
 P1 = P1.yx;
 }
 float stepDir = sign(delta.x);
 float invdx = stepDir / delta.x;

 vec3 dQ = (Q1 - Q0) * invdx;
 float dk = (k1 - k0) * invdx;

 vec2 dP = vec2(stepDir, delta.y * invdx);

 float strideScaler = 1.0 - min(1.0, -rayOrigin.z / pixelStrideZCutoff);
 float pixStride = 1.0 + strideScaler * pixelStride;

 dP *= pixStride; dQ *= pixStride; dk *= pixStride;

 vec4 pqk = vec4(P0, Q0.z, k0);
 vec4 dPQK = vec4(dP, dQ.z, dk);

 pqk += dPQK * jitter;
 float rayZFar = (dPQK.z * 0.5 + pqk.z) / (dPQK.w * 0.5 + pqk.w);
 float rayZNear;

 bool intersect = false;

 vec2 texelSize = 1.0 / viewportSize;

 iterationCount = 0.0;

 for (int i = 0; i < MAX_ITERATION; i++)
 {
 pqk += dPQK;

 rayZNear = rayZFar;
 rayZFar = (dPQK.z * 0.5 + pqk.z) / (dPQK.w * 0.5 + pqk.w);

 hitPixel = permute ? pqk.yx : pqk.xy;
 hitPixel *= texelSize;

 intersect = rayIntersectDepth(rayZNear, rayZFar, hitPixel);

 iterationCount += 1.0;

 dPQK *= 1.2;

 if (intersect) {
 break;
 }
 }

 Q0.xy += dQ.xy * iterationCount;
 Q0.z = pqk.z;
 hitPoint = Q0 / pqk.w;

 return intersect;
}

float calculateAlpha(
 float iterationCount, float reflectivity,
 vec2 hitPixel, vec3 hitPoint, float dist, vec3 rayDir
)
{
 float alpha = clamp(reflectivity, 0.0, 1.0);
 alpha *= 1.0 - (iterationCount / float(MAX_ITERATION));
 vec2 hitPixelNDC = hitPixel * 2.0 - 1.0;
 float maxDimension = min(1.0, max(abs(hitPixelNDC.x), abs(hitPixelNDC.y)));
 alpha *= 1.0 - max(0.0, maxDimension - screenEdgeFadeStart) / (1.0 - screenEdgeFadeStart);

 float _eyeFadeStart = eyeFadeStart;
 float _eyeFadeEnd = eyeFadeEnd;
 if (_eyeFadeStart > _eyeFadeEnd) {
 float tmp = _eyeFadeEnd;
 _eyeFadeEnd = _eyeFadeStart;
 _eyeFadeStart = tmp;
 }

 float eyeDir = clamp(rayDir.z, _eyeFadeStart, _eyeFadeEnd);
 alpha *= 1.0 - (eyeDir - _eyeFadeStart) / (_eyeFadeEnd - _eyeFadeStart);

 alpha *= 1.0 - clamp(dist / maxRayDistance, 0.0, 1.0);

 return alpha;
}

@import clay.util.rand

@import clay.util.rgbm

void main()
{
 vec4 normalAndGloss = texture2D(gBufferTexture1, v_Texcoord);

 if (dot(normalAndGloss.rgb, vec3(1.0)) == 0.0) {
 discard;
 }

 float g = normalAndGloss.a;
#if !defined(PHYSICALLY_CORRECT)
 if (g <= minGlossiness) {
 discard;
 }
#endif

 float reflectivity = (g - minGlossiness) / (1.0 - minGlossiness);

 vec3 N = normalize(normalAndGloss.rgb * 2.0 - 1.0);
 N = normalize((toViewSpace * vec4(N, 0.0)).xyz);

 vec4 projectedPos = vec4(v_Texcoord * 2.0 - 1.0, fetchDepth(gBufferTexture2, v_Texcoord), 1.0);
 vec4 pos = projectionInv * projectedPos;
 vec3 rayOrigin = pos.xyz / pos.w;
 vec3 V = -normalize(rayOrigin);

 float ndv = clamp(dot(N, V), 0.0, 1.0);
 float iterationCount;
 float jitter = rand(fract(v_Texcoord + jitterOffset));

#ifdef PHYSICALLY_CORRECT
 vec4 color = vec4(vec3(0.0), 1.0);
 vec4 albedoMetalness = texture2D(gBufferTexture3, v_Texcoord);
 vec3 albedo = albedoMetalness.rgb;
 float m = albedoMetalness.a;
 vec3 diffuseColor = albedo * (1.0 - m);
 vec3 spec = mix(vec3(0.04), albedo, m);

 float jitter2 = rand(fract(v_Texcoord)) * float(TOTAL_SAMPLES);

 for (int i = 0; i < SAMPLE_PER_FRAME; i++) {
 vec3 H = importanceSampleNormalGGX(float(i) + jitter2, 1.0 - g, N);
 vec3 rayDir = normalize(reflect(-V, H));
#else
 vec3 rayDir = normalize(reflect(-V, N));
#endif
 vec2 hitPixel;
 vec3 hitPoint;

 bool intersect = traceScreenSpaceRay(rayOrigin, rayDir, jitter, hitPixel, hitPoint, iterationCount);

 float dist = distance(rayOrigin, hitPoint);

 vec3 hitNormal = texture2D(gBufferTexture1, hitPixel).rgb * 2.0 - 1.0;
 hitNormal = normalize((toViewSpace * vec4(hitNormal, 0.0)).xyz);
#ifdef PHYSICALLY_CORRECT
 float ndl = clamp(dot(N, rayDir), 0.0, 1.0);
 float vdh = clamp(dot(V, H), 0.0, 1.0);
 float ndh = clamp(dot(N, H), 0.0, 1.0);
 vec3 litTexel = vec3(0.0);
 if (dot(hitNormal, rayDir) < 0.0 && intersect) {
 litTexel = texture2D(sourceTexture, hitPixel).rgb;
 litTexel *= pow(clamp(1.0 - dist / 200.0, 0.0, 1.0), 3.0);

 }
 else {
 #ifdef SPECULARCUBEMAP_ENABLED
 vec3 rayDirW = normalize(toWorldSpace * vec4(rayDir, 0.0)).rgb;
 litTexel = RGBMDecode(textureCubeLodEXT(specularCubemap, rayDirW, 0.0), 8.12).rgb * specularIntensity;
#endif
 }
 color.rgb += ndl * litTexel * (
 F_Schlick(ndl, spec) * G_Smith(g, ndv, ndl) * vdh / (ndh * ndv + 0.001)
 );
 }
 color.rgb /= float(SAMPLE_PER_FRAME);
#else
 #if !defined(SPECULARCUBEMAP_ENABLED)
 if (dot(hitNormal, rayDir) >= 0.0) {
 discard;
 }
 if (!intersect) {
 discard;
 }
#endif
 float alpha = clamp(calculateAlpha(iterationCount, reflectivity, hitPixel, hitPoint, dist, rayDir), 0.0, 1.0);
 vec4 color = texture2D(sourceTexture, hitPixel);
 color.rgb *= alpha;

#ifdef SPECULARCUBEMAP_ENABLED
 vec3 rayDirW = normalize(toWorldSpace * vec4(rayDir, 0.0)).rgb;
 alpha = alpha * (intersect ? 1.0 : 0.0);
 float bias = (1.0 -g) * 5.0;
 color.rgb += (1.0 - alpha)
 * RGBMDecode(textureCubeLodEXT(specularCubemap, rayDirW, bias), 8.12).rgb
 * specularIntensity;
#endif

#endif

 gl_FragColor = encodeHDR(color);
}
@end

@export ecgl.ssr.blur

uniform sampler2D texture;
uniform sampler2D gBufferTexture1;
uniform sampler2D gBufferTexture2;
uniform mat4 projection;
uniform float depthRange : 0.05;

varying vec2 v_Texcoord;

uniform vec2 textureSize;
uniform float blurSize : 1.0;

#ifdef BLEND
 #ifdef SSAOTEX_ENABLED
uniform sampler2D ssaoTex;
 #endif
uniform sampler2D sourceTexture;
#endif

float getLinearDepth(vec2 coord)
{
 float depth = texture2D(gBufferTexture2, coord).r * 2.0 - 1.0;
 return projection[3][2] / (depth * projection[2][3] - projection[2][2]);
}

@import clay.util.rgbm


void main()
{
 @import clay.compositor.kernel.gaussian_9

 vec4 centerNTexel = texture2D(gBufferTexture1, v_Texcoord);
 float g = centerNTexel.a;
 float maxBlurSize = clamp(1.0 - g, 0.0, 1.0) * blurSize;
#ifdef VERTICAL
 vec2 off = vec2(0.0, maxBlurSize / textureSize.y);
#else
 vec2 off = vec2(maxBlurSize / textureSize.x, 0.0);
#endif

 vec2 coord = v_Texcoord;

 vec4 sum = vec4(0.0);
 float weightAll = 0.0;

 vec3 cN = centerNTexel.rgb * 2.0 - 1.0;
 float cD = getLinearDepth(v_Texcoord);
 for (int i = 0; i < 9; i++) {
 vec2 coord = clamp((float(i) - 4.0) * off + v_Texcoord, vec2(0.0), vec2(1.0));
 float w = gaussianKernel[i]
 * clamp(dot(cN, texture2D(gBufferTexture1, coord).rgb * 2.0 - 1.0), 0.0, 1.0);
 float d = getLinearDepth(coord);
 w *= (1.0 - smoothstep(abs(cD - d) / depthRange, 0.0, 1.0));

 weightAll += w;
 sum += decodeHDR(texture2D(texture, coord)) * w;
 }

#ifdef BLEND
 float aoFactor = 1.0;
 #ifdef SSAOTEX_ENABLED
 aoFactor = texture2D(ssaoTex, v_Texcoord).r;
 #endif
 gl_FragColor = encodeHDR(
 sum / weightAll * aoFactor + decodeHDR(texture2D(sourceTexture, v_Texcoord))
 );
#else
 gl_FragColor = encodeHDR(sum / weightAll);
#endif
}

@end`);function Zl(e){e||={},this._ssrPass=new ys({fragment:K.source(`ecgl.ssr.main`),clearColor:[0,0,0,0]}),this._blurPass1=new ys({fragment:K.source(`ecgl.ssr.blur`),clearColor:[0,0,0,0]}),this._blurPass2=new ys({fragment:K.source(`ecgl.ssr.blur`),clearColor:[0,0,0,0]}),this._blendPass=new ys({fragment:K.source(`clay.compositor.blend`)}),this._blendPass.material.disableTexturesAll(),this._blendPass.material.enableTexture([`texture1`,`texture2`]),this._ssrPass.setUniform(`gBufferTexture1`,e.normalTexture),this._ssrPass.setUniform(`gBufferTexture2`,e.depthTexture),this._blurPass1.setUniform(`gBufferTexture1`,e.normalTexture),this._blurPass1.setUniform(`gBufferTexture2`,e.depthTexture),this._blurPass2.setUniform(`gBufferTexture1`,e.normalTexture),this._blurPass2.setUniform(`gBufferTexture2`,e.depthTexture),this._blurPass2.material.define(`fragment`,`VERTICAL`),this._blurPass2.material.define(`fragment`,`BLEND`),this._ssrTexture=new J({type:q.HALF_FLOAT}),this._texture2=new J({type:q.HALF_FLOAT}),this._texture3=new J({type:q.HALF_FLOAT}),this._prevTexture=new J({type:q.HALF_FLOAT}),this._currentTexture=new J({type:q.HALF_FLOAT}),this._frameBuffer=new Oo({depthBuffer:!1}),this._normalDistribution=null,this._totalSamples=256,this._samplePerFrame=4,this._ssrPass.material.define(`fragment`,`SAMPLE_PER_FRAME`,this._samplePerFrame),this._ssrPass.material.define(`fragment`,`TOTAL_SAMPLES`,this._totalSamples),this._downScale=1}Zl.prototype.setAmbientCubemap=function(e,t){this._ssrPass.material.set(`specularCubemap`,e),this._ssrPass.material.set(`specularIntensity`,t);var n=e&&t;this._ssrPass.material[n?`enableTexture`:`disableTexture`](`specularCubemap`)},Zl.prototype.update=function(e,t,n,r){var i=e.getWidth(),a=e.getHeight(),o=this._ssrTexture,s=this._texture2,c=this._texture3;o.width=this._prevTexture.width=this._currentTexture.width=i/this._downScale,o.height=this._prevTexture.height=this._currentTexture.height=a/this._downScale,s.width=c.width=i,s.height=c.height=a;var l=this._frameBuffer,u=this._ssrPass,d=this._blurPass1,f=this._blurPass2,p=this._blendPass,m=new V,h=new V;V.transpose(m,t.worldTransform),V.transpose(h,t.viewMatrix),u.setUniform(`sourceTexture`,n),u.setUniform(`projection`,t.projectionMatrix.array),u.setUniform(`projectionInv`,t.invProjectionMatrix.array),u.setUniform(`toViewSpace`,m.array),u.setUniform(`toWorldSpace`,h.array),u.setUniform(`nearZ`,t.near);var g=r/this._totalSamples*this._samplePerFrame;if(u.setUniform(`jitterOffset`,g),u.setUniform(`sampleOffset`,r*this._samplePerFrame),d.setUniform(`textureSize`,[o.width,o.height]),f.setUniform(`textureSize`,[i,a]),f.setUniform(`sourceTexture`,n),d.setUniform(`projection`,t.projectionMatrix.array),f.setUniform(`projection`,t.projectionMatrix.array),l.attach(o),l.bind(e),u.render(e),this._physicallyCorrect&&(l.attach(this._currentTexture),p.setUniform(`texture1`,this._prevTexture),p.setUniform(`texture2`,o),p.material.set({weight1:r>=1?.95:0,weight2:r>=1?.05:1}),p.render(e)),l.attach(s),d.setUniform(`texture`,this._physicallyCorrect?this._currentTexture:o),d.render(e),l.attach(c),f.setUniform(`texture`,s),f.render(e),l.unbind(e),this._physicallyCorrect){var _=this._prevTexture;this._prevTexture=this._currentTexture,this._currentTexture=_}},Zl.prototype.getTargetTexture=function(){return this._texture3},Zl.prototype.setParameter=function(e,t){e===`maxIteration`?this._ssrPass.material.define(`fragment`,`MAX_ITERATION`,t):this._ssrPass.setUniform(e,t)},Zl.prototype.setPhysicallyCorrect=function(e){e?(this._normalDistribution||=Ss.generateNormalDistribution(64,this._totalSamples),this._ssrPass.material.define(`fragment`,`PHYSICALLY_CORRECT`),this._ssrPass.material.set(`normalDistribution`,this._normalDistribution),this._ssrPass.material.set(`normalDistributionSize`,[64,this._totalSamples])):this._ssrPass.material.undefine(`fragment`,`PHYSICALLY_CORRECT`),this._physicallyCorrect=e},Zl.prototype.setSSAOTexture=function(e){var t=this._blurPass2;e?(t.material.enableTexture(`ssaoTex`),t.material.set(`ssaoTex`,e)):t.material.disableTexture(`ssaoTex`)},Zl.prototype.isFinished=function(e){return this._physicallyCorrect?e>this._totalSamples/this._samplePerFrame:!0},Zl.prototype.dispose=function(e){this._ssrTexture.dispose(e),this._texture2.dispose(e),this._texture3.dispose(e),this._prevTexture.dispose(e),this._currentTexture.dispose(e),this._frameBuffer.dispose(e)};var Ql=[0,0,-.321585265978,-.154972575841,.458126042375,.188473391593,.842080129861,.527766490688,.147304551086,-.659453822776,-.331943915203,-.940619700594,.0479226680259,.54812163202,.701581552186,-.709825561388,-.295436780218,.940589268233,-.901489676764,.237713156085,.973570876096,-.109899459384,-.866792314779,-.451805525005,.330975007087,.800048655954,-.344275183665,.381779221166,-.386139432542,-.437418421534,-.576478634965,-.0148463392551,.385798197415,-.262426961053,-.666302061145,.682427250835,-.628010632582,-.732836215494,.10163141741,-.987658134403,.711995289051,-.320024291314,.0296005138058,.950296523438,.0130612307608,-.351024443122,-.879596633704,-.10478487883,.435712737232,.504254490347,.779203817497,.206477676721,.388264289969,-.896736162545,-.153106280781,-.629203242522,-.245517550697,.657969239148,.126830499058,.26862328493,-.634888119007,-.302301223431,.617074219636,.779817204925];K.import(`@export ecgl.normal.vertex

@import ecgl.common.transformUniforms

@import ecgl.common.uv.header

@import ecgl.common.attributes

varying vec3 v_Normal;
varying vec3 v_WorldPosition;

@import ecgl.common.normalMap.vertexHeader

@import ecgl.common.vertexAnimation.header

void main()
{

 @import ecgl.common.vertexAnimation.main

 @import ecgl.common.uv.main

 v_Normal = normalize((worldInverseTranspose * vec4(normal, 0.0)).xyz);
 v_WorldPosition = (world * vec4(pos, 1.0)).xyz;

 @import ecgl.common.normalMap.vertexMain

 gl_Position = worldViewProjection * vec4(pos, 1.0);

}


@end


@export ecgl.normal.fragment

#define ROUGHNESS_CHANEL 0

uniform bool useBumpMap;
uniform bool useRoughnessMap;
uniform bool doubleSide;
uniform float roughness;

@import ecgl.common.uv.fragmentHeader

varying vec3 v_Normal;
varying vec3 v_WorldPosition;

uniform mat4 viewInverse : VIEWINVERSE;

@import ecgl.common.normalMap.fragmentHeader
@import ecgl.common.bumpMap.header

uniform sampler2D roughnessMap;

void main()
{
 vec3 N = v_Normal;
 
 bool flipNormal = false;
 if (doubleSide) {
 vec3 eyePos = viewInverse[3].xyz;
 vec3 V = normalize(eyePos - v_WorldPosition);

 if (dot(N, V) < 0.0) {
 flipNormal = true;
 }
 }

 @import ecgl.common.normalMap.fragmentMain

 if (useBumpMap) {
 N = bumpNormal(v_WorldPosition, v_Normal, N);
 }

 float g = 1.0 - roughness;

 if (useRoughnessMap) {
 float g2 = 1.0 - texture2D(roughnessMap, v_DetailTexcoord)[ROUGHNESS_CHANEL];
 g = clamp(g2 + (g - 0.5) * 2.0, 0.0, 1.0);
 }

 if (flipNormal) {
 N = -N;
 }

 gl_FragColor.rgb = (N.xyz + 1.0) * 0.5;
 gl_FragColor.a = g;
}
@end`);function $l(e,t,n,r,i){var a=e.gl;t.setUniform(a,`1i`,n,i),a.activeTexture(a.TEXTURE0+i),r.isRenderable()?r.bind(e):r.unbind(e)}function eu(e,t,n,r,i){var a,o,s,c,l=e.gl;return function(i,u,d){if(!(c&&c.material===i.material)){var f=i.material,p=i.__program,m=f.get(`roughness`);m??=1;var h=f.get(`normalMap`)||t,g=f.get(`roughnessMap`),_=f.get(`bumpMap`),v=f.get(`uvRepeat`),y=f.get(`uvOffset`),b=f.get(`detailUvRepeat`),x=f.get(`detailUvOffset`),S=!!_&&f.isTextureEnabled(`bumpMap`),C=!!g&&f.isTextureEnabled(`roughnessMap`),w=f.isDefined(`fragment`,`DOUBLE_SIDED`);_||=n,g||=r,d===u?(p.setUniform(l,`1f`,`roughness`,m),a!==h&&$l(e,p,`normalMap`,h,0),o!==_&&_&&$l(e,p,`bumpMap`,_,1),s!==g&&g&&$l(e,p,`roughnessMap`,g,2),v!=null&&p.setUniform(l,`2f`,`uvRepeat`,v),y!=null&&p.setUniform(l,`2f`,`uvOffset`,y),b!=null&&p.setUniform(l,`2f`,`detailUvRepeat`,b),x!=null&&p.setUniform(l,`2f`,`detailUvOffset`,x),p.setUniform(l,`1i`,`useBumpMap`,+S),p.setUniform(l,`1i`,`useRoughnessMap`,+C),p.setUniform(l,`1i`,`doubleSide`,+w)):(u.set(`normalMap`,h),u.set(`bumpMap`,_),u.set(`roughnessMap`,g),u.set(`useBumpMap`,S),u.set(`useRoughnessMap`,C),u.set(`doubleSide`,w),v!=null&&u.set(`uvRepeat`,v),y!=null&&u.set(`uvOffset`,y),b!=null&&u.set(`detailUvRepeat`,b),x!=null&&u.set(`detailUvOffset`,x),u.set(`roughness`,m)),a=h,o=_,s=g,c=i}}}function tu(e){e||={},this._depthTex=new J({format:q.DEPTH_COMPONENT,type:q.UNSIGNED_INT}),this._normalTex=new J({type:q.HALF_FLOAT}),this._framebuffer=new Oo,this._framebuffer.attach(this._normalTex),this._framebuffer.attach(this._depthTex,Oo.DEPTH_ATTACHMENT),this._normalMaterial=new ji({shader:new K(K.source(`ecgl.normal.vertex`),K.source(`ecgl.normal.fragment`))}),this._normalMaterial.enableTexture([`normalMap`,`bumpMap`,`roughnessMap`]),this._defaultNormalMap=ds.createBlank(`#000`),this._defaultBumpMap=ds.createBlank(`#000`),this._defaultRoughessMap=ds.createBlank(`#000`),this._debugPass=new ys({fragment:K.source(`clay.compositor.output`)}),this._debugPass.setUniform(`texture`,this._normalTex),this._debugPass.material.undefine(`fragment`,`OUTPUT_ALPHA`)}tu.prototype.getDepthTexture=function(){return this._depthTex},tu.prototype.getNormalTexture=function(){return this._normalTex},tu.prototype.update=function(e,t,n){var r=e.getWidth(),i=e.getHeight(),a=this._depthTex,o=this._normalTex,s=this._normalMaterial;a.width=r,a.height=i,o.width=r,o.height=i;var c=t.getRenderList(n).opaque;this._framebuffer.bind(e),e.gl.clearColor(0,0,0,0),e.gl.clear(e.gl.COLOR_BUFFER_BIT|e.gl.DEPTH_BUFFER_BIT),e.gl.disable(e.gl.BLEND),e.renderPass(c,n,{getMaterial:function(){return s},ifRender:function(e){return e.renderNormal},beforeRender:eu(e,this._defaultNormalMap,this._defaultBumpMap,this._defaultRoughessMap,this._normalMaterial),sort:e.opaqueSortCompare}),this._framebuffer.unbind(e)},tu.prototype.renderDebug=function(e){this._debugPass.render(e)},tu.prototype.dispose=function(e){this._depthTex.dispose(e),this._normalTex.dispose(e)};function nu(e){e||={},this._edgePass=new ys({fragment:K.source(`ecgl.edge`)}),this._edgePass.setUniform(`normalTexture`,e.normalTexture),this._edgePass.setUniform(`depthTexture`,e.depthTexture),this._targetTexture=new J({type:q.HALF_FLOAT}),this._frameBuffer=new Oo,this._frameBuffer.attach(this._targetTexture)}nu.prototype.update=function(e,t,n,r){var i=e.getWidth(),a=e.getHeight(),o=this._targetTexture;o.width=i,o.height=a;var s=this._frameBuffer;s.bind(e),this._edgePass.setUniform(`projectionInv`,t.invProjectionMatrix.array),this._edgePass.setUniform(`textureSize`,[i,a]),this._edgePass.setUniform(`texture`,n),this._edgePass.render(e),s.unbind(e)},nu.prototype.getTargetTexture=function(){return this._targetTexture},nu.prototype.setParameter=function(e,t){this._edgePass.setUniform(e,t)},nu.prototype.dispose=function(e){this._targetTexture.dispose(e),this._frameBuffer.dispose(e)};var ru={type:`compositor`,nodes:[{name:`source`,type:`texture`,outputs:{color:{}}},{name:`source_half`,shader:`#source(clay.compositor.downsample)`,inputs:{texture:`source`},outputs:{color:{parameters:{width:`expr(width * 1.0 / 2)`,height:`expr(height * 1.0 / 2)`,type:`HALF_FLOAT`}}},parameters:{textureSize:`expr( [width * 1.0, height * 1.0] )`}},{name:`bright`,shader:`#source(clay.compositor.bright)`,inputs:{texture:`source_half`},outputs:{color:{parameters:{width:`expr(width * 1.0 / 2)`,height:`expr(height * 1.0 / 2)`,type:`HALF_FLOAT`}}},parameters:{threshold:2,scale:4,textureSize:`expr([width * 1.0 / 2, height / 2])`}},{name:`bright_downsample_4`,shader:`#source(clay.compositor.downsample)`,inputs:{texture:`bright`},outputs:{color:{parameters:{width:`expr(width * 1.0 / 4)`,height:`expr(height * 1.0 / 4)`,type:`HALF_FLOAT`}}},parameters:{textureSize:`expr( [width * 1.0 / 2, height / 2] )`}},{name:`bright_downsample_8`,shader:`#source(clay.compositor.downsample)`,inputs:{texture:`bright_downsample_4`},outputs:{color:{parameters:{width:`expr(width * 1.0 / 8)`,height:`expr(height * 1.0 / 8)`,type:`HALF_FLOAT`}}},parameters:{textureSize:`expr( [width * 1.0 / 4, height / 4] )`}},{name:`bright_downsample_16`,shader:`#source(clay.compositor.downsample)`,inputs:{texture:`bright_downsample_8`},outputs:{color:{parameters:{width:`expr(width * 1.0 / 16)`,height:`expr(height * 1.0 / 16)`,type:`HALF_FLOAT`}}},parameters:{textureSize:`expr( [width * 1.0 / 8, height / 8] )`}},{name:`bright_downsample_32`,shader:`#source(clay.compositor.downsample)`,inputs:{texture:`bright_downsample_16`},outputs:{color:{parameters:{width:`expr(width * 1.0 / 32)`,height:`expr(height * 1.0 / 32)`,type:`HALF_FLOAT`}}},parameters:{textureSize:`expr( [width * 1.0 / 16, height / 16] )`}},{name:`bright_upsample_16_blur_h`,shader:`#source(clay.compositor.gaussian_blur)`,inputs:{texture:`bright_downsample_32`},outputs:{color:{parameters:{width:`expr(width * 1.0 / 16)`,height:`expr(height * 1.0 / 16)`,type:`HALF_FLOAT`}}},parameters:{blurSize:1,blurDir:0,textureSize:`expr( [width * 1.0 / 32, height / 32] )`}},{name:`bright_upsample_16_blur_v`,shader:`#source(clay.compositor.gaussian_blur)`,inputs:{texture:`bright_upsample_16_blur_h`},outputs:{color:{parameters:{width:`expr(width * 1.0 / 16)`,height:`expr(height * 1.0 / 16)`,type:`HALF_FLOAT`}}},parameters:{blurSize:1,blurDir:1,textureSize:`expr( [width * 1.0 / 16, height * 1.0 / 16] )`}},{name:`bright_upsample_8_blur_h`,shader:`#source(clay.compositor.gaussian_blur)`,inputs:{texture:`bright_downsample_16`},outputs:{color:{parameters:{width:`expr(width * 1.0 / 8)`,height:`expr(height * 1.0 / 8)`,type:`HALF_FLOAT`}}},parameters:{blurSize:1,blurDir:0,textureSize:`expr( [width * 1.0 / 16, height * 1.0 / 16] )`}},{name:`bright_upsample_8_blur_v`,shader:`#source(clay.compositor.gaussian_blur)`,inputs:{texture:`bright_upsample_8_blur_h`},outputs:{color:{parameters:{width:`expr(width * 1.0 / 8)`,height:`expr(height * 1.0 / 8)`,type:`HALF_FLOAT`}}},parameters:{blurSize:1,blurDir:1,textureSize:`expr( [width * 1.0 / 8, height * 1.0 / 8] )`}},{name:`bright_upsample_8_blend`,shader:`#source(clay.compositor.blend)`,inputs:{texture1:`bright_upsample_8_blur_v`,texture2:`bright_upsample_16_blur_v`},outputs:{color:{parameters:{width:`expr(width * 1.0 / 8)`,height:`expr(height * 1.0 / 8)`,type:`HALF_FLOAT`}}},parameters:{weight1:.3,weight2:.7}},{name:`bright_upsample_4_blur_h`,shader:`#source(clay.compositor.gaussian_blur)`,inputs:{texture:`bright_downsample_8`},outputs:{color:{parameters:{width:`expr(width * 1.0 / 4)`,height:`expr(height * 1.0 / 4)`,type:`HALF_FLOAT`}}},parameters:{blurSize:1,blurDir:0,textureSize:`expr( [width * 1.0 / 8, height * 1.0 / 8] )`}},{name:`bright_upsample_4_blur_v`,shader:`#source(clay.compositor.gaussian_blur)`,inputs:{texture:`bright_upsample_4_blur_h`},outputs:{color:{parameters:{width:`expr(width * 1.0 / 4)`,height:`expr(height * 1.0 / 4)`,type:`HALF_FLOAT`}}},parameters:{blurSize:1,blurDir:1,textureSize:`expr( [width * 1.0 / 4, height * 1.0 / 4] )`}},{name:`bright_upsample_4_blend`,shader:`#source(clay.compositor.blend)`,inputs:{texture1:`bright_upsample_4_blur_v`,texture2:`bright_upsample_8_blend`},outputs:{color:{parameters:{width:`expr(width * 1.0 / 4)`,height:`expr(height * 1.0 / 4)`,type:`HALF_FLOAT`}}},parameters:{weight1:.3,weight2:.7}},{name:`bright_upsample_2_blur_h`,shader:`#source(clay.compositor.gaussian_blur)`,inputs:{texture:`bright_downsample_4`},outputs:{color:{parameters:{width:`expr(width * 1.0 / 2)`,height:`expr(height * 1.0 / 2)`,type:`HALF_FLOAT`}}},parameters:{blurSize:1,blurDir:0,textureSize:`expr( [width * 1.0 / 4, height * 1.0 / 4] )`}},{name:`bright_upsample_2_blur_v`,shader:`#source(clay.compositor.gaussian_blur)`,inputs:{texture:`bright_upsample_2_blur_h`},outputs:{color:{parameters:{width:`expr(width * 1.0 / 2)`,height:`expr(height * 1.0 / 2)`,type:`HALF_FLOAT`}}},parameters:{blurSize:1,blurDir:1,textureSize:`expr( [width * 1.0 / 2, height * 1.0 / 2] )`}},{name:`bright_upsample_2_blend`,shader:`#source(clay.compositor.blend)`,inputs:{texture1:`bright_upsample_2_blur_v`,texture2:`bright_upsample_4_blend`},outputs:{color:{parameters:{width:`expr(width * 1.0 / 2)`,height:`expr(height * 1.0 / 2)`,type:`HALF_FLOAT`}}},parameters:{weight1:.3,weight2:.7}},{name:`bright_upsample_full_blur_h`,shader:`#source(clay.compositor.gaussian_blur)`,inputs:{texture:`bright`},outputs:{color:{parameters:{width:`expr(width * 1.0)`,height:`expr(height * 1.0)`,type:`HALF_FLOAT`}}},parameters:{blurSize:1,blurDir:0,textureSize:`expr( [width * 1.0 / 2, height * 1.0 / 2] )`}},{name:`bright_upsample_full_blur_v`,shader:`#source(clay.compositor.gaussian_blur)`,inputs:{texture:`bright_upsample_full_blur_h`},outputs:{color:{parameters:{width:`expr(width * 1.0)`,height:`expr(height * 1.0)`,type:`HALF_FLOAT`}}},parameters:{blurSize:1,blurDir:1,textureSize:`expr( [width * 1.0, height * 1.0] )`}},{name:`bloom_composite`,shader:`#source(clay.compositor.blend)`,inputs:{texture1:`bright_upsample_full_blur_v`,texture2:`bright_upsample_2_blend`},outputs:{color:{parameters:{width:`expr(width * 1.0)`,height:`expr(height * 1.0)`,type:`HALF_FLOAT`}}},parameters:{weight1:.3,weight2:.7}},{name:`coc`,shader:`#source(ecgl.dof.coc)`,outputs:{color:{parameters:{minFilter:`NEAREST`,magFilter:`NEAREST`,width:`expr(width * 1.0)`,height:`expr(height * 1.0)`}}},parameters:{focalDist:50,focalRange:30}},{name:`dof_far_blur`,shader:`#source(ecgl.dof.diskBlur)`,inputs:{texture:`source`,coc:`coc`},outputs:{color:{parameters:{width:`expr(width * 1.0)`,height:`expr(height * 1.0)`,type:`HALF_FLOAT`}}},parameters:{textureSize:`expr( [width * 1.0, height * 1.0] )`}},{name:`dof_near_blur`,shader:`#source(ecgl.dof.diskBlur)`,inputs:{texture:`source`,coc:`coc`},outputs:{color:{parameters:{width:`expr(width * 1.0)`,height:`expr(height * 1.0)`,type:`HALF_FLOAT`}}},parameters:{textureSize:`expr( [width * 1.0, height * 1.0] )`},defines:{BLUR_NEARFIELD:null}},{name:`dof_coc_blur`,shader:`#source(ecgl.dof.diskBlur)`,inputs:{texture:`coc`},outputs:{color:{parameters:{minFilter:`NEAREST`,magFilter:`NEAREST`,width:`expr(width * 1.0)`,height:`expr(height * 1.0)`}}},parameters:{textureSize:`expr( [width * 1.0, height * 1.0] )`},defines:{BLUR_COC:null}},{name:`dof_composite`,shader:`#source(ecgl.dof.composite)`,inputs:{original:`source`,blurred:`dof_far_blur`,nearfield:`dof_near_blur`,coc:`coc`,nearcoc:`dof_coc_blur`},outputs:{color:{parameters:{width:`expr(width * 1.0)`,height:`expr(height * 1.0)`,type:`HALF_FLOAT`}}}},{name:`composite`,shader:`#source(clay.compositor.hdr.composite)`,inputs:{texture:`source`,bloom:`bloom_composite`},outputs:{color:{parameters:{width:`expr(width * 1.0)`,height:`expr(height * 1.0)`}}},defines:{}},{name:`FXAA`,shader:`#source(clay.compositor.fxaa)`,inputs:{texture:`composite`}}]};K.import(Sl),K.import(wl),K.import(El),K.import(Dl),K.import(Ol),K.import(kl),K.import(Al),K.import(Ml),K.import(Nl),K.import(`@export ecgl.dof.coc

uniform sampler2D depth;

uniform float zNear: 0.1;
uniform float zFar: 2000;

uniform float focalDistance: 3;
uniform float focalRange: 1;
uniform float focalLength: 30;
uniform float fstop: 2.8;

varying vec2 v_Texcoord;

@import clay.util.encode_float

void main()
{
 float z = texture2D(depth, v_Texcoord).r * 2.0 - 1.0;

 float dist = 2.0 * zNear * zFar / (zFar + zNear - z * (zFar - zNear));

 float aperture = focalLength / fstop;

 float coc;

 float uppper = focalDistance + focalRange;
 float lower = focalDistance - focalRange;
 if (dist <= uppper && dist >= lower) {
 coc = 0.5;
 }
 else {
 float focalAdjusted = dist > uppper ? uppper : lower;

 coc = abs(aperture * (focalLength * (dist - focalAdjusted)) / (dist * (focalAdjusted - focalLength)));
 coc = clamp(coc, 0.0, 2.0) / 2.00001;

 if (dist < lower) {
 coc = -coc;
 }
 coc = coc * 0.5 + 0.5;
 }

 gl_FragColor = encodeFloat(coc);
}
@end


@export ecgl.dof.composite

#define DEBUG 0

uniform sampler2D original;
uniform sampler2D blurred;
uniform sampler2D nearfield;
uniform sampler2D coc;
uniform sampler2D nearcoc;
varying vec2 v_Texcoord;

@import clay.util.rgbm
@import clay.util.float

void main()
{
 vec4 blurredColor = texture2D(blurred, v_Texcoord);
 vec4 originalColor = texture2D(original, v_Texcoord);

 float fCoc = decodeFloat(texture2D(coc, v_Texcoord));

 fCoc = abs(fCoc * 2.0 - 1.0);

 float weight = smoothstep(0.0, 1.0, fCoc);
 
#ifdef NEARFIELD_ENABLED
 vec4 nearfieldColor = texture2D(nearfield, v_Texcoord);
 float fNearCoc = decodeFloat(texture2D(nearcoc, v_Texcoord));
 fNearCoc = abs(fNearCoc * 2.0 - 1.0);

 gl_FragColor = encodeHDR(
 mix(
 nearfieldColor, mix(originalColor, blurredColor, weight),
 pow(1.0 - fNearCoc, 4.0)
 )
 );
#else
 gl_FragColor = encodeHDR(mix(originalColor, blurredColor, weight));
#endif

}

@end



@export ecgl.dof.diskBlur

#define POISSON_KERNEL_SIZE 16;

uniform sampler2D texture;
uniform sampler2D coc;
varying vec2 v_Texcoord;

uniform float blurRadius : 10.0;
uniform vec2 textureSize : [512.0, 512.0];

uniform vec2 poissonKernel[POISSON_KERNEL_SIZE];

uniform float percent;

float nrand(const in vec2 n) {
 return fract(sin(dot(n.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

@import clay.util.rgbm
@import clay.util.float


void main()
{
 vec2 offset = blurRadius / textureSize;

 float rnd = 6.28318 * nrand(v_Texcoord + 0.07 * percent );
 float cosa = cos(rnd);
 float sina = sin(rnd);
 vec4 basis = vec4(cosa, -sina, sina, cosa);

#if !defined(BLUR_NEARFIELD) && !defined(BLUR_COC)
 offset *= abs(decodeFloat(texture2D(coc, v_Texcoord)) * 2.0 - 1.0);
#endif

#ifdef BLUR_COC
 float cocSum = 0.0;
#else
 vec4 color = vec4(0.0);
#endif


 float weightSum = 0.0;

 for (int i = 0; i < POISSON_KERNEL_SIZE; i++) {
 vec2 ofs = poissonKernel[i];

 ofs = vec2(dot(ofs, basis.xy), dot(ofs, basis.zw));

 vec2 uv = v_Texcoord + ofs * offset;
 vec4 texel = texture2D(texture, uv);

 float w = 1.0;
#ifdef BLUR_COC
 float fCoc = decodeFloat(texel) * 2.0 - 1.0;
 cocSum += clamp(fCoc, -1.0, 0.0) * w;
#else
 texel = texel;
 #if !defined(BLUR_NEARFIELD)
 float fCoc = decodeFloat(texture2D(coc, uv)) * 2.0 - 1.0;
 w *= abs(fCoc);
 #endif
 texel.rgb *= texel.a;
 color += texel * w;
#endif

 weightSum += w;
 }

#ifdef BLUR_COC
 gl_FragColor = encodeFloat(clamp(cocSum / weightSum, -1.0, 0.0) * 0.5 + 0.5);
#else
 color /= weightSum;
 color.rgb /= (color.a + 0.0001);
 gl_FragColor = color;
#endif
}

@end`),K.import(`@export ecgl.edge

uniform sampler2D texture;

uniform sampler2D normalTexture;
uniform sampler2D depthTexture;

uniform mat4 projectionInv;

uniform vec2 textureSize;

uniform vec4 edgeColor: [0,0,0,0.8];

varying vec2 v_Texcoord;

vec3 packColor(vec2 coord) {
 float z = texture2D(depthTexture, coord).r * 2.0 - 1.0;
 vec4 p = vec4(v_Texcoord * 2.0 - 1.0, z, 1.0);
 vec4 p4 = projectionInv * p;

 return vec3(
 texture2D(normalTexture, coord).rg,
 -p4.z / p4.w / 5.0
 );
}

void main() {
 vec2 cc = v_Texcoord;
 vec3 center = packColor(cc);

 float size = clamp(1.0 - (center.z - 10.0) / 100.0, 0.0, 1.0) * 0.5;
 float dx = size / textureSize.x;
 float dy = size / textureSize.y;

 vec2 coord;
 vec3 topLeft = packColor(cc+vec2(-dx, -dy));
 vec3 top = packColor(cc+vec2(0.0, -dy));
 vec3 topRight = packColor(cc+vec2(dx, -dy));
 vec3 left = packColor(cc+vec2(-dx, 0.0));
 vec3 right = packColor(cc+vec2(dx, 0.0));
 vec3 bottomLeft = packColor(cc+vec2(-dx, dy));
 vec3 bottom = packColor(cc+vec2(0.0, dy));
 vec3 bottomRight = packColor(cc+vec2(dx, dy));

 vec3 v = -topLeft-2.0*top-topRight+bottomLeft+2.0*bottom+bottomRight;
 vec3 h = -bottomLeft-2.0*left-topLeft+bottomRight+2.0*right+topRight;

 float edge = sqrt(dot(h, h) + dot(v, v));

 edge = smoothstep(0.8, 1.0, edge);

 gl_FragColor = mix(texture2D(texture, v_Texcoord), vec4(edgeColor.rgb, 1.0), edgeColor.a * edge);
}
@end`);function iu(e,t){return{color:{parameters:{width:e,height:t}}}}var au=[`composite`,`FXAA`];function $(){this._width,this._height,this._dpr,this._sourceTexture=new J({type:q.HALF_FLOAT}),this._depthTexture=new J({format:q.DEPTH_COMPONENT,type:q.UNSIGNED_INT}),this._framebuffer=new Oo,this._framebuffer.attach(this._sourceTexture),this._framebuffer.attach(this._depthTexture,Oo.DEPTH_ATTACHMENT),this._normalPass=new tu,this._compositor=Gl(ru);var e=this._compositor.getNodeByName(`source`);e.texture=this._sourceTexture;var t=this._compositor.getNodeByName(`coc`);this._sourceNode=e,this._cocNode=t,this._compositeNode=this._compositor.getNodeByName(`composite`),this._fxaaNode=this._compositor.getNodeByName(`FXAA`),this._dofBlurNodes=[`dof_far_blur`,`dof_near_blur`,`dof_coc_blur`].map(function(e){return this._compositor.getNodeByName(e)},this),this._dofBlurKernel=0,this._dofBlurKernelSize=new Float32Array,this._finalNodesChain=au.map(function(e){return this._compositor.getNodeByName(e)},this);var n={normalTexture:this._normalPass.getNormalTexture(),depthTexture:this._normalPass.getDepthTexture()};this._ssaoPass=new Xl(n),this._ssrPass=new Zl(n),this._edgePass=new nu(n)}$.prototype.resize=function(e,t,n){n||=1;var e=e*n,t=t*n,r=this._sourceTexture,i=this._depthTexture;r.width=e,r.height=t,i.width=e,i.height=t;var a={getWidth:function(){return e},getHeight:function(){return t},getDevicePixelRatio:function(){return n}};function o(e,t){if(typeof e[t]==`function`){var n=e[t].__original||e[t];e[t]=function(e){return n.call(this,a)},e[t].__original=n}}this._compositor.nodes.forEach(function(e){for(var t in e.outputs){var n=e.outputs[t].parameters;n&&(o(n,`width`),o(n,`height`))}for(var r in e.parameters)o(e.parameters,r)}),this._width=e,this._height=t,this._dpr=n},$.prototype.getWidth=function(){return this._width},$.prototype.getHeight=function(){return this._height},$.prototype._ifRenderNormalPass=function(){return this._enableSSAO||this._enableEdge||this._enableSSR},$.prototype._getPrevNode=function(e){for(var t=au.indexOf(e.name)-1,n=this._finalNodesChain[t];n&&!this._compositor.getNodeByName(n.name);)--t,n=this._finalNodesChain[t];return n},$.prototype._getNextNode=function(e){for(var t=au.indexOf(e.name)+1,n=this._finalNodesChain[t];n&&!this._compositor.getNodeByName(n.name);)t+=1,n=this._finalNodesChain[t];return n},$.prototype._addChainNode=function(e){var t=this._getPrevNode(e),n=this._getNextNode(e);t&&(e.inputs.texture=t.name,n?(e.outputs=iu(this.getWidth.bind(this),this.getHeight.bind(this)),n.inputs.texture=e.name):e.outputs=null,this._compositor.addNode(e))},$.prototype._removeChainNode=function(e){var t=this._getPrevNode(e),n=this._getNextNode(e);t&&(n?(t.outputs=iu(this.getWidth.bind(this),this.getHeight.bind(this)),n.inputs.texture=t.name):t.outputs=null,this._compositor.removeNode(e))},$.prototype.updateNormal=function(e,t,n,r){this._ifRenderNormalPass()&&this._normalPass.update(e,t,n)},$.prototype.updateSSAO=function(e,t,n,r){this._ssaoPass.update(e,n,r)},$.prototype.enableSSAO=function(){this._enableSSAO=!0},$.prototype.disableSSAO=function(){this._enableSSAO=!1},$.prototype.enableSSR=function(){this._enableSSR=!0},$.prototype.disableSSR=function(){this._enableSSR=!1},$.prototype.getSSAOTexture=function(){return this._ssaoPass.getTargetTexture()},$.prototype.getSourceFrameBuffer=function(){return this._framebuffer},$.prototype.getSourceTexture=function(){return this._sourceTexture},$.prototype.disableFXAA=function(){this._removeChainNode(this._fxaaNode)},$.prototype.enableFXAA=function(){this._addChainNode(this._fxaaNode)},$.prototype.enableBloom=function(){this._compositeNode.inputs.bloom=`bloom_composite`,this._compositor.dirty()},$.prototype.disableBloom=function(){this._compositeNode.inputs.bloom=null,this._compositor.dirty()},$.prototype.enableDOF=function(){this._compositeNode.inputs.texture=`dof_composite`,this._compositor.dirty()},$.prototype.disableDOF=function(){this._compositeNode.inputs.texture=`source`,this._compositor.dirty()},$.prototype.enableColorCorrection=function(){this._compositeNode.define(`COLOR_CORRECTION`),this._enableColorCorrection=!0},$.prototype.disableColorCorrection=function(){this._compositeNode.undefine(`COLOR_CORRECTION`),this._enableColorCorrection=!1},$.prototype.enableEdge=function(){this._enableEdge=!0},$.prototype.disableEdge=function(){this._enableEdge=!1},$.prototype.setBloomIntensity=function(e){this._compositeNode.setParameter(`bloomIntensity`,e)},$.prototype.setSSAOParameter=function(e,t){switch(e){case`quality`:var n={low:6,medium:12,high:32,ultra:62}[t]||12;this._ssaoPass.setParameter(`kernelSize`,n);break;case`radius`:this._ssaoPass.setParameter(e,t),this._ssaoPass.setParameter(`bias`,t/200);break;case`intensity`:this._ssaoPass.setParameter(e,t);break;default:}},$.prototype.setDOFParameter=function(e,t){switch(e){case`focalDistance`:case`focalRange`:case`fstop`:this._cocNode.setParameter(e,t);break;case`blurRadius`:for(var n=0;n<this._dofBlurNodes.length;n++)this._dofBlurNodes[n].setParameter(`blurRadius`,t);break;case`quality`:var r={low:4,medium:8,high:16,ultra:32}[t]||8;this._dofBlurKernelSize=r;for(var n=0;n<this._dofBlurNodes.length;n++)this._dofBlurNodes[n].pass.material.define(`POISSON_KERNEL_SIZE`,r);this._dofBlurKernel=new Float32Array(r*2);break;default:}},$.prototype.setSSRParameter=function(e,t){if(t!=null)switch(e){case`quality`:var n={low:10,medium:15,high:30,ultra:80}[t]||20,r={low:32,medium:16,high:8,ultra:4}[t]||16;this._ssrPass.setParameter(`maxIteration`,n),this._ssrPass.setParameter(`pixelStride`,r);break;case`maxRoughness`:this._ssrPass.setParameter(`minGlossiness`,Math.max(Math.min(1-t,1),0));break;case`physical`:this.setPhysicallyCorrectSSR(t);break;default:console.warn(`Unkown SSR parameter `+e)}},$.prototype.setPhysicallyCorrectSSR=function(e){this._ssrPass.setPhysicallyCorrect(e)},$.prototype.setEdgeColor=function(e){var t=Q.parseColor(e);this._edgePass.setParameter(`edgeColor`,t)},$.prototype.setExposure=function(e){this._compositeNode.setParameter(`exposure`,2**e)},$.prototype.setColorLookupTexture=function(e,t){this._compositeNode.pass.material.setTextureImage(`lut`,this._enableColorCorrection?e:`none`,t,{minFilter:Q.Texture.NEAREST,magFilter:Q.Texture.NEAREST,flipY:!1})},$.prototype.setColorCorrection=function(e,t){this._compositeNode.setParameter(e,t)},$.prototype.isSSREnabled=function(){return this._enableSSR},$.prototype.composite=function(e,t,n,r,i){var a=this._sourceTexture,o=a;this._enableEdge&&(this._edgePass.update(e,n,a,i),a=o=this._edgePass.getTargetTexture()),this._enableSSR&&(this._ssrPass.update(e,n,a,i),o=this._ssrPass.getTargetTexture(),this._ssrPass.setSSAOTexture(this._enableSSAO?this._ssaoPass.getTargetTexture():null)),this._sourceNode.texture=o,this._cocNode.setParameter(`depth`,this._depthTexture);for(var s=this._dofBlurKernel,c=this._dofBlurKernelSize,l=i%Math.floor(Ql.length/2/c),u=0;u<c*2;u++)s[u]=Ql[u+l*c*2];for(var u=0;u<this._dofBlurNodes.length;u++)this._dofBlurNodes[u].setParameter(`percent`,i/30),this._dofBlurNodes[u].setParameter(`poissonKernel`,s);this._cocNode.setParameter(`zNear`,n.near),this._cocNode.setParameter(`zFar`,n.far),this._compositor.render(e,r)},$.prototype.dispose=function(e){this._sourceTexture.dispose(e),this._depthTexture.dispose(e),this._framebuffer.dispose(e),this._compositor.dispose(e),this._normalPass.dispose(e),this._ssaoPass.dispose(e)};function ou(e){for(var t=[],n=0;n<30;n++)t.push([Kl(n,2),Kl(n,3)]);this._haltonSequence=t,this._frame=0,this._sourceTex=new J,this._sourceFb=new Oo,this._sourceFb.attach(this._sourceTex),this._prevFrameTex=new J,this._outputTex=new J;var r=this._blendPass=new ys({fragment:K.source(`clay.compositor.blend`)});r.material.disableTexturesAll(),r.material.enableTexture([`texture1`,`texture2`]),this._blendFb=new Oo({depthBuffer:!1}),this._outputPass=new ys({fragment:K.source(`clay.compositor.output`),blendWithPrevious:!0}),this._outputPass.material.define(`fragment`,`OUTPUT_ALPHA`),this._outputPass.material.blend=function(e){e.blendEquationSeparate(e.FUNC_ADD,e.FUNC_ADD),e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA)}}ou.prototype={constructor:ou,jitterProjection:function(e,t){var n=e.viewport,r=n.devicePixelRatio||e.getDevicePixelRatio(),i=n.width*r,a=n.height*r,o=this._haltonSequence[this._frame%this._haltonSequence.length],s=new V;s.array[12]=(o[0]*2-1)/i,s.array[13]=(o[1]*2-1)/a,V.mul(t.projectionMatrix,s,t.projectionMatrix),V.invert(t.invProjectionMatrix,t.projectionMatrix)},resetFrame:function(){this._frame=0},getFrame:function(){return this._frame},getSourceFrameBuffer:function(){return this._sourceFb},getOutputTexture:function(){return this._outputTex},resize:function(e,t){this._prevFrameTex.width=e,this._prevFrameTex.height=t,this._outputTex.width=e,this._outputTex.height=t,this._sourceTex.width=e,this._sourceTex.height=t,this._prevFrameTex.dirty(),this._outputTex.dirty(),this._sourceTex.dirty()},isFinished:function(){return this._frame>=this._haltonSequence.length},render:function(e,t,n){var r=this._blendPass;this._frame===0?(r.setUniform(`weight1`,0),r.setUniform(`weight2`,1)):(r.setUniform(`weight1`,.9),r.setUniform(`weight2`,.1)),r.setUniform(`texture1`,this._prevFrameTex),r.setUniform(`texture2`,t||this._sourceTex),this._blendFb.attach(this._outputTex),this._blendFb.bind(e),r.render(e),this._blendFb.unbind(e),n||(this._outputPass.setUniform(`texture`,this._outputTex),this._outputPass.render(e));var i=this._prevFrameTex;this._prevFrameTex=this._outputTex,this._outputTex=i,this._frame++},dispose:function(e){this._sourceFb.dispose(e),this._blendFb.dispose(e),this._prevFrameTex.dispose(e),this._outputTex.dispose(e),this._sourceTex.dispose(e),this._outputPass.dispose(e),this._blendPass.dispose(e)}};function su(e){e||=`perspective`,this.layer=null,this.scene=new uo,this.rootNode=this.scene,this.viewport={x:0,y:0,width:0,height:0},this.setProjection(e),this._compositor=new $,this._temporalSS=new ou,this._shadowMapPass=new ml;for(var t=[],n=0,r=0;r<30;r++){for(var i=[],a=0;a<6;a++)i.push(Kl(n,2)*4-2),i.push(Kl(n,3)*4-2),n++;t.push(i)}this._pcfKernels=t,this.scene.on(`beforerender`,function(e,t,n){this.needsTemporalSS()&&this._temporalSS.jitterProjection(e,n)},this)}su.prototype.setProjection=function(e){var t=this.camera;t&&t.update(),e===`perspective`?this.camera instanceof _o||(this.camera=new _o,t&&this.camera.setLocalTransform(t.localTransform)):this.camera instanceof gs||(this.camera=new gs,t&&this.camera.setLocalTransform(t.localTransform)),this.camera.near=.1,this.camera.far=2e3},su.prototype.setViewport=function(e,t,n,r,i){this.camera instanceof _o&&(this.camera.aspect=n/r),i||=1,this.viewport.x=e,this.viewport.y=t,this.viewport.width=n,this.viewport.height=r,this.viewport.devicePixelRatio=i,this._compositor.resize(n*i,r*i),this._temporalSS.resize(n*i,r*i)},su.prototype.containPoint=function(e,t){var n=this.viewport;return t=this.layer.renderer.getHeight()-t,e>=n.x&&t>=n.y&&e<=n.x+n.width&&t<=n.y+n.height};var cu=new G;su.prototype.castRay=function(e,t,n){var r=this.layer.renderer,i=r.viewport;return r.viewport=this.viewport,r.screenToNDC(e,t,cu),this.camera.castRay(cu,n),r.viewport=i,n},su.prototype.prepareRender=function(){this.scene.update(),this.camera.update(),this.scene.updateLights();var e=this.scene.updateRenderList(this.camera);this._needsSortProgressively=!1;for(var t=0;t<e.transparent.length;t++){var n=e.transparent[t].geometry;n.needsSortVerticesProgressively&&n.needsSortVerticesProgressively()&&(this._needsSortProgressively=!0),n.needsSortTrianglesProgressively&&n.needsSortTrianglesProgressively()&&(this._needsSortProgressively=!0)}this._frame=0,this._temporalSS.resetFrame()},su.prototype.render=function(e,t){this._doRender(e,t,this._frame),this._frame++},su.prototype.needsAccumulate=function(){return this.needsTemporalSS()||this._needsSortProgressively},su.prototype.needsTemporalSS=function(){var e=this._enableTemporalSS;return e===`auto`&&(e=this._enablePostEffect),e},su.prototype.hasDOF=function(){return this._enableDOF},su.prototype.isAccumulateFinished=function(){return this.needsTemporalSS()?this._temporalSS.isFinished():this._frame>30},su.prototype._doRender=function(e,t,n){var r=this.scene,i=this.camera;n||=0,this._updateTransparent(e,r,i,n),t||(this._shadowMapPass.kernelPCF=this._pcfKernels[0],this._shadowMapPass.render(e,r,i,!0)),this._updateShadowPCFKernel(n);var a=e.clearColor;if(e.gl.clearColor(a[0],a[1],a[2],a[3]),this._enablePostEffect&&(this.needsTemporalSS()&&this._temporalSS.jitterProjection(e,i),this._compositor.updateNormal(e,r,i,this._temporalSS.getFrame())),this._updateSSAO(e,r,i,this._temporalSS.getFrame()),this._enablePostEffect){var o=this._compositor.getSourceFrameBuffer();o.bind(e),e.gl.clear(e.gl.DEPTH_BUFFER_BIT|e.gl.COLOR_BUFFER_BIT),e.render(r,i,!0,!0),o.unbind(e),this.needsTemporalSS()&&t?(this._compositor.composite(e,r,i,this._temporalSS.getSourceFrameBuffer(),this._temporalSS.getFrame()),e.setViewport(this.viewport),this._temporalSS.render(e)):(e.setViewport(this.viewport),this._compositor.composite(e,r,i,null,0))}else if(this.needsTemporalSS()&&t){var o=this._temporalSS.getSourceFrameBuffer();o.bind(e),e.saveClear(),e.clearBit=e.gl.DEPTH_BUFFER_BIT|e.gl.COLOR_BUFFER_BIT,e.render(r,i,!0,!0),e.restoreClear(),o.unbind(e),e.setViewport(this.viewport),this._temporalSS.render(e)}else e.setViewport(this.viewport),e.render(r,i,!0,!0)},su.prototype._updateTransparent=function(e,t,n,r){for(var i=new F,a=new V,o=n.getWorldPosition(),s=t.getRenderList(n).transparent,c=0;c<s.length;c++){var l=s[c],u=l.geometry;V.invert(a,l.worldTransform),F.transformMat4(i,o,a),u.needsSortTriangles&&u.needsSortTriangles()&&u.doSortTriangles(i,r),u.needsSortVertices&&u.needsSortVertices()&&u.doSortVertices(i,r)}},su.prototype._updateSSAO=function(e,t,n){var r=this._enableSSAO&&this._enablePostEffect;r&&this._compositor.updateSSAO(e,t,n,this._temporalSS.getFrame());for(var i=t.getRenderList(n),a=0;a<i.opaque.length;a++){var o=i.opaque[a];o.renderNormal&&o.material[r?`enableTexture`:`disableTexture`](`ssaoMap`),r&&o.material.set(`ssaoMap`,this._compositor.getSSAOTexture())}},su.prototype._updateShadowPCFKernel=function(e){for(var t=this._pcfKernels[e%this._pcfKernels.length],n=this.scene.getRenderList(this.camera).opaque,r=0;r<n.length;r++)n[r].receiveShadow&&(n[r].material.set(`pcfKernel`,t),n[r].material.define(`fragment`,`PCF_KERNEL_SIZE`,t.length/2))},su.prototype.dispose=function(e){this._compositor.dispose(e.gl),this._temporalSS.dispose(e.gl),this._shadowMapPass.dispose(e)},su.prototype.setPostEffect=function(e,t){var n=this._compositor;this._enablePostEffect=e.get(`enable`);var r=e.getModel(`bloom`),i=e.getModel(`edge`),a=e.getModel(`DOF`,e.getModel(`depthOfField`)),o=e.getModel(`SSAO`,e.getModel(`screenSpaceAmbientOcclusion`)),s=e.getModel(`SSR`,e.getModel(`screenSpaceReflection`)),c=e.getModel(`FXAA`),l=e.getModel(`colorCorrection`);r.get(`enable`)?n.enableBloom():n.disableBloom(),a.get(`enable`)?n.enableDOF():n.disableDOF(),s.get(`enable`)?n.enableSSR():n.disableSSR(),l.get(`enable`)?n.enableColorCorrection():n.disableColorCorrection(),i.get(`enable`)?n.enableEdge():n.disableEdge(),c.get(`enable`)?n.enableFXAA():n.disableFXAA(),this._enableDOF=a.get(`enable`),this._enableSSAO=o.get(`enable`),this._enableSSAO?n.enableSSAO():n.disableSSAO(),n.setBloomIntensity(r.get(`intensity`)),n.setEdgeColor(i.get(`color`)),n.setColorLookupTexture(l.get(`lookupTexture`),t),n.setExposure(l.get(`exposure`)),[`radius`,`quality`,`intensity`].forEach(function(e){n.setSSAOParameter(e,o.get(e))}),[`quality`,`maxRoughness`,`physical`].forEach(function(e){n.setSSRParameter(e,s.get(e))}),[`quality`,`focalDistance`,`focalRange`,`blurRadius`,`fstop`].forEach(function(e){n.setDOFParameter(e,a.get(e))}),[`brightness`,`contrast`,`saturation`].forEach(function(e){n.setColorCorrection(e,l.get(e))})},su.prototype.setDOFFocusOnPoint=function(e){if(this._enablePostEffect)return e>this.camera.far||e<this.camera.near?void 0:(this._compositor.setDOFParameter(`focalDistance`,e),!0)},su.prototype.setTemporalSuperSampling=function(e){this._enableTemporalSS=e.get(`enable`)},su.prototype.isLinearSpace=function(){return this._enablePostEffect},su.prototype.setRootNode=function(e){if(this.rootNode!==e){for(var t=this.rootNode.children(),n=0;n<t.length;n++)e.add(t[n]);e!==this.scene&&this.scene.add(e),this.rootNode=e}},su.prototype.add=function(e){this.rootNode.add(e)},su.prototype.remove=function(e){this.rootNode.remove(e)},su.prototype.removeAll=function(e){this.rootNode.removeAll(e)},Object.assign(su.prototype,Mr);var lu=js.firstNotNull,uu={left:0,middle:1,right:2};function du(e){return e instanceof Array||(e=[e,e]),e}var fu=Ir.extend(function(){return{zr:null,viewGL:null,_center:new F,minDistance:.5,maxDistance:1.5,maxOrthographicSize:300,minOrthographicSize:30,minAlpha:-90,maxAlpha:90,minBeta:-1/0,maxBeta:1/0,autoRotateAfterStill:0,autoRotateDirection:`cw`,autoRotateSpeed:60,damping:.8,rotateSensitivity:1,zoomSensitivity:1,panSensitivity:1,panMouseButton:`middle`,rotateMouseButton:`left`,_mode:`rotate`,_camera:null,_needsUpdate:!1,_rotating:!1,_phi:0,_theta:0,_mouseX:0,_mouseY:0,_rotateVelocity:new G,_panVelocity:new G,_distance:500,_zoomSpeed:0,_stillTimeout:0,_animators:[]}},function(){[`_mouseDownHandler`,`_mouseWheelHandler`,`_mouseMoveHandler`,`_mouseUpHandler`,`_pinchHandler`,`_contextMenuHandler`,`_update`].forEach(function(e){this[e]=this[e].bind(this)},this)},{init:function(){var e=this.zr;e&&(e.on(`mousedown`,this._mouseDownHandler),e.on(`globalout`,this._mouseUpHandler),e.on(`mousewheel`,this._mouseWheelHandler),e.on(`pinch`,this._pinchHandler),e.animation.on(`frame`,this._update),e.dom.addEventListener(`contextmenu`,this._contextMenuHandler))},dispose:function(){var e=this.zr;e&&(e.off(`mousedown`,this._mouseDownHandler),e.off(`mousemove`,this._mouseMoveHandler),e.off(`mouseup`,this._mouseUpHandler),e.off(`mousewheel`,this._mouseWheelHandler),e.off(`pinch`,this._pinchHandler),e.off(`globalout`,this._mouseUpHandler),e.dom.removeEventListener(`contextmenu`,this._contextMenuHandler),e.animation.off(`frame`,this._update)),this.stopAllAnimation()},getDistance:function(){return this._distance},setDistance:function(e){this._distance=e,this._needsUpdate=!0},getOrthographicSize:function(){return this._orthoSize},setOrthographicSize:function(e){this._orthoSize=e,this._needsUpdate=!0},getAlpha:function(){return this._theta/Math.PI*180},getBeta:function(){return-this._phi/Math.PI*180},getCenter:function(){return this._center.toArray()},setAlpha:function(e){e=Math.max(Math.min(this.maxAlpha,e),this.minAlpha),this._theta=e/180*Math.PI,this._needsUpdate=!0},setBeta:function(e){e=Math.max(Math.min(this.maxBeta,e),this.minBeta),this._phi=-e/180*Math.PI,this._needsUpdate=!0},setCenter:function(e){this._center.setArray(e)},setViewGL:function(e){this.viewGL=e},getCamera:function(){return this.viewGL.camera},setFromViewControlModel:function(e,t){t||={};var n=t.baseDistance||0,r=t.baseOrthoSize||1,i=e.get(`projection`);i!==`perspective`&&i!==`orthographic`&&i!==`isometric`&&(i=`perspective`),this._projection=i,this.viewGL.setProjection(i);var a=e.get(`distance`)+n,o=e.get(`orthographicSize`)+r;[[`damping`,.8],[`autoRotate`,!1],[`autoRotateAfterStill`,3],[`autoRotateDirection`,`cw`],[`autoRotateSpeed`,10],[`minDistance`,30],[`maxDistance`,400],[`minOrthographicSize`,30],[`maxOrthographicSize`,300],[`minAlpha`,-90],[`maxAlpha`,90],[`minBeta`,-1/0],[`maxBeta`,1/0],[`rotateSensitivity`,1],[`zoomSensitivity`,1],[`panSensitivity`,1],[`panMouseButton`,`left`],[`rotateMouseButton`,`middle`]].forEach(function(t){this[t[0]]=lu(e.get(t[0]),t[1])},this),this.minDistance+=n,this.maxDistance+=n,this.minOrthographicSize+=r,this.maxOrthographicSize+=r;var s=e.ecModel,c={};[`animation`,`animationDurationUpdate`,`animationEasingUpdate`].forEach(function(t){c[t]=lu(e.get(t),s&&s.get(t))});var l=lu(t.alpha,e.get(`alpha`))||0,u=lu(t.beta,e.get(`beta`))||0,d=lu(t.center,e.get(`center`))||[0,0,0];c.animation&&c.animationDurationUpdate>0&&this._notFirst?this.animateTo({alpha:l,beta:u,center:d,distance:a,orthographicSize:o,easing:c.animationEasingUpdate,duration:c.animationDurationUpdate}):(this.setDistance(a),this.setAlpha(l),this.setBeta(u),this.setCenter(d),this.setOrthographicSize(o)),this._notFirst=!0,this._validateProperties()},_validateProperties:function(){},animateTo:function(e){var t=this.zr,n=this,r={},i={};return e.distance!=null&&(r.distance=this.getDistance(),i.distance=e.distance),e.orthographicSize!=null&&(r.orthographicSize=this.getOrthographicSize(),i.orthographicSize=e.orthographicSize),e.alpha!=null&&(r.alpha=this.getAlpha(),i.alpha=e.alpha),e.beta!=null&&(r.beta=this.getBeta(),i.beta=e.beta),e.center!=null&&(r.center=this.getCenter(),i.center=e.center),this._addAnimator(t.animation.animate(r).when(e.duration||1e3,i).during(function(){r.alpha!=null&&n.setAlpha(r.alpha),r.beta!=null&&n.setBeta(r.beta),r.distance!=null&&n.setDistance(r.distance),r.center!=null&&n.setCenter(r.center),r.orthographicSize!=null&&n.setOrthographicSize(r.orthographicSize),n._needsUpdate=!0})).start(e.easing||`linear`)},stopAllAnimation:function(){for(var e=0;e<this._animators.length;e++)this._animators[e].stop();this._animators.length=0},update:function(){this._needsUpdate=!0,this._update(20)},_isAnimating:function(){return this._animators.length>0},_update:function(e){if(this._rotating){var t=(this.autoRotateDirection===`cw`?1:-1)*this.autoRotateSpeed/180*Math.PI;this._phi-=t*e/1e3,this._needsUpdate=!0}else this._rotateVelocity.len()>0&&(this._needsUpdate=!0);(Math.abs(this._zoomSpeed)>.1||this._panVelocity.len()>0)&&(this._needsUpdate=!0),this._needsUpdate&&=(e=Math.min(e,50),this._updateDistanceOrSize(e),this._updatePan(e),this._updateRotate(e),this._updateTransform(),this.getCamera().update(),this.zr&&this.zr.refresh(),this.trigger(`update`),!1)},_updateRotate:function(e){var t=this._rotateVelocity;this._phi=t.y*e/20+this._phi,this._theta=t.x*e/20+this._theta,this.setAlpha(this.getAlpha()),this.setBeta(this.getBeta()),this._vectorDamping(t,this.damping**(e/16))},_updateDistanceOrSize:function(e){this._projection===`perspective`?this._setDistance(this._distance+this._zoomSpeed*e/20):this._setOrthoSize(this._orthoSize+this._zoomSpeed*e/20),this._zoomSpeed*=this.damping**(e/16)},_setDistance:function(e){this._distance=Math.max(Math.min(e,this.maxDistance),this.minDistance)},_setOrthoSize:function(e){this._orthoSize=Math.max(Math.min(e,this.maxOrthographicSize),this.minOrthographicSize);var t=this.getCamera(),n=this._orthoSize,r=n/this.viewGL.viewport.height*this.viewGL.viewport.width;t.left=-r/2,t.right=r/2,t.top=n/2,t.bottom=-n/2},_updatePan:function(e){var t=this._panVelocity,n=this._distance,r=this.getCamera(),i=r.worldTransform.y,a=r.worldTransform.x;this._center.scaleAndAdd(a,-t.x*n/200).scaleAndAdd(i,-t.y*n/200),this._vectorDamping(t,0)},_updateTransform:function(){var e=this.getCamera(),t=new F,n=this._theta+Math.PI/2,r=this._phi+Math.PI/2,i=Math.sin(n);t.x=i*Math.cos(r),t.y=-Math.cos(n),t.z=i*Math.sin(r),e.position.copy(this._center).scaleAndAdd(t,this._distance),e.rotation.identity().rotateY(-this._phi).rotateX(-this._theta)},_startCountingStill:function(){clearTimeout(this._stillTimeout);var e=this.autoRotateAfterStill,t=this;!isNaN(e)&&e>0&&(this._stillTimeout=setTimeout(function(){t._rotating=!0},e*1e3))},_vectorDamping:function(e,t){var n=e.len();n*=t,n<1e-4&&(n=0),e.normalize().scale(n)},_decomposeTransform:function(){if(this.getCamera()){this.getCamera().updateWorldTransform();var e=this.getCamera().worldTransform.z,t=Math.asin(e.y),n=Math.atan2(e.x,e.z);this._theta=t,this._phi=-n,this.setBeta(this.getBeta()),this.setAlpha(this.getAlpha()),this.getCamera().aspect?this._setDistance(this.getCamera().position.dist(this._center)):this._setOrthoSize(this.getCamera().top-this.getCamera().bottom)}},_mouseDownHandler:function(e){if(!e.target&&!this._isAnimating()){var t=e.offsetX,n=e.offsetY;this.viewGL&&!this.viewGL.containPoint(t,n)||(this.zr.on(`mousemove`,this._mouseMoveHandler),this.zr.on(`mouseup`,this._mouseUpHandler),e.event.targetTouches?e.event.targetTouches.length===1&&(this._mode=`rotate`):e.event.button===uu[this.rotateMouseButton]?this._mode=`rotate`:e.event.button===uu[this.panMouseButton]?this._mode=`pan`:this._mode=``,this._rotateVelocity.set(0,0),this._rotating=!1,this.autoRotate&&this._startCountingStill(),this._mouseX=e.offsetX,this._mouseY=e.offsetY)}},_mouseMoveHandler:function(e){if(!(e.target&&e.target.__isGLToZRProxy)&&!this._isAnimating()){var t=du(this.panSensitivity),n=du(this.rotateSensitivity);this._mode===`rotate`?(this._rotateVelocity.y=(e.offsetX-this._mouseX)/this.zr.getHeight()*2*n[0],this._rotateVelocity.x=(e.offsetY-this._mouseY)/this.zr.getWidth()*2*n[1]):this._mode===`pan`&&(this._panVelocity.x=(e.offsetX-this._mouseX)/this.zr.getWidth()*t[0]*400,this._panVelocity.y=(-e.offsetY+this._mouseY)/this.zr.getHeight()*t[1]*400),this._mouseX=e.offsetX,this._mouseY=e.offsetY,e.event.preventDefault()}},_mouseWheelHandler:function(e){if(!this._isAnimating()){var t=e.event.wheelDelta||-e.event.detail;this._zoomHandler(e,t)}},_pinchHandler:function(e){this._isAnimating()||(this._zoomHandler(e,e.pinchScale>1?1:-1),this._mode=``)},_zoomHandler:function(e,t){if(t!==0){var n=e.offsetX,r=e.offsetY;if(!(this.viewGL&&!this.viewGL.containPoint(n,r))){var i=this._projection===`perspective`?Math.max(Math.max(Math.min(this._distance-this.minDistance,this.maxDistance-this._distance))/20,.5):Math.max(Math.max(Math.min(this._orthoSize-this.minOrthographicSize,this.maxOrthographicSize-this._orthoSize))/20,.5);this._zoomSpeed=(t>0?-1:1)*i*this.zoomSensitivity,this._rotating=!1,this.autoRotate&&this._mode===`rotate`&&this._startCountingStill(),e.event.preventDefault()}}},_mouseUpHandler:function(){this.zr.off(`mousemove`,this._mouseMoveHandler),this.zr.off(`mouseup`,this._mouseUpHandler)},_isRightMouseButtonUsed:function(){return this.rotateMouseButton===`right`||this.panMouseButton===`right`},_contextMenuHandler:function(e){this._isRightMouseButtonUsed()&&e.preventDefault()},_addAnimator:function(e){var t=this._animators;return t.push(e),e.done(function(){var n=t.indexOf(e);n>=0&&t.splice(n,1)}),e}});Object.defineProperty(fu.prototype,"autoRotate",{get:function(e){return this._autoRotate},set:function(e){this._autoRotate=e,this._rotating=e}});function pu(){}pu.prototype={constructor:pu,setScene:function(e){this._scene=e,this._skybox&&this._skybox.attachScene(this._scene)},initLight:function(e){this._lightRoot=e,this.mainLight=new Q.DirectionalLight({shadowBias:.005}),this.ambientLight=new Q.AmbientLight,e.add(this.mainLight),e.add(this.ambientLight)},dispose:function(){this._lightRoot&&(this._lightRoot.remove(this.mainLight),this._lightRoot.remove(this.ambientLight))},updateLight:function(e){var t=this.mainLight,n=this.ambientLight,r=e.getModel(`light`),i=r.getModel(`main`),a=r.getModel(`ambient`);t.intensity=i.get(`intensity`),n.intensity=a.get(`intensity`),t.color=Q.parseColor(i.get(`color`)).slice(0,3),n.color=Q.parseColor(a.get(`color`)).slice(0,3);var o=i.get(`alpha`)||0,s=i.get(`beta`)||0;t.position.setArray(Q.directionFromAlphaBeta(o,s)),t.lookAt(Q.Vector3.ZERO),t.castShadow=i.get(`shadow`),t.shadowResolution=Q.getShadowResolution(i.get(`shadowQuality`))},updateAmbientCubemap:function(e,t,n){var r=t.getModel(`light.ambientCubemap`),i=r.get(`texture`);if(i){this._cubemapLightsCache=this._cubemapLightsCache||{};var a=this._cubemapLightsCache[i];if(!a){var o=this;a=this._cubemapLightsCache[i]=Q.createAmbientCubemap(r.option,e,n,function(){o._isSkyboxFromAmbientCubemap&&o._skybox.setEnvironmentMap(a.specular.cubemap),n.getZr().refresh()})}this._lightRoot.add(a.diffuse),this._lightRoot.add(a.specular),this._currentCubemapLights=a}else this._currentCubemapLights&&=(this._lightRoot.remove(this._currentCubemapLights.diffuse),this._lightRoot.remove(this._currentCubemapLights.specular),null)},updateSkybox:function(e,t,n){var r=t.get(`environment`),i=this;function a(){return i._skybox=i._skybox||new Fo,i._skybox}var o=a();if(r&&r!==`none`)if(r===`auto`)if(this._isSkyboxFromAmbientCubemap=!0,this._currentCubemapLights){var s=this._currentCubemapLights.specular.cubemap;o.setEnvironmentMap(s),this._scene&&o.attachScene(this._scene),o.material.set(`lod`,3)}else this._skybox&&this._skybox.detachScene();else if(typeof r==`object`&&r.colorStops||typeof r==`string`&&ft(r)){this._isSkyboxFromAmbientCubemap=!1;var c=new Q.Texture2D({anisotropic:8,flipY:!1});o.setEnvironmentMap(c);var l=c.image=document.createElement(`canvas`);l.width=l.height=16,le(l.getContext(`2d`),new un({shape:{x:0,y:0,width:16,height:16},style:{fill:r}})),o.attachScene(this._scene)}else{this._isSkyboxFromAmbientCubemap=!1;var c=Q.loadTexture(r,n,{anisotropic:8,flipY:!1});o.setEnvironmentMap(c),o.attachScene(this._scene)}else this._skybox&&this._skybox.detachScene(this._scene),this._skybox=null;var u=t.coordinateSystem;if(this._skybox)if(u&&u.viewGL&&r!==`auto`&&!(r.match&&r.match(/.hdr$/))){var d=u.viewGL.isLinearSpace()?`define`:`undefine`;this._skybox.material[d](`fragment`,`SRGB_DECODE`)}else this._skybox.material.undefine(`fragment`,`SRGB_DECODE`)}};var mu=Rt.extend({type:`grid3D`,dependencies:[`xAxis3D`,`yAxis3D`,`zAxis3D`],defaultOption:{show:!0,zlevel:-10,left:0,top:0,width:`100%`,height:`100%`,environment:`auto`,boxWidth:100,boxHeight:100,boxDepth:100,axisPointer:{show:!0,lineStyle:{color:`rgba(0, 0, 0, 0.8)`,width:1},label:{show:!0,formatter:null,margin:8,textStyle:{fontSize:14,color:`#fff`,backgroundColor:`rgba(0,0,0,0.5)`,padding:3,borderRadius:3}}},axisLine:{show:!0,lineStyle:{color:`#333`,width:2,type:`solid`}},axisTick:{show:!0,inside:!1,length:3,lineStyle:{width:1}},axisLabel:{show:!0,inside:!1,rotate:0,margin:8,textStyle:{fontSize:12}},splitLine:{show:!0,lineStyle:{color:[`#ccc`],width:1,type:`solid`}},splitArea:{show:!1,areaStyle:{color:[`rgba(250,250,250,0.3)`,`rgba(200,200,200,0.3)`]}},light:{main:{alpha:30,beta:40},ambient:{intensity:.4}},viewControl:{alpha:20,beta:40,autoRotate:!1,distance:200,minDistance:40,maxDistance:400}}});Ct(mu.prototype,tl),Ct(mu.prototype,nl),Ct(mu.prototype,rl);var hu=pc.vec3,gu=Ba.extend(function(){return{segmentScale:1,useNativeLine:!0,attributes:{position:new Ba.Attribute(`position`,`float`,3,`POSITION`),normal:new Ba.Attribute(`normal`,`float`,3,`NORMAL`),color:new Ba.Attribute(`color`,`float`,4,`COLOR`)}}},{resetOffset:function(){this._vertexOffset=0,this._faceOffset=0},setQuadCount:function(e){var t=this.attributes,n=this.getQuadVertexCount()*e,r=this.getQuadTriangleCount()*e;this.vertexCount!==n&&(t.position.init(n),t.normal.init(n),t.color.init(n)),this.triangleCount!==r&&(this.indices=n>65535?new Uint32Array(r*3):new Uint16Array(r*3))},getQuadVertexCount:function(){return 4},getQuadTriangleCount:function(){return 2},addQuad:function(){var e=hu.create(),t=hu.create(),n=hu.create(),r=[0,3,1,3,2,1];return function(i,a){var o=this.attributes.position,s=this.attributes.normal,c=this.attributes.color;hu.sub(e,i[1],i[0]),hu.sub(t,i[2],i[1]),hu.cross(n,e,t),hu.normalize(n,n);for(var l=0;l<4;l++)o.set(this._vertexOffset+l,i[l]),c.set(this._vertexOffset+l,a),s.set(this._vertexOffset+l,n);for(var u=this._faceOffset*3,l=0;l<6;l++)this.indices[u+l]=r[l]+this._vertexOffset;this._vertexOffset+=4,this._faceOffset+=2}}()});Ve(gu.prototype,Sc);var _u=js.firstNotNull,vu={x:0,y:2,z:1};function yu(e,t,n,r){var i=[0,0,0],a=r<0?n.getExtentMin():n.getExtentMax();i[vu[n.dim]]=a,e.position.setArray(i),e.rotation.identity(),t.distance=-Math.abs(a),t.normal.set(0,0,0),n.dim===`x`?(e.rotation.rotateY(r*Math.PI/2),t.normal.x=-r):n.dim===`z`?(e.rotation.rotateX(-r*Math.PI/2),t.normal.y=-r):(r>0&&e.rotation.rotateY(Math.PI),t.normal.z=-r)}function bu(e,t,n){this.rootNode=new Q.Node;var r=new Q.Mesh({geometry:new Lc({useNativeLine:!1}),material:t,castShadow:!1,ignorePicking:!0,$ignorePicking:!0,renderOrder:1}),i=new Q.Mesh({geometry:new gu,material:n,castShadow:!1,culling:!1,ignorePicking:!0,$ignorePicking:!0,renderOrder:0});this.rootNode.add(i),this.rootNode.add(r),this.faceInfo=e,this.plane=new Q.Plane,this.linesMesh=r,this.quadsMesh=i}bu.prototype.update=function(e,t,n){var r=e.coordinateSystem,i=[r.getAxis(this.faceInfo[0]),r.getAxis(this.faceInfo[1])],a=this.linesMesh.geometry,o=this.quadsMesh.geometry;a.convertToDynamicArray(!0),o.convertToDynamicArray(!0),this._updateSplitLines(a,i,e,n),this._udpateSplitAreas(o,i,e,n),a.convertToTypedArray(),o.convertToTypedArray();var s=r.getAxis(this.faceInfo[2]);yu(this.rootNode,this.plane,s,this.faceInfo[3])},bu.prototype._updateSplitLines=function(e,t,n,r){var i=r.getDevicePixelRatio();t.forEach(function(r,a){var o=r.model,s=t[1-a].getExtent();if(!r.scale.isBlank()){var c=o.getModel(`splitLine`,n.getModel(`splitLine`));if(c.get(`show`)){var l=c.getModel(`lineStyle`),u=l.get(`color`),d=_u(l.get(`opacity`),1),f=_u(l.get(`width`),1);u=on(u)?u:[u];for(var p=r.getTicksCoords({tickModel:c}),m=0,h=0;h<p.length;h++){var g=p[h].coord,_=Q.parseColor(u[m%u.length]);_[3]*=d;var v=[0,0,0],y=[0,0,0];v[a]=y[a]=g,v[1-a]=s[0],y[1-a]=s[1],e.addLine(v,y,_,f*i),m++}}}})},bu.prototype._udpateSplitAreas=function(e,t,n,r){t.forEach(function(r,i){var a=r.model,o=t[1-i].getExtent();if(!r.scale.isBlank()){var s=a.getModel(`splitArea`,n.getModel(`splitArea`));if(s.get(`show`)){var c=s.getModel(`areaStyle`),l=c.get(`color`),u=_u(c.get(`opacity`),1);l=on(l)?l:[l];for(var d=r.getTicksCoords({tickModel:s,clamp:!0}),f=0,p=[0,0,0],m=[0,0,0],h=0;h<d.length;h++){var g=d[h].coord,_=[0,0,0],v=[0,0,0];if(_[i]=v[i]=g,_[1-i]=o[0],v[1-i]=o[1],h===0){p=_,m=v;continue}var y=Q.parseColor(l[f%l.length]);y[3]*=u,e.addQuad([p,_,v,m],y),p=_,m=v,f++}}}})};var xu=js.firstNotNull,Su={x:0,y:2,z:1};function Cu(e,t){var n=new Q.Mesh({geometry:new Lc({useNativeLine:!1}),material:t,castShadow:!1,ignorePicking:!0,renderOrder:2}),r=new jc;r.material.depthMask=!1;var i=new Q.Node;i.add(n),i.add(r),this.rootNode=i,this.dim=e,this.linesMesh=n,this.labelsMesh=r,this.axisLineCoords=null,this.labelElements=[]}var wu={x:`y`,y:`x`,z:`y`};Cu.prototype.update=function(e,t,n){var r=e.coordinateSystem.getAxis(this.dim),i=this.linesMesh.geometry,a=this.labelsMesh.geometry;i.convertToDynamicArray(!0),a.convertToDynamicArray(!0);var o=r.model,s=r.getExtent(),c=n.getDevicePixelRatio(),l=o.getModel(`axisLine`,e.getModel(`axisLine`)),u=o.getModel(`axisTick`,e.getModel(`axisTick`)),d=o.getModel(`axisLabel`,e.getModel(`axisLabel`)),f=l.get(`lineStyle.color`);if(l.get(`show`)){var p=l.getModel(`lineStyle`),m=[0,0,0],h=[0,0,0],g=Su[r.dim];m[g]=s[0],h[g]=s[1],this.axisLineCoords=[m,h];var _=Q.parseColor(f),v=xu(p.get(`width`),1),y=xu(p.get(`opacity`),1);_[3]*=y,i.addLine(m,h,_,v*c)}if(u.get(`show`)){var b=u.getModel(`lineStyle`),x=Q.parseColor(xu(b.get(`color`),f)),v=xu(b.get(`width`),1);x[3]*=xu(b.get(`opacity`),1);for(var S=r.getTicksCoords(),C=u.get(`length`),w=0;w<S.length;w++){var T=S[w].coord,m=[0,0,0],h=[0,0,0],g=Su[r.dim],E=Su[wu[r.dim]];m[g]=h[g]=T,h[E]=C,i.addLine(m,h,x,v*c)}}this.labelElements=[];var c=n.getDevicePixelRatio();if(d.get(`show`))for(var S=r.getTicksCoords(),D=o.get(`data`),O=d.get(`margin`),k=r.getViewLabels(),w=0;w<k.length;w++){var A=bt(k[w].tick)?k[w].tick.value:k[w].tickValue,j=k[w].formattedLabel,M=k[w].rawLabel,T=r.dataToCoord(A),N=[0,0,0],g=Su[r.dim],E=Su[wu[r.dim]];N[g]=N[g]=T,N[E]=O;var ee=d;D&&D[A]&&D[A].textStyle&&(ee=new Ze(D[A].textStyle,d,o.ecModel));var te=xu(ee.get(`color`),f),ne=new _t({style:de(ee,{text:j,fill:typeof te==`function`?te(r.type===`category`?M:r.type===`value`?A+``:A,w):te,verticalAlign:`top`,align:`left`})}),re=t.add(ne),ie=ne.getBoundingRect();a.addSprite(N,[ie.width*c,ie.height*c],re),this.labelElements.push(ne)}if(o.get(`name`)){var ae=o.getModel(`nameTextStyle`),N=[0,0,0],g=Su[r.dim],E=Su[wu[r.dim]],oe=xu(ae.get(`color`),f),se=ae.get(`borderColor`),v=ae.get(`borderWidth`);N[g]=N[g]=(s[0]+s[1])/2,N[E]=o.get(`nameGap`);var ne=new _t({style:de(ae,{text:o.get(`name`),fill:oe,stroke:se,lineWidth:v})}),re=t.add(ne),ie=ne.getBoundingRect();a.addSprite(N,[ie.width*c,ie.height*c],re),ne.__idx=this.labelElements.length,this.nameLabelElement=ne}this.labelsMesh.material.set(`textureAtlas`,t.getTexture()),this.labelsMesh.material.set(`uvScale`,t.getCoordsScale()),i.convertToTypedArray(),a.convertToTypedArray()},Cu.prototype.setSpriteAlign=function(e,t,n){for(var r=n.getDevicePixelRatio(),i=this.labelsMesh.geometry,a=0;a<this.labelElements.length;a++){var o=this.labelElements[a].getBoundingRect();i.setSpriteAlign(a,[o.width*r,o.height*r],e,t)}var s=this.nameLabelElement;if(s){var o=s.getBoundingRect();i.setSpriteAlign(s.__idx,[o.width*r,o.height*r],e,t),i.dirty()}this.textAlign=e,this.textVerticalAlign=t};var Tu=js.firstNotNull;Q.Shader.import(Rc);var Eu={x:0,y:2,z:1},Du=tt.extend({type:`grid3D`,__ecgl__:!0,init:function(e,t){var n=[[`y`,`z`,`x`,-1,`left`],[`y`,`z`,`x`,1,`right`],[`x`,`y`,`z`,-1,`bottom`],[`x`,`y`,`z`,1,`top`],[`x`,`z`,`y`,-1,`far`],[`x`,`z`,`y`,1,`near`]],r=[`x`,`y`,`z`],i=new Q.Material({shader:Q.createShader(`ecgl.color`),depthMask:!1,transparent:!0}),a=new Q.Material({shader:Q.createShader(`ecgl.meshLines3D`),depthMask:!1,transparent:!0});i.define(`fragment`,`DOUBLE_SIDED`),i.define(`both`,`VERTEX_COLOR`),this.groupGL=new Q.Node,this._control=new fu({zr:t.getZr()}),this._control.init(),this._faces=n.map(function(e){var t=new bu(e,a,i);return this.groupGL.add(t.rootNode),t},this),this._axes=r.map(function(e){var t=new Cu(e,a);return this.groupGL.add(t.rootNode),t},this);var o=t.getDevicePixelRatio();this._axisLabelSurface=new Oc({width:256,height:256,devicePixelRatio:o}),this._axisLabelSurface.onupdate=function(){t.getZr().refresh()},this._axisPointerLineMesh=new Q.Mesh({geometry:new Lc({useNativeLine:!1}),material:a,castShadow:!1,ignorePicking:!0,renderOrder:3}),this.groupGL.add(this._axisPointerLineMesh),this._axisPointerLabelsSurface=new Oc({width:128,height:128,devicePixelRatio:o}),this._axisPointerLabelsMesh=new jc({ignorePicking:!0,renderOrder:4,castShadow:!1}),this._axisPointerLabelsMesh.material.set(`textureAtlas`,this._axisPointerLabelsSurface.getTexture()),this.groupGL.add(this._axisPointerLabelsMesh),this._lightRoot=new Q.Node,this._sceneHelper=new pu,this._sceneHelper.initLight(this._lightRoot)},render:function(e,t,n){this._model=e,this._api=n;var r=e.coordinateSystem;r.viewGL.add(this._lightRoot),e.get(`show`)?r.viewGL.add(this.groupGL):r.viewGL.remove(this.groupGL);var i=this._control;i.setViewGL(r.viewGL);var a=e.getModel(`viewControl`);i.setFromViewControlModel(a,0),this._axisLabelSurface.clear(),i.off(`update`),e.get(`show`)&&(this._faces.forEach(function(r){r.update(e,t,n)},this),this._axes.forEach(function(t){t.update(e,this._axisLabelSurface,n)},this)),i.on(`update`,this._onCameraChange.bind(this,e,n),this),this._sceneHelper.setScene(r.viewGL.scene),this._sceneHelper.updateLight(e),r.viewGL.setPostEffect(e.getModel(`postEffect`),n),r.viewGL.setTemporalSuperSampling(e.getModel(`temporalSuperSampling`)),this._initMouseHandler(e)},afterRender:function(e,t,n,r){var i=r.renderer;this._sceneHelper.updateAmbientCubemap(i,e,n),this._sceneHelper.updateSkybox(i,e,n)},showAxisPointer:function(e,t,n,r){this._doShowAxisPointer(),this._updateAxisPointer(r.value)},hideAxisPointer:function(e,t,n,r){this._doHideAxisPointer()},_initMouseHandler:function(e){var t=e.coordinateSystem.viewGL;e.get(`show`)&&e.get(`axisPointer.show`)?t.on(`mousemove`,this._updateAxisPointerOnMousePosition,this):t.off(`mousemove`,this._updateAxisPointerOnMousePosition)},_updateAxisPointerOnMousePosition:function(e){if(!e.target){for(var t=this._model.coordinateSystem,n=t.viewGL,r=n.castRay(e.offsetX,e.offsetY,new Q.Ray),i,a=0;a<this._faces.length;a++){var o=this._faces[a];if(!o.rootNode.invisible){o.plane.normal.dot(n.camera.worldTransform.z)<0&&o.plane.normal.negate();var s=r.intersectPlane(o.plane);if(s){var c=t.getAxis(o.faceInfo[0]),l=t.getAxis(o.faceInfo[1]),u=Eu[o.faceInfo[0]],d=Eu[o.faceInfo[1]];c.contain(s.array[u])&&l.contain(s.array[d])&&(i=s)}}}if(i){var f=t.pointToData(i.array,[],!0);this._updateAxisPointer(f),this._doShowAxisPointer()}else this._doHideAxisPointer()}},_onCameraChange:function(e,t){e.get(`show`)&&(this._updateFaceVisibility(),this._updateAxisLinePosition());var n=this._control;t.dispatchAction({type:`grid3DChangeCamera`,alpha:n.getAlpha(),beta:n.getBeta(),distance:n.getDistance(),center:n.getCenter(),from:this.uid,grid3DId:e.id})},_updateFaceVisibility:function(){var e=this._control.getCamera(),t=new Q.Vector3;e.update();for(var n=0;n<this._faces.length/2;n++){for(var r=[],i=0;i<2;i++)this._faces[n*2+i].rootNode.getWorldPosition(t),t.transformMat4(e.viewMatrix),r[i]=t.z;var a=r[0]>r[1]?0:1,o=this._faces[n*2+a],s=this._faces[n*2+1-a];o.rootNode.invisible=!0,s.rootNode.invisible=!1}},_updateAxisLinePosition:function(){var e=this._model.coordinateSystem,t=e.getAxis(`x`),n=e.getAxis(`y`),r=e.getAxis(`z`),i=r.getExtentMax(),a=r.getExtentMin(),o=t.getExtentMin(),s=t.getExtentMax(),c=n.getExtentMax(),l=n.getExtentMin(),u=this._axes[0].rootNode,d=this._axes[1].rootNode,f=this._axes[2].rootNode,p=this._faces,m=p[4].rootNode.invisible?l:c,h=p[2].rootNode.invisible?i:a,g=p[0].rootNode.invisible?o:s,_=p[2].rootNode.invisible?i:a,v=p[0].rootNode.invisible?s:o,y=p[4].rootNode.invisible?l:c;u.rotation.identity(),d.rotation.identity(),f.rotation.identity(),p[4].rootNode.invisible&&(this._axes[0].flipped=!0,u.rotation.rotateX(Math.PI)),p[0].rootNode.invisible&&(this._axes[1].flipped=!0,d.rotation.rotateZ(Math.PI)),p[4].rootNode.invisible&&(this._axes[2].flipped=!0,f.rotation.rotateY(Math.PI)),u.position.set(0,h,m),d.position.set(g,_,0),f.position.set(v,0,y),u.update(),d.update(),f.update(),this._updateAxisLabelAlign()},_updateAxisLabelAlign:function(){var e=this._control.getCamera(),t=[new Q.Vector4,new Q.Vector4],n=new Q.Vector4;this.groupGL.getWorldPosition(n),n.w=1,n.transformMat4(e.viewMatrix).transformMat4(e.projectionMatrix),n.x/=n.w,n.y/=n.w,this._axes.forEach(function(r){var i=r.axisLineCoords;r.labelsMesh.geometry;for(var a=0;a<t.length;a++)t[a].setArray(i[a]),t[a].w=1,t[a].transformMat4(r.rootNode.worldTransform).transformMat4(e.viewMatrix).transformMat4(e.projectionMatrix),t[a].x/=t[a].w,t[a].y/=t[a].w;var o=t[1].x-t[0].x,s=t[1].y-t[0].y,c=(t[1].x+t[0].x)/2,l=(t[1].y+t[0].y)/2,u,d;Math.abs(s/o)<.5?(u=`center`,d=l>n.y?`bottom`:`top`):(d=`middle`,u=c>n.x?`left`:`right`),r.setSpriteAlign(u,d,this._api)},this)},_doShowAxisPointer:function(){this._axisPointerLineMesh.invisible&&(this._axisPointerLineMesh.invisible=!1,this._axisPointerLabelsMesh.invisible=!1,this._api.getZr().refresh())},_doHideAxisPointer:function(){this._axisPointerLineMesh.invisible||(this._axisPointerLineMesh.invisible=!0,this._axisPointerLabelsMesh.invisible=!0,this._api.getZr().refresh())},_updateAxisPointer:function(e){var t=this._model.coordinateSystem,n=t.dataToPoint(e),r=this._axisPointerLineMesh.geometry,i=this._model.getModel(`axisPointer`),a=this._api.getDevicePixelRatio();r.convertToDynamicArray(!0);function o(e){return js.firstNotNull(e.model.get(`axisPointer.show`),i.get(`show`))}function s(e){var t=e.model.getModel(`axisPointer`,i).getModel(`lineStyle`),n=Q.parseColor(t.get(`color`)),r=Tu(t.get(`width`),1),a=Tu(t.get(`opacity`),1);return n[3]*=a,{color:n,lineWidth:r}}for(var c=0;c<this._faces.length;c++){var l=this._faces[c];if(!l.rootNode.invisible){for(var u=l.faceInfo,d=u[3]<0?t.getAxis(u[2]).getExtentMin():t.getAxis(u[2]).getExtentMax(),f=Eu[u[2]],p=0;p<2;p++){var m=u[p],h=u[1-p],g=t.getAxis(m),_=t.getAxis(h);if(o(g)){var v=[0,0,0],y=[0,0,0],b=Eu[m],x=Eu[h];v[b]=y[b]=n[b],v[f]=y[f]=d,v[x]=_.getExtentMin(),y[x]=_.getExtentMax();var S=s(g);r.addLine(v,y,S.color,S.lineWidth*a)}}if(o(t.getAxis(u[2]))){var v=n.slice(),y=n.slice();y[f]=d;var S=s(t.getAxis(u[2]));r.addLine(v,y,S.color,S.lineWidth*a)}}}r.convertToTypedArray(),this._updateAxisPointerLabelsMesh(e),this._api.getZr().refresh()},_updateAxisPointerLabelsMesh:function(e){var t=this._model,n=this._axisPointerLabelsMesh,r=this._axisPointerLabelsSurface,i=t.coordinateSystem,a=t.getModel(`axisPointer`);n.geometry.convertToDynamicArray(!0),r.clear();var o={x:`y`,y:`x`,z:`y`};this._axes.forEach(function(t,s){var c=i.getAxis(t.dim),l=c.model.getModel(`axisPointer`,a),u=l.getModel(`label`),d=l.get(`lineStyle.color`);if(!(!u.get(`show`)||!l.get(`show`))){var f=e[s],p=u.get(`formatter`),m=c.scale.getLabel({value:f});if(p!=null)m=p(m,e);else if(c.scale.type===`interval`||c.scale.type===`log`){var h=v(c.scale.getTicks()[0]);m=f.toFixed(h+2)}var g=u.get(`color`),_=new _t({style:de(u,{text:m,fill:g||d,align:`left`,verticalAlign:`top`})}),y=r.add(_),b=_.getBoundingRect(),x=this._api.getDevicePixelRatio(),S=t.rootNode.position.toArray(),C=Eu[o[t.dim]];S[C]+=(t.flipped?-1:1)*u.get(`margin`),S[Eu[t.dim]]=c.dataToCoord(e[s]),n.geometry.addSprite(S,[b.width*x,b.height*x],y,t.textAlign,t.textVerticalAlign)}},this),r.getZr().refreshImmediately(),n.material.set(`uvScale`,r.getCoordsScale()),n.geometry.convertToTypedArray()},dispose:function(){this.groupGL.removeAll(),this._control.dispose(),this._axisLabelSurface.dispose(),this._axisPointerLabelsSurface.dispose()}});function Ou(e){Bn.call(this,e),this.type=`cartesian3D`,this.dimensions=[`x`,`y`,`z`],this.size=[0,0,0]}Ou.prototype={constructor:Ou,model:null,containPoint:function(e){return this.getAxis(`x`).contain(e[0])&&this.getAxis(`y`).contain(e[2])&&this.getAxis(`z`).contain(e[1])},containData:function(e){return this.getAxis(`x`).containData(e[0])&&this.getAxis(`y`).containData(e[1])&&this.getAxis(`z`).containData(e[2])},dataToPoint:function(e,t,n){return t||=[],t[0]=this.getAxis(`x`).dataToCoord(e[0],n),t[2]=this.getAxis(`y`).dataToCoord(e[1],n),t[1]=this.getAxis(`z`).dataToCoord(e[2],n),t},pointToData:function(e,t,n){return t||=[],t[0]=this.getAxis(`x`).coordToData(e[0],n),t[1]=this.getAxis(`y`).coordToData(e[2],n),t[2]=this.getAxis(`z`).coordToData(e[1],n),t}},Yt(Ou,Bn);function ku(e,t,n){Un.call(this,e,t,n)}ku.prototype={constructor:ku,getExtentMin:function(){var e=this._extent;return Math.min(e[0],e[1])},getExtentMax:function(){var e=this._extent;return Math.max(e[0],e[1])},calculateCategoryInterval:function(){return Math.floor(this.scale.count()/8)}},Yt(ku,Un);function Au(e,t){var n=xn(e.getBoxLayoutParams(),{width:t.getWidth(),height:t.getHeight()});n.y=t.getHeight()-n.y-n.height,this.viewGL.setViewport(n.x,n.y,n.width,n.height,t.getDevicePixelRatio());var r=e.get(`boxWidth`),i=e.get(`boxHeight`),a=e.get(`boxDepth`);this.getAxis(`x`).setExtent(-r/2,r/2),this.getAxis(`y`).setExtent(a/2,-a/2),this.getAxis(`z`).setExtent(-i/2,i/2),this.size=[r,i,a]}function ju(e,t){var n={};function r(e,t){n[e]=n[e]||[1/0,-1/0],n[e][0]=Math.min(t[0],n[e][0]),n[e][1]=Math.max(t[1],n[e][1])}e.eachSeries(function(e){if(e.coordinateSystem===this){var t=e.getData();[`x`,`y`,`z`].forEach(function(e){t.mapDimensionsAll(e,!0).forEach(function(n){r(e,t.getDataExtent(n,!0))})})}},this),[`xAxis3D`,`yAxis3D`,`zAxis3D`].forEach(function(t){e.eachComponent(t,function(e){var r=t.charAt(0),i=e.getReferringComponents(`grid3D`).models[0],a=i.coordinateSystem;if(a===this){var o=a.getAxis(r);if(!o){o=new ku(r,Qn(n[r]||[1/0,-1/0],e)),o.type=e.get(`type`);var s=o.type===`category`;o.onBand=s&&e.get(`boundaryGap`),o.inverse=e.get(`inverse`),e.axis=o,o.model=e,o.getLabelModel=function(){return e.getModel(`axisLabel`,i.getModel(`axisLabel`))},o.getTickModel=function(){return e.getModel(`axisTick`,i.getModel(`axisTick`))},a.addAxis(o)}}},this)},this),this.resize(this.model,t)}var Mu={dimensions:Ou.prototype.dimensions,create:function(e,t){var n=[];e.eachComponent(`grid3D`,function(e){e.__viewGL=e.__viewGL||new su;var t=new Ou;t.model=e,t.viewGL=e.__viewGL,e.coordinateSystem=t,n.push(t),t.resize=Au,t.update=ju});var r=[`xAxis3D`,`yAxis3D`,`zAxis3D`];function i(e,t){return r.map(function(n){var r=e.getReferringComponents(n).models[0];return r??=t.getComponent(n),r})}return e.eachSeries(function(t){if(t.get(`coordinateSystem`)===`cartesian3D`){var n=t.getReferringComponents(`grid3D`).models[0];if(n==null){var r=i(t,e),n=r[0].getCoordSysModel();r.forEach(function(e){e.getCoordSysModel()})}t.coordinateSystem=n.coordinateSystem}}),n}},Nu=Rt.extend({type:`cartesian3DAxis`,axis:null,getCoordSysModel:function(){return this.ecModel.queryComponents({mainType:`grid3D`,index:this.option.gridIndex,id:this.option.gridId})[0]}});$n(Nu);var Pu={show:!0,grid3DIndex:0,inverse:!1,name:``,nameLocation:`middle`,nameTextStyle:{fontSize:16},nameGap:20,axisPointer:{},axisLine:{},axisTick:{},axisLabel:{},splitArea:{}},Fu=Ct({boundaryGap:!0,axisTick:{alignWithLabel:!1,interval:`auto`},axisLabel:{interval:`auto`},axisPointer:{label:{show:!1}}},Pu),Iu=Ct({boundaryGap:[0,0],splitNumber:5,axisPointer:{label:{}}},Pu),Lu=Ve({scale:!0,min:`dataMin`,max:`dataMax`},Iu),Ru=Ve({logBase:10},Iu);Ru.scale=!0;var zu={categoryAxis3D:Fu,valueAxis3D:Iu,timeAxis3D:Lu,logAxis3D:Ru},Bu=[`value`,`category`,`time`,`log`];function Vu(e,t,n,r,i){Bu.forEach(function(a){var o=n.extend({type:t+`Axis3D.`+a,__ordinalMeta:null,mergeDefaultAndTheme:function(e,n){Ct(e,n.getTheme().get(a+`Axis3D`)),Ct(e,this.getDefaultOption()),e.type=r(t,e)},optionUpdated:function(){this.option.type===`category`&&(this.__ordinalMeta=nt.createByAxisModel(this))},getCategories:function(){if(this.option.type===`category`)return this.__ordinalMeta.categories},getOrdinalMeta:function(){return this.__ordinalMeta},defaultOption:Ct(rt(zu[a+`Axis3D`]),i||{},!0)});e.registerComponentModel(o)}),e.registerSubTypeDefaulter(t+`Axis3D`,it(r,t))}function Hu(e,t){return t.type||(t.data?`category`:`value`)}function Uu(e){e.registerComponentModel(mu),e.registerComponentView(Du),e.registerCoordinateSystem(`grid3D`,Mu),[`x`,`y`,`z`].forEach(function(t){Vu(e,t,Nu,Hu,{name:t.toUpperCase()});let n=e.ComponentView.extend({type:t+`Axis3D`});e.registerComponentView(n)}),e.registerAction({type:`grid3DChangeCamera`,event:`grid3dcamerachanged`,update:`series:updateCamera`},function(e,t){t.eachComponent({mainType:`grid3D`,query:e},function(t){t.setView(e)})}),e.registerAction({type:`grid3DShowAxisPointer`,event:`grid3dshowaxispointer`,update:`grid3D:showAxisPointer`},function(e,t){}),e.registerAction({type:`grid3DHideAxisPointer`,event:`grid3dhideaxispointer`,update:`grid3D:hideAxisPointer`},function(e,t){})}function Wu(){try{let e=document.createElement(`canvas`);return!!(window.WebGLRenderingContext&&(e.getContext(`webgl`)||e.getContext(`experimental-webgl`)))}catch{return!1}}var Gu={class:`cluster-page`},Ku={class:`cluster-header`},qu={class:`cluster-heading`},Ju={class:`cluster-hint`},Yu={class:`cluster-tools`},Xu={class:`cluster-search`},Zu={key:0,class:`cluster-nomatch`},Qu={class:`chart-host cluster-host`},$u=[`aria-label`],ed={key:0,class:`chart-overlay`,role:`status`},{api:td}=Ln();Le([rn,Hn,Ht,Vn,Gn,ln]),Le([el,Uu]);var nd=u(i({...i({mixins:[Jn],data(){return{kw:this.$route?.query?.kw?.toString()??``,dim3:!0,webglOk:Wu(),scatterData:null,kwTimer:void 0,matchCount:0}},computed:{ariaLabel(){return`文档知识聚类散点图`},mobile(){return Fn.value},noMatch(){return!!this.kw.trim()&&this.matchCount===0}},watch:{kw(){clearTimeout(this.kwTimer),this.kwTimer=setTimeout(()=>this.applyHighlight(),250)},mobile(){this.renderChart()},dim3(){this.renderChart()}},methods:{displayName(e){return m.pathLeafName(e)},buildSeries(e,t){let n=this.scatterData;if(!n)return[];let r=this.dim3&&this.webglOk,i=new Map;for(let e of n.points){let t=Rn.getDocCategory(e.id);i.has(t)||i.set(t,[]),i.get(t).push(e)}let a=!!t,o=0,s=Array.from(i.entries()).map(([n,i])=>{let s=Rn.categoryColorMapping(n),c=i.map(e=>{let n=a&&this.displayName(e.name).toLowerCase().indexOf(t)!==-1;n&&o++;let i=this.mobile?e.size*.7:e.size;return{value:r?[e.x3,e.y3,e.z3]:[e.x,e.y],name:e.name,docId:e.id,tags:e.tags,s:i,hit:n,symbolSize:n?i*1.7:i,itemStyle:a?{opacity:n?1:.1}:void 0,label:a?{show:n}:void 0}}),l=e=>this.displayName(e.data?.name);return r?{name:n,type:`scatter3D`,data:c,itemStyle:{color:s,opacity:.9},label:{show:!0,position:`top`,distance:4,formatter:l,textStyle:{color:e.subText,fontSize:10,borderWidth:0,backgroundColor:`transparent`}},emphasis:{label:{show:!0,textStyle:{color:e.text,fontSize:12}},itemStyle:{opacity:1}}}:{name:n,type:`scatter`,data:c,itemStyle:{color:s,borderColor:e.surface,borderWidth:.5,opacity:.88},symbolSize:(e,t)=>t.data.hit?t.data.s*1.7:t.data.s,label:{show:!0,position:`top`,distance:3,color:e.subText,fontSize:this.mobile?9:11,formatter:l},labelLayout:{hideOverlap:!0},emphasis:{focus:`series`,scale:1.2,label:{show:!0},itemStyle:{opacity:1,borderColor:e.text,borderWidth:1}},animationDelay:e=>e*2}});return this.matchCount=o,s},applyHighlight(){if(!this.chart||!this.scatterData)return;let e=this.chartTheme();this.chart.setOption({series:this.buildSeries(e,this.kw.trim().toLowerCase())})},async buildOption(e){let t=await td.getDocClusterScatter();if(!t||!t.points?.length)return null;await Rn.initializeTopLevelCategories(),this.scatterData=t;let n=this.buildSeries(e,this.kw.trim().toLowerCase());this.chart?.off(`click`),this.chart?.on(`click`,e=>{let t=e?.data?.docId;t&&this.$router.push(`/doc/`+t)});let r={trigger:`item`,...Kn(e),formatter:e=>{let t=e.data||{},n=this.displayName(t.name),r=(t.tags||[]).join(` / `);return`<b>${n}</b><br/><span style="opacity:.6">${e.seriesName}</span>`+(r?`<br/><span style="opacity:.6">${r}</span>`:``)}},i={type:`scroll`,top:0,left:`center`,textStyle:{color:e.subText,fontSize:this.mobile?10:12},pageTextStyle:{color:e.subText},pageIconColor:e.primary,pageIconInactiveColor:e.axisLine,inactiveColor:e.axisLine};if(this.dim3&&this.webglOk){let e=1;for(let n of t.points)e=Math.max(e,Math.abs(n.x3),Math.abs(n.y3),Math.abs(n.z3));e*=1.06;let a={type:`value`,show:!1,min:-e,max:e};return{tooltip:r,legend:i,xAxis3D:a,yAxis3D:a,zAxis3D:a,grid3D:{show:!1,boxWidth:100,boxDepth:100,boxHeight:100,viewControl:{projection:`perspective`,autoRotate:!1,rotateSensitivity:1.5,zoomSensitivity:2,distance:170,minDistance:1,maxDistance:600},light:{main:{intensity:1.1,shadow:!1},ambient:{intensity:.4}}},series:n}}let a=1;for(let e of t.points)a=Math.max(a,Math.abs(e.x),Math.abs(e.y));let o=a*1.06;return{tooltip:r,legend:i,grid:{left:8,right:8,top:this.mobile?46:40,bottom:8,containLabel:!1},xAxis:{type:`value`,show:!1,min:-o,max:o},yAxis:{type:`value`,show:!1,min:-o,max:o},dataZoom:[{type:`inside`,xAxisIndex:0,filterMode:`none`},{type:`inside`,yAxisIndex:0,filterMode:`none`}],animationDurationUpdate:400,animationEasingUpdate:`cubicOut`,series:n}}},mounted(){In.setDocTitle(`知识聚类`)},unmounted(){clearTimeout(this.kwTimer)}}),__name:`DocCluster`,setup(e){return(e,i)=>{let u=Ft,m=b,h=Nn,g=f,_=Pn;return s(),r(`div`,Gu,[n(`div`,Ku,[n(`div`,qu,[i[2]||=n(`h1`,{class:`cluster-title`},`知识聚类`,-1),n(`p`,Ju,c(e.dim3?`按文本相似度投影的 3D 文档点云 · 同色一类 · 拖拽旋转 · 滚轮缩放 · 点击进入文档`:`按文本相似度投影的文档点云 · 同色一类 · 滚轮缩放 · 点击进入文档`),1)]),n(`div`,Yu,[t(h,{disabled:e.webglOk,content:`当前浏览器不支持 WebGL（可在设置中开启硬件加速后重试）`,placement:`bottom`},{default:p(()=>[t(m,{modelValue:e.dim3,"onUpdate:modelValue":i[0]||=t=>e.dim3=t,size:`default`,"aria-label":`切换 2D/3D 视图`},{default:p(()=>[t(u,{value:!1},{default:p(()=>[...i[3]||=[d(`2D`,-1)]]),_:1}),t(u,{value:!0,disabled:!e.webglOk},{default:p(()=>[...i[4]||=[d(`3D`,-1)]]),_:1},8,[`disabled`])]),_:1},8,[`modelValue`])]),_:1},8,[`disabled`]),n(`div`,Xu,[t(_,{modelValue:e.kw,"onUpdate:modelValue":i[1]||=t=>e.kw=t,placeholder:`搜索高亮节点`,size:`default`,clearable:``,"aria-label":`搜索高亮聚类节点`},{prefix:p(()=>[t(g,null,{default:p(()=>[t(o(l))]),_:1})]),_:1},8,[`modelValue`]),e.noMatch?(s(),r(`span`,Zu,`无匹配节点`)):a(``,!0)])])]),n(`div`,Qu,[n(`div`,{ref:`chartEl`,class:`chart-box`,role:`img`,"aria-label":e.ariaLabel},null,8,$u),e.chartState===`empty`||e.chartState===`error`?(s(),r(`div`,ed,c(e.chartState===`empty`?`暂无聚类数据`:`聚类数据加载失败`),1)):a(``,!0)])])}}}),[[`__scopeId`,`data-v-78e656ee`]]);export{nd as default};