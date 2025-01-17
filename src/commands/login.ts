import * as vscode from "vscode";
import crypto from "../CryptoAdapter";
import { Command } from "../types";
import { Context } from "../context";

/**
 * Command to login through the UI.
 */
export const loginCommand: Command<string> = {
  id: "login",
  title: "Login",
  paletteCondition: "isNotLogged",
  type: "global",
  inPalette: true,
  action(context) {
    return async (commandId?: string) => {
      const openURL = await generateURL(context);
      vscode.commands.executeCommand(
        "vscode.open",
        vscode.Uri.parse(openURL).toString(true) +
          (commandId ? encodeURIComponent(`&commandId=${commandId}`) : "")
      );
    };
  },
};

/**
 * Generate the xata url to create a new api key.
 *
 * @param context
 * @returns
 */
async function generateURL(context: Context) {
  const redirect = await vscode.env.asExternalUri(
    vscode.Uri.parse(`${vscode.env.uriScheme}://xata.xata`)
  );

  await crypto.generateKeys();
  const pub = await crypto.getPublicKey();

  return `${context.getAppBaseUrl()}/new-api-key?pub=${encodeURIComponent(
    pub
  )}&name=${encodeURIComponent(
    "Xata VSCode extension"
  )}&redirect=${encodeURIComponent(redirect.toString())}`;
}
