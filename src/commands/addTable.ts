import * as vscode from "vscode";
import { createTreeItemCommand } from "../types";
import { createTable, getBranchDetails } from "../xata/xataComponents";
import { ValidationError } from "../xata/xataFetcher";
import { validateResourceName } from "../utils";

export const addTableCommand = createTreeItemCommand({
  id: "addTable",
  title: "Add table",
  icon: "empty-window",
  contexts: [
    {
      item: "oneBranchDatabase",
      view: "xataExplorer",
      group: "inline",
    },
    {
      item: "branch",
      view: "xataExplorer",
      group: "inline",
    },
    {
      item: "vscodeWorkspace",
      view: "xataProject",
      group: "inline",
    },
    {
      item: "workspaceNavigationItem",
    },
  ],
  action: (context, refresh) => {
    return async (treeItem) => {
      let baseUrl = "";
      let dbBranchName = "";
      let token: string | undefined = undefined;

      if (!treeItem) {
        if (
          !vscode.workspace.workspaceFolders ||
          vscode.workspace.workspaceFolders.length > 1
        ) {
          throw new Error(
            "[dev] This action should not be available when the user have multiple workspaces opened"
          );
        }
        const config = await context.getVSCodeWorkspaceEnvConfig(
          vscode.workspace.workspaceFolders[0].uri
        );
        if (!config) {
          return;
        }

        baseUrl = config.baseUrl;
        dbBranchName = `${config.databaseName}:${config.branch}`;
        token = config.apiKey;
      } else if (treeItem.contextValue === "vscodeWorkspace") {
        const config = await context.getVSCodeWorkspaceEnvConfig(
          treeItem.workspaceFolder.uri
        );

        if (!config) {
          return;
        }
        baseUrl = config.baseUrl;
        dbBranchName = `${config.databaseName}:${config.branch}`;
        token = config.apiKey;
      } else {
        baseUrl = context.getBaseUrl(treeItem.workspaceId);
        dbBranchName = `${treeItem.databaseName}:${treeItem.branchName}`;
      }

      const branchDetails = await getBranchDetails({
        baseUrl,
        context: context,
        token,
        pathParams: {
          dbBranchName,
        },
      });

      if (!branchDetails.success) {
        throw new Error(branchDetails.error.payload.message);
      }

      const { schema } = branchDetails.data;
      const existingTables = schema.tables.map((t) => t.name);

      const name = await vscode.window.showInputBox({
        prompt: "Enter the name of your table",
        title: "Table name",
        validateInput: validateResourceName("table", existingTables),
      });

      if (!name) {
        return;
      }

      try {
        await createTable({
          baseUrl,
          context,
          token,
          pathParams: {
            dbBranchName,
            tableName: name,
          },
        });

        return refresh();
      } catch (e) {
        if (e instanceof ValidationError) {
          vscode.window.showErrorMessage(e.details);
          return;
        }
        if (e instanceof Error) {
          vscode.window.showErrorMessage(e.message);
          return;
        }
      }
    };
  },
});
