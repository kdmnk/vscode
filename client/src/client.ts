import * as path from 'path';
import { workspace, ExtensionContext, window as Window } from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient';

let client: LanguageClient;

let commandsAddAtom:Array<string> = ["rename-fun", "rename-mod", "extract-fun", "copy-mod"];
let commandsAddVar:Array<string> = ["generalise-fun"];

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
                return next(command, args);
			}
		}
    };

    let serverPath = workspace.getConfiguration('erlang_ls').serverPath;
    if (serverPath === "") {
        serverPath = context.asAbsolutePath(
            path.join('erlang_ls', '_build', 'default', 'bin', 'erlang_ls')
        );
    };

    let logLevel = workspace.getConfiguration('erlang_ls').logLevel;

    let serverArgs = [ serverPath, "--transport", "stdio", "--log-level", logLevel ];

    let logPath = workspace.getConfiguration('erlang_ls').logPath;
    if (logPath !== "") {
        serverArgs.push("--log-dir", logPath);
    }

    let serverOptions: ServerOptions = {
        command: 'escript',
        args: serverArgs,
        transport: TransportKind.stdio
    };

    return new LanguageClient(
        'erlang_ls',
        'Erlang LS',
        serverOptions,
        clientOptions
    );
}
