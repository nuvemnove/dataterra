const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {performance}=require('node:perf_hooks');
const {chromium}=require('/Users/klayvemguimaraeslealdasilva/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../../../..'),out=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.json':'application/json','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');let file=url.pathname.startsWith('/assets/')?path.join(root,url.pathname):path.join(__dirname,url.pathname==='/'?'demo.html':url.pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!mime[path.extname(file)]){res.writeHead(404).end();return}res.setHeader('Content-Type',mime[path.extname(file)]);fs.createReadStream(file).pipe(res)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let browser;
(async()=>{
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const recording=process.argv.includes('--record');
browser=await chromium.launch({headless:true,executablePath:'/Users/klayvemguimaraeslealdasilva/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell'});
const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,colorScheme:'dark',...(recording?{recordVideo:{dir:path.join(out,'captures'),size:{width:1920,height:1080}}}:{})});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>window.demoReady===true);
const layout=await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,visibleFields:[...document.querySelectorAll('.field')].length,formBounds:document.querySelector('#project-form').getBoundingClientRect().toJSON()}));
await page.screenshot({path:path.join(out,'captures','01-initial-form.png')});
if(!recording){await page.evaluate(()=>fillDemo());await page.screenshot({path:path.join(out,'captures','02-filled-form.png')});await page.locator('#generate').click();await page.waitForFunction(()=>window.resultsReady);await page.screenshot({path:path.join(out,'captures','03-municipalities.png')});const state=await page.evaluate(()=>getDemoState());fs.writeFileSync(path.join(out,'captures','review.json'),JSON.stringify({errors,layout,state},null,2));console.log(JSON.stringify({mode:'review',errors,layout,names:state.municipalities.map(x=>x.name)}));await context.close();await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));return}
let pointer={x:1200,y:280};await page.evaluate(p=>pointerAt(p.x,p.y),pointer);await page.mouse.move(pointer.x,pointer.y);
async function point(selector){const box=await page.locator(selector).boundingBox();if(!box)throw new Error('Missing '+selector);return{x:box.x+box.width*.58,y:box.y+box.height*.53}}
async function move(target,ms=140){const from={...pointer},start=performance.now();while(true){const p=Math.min(1,(performance.now()-start)/ms),t=p*p*(3-2*p);pointer={x:from.x+(target.x-from.x)*t,y:from.y+(target.y-from.y)*t-Math.sin(p*Math.PI)*16};await page.evaluate(p=>pointerAt(p.x,p.y),pointer);await page.mouse.move(pointer.x,pointer.y);if(p===1)break;await sleep(16)}}
async function click(){await page.evaluate(()=>pulse());await page.mouse.click(pointer.x,pointer.y)}
async function select(id,value){await move(await point('#'+id),140);await click();await move(await point(`#field-${id} button[data-value="${value}"]`),110);await click()}
async function type(id,value){await move(await point('#'+id),140);await click();await page.locator('#'+id).pressSequentially(value,{delay:40})}
await page.evaluate(()=>cue(true));const start=performance.now();const until=async t=>{const wait=start+t*1000-performance.now();if(wait>0)await sleep(wait)};
await until(.2);await select('installation','Hyperscale AI campus');
await until(.78);await select('cooling','Direct liquid cooling (DLC)');
await until(1.38);await select('region','Southeast');
await until(1.98);await select('model','GPU compute server');
await until(2.58);await type('count','6400');
await until(3.15);await type('power','100');
await until(3.68);await type('water','320');
await until(4.22);await select('tier','Tier III · N+1');
await until(4.93);await move(await point('#generate'),220);await click();
await page.waitForFunction(()=>window.resultsReady,{timeout:5000});
const resultsAt=(performance.now()-start)/1000;
await until(6.2);await move(await point('.municipality:first-child'),420);
await until(7.3);await move({x:1260,y:1040},440);
await until(10.15);await page.evaluate(()=>cue(false));await sleep(200);
const state=await page.evaluate(()=>getDemoState());const video=page.video();await page.close();await context.close();await video.saveAs(path.join(out,'captures','raw-form-demo.webm'));
fs.writeFileSync(path.join(out,'captures','recording.json'),JSON.stringify({width:1920,height:1080,duration:10,language:'en',mode:'Interactive concept demo, with actual cursor clicks and keyboard input',resultsAt,errors,layout,state},null,2));
console.log(JSON.stringify({recorded:true,resultsAt,errors,values:state.values}));await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));
})().catch(async e=>{console.error(e);if(browser)await browser.close();server.closeAllConnections();server.close();process.exitCode=1});
