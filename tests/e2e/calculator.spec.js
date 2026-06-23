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

function secondInsertButton(page, value) {
  return calculator(page).locator(`button[data-second-insert=${JSON.stringify(value)}]`);
}

function secondActionButton(page, action) {
  return calculator(page).locator(`button[data-second-action=${JSON.stringify(action)}]`);
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
    "second", "home", "backspace", "angle", "clear", "abs", "percent", "exp",
    "fraction", "dms", "power", "sign", "equals", "history-up", "cursor-left",
    "cursor-right", "history-down",
  ];
  const secondInserts = [
    "asin(", "acos(", "atan(", "cbrt(", "tenpow(", "epow(",
  ];
  const secondActions = [
    "memory-clear", "memory-recall", "memory-add", "memory-subtract",
    "reciprocal", "stats-add", "root", "stats-mean", "stats-stddev",
    "stats-count", "factorial", "ncr", "npr", "stats-sum", "stats-sum-squares",
  ];

  for (const value of inserts) {
    await expect(insertButton(page, value), `insert ${value}`).toHaveCount(1);
    await expect(insertButton(page, value), `insert ${value}`).toBeVisible();
  }

  for (const value of actions) {
    await expect(actionButton(page, value), `action ${value}`).toHaveCount(1);
    await expect(actionButton(page, value), `action ${value}`).toBeVisible();
  }

  for (const value of secondInserts) {
    await expect(secondInsertButton(page, value), `second insert ${value}`).toHaveCount(1);
  }

  for (const value of secondActions) {
    await expect(secondActionButton(page, value), `second action ${value}`).toHaveCount(1);
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
  await action(page, "fraction");
  await expectFractionResult(page, "\u25a1", "\u25a1");
  await clickExpression(page, ["3", "+", "sqrt(", "2", ")"]);
  await page.keyboard.press("ArrowDown");
  await insert(page, "2");
  await action(page, "equals");
  await expectFractionResult(page, "3+\u221a2", "2");
  const nestedOperatorBorder = await result(page)
    .locator(".scicalc__display-fraction .scicalc__display-operator")
    .evaluate((node) => {
      const styles = window.getComputedStyle(node);
      return { style: styles.borderBottomStyle, width: styles.borderBottomWidth };
    });
  expect(nestedOperatorBorder).toEqual({ style: "none", width: "0px" });

  await reset(page);
  await action(page, "fraction");
  await clickExpression(page, ["3", "+", "sqrt(", "2", ")"]);
  await page.keyboard.press("ArrowDown");
  await insert(page, "2");
  await page.keyboard.press("ArrowRight");
  await insert(page, "+");
  await insert(page, "1");
  await action(page, "equals");
  await expectFractionResult(page, "5+\u221a2", "2");

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
  await action(page, "fraction");
  await expectResult(page, "0.866025403784");
  await action(page, "fraction");
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

test("evaluates inverse trig and second-layer power functions", async ({ page }) => {
  await action(page, "second");
  await insert(page, "sin(");
  await clickExpression(page, ["0", ".", "5"]);
  await action(page, "equals");
  await expectResult(page, "30");

  await reset(page);
  await action(page, "second");
  await insert(page, "cos(");
  await clickExpression(page, ["0", ".", "5"]);
  await action(page, "equals");
  await expectResult(page, "60");

  await reset(page);
  await action(page, "second");
  await insert(page, "tan(");
  await insert(page, "1");
  await action(page, "equals");
  await expectResult(page, "45");

  await reset(page);
  await action(page, "second");
  await insert(page, "sqrt(");
  await clickExpression(page, ["2", "7"]);
  await action(page, "equals");
  await expectResult(page, "3");

  await reset(page);
  await action(page, "second");
  await insert(page, "log(");
  await insert(page, "3");
  await action(page, "equals");
  await expectResult(page, "1000");

  await reset(page);
  await action(page, "second");
  await insert(page, "e");
  await insert(page, "1");
  await action(page, "equals");
  await expectResult(page, "2.71828182846");

  await reset(page);
  await insert(page, "4");
  await action(page, "second");
  await insert(page, "^2");
  await action(page, "equals");
  await expectResult(page, "0.25");

  await reset(page);
  await insert(page, "3");
  await action(page, "second");
  await action(page, "power");
  await clickExpression(page, ["2", "7"]);
  await action(page, "equals");
  await expectResult(page, "3");
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

test("evaluates combinatorics, percent, and absolute value", async ({ page }) => {
  await insert(page, "5");
  await action(page, "second");
  await insert(page, "4");
  await action(page, "equals");
  await expectResult(page, "120");

  await reset(page);
  await insert(page, "5");
  await action(page, "second");
  await insert(page, "5");
  await insert(page, "2");
  await action(page, "equals");
  await expectResult(page, "10");

  await reset(page);
  await insert(page, "5");
  await action(page, "second");
  await insert(page, "6");
  await insert(page, "2");
  await action(page, "equals");
  await expectResult(page, "20");

  await reset(page);
  await action(page, "sign");
  await insert(page, "8");
  await action(page, "abs");
  await action(page, "equals");
  await expectResult(page, "8");

  await reset(page);
  await clickExpression(page, ["5", "0"]);
  await action(page, "percent");
  await action(page, "equals");
  await expectResult(page, "0.5");
});

test("handles memory functions", async ({ page }) => {
  await insert(page, "9");
  await action(page, "second");
  await action(page, "angle");
  await expectResult(page, "9");

  await action(page, "clear");
  await insert(page, "4");
  await action(page, "second");
  await action(page, "clear");
  await expectResult(page, "5");

  await action(page, "second");
  await action(page, "backspace");
  await expectResult(page, "5");

  await action(page, "second");
  await action(page, "home");
  await expectResult(page, "0");

  await action(page, "second");
  await action(page, "backspace");
  await expectResult(page, "0");
});

test("handles statistics functions", async ({ page }) => {
  await insert(page, "2");
  await action(page, "second");
  await action(page, "exp");
  await expectResult(page, "1");

  await action(page, "clear");
  await insert(page, "4");
  await action(page, "second");
  await action(page, "exp");
  await expectResult(page, "2");

  await action(page, "second");
  await insert(page, "1");
  await expectResult(page, "6");

  await action(page, "second");
  await insert(page, "2");
  await expectResult(page, "20");

  await action(page, "second");
  await insert(page, "7");
  await expectResult(page, "3");

  await action(page, "second");
  await insert(page, "8");
  await expectResult(page, "1.41421356237");

  await action(page, "second");
  await insert(page, "9");
  await expectResult(page, "2");
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
  await calculator(page).focus();
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
