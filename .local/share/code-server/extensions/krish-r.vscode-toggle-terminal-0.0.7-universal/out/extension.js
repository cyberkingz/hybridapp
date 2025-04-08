"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const os = require("os");
const vscode = require("vscode");
let statusBarItem;
let disposable;
let isTerminalVisible = false;
let listNames = false;
function activate({ subscriptions }) {
    const extensionName = "vscode-toggle-terminal";
    const commandId = `${extensionName}.toggleTerminal`;
    subscriptions.push((disposable = vscode.commands.registerCommand(commandId, () => {
        // Create a terminal if it does not already exist
        if (vscode.window.terminals.length === 0) {
            isTerminalVisible = false;
            vscode.window.createTerminal();
        }
        toggleTerminal();
    })));
    const conf = vscode.workspace.getConfiguration(extensionName);
    const alignment = conf.get("alignment") === "right"
        ? vscode.StatusBarAlignment.Right
        : vscode.StatusBarAlignment.Left;
    const priority = conf.get("priority");
    listNames = conf.get("listNames") || false;
    statusBarItem = vscode.window.createStatusBarItem(alignment, priority);
    statusBarItem.command = commandId;
    statusBarItem.name = "Toggle Terminal";
    statusBarItem.text = `$(terminal) ${vscode.window.terminals.length}`;
    statusBarItem.tooltip = listTerminalNames();
    statusBarItem.show();
    subscriptions.push(statusBarItem);
    vscode.window.onDidChangeTerminalState(() => {
        statusBarItem.text = `$(terminal) ${vscode.window.terminals.length}`;
        statusBarItem.tooltip = listTerminalNames();
    });
    vscode.window.onDidChangeActiveTerminal(() => {
        statusBarItem.text = `$(terminal) ${vscode.window.terminals.length}`;
        statusBarItem.tooltip = listTerminalNames();
    });
    vscode.window.onDidOpenTerminal(async () => {
        statusBarItem.text = `$(terminal) ${vscode.window.terminals.length}`;
        await sleep(500);
        statusBarItem.tooltip = listTerminalNames();
    });
    vscode.window.onDidCloseTerminal(() => {
        statusBarItem.text = `$(terminal) ${vscode.window.terminals.length}`;
        statusBarItem.tooltip = listTerminalNames();
    });
    vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(`${extensionName}`)) {
            reloadWindow();
        }
    });
}
exports.activate = activate;
function deactivate({ subscriptions }) {
    statusBarItem?.hide();
    disposable?.dispose();
}
exports.deactivate = deactivate;
function toggleTerminal() {
    let activeTerminal = vscode.window.activeTerminal;
    if (isTerminalVisible) {
        activeTerminal?.hide();
        isTerminalVisible = false;
    }
    else {
        // activeTerminal is undefined until its accessed. In such cases, try to show the first terminal
        if (activeTerminal !== undefined) {
            activeTerminal.show();
        }
        else {
            vscode.window.terminals[0]?.show();
        }
        isTerminalVisible = true;
    }
    statusBarItem.tooltip = listTerminalNames();
}
function reloadWindow() {
    const msg = "Toggle Terminal (Extension) configuration change detected - Please Reload.";
    const action = "Reload Window";
    const alternateAction = "Dismiss";
    vscode.window
        .showInformationMessage(msg, action, alternateAction)
        .then((selectedAction) => {
        if (selectedAction === action) {
            vscode.commands.executeCommand("workbench.action.reloadWindow");
        }
    });
}
function listTerminalNames() {
    let defaultValue = "Toggle Terminal";
    if (!listNames) {
        return defaultValue;
    }
    let terminals = vscode.window.terminals;
    if (terminals.length === 0) {
        return defaultValue;
    }
    return new vscode.MarkdownString(terminals
        .map((t) => t.name)
        .filter((name) => name.trim() !== "")
        .map((name) => `$(terminal) ${name}`)
        .join(`${os.EOL}${os.EOL}`), true);
}
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=extension.js.map