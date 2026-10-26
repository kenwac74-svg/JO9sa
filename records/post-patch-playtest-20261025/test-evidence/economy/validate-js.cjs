const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
for(const file of process.argv.slice(2)){
 const d=c.parse(fs.readFileSync(file));let count=0;
 for(const l of d.locations){
  const b=c.shift(d.lines[l.body],5);
  for(const line of b.split('\r\n').filter(x=>x.startsWith("*p '<script"))){
   const h=line.slice(4,-1).replaceAll("''","'"),js=h.replace(/^<script[^>]*>/,'').replace(/<\/script>$/,'');
   try{new Function(js);count++;}catch(e){console.log(file,l.name,e.message,js);process.exitCode=1;}
  }
 }
 console.log(file,count+' scripts syntactically checked');
}
