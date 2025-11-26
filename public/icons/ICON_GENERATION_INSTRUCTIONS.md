# PWA Icon Generation Instructions

## Required Icons

Your RevMate PWA needs the following icons in the `/public/icons/` directory:

1. **icon-192x192.png** - 192x192 pixels
2. **icon-512x512.png** - 512x512 pixels  
3. **icon-maskable-192x192.png** - 192x192 pixels (maskable)
4. **icon-maskable-512x512.png** - 512x512 pixels (maskable)

## Source Image

Use the logo image located at:
`public/cute-boy-riding-motorbike-cartoon-260nw-2091077335-removebg-preview.png`

## How to Generate Icons

### Option 1: Online Tools (Recommended)

1. **PWA Asset Generator** (https://www.pwabuilder.com/imageGenerator)
   - Upload your logo image
   - Select "Generate all sizes"
   - Download and place in `/public/icons/`

2. **RealFaviconGenerator** (https://realfavicongenerator.net/)
   - Upload your logo
   - Configure PWA settings
   - Download generated icons

### Option 2: Image Editing Software

1. Open your logo in Photoshop/GIMP/Canva
2. Resize to required dimensions:
   - 192x192px
   - 512x512px
3. For maskable icons:
   - Add 10% padding (safe zone)
   - Ensure important content is within 80% of the center
4. Export as PNG
5. Save to `/public/icons/`

### Option 3: Command Line (ImageMagick)

```bash
# Install ImageMagick first
# Then run:

# Generate 192x192 icon
magick public/cute-boy-riding-motorbike-cartoon-260nw-2091077335-removebg-preview.png -resize 192x192 public/icons/icon-192x192.png

# Generate 512x512 icon
magick public/cute-boy-riding-motorbike-cartoon-260nw-2091077335-removebg-preview.png -resize 512x512 public/icons/icon-512x512.png

# Generate maskable icons (with padding)
magick public/cute-boy-riding-motorbike-cartoon-260nw-2091077335-removebg-preview.png -resize 154x154 -gravity center -extent 192x192 -background white public/icons/icon-maskable-192x192.png
magick public/cute-boy-riding-motorbike-cartoon-260nw-2091077335-removebg-preview.png -resize 410x410 -gravity center -extent 512x512 -background white public/icons/icon-maskable-512x512.png
```

## Maskable Icon Guidelines

Maskable icons should:
- Have important content within 80% of the center (safe zone)
- Have 10% padding on all sides
- Work well when cropped to various shapes (circle, rounded square, etc.)

## Quick Test

After generating icons, test your PWA:
1. Open your app in Chrome
2. Check DevTools > Application > Manifest
3. Verify all icons are detected
4. Test "Add to Home Screen" functionality

## Notes

- Icons should be square (1:1 aspect ratio)
- Use PNG format for best compatibility
- Ensure icons have transparent backgrounds (or appropriate background color)
- Test icons on both light and dark backgrounds

