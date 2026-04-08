import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const rootDir = process.cwd();
const outputDir = path.join(rootDir, "public", "readme");
const baseUrl = process.env.README_CAPTURE_URL ?? "http://127.0.0.1:4173/starlight-drifter/";

async function hold(page, keys, durationMs) {
  for (const key of keys) {
    await page.keyboard.down(key);
  }

  await page.waitForTimeout(durationMs);

  for (const key of [...keys].reverse()) {
    await page.keyboard.up(key);
  }
}

async function burstMovement(page) {
  await hold(page, ["KeyD"], 420);
  await hold(page, ["KeyD", "KeyW"], 380);
  await hold(page, ["KeyW"], 320);
  await hold(page, ["Shift"], 40);
  await page.waitForTimeout(300);
  await hold(page, ["KeyA"], 260);
  await hold(page, ["KeyA", "KeyS"], 320);
  await hold(page, ["KeyS"], 220);
  await hold(page, ["Shift"], 40);
  await page.waitForTimeout(300);
}

async function captureCanvas(page, name) {
  const canvas = page.locator("canvas");
  await canvas.screenshot({
    path: path.join(outputDir, `${name}.png`)
  });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 980 },
  deviceScaleFactor: 1
});

try {
  await mkdir(outputDir, { recursive: true });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.locator("canvas").waitFor({ state: "visible" });
  await page.waitForTimeout(2200);

  await captureCanvas(page, "core-run");

  await burstMovement(page);
  await burstMovement(page);
  await page.waitForTimeout(2200);
  await captureCanvas(page, "swarm-pressure");

  await page.waitForTimeout(9000);
  await captureCanvas(page, "signal-lost");
} finally {
  await browser.close();
}
