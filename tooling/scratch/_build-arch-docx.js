const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, TabStopType, TabStopPosition,
  HeadingLevel, BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak
} = require("docx");

const INK="0B1020", INDIGO="4F46E5", INDIGO_DK="312E81", CYAN="0E7490", SLATE="475569",
  LINE="C7CCD9", HEAD_FILL="EEF0FB", SOFT="F5F6FB", CODEBG="0E1326", GOLD="B7791F";
const CONTENT_W=9360;

function runs(text, base={}) {
  const out=[]; const re=/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g; let last=0,m;
  while((m=re.exec(text))!==null){
    if(m.index>last) out.push(new TextRun({text:text.slice(last,m.index),...base}));
    const t=m[0];
    if(t.startsWith("**")) out.push(new TextRun({text:t.slice(2,-2),bold:true,...base}));
    else if(t.startsWith("`")) out.push(new TextRun({text:t.slice(1,-1),font:"Consolas",color:CYAN,...base}));
    else out.push(new TextRun({text:t.slice(1,-1),italics:true,...base}));
    last=m.index+t.length;
  }
  if(last<text.length) out.push(new TextRun({text:text.slice(last),...base}));
  if(!out.length) out.push(new TextRun({text:"",...base}));
  return out;
}
const para=(t,o={})=>new Paragraph({spacing:{after:130,line:276},children:runs(t,{size:21,color:INK}),...o});
const h1=(t)=>new Paragraph({heading:HeadingLevel.HEADING_1,children:runs(t,{size:28,bold:true,color:INDIGO_DK})});
const h2=(t)=>new Paragraph({heading:HeadingLevel.HEADING_2,children:runs(t,{size:23,bold:true,color:INDIGO})});
const h3=(t)=>new Paragraph({heading:HeadingLevel.HEADING_3,children:runs(t,{size:21,bold:true,color:INK})});
const bull=(t)=>new Paragraph({numbering:{reference:"b",level:0},spacing:{after:60,line:268},children:runs(t,{size:21,color:INK})});
const nlist=(t)=>new Paragraph({numbering:{reference:"n",level:0},spacing:{after:60,line:268},children:runs(t,{size:21,color:INK})});
const quote=(t)=>new Paragraph({spacing:{before:70,after:150,line:288},indent:{left:360},border:{left:{style:BorderStyle.SINGLE,size:18,color:INDIGO,space:14}},shading:{type:ShadingType.CLEAR,fill:SOFT},children:runs(t,{size:22,color:INDIGO_DK})});
const rule=()=>new Paragraph({spacing:{before:50,after:110},border:{bottom:{style:BorderStyle.SINGLE,size:6,color:LINE,space:1}},children:[new TextRun("")]});
const codeLine=(t,first,last)=>new Paragraph({spacing:{after:0,line:248,before:first?40:0},shading:{type:ShadingType.CLEAR,fill:CODEBG},indent:{left:160,right:160},children:[new TextRun({text:t||" ",font:"Consolas",size:17,color:"C8D2F0"})]});

function table(rows){
  const widths=colWidths(rows[0].length);
  const mk=(txt,{head,fill,bold,w})=>new TableCell({
    width:{size:w,type:WidthType.DXA},
    borders:{top:{style:BorderStyle.SINGLE,size:1,color:LINE},bottom:{style:BorderStyle.SINGLE,size:1,color:LINE},left:{style:BorderStyle.SINGLE,size:1,color:LINE},right:{style:BorderStyle.SINGLE,size:1,color:LINE}},
    shading:fill?{type:ShadingType.CLEAR,fill}:undefined,
    margins:{top:64,bottom:64,left:120,right:120},verticalAlign:VerticalAlign.CENTER,
    children:[new Paragraph({spacing:{after:0,line:258},children:runs(txt,{size:18,bold:head||bold,color:head?INDIGO_DK:INK})})],
  });
  const trs=rows.map((r,ri)=>new TableRow({tableHeader:ri===0,children:r.map((c,ci)=>mk(c,{head:ri===0,fill:ri===0?HEAD_FILL:(ri%2?SOFT:null),bold:ci===0&&ri>0,w:widths[ci]}))}));
  return new Table({width:{size:CONTENT_W,type:WidthType.DXA},columnWidths:widths,rows:trs});
}
function colWidths(n){
  if(n===2) return [2900,6460];
  if(n===3) return [2200,2200,4960];
  if(n===4) return [900,2600,3360,2500];
  if(n===5) return [1700,1700,1700,1700,2560];
  const w=Math.floor(CONTENT_W/n); return Array(n).fill(w);
}
const splitRow=(line)=>line.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(s=>s.trim());

