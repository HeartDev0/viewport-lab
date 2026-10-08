import fs from "node:fs";
const css=fs.readFileSync("app.css","utf8");
const html=fs.readFileSync("app.html","utf8");
const js=fs.readFileSync("app.js","utf8");
const manifest=JSON.parse(fs.readFileSync("manifest.json","utf8"));
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
const checks=[
["v0.3.3 manifest version",manifest.version==="0.3.3"],
["v0.3.3 package version",pkg.version==="0.3.3"],
["HeartDev polish marker exists",css.includes("Viewport Lab v0.3.3 - HeartDev Pixel Polish")],
["brand uses HeartDev logo image",html.includes('class="brand-logo"')&&html.includes('assets/heartdev-logo.png')],
["workspace watermark added",html.includes('class="workspace-watermark"')&&css.includes('.workspace-watermark')],
["pixel range styling exists",css.includes('::-webkit-slider-thumb')&&css.includes('::-moz-range-thumb')],
["pixel corner HUD accents exist",css.includes('border-top:2px solid rgba(94,224,214,.55)')&&css.includes('border-bottom:2px solid rgba(216,63,63,.65)')],
["MCP remains optional integration",html.includes('<details class="panel-section disclosure-section agent-section">')],
["tutorial does not promote MCP as a core step",!js.slice(js.indexOf('const TUTORIAL = ['),js.indexOf('const state =')).includes('MCP')],
]; let failed=0; for(const [name,ok] of checks){console.log(`${ok?'✓':'✗'} ${name}`);if(!ok)failed++;} if(failed)process.exit(1);
