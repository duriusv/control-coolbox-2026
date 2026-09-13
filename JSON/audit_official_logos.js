const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function auditOfficialLogos() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const profileDir = 'C:\\Users\\HP\\AppData\\Local\\Temp\\chrome-logos-audit';
  const artifactDir = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\af91634b-dd04-4667-b8ce-62d5410b4091';
  const workspaceDir = 'C:\\Users\\HP\\Desktop\\Control Coolbox';

  if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${profileDir}`,
    '--window-size=412,915'
  ]);

  await new Promise(r => setTimeout(r, 1200));

  try {
    const targetsRes = await fetch('http://127.0.0.1:9227/json');
    const targets = await targetsRes.json();
    let pageTarget = targets.find(t => t.type === 'page') || (await (await fetch('http://127.0.0.1:9227/json/new?about:blank', { method: 'PUT' })).json());

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let id = 1;
    const send = (method, params = {}) => new Promise((resolve) => {
      const msgId = id++;
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === msgId) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    await new Promise(r => ws.onopen = r);
    await send('Page.enable');
    await send('Runtime.enable');

    const url = 'file:///C:/Users/HP/Desktop/Control Coolbox/index.html';
    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 1200));

    // Evaluar estado de los logos
    const logoAudit = await send('Runtime.evaluate', {
      expression: `(() => {
        const imgJservice = document.querySelector('img.logo-jservice');
        const imgCoolbox = document.querySelector('img.logo-coolbox');
        const styleJservice = window.getComputedStyle(imgJservice);
        const styleCoolbox = window.getComputedStyle(imgCoolbox);
        const header = document.querySelector('header');
        const headerStyle = window.getComputedStyle(header);
        const subtitle = document.querySelector('.header-subtitle');

        // Seleccionar tienda para prueba visual
        const select = document.getElementById('selectTienda');
        select.value = 'B57';
        select.dispatchEvent(new Event('change'));

        return {
          jservice: {
            loaded: imgJservice.complete,
            naturalWidth: imgJservice.naturalWidth,
            naturalHeight: imgJservice.naturalHeight,
            renderedHeight: styleJservice.height,
            renderedWidth: styleJservice.width,
            objectFit: styleJservice.objectFit,
            isBase64: imgJservice.src.startsWith('data:image/png;base64,')
          },
          coolbox: {
            loaded: imgCoolbox.complete,
            naturalWidth: imgCoolbox.naturalWidth,
            naturalHeight: imgCoolbox.naturalHeight,
            renderedHeight: styleCoolbox.height,
            renderedWidth: styleCoolbox.width,
            objectFit: styleCoolbox.objectFit,
            isBase64: imgCoolbox.src.startsWith('data:image/png;base64,')
          },
          header: {
            bg: headerStyle.backgroundColor,
            borderBottom: headerStyle.borderBottom,
            subtitleText: subtitle ? subtitle.textContent.trim() : ''
          }
        };
      })()`,
      returnByValue: true
    });

    console.log('AUDIT_LOGOS_RESULT:', JSON.stringify(logoAudit.result.value, null, 2));

    // Captura móvil (412x915)
    const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(workspaceDir, 'audit_header_official_logos.png'), Buffer.from(shotMobile.data, 'base64'));
    fs.writeFileSync(path.join(artifactDir, 'audit_header_official_logos.png'), Buffer.from(shotMobile.data, 'base64'));
    console.log('Captura móvil guardada: audit_header_official_logos.png');

    // Cambiar viewport a tablet/desktop ancho para validar responsividad (650x915)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 650,
      height: 915,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 600));

    const shotDesktop = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(workspaceDir, 'audit_header_desktop_view.png'), Buffer.from(shotDesktop.data, 'base64'));
    fs.writeFileSync(path.join(artifactDir, 'audit_header_desktop_view.png'), Buffer.from(shotDesktop.data, 'base64'));
    console.log('Captura desktop guardada: audit_header_desktop_view.png');

    console.log('AUDITORÍA DE LOGOS FINALIZADA CON ÉXITO.');

  } catch (e) {
    console.error('Error durante la auditoría de logos:', e);
  } finally {
    chrome.kill();
  }
}

auditOfficialLogos();
