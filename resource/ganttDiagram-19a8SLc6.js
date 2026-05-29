import{g as re,s as ne,y as oe,x as ce,a as le,b as ue,_ as o,c as Q,d as de,l as j,k as fe,D as he,u as ke}from"./mermaid-C62ZqKqX.js";import{h as kt,ae as me,af as ye,ag as ge,ah as pe,ai as ve,d as A,aj as Te,ak as Nt,al as Yt,am as xe,an as be,ao as we,ap as _e,aq as Ce,ar as De,as as Ee,at as Bt,au as zt,av as qt,aw as Xt,ax as Ut,ay as Se,J as Ie,az as Ae,aA as Fe,aB as Le,aC as Me}from"./vendor-Cf3XDrOD.js";import"./index-CodeZpEE.js";import"./vue-Nk5fSxUO.js";import"./element-plus-C1Ss1s4l.js";import"./lodash-BotAHomD.js";import"./echarts-h0xzsPFG.js";import"./zrender-7cmoB4v5.js";import"./katex-DDugWNiy.js";import"./marked-DYOD8h3s.js";import"./prismjs-BIJ35AfN.js";import"./dagre-d3-CnyM4rRN.js";import"./cytoscape-BxxdFPjQ.js";import"./mermaid-parser-DnSyLl70.js";var wt=(function(){var t=o(function(k,c,l,d){for(l=l||{},d=k.length;d--;l[k[d]]=c);return l},"o"),s=[6,8,10,12,13,14,15,16,17,18,20,21,22,23,24,25,26,27,28,29,30,31,33,35,36,38,40],r=[1,26],a=[1,27],n=[1,28],f=[1,29],g=[1,30],D=[1,31],L=[1,32],Y=[1,33],E=[1,34],M=[1,9],B=[1,10],V=[1,11],W=[1,12],_=[1,13],tt=[1,14],et=[1,15],it=[1,16],st=[1,19],H=[1,20],at=[1,21],rt=[1,22],nt=[1,23],ot=[1,25],m=[1,35],T={trace:o(function(){},"trace"),yy:{},symbols_:{error:2,start:3,gantt:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NL:10,weekday:11,weekday_monday:12,weekday_tuesday:13,weekday_wednesday:14,weekday_thursday:15,weekday_friday:16,weekday_saturday:17,weekday_sunday:18,weekend:19,weekend_friday:20,weekend_saturday:21,dateFormat:22,inclusiveEndDates:23,topAxis:24,axisFormat:25,tickInterval:26,excludes:27,includes:28,todayMarker:29,title:30,acc_title:31,acc_title_value:32,acc_descr:33,acc_descr_value:34,acc_descr_multiline_value:35,section:36,clickStatement:37,taskTxt:38,taskData:39,click:40,callbackname:41,callbackargs:42,href:43,clickStatementDebug:44,$accept:0,$end:1},terminals_:{2:"error",4:"gantt",6:"EOF",8:"SPACE",10:"NL",12:"weekday_monday",13:"weekday_tuesday",14:"weekday_wednesday",15:"weekday_thursday",16:"weekday_friday",17:"weekday_saturday",18:"weekday_sunday",20:"weekend_friday",21:"weekend_saturday",22:"dateFormat",23:"inclusiveEndDates",24:"topAxis",25:"axisFormat",26:"tickInterval",27:"excludes",28:"includes",29:"todayMarker",30:"title",31:"acc_title",32:"acc_title_value",33:"acc_descr",34:"acc_descr_value",35:"acc_descr_multiline_value",36:"section",38:"taskTxt",39:"taskData",40:"click",41:"callbackname",42:"callbackargs",43:"href"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[19,1],[19,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,1],[9,2],[37,2],[37,3],[37,3],[37,4],[37,3],[37,4],[37,2],[44,2],[44,3],[44,3],[44,4],[44,3],[44,4],[44,2]],performAction:o(function(c,l,d,u,y,i,S){var e=i.length-1;switch(y){case 1:return i[e-1];case 2:this.$=[];break;case 3:i[e-1].push(i[e]),this.$=i[e-1];break;case 4:case 5:this.$=i[e];break;case 6:case 7:this.$=[];break;case 8:u.setWeekday("monday");break;case 9:u.setWeekday("tuesday");break;case 10:u.setWeekday("wednesday");break;case 11:u.setWeekday("thursday");break;case 12:u.setWeekday("friday");break;case 13:u.setWeekday("saturday");break;case 14:u.setWeekday("sunday");break;case 15:u.setWeekend("friday");break;case 16:u.setWeekend("saturday");break;case 17:u.setDateFormat(i[e].substr(11)),this.$=i[e].substr(11);break;case 18:u.enableInclusiveEndDates(),this.$=i[e].substr(18);break;case 19:u.TopAxis(),this.$=i[e].substr(8);break;case 20:u.setAxisFormat(i[e].substr(11)),this.$=i[e].substr(11);break;case 21:u.setTickInterval(i[e].substr(13)),this.$=i[e].substr(13);break;case 22:u.setExcludes(i[e].substr(9)),this.$=i[e].substr(9);break;case 23:u.setIncludes(i[e].substr(9)),this.$=i[e].substr(9);break;case 24:u.setTodayMarker(i[e].substr(12)),this.$=i[e].substr(12);break;case 27:u.setDiagramTitle(i[e].substr(6)),this.$=i[e].substr(6);break;case 28:this.$=i[e].trim(),u.setAccTitle(this.$);break;case 29:case 30:this.$=i[e].trim(),u.setAccDescription(this.$);break;case 31:u.addSection(i[e].substr(8)),this.$=i[e].substr(8);break;case 33:u.addTask(i[e-1],i[e]),this.$="task";break;case 34:this.$=i[e-1],u.setClickEvent(i[e-1],i[e],null);break;case 35:this.$=i[e-2],u.setClickEvent(i[e-2],i[e-1],i[e]);break;case 36:this.$=i[e-2],u.setClickEvent(i[e-2],i[e-1],null),u.setLink(i[e-2],i[e]);break;case 37:this.$=i[e-3],u.setClickEvent(i[e-3],i[e-2],i[e-1]),u.setLink(i[e-3],i[e]);break;case 38:this.$=i[e-2],u.setClickEvent(i[e-2],i[e],null),u.setLink(i[e-2],i[e-1]);break;case 39:this.$=i[e-3],u.setClickEvent(i[e-3],i[e-1],i[e]),u.setLink(i[e-3],i[e-2]);break;case 40:this.$=i[e-1],u.setLink(i[e-1],i[e]);break;case 41:case 47:this.$=i[e-1]+" "+i[e];break;case 42:case 43:case 45:this.$=i[e-2]+" "+i[e-1]+" "+i[e];break;case 44:case 46:this.$=i[e-3]+" "+i[e-2]+" "+i[e-1]+" "+i[e];break}},"anonymous"),table:[{3:1,4:[1,2]},{1:[3]},t(s,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:17,12:r,13:a,14:n,15:f,16:g,17:D,18:L,19:18,20:Y,21:E,22:M,23:B,24:V,25:W,26:_,27:tt,28:et,29:it,30:st,31:H,33:at,35:rt,36:nt,37:24,38:ot,40:m},t(s,[2,7],{1:[2,1]}),t(s,[2,3]),{9:36,11:17,12:r,13:a,14:n,15:f,16:g,17:D,18:L,19:18,20:Y,21:E,22:M,23:B,24:V,25:W,26:_,27:tt,28:et,29:it,30:st,31:H,33:at,35:rt,36:nt,37:24,38:ot,40:m},t(s,[2,5]),t(s,[2,6]),t(s,[2,17]),t(s,[2,18]),t(s,[2,19]),t(s,[2,20]),t(s,[2,21]),t(s,[2,22]),t(s,[2,23]),t(s,[2,24]),t(s,[2,25]),t(s,[2,26]),t(s,[2,27]),{32:[1,37]},{34:[1,38]},t(s,[2,30]),t(s,[2,31]),t(s,[2,32]),{39:[1,39]},t(s,[2,8]),t(s,[2,9]),t(s,[2,10]),t(s,[2,11]),t(s,[2,12]),t(s,[2,13]),t(s,[2,14]),t(s,[2,15]),t(s,[2,16]),{41:[1,40],43:[1,41]},t(s,[2,4]),t(s,[2,28]),t(s,[2,29]),t(s,[2,33]),t(s,[2,34],{42:[1,42],43:[1,43]}),t(s,[2,40],{41:[1,44]}),t(s,[2,35],{43:[1,45]}),t(s,[2,36]),t(s,[2,38],{42:[1,46]}),t(s,[2,37]),t(s,[2,39])],defaultActions:{},parseError:o(function(c,l){if(l.recoverable)this.trace(c);else{var d=new Error(c);throw d.hash=l,d}},"parseError"),parse:o(function(c){var l=this,d=[0],u=[],y=[null],i=[],S=this.table,e="",h=0,C=0,w=2,b=1,F=i.slice.call(arguments,1),v=Object.create(this.lexer),z={yy:{}};for(var ct in this.yy)Object.prototype.hasOwnProperty.call(this.yy,ct)&&(z.yy[ct]=this.yy[ct]);v.setInput(c,z.yy),z.yy.lexer=v,z.yy.parser=this,typeof v.yylloc>"u"&&(v.yylloc={});var vt=v.yylloc;i.push(vt);var se=v.options&&v.options.ranges;typeof z.yy.parseError=="function"?this.parseError=z.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function ae(R){d.length=d.length-2*R,y.length=y.length-R,i.length=i.length-R}o(ae,"popStack");function Wt(){var R;return R=u.pop()||v.lex()||b,typeof R!="number"&&(R instanceof Array&&(u=R,R=u.pop()),R=l.symbols_[R]||R),R}o(Wt,"lex");for(var O,U,P,Tt,K={},ft,q,Pt,ht;;){if(U=d[d.length-1],this.defaultActions[U]?P=this.defaultActions[U]:((O===null||typeof O>"u")&&(O=Wt()),P=S[U]&&S[U][O]),typeof P>"u"||!P.length||!P[0]){var xt="";ht=[];for(ft in S[U])this.terminals_[ft]&&ft>w&&ht.push("'"+this.terminals_[ft]+"'");v.showPosition?xt="Parse error on line "+(h+1)+`:
`+v.showPosition()+`
Expecting `+ht.join(", ")+", got '"+(this.terminals_[O]||O)+"'":xt="Parse error on line "+(h+1)+": Unexpected "+(O==b?"end of input":"'"+(this.terminals_[O]||O)+"'"),this.parseError(xt,{text:v.match,token:this.terminals_[O]||O,line:v.yylineno,loc:vt,expected:ht})}if(P[0]instanceof Array&&P.length>1)throw new Error("Parse Error: multiple actions possible at state: "+U+", token: "+O);switch(P[0]){case 1:d.push(O),y.push(v.yytext),i.push(v.yylloc),d.push(P[1]),O=null,C=v.yyleng,e=v.yytext,h=v.yylineno,vt=v.yylloc;break;case 2:if(q=this.productions_[P[1]][1],K.$=y[y.length-q],K._$={first_line:i[i.length-(q||1)].first_line,last_line:i[i.length-1].last_line,first_column:i[i.length-(q||1)].first_column,last_column:i[i.length-1].last_column},se&&(K._$.range=[i[i.length-(q||1)].range[0],i[i.length-1].range[1]]),Tt=this.performAction.apply(K,[e,C,h,z.yy,P[1],y,i].concat(F)),typeof Tt<"u")return Tt;q&&(d=d.slice(0,-1*q*2),y=y.slice(0,-1*q),i=i.slice(0,-1*q)),d.push(this.productions_[P[1]][0]),y.push(K.$),i.push(K._$),Pt=S[d[d.length-2]][d[d.length-1]],d.push(Pt);break;case 3:return!0}}return!0},"parse")},x=(function(){var k={EOF:1,parseError:o(function(l,d){if(this.yy.parser)this.yy.parser.parseError(l,d);else throw new Error(l)},"parseError"),setInput:o(function(c,l){return this.yy=l||this.yy||{},this._input=c,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:o(function(){var c=this._input[0];this.yytext+=c,this.yyleng++,this.offset++,this.match+=c,this.matched+=c;var l=c.match(/(?:\r\n?|\n).*/g);return l?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),c},"input"),unput:o(function(c){var l=c.length,d=c.split(/(?:\r\n?|\n)/g);this._input=c+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-l),this.offset-=l;var u=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),d.length-1&&(this.yylineno-=d.length-1);var y=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:d?(d.length===u.length?this.yylloc.first_column:0)+u[u.length-d.length].length-d[0].length:this.yylloc.first_column-l},this.options.ranges&&(this.yylloc.range=[y[0],y[0]+this.yyleng-l]),this.yyleng=this.yytext.length,this},"unput"),more:o(function(){return this._more=!0,this},"more"),reject:o(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:o(function(c){this.unput(this.match.slice(c))},"less"),pastInput:o(function(){var c=this.matched.substr(0,this.matched.length-this.match.length);return(c.length>20?"...":"")+c.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:o(function(){var c=this.match;return c.length<20&&(c+=this._input.substr(0,20-c.length)),(c.substr(0,20)+(c.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:o(function(){var c=this.pastInput(),l=new Array(c.length+1).join("-");return c+this.upcomingInput()+`
`+l+"^"},"showPosition"),test_match:o(function(c,l){var d,u,y;if(this.options.backtrack_lexer&&(y={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(y.yylloc.range=this.yylloc.range.slice(0))),u=c[0].match(/(?:\r\n?|\n).*/g),u&&(this.yylineno+=u.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:u?u[u.length-1].length-u[u.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+c[0].length},this.yytext+=c[0],this.match+=c[0],this.matches=c,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(c[0].length),this.matched+=c[0],d=this.performAction.call(this,this.yy,this,l,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),d)return d;if(this._backtrack){for(var i in y)this[i]=y[i];return!1}return!1},"test_match"),next:o(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var c,l,d,u;this._more||(this.yytext="",this.match="");for(var y=this._currentRules(),i=0;i<y.length;i++)if(d=this._input.match(this.rules[y[i]]),d&&(!l||d[0].length>l[0].length)){if(l=d,u=i,this.options.backtrack_lexer){if(c=this.test_match(d,y[i]),c!==!1)return c;if(this._backtrack){l=!1;continue}else return!1}else if(!this.options.flex)break}return l?(c=this.test_match(l,y[u]),c!==!1?c:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:o(function(){var l=this.next();return l||this.lex()},"lex"),begin:o(function(l){this.conditionStack.push(l)},"begin"),popState:o(function(){var l=this.conditionStack.length-1;return l>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:o(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:o(function(l){return l=this.conditionStack.length-1-Math.abs(l||0),l>=0?this.conditionStack[l]:"INITIAL"},"topState"),pushState:o(function(l){this.begin(l)},"pushState"),stateStackSize:o(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:o(function(l,d,u,y){switch(u){case 0:return this.begin("open_directive"),"open_directive";case 1:return this.begin("acc_title"),31;case 2:return this.popState(),"acc_title_value";case 3:return this.begin("acc_descr"),33;case 4:return this.popState(),"acc_descr_value";case 5:this.begin("acc_descr_multiline");break;case 6:this.popState();break;case 7:return"acc_descr_multiline_value";case 8:break;case 9:break;case 10:break;case 11:return 10;case 12:break;case 13:break;case 14:this.begin("href");break;case 15:this.popState();break;case 16:return 43;case 17:this.begin("callbackname");break;case 18:this.popState();break;case 19:this.popState(),this.begin("callbackargs");break;case 20:return 41;case 21:this.popState();break;case 22:return 42;case 23:this.begin("click");break;case 24:this.popState();break;case 25:return 40;case 26:return 4;case 27:return 22;case 28:return 23;case 29:return 24;case 30:return 25;case 31:return 26;case 32:return 28;case 33:return 27;case 34:return 29;case 35:return 12;case 36:return 13;case 37:return 14;case 38:return 15;case 39:return 16;case 40:return 17;case 41:return 18;case 42:return 20;case 43:return 21;case 44:return"date";case 45:return 30;case 46:return"accDescription";case 47:return 36;case 48:return 38;case 49:return 39;case 50:return":";case 51:return 6;case 52:return"INVALID"}},"anonymous"),rules:[/^(?:%%\{)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:%%(?!\{)*[^\n]*)/i,/^(?:[^\}]%%*[^\n]*)/i,/^(?:%%*[^\n]*[\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:%[^\n]*)/i,/^(?:href[\s]+["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:call[\s]+)/i,/^(?:\([\s]*\))/i,/^(?:\()/i,/^(?:[^(]*)/i,/^(?:\))/i,/^(?:[^)]*)/i,/^(?:click[\s]+)/i,/^(?:[\s\n])/i,/^(?:[^\s\n]*)/i,/^(?:gantt\b)/i,/^(?:dateFormat\s[^#\n;]+)/i,/^(?:inclusiveEndDates\b)/i,/^(?:topAxis\b)/i,/^(?:axisFormat\s[^#\n;]+)/i,/^(?:tickInterval\s[^#\n;]+)/i,/^(?:includes\s[^#\n;]+)/i,/^(?:excludes\s[^#\n;]+)/i,/^(?:todayMarker\s[^\n;]+)/i,/^(?:weekday\s+monday\b)/i,/^(?:weekday\s+tuesday\b)/i,/^(?:weekday\s+wednesday\b)/i,/^(?:weekday\s+thursday\b)/i,/^(?:weekday\s+friday\b)/i,/^(?:weekday\s+saturday\b)/i,/^(?:weekday\s+sunday\b)/i,/^(?:weekend\s+friday\b)/i,/^(?:weekend\s+saturday\b)/i,/^(?:\d\d\d\d-\d\d-\d\d\b)/i,/^(?:title\s[^\n]+)/i,/^(?:accDescription\s[^#\n;]+)/i,/^(?:section\s[^\n]+)/i,/^(?:[^:\n]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[6,7],inclusive:!1},acc_descr:{rules:[4],inclusive:!1},acc_title:{rules:[2],inclusive:!1},callbackargs:{rules:[21,22],inclusive:!1},callbackname:{rules:[18,19,20],inclusive:!1},href:{rules:[15,16],inclusive:!1},click:{rules:[24,25],inclusive:!1},INITIAL:{rules:[0,1,3,5,8,9,10,11,12,13,14,17,23,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52],inclusive:!0}}};return k})();T.lexer=x;function p(){this.yy={}}return o(p,"Parser"),p.prototype=T,T.Parser=p,new p})();wt.parser=wt;var Oe=wt;A.extend(Ae);A.extend(Fe);A.extend(Le);var jt={friday:5,saturday:6},N="",Et="",St=void 0,It="",lt=[],ut=[],At=new Map,Ft=[],gt=[],$="",Lt="",Kt=["active","done","crit","milestone","vert"],Mt=[],J="",dt=!1,Ot=!1,Rt="sunday",pt="saturday",_t=0,Re=o(function(){Ft=[],gt=[],$="",Mt=[],mt=0,Dt=void 0,yt=void 0,I=[],N="",Et="",Lt="",St=void 0,It="",lt=[],ut=[],dt=!1,Ot=!1,_t=0,At=new Map,J="",he(),Rt="sunday",pt="saturday"},"clear"),Ve=o(function(t){J=t},"setDiagramId"),We=o(function(t){Et=t},"setAxisFormat"),Pe=o(function(){return Et},"getAxisFormat"),Ne=o(function(t){St=t},"setTickInterval"),Ye=o(function(){return St},"getTickInterval"),Be=o(function(t){It=t},"setTodayMarker"),ze=o(function(){return It},"getTodayMarker"),qe=o(function(t){N=t},"setDateFormat"),Xe=o(function(){dt=!0},"enableInclusiveEndDates"),Ue=o(function(){return dt},"endDatesAreInclusive"),je=o(function(){Ot=!0},"enableTopAxis"),Ge=o(function(){return Ot},"topAxisEnabled"),He=o(function(t){Lt=t},"setDisplayMode"),Ke=o(function(){return Lt},"getDisplayMode"),Je=o(function(){return N},"getDateFormat"),Qe=o(function(t){lt=t.toLowerCase().split(/[\s,]+/)},"setIncludes"),Ze=o(function(){return lt},"getIncludes"),$e=o(function(t){ut=t.toLowerCase().split(/[\s,]+/)},"setExcludes"),ti=o(function(){return ut},"getExcludes"),ei=o(function(){return At},"getLinks"),ii=o(function(t){$=t,Ft.push(t)},"addSection"),si=o(function(){return Ft},"getSections"),ai=o(function(){let t=Gt();const s=10;let r=0;for(;!t&&r<s;)t=Gt(),r++;return gt=I,gt},"getTasks"),Jt=o(function(t,s,r,a){const n=t.format(s.trim()),f=t.format("YYYY-MM-DD");return a.includes(n)||a.includes(f)?!1:r.includes("weekends")&&(t.isoWeekday()===jt[pt]||t.isoWeekday()===jt[pt]+1)||r.includes(t.format("dddd").toLowerCase())?!0:r.includes(n)||r.includes(f)},"isInvalidDate"),ri=o(function(t){Rt=t},"setWeekday"),ni=o(function(){return Rt},"getWeekday"),oi=o(function(t){pt=t},"setWeekend"),Qt=o(function(t,s,r,a){if(!r.length||t.manualEndTime)return;let n;t.startTime instanceof Date?n=A(t.startTime):n=A(t.startTime,s,!0),n=n.add(1,"d");let f;t.endTime instanceof Date?f=A(t.endTime):f=A(t.endTime,s,!0);const[g,D]=ci(n,f,s,r,a);t.endTime=g.toDate(),t.renderEndTime=D},"checkTaskDates"),ci=o(function(t,s,r,a,n){let f=!1,g=null;const D=s.add(1e4,"d");for(;t<=s;){if(f||(g=s.toDate()),f=Jt(t,r,a,n),f&&(s=s.add(1,"d"),s>D))throw new Error("Failed to find a valid date that was not excluded by `excludes` after 10,000 iterations.");t=t.add(1,"d")}return[s,g]},"fixTaskDates"),Ct=o(function(t,s,r){if(r=r.trim(),o(D=>{const L=D.trim();return L==="x"||L==="X"},"isTimestampFormat")(s)&&/^\d+$/.test(r))return new Date(Number(r));const f=/^after\s+(?<ids>[\d\w- ]+)/.exec(r);if(f!==null){let D=null;for(const Y of f.groups.ids.split(" ")){let E=G(Y);E!==void 0&&(!D||E.endTime>D.endTime)&&(D=E)}if(D)return D.endTime;const L=new Date;return L.setHours(0,0,0,0),L}let g=A(r,s.trim(),!0);if(g.isValid())return g.toDate();{j.debug("Invalid date:"+r),j.debug("With date format:"+s.trim());const D=new Date(r);if(D===void 0||isNaN(D.getTime())||D.getFullYear()<-1e4||D.getFullYear()>1e4)throw new Error("Invalid date:"+r);return D}},"getStartDate"),Zt=o(function(t){const s=/^(\d+(?:\.\d+)?)([Mdhmswy]|ms)$/.exec(t.trim());return s!==null?[Number.parseFloat(s[1]),s[2]]:[NaN,"ms"]},"parseDuration"),$t=o(function(t,s,r,a=!1){r=r.trim();const f=/^until\s+(?<ids>[\d\w- ]+)/.exec(r);if(f!==null){let E=null;for(const B of f.groups.ids.split(" ")){let V=G(B);V!==void 0&&(!E||V.startTime<E.startTime)&&(E=V)}if(E)return E.startTime;const M=new Date;return M.setHours(0,0,0,0),M}let g=A(r,s.trim(),!0);if(g.isValid())return a&&(g=g.add(1,"d")),g.toDate();let D=A(t);const[L,Y]=Zt(r);if(!Number.isNaN(L)){const E=D.add(L,Y);E.isValid()&&(D=E)}return D.toDate()},"getEndDate"),mt=0,Z=o(function(t){return t===void 0?(mt=mt+1,"task"+mt):t},"parseId"),li=o(function(t,s){let r;s.substr(0,1)===":"?r=s.substr(1,s.length):r=s;const a=r.split(","),n={};Vt(a,n,Kt);for(let g=0;g<a.length;g++)a[g]=a[g].trim();let f="";switch(a.length){case 1:n.id=Z(),n.startTime=t.endTime,f=a[0];break;case 2:n.id=Z(),n.startTime=Ct(void 0,N,a[0]),f=a[1];break;case 3:n.id=Z(a[0]),n.startTime=Ct(void 0,N,a[1]),f=a[2];break}return f&&(n.endTime=$t(n.startTime,N,f,dt),n.manualEndTime=A(f,"YYYY-MM-DD",!0).isValid(),Qt(n,N,ut,lt)),n},"compileData"),ui=o(function(t,s){let r;s.substr(0,1)===":"?r=s.substr(1,s.length):r=s;const a=r.split(","),n={};Vt(a,n,Kt);for(let f=0;f<a.length;f++)a[f]=a[f].trim();switch(a.length){case 1:n.id=Z(),n.startTime={type:"prevTaskEnd",id:t},n.endTime={data:a[0]};break;case 2:n.id=Z(),n.startTime={type:"getStartDate",startData:a[0]},n.endTime={data:a[1]};break;case 3:n.id=Z(a[0]),n.startTime={type:"getStartDate",startData:a[1]},n.endTime={data:a[2]};break}return n},"parseData"),Dt,yt,I=[],te={},di=o(function(t,s){const r={section:$,type:$,processed:!1,manualEndTime:!1,renderEndTime:null,raw:{data:s},task:t,classes:[]},a=ui(yt,s);r.raw.startTime=a.startTime,r.raw.endTime=a.endTime,r.id=a.id,r.prevTaskId=yt,r.active=a.active,r.done=a.done,r.crit=a.crit,r.milestone=a.milestone,r.vert=a.vert,r.order=_t,_t++;const n=I.push(r);yt=r.id,te[r.id]=n-1},"addTask"),G=o(function(t){const s=te[t];return I[s]},"findTaskById"),fi=o(function(t,s){const r={section:$,type:$,description:t,task:t,classes:[]},a=li(Dt,s);r.startTime=a.startTime,r.endTime=a.endTime,r.id=a.id,r.active=a.active,r.done=a.done,r.crit=a.crit,r.milestone=a.milestone,r.vert=a.vert,Dt=r,gt.push(r)},"addTaskOrg"),Gt=o(function(){const t=o(function(r){const a=I[r];let n="";switch(I[r].raw.startTime.type){case"prevTaskEnd":{const f=G(a.prevTaskId);a.startTime=f.endTime;break}case"getStartDate":n=Ct(void 0,N,I[r].raw.startTime.startData),n&&(I[r].startTime=n);break}return I[r].startTime&&(I[r].endTime=$t(I[r].startTime,N,I[r].raw.endTime.data,dt),I[r].endTime&&(I[r].processed=!0,I[r].manualEndTime=A(I[r].raw.endTime.data,"YYYY-MM-DD",!0).isValid(),Qt(I[r],N,ut,lt))),I[r].processed},"compileTask");let s=!0;for(const[r,a]of I.entries())t(r),s=s&&a.processed;return s},"compileTasks"),hi=o(function(t,s){let r=s;Q().securityLevel!=="loose"&&(r=Ie.sanitizeUrl(s)),t.split(",").forEach(function(a){G(a)!==void 0&&(ie(a,()=>{window.open(r,"_self")}),At.set(a,r))}),ee(t,"clickable")},"setLink"),ee=o(function(t,s){t.split(",").forEach(function(r){let a=G(r);a!==void 0&&a.classes.push(s)})},"setClass"),ki=o(function(t,s,r){if(Q().securityLevel!=="loose"||s===void 0)return;let a=[];if(typeof r=="string"){a=r.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);for(let f=0;f<a.length;f++){let g=a[f].trim();g.startsWith('"')&&g.endsWith('"')&&(g=g.substr(1,g.length-2)),a[f]=g}}a.length===0&&a.push(t),G(t)!==void 0&&ie(t,()=>{ke.runFunc(s,...a)})},"setClickFun"),ie=o(function(t,s){Mt.push(function(){const r=J?`${J}-${t}`:t,a=document.querySelector(`[id="${r}"]`);a!==null&&a.addEventListener("click",function(){s()})},function(){const r=J?`${J}-${t}`:t,a=document.querySelector(`[id="${r}-text"]`);a!==null&&a.addEventListener("click",function(){s()})})},"pushFun"),mi=o(function(t,s,r){t.split(",").forEach(function(a){ki(a,s,r)}),ee(t,"clickable")},"setClickEvent"),yi=o(function(t){Mt.forEach(function(s){s(t)})},"bindFunctions"),gi={getConfig:o(()=>Q().gantt,"getConfig"),clear:Re,setDateFormat:qe,getDateFormat:Je,enableInclusiveEndDates:Xe,endDatesAreInclusive:Ue,enableTopAxis:je,topAxisEnabled:Ge,setAxisFormat:We,getAxisFormat:Pe,setTickInterval:Ne,getTickInterval:Ye,setTodayMarker:Be,getTodayMarker:ze,setAccTitle:ue,getAccTitle:le,setDiagramTitle:ce,getDiagramTitle:oe,setDiagramId:Ve,setDisplayMode:He,getDisplayMode:Ke,setAccDescription:ne,getAccDescription:re,addSection:ii,getSections:si,getTasks:ai,addTask:di,findTaskById:G,addTaskOrg:fi,setIncludes:Qe,getIncludes:Ze,setExcludes:$e,getExcludes:ti,setClickEvent:mi,setLink:hi,getLinks:ei,bindFunctions:yi,parseDuration:Zt,isInvalidDate:Jt,setWeekday:ri,getWeekday:ni,setWeekend:oi};function Vt(t,s,r){let a=!0;for(;a;)a=!1,r.forEach(function(n){const f="^\\s*"+n+"\\s*$",g=new RegExp(f);t[0].match(g)&&(s[n]=!0,t.shift(1),a=!0)})}o(Vt,"getTaskTags");A.extend(Me);var pi=o(function(){j.debug("Something is calling, setConf, remove the call")},"setConf"),Ht={monday:Ee,tuesday:De,wednesday:Ce,thursday:_e,friday:we,saturday:be,sunday:xe},vi=o((t,s)=>{let r=[...t].map(()=>-1/0),a=[...t].sort((f,g)=>f.startTime-g.startTime||f.order-g.order),n=0;for(const f of a)for(let g=0;g<r.length;g++)if(f.startTime>=r[g]){r[g]=f.endTime,f.order=g+s,g>n&&(n=g);break}return n},"getMaxIntersections"),X,bt=1e4,Ti=o(function(t,s,r,a){const n=Q().gantt;a.db.setDiagramId(s);const f=Q().securityLevel;let g;f==="sandbox"&&(g=kt("#i"+s));const D=f==="sandbox"?kt(g.nodes()[0].contentDocument.body):kt("body"),L=f==="sandbox"?g.nodes()[0].contentDocument:document,Y=L.getElementById(s);X=Y.parentElement.offsetWidth,X===void 0&&(X=1200),n.useWidth!==void 0&&(X=n.useWidth);const E=a.db.getTasks();let M=[];for(const m of E)M.push(m.type);M=ot(M);const B={};let V=2*n.topPadding;if(a.db.getDisplayMode()==="compact"||n.displayMode==="compact"){const m={};for(const x of E)m[x.section]===void 0?m[x.section]=[x]:m[x.section].push(x);let T=0;for(const x of Object.keys(m)){const p=vi(m[x],T)+1;T+=p,V+=p*(n.barHeight+n.barGap),B[x]=p}}else{V+=E.length*(n.barHeight+n.barGap);for(const m of M)B[m]=E.filter(T=>T.type===m).length}Y.setAttribute("viewBox","0 0 "+X+" "+V);const W=D.select(`[id="${s}"]`),_=me().domain([ye(E,function(m){return m.startTime}),ge(E,function(m){return m.endTime})]).rangeRound([0,X-n.leftPadding-n.rightPadding]);function tt(m,T){const x=m.startTime,p=T.startTime;let k=0;return x>p?k=1:x<p&&(k=-1),k}o(tt,"taskCompare"),E.sort(tt),et(E,X,V),de(W,V,X,n.useMaxWidth),W.append("text").text(a.db.getDiagramTitle()).attr("x",X/2).attr("y",n.titleTopMargin).attr("class","titleText");function et(m,T,x){const p=n.barHeight,k=p+n.barGap,c=n.topPadding,l=n.leftPadding,d=pe().domain([0,M.length]).range(["#00B9FA","#F95002"]).interpolate(ve);st(k,c,l,T,x,m,a.db.getExcludes(),a.db.getIncludes()),at(l,c,T,x),it(m,k,c,l,p,d,T),rt(k,c),nt(l,c,T,x)}o(et,"makeGantt");function it(m,T,x,p,k,c,l){m.sort((e,h)=>e.vert===h.vert?0:e.vert?1:-1);const u=[...new Set(m.map(e=>e.order))].map(e=>m.find(h=>h.order===e));W.append("g").selectAll("rect").data(u).enter().append("rect").attr("x",0).attr("y",function(e,h){return h=e.order,h*T+x-2}).attr("width",function(){return l-n.rightPadding/2}).attr("height",T).attr("class",function(e){for(const[h,C]of M.entries())if(e.type===C)return"section section"+h%n.numberSectionStyles;return"section section0"}).enter();const y=W.append("g").selectAll("rect").data(m).enter(),i=a.db.getLinks();if(y.append("rect").attr("id",function(e){return s+"-"+e.id}).attr("rx",3).attr("ry",3).attr("x",function(e){return e.milestone?_(e.startTime)+p+.5*(_(e.endTime)-_(e.startTime))-.5*k:_(e.startTime)+p}).attr("y",function(e,h){return h=e.order,e.vert?n.gridLineStartPadding:h*T+x}).attr("width",function(e){return e.milestone?k:e.vert?.08*k:_(e.renderEndTime||e.endTime)-_(e.startTime)}).attr("height",function(e){return e.vert?E.length*(n.barHeight+n.barGap)+n.barHeight*2:k}).attr("transform-origin",function(e,h){return h=e.order,(_(e.startTime)+p+.5*(_(e.endTime)-_(e.startTime))).toString()+"px "+(h*T+x+.5*k).toString()+"px"}).attr("class",function(e){const h="task";let C="";e.classes.length>0&&(C=e.classes.join(" "));let w=0;for(const[F,v]of M.entries())e.type===v&&(w=F%n.numberSectionStyles);let b="";return e.active?e.crit?b+=" activeCrit":b=" active":e.done?e.crit?b=" doneCrit":b=" done":e.crit&&(b+=" crit"),b.length===0&&(b=" task"),e.milestone&&(b=" milestone "+b),e.vert&&(b=" vert "+b),b+=w,b+=" "+C,h+b}),y.append("text").attr("id",function(e){return s+"-"+e.id+"-text"}).text(function(e){return e.task}).attr("font-size",n.fontSize).attr("x",function(e){let h=_(e.startTime),C=_(e.renderEndTime||e.endTime);if(e.milestone&&(h+=.5*(_(e.endTime)-_(e.startTime))-.5*k,C=h+k),e.vert)return _(e.startTime)+p;const w=this.getBBox().width;return w>C-h?C+w+1.5*n.leftPadding>l?h+p-5:C+p+5:(C-h)/2+h+p}).attr("y",function(e,h){return e.vert?n.gridLineStartPadding+E.length*(n.barHeight+n.barGap)+60:(h=e.order,h*T+n.barHeight/2+(n.fontSize/2-2)+x)}).attr("text-height",k).attr("class",function(e){const h=_(e.startTime);let C=_(e.endTime);e.milestone&&(C=h+k);const w=this.getBBox().width;let b="";e.classes.length>0&&(b=e.classes.join(" "));let F=0;for(const[z,ct]of M.entries())e.type===ct&&(F=z%n.numberSectionStyles);let v="";return e.active&&(e.crit?v="activeCritText"+F:v="activeText"+F),e.done?e.crit?v=v+" doneCritText"+F:v=v+" doneText"+F:e.crit&&(v=v+" critText"+F),e.milestone&&(v+=" milestoneText"),e.vert&&(v+=" vertText"),w>C-h?C+w+1.5*n.leftPadding>l?b+" taskTextOutsideLeft taskTextOutside"+F+" "+v:b+" taskTextOutsideRight taskTextOutside"+F+" "+v+" width-"+w:b+" taskText taskText"+F+" "+v+" width-"+w}),Q().securityLevel==="sandbox"){let e;e=kt("#i"+s);const h=e.nodes()[0].contentDocument;y.filter(function(C){return i.has(C.id)}).each(function(C){var w=h.querySelector("#"+CSS.escape(s+"-"+C.id)),b=h.querySelector("#"+CSS.escape(s+"-"+C.id+"-text"));const F=w.parentNode;var v=h.createElement("a");v.setAttribute("xlink:href",i.get(C.id)),v.setAttribute("target","_top"),F.appendChild(v),v.appendChild(w),v.appendChild(b)})}}o(it,"drawRects");function st(m,T,x,p,k,c,l,d){if(l.length===0&&d.length===0)return;let u,y;for(const{startTime:w,endTime:b}of c)(u===void 0||w<u)&&(u=w),(y===void 0||b>y)&&(y=b);if(!u||!y)return;if(A(y).diff(A(u),"year")>5){j.warn("The difference between the min and max time is more than 5 years. This will cause performance issues. Skipping drawing exclude days.");return}const i=a.db.getDateFormat(),S=[];let e=null,h=A(u);for(;h.valueOf()<=y;)a.db.isInvalidDate(h,i,l,d)?e?e.end=h:e={start:h,end:h}:e&&(S.push(e),e=null),h=h.add(1,"d");W.append("g").selectAll("rect").data(S).enter().append("rect").attr("id",w=>s+"-exclude-"+w.start.format("YYYY-MM-DD")).attr("x",w=>_(w.start.startOf("day"))+x).attr("y",n.gridLineStartPadding).attr("width",w=>_(w.end.endOf("day"))-_(w.start.startOf("day"))).attr("height",k-T-n.gridLineStartPadding).attr("transform-origin",function(w,b){return(_(w.start)+x+.5*(_(w.end)-_(w.start))).toString()+"px "+(b*m+.5*k).toString()+"px"}).attr("class","exclude-range")}o(st,"drawExcludeDays");function H(m,T,x,p){if(x<=0||m>T)return 1/0;const k=T-m,c=A.duration({[p??"day"]:x}).asMilliseconds();return c<=0?1/0:Math.ceil(k/c)}o(H,"getEstimatedTickCount");function at(m,T,x,p){const k=a.db.getDateFormat(),c=a.db.getAxisFormat();let l;c?l=c:k==="D"?l="%d":l=n.axisFormat??"%Y-%m-%d";let d=Te(_).tickSize(-p+T+n.gridLineStartPadding).tickFormat(Nt(l));const y=/^([1-9]\d*)(millisecond|second|minute|hour|day|week|month)$/.exec(a.db.getTickInterval()||n.tickInterval);if(y!==null){const i=parseInt(y[1],10);if(isNaN(i)||i<=0)j.warn(`Invalid tick interval value: "${y[1]}". Skipping custom tick interval.`);else{const S=y[2],e=a.db.getWeekday()||n.weekday,h=_.domain(),C=h[0],w=h[1],b=H(C,w,i,S);if(b>bt)j.warn(`The tick interval "${i}${S}" would generate ${b} ticks, which exceeds the maximum allowed (${bt}). This may indicate an invalid date or time range. Skipping custom tick interval.`);else switch(S){case"millisecond":d.ticks(Ut.every(i));break;case"second":d.ticks(Xt.every(i));break;case"minute":d.ticks(qt.every(i));break;case"hour":d.ticks(zt.every(i));break;case"day":d.ticks(Bt.every(i));break;case"week":d.ticks(Ht[e].every(i));break;case"month":d.ticks(Yt.every(i));break}}}if(W.append("g").attr("class","grid").attr("transform","translate("+m+", "+(p-50)+")").call(d).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10).attr("dy","1em"),a.db.topAxisEnabled()||n.topAxis){let i=Se(_).tickSize(-p+T+n.gridLineStartPadding).tickFormat(Nt(l));if(y!==null){const S=parseInt(y[1],10);if(isNaN(S)||S<=0)j.warn(`Invalid tick interval value: "${y[1]}". Skipping custom tick interval.`);else{const e=y[2],h=a.db.getWeekday()||n.weekday,C=_.domain(),w=C[0],b=C[1];if(H(w,b,S,e)<=bt)switch(e){case"millisecond":i.ticks(Ut.every(S));break;case"second":i.ticks(Xt.every(S));break;case"minute":i.ticks(qt.every(S));break;case"hour":i.ticks(zt.every(S));break;case"day":i.ticks(Bt.every(S));break;case"week":i.ticks(Ht[h].every(S));break;case"month":i.ticks(Yt.every(S));break}}}W.append("g").attr("class","grid").attr("transform","translate("+m+", "+T+")").call(i).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10)}}o(at,"makeGrid");function rt(m,T){let x=0;const p=Object.keys(B).map(k=>[k,B[k]]);W.append("g").selectAll("text").data(p).enter().append(function(k){const c=k[0].split(fe.lineBreakRegex),l=-(c.length-1)/2,d=L.createElementNS("http://www.w3.org/2000/svg","text");d.setAttribute("dy",l+"em");for(const[u,y]of c.entries()){const i=L.createElementNS("http://www.w3.org/2000/svg","tspan");i.setAttribute("alignment-baseline","central"),i.setAttribute("x","10"),u>0&&i.setAttribute("dy","1em"),i.textContent=y,d.appendChild(i)}return d}).attr("x",10).attr("y",function(k,c){if(c>0)for(let l=0;l<c;l++)return x+=p[c-1][1],k[1]*m/2+x*m+T;else return k[1]*m/2+T}).attr("font-size",n.sectionFontSize).attr("class",function(k){for(const[c,l]of M.entries())if(k[0]===l)return"sectionTitle sectionTitle"+c%n.numberSectionStyles;return"sectionTitle"})}o(rt,"vertLabels");function nt(m,T,x,p){const k=a.db.getTodayMarker();if(k==="off")return;const c=W.append("g").attr("class","today"),l=new Date,d=c.append("line");d.attr("x1",_(l)+m).attr("x2",_(l)+m).attr("y1",n.titleTopMargin).attr("y2",p-n.titleTopMargin).attr("class","today"),k!==""&&d.attr("style",k.replace(/,/g,";"))}o(nt,"drawToday");function ot(m){const T={},x=[];for(let p=0,k=m.length;p<k;++p)Object.prototype.hasOwnProperty.call(T,m[p])||(T[m[p]]=!0,x.push(m[p]));return x}o(ot,"checkUnique")},"draw"),xi={setConf:pi,draw:Ti},bi=o(t=>`
  .mermaid-main-font {
        font-family: ${t.fontFamily};
  }

  .exclude-range {
    fill: ${t.excludeBkgColor};
  }

  .section {
    stroke: none;
    opacity: 0.2;
  }

  .section0 {
    fill: ${t.sectionBkgColor};
  }

  .section2 {
    fill: ${t.sectionBkgColor2};
  }

  .section1,
  .section3 {
    fill: ${t.altSectionBkgColor};
    opacity: 0.2;
  }

  .sectionTitle0 {
    fill: ${t.titleColor};
  }

  .sectionTitle1 {
    fill: ${t.titleColor};
  }

  .sectionTitle2 {
    fill: ${t.titleColor};
  }

  .sectionTitle3 {
    fill: ${t.titleColor};
  }

  .sectionTitle {
    text-anchor: start;
    font-family: ${t.fontFamily};
  }


  /* Grid and axis */

  .grid .tick {
    stroke: ${t.gridColor};
    opacity: 0.8;
    shape-rendering: crispEdges;
  }

  .grid .tick text {
    font-family: ${t.fontFamily};
    fill: ${t.textColor};
  }

  .grid path {
    stroke-width: 0;
  }


  /* Today line */

  .today {
    fill: none;
    stroke: ${t.todayLineColor};
    stroke-width: 2px;
  }


  /* Task styling */

  /* Default task */

  .task {
    stroke-width: 2;
  }

  .taskText {
    text-anchor: middle;
    font-family: ${t.fontFamily};
  }

  .taskTextOutsideRight {
    fill: ${t.taskTextDarkColor};
    text-anchor: start;
    font-family: ${t.fontFamily};
  }

  .taskTextOutsideLeft {
    fill: ${t.taskTextDarkColor};
    text-anchor: end;
  }


  /* Special case clickable */

  .task.clickable {
    cursor: pointer;
  }

  .taskText.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideLeft.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideRight.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }


  /* Specific task settings for the sections*/

  .taskText0,
  .taskText1,
  .taskText2,
  .taskText3 {
    fill: ${t.taskTextColor};
  }

  .task0,
  .task1,
  .task2,
  .task3 {
    fill: ${t.taskBkgColor};
    stroke: ${t.taskBorderColor};
  }

  .taskTextOutside0,
  .taskTextOutside2
  {
    fill: ${t.taskTextOutsideColor};
  }

  .taskTextOutside1,
  .taskTextOutside3 {
    fill: ${t.taskTextOutsideColor};
  }


  /* Active task */

  .active0,
  .active1,
  .active2,
  .active3 {
    fill: ${t.activeTaskBkgColor};
    stroke: ${t.activeTaskBorderColor};
  }

  .activeText0,
  .activeText1,
  .activeText2,
  .activeText3 {
    fill: ${t.taskTextDarkColor} !important;
  }


  /* Completed task */

  .done0,
  .done1,
  .done2,
  .done3 {
    stroke: ${t.doneTaskBorderColor};
    fill: ${t.doneTaskBkgColor};
    stroke-width: 2;
  }

  .doneText0,
  .doneText1,
  .doneText2,
  .doneText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  /* Done task text displayed outside the bar sits against the diagram background,
     not against the done-task bar, so it must use the outside/contrast color. */
  .doneText0.taskTextOutsideLeft,
  .doneText0.taskTextOutsideRight,
  .doneText1.taskTextOutsideLeft,
  .doneText1.taskTextOutsideRight,
  .doneText2.taskTextOutsideLeft,
  .doneText2.taskTextOutsideRight,
  .doneText3.taskTextOutsideLeft,
  .doneText3.taskTextOutsideRight {
    fill: ${t.taskTextOutsideColor} !important;
  }


  /* Tasks on the critical line */

  .crit0,
  .crit1,
  .crit2,
  .crit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.critBkgColor};
    stroke-width: 2;
  }

  .activeCrit0,
  .activeCrit1,
  .activeCrit2,
  .activeCrit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.activeTaskBkgColor};
    stroke-width: 2;
  }

  .doneCrit0,
  .doneCrit1,
  .doneCrit2,
  .doneCrit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.doneTaskBkgColor};
    stroke-width: 2;
    cursor: pointer;
    shape-rendering: crispEdges;
  }

  .milestone {
    transform: rotate(45deg) scale(0.8,0.8);
  }

  .milestoneText {
    font-style: italic;
  }
  .doneCritText0,
  .doneCritText1,
  .doneCritText2,
  .doneCritText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  /* Done-crit task text outside the bar — same reasoning as doneText above. */
  .doneCritText0.taskTextOutsideLeft,
  .doneCritText0.taskTextOutsideRight,
  .doneCritText1.taskTextOutsideLeft,
  .doneCritText1.taskTextOutsideRight,
  .doneCritText2.taskTextOutsideLeft,
  .doneCritText2.taskTextOutsideRight,
  .doneCritText3.taskTextOutsideLeft,
  .doneCritText3.taskTextOutsideRight {
    fill: ${t.taskTextOutsideColor} !important;
  }

  .vert {
    stroke: ${t.vertLineColor};
  }

  .vertText {
    font-size: 15px;
    text-anchor: middle;
    fill: ${t.vertLineColor} !important;
  }

  .activeCritText0,
  .activeCritText1,
  .activeCritText2,
  .activeCritText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  .titleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${t.titleColor||t.textColor};
    font-family: ${t.fontFamily};
  }
`,"getStyles"),wi=bi,Pi={parser:Oe,db:gi,renderer:xi,styles:wi};export{Pi as diagram};
