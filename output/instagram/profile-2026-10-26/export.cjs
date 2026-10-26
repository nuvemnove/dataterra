const fs = require('node:fs');
const path = require('node:path');
const sharp = require('/Users/klayvemguimaraeslealdasilva/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

const out = __dirname;
const repo = path.resolve(out, '../../..');
const html = fs.readFileSync(path.join(repo, 'index.html'), 'utf8');
const currentLogo = html.match(/<svg class="brand-icon"[\s\S]*?<\/svg>/)[0];
const originalPaths = [...currentLogo.matchAll(/<path d="([^"]+)"\s*\/>/g)].map(match => match[1]);
if (originalPaths.length !== 3) throw new Error('Current logo paths were not found.');
const paths = originalPaths.map(d => `<path d="${d}"/>`).join('');
const symbol = `<svg x="180" y="180" width="720" height="720" viewBox="0 0 24 24" fill="none" stroke="#b3cf91" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><rect width="1080" height="1080" fill="#101b17"/>${symbol}</svg>`;
const circle = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><defs><clipPath id="avatar"><circle cx="540" cy="540" r="540"/></clipPath></defs><g clip-path="url(#avatar)"><rect width="1080" height="1080" fill="#101b17"/>${symbol}</g></svg>`;
const bio = 'Territorial intelligence for data centers in Brazil.\nWater • energy • connectivity • territorial risk.\nExplore DataTerra ↓';

(async () => {
  fs.writeFileSync(path.join(out, 'dataterra-instagram-perfil.svg'), svg);
  await sharp(Buffer.from(svg)).png().toFile(path.join(out, 'dataterra-instagram-perfil.png'));
  await sharp(Buffer.from(circle)).resize(420, 420).png().toFile(path.join(out, 'previa-recorte-circular.png'));
  const sizes = [320, 110, 40];
  const samples = await Promise.all(sizes.map(size => sharp(Buffer.from(circle)).resize(size, size).png().toBuffer()));
  await sharp({ create: { width: 640, height: 380, channels: 3, background: '#edf2e8' } }).composite([
    { input: samples[0], left: 30, top: 30 },
    { input: samples[1], left: 400, top: 65 },
    { input: samples[2], left: 435, top: 255 }
  ]).png().toFile(path.join(out, 'verificacao-tamanhos.png'));
  fs.writeFileSync(path.join(out, 'bio-en.txt'), bio + '\n');
  fs.writeFileSync(path.join(out, 'LEIA-ME.txt'), [
    'DATATERRA — PERFIL DO INSTAGRAM',
    '',
    'Use dataterra-instagram-perfil.png como foto do perfil.',
    'PNG de 1080 × 1080 px, com fundo verde escuro e símbolo sálvia.',
    'O arquivo já está centralizado: mantenha o enquadramento inteiro ao enviar.',
    '',
    'O desenho é o mesmo vetor da logo atual do projeto. O símbolo foi ampliado',
    'e o traço foi ajustado para manter a leitura em uma foto de perfil pequena.',
    'O espaço ao redor preserva o símbolo no recorte circular.',
    '',
    'O arquivo SVG permite exportar outras resoluções sem perda de qualidade.',
    'previa-recorte-circular.png mostra como o recorte fica no perfil.',
    '',
    'NOME SUGERIDO',
    'DataTerra | Data Centers',
    '',
    'BIO EM INGLÊS',
    bio,
    '',
    'LINK DO PERFIL',
    'https://dataterra.vercel.app/?lang=en',
    '',
    'A bio está pronta para copiar no arquivo bio-en.txt.',
    'O link deve ser cadastrado no campo de links do perfil.',
    '',
    'Origem da marca: index.html, classe brand-icon, do projeto DataTerra.',
    'Cores: #101b17 e #b3cf91, identidade atual do projeto.'
  ].join('\n') + '\n');
  const validation = { width: 1080, height: 1080, originalPathsPreserved: true, logoBox: { x: 180, y: 180, width: 720, height: 720 }, strokeWidth: 1.6, bioCharacters: [...bio].length, smallPreviews: sizes };
  fs.writeFileSync(path.join(out, 'validation.json'), JSON.stringify(validation, null, 2));
  console.log(JSON.stringify(validation));
})().catch(error => { console.error(error); process.exitCode = 1; });
