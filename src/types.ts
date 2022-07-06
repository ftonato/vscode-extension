import { Codicon } from "./codicon";
import { Context } from "./context";
import { TreeItem } from "./views/treeItems/TreeItem";
import { XataJsonSchemaProvider } from "./xataJsonSchemaProvider";

export type RefreshAction = (scope?: "explorer" | "workspace") => void;

/**
 * Global VSCode command.
 */
export type Command = {
  id: string;
  type: "global";
  /**
   * Icon
   * @see https://microsoft.github.io/vscode-codicons/dist/codicon.html
   */
  icon?: Codicon;
  inPalette?: boolean;
  action: (
    context: Context,
    refresh: RefreshAction,
    jsonSchemaProvider: XataJsonSchemaProvider
  ) => () => void;
};

/**
 * TreeItem command.
 *
 * - Assign to one TreeItem
 * - Not visible from the command palette
 */
export type TreeItemCommand<T extends TreeItem | undefined, U = void> = {
  id: string;
  type: "treeItem";
  /**
   * Icon
   * @see https://microsoft.github.io/vscode-codicons/dist/codicon.html
   */
  icon: Codicon;
  views: ("xataExplorer" | "xataWorkspace")[];
  action: (
    context: Context,
    refresh: RefreshAction,
    jsonSchemaProvider: XataJsonSchemaProvider
  ) => (treeItem: T) => Promise<U>;
};

/**
 * Stand alone command.
 *
 * Can be triggered from welcome views, treeItem.command or programmatically
 */
export type StandAloneCommand<T extends TreeItem | undefined, U = void> = {
  id: string;
  type: "standAlone";

  action: (
    context: Context,
    refresh: RefreshAction,
    jsonSchemaProvider: XataJsonSchemaProvider
  ) => (treeItem: T) => Promise<U>;
};

export interface XataTablePath {
  workspaceId: string;
  databaseName: string;
  branchName: string;
  tableName: string;
}

// Trigger from the top view navigation level
export type WorkspaceNavigationItem = undefined;
