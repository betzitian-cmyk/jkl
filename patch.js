const fs = require('fs');
let code = fs.readFileSync('src/routes/onboarding.ts', 'utf8');
code = code.replace("if (error.name === 'ZodError') {", "if (error && error.errors) {");
fs.writeFileSync('src/routes/onboarding.ts', code);
