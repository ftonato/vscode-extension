import {
  generateSchemaTypes,
  generateFetchers,
} from "@openapi-codegen/typescript";
import { isSchemaObject } from "openapi3-ts";
import { defineConfig } from "@openapi-codegen/cli";
import ts from "typescript";
import { readFile } from "fs/promises";

const { factory: f } = ts;

export default defineConfig({
  xata: {
    from: {
      source: "github",
      owner: "xataio",
      repository: "openapi",
      ref: "main",
      specPath: "bundled/openapi.yaml",
    },
    outputDir: "src/xata",
    to: async (context) => {
      if (
        isSchemaObject(context.openAPIDocument.components!.schemas!.Column) &&
        isSchemaObject(
          context.openAPIDocument.components!.schemas!.Column.properties!.type
        )
      ) {
        const xataColumnTypes = context.openAPIDocument.components!.schemas!
          .Column.properties!.type.enum as string[];

        context.writeFile(
          "xataColumnTypes.ts",
          `// Generated by @openapi-codegen\n\n export const xataColumnTypes = ${JSON.stringify(
            xataColumnTypes
          )}`
        );

        const iconsDeclaration = await generateColumnIcons(xataColumnTypes);

        const printer = ts.createPrinter();

        context.writeFile(
          "xataColumnIcons.ts",
          `// Generated by @openapi-codegen\n import vscode from "vscode";\n\n${printer.printNode(
            ts.EmitHint.Unspecified,
            iconsDeclaration,
            ts.createSourceFile(
              "xataColumnIcons.ts",
              "",
              ts.ScriptTarget.Latest
            )
          )}`
        );
      }

      const filenamePrefix = "xata";
      const { schemasFiles } = await generateSchemaTypes(context, {
        filenamePrefix,
      });
      await generateFetchers(context, {
        filenamePrefix,
        schemasFiles,
      });
    },
  },
});

/**
 * Generate a set of icons compatible with the web extension (vscode.dev).
 *
 * @see https://github.com/microsoft/vscode/issues/141303#issuecomment-1020795448
 *
 * @param icons icon lists
 * @returns variable statement with all the icons inlined
 */
async function generateColumnIcons(icons: string[]) {
  return f.createVariableStatement(
    [f.createModifier(ts.SyntaxKind.ExportKeyword)],
    f.createVariableDeclarationList(
      [
        f.createVariableDeclaration(
          f.createIdentifier("xataColumnIcons"),
          undefined,
          undefined,
          f.createObjectLiteralExpression(
            await Promise.all(
              icons.map(async (icon) =>
                f.createPropertyAssignment(
                  f.createIdentifier(icon),
                  f.createObjectLiteralExpression(
                    [
                      f.createPropertyAssignment(
                        f.createIdentifier("light"),
                        generateIconUri(
                          (
                            await readFile(
                              `media/columns/light/${icon}.svg`,
                              "utf-8"
                            )
                          ).toString()
                        )
                      ),
                      f.createPropertyAssignment(
                        f.createIdentifier("dark"),
                        generateIconUri(
                          (
                            await readFile(
                              `media/columns/dark/${icon}.svg`,
                              "utf-8"
                            )
                          ).toString()
                        )
                      ),
                    ],
                    false
                  )
                )
              )
            ),
            true
          )
        ),
      ],
      ts.NodeFlags.Const
    )
  );
}

function generateIconUri(svg: string) {
  return f.createCallExpression(
    f.createPropertyAccessExpression(
      f.createPropertyAccessExpression(
        f.createIdentifier("vscode"),
        f.createIdentifier("Uri")
      ),
      f.createIdentifier("from")
    ),
    undefined,
    [
      f.createObjectLiteralExpression(
        [
          f.createPropertyAssignment(
            f.createIdentifier("scheme"),
            f.createStringLiteral("data")
          ),
          f.createPropertyAssignment(
            f.createIdentifier("path"),
            f.createStringLiteral(
              `image/svg+xml;utf8,${svg.replace(
                '<?xml version="1.0" encoding="UTF-8"?>',
                ""
              )}`
            )
          ),
        ],
        true
      ),
    ]
  );
}
