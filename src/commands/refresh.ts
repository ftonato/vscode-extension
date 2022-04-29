import { Command } from "../types";

/**
 * Command to refresh the schema tree
 */
export const refreshCommand: Command = {
  id: "refresh",
  type: "global",
  icon: "refresh",
  inPalette: true,
  action: (context, explorer, jsonSchemaProvider) => () => {
    context.setOffline(false);
    jsonSchemaProvider.refresh();
    explorer.refresh();
  },
};
