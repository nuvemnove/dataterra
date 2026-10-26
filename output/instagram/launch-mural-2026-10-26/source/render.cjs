const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('/Users/klayvemguimaraeslealdasilva/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require('/Users/klayvemguimaraeslealdasilva/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'../../../..');
const out=path.resolve(__dirname,'..');
const types={'.html':'text/html','.png':'image/png','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost');
  const file=u.pathname.startsWith('/assets/')?path.join(root,u.pathname):path.join(__dirname,u.pathname==='/'?'composition.html':u.pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!types[path.extname(file)]){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',types[path.extname(file)]);fs.createReadStream(file).pipe(res);
});
let browser;
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  browser=await chromium.launch({headless:true,executablePath:'/Users/klayvemguimaraeslealdasilva/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell'});
  const page=await browser.newPage({viewport:{width:3240,height:1440},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  const bounds=await page.evaluate(()=>[...document.querySelectorAll('.headline,.hero-word,.hero-subtitle,.description,.pillars,.footer')].map(el=>({text:el.textContent,box:el.getBoundingClientRect().toJSON(),scrollWidth:el.scrollWidth,clientWidth:el.clientWidth})));
  const mural=path.join(out,'mural-completo-3240x1440.png');
  await page.screenshot({path:mural});
  const posts=[{x:2160,file:'01-publicar-primeiro-direita'},{x:1080,file:'02-publicar-segundo-centro'},{x:0,file:'03-publicar-terceiro-esquerda'}];
  for(const post of posts){
    const buffer=await sharp(mural).extract({left:post.x,top:0,width:1080,height:1440}).png().toBuffer();
    await sharp(buffer).png().toFile(path.join(out,post.file+'.png'));
    await sharp(buffer).jpeg({quality:97,chromaSubsampling:'4:4:4'}).toFile(path.join(out,post.file+'.jpg'));
  }
  const thumbs=await Promise.all([2,1,0].map(i=>sharp(path.join(out,posts[i].file+'.png')).resize(540,720).toBuffer()));
  await sharp({create:{width:1632,height:720,channels:3,background:'#f4f5ef'}}).composite(thumbs.map((input,i)=>({input,left:i*546,top:0}))).png().toFile(path.join(out,'previa-mural-no-perfil.png'));
  const rebuilt=await sharp({create:{width:3240,height:1440,channels:3,background:'#101b17'}}).composite(posts.map(p=>({input:path.join(out,p.file+'.png'),left:p.x,top:0}))).removeAlpha().raw().toBuffer();
  const source=await sharp(mural).removeAlpha().raw().toBuffer();
  const validation={width:3240,height:1440,postWidth:1080,postHeight:1440,aspectRatio:'3:4',posts:posts.map(p=>p.file),seamlessSplit:source.equals(rebuilt),errors,bounds};
  fs.writeFileSync(path.join(out,'source','validation.json'),JSON.stringify(validation,null,2));
  console.log(JSON.stringify({errors,seamlessSplit:validation.seamlessSplit,files:posts.map(p=>p.file),overflow:bounds.filter(b=>b.scrollWidth>b.clientWidth+1)}));
  await browser.close();server.closeAllConnections();server.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();server.closeAllConnections();server.close();process.exitCode=1;});
