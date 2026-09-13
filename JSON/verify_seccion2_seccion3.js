const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runValidation() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const profileDir = 'C:\\Users\\HP\\AppData\\Local\\Temp\\chrome-verify-sec2-sec3';
  const artifactDir = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\af91634b-dd04-4667-b8ce-62d5410b4091';
  const workspaceDir = 'C:\\Users\\HP\\Desktop\\Control Coolbox';

  if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${profileDir}`,
    '--window-size=412,1200'
  ]);

  await new Promise(r => setTimeout(r, 1200));

  try {
    const targetsRes = await fetch('http://127.0.0.1:9225/json');
    const targets = await targetsRes.json();
    let pageTarget = targets.find(t => t.type === 'page') || (await (await fetch('http://127.0.0.1:9225/json/new?about:blank', { method: 'PUT' })).json());

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

    // Limpiar localStorage y recargar
    await send('Runtime.evaluate', { expression: `localStorage.clear()` });
    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 1000));

    // Seleccionar tienda B22 (2 estaciones)
    const evalData = await send('Runtime.evaluate', {
      expression: `(() => {
        const select = document.getElementById('selectTienda');
        select.value = 'B22';
        select.dispatchEvent(new Event('change'));

        // 1. Validación de Sección 2
        const card2 = document.querySelectorAll('.card')[1];
        const card2Title = card2.querySelector('.card-title');
        const card2TitleStyle = window.getComputedStyle(card2Title);

        // Controles de Sección 2
        const gabLimpieza = !!document.getElementById('gabLimpieza');
        const gabVentiladores = !!document.getElementById('gabVentiladores');
        const gabPDU = !!document.getElementById('gabPDU');
        const previewAntes = !!document.getElementById('previewAntes');
        const previewDespues = !!document.getElementById('previewDespues');
        const gabObs = !!document.getElementById('gabObs');

        // 2. Validación de Sección 3
        const contenedor = document.getElementById('contenedorEstacionesMantenimiento');
        const boxes = contenedor.querySelectorAll('.station-box');

        const estacionesChecks = Array.from(boxes).map((box, idx) => {
          const num = idx + 1;
          const labels = Array.from(box.querySelectorAll('.station-check span')).map(s => s.textContent.trim());
          const inputs = Array.from(box.querySelectorAll('.station-check input')).map(i => i.id);
          return { estacion: num, totalTareas: labels.length, labels, inputs };
        });

        // Marcar pasta térmica e impresora en la estación 1
        const chkPasta1 = document.getElementById('check_pasta_1');
        const chkPrint1 = document.getElementById('check_print_1');
        if (chkPasta1) chkPasta1.checked = true;
        if (chkPrint1) chkPrint1.checked = true;

        const detalleExtraido = obtenerDetalleEstacionesMantenimiento();

        return {
          seccion2: {
            tituloTexto: card2Title.textContent.trim(),
            fontSize: card2TitleStyle.fontSize,
            lineHeight: card2TitleStyle.lineHeight,
            controlesIntactos: gabLimpieza && gabVentiladores && gabPDU && previewAntes && previewDespues && gabObs
          },
          seccion3: {
            totalEstaciones: boxes.length,
            estacionesChecks: estacionesChecks,
            detalleExtraido: detalleExtraido
          }
        };
      })()`,
      returnByValue: true
    });

    console.log('RESULTADOS_VALIDACION:', JSON.stringify(evalData.result.value, null, 2));

    // Captura 1: Sección 2 (Gabinete)
    await send('Runtime.evaluate', {
      expression: `(() => {
        const card2 = document.querySelectorAll('.card')[1];
        const rect = card2.getBoundingClientRect();
        const headerOffset = 70;
        window.scrollBy({ top: rect.top - headerOffset, behavior: 'instant' });
      })()`
    });
    await new Promise(r => setTimeout(r, 600));
    const shotSec2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(workspaceDir, 'audit_seccion2_gabinete.png'), Buffer.from(shotSec2.data, 'base64'));
    fs.writeFileSync(path.join(artifactDir, 'audit_seccion2_gabinete.png'), Buffer.from(shotSec2.data, 'base64'));
    console.log('Captura Sección 2 guardada: audit_seccion2_gabinete.png');

    // Captura 2: Sección 3 (Estaciones con 7 tareas completas)
    await send('Runtime.evaluate', {
      expression: `(() => {
        const card3 = document.querySelectorAll('.card')[2];
        const rect = card3.getBoundingClientRect();
        const headerOffset = 70;
        window.scrollBy({ top: rect.top - headerOffset, behavior: 'instant' });
      })()`
    });
    await new Promise(r => setTimeout(r, 600));
    const shotSec3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(workspaceDir, 'audit_seccion3_7tareas.png'), Buffer.from(shotSec3.data, 'base64'));
    fs.writeFileSync(path.join(artifactDir, 'audit_seccion3_7tareas.png'), Buffer.from(shotSec3.data, 'base64'));
    console.log('Captura Sección 3 guardada: audit_seccion3_7tareas.png');

    console.log('VALIDACIÓN CONCLUIDA EXITOSAMENTE.');

  } catch (e) {
    console.error('Error durante la validación:', e);
  } finally {
    chrome.kill();
  }
}

runValidation();
