'use strict';
const remote = require("@electron/remote/main");
const electron = require('electron');
const shell = electron.shell;
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const Menu = electron.Menu;
let mainWindow;
var path = require("path");
remote.initialize();
var iconpath = path.join(__dirname, "icon.png");
var injectScripts = `
var remote = require("@electron/remote");
const ipcRenderer = require('electron').ipcRenderer;
window.alert=function(title, val){ipcRenderer.sendSync('alert', {title, val});};
window.confirm=function(title, val){return ipcRenderer.sendSync('confirm', {title, val});};
window.prompt=function(title, val){return ipcRenderer.sendSync('prompt', {title, val});};
window.open = function (url) {return ipcRenderer.sendSync('windowOpen', url);};
window.GM2Dekstop = true;
var temp_beforeunload = null;
setInterval(() => {
	if (window.onbeforeunload && !temp_beforeunload) {
		temp_beforeunload = window.onbeforeunload;
		window.onbeforeunload = undefined;
	}
	if (temp_beforeunload) {
		var evnt = {};
		window.onbeforeunload = undefined;
		if (temp_beforeunload(evnt)) {
			ipcRenderer.send('confirmbeforeclosing', true);
		} else {
			ipcRenderer.send('confirmbeforeclosing', false);
		}
	}
},1000/30);
(function () {
	var oldCreateElement = document.createElement;
	document.createElement = function (type) {
		var element = oldCreateElement.apply(document, [type]);
		if (type.toLowerCase() == "a") {
			element.addEventListener('click',function (e) {
				e.preventDefault();
				window.open(this.href);
			});
		}
		return element;
	};
})();
`;
var devtools = false;
if (process.argv.indexOf("--devmode") > -1) {
    devtools = true;
}
async function createWindow() {
    if (devtools) {
        Menu.setApplicationMenu(Menu.buildFromTemplate([{
                        label: 'Devlopment',
                        submenu: [{
                                label: "Open DevTools",
                                click: async(menuitem, window) => {
                                    window.openDevTools();
                                }
                            }, {
                                label: "Reload",
                                click: async(menuitem, window) => {
                                    window.reload();
                                }
                            }, {
                                label: "Close",
                                click: async(menuitem, window) => {
                                    window.close();
                                }
                            }, {
                                label: "Open New Window",
                                click: async(menuitem, window) => {
                                    gvbsonicWindow();
                                }
                            }

                        ]
                    }
                ]))
    } else {
        Menu.setApplicationMenu(Menu.buildFromTemplate([]));
    }
    mainWindow = new BrowserWindow({
        resizable: true,
        width: 1500,
        height: 600,
        title: "Gvbvdxx Mod 2",
        icon: iconpath,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    await mainWindow.loadFile("gui/editor.html");

    mainWindow.webContents.executeJavaScript(injectScripts);
    remote.enable(mainWindow.webContents);

    var promptResponse;
	var confirm = false;
	ipcMain.on('confirmbeforeclosing', async function (eventRet, value) {
		if (value) {
			confirm = true;
		} else {
			confirm = false;
		}
	})
	mainWindow.on('close', function(e) {
	  if (confirm) {
		  const choice = require('electron').dialog.showMessageBoxSync(this,
			{
			  type: 'question',
			  buttons: ['Yes', 'No'],
			  title: 'You sure?',
			  message: 'Are you sure you want to quit? Your changes are not saved.'
			});
		  if (choice === 1) {
			e.preventDefault();
		  }
	  }
	});
    ipcMain.on('windowOpen', async function (eventRet, url) {
        if (url.startsWith("http://") || url.startsWith("https://")) {
            await shell.openExternal(url);
            eventRet.returnValue = undefined;
        } else {
            var win = new BrowserWindow({
                resizable: true,
                width: 500,
                height: 500,
                title: "Loading...",
                icon: iconpath,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false
                }
            });
            await win.loadFile(path.join("gui", url));
            eventRet.returnValue = undefined;
        }
    });
    ipcMain.on('prompt', function (eventRet, arg) {
        promptResponse = null
            var promptWindow = new BrowserWindow({
                width: 400,
                height: 200,
                show: false,
                resizable: false,
                movable: false,
                alwaysOnTop: true,
                frame: false,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false
                }
            })
            arg.val = arg.val || ''
            const promptHtml = '<h3 for="val">' + arg.title + '</h3>\
            <input id="val" value="' + arg.val + '" autofocus />\
            <button onclick="require(\'electron\').ipcRenderer.send(\'prompt-response\', document.getElementById(\'val\').value);window.close()">Ok</button>\
            <button onclick="window.close()">Cancel</button>\
            <style>body {font-family: sans-serif;margin: 0 auto;text-align: center;}</style>'
            promptWindow.loadURL('data:text/html,' + promptHtml)
            promptWindow.show()
            promptWindow.on('closed', function () {
                eventRet.returnValue = promptResponse
                    promptWindow = null
            });
    });
    ipcMain.on('prompt-response', function (event, arg) {
        if (arg === '') {
            arg = null
        }
        promptResponse = arg
    });
	ipcMain.on('alert', function (eventRet, arg) {
        promptResponse = false
            var promptWindow = new BrowserWindow({
                width: 400,
                height: 200,
                show: false,
                resizable: false,
                movable: false,
                alwaysOnTop: true,
                frame: false,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false
                }
            })
            arg.val = arg.val || ''
            const promptHtml = '<h3 for="val">' + arg.title + '</h3>\
            <button onclick="require(\'electron\').ipcRenderer.send(\'alert-response\', true);window.close()">Ok</button>\
            <style>body {font-family: sans-serif;margin: 0 auto;text-align: center;}</style>'
            promptWindow.loadURL('data:text/html,' + promptHtml)
            promptWindow.show()
            promptWindow.on('closed', function () {
                eventRet.returnValue = promptResponse
                    promptWindow = null
            });
    });
    ipcMain.on('alert-response', function (event, arg) {
        if (arg === '') {
            arg = false
        }
        promptResponse = arg
    });
	ipcMain.on('confirm', function (eventRet, arg) {
        promptResponse = false
            var promptWindow = new BrowserWindow({
                width: 400,
                height: 200,
                show: false,
                resizable: false,
                movable: false,
                alwaysOnTop: true,
                frame: false,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false
                }
            })
            arg.val = arg.val || ''
            const promptHtml = '<h3 for="val">' + arg.title + '</h3>\
            <button onclick="require(\'electron\').ipcRenderer.send(\'confirm-response\', true);window.close()">Ok</button>\
            <button onclick="require(\'electron\').ipcRenderer.send(\'confirm-response\', false);window.close()">Cancel</button>\
            <style>body {font-family: sans-serif;margin: 0 auto;text-align: center;}</style>'
            promptWindow.loadURL('data:text/html,' + promptHtml)
            promptWindow.show()
            promptWindow.on('closed', function () {
                eventRet.returnValue = promptResponse
                    promptWindow = null
            });
    });
    ipcMain.on('confirm-response', function (event, arg) {
        if (arg === '') {
            arg = false
        }
        promptResponse = arg
    });
	app.setAsDefaultProtocolClient('gvbmod2', process.execPath, [path.resolve(process.argv[1])])
}
app.on('ready', createWindow);
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});
