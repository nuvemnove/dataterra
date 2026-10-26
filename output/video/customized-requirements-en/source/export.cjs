const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const sharp = require('/Users/klayvemguimaraeslealdasilva/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

const out = path.resolve(__dirname, '..');
const input = path.join(out, 'captures', 'raw-form-demo.webm');
const output = path.join(out, 'dataterra-customized-requirements-en.mp4');
const inspect = file => JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]));
const source = inspect(input).streams.find(stream => stream.codec_type === 'video');
const [numerator, denominator] = source.r_frame_rate.split('/').map(Number);
const fps = numerator / denominator;
const pixels = execFileSync('ffmpeg', ['-v', 'error', '-i', input, '-vf', 'crop=8:8:0:0,scale=1:1:flags=area,format=rgb24', '-f', 'rawvideo', 'pipe:1'], { maxBuffer: 8 * 1024 * 1024 });
const matches = [];
for (let index = 0; index < pixels.length / 3; index++) {
  const [r, g, b] = pixels.subarray(index * 3, index * 3 + 3);
  if (r > 155 && g < 90 && b > 90) matches.push(index);
}
if (!matches.length) throw new Error('Recording cue was not found.');
const start = matches[0];
const end = matches.at(-1) + 1;
if ((end - start) / fps < 9.8) throw new Error('Recording is shorter than the requested clip.');
execFileSync('ffmpeg', [
  '-y', '-v', 'error', '-i', input, '-an',
  '-vf', `trim=start_frame=${start}:end_frame=${end},setpts=PTS-STARTPTS,drawbox=x=0:y=0:w=9:h=9:color=0x101b17:t=fill,tpad=stop_mode=clone:stop_duration=1,fps=30`,
  '-t', '10', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  '-metadata', 'title=DataTerra | Customized requirements',
  '-metadata', 'comment=Interactive concept demo; example inputs and an illustrative regional shortlist.',
  output
]);
const result = inspect(output);
const video = result.streams.find(stream => stream.codec_type === 'video');
if (video.width !== 1920 || video.height !== 1080 || Number(result.format.duration) !== 10 || video.r_frame_rate !== '30/1') {
  throw new Error('Final video did not pass the format check.');
}
execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', '8.5', '-i', output, '-frames:v', '1', path.join(out, 'dataterra-customized-requirements-en.jpg')]);
const times = [0.2, 1.6, 3.6, 4.7, 6.2, 8.6];
const frames = times.map((time, index) => {
  const framePath = path.join(out, 'captures', `review-${index + 1}.jpg`);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(time), '-i', output, '-frames:v', '1', '-vf', 'scale=960:540', framePath]);
  return { input: framePath, left: index % 2 * 960, top: Math.floor(index / 2) * 540 };
});
sharp({ create: { width: 1920, height: 1620, channels: 3, background: '#101b17' } }).composite(frames).png().toFile(path.join(out, 'captures', 'contact-sheet.png')).then(() => {
  const verification = { file: path.basename(output), duration: Number(result.format.duration), width: video.width, height: video.height, fps: video.r_frame_rate, codec: video.codec_name, pixelFormat: video.pix_fmt, bytes: Number(result.format.size), sourceFrames: { start, end, fps }, reviewTimes: times };
  fs.writeFileSync(path.join(out, 'captures', 'export-verification.json'), JSON.stringify(verification, null, 2));
  console.log(JSON.stringify(verification));
}).catch(error => { console.error(error); process.exitCode = 1; });
