const path = require('path');
const fs = require('fs');
const sharp = require('/Users/klayvemguimaraeslealdasilva/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const QRCode = require('/tmp/dataterra-qr/node_modules/qrcode');
const jsQR = require('/tmp/dataterra-qr/node_modules/jsqr');
const root = __dirname;
const batch = path.join(root, 'slides-27-29');
const assets = path.join(batch, 'assets');
const chile = path.join(root, 'territorial-planning-chile');
const generated = '/Users/klayvemguimaraeslealdasilva/.codex/generated_images/01a16b42-ba30-77f0-ba2e-50943b4613a9';
async function rounded(input, width, height, radius) {
  const mask = Buffer.from(`<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" fill="white"/></svg>`);
  return sharp(input).resize(width, height, {fit:'cover'}).composite([{input:mask,blend:'dest-in'}]).png().toBuffer();
}
async function main() {
  // Preserve source photograph pixels after the creative image_gen edit.
  const chilePhoto = await sharp(path.join(chile,'quilicura-google-europapress.jpg')).resize(735,941,{fit:'cover',position:'centre'}).toBuffer();
  const chileBase = await sharp(path.join(generated,'exec-82518c11-7a5f-46d2-adac-bd66ffd3b5a4.png')).resize(1920,1080,{fit:'fill'}).toBuffer();
  await sharp(chileBase).composite([{input:chilePhoto,left:0,top:0}]).png().toFile(path.join(chile,'dataterra-territorial-planning-chile.png'));
  const roadmapPhoto = await sharp(path.join(root,'fontes-reais-riscos/scala-tambore-sgrutb08.png')).resize(848,980,{fit:'cover',position:'centre'}).toBuffer();
  await sharp(path.join(batch,'27-roadmap-preview.png')).composite([{input:roadmapPhoto,left:1072,top:0}]).png().toFile(path.join(batch,'27-roadmap.png'));
  const logo = await sharp(path.join(assets,'usp-logo.png')).resize(118,48,{fit:'contain',background:{r:237,g:242,b:232,alpha:0}}).toBuffer();
  const logoBadge = await sharp({create:{width:154,height:122,channels:4,background:'#edf2e8'}}).composite([{input:logo,left:18,top:37}]).png().toBuffer();
  const badge = await rounded(logoBadge,154,122,14);
  const camilla = await rounded(path.join(assets,'camilla-chu-linkedin.jpg'),250,226,18);
  const rayssa = await rounded(path.join(assets,'rayssa-buarque-linkedin.jpg'),250,229,18);
  const destinations = JSON.parse(fs.readFileSync(path.join(assets,'qr-destinations.json'),'utf8'));
  const qr = {};
  for (const item of destinations) qr[item.name] = await QRCode.toBuffer(item.url,{width:228,margin:4,errorCorrectionLevel:'M',color:{dark:'#101b17',light:'#ffffff'}});
  await sharp(path.join(batch,'29-thank-you-preview.png')).composite([
    {input:camilla,left:115,top:384}, {input:rayssa,left:115,top:686},
    {input:badge,left:844,top:432}, {input:badge,left:844,top:738},
    {input:qr.mission,left:1584,top:381}, {input:qr.prototype,left:1584,top:686}
  ]).png().toFile(path.join(batch,'29-thank-you.png'));
  const checks = [];
  for (const [name,top] of [['mission',381],['prototype',686]]) {
    const {data,info}=await sharp(path.join(batch,'29-thank-you.png')).extract({left:1584,top,width:228,height:228}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const decoded=jsQR(new Uint8ClampedArray(data),info.width,info.height);
    const expected=destinations.find(x=>x.name===name).url;
    if(decoded?.data!==expected) throw new Error(`Final QR ${name} did not match original URL`);
    checks.push({name,decoded:decoded.data,status:'passed'});
  }
  const files=[path.join(chile,'dataterra-territorial-planning-chile.png'),path.join(batch,'27-roadmap.png'),path.join(batch,'28-purpose.png'),path.join(batch,'29-thank-you.png')];
  for(const file of files) {
    const metadata=await sharp(file).metadata();
    if(metadata.width!==1920||metadata.height!==1080||metadata.format!=='png') throw new Error(`Incorrect format: ${file}`);
    checks.push({file:path.relative(root,file),format:'png',width:metadata.width,height:metadata.height,ratio:'16:9'});
  }
  fs.writeFileSync(path.join(root,'latest-slides-validation.json'),JSON.stringify(checks,null,2)+'\n');
  console.log(JSON.stringify(checks,null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});
