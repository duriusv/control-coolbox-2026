const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
const jserviceLogoPath = path.join(__dirname, 'LOGO_JSERVICE.png');
const coolboxLogoPath = path.join(__dirname, 'LOGO_COOLBOX.png');

if (!fs.existsSync(jserviceLogoPath)) {
  console.error('No se encontró LOGO_JSERVICE.png');
  process.exit(1);
}

if (!fs.existsSync(coolboxLogoPath)) {
  console.error('No se encontró LOGO_COOLBOX.png');
  process.exit(1);
}

const jserviceBase64 = 'data:image/png;base64,' + fs.readFileSync(jserviceLogoPath).toString('base64');
const coolboxBase64 = 'data:image/png;base64,' + fs.readFileSync(coolboxLogoPath).toString('base64');

console.log('JSERVICE Base64 length:', jserviceBase64.length);
console.log('Coolbox Base64 length:', coolboxBase64.length);

let html = fs.readFileSync(indexPath, 'utf8');

// 1. Reemplazar CSS de marcas previas por los estilos de logo optimizados
const oldCssPattern = /\.brand-jservice\s*\{[\s\S]*?\.header-subtitle\s*\{[\s\S]*?font-weight:\s*500;\s*\}/;
const newCss = `.header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .header-logo-left, .header-logo-right {
      display: flex;
      align-items: center;
    }
    .logo-jservice {
      height: 38px;
      max-height: 38px;
      width: auto;
      max-width: 180px;
      object-fit: contain;
      display: block;
    }
    .logo-coolbox {
      height: 34px;
      max-height: 38px;
      width: auto;
      max-width: 160px;
      object-fit: contain;
      display: block;
    }
    .header-subtitle {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-top: 6px;
      font-weight: 500;
    }`;

if (oldCssPattern.test(html)) {
  html = html.replace(oldCssPattern, newCss);
  console.log('CSS de logos reemplazado exitosamente.');
} else {
  console.warn('No se pudo encontrar el bloque CSS exacto, revisando...');
}

// 2. Reemplazar el interior del <header>
const oldHeaderPattern = /<header>[\s\S]*?<\/header>/;
const newHeader = `<header>
    <div class="header-container">
      <div class="header-top">
        <div class="header-logo-left">
          <img src="${jserviceBase64}" alt="JSERVICE RV - Cableado Estructurado" class="logo-jservice">
        </div>
        <div class="header-logo-right">
          <img src="${coolboxBase64}" alt="Coolbox" class="logo-coolbox">
        </div>
      </div>
      <div class="header-subtitle">Control de Mantenimiento e Inventario 2026</div>
    </div>
  </header>`;

if (oldHeaderPattern.test(html)) {
  html = html.replace(oldHeaderPattern, newHeader);
  console.log('Bloque <header> actualizado con logos Base64.');
} else {
  console.error('No se pudo encontrar el bloque <header> en index.html');
  process.exit(1);
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('index.html guardado exitosamente con logos integrados.');
