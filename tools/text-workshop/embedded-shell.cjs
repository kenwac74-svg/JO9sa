'use strict';
const fs=require('node:fs'),path=require('node:path');
function page(html,kind){
 if(!/^[a-z]+$/.test(kind))throw Error('Invalid embedded tool kind');
 if(html.includes('JO9_EMBEDDED_TOOL_SHELL_20261115'))return html;
 const css=fs.readFileSync(path.join(__dirname,'workspace-shell.css'),'utf8');
 const boot=`(()=>{const r=document.documentElement,on=new URLSearchParams(location.search).get('workspace')==='1';r.classList.toggle('jo9-embedded',on);for(const c of [...r.classList])if(c.startsWith('jo9-tool-'))r.classList.remove(c);if(on)r.classList.add('jo9-tool-${kind}');})();`;
 const insert='<!-- JO9_EMBEDDED_TOOL_SHELL_20261115 --><style>'+css+'</style><script>'+boot+'</script>';
 if(/<\/head>/i.test(html))return html.replace(/<\/head>/i,insert+'</head>');
 const at=html.search(/<style\b|<body\b|<main\b|<header\b/i);
 return at<0?html+insert:html.slice(0,at)+insert+html.slice(at);
}
module.exports={page};
