const fs = require('fs');
const path = require('path');

function loadEnvFile(envPath) {
    if (!fs.existsSync(envPath)) {
        return {};
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
                envVars[key.trim()] = valueParts.join('=').trim();
            }
        }
    });

    return envVars;
}

function generateEnvironmentFile(envVars, isProduction = false) {
    return `export const environment = {
  production: ${isProduction},
  baseUrl: '${envVars.ANGULAR_APP_BASE_URL || ''}',
  clientId: '${envVars.ANGULAR_APP_CLIENT_ID || ''}',
};
`;
}

const envFile = process.argv[2] === 'prod' ? '.env.prod' : '.env';
const envVars = loadEnvFile(path.join(__dirname, envFile));
const isProduction = process.argv[2] === 'prod';

const environmentContent = generateEnvironmentFile(envVars, isProduction);

const outputFile = isProduction ?
    'src/environments/environment.prod.ts' :
    'src/environments/environment.ts';

fs.writeFileSync(path.join(__dirname, outputFile), environmentContent);

console.log(`Environment file generated: ${outputFile}`);
