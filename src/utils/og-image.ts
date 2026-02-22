/**
 * OG Image Generator for paulkuo.tw
 * Uses satori + sharp to generate 1200x630 PNG at build time
 */
import satori from 'satori';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Hard-coded pillar colors (from CSS vars, satori can't read CSS vars)
const PILLAR_COLORS: Record<string, string> = {
  ai: '#2563EB',
  circular: '#059669',
  faith: '#B45309',
  startup: '#DC2626',
  life: '#7C3AED',
};

const PILLAR_LABELS: Record<string, string> = {
  ai: '智能與秩序',
  circular: '循環再利用',
  faith: '文明與人性',
  startup: '創造與建構',
  life: '沉思與記憶',
};

// Cache fonts in memory during build
let fontBold: ArrayBuffer | null = null;
let fontRegular: ArrayBuffer | null = null;

// Resolve font paths from project root (process.cwd() is reliable in Astro build)
function getFontPath(filename: string): string {
  return join(process.cwd(), 'src', 'assets', 'fonts', filename);
}

async function loadFonts() {
  if (!fontBold) {
    const boldBuffer = await readFile(getFontPath('NotoSansTC-Bold.ttf'));
    fontBold = boldBuffer.buffer.slice(
      boldBuffer.byteOffset,
      boldBuffer.byteOffset + boldBuffer.byteLength
    );
  }
  if (!fontRegular) {
    const regularBuffer = await readFile(getFontPath('NotoSansTC-Regular.ttf'));
    fontRegular = regularBuffer.buffer.slice(
      regularBuffer.byteOffset,
      regularBuffer.byteOffset + regularBuffer.byteLength
    );
  }
  return { fontBold, fontRegular };
}

export interface OgImageOptions {
  title: string;
  pillar: string;
  description?: string;
  date?: string;
}

export async function generateOgImage(options: OgImageOptions): Promise<Buffer> {
  const { title, pillar, description, date } = options;
  const accentColor = PILLAR_COLORS[pillar] || '#2563EB';
  const pillarLabel = PILLAR_LABELS[pillar] || '';
  const { fontBold, fontRegular } = await loadFonts();

  // Dynamic font size based on title length (no truncation)
  const titleFontSize = title.length > 35 ? 40 : title.length > 25 ? 48 : 56;
  // Truncate description only
  const displayDesc = description
    ? description.length > 90
      ? description.slice(0, 88) + '…'
      : description
    : '';

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 72px',
          backgroundColor: '#0B1120',
          fontFamily: 'NotoSansTC',
        },
        children: [
          // Top: pillar badge + accent line
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      width: '48px',
                      height: '4px',
                      backgroundColor: accentColor,
                      borderRadius: '2px',
                    },
                  },
                },
                {
                  type: 'span',
                  props: {
                    style: {
                      color: accentColor,
                      fontSize: '28px',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                    },
                    children: pillarLabel,
                  },
                },
              ],
            },
          },
          // Middle: title
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                justifyContent: 'center',
              },
              children: [
                {
                  type: 'h1',
                  props: {
                    style: {
                      color: '#FFFFFF',
                      fontSize: `${titleFontSize}px`,
                      fontWeight: 700,
                      lineHeight: 1.3,
                      margin: 0,
                    },
                    children: title,
                  },
                },
                ...(displayDesc
                  ? [
                      {
                        type: 'p',
                        props: {
                          style: {
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '24px',
                            fontWeight: 400,
                            lineHeight: 1.5,
                            marginTop: '20px',
                          },
                          children: displayDesc,
                        },
                      },
                    ]
                  : []),
              ],
            },
          },
          // Bottom: author + date + accent bar
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    },
                    children: [
                      {
                        type: 'span',
                        props: {
                          style: {
                            color: '#FFFFFF',
                            fontSize: '26px',
                            fontWeight: 700,
                          },
                          children: 'Paul Kuo 郭曜郎',
                        },
                      },
                      {
                        type: 'span',
                        props: {
                          style: {
                            color: 'rgba(255,255,255,0.4)',
                            fontSize: '20px',
                            fontWeight: 400,
                          },
                          children: `paulkuo.tw${date ? `  ·  ${date}` : ''}`,
                        },
                      },
                    ],
                  },
                },
                // Accent corner bar
                {
                  type: 'div',
                  props: {
                    style: {
                      width: '80px',
                      height: '4px',
                      backgroundColor: accentColor,
                      borderRadius: '2px',
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'NotoSansTC',
          data: fontBold!,
          weight: 700,
          style: 'normal',
        },
        {
          name: 'NotoSansTC',
          data: fontRegular!,
          weight: 400,
          style: 'normal',
        },
      ],
    }
  );

  const png = await sharp(Buffer.from(svg)).png({ quality: 90 }).toBuffer();
  return png;
}
