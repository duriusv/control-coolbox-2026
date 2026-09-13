const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function verifyB22() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const profileDir = 'C:\\Users\\HP\\AppData\\Local\\Temp\\chrome-verify-b22';
  const artifactDir = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\af91634b-dd04-4667-b8ce-62d5410b4091';
  const workspaceDir = 'C:\\Users\\HP\\Desktop\\Control Coolbox';

  if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${profileDir}`,
    '--window-size=412,1200'
  ]);

  await new Promise(r => setTimeout(r, 1200));

  try {
    const targetsRes = await fetch('http://127.0.0.1:9224/json');
    const targets = await targetsRes.json();
    let pageTarget = targets.find(t => t.type === 'page') || (await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json());

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

    // Limpiar localStorage y seleccionar tienda B22
    await send('Runtime.evaluate', { expression: `localStorage.clear()` });
    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 1000));

    const evalResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const select = document.getElementById('selectTienda');
        select.value = 'B22';
        select.dispatchEvent(new Event('change'));

        const card3 = document.querySelectorAll('.card')[2];
        const card3Title = card3.querySelector('.card-title');
        const titleSpan = card3Title.querySelector('span:first-child');
        const tag = document.getElementById('contadorEstacionesTag');
        const computedTitle = window.getComputedStyle(card3Title);

        // Estaciones
        const contenedor = document.getElementById('contenedorEstacionesMantenimiento');
        const boxes = contenedor.querySelectorAll('.station-box');

        const estacionesData = Array.from(boxes).map((box, idx) => {
          const num = idx + 1;
          const aio = !!box.querySelector('#check_aio_' + num);
          const tick = !!box.querySelector('#check_tick_' + num);
          const lec = !!box.querySelector('#check_lec_' + num);
          const gav = !!box.querySelector('#check_gav_' + num);
          const cables = !!box.querySelector('#check_cables_' + num);
          const cablesLabel = box.querySelector('#check_cables_' + num) ? box.querySelector('#check_cables_' + num).parentElement.textContent.trim() : '';

          return {
            estacion: num,
            aio, tick, lec, gav, cables, cablesLabel
          };
        });

        // Marcar el checkbox de cables en la estación 1 para probar la extracción
        const chkCable1 = document.getElementById('check_cables_1');
        if (chkCable1) chkCable1.checked = true;

        const detalleExtraido = obtenerDetalleEstacionesMantenimiento();

        return {
          tienda: select.value,
          tituloSeccion3: titleSpan.textContent.trim(),
          contadorTag: tag.textContent.trim(),
          cardTitleStyles: {
            display: computedTitle.display,
            flexWrap: computedTitle.flexWrap,
            gap: computedTitle.gap,
            lineHeight: computedTitle.lineHeight
          },
          totalEstaciones: boxes.length,
          estaciones: estacionesData,
          detalleExtraido: detalleExtraido
        };
      })()`,
      returnByValue: true
    });

    console.log('EVAL_RESULT_B22:', JSON.stringify(evalResult.result.value, null, 2));

    // Scroll hacia Sección 3 descontando la altura del header sticky para que el título se vea completo
    await send('Runtime.evaluate', {
      expression: `(() => {
        const card3 = document.querySelectorAll('.card')[2];
        const rect = card3.getBoundingClientRect();
        const headerOffset = 80;
        window.scrollBy({ top: rect.top - headerOffset, behavior: 'instant' });
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const screenPath1 = path.join(workspaceDir, 'audit_b22_seccion3.png');
    const screenPath2 = path.join(artifactDir, 'audit_b22_seccion3.png');
    fs.writeFileSync(screenPath1, Buffer.from(screenshot.data, 'base64'));
    fs.writeFileSync(screenPath2, Buffer.from(screenshot.data, 'base64'));
    console.log('Captura guardada en workspace y artifact dir: audit_b22_seccion3.png');

  } catch (e) {
    console.error('Error durante la verificación:', e);
  } finally {
    chrome.kill();
  }
}

verifyB22();
