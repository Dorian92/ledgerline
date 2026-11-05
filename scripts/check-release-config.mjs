#!/usr/bin/env node
const required = ['name', 'version', 'main'];
const pkg = require('../package.json');
let ok = true;
for (const key of required) {
  if (!pkg[key]) {
    console.error(`Missing package.json field: ${key}`);
    ok = false;
  }
}
if (!ok) process.exit(1);
