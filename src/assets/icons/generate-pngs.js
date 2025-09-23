const fs = require('fs');
const path = require('path');

// SVG templates for each crew role icon
const icons = {
    'cleaning-crew': `<svg width="256" height="256" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="8" r="3" fill="#000000" />
        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="#000000" stroke-width="2" fill="none" />
        <path d="M8 12l2-2 2 2" stroke="#000000" stroke-width="1.5" fill="none" />
        <circle cx="10" cy="10" r="1" fill="#000000" />
    </svg>`,

    'yard-crew': `<svg width="256" height="256" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="8" r="3" fill="#000000" />
        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="#000000" stroke-width="2" fill="none" />
        <rect x="6" y="14" width="12" height="2" fill="#000000" opacity="0.3" />
        <rect x="7" y="16" width="2" height="1" fill="#000000" />
        <rect x="11" y="16" width="2" height="1" fill="#000000" />
        <rect x="15" y="16" width="2" height="1" fill="#000000" />
    </svg>`,

    'technical-crew': `<svg width="256" height="256" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="8" r="3" fill="#000000" />
        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="#000000" stroke-width="2" fill="none" />
        <path d="M8 12l1-1 2 2-1 1" stroke="#000000" stroke-width="1.5" fill="none" />
        <circle cx="9" cy="11" r="0.5" fill="#000000" />
        <path d="M15 12l-1-1-2 2 1 1" stroke="#000000" stroke-width="1.5" fill="none" />
        <circle cx="15" cy="11" r="0.5" fill="#000000" />
    </svg>`,

    'operational-crew': `<svg width="256" height="256" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="8" r="3" fill="#000000" />
        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="#000000" stroke-width="2" fill="none" />
        <rect x="8" y="12" width="8" height="1" fill="#000000" />
        <rect x="9" y="13.5" width="2" height="0.5" fill="#000000" />
        <rect x="13" y="13.5" width="2" height="0.5" fill="#000000" />
        <circle cx="10" cy="14.5" r="0.5" fill="#000000" />
        <circle cx="14" cy="14.5" r="0.5" fill="#000000" />
    </svg>`,

    'admin': `<svg width="256" height="256" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="8" r="3" fill="#000000" />
        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="#000000" stroke-width="2" fill="none" />
        <path d="M8 10l2-1 2 1 2-1 2 1v1H8v-1z" fill="#000000" />
        <circle cx="10" cy="9" r="0.5" fill="#000000" />
        <circle cx="12" cy="9" r="0.5" fill="#000000" />
        <circle cx="14" cy="9" r="0.5" fill="#000000" />
    </svg>`,

    'branding-officer': `<svg width="256" height="256" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="8" r="3" fill="#000000" />
        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="#000000" stroke-width="2" fill="none" />
        <path d="M8 12l2 2 4-4" stroke="#000000" stroke-width="1.5" fill="none" />
        <circle cx="10" cy="10" r="1" fill="none" stroke="#000000" stroke-width="1" />
        <circle cx="14" cy="10" r="1" fill="none" stroke="#000000" stroke-width="1" />
        <path d="M9 11l1 1 1-1" stroke="#000000" stroke-width="1" fill="none" />
    </svg>`
};

// Create PNG directory if it doesn't exist
const pngDir = path.join(__dirname, 'png');
if (!fs.existsSync(pngDir)) {
    fs.mkdirSync(pngDir);
}

// Generate SVG files for each icon
Object.entries(icons).forEach(([name, svg]) => {
    const svgPath = path.join(pngDir, `${name}.svg`);
    fs.writeFileSync(svgPath, svg);
    console.log(`Generated: ${name}.svg`);
});

console.log('\nAll SVG files generated in the png/ directory.');
console.log('To convert to PNG, you can:');
console.log('1. Use the generate-pngs.html file in a browser');
console.log('2. Use online SVG to PNG converters');
console.log('3. Use tools like Inkscape or ImageMagick');
console.log('4. Use the HTML file with download buttons for each icon');
