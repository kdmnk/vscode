import * as path from 'path';
import { workspace, ExtensionContext, window as Window } from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

let commandsAddAtom:Array<string> = ["rename-fun", "rename-mod", "extract-fun", "copy-mod", "new-macro"];
let commandsAddVar:Array<string> = ["generalise-fun", "new-var"];
let commandsAddFilePath:Array<string> = ["move-fun"];

export async function get_client(context: ExtensionContext): Promise<LanguageClient> {
    let clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'erlang' }],
        synchronize: {
            fileEvents: [
                workspace.createFileSystemWatcher('**/rebar.config'),
                workspace.createFileSystemWatcher('**/rebar.lock')
            ]
        },
        middleware: {
			executeCommand: async (command, args, next) => {
                let commandName : string = command.split(':')[1];
                if(commandsAddAtom.includes(commandName)) {
                    const selected = await Window.showInputBox({placeHolder:"New name", validateInput: (value) => {
                        if (value.length < 1) {
                            return "Name must be at least 1 character long";
                        }
                        if (!/^[a-z][\_a-zA-Z0-9\@]*$/.test(value)) { //TODO quoted atoms
                            return "Name must be a valid atom"; 
                        }
                        return null;
                    }});
                    if (selected === undefined) {
                        return next(command, args);
                    }
                    args = args.slice(0);
                    args.push(selected);
                    
                }
                if(commandsAddVar.includes(commandName)) {
                    const selected = await Window.showInputBox({placeHolder:"New name", validateInput: (value) => {
                        if (value.length < 1) {
                            return "Name must be at least 1 character long";
                        }
                        if (!/^[A-Z][\_a-zA-Z0-9\@]*$/.test(value)) { //TODO check
                            return "Name must be a valid variable name"; 
                        }
                        return null;
                    }});
                    if (selected === undefined) {
                        return next(command, args);
                    }
                    args = args.slice(0);
                    args.push(selected);   
                }
                if(commandsAddFilePath.includes(commandName)) {
                    const selected = await Window.showOpenDialog({canSelectFiles: true, canSelectFolders: false, canSelectMany: false});
                    if (selected === undefined) {
                        return next(command, args);
                    }
                    args = args.slice(0);
                    args.push(selected[0].fsPath);
                }
                return next(command, args);
			}
		}
    };

    let serverPath = workspace.getConfiguration('wrangler_ls').serverPath;
    if (serverPath === "") {
        serverPath = context.asAbsolutePath(
            path.join('erlang_ls', '_build', 'default', 'bin', 'erlang_ls')
        );
    };

    let logLevel = workspace.getConfiguration('wrangler_ls').logLevel;

    let serverArgs = [ serverPath, "--transport", "stdio", "--log-level", logLevel]
    
    let wranglerPath = workspace.getConfiguration('wrangler_ls').wranglerPath;
    if(wranglerPath !== "") {
        serverArgs.push("--wrangler-dir", wranglerPath);
    }

    let logPath = workspace.getConfiguration('wrangler_ls').logPath;
    if (logPath !== "") {
        serverArgs.push("--log-dir", logPath);
    }

    let serverOptions: ServerOptions = {
        command: 'escript',
        args: serverArgs,
        transport: TransportKind.stdio
    };

    return new LanguageClient(
        'wrangler_ls',
        'Wrangler LS',
        serverOptions,
        clientOptions
    );
}
