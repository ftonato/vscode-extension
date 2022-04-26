import * as vscode from "vscode";
import { ColumnTreeItem } from "../TreeItem";
import { TreeItemCommand } from "../types";
import { updateColumn } from "../xata/xataComponents";
import { ValidationError } from "../xata/xataFetcher";

export const renameColumnCommand: TreeItemCommand<ColumnTreeItem> = {
  id: "xata.renameColumn",
  icon: "edit",
  type: "treeItem",
  action: (context, explorer) => {
    return async (columnTreeItem) => {
      const existingTables = columnTreeItem.table.columns.map((c) => c.name);

      const name = await vscode.window.showInputBox({
        title: `New column name`,
        value: columnTreeItem.column.name,
        validateInput: (value) => {
          const isValid = Boolean(/^[a-zA-Z0-9_-~:]+$/.exec(value));
          if (existingTables.includes(value)) {
            return "column already exists";
          }

          return isValid
            ? undefined
            : "only alphanumerics and '-', '_', or '~' are allowed";
        },
      });

      if (!name) {
        return;
      }

      try {
        await updateColumn({
          baseUrl: context.getBaseUrl(columnTreeItem.workspace.id),
          context,
          pathParams: {
            dbBranchName: `${columnTreeItem.database.name}:${columnTreeItem.branch.name}`,
            tableName: columnTreeItem.table.name,
            columnName: columnTreeItem.column.name,
          },
          body: {
            name,
          },
        });

        return explorer.refresh();
      } catch (e) {
        if (e instanceof ValidationError) {
          return vscode.window.showErrorMessage(e.details);
        }
        if (e instanceof Error) {
          return vscode.window.showErrorMessage(e.message);
        }
      }
    };
  },
};
