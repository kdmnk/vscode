import * as path from 'path';
import { ExtensionContext } from 'vscode';


import {
    LanguageClient,
} from 'vscode-languageclient';

import { get_client } from './client';

let client: LanguageClient;

export async function activate(context: ExtensionContext) {

    client = await get_client(context),
    client.start();
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
