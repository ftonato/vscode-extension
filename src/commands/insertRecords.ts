import * as vscode from "vscode";
import { jsonc } from "jsonc";
import { Command } from "../types";
import { bulkInsertTableRecords } from "../xata/xataComponents";

/**
 * Command to insert a record from a json
 */
export const insertRecordsCommand: Command = {
  id: "insertRecords",
  type: "global",
  inPalette: true,
  action: (context) => {
    return async () => {
      if (!vscode.window.activeTextEditor) {
        return;
      }

      const rawText = vscode.window.activeTextEditor.document.getText();
      try {
        const document = jsonc.parse(rawText);
        if (
          typeof document !== "object" ||
          typeof document.$schema !== "string" ||
          !document.$schema.startsWith("xata:")
        ) {
          vscode.window.showErrorMessage(
            `You need to have a "$schema": "xata:workspace/db/branch/table"`
          );
          return;
        }

        const { $schema, records } = document;

        if (!Array.isArray(records)) {
          vscode.window.showErrorMessage(`"records" must be an array`);
          return;
        }

        const [workspaceId, databaseName, branchName, tableName] = $schema
          .replace(/^xata:/, "") // scheme
          .replace(/\?.*$/, "") // query
          .split("/");

        // Retrieve config from `?workspace={index}`
        let config: { baseUrl: string; apiKey: string } | undefined = undefined;
        const queryExecArray = /\?workspace=(\d)$/.exec($schema);
        if (queryExecArray && vscode.workspace.workspaceFolders) {
          const workspaceIndex = parseInt(queryExecArray[1]);
          config = await context.getVSCodeWorkspaceEnvConfig(
            vscode.workspace.workspaceFolders[workspaceIndex].uri
          );
        }

        if (!workspaceId || !databaseName || !branchName || !tableName) {
          vscode.window.showErrorMessage(
            `You need to have a "$schema": "xata:workspace/db/branch/table"`
          );
          return;
        }

        try {
          const res = await bulkInsertTableRecords({
            baseUrl: config?.baseUrl ?? context.getBaseUrl(workspaceId),
            token: config?.apiKey,
            context,
            pathParams: {
              dbBranchName: `${databaseName}:${branchName}`,
              tableName,
            },
            body: {
              records,
            },
          });

          if (res.success) {
            vscode.window.showInformationMessage(
              `${res.data.recordIDs.length} record${
                res.data.recordIDs.length > 1 ? "s" : ""
              } inserted in ${$schema.replace(/^xata:/, "")} 🥳`
            );
          } else if (res.error.status === 400) {
            // TODO: Improve error feedback
            vscode.window.showErrorMessage(
              "The records can't be inserted - Reason: " +
                res.error.payload.errors
                  .map((i) => i.message ?? "Unknown error")
                  .join(", ")
            );
          } else {
            throw new Error(res.error.payload.message);
          }
        } catch (e) {
          if (e instanceof Error) {
            vscode.window.showErrorMessage(
              "The records can't be inserted - Reason: " + e.message
            );
          }
        }
      } catch {
        vscode.window.showErrorMessage("The current document is not a valid");
      }
    };
  },
};