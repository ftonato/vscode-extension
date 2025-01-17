import * as vscode from "vscode";
import { createTreeItemCommand } from "../types";
import { slugify } from "../utils";
import { updateWorkspace } from "../xata/xataComponents";

export const renameWorkspaceCommand = createTreeItemCommand({
  id: "renameWorkspace",
  title: "Rename workspace",
  contexts: [
    {
      item: "workspace",
      view: "xataExplorer",
    },
  ],
  icon: "edit",
  action: (context, refresh) => {
    return async (workspaceTreeItem) => {
      const name = await vscode.window.showInputBox({
        title: `New workspace name`,
        value: workspaceTreeItem.workspace.name,
      });

      if (!name) {
        return;
      }

      await updateWorkspace({
        baseUrl: context.getBaseUrl(workspaceTreeItem.workspace.id),
        context,
        pathParams: {
          workspaceId: workspaceTreeItem.workspace.id,
        },
        body: {
          name,
          slug: slugify(name),
        },
      });

      return refresh();
    };
  },
});
