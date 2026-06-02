const { test, expect } = require("@playwright/test");

function calculator(page) {
  return page.locator("[data-scientific-calculator]");
}

function insertButton(page, value) {
  return calculator(page).locator(`button[data-insert=${JSON.stringify(value)}]`);
}

function actionButton(page, action) {
  return calculator(page).locator(`button[data-action=${JSON.stringify(action)}]`);
}

async function insert(page, value) {
  await insertButton(page, value).click();
}

async function action(page, value) {
  await actionButton(page, value).click();
}

function expression(page) {
  return calculator(page).locator("[data-expression]");
}

function result(page) {
  return calculator(page).locator("[data-result]");
}

async function reset(page) {
  await action(page, "clear");
  await expect(expression(page)).toHaveText("0");
  await expect(result(page)).toHaveText("0");
}

async function expectResult(page, value) {
  await expect(result(page)).toHaveText(value);
}

async function expectResultParts(page, parts) {
  for (const part of parts) {
    await expect(result(page)).toContainText(part);
  }
}

async function expectFractionResult(page, numerator, denominator) {
  const fraction = result(page).locator(".scicalc__display-fraction");
  const parts = fraction.locator(":scope > span");
  await expect(fraction).toHaveCount(1);
  await expect(parts).toHaveCount(2);
  await expect(parts.nth(0)).toHaveText(numerator);
  await expect(parts.nth(1)).toHaveText(denominator);
}

async function clickExpression(page, tokens) {
  for (const token of tokens) {
    await insert(page, token);
  }
}

async function calculate(page, tokens) {
  await clickExpression(page, tokens);
  await action(page, "equals");
}

test.beforeEach(async ({ page }, testInfo) => {
  const browserErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));
  testInfo.browserErrors = browserErrors;

  await page.goto("/");
  await expect(calculator(page)).toBeVisible();
  await reset(page);
});

test.afterEach(async ({}, testInfo) => {
  expect(testInfo.browserErrors).toEqual([]);
});

test("renders every desktop calculator control", async ({ page }) => {
  await expect(calculator(page)).toBeVisible();

  const inserts = [
    "sin(", "cos(", "tan(", "sqrt(", "log(", "^2", "e", "ln(",
    "pi", "7", "8", "9", "(", ")", "4", "5", "6", "*", "/",
    "1", "2", "3", "+", "-", "0", ".",
  ];
  const actions = [
    "second", "home", "backspace", "angle", "clear", "exp", "fraction",
    "dms", "power", "sign", "equals", "history-up", "cursor-left",
    "cursor-right", "history-down",
  ];

  for (const value of inserts) {
    await expect(insertButton(page, value), `insert ${value}`).toHaveCount(1);
    await expect(insertButton(page, value), `insert ${value}`).toBeVisible();
  }

  for (const value of actions) {
    await expect(actionButton(page, value), `action ${value}`).toHaveCount(1);
    await expect(actionButton(page, value), `action ${value}`).toBeVisible();
  }
});

test("evaluates arithmetic, precedence, parentheses, decimals, and division", async ({ page }) => {
  await calculate(page, ["7", "+", "8"]);
  await expectResult(page, "15");

  await reset(page);
  await calculate(page, ["2", "+", "3", "*", "4"]);
  await expectResult(page, "14");

  await reset(page);
  await calculate(page, ["(", "2", "+", "3", ")", "*", "4"]);
  await expectResult(page, "20");

  await reset(page);
  await calculate(page, ["7", ".", "5", "/", "2", ".", "5"]);
  await action(page, "fraction");
  await expectResult(page, "3");
});

test("evaluates powers, square root, and scientific notation", async ({ page }) => {
  await calculate(page, ["9", "^2"]);
  await expectResult(page, "81");

  await reset(page);
  await insert(page, "2");
  await action(page, "power");
  await insert(page, "5");
  await action(page, "equals");
  await expectResult(page, "32");

  await reset(page);
  await calculate(page, ["sqrt(", "8", "1"]);
  await expectResult(page, "9");

  await reset(page);
  await calculate(page, ["sqrt(", "2", "4"]);
  await expectResult(page, "2\u221a6");

  await reset(page);
  await calculate(page, ["sqrt(", "8", ")", "+", "sqrt(", "1", "8"]);
  await expectResult(page, "5\u221a2");

  await reset(page);
  await calculate(page, ["sqrt(", "6", ")", "*", "sqrt(", "2"]);
  await expectResult(page, "2\u221a3");

  await reset(page);
  await calculate(page, ["(", "3", "+", "sqrt(", "2", ")", ")", "/", "2"]);
  await expectFractionResult(page, "3+\u221a2", "2");

  await reset(page);
  await insert(page, "2");
  await action(page, "exp");
  await insert(page, "3");
  await action(page, "equals");
  await expectResult(page, "2000");
});

