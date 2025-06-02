#!/usr/bin/env bun
import { cac } from "cac";

const cli = cac();

cli
  .command("greet <name>", "Greet someone")
  .action((name) => {
    console.log(`Hello, ${name}!`);
  });


// npx upload-anything file.name
// If user is not logged in
// ask user for email
// send verification code
// 00000
// if verfied 
// upload the file to r2 for some days
// give your file url is this
//
//
// Features to add more
// - give all uploaded files
// - ability to pay for storage
// - no time restrictions
// - password protected files

cli.help();
cli.parse();
