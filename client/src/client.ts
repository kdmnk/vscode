import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export async function get_client(context: ExtensionContext): Promise<LanguageClient> {
    let clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'erlang' }],
        synchronize: {
            fileEvents: [
                workspace.createFileSystemWatcher('**/rebar.config'),
                workspace.createFileSystemWatcher('**/rebar.lock')
            ]
        }
    };

    //let serverPath = workspace.getConfiguration('wrangler_ls').serverPath;
    //if (serverPath === "") {
        let serverPath = context.asAbsolutePath(
            path.join('erlang_ls', '_build', 'default', 'bin', 'erlang_ls')
        );
    //};

    let logLevel = workspace.getConfiguration('wrangler_ls').logLevel;

    let serverArgs = [ serverPath, "--transport", "stdio", "--log-level", "info" ];

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
        'erlang_ls',
        'Erlang LS',
        serverOptions,
        clientOptions
    );
}
