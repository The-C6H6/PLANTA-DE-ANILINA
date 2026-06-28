const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const indexPath = path.join(rootDir, 'index.html');
const stylesPath = path.join(rootDir, 'styles.css');
const mainPath = path.join(rootDir, 'main.js');
const threePath = path.join(rootDir, 'node_modules', 'three', 'build', 'three.cjs');
const orbitPath = path.join(rootDir, 'node_modules', 'three', 'examples', 'jsm', 'controls', 'OrbitControls.js');
const outputPath = path.join(rootDir, 'index.standalone.html');

const indexHtml = fs.readFileSync(indexPath, 'utf8');
const styles = fs.readFileSync(stylesPath, 'utf8');
const threeCode = fs.readFileSync(threePath, 'utf8');
const orbitCode = fs.readFileSync(orbitPath, 'utf8');
const mainCode = fs.readFileSync(mainPath, 'utf8');

const bodyMarkup = extractBody(indexHtml)
  .replace(/<script type="module" src="\.\/main\.js"><\/script>\s*/i, '');

const standaloneHtml = [
  '<!doctype html>\n',
  '<html lang="es">\n',
  '<head>\n',
  '  <meta charset="utf-8">\n',
  '  <meta name="viewport" content="width=device-width, initial-scale=1">\n',
  '  <title>Planta de anilina 3D</title>\n',
  '  <link rel="icon" href="data:,">\n',
  '  <style>\n',
  escapeInlineTag(styles, 'style'),
  '\n  </style>\n',
  '</head>\n',
  '<body>\n',
  bodyMarkup,
  '\n  <script>\n',
  '(function () {\n',
  '  const modules = Object.create(null);\n',
  '  const cache = Object.create(null);\n',
  '  function require(name) {\n',
  '    if (cache[name]) return cache[name].exports;\n',
  '    if (!modules[name]) throw new Error("Module not found: " + name);\n',
  '    const module = { exports: {} };\n',
  '    cache[name] = module;\n',
  '    modules[name](module, module.exports, require);\n',
  '    return module.exports;\n',
  '  }\n',
  '  modules["three"] = function (module, exports, require) {\n',
  escapeInlineTag(threeCode, 'script'),
  '\n  };\n',
  '  modules["OrbitControls"] = function (module, exports, require) {\n',
  escapeInlineTag(transformOrbitControls(orbitCode), 'script'),
  '\n  };\n',
  '  modules["app"] = function (module, exports, require) {\n',
  escapeInlineTag(transformMain(mainCode), 'script'),
  '\n  };\n',
  '  window.THREE = require("three");\n',
  '  require("app");\n',
  '}());\n',
  '  </script>\n',
  '</body>\n',
  '</html>\n',
].join('');

fs.writeFileSync(outputPath, standaloneHtml, 'utf8');
console.log(`Archivo generado: ${outputPath}`);

function extractBody(html) {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!match) {
    throw new Error('No se pudo extraer el contenido de <body> desde index.html.');
  }

  return match[1].trim();
}

function transformOrbitControls(source) {
  return source
    .replace(
      /import\s*\{([\s\S]*?)\}\s*from\s*'three';\s*/m,
      (_match, specifiers) => `const { ${cleanSpecifiers(specifiers)} } = require('three');\n\n`
    )
    .replace(/export\s*\{\s*OrbitControls\s*\};?\s*$/m, 'exports.OrbitControls = OrbitControls;');
}

function transformMain(source) {
  return source.replace(
    /import\s+\*\s+as\s+THREE\s+from\s+'three';\s*[\r\n]+import\s+\{\s*OrbitControls\s*\}\s+from\s+'three\/addons\/controls\/OrbitControls\.js';\s*/m,
    "const THREE = require('three');\nconst { OrbitControls } = require('OrbitControls');\n\n"
  );
}

function cleanSpecifiers(specifiers) {
  return specifiers
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ');
}

function escapeInlineTag(content, tagName) {
  const closeTag = new RegExp(`</${tagName}>`, 'gi');
  return content.replace(closeTag, `<\\/${tagName}>`);
}