// ---- parse markdown ----
const md=fs.readFileSync(process.argv[2],"utf8").split("\n");
const body=[]; const sections=[];
let i=0;
while(i<md.length){
  let line=md[i];
  // code fence
  if(line.trim().startsWith("```")){
    const buf=[]; i++;
    while(i<md.length && !md[i].trim().startsWith("```")){buf.push(md[i]); i++;}
    i++; // skip closing
    buf.forEach((bl,idx)=>body.push(codeLine(bl,idx===0,idx===buf.length-1)));
    body.push(new Paragraph({spacing:{after:120},children:[new TextRun("")]}));
    continue;
  }
  // table
  if(line.trim().startsWith("|") && i+1<md.length && /^\s*\|?[\s:|-]+\|/.test(md[i+1]) && md[i+1].includes("-")){
    const rows=[splitRow(line)]; i+=2; // skip separator
    while(i<md.length && md[i].trim().startsWith("|")){rows.push(splitRow(md[i])); i++;}
    body.push(table(rows));
    body.push(new Paragraph({spacing:{after:80},children:[new TextRun("")]}));
    continue;
  }
  if(/^#\s+/.test(line)){ /* title - skip, handled by cover */ i++; continue; }
  if(/^##\s+/.test(line)){ const t=line.replace(/^##\s+/,""); sections.push(t); body.push(h1(t)); i++; continue; }
  if(/^###\s+/.test(line)){ const t=line.replace(/^###\s+/,""); if(body.length===0){i++;continue;} body.push(h2(t)); i++; continue; }
  if(/^####\s+/.test(line)){ body.push(h3(line.replace(/^####\s+/,""))); i++; continue; }
  if(/^>\s?/.test(line)){ body.push(quote(line.replace(/^>\s?/,""))); i++; continue; }
  if(/^[-*]\s+/.test(line)){ body.push(bull(line.replace(/^[-*]\s+/,""))); i++; continue; }
  if(/^\d+\.\s+/.test(line)){ body.push(nlist(line.replace(/^\d+\.\s+/,""))); i++; continue; }
  if(/^---+\s*$/.test(line)){ body.push(rule()); i++; continue; }
  if(line.trim()===""){ i++; continue; }
  // bold/meta lines and normal paragraphs
  body.push(para(line.trim())); i++;
}

// ---- cover ----
const cover=[
  new Paragraph({spacing:{before:1200,after:0},children:[new TextRun({text:"FOUNDER",bold:true,size:80,color:INK}),new TextRun({text:"OS",bold:true,size:80,color:INDIGO})]}),
  new Paragraph({spacing:{after:200},children:[new TextRun({text:"Master System Architecture",size:30,color:SLATE})]}),
  new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:14,color:INDIGO,space:6}},spacing:{after:260},children:[new TextRun("")]}),
  new Paragraph({spacing:{after:60},children:[new TextRun({text:"THE PERMANENT ARCHITECTURE BLUEPRINT",bold:true,size:34,color:INDIGO_DK})]}),
  new Paragraph({spacing:{after:300},children:[new TextRun({text:"Step 2 of the FounderOS Operating Document — the source of truth for all engineering",size:22,color:SLATE,italics:true})]}),
  new Paragraph({spacing:{after:40},children:[new TextRun({text:"Working title: AI Company OS",size:20,color:SLATE})]}),
  new Paragraph({spacing:{after:40},children:[new TextRun({text:"Version 1.0 · Confidential · June 27, 2026",size:20,color:SLATE})]}),
  new Paragraph({spacing:{before:400},children:[new TextRun({text:"Committed: hybrid Mongo + Postgres   ·   hybrid Next.js + worker runtime   ·   event-sourced core   ·   model-sovereign router",size:17,color:GOLD})]}),
  new Paragraph({spacing:{before:120},children:[new TextRun({text:"Companion: FounderOS-Product-Bible · FounderOS-Architecture-Map.html",size:17,color:SLATE})]}),
  new Paragraph({children:[new PageBreak()]}),
];
// ---- TOC ----
const toc=[h1("Contents")];
sections.forEach(s=>toc.push(new Paragraph({spacing:{after:54},tabStops:[{type:TabStopType.RIGHT,position:TabStopPosition.MAX,leader:"dot"}],children:runs(s.replace(/\s*—.*$/,""),{size:19,color:INDIGO_DK,bold:true})})));
toc.push(new Paragraph({children:[new PageBreak()]}));

