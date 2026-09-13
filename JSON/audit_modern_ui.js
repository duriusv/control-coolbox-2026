const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function auditModernUI() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const profileDir = 'C:\\Users\\HP\\AppData\\Local\\Temp\\chrome-modern-audit';
  const artifactDir = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\af91634b-dd04-4667-b8ce-62d5410b4091';
  const workspaceDir = 'C:\\Users\\HP\\Desktop\\Control Coolbox';

  if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9226',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${profileDir}`,
    '--window-size=412,1200'
  ]);

  await new Promise(r => setTimeout(r, 1200));

  try {
    const targetsRes = await fetch('http://127.0.0.1:9226/json');
    const targets = await targetsRes.json();
    let pageTarget = targets.find(t => t.type === 'page') || (await (await fetch('http://127.0.0.1:9226/json/new?about:blank', { method: 'PUT' })).json());

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
    await new Promise(r => setTimeout(r, 1000));

    // Limpiar localStorage y seleccionar B57 para ver todos los componentes activos
    await send('Runtime.evaluate', { expression: `localStorage.clear()` });
    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 1000));

    const auditData = await send('Runtime.evaluate', {
      expression: `(() => {
        const select = document.getElementById('selectTienda');
        select.value = 'B57';
        select.dispatchEvent(new Event('change'));

        const header = document.querySelector('header');
        const headerStyle = window.getComputedStyle(header);
        const brandTitle = document.querySelector('.brand-title');
        const coolboxText = document.querySelector('.coolbox-text');
        const coolboxCapsule = document.querySelector('.coolbox-capsule');
        const subtitle = document.querySelector('.header-subtitle');

        const card1 = document.querySelectorAll('.card')[0];
        const card1Style = window.getComputedStyle(card1);

        const btnCopiar = document.querySelector('button[onclick="copiarDireccion()"]');
        const btnCopiarStyle = window.getComputedStyle(btnCopiar);

        const btnScan = document.querySelector('.btn-scan');
        const btnScanStyle = window.getComputedStyle(btnScan);

        const photoBox = document.querySelector('.photo-box');
        const photoBoxStyle = window.getComputedStyle(photoBox);

        const btnSubmit = document.querySelector('button[onclick="enviarAtencionFinal()"]');
        const btnSubmitStyle = window.getComputedStyle(btnSubmit);

        return {
          header: {
            bg: headerStyle.backgroundColor,
            borderBottom: headerStyle.borderBottom,
            boxShadow: headerStyle.boxShadow,
            brandJserviceColor: window.getComputedStyle(brandTitle).color,
            coolboxRedColor: window.getComputedStyle(coolboxText).color,
            coolboxCapsuleBg: window.getComputedStyle(coolboxCapsule).backgroundColor,
            subtitleColor: window.getComputedStyle(subtitle).color
          },
          cards: {
            borderRadius: card1Style.borderRadius,
            boxShadow: card1Style.boxShadow,
            borderColor: card1Style.borderColor,
            backgroundColor: card1Style.backgroundColor
          },
          buttons: {
            btnOutlineBorder: btnCopiarStyle.border,
            btnOutlineColor: btnCopiarStyle.color,
            btnOutlineBg: btnCopiarStyle.backgroundColor,
            btnOutlineMinHeight: btnCopiarStyle.minHeight,
            btnScanBg: btnScanStyle.backgroundColor,
            btnScanColor: btnScanStyle.color,
            btnScanMinHeight: btnScanStyle.minHeight,
            photoBoxMinHeight: photoBoxStyle.minHeight,
            btnSubmitBg: btnSubmitStyle.backgroundColor,
            btnSubmitMinHeight: btnSubmitStyle.minHeight
          }
        };
      })()`,
      returnByValue: true
    });

    console.log('AUDIT_MODERN_UI:', JSON.stringify(auditData.result.value, null, 2));

    // Captura 1: Cabecera dual moderna y Sección 1
    const shotTop = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(workspaceDir, 'audit_modern_header_dual.png'), Buffer.from(shotTop.data, 'base64'));
    fs.writeFileSync(path.join(artifactDir, 'audit_modern_header_dual.png'), Buffer.from(shotTop.data, 'base64'));
    console.log('Captura 1 guardada: audit_modern_header_dual.png');

    // Captura 2: Sección 2 y Sección 3 con tarjetas ergonómicas y estaciones
    await send('Runtime.evaluate', {
      expression: `(() => {
        const card2 = document.querySelectorAll('.card')[1];
        const rect = card2.getBoundingClientRect();
        window.scrollBy({ top: rect.top - 65, behavior: 'instant' });
      })()`
    });
    await new Promise(r => setTimeout(r, 600));
    const shotMid = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(workspaceDir, 'audit_modern_cards_palette.png'), Buffer.from(shotMid.data, 'base64'));
    fs.writeFileSync(path.join(artifactDir, 'audit_modern_cards_palette.png'), Buffer.from(shotMid.data, 'base64'));
    console.log('Captura 2 guardada: audit_modern_cards_palette.png');

    // Captura 3: Sección 4 de Inventario con botones de escaneo ergonómicos y botón final
    await send('Runtime.evaluate', {
      expression: `(() => {
        const card4 = document.querySelectorAll('.card')[3];
        const rect = card4.getBoundingClientRect();
        window.scrollBy({ top: rect.top - 65, behavior: 'instant' });
      })()`
    });
    await new Promise(r => setTimeout(r, 600));
    const shotBot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(workspaceDir, 'audit_modern_scan_buttons.png'), Buffer.from(shotBot.data, 'base64'));
    fs.writeFileSync(path.join(artifactDir, 'audit_modern_scan_buttons.png'), Buffer.from(shotBot.data, 'base64'));
    console.log('Captura 3 guardada: audit_modern_scan_buttons.png');

    console.log('AUDITORÍA VISUAL MODERNIZADA FINALIZADA CON ÉXITO.');

  } catch (e) {
    console.error('Error durante la auditoría visual:', e);
  } finally {
    chrome.kill();
  }
}

auditModernUI();
