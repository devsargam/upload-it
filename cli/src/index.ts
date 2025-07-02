#!/usr/bin/env node
import { cac } from "cac";
import { registerUploadCommand, registerAuthCommands, registerListCommand } from "./commands/index.js";

const cli = cac("upload-it");

registerUploadCommand(cli);
registerAuthCommands(cli);
registerListCommand(cli);

cli.help();
cli.parse();
