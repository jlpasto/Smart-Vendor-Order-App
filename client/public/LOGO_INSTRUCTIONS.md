# Logo Instructions for PWA

## Required Logo Files

For the PWA to work properly, you need to create 3 logo files and place them in the `client/public/` folder:

1. **logo.png** - 256x256px (for favicon and general use)
2. **logo-192.png** - 192x192px (for Android/PWA)
3. **logo-512.png** - 512x512px (for high-res displays)

## Quick Logo Creation

### Option 1: Use an Online Tool (Easiest)

1. Go to [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Upload your logo image (at least 512x512px)
3. Download the generated package
4. Copy the PNG files to this folder

### Option 2: Create Simple Placeholder Logos

#### Using PowerPoint/Google Slides:
1. Create a new slide
2. Set size to 512x512px
3. Add a colored square background (#1e40af - blue)
4. Add a large white "W" in the center
5. Export as PNG at different sizes

#### Using Canva (Free):
1. Go to [Canva.com](https://www.canva.com)
2. Create a custom design: 512x512px
3. Add a blue background
4. Add white text "W" or your logo
5. Download as PNG
6. Resize to 192x192 and 256x256 using:
   - [iloveimg.com/resize-image](https://www.iloveimg.com/resize-image)
   - [squoosh.app](https://squoosh.app/)

### Option 3: Use Existing Brand Logo

If you have a company logo:
1. Make sure it's square (1:1 ratio)
2. Resize to 512x512px
3. Create smaller versions (192x192, 256x256)
4. Save as PNG with transparent background

## Color Scheme

Default app colors:
- **Primary Blue**: #1e40af
- **White**: #ffffff
- **Background**: #f9fafb

## Recommended Logo Style

For a wholesale/business app:
- Simple, bold design
- High contrast (works on any background)
- Square format
- Clear at small sizes
- Professional look

## Quick AI Generation

Use an AI tool to generate:
- Prompt: "Simple, modern logo for wholesale ordering app, minimalist design, blue and white colors, square format"
- Tools: DALL-E, Midjourney, or Canva's AI

## Temporary Placeholder

If you want to skip this for now, the app will still work! The manifest will show default icons. You can add custom logos later.

## File Naming

Make sure your files are named exactly:
- `logo.png`
- `logo-192.png`
- `logo-512.png`

And placed in: `client/public/`
