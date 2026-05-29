import process from 'node:process';

const healthcheckUrl = process.env.HEALTHCHECK_URL;
const alertWebhookUrl = process.env.ALERT_WEBHOOK_URL;
const timeoutMs = Number(process.env.HEALTHCHECK_TIMEOUT_MS ?? 10_000);

if (!healthcheckUrl) {
  console.error('HEALTHCHECK_URL nao configurada.');
  process.exit(2);
}

async function notifyFailure(message, details = {}) {
  if (!alertWebhookUrl) {
    return;
  }

  await fetch(alertWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      service: 'atende-pix',
      status: 'DOWN',
      message,
      healthcheckUrl,
      checkedAt: new Date().toISOString(),
      details
    })
  }).catch((error) => {
    console.error(`Falha ao enviar alerta: ${error.message}`);
  });
}

async function run() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(healthcheckUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json'
      }
    });
    const body = await response.text();

    if (!response.ok) {
      const message = `Healthcheck respondeu HTTP ${response.status}.`;
      console.error(message);
      await notifyFailure(message, {
        status: response.status,
        body: body.slice(0, 1000)
      });
      process.exit(1);
    }

    console.log(`Healthcheck OK: ${response.status}`);
  } catch (error) {
    const message = `Healthcheck falhou: ${error.message}`;
    console.error(message);
    await notifyFailure(message, {
      errorName: error.name
    });
    process.exit(1);
  } finally {
    clearTimeout(timeout);
  }
}

run();