const doc=new Document({
  creator:"FounderOS",title:"FounderOS — Master System Architecture",
  styles:{ default:{document:{run:{font:"Calibri",size:21,color:INK}}},
    paragraphStyles:[
      {id:"Heading1",name:"Heading 1",basedOn:"Normal",next:"Normal",quickFormat:true,run:{size:28,bold:true,font:"Calibri",color:INDIGO_DK},paragraph:{spacing:{before:260,after:140},outlineLevel:0,border:{bottom:{style:BorderStyle.SINGLE,size:8,color:INDIGO,space:4}}}},
      {id:"Heading2",name:"Heading 2",basedOn:"Normal",next:"Normal",quickFormat:true,run:{size:23,bold:true,font:"Calibri",color:INDIGO},paragraph:{spacing:{before:180,after:100},outlineLevel:1}},
      {id:"Heading3",name:"Heading 3",basedOn:"Normal",next:"Normal",quickFormat:true,run:{size:21,bold:true,font:"Calibri",color:INK},paragraph:{spacing:{before:130,after:64},outlineLevel:2}},
    ]},
  numbering:{config:[
    {reference:"b",levels:[{level:0,format:LevelFormat.BULLET,text:"•",alignment:AlignmentType.LEFT,style:{run:{color:INDIGO},paragraph:{indent:{left:560,hanging:260}}}}]},
    {reference:"n",levels:[{level:0,format:LevelFormat.DECIMAL,text:"%1.",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:560,hanging:300}}}}]},
  ]},
  sections:[{
    properties:{page:{size:{width:12240,height:15840},margin:{top:1440,right:1440,bottom:1440,left:1440}}},
    headers:{default:new Header({children:[new Paragraph({tabStops:[{type:TabStopType.RIGHT,position:9360}],border:{bottom:{style:BorderStyle.SINGLE,size:4,color:LINE,space:6}},children:[new TextRun({text:"FounderOS",bold:true,size:16,color:INDIGO}),new TextRun({text:"  ·  Master System Architecture",size:16,color:SLATE}),new TextRun({text:"\tCONFIDENTIAL · v1.0",size:15,color:SLATE})]})]})},
    footers:{default:new Footer({children:[new Paragraph({tabStops:[{type:TabStopType.RIGHT,position:9360}],children:[new TextRun({text:"Permanent architecture blueprint — amend deliberately",size:15,color:SLATE,italics:true}),new TextRun({text:"\t",size:15}),new TextRun({children:["Page ",PageNumber.CURRENT],size:16,color:SLATE})]})]})},
    children:[...cover,...toc,...body],
  }],
});
Packer.toBuffer(doc).then(buf=>{fs.writeFileSync(process.argv[3],buf);console.log("written",buf.length,"sections",sections.length);});
