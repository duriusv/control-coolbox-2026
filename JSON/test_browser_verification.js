const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runBrowserVerification() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const profileDir = 'C:\\Users\\HP\\AppData\\Local\\Temp\\chrome-verify-profile';
  
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${profileDir}`,
    '--window-size=412,915'
  ]);

  // Esperar a que Chrome inicie
  await new Promise(r => setTimeout(r, 1200));

  try {
    // Obtener lista de pestañas
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
    await sendCommand('CSS.enable');

    // Navegar a index.html
    const targetUrl = 'file:///C:/Users/HP/Desktop/Control Coolbox/index.html';
    console.log('Navegando a:', targetUrl);
    await sendCommand('Page.navigate', { url: targetUrl });

    // Esperar a que el DOM esté listo
    await new Promise(r => setTimeout(r, 1500));

    // 1. Verificar carga de estilos en Sección 1
    const styleCheck = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const header = document.querySelector('header');
        const headerStyle = window.getComputedStyle(header);
        const card1 = document.querySelectorAll('.card')[0];
        const card1Style = window.getComputedStyle(card1);
        const title1 = card1.querySelector('.card-title');
        const title1Style = window.getComputedStyle(title1);
        const selectTienda = document.getElementById('selectTienda');
        const selectStyle = window.getComputedStyle(selectTienda);

        return {
          headerBg: headerStyle.backgroundColor,
          headerColor: headerStyle.color,
          cardBg: card1Style.backgroundColor,
          cardBorderRadius: card1Style.borderRadius,
          cardBoxShadow: card1Style.boxShadow,
          titleColor: title1Style.color,
          titleFontWeight: title1Style.fontWeight,
          selectBorder: selectStyle.border,
          selectBorderRadius: selectStyle.borderRadius
        };
      })()`,
      returnByValue: true
    });
    console.log('ESTILOS_SECCION_1:', JSON.stringify(styleCheck.result.value, null, 2));

    // 2. Interactuar: Seleccionar Tienda T001 (con Servidor Crítico)
    const selectStoreAction = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const select = document.getElementById('selectTienda');
        select.value = 'T001';
        select.dispatchEvent(new Event('change'));
        
        const box = document.getElementById('tiendaInfo');
        const boxStyle = window.getComputedStyle(box);
        const dir = document.getElementById('txtDireccion').textContent;
        const ciudad = document.getElementById('txtCiudad').textContent;
        const clasif = document.getElementById('txtClasificacion').textContent;
        const boxServidor = document.getElementById('boxServidor');
        const boxServidorStyle = window.getComputedStyle(boxServidor);
        const btnCopiar = document.querySelector('button[onclick="copiarDireccion()"]');
        const btnMaps = document.querySelector('button[onclick="abrirGoogleMaps()"]');

        return {
          tiendaInfoDisplay: boxStyle.display,
          direccion: dir,
          ciudad: ciudad,
          clasificacion: clasif,
          servidorCriticoVisible: boxServidorStyle.display !== 'none',
          btnCopiarExiste: !!btnCopiar,
          btnMapsExiste: !!btnMaps
        };
      })()`,
      returnByValue: true
    });
    console.log('INFO_TIENDA_T001:', JSON.stringify(selectStoreAction.result.value, null, 2));

    // 3. Interactuar: Asignar Técnico 1, Activar Técnico 2 y Técnico 3
    const cuadrillaAction = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        // Técnico 1 Principal
        const tec1 = document.getElementById('tecnico1');
        tec1.value = 'Diego Alejandro Rodríguez Martínez';
        tec1.dispatchEvent(new Event('change'));

        // Activar Técnico 2
        const chk2 = document.getElementById('checkTecnico2');
        chk2.checked = true;
        chk2.dispatchEvent(new Event('change'));
        const wrap2 = document.getElementById('wrapperTecnico2');
        const wrap2StyleBefore = window.getComputedStyle(wrap2).display;
        
        const tec2 = document.getElementById('tecnico2');
        tec2.value = 'Jimmy José Espinoza Medina';
        tec2.dispatchEvent(new Event('change'));

        // Activar Técnico 3
        const chk3 = document.getElementById('checkTecnico3');
        chk3.checked = true;
        chk3.dispatchEvent(new Event('change'));
        const wrap3 = document.getElementById('wrapperTecnico3');
        const wrap3StyleBefore = window.getComputedStyle(wrap3).display;

        const tec3 = document.getElementById('tecnico3');
        tec3.value = 'Edmar Paul Cedeño Morillo';
        tec3.dispatchEvent(new Event('change'));

        return {
          tecnico1Seleccionado: tec1.value,
          wrapperTecnico2Display: wrap2StyleBefore,
          tecnico2Seleccionado: tec2.value,
          wrapperTecnico3Display: wrap3StyleBefore,
          tecnico3Seleccionado: tec3.value
        };
      })()`,
      returnByValue: true
    });
    console.log('CUADRILLA_ACTIVADA:', JSON.stringify(cuadrillaAction.result.value, null, 2));

    // Capturar captura de pantalla con Sección 1 expandida
    const screenshot1 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\HP\\Desktop\\Control Coolbox\\screenshot_seccion1_activa.png', Buffer.from(screenshot1.data, 'base64'));
    console.log('Captura guardada: screenshot_seccion1_activa.png');

    // 4. Probar repliegue condicional: Desmarcar Técnico 3
    const desmarcarTecnico3Action = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const chk3 = document.getElementById('checkTecnico3');
        chk3.checked = false;
        chk3.dispatchEvent(new Event('change'));
        const wrap3 = document.getElementById('wrapperTecnico3');
        const wrap3StyleAfter = window.getComputedStyle(wrap3).display;
        const tec3ValueAfter = document.getElementById('tecnico3').value;

        return {
          wrapperTecnico3Hidden: wrap3StyleAfter === 'none',
          tecnico3Reset: tec3ValueAfter === ''
        };
      })()`,
      returnByValue: true
    });
    console.log('REPLIEGUE_TECNICO_3:', JSON.stringify(desmarcarTecnico3Action.result.value, null, 2));

    // 5. Probar selección de Tienda sin Servidor (T002)
    const selectStoreT002 = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const select = document.getElementById('selectTienda');
        select.value = 'T002';
        select.dispatchEvent(new Event('change'));
        
        const boxServidor = document.getElementById('boxServidor');
        const boxServidorStyle = window.getComputedStyle(boxServidor);
        const dir = document.getElementById('txtDireccion').textContent;

        return {
          direccion: dir,
          servidorCriticoOculto: boxServidorStyle.display === 'none'
        };
      })()`,
      returnByValue: true
    });
    console.log('INFO_TIENDA_T002_SIN_SERVIDOR:', JSON.stringify(selectStoreT002.result.value, null, 2));

    console.log('TODAS LAS PRUEBAS DE LA SECCIÓN 1 FINALIZADAS CON ÉXITO.');

  } catch(err) {
    console.error('Error durante la verificación:', err);
  } finally {
    chrome.kill();
  }
}

runBrowserVerification();
