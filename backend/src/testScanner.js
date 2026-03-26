const { scanDiffForSecrets } = require('./scanner/secretScanner')

const fakeDiff = `
diff --git a/.env b/.env
+++ b/.env
+AWS_ACCESS_KEY_ID=FAKE_AWS_KEY_123
+GITHUB_TOKEN=FAKE_GITHUB_TOKEN_123
+STRIPE_KEY=sk_test_dummy_key_12345
+DB_URL=mongodb://user:password@localhost:27017/testdb
diff --git a/config/auth.js b/config/auth.js
+++ b/config/auth.js

+const secret = 'dummy_secret_key_123'
diff --git a/README.md b/README.md
+++ b/README.md
+# Just a normal readme with no secrets
+Set AWS_ACCESS_KEY_ID=your-key-here in your env
diff --git a/tests/auth.test.js b/tests/auth.test.js
+++ b/tests/auth.test.js
+const fakeToken = 'fake_token_for_testing_only'
`

console.log('Running scanner test...\n')
const findings = scanDiffForSecrets(fakeDiff)
console.log('Findings:', JSON.stringify(findings, null, 2))
console.log('\nTotal secrets found:', findings.length)
console.log('\nExpected behaviour:')
console.log('- .env secrets → DETECTED')
console.log('- README placeholder → SKIPPED')
console.log('- Test file token → SKIPPED')