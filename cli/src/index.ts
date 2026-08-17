#!/usr/bin/env node
import { cac } from "cac";
import { registerUploadCommand, registerAuthCommands, registerListCommand, registerShareCommands } from "./commands/index.js";

const cli = cac("upload-it");

registerUploadCommand(cli);
registerAuthCommands(cli);
registerListCommand(cli);
registerShareCommands(cli);

cli.help();
cli.parse();
