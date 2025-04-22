import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

// SVG templates
const chatIconSvg = `
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M24 4C12.954 4 4 12.954 4 24C4 35.046 12.954 44 24 44C35.046 44 44 35.046 44 24C44 12.954 35.046 4 24 4ZM24 40C15.178 40 8 32.822 8 24C8 15.178 15.178 8 24 8C32.822 8 40 15.178 40 24C40 32.822 32.822 40 24 40Z" fill="currentColor"/>
  <path d="M24 14C18.477 14 14 18.477 14 24C14 29.523 18.477 34 24 34C29.523 34 34 29.523 34 24C34 18.477 29.523 14 24 14ZM24 30C20.686 30 18 27.314 18 24C18 20.686 20.686 18 24 18C27.314 18 30 20.686 30 24C30 27.314 27.314 30 24 30Z" fill="currentColor"/>
</svg>`;

const userIconSvg = `
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M24 4C12.954 4 4 12.954 4 24C4 35.046 12.954 44 24 44C35.046 44 44 35.046 44 24C44 12.954 35.046 4 24 4ZM24 8C32.822 8 40 15.178 40 24C40 32.822 32.822 40 24 40C15.178 40 8 32.822 8 24C8 15.178 15.178 8 24 8Z" fill="currentColor"/>
  <path d="M24 14C20.686 14 18 16.686 18 20C18 23.314 20.686 26 24 26C27.314 26 30 23.314 30 20C30 16.686 27.314 14 24 14ZM24 22C22.895 22 22 21.105 22 20C22 18.895 22.895 18 24 18C25.105 18 26 18.895 26 20C26 21.105 25.105 22 24 22Z" fill="currentColor"/>
  <path d="M32 28H16C14.895 28 14 28.895 14 30V34C14 35.105 14.895 36 16 36H32C33.105 36 34 35.105 34 34V30C34 28.895 33.105 28 32 28ZM30 32H18V30H30V32Z" fill="currentColor"/>
</svg>`;

const userAvatarSvg = `
<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="40" cy="40" r="40" fill="#007AFF"/>
  <path d="M40 20C34.477 20 30 24.477 30 30C30 35.523 34.477 40 40 40C45.523 40 50 35.523 50 30C50 24.477 45.523 20 40 20ZM40 36C36.686 36 34 33.314 34 30C34 26.686 36.686 24 40 24C43.314 24 46 26.686 46 30C46 33.314 43.314 36 40 36Z" fill="white"/>
  <path d="M56 44H24C22.895 44 22 44.895 22 46V54C22 55.105 22.895 56 24 56H56C57.105 56 58 55.105 58 54V46C58 44.895 57.105 44 56 44ZM54 52H26V48H54V52Z" fill="white"/>
</svg>`;

const assistantAvatarSvg = `
<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="40" cy="40" r="40" fill="#FF9500"/>
  <path d="M40 20C34.477 20 30 24.477 30 30C30 35.523 34.477 40 40 40C45.523 40 50 35.523 50 30C50 24.477 45.523 20 40 20ZM40 36C36.686 36 34 33.314 34 30C34 26.686 36.686 24 40 24C43.314 24 46 26.686 46 30C46 33.314 43.314 36 40 36Z" fill="white"/>
  <path d="M56 44H24C22.895 44 22 44.895 22 46V54C22 55.105 22.895 56 24 56H56C57.105 56 58 55.105 58 54V46C58 44.895 57.105 44 56 44ZM54 52H26V48H54V52Z" fill="white"/>
  <circle cx="34" cy="30" r="2" fill="white"/>
  <circle cx="46" cy="30" r="2" fill="white"/>
  <path d="M40 32C38.895 32 38 32.895 38 34C38 35.105 38.895 36 40 36C41.105 36 42 35.105 42 34C42 32.895 41.105 32 40 32Z" fill="white"/>
</svg>`;

const sendIconSvg = `
<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4.10557 20L4 4L36 20L4 36L4.10557 20ZM4.10557 20L20 20" stroke="#007AFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const recordingIconSvg = `
<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="60" r="58" stroke="white" stroke-width="4"/>
  <circle cx="60" cy="60" r="40" fill="white"/>
  <circle cx="60" cy="60" r="20" fill="#FF3B30"/>
  <path d="M40 60C40 48.954 48.954 40 60 40" stroke="white" stroke-width="4" stroke-linecap="round">
    <animateTransform
      attributeName="transform"
      attributeType="XML"
      type="rotate"
      from="0 60 60"
      to="360 60 60"
      dur="2s"
      repeatCount="indefinite"
    />
  </path>
</svg>`;

const voiceIconSvg = `
<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 28c3.3 0 6-2.7 6-6V10c0-3.3-2.7-6-6-6s-6 2.7-6 6v12c0 3.3 2.7 6 6 6z" fill="#007AFF"/>
  <path d="M29 22c0 4.4-3.6 8-8 8s-8-3.6-8-8h-2c0 5.2 4 9.4 9 9.9V36h2v-4.1c5-.5 9-4.7 9-9.9h-2z" fill="#007AFF"/>
</svg>`;

// Colors
const normalColor = '#8E8E93';
const activeColor = '#007AFF';

// Generate SVG with color
function generateColoredSvg(svg: string, color: string): string {
  return svg.replace(/currentColor/g, color);
}

// Convert SVG to PNG using sharp
async function svgToPng(svg: string, width: number, height: number): Promise<Buffer> {
  return await sharp(Buffer.from(svg))
    .resize(width, height)
    .png()
    .toBuffer();
}

// Save PNG file
function savePng(buffer: Buffer, filename: string): void {
  const dir = path.dirname(filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filename, buffer);
}

// Generate all icons
async function generateIcons(): Promise<void> {
  try {
    // Generate tabbar icons
    const chatNormal = generateColoredSvg(chatIconSvg, normalColor);
    const chatActive = generateColoredSvg(chatIconSvg, activeColor);
    const userNormal = generateColoredSvg(userIconSvg, normalColor);
    const userActive = generateColoredSvg(userIconSvg, activeColor);

    await Promise.all([
      // Tabbar icons
      savePng(
        await svgToPng(chatNormal, 48, 48),
        'miniprogram/images/tabbar/chat.png'
      ),
      savePng(
        await svgToPng(chatActive, 48, 48),
        'miniprogram/images/tabbar/chat-active.png'
      ),
      savePng(
        await svgToPng(userNormal, 48, 48),
        'miniprogram/images/tabbar/user.png'
      ),
      savePng(
        await svgToPng(userActive, 48, 48),
        'miniprogram/images/tabbar/user-active.png'
      ),

      // Chat icons
      savePng(
        await svgToPng(userAvatarSvg, 80, 80),
        'miniprogram/images/chat/user-avatar.png'
      ),
      savePng(
        await svgToPng(assistantAvatarSvg, 80, 80),
        'miniprogram/images/chat/assistant-avatar.png'
      ),
      savePng(
        await svgToPng(sendIconSvg, 40, 40),
        'miniprogram/images/chat/send.png'
      ),
      savePng(
        await svgToPng(recordingIconSvg, 120, 120),
        'miniprogram/images/chat/recording.png'
      ),

      // Voice icon
      savePng(
        await svgToPng(voiceIconSvg, 40, 40),
        'miniprogram/images/chat/voice.png'
      )
    ]);

    console.log('Icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();