test("evaluates trig functions in degree and radian modes", async ({ page }) => {
  await calculate(page, ["sin(", "3", "0"]);
  await expectFractionResult(page, "1", "2");

  await reset(page);
  await calculate(page, ["cos(", "6", "0"]);
  await expectFractionResult(page, "1", "2");

  await reset(page);
  await calculate(page, ["tan(", "4", "5"]);
  await expectResult(page, "1");

  await reset(page);
  await calculate(page, ["sin(", "6", "0"]);
  await expectFractionResult(page, "\u221a3", "2");

  await reset(page);
  await calculate(page, ["cos(", "3", "0"]);
  await expectFractionResult(page, "\u221a3", "2");

  await reset(page);
  await calculate(page, ["tan(", "6", "0"]);
  await expectResult(page, "\u221a3");

  await reset(page);
  await calculate(page, ["tan(", "3", "0"]);
  await expectFractionResult(page, "\u221a3", "3");

  await reset(page);
  await action(page, "angle");
  await expect(calculator(page).locator("[data-angle-label]")).toHaveText("RAD");
  await calculate(page, ["sin(", "pi", "/", "2"]);
  await expectResult(page, "1");
});

test("evaluates logarithms and constants", async ({ page }) => {
  await calculate(page, ["log(", "1", "0", "0"]);
  await expectResult(page, "2");

  await reset(page);
  await calculate(page, ["ln(", "e"]);
  await expectResult(page, "1");

  await reset(page);
  await calculate(page, ["pi"]);
  await expectResult(page, "3.14159265359");

  await reset(page);
  await calculate(page, ["e"]);
  await expectResult(page, "2.71828182846");
});

test("handles fractions, mixed-number input, result-mode cycling, and DMS", async ({ page }) => {
  await insert(page, "1");
  await action(page, "fraction");
  await insert(page, "2");
  await action(page, "equals");
  await expect(result(page)).toContainText("1");
  await expect(result(page)).toContainText("2");

  await action(page, "fraction");
  await expectResult(page, "0.5");

  await reset(page);
  await insert(page, "3");
  await action(page, "fraction");
  await insert(page, "2");
  await action(page, "equals");
  await expect(result(page)).toContainText("3");
  await expect(result(page)).toContainText("2");

  await action(page, "fraction");
  await expect(result(page)).toContainText("1");
  await expect(result(page)).toContainText("2");

  await reset(page);
  await insert(page, "1");
  await action(page, "second");
  await action(page, "fraction");
  await insert(page, "1");
  await action(page, "fraction");
  await insert(page, "2");
  await action(page, "equals");
  await expect(result(page)).toContainText("3");
  await expect(result(page)).toContainText("2");

  await reset(page);
  await insert(page, "1");
  await action(page, "dms");
  await insert(page, "3");
  await insert(page, "0");
  await action(page, "dms");
  await insert(page, "0");
  await action(page, "equals");
  await expectResult(page, "1.5");
});

test("handles sign, answer recall, clear, and home", async ({ page }) => {
  await insert(page, "5");
  await action(page, "sign");
  await insert(page, "+");
  await insert(page, "8");
  await action(page, "equals");
  await expectResult(page, "3");

  await reset(page);
  await calculate(page, ["2", "+", "3"]);
  await expectResult(page, "5");
  await action(page, "second");
  await action(page, "equals");
  await expectResult(page, "Ans");
  await insert(page, "*");
  await insert(page, "4");
  await action(page, "equals");
  await expectResult(page, "20");

  await action(page, "clear");
  await expect(expression(page)).toHaveText("0");
  await expect(result(page)).toHaveText("0");

  await calculate(page, ["9", "+", "9"]);
  await action(page, "home");
  await expect(expression(page)).toHaveText("0");
  await expect(result(page)).toHaveText("0");
});

test("handles delete, cursor navigation, history, and keyboard input", async ({ page }) => {
  await clickExpression(page, ["1", "2", "3"]);
  await action(page, "cursor-left");
  await action(page, "backspace");
  await action(page, "equals");
  await expectResult(page, "13");

  await reset(page);
  await page.keyboard.type("987");
  await page.keyboard.press("Backspace");
  await expectResult(page, "98");
  await page.keyboard.press("Enter");
  await expectResult(page, "98");

  await reset(page);
  await calculate(page, ["1", "+", "1"]);
  await expectResult(page, "2");
  await reset(page);
  await calculate(page, ["2", "+", "2"]);
  await expectResult(page, "4");

  await action(page, "history-up");
  await expectResult(page, "4");
  await action(page, "history-up");
  await expectResult(page, "2");
  await action(page, "history-down");
  await expectResult(page, "4");
});
