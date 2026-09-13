const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runAudit() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const profileDir = 'C:\\Users\\HP\\AppData\\Local\\Temp\\chrome-audit-profile';
  const artifactDir = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\af91634b-dd04-4667-b8ce-62d5410b4091';
  const workspaceDir = 'C:\\Users\\HP\\Desktop\\Control Coolbox';

  // Asegurar directorios
  if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${profileDir}`,
    '--window-size=412,1200'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const targetsRes = await fetch('http://127.0.0.1:9222/json');
    const targets = await targetsRes.json();
    let pageTarget = targets.find(t => t.type === 'page');

    if (!pageTarget) {
      const newPageRes = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' });
      pageTarget = await newPageRes.json();
    }

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let idCounter = 1;
    const pendingPromises = new Map();

    function sendCommand(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = idCounter++;
        pendingPromises.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pendingPromises.has(msg.id)) {
        const { resolve, reject } = pendingPromises.get(msg.id);
        pendingPromises.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    await new Promise((resolve) => {
      ws.onopen = resolve;
    });

    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');
    await sendCommand('DOM.enable');

    const targetUrl = 'file:///C:/Users/HP/Desktop/Control Coolbox/index.html';
    console.log('Navegando a:', targetUrl);
    await sendCommand('Page.navigate', { url: targetUrl });
    await new Promise(r => setTimeout(r, 1200));

    // Limpiar localStorage previo para evitar contaminación de pruebas
    await sendCommand('Runtime.evaluate', {
      expression: `localStorage.clear()`
    });

    // Recargar página para asegurar inicio limpio con catálogo local
    await sendCommand('Page.navigate', { url: targetUrl });
    await new Promise(r => setTimeout(r, 1200));

    // ==========================================
    // AUDITORÍA PASO 1: SELECCIONAR TIENDA B11
    // ==========================================
    console.log('--- INICIANDO AUDITORÍA TIENDA B11 ---');
    const auditB11 = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const select = document.getElementById('selectTienda');
        select.value = 'B11';
        select.dispatchEvent(new Event('change'));

        const boxInfo = document.getElementById('tiendaInfo');
        const boxInfoDisplay = window.getComputedStyle(boxInfo).display;
        const dir = document.getElementById('txtDireccion').textContent;
        const ciudad = document.getElementById('txtCiudad').textContent;
        const badgeClasif = document.querySelector('#txtClasificacion .badge-clasif');
        const clasifText = badgeClasif ? badgeClasif.textContent : '';
        const clasifClass = badgeClasif ? badgeClasif.className : '';
        const equiposAsignados = document.getElementById('txtEquiposAsignados').textContent;
        const boxServidor = document.getElementById('boxServidor');
        const boxServidorDisplay = window.getComputedStyle(boxServidor).display;

        // Estaciones generadas
        const contenedor = document.getElementById('contenedorEstacionesMantenimiento');
        const estaciones = contenedor.querySelectorAll('.station-box');
        const contadorTag = document.getElementById('contadorEstacionesTag').textContent;

        const estacionesData = Array.from(estaciones).map((est, idx) => {
          const title = est.querySelector('.station-title span').textContent;
          const aio = !!est.querySelector('#check_aio_' + (idx + 1));
          const tick = !!est.querySelector('#check_tick_' + (idx + 1));
          const lec = !!est.querySelector('#check_lec_' + (idx + 1));
          const gav = !!est.querySelector('#check_gav_' + (idx + 1));
          return { title, aio, tick, lec, gav };
        });

        return {
          tiendaSeleccionada: select.value,
          tiendaInfoDisplay: boxInfoDisplay,
          direccion: dir,
          ciudad: ciudad,
          clasificacion: clasifText,
          clasificacionClass: clasifClass,
          equiposAsignados: equiposAsignados,
          servidorVisible: boxServidorDisplay !== 'none',
          totalEstacionesRenderizadas: estaciones.length,
          contadorTag: contadorTag,
          estaciones: estacionesData
        };
      })()`,
      returnByValue: true
    });

    console.log('RESULTADO_B11:', JSON.stringify(auditB11.result.value, null, 2));

    // Capturar pantalla B11 cabecera
    const screenB11 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(workspaceDir, 'audit_b11_1estacion.png'), Buffer.from(screenB11.data, 'base64'));
    fs.writeFileSync(path.join(artifactDir, 'audit_b11_1estacion.png'), Buffer.from(screenB11.data, 'base64'));

    // Capturar pantalla B11 Sección 3 (Estación única Caja 01)
    await sendCommand('Runtime.evaluate', {
      expression: `document.getElementById('contenedorEstacionesMantenimiento').scrollIntoView({ behavior: 'instant' })`
    });
    await new Promise(r => setTimeout(r, 600));
    const screenB11Sec3 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(workspaceDir, 'audit_b11_seccion3.png'), Buffer.from(screenB11Sec3.data, 'base64'));
    fs.writeFileSync(path.join(artifactDir, 'audit_b11_seccion3.png'), Buffer.from(screenB11Sec3.data, 'base64'));
    console.log('Capturas B11 guardadas con éxito.');

    // ==========================================
    // AUDITORÍA PASO 2: SELECCIONAR TIENDA B57
    // ==========================================
    console.log('--- INICIANDO AUDITORÍA TIENDA B57 ---');
    const auditB57 = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const select = document.getElementById('selectTienda');
        select.value = 'B57';
        select.dispatchEvent(new Event('change'));

        const boxInfo = document.getElementById('tiendaInfo');
        const boxInfoDisplay = window.getComputedStyle(boxInfo).display;
        const dir = document.getElementById('txtDireccion').textContent;
        const ciudad = document.getElementById('txtCiudad').textContent;
        const badgeClasif = document.querySelector('#txtClasificacion .badge-clasif');
        const clasifText = badgeClasif ? badgeClasif.textContent : '';
        const clasifClass = badgeClasif ? badgeClasif.className : '';
        const clasifStyle = badgeClasif ? window.getComputedStyle(badgeClasif).backgroundColor : '';
        const equiposAsignados = document.getElementById('txtEquiposAsignados').textContent;
        const boxServidor = document.getElementById('boxServidor');
        const boxServidorDisplay = window.getComputedStyle(boxServidor).display;

        // Estaciones generadas dinámicamente
        const contenedor = document.getElementById('contenedorEstacionesMantenimiento');
        const estaciones = contenedor.querySelectorAll('.station-box');
        const contadorTag = document.getElementById('contadorEstacionesTag').textContent;

        const estacionesData = Array.from(estaciones).map((est, idx) => {
          const num = idx + 1;
          const title = est.querySelector('.station-title span').textContent;
          const selectEstado = est.querySelector('#estacion_estado_' + num);
          const chkAio = est.querySelector('#check_aio_' + num);
          const chkTick = est.querySelector('#check_tick_' + num);
          const chkLec = est.querySelector('#check_lec_' + num);
          const chkGav = est.querySelector('#check_gav_' + num);

          return {
            numeroEstacion: num,
            titulo: title,
            selectEstadoExiste: !!selectEstado,
            checkAioExiste: !!chkAio,
            checkTickExiste: !!chkTick,
            checkLecExiste: !!chkLec,
            checkGavExiste: !!chkGav
          };
        });

        return {
          tiendaSeleccionada: select.value,
          tiendaInfoDisplay: boxInfoDisplay,
          direccion: dir,
          ciudad: ciudad,
          clasificacion: clasifText,
          clasificacionClass: clasifClass,
          clasificacionBgColor: clasifStyle,
          equiposAsignados: equiposAsignados,
          servidorVisible: boxServidorDisplay !== 'none',
          totalEstacionesRenderizadas: estaciones.length,
          contadorTag: contadorTag,
          estaciones: estacionesData
        };
      })()`,
      returnByValue: true
    });

    console.log('RESULTADO_B57:', JSON.stringify(auditB57.result.value, null, 2));

    // Capturar pantalla B57 completa (cabecera + info + estaciones)
    const screenB57 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const b57Path1 = path.join(workspaceDir, 'audit_b57_4estaciones.png');
    const b57Path2 = path.join(artifactDir, 'audit_b57_4estaciones.png');
    fs.writeFileSync(b57Path1, Buffer.from(screenB57.data, 'base64'));
    fs.writeFileSync(b57Path2, Buffer.from(screenB57.data, 'base64'));

    // Desplazar (scroll) hacia Sección 3 para capturar en detalle las 4 estaciones
    await sendCommand('Runtime.evaluate', {
      expression: `document.getElementById('contenedorEstacionesMantenimiento').scrollIntoView({ behavior: 'instant' })`
    });
    await new Promise(r => setTimeout(r, 600));

    const screenB57Detail = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const b57DetPath1 = path.join(workspaceDir, 'audit_b57_detalle_estaciones.png');
    const b57DetPath2 = path.join(artifactDir, 'audit_b57_detalle_estaciones.png');
    fs.writeFileSync(b57DetPath1, Buffer.from(screenB57Detail.data, 'base64'));
    fs.writeFileSync(b57DetPath2, Buffer.from(screenB57Detail.data, 'base64'));

    console.log('Todas las capturas de B57 guardadas con éxito.');
    console.log('AUDITORÍA AUTOMATIZADA CONCLUIDA SATISFACTORIAMENTE.');

  } catch (err) {
    console.error('Error durante la auditoría:', err);
  } finally {
    chrome.kill();
  }
}

runAudit();
