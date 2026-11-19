import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

test("primary button remains readable with DSH monochrome theme tokens", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "万能导", exact: true }).click();
  const button = page.getByRole("button", { name: "开始导出", exact: true });
  await expect(button).toBeVisible();
  await page.screenshot({
    path: path.join(os.tmpdir(), "wandao-dsh-overview-dark.png"),
    fullPage: true,
  });
  const contrast = () =>
    button.evaluate((element) => {
      const style = getComputedStyle(element);
      const luminance = (color: string) => {
        const rgb = color
          .match(/[\d.]+/g)!
          .slice(0, 3)
          .map(Number)
          .map((v) => {
            const c = v / 255;
            return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          });
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      };
      const a = luminance(style.color),
        b = luminance(style.backgroundColor);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
  for (const dark of [true, false]) {
    await page.evaluate((dark) => {
      const style = document.body.style;
      style.setProperty(
        "--dsw-alias-brand-primary",
        dark ? "#f8f9fa" : "#161616",
      );
      style.setProperty(
        "--dsw-alias-button-primary-fill",
        dark ? "#f8f9fa" : "#161616",
      );
      style.setProperty(
        "--dsw-alias-button-primary-hover",
        dark ? "#e4e5e8" : "#333333",
      );
      style.setProperty(
        "--dsw-alias-label-primary-foreground",
        dark ? "#161616" : "#ffffff",
      );
    }, dark);
    expect(await contrast()).toBeGreaterThanOrEqual(4.5);
    await button.hover();
    expect(await contrast()).toBeGreaterThanOrEqual(4.5);
    await page.keyboard.press("Tab");
    await button.focus();
    expect(
      await button.evaluate(
        (element) => getComputedStyle(element).outlineStyle,
      ),
    ).not.toBe("none");
    await page.getByRole("heading", { name: "万能导", exact: true }).hover();
    await button.evaluate((element: HTMLButtonElement) => {
      element.disabled = true;
    });
    const disabledBackground = await button.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    await button.hover();
    expect(
      await button.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    ).toBe(disabledBackground);
    await button.evaluate((element: HTMLButtonElement) => {
      element.disabled = false;
    });
  }
});

test("shared API works when non-API POST routes return 405 and still requires authentication", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const payload = {
    type: "client-request",
    rpcId: "transport-regression",
    method: "wandao/catalogue",
    payload: {},
  };
  const legacy = await page.request.post("/wandao/catalogue", {
    data: payload,
  });
  expect(legacy.status()).toBe(405);
  const current = await page.request.post("/api/wandao/catalogue", {
    data: payload,
  });
  expect(current.status()).toBe(200);
  expect((await current.json()).result.value.providers.length).toBeGreaterThan(
    0,
  );
  const unauthenticated = await request.post("/api/wandao/catalogue", {
    data: payload,
  });
  expect(unauthenticated.status()).toBe(401);
});

test("native sidebar opens a working migration page, scans and exports real files", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/万能导/);
  await page.getByRole("button", { name: "万能导", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "万能导", exact: true }),
  ).toBeVisible();
  const fixtures = await (await page.request.get("/fixtures")).json();
  await expect(page.getByLabel("选择平台", { exact: true })).toHaveValue(
    "obsidian-export",
  );
  await page.getByLabel("操作步骤").selectOption("scan");
  await page.getByLabel("Obsidian Vault 目录").fill(fixtures.vault);
  await page.getByRole("button", { name: "读取目录", exact: true }).click();
  await expect(page.getByRole("heading", { name: /已扫描文档/ })).toBeVisible();
  await expect(
    page.locator('.wandao-documents [title="hello.md"]'),
  ).toBeVisible();
  const documents = page.locator(".wandao-documents");
  await documents
    .getByRole("searchbox", { name: "搜索已扫描文档" })
    .fill("missing-document");
  await expect(documents.getByText("没有匹配的文档")).toBeVisible();
  await documents
    .getByRole("searchbox", { name: "搜索已扫描文档" })
    .fill("HELLO");
  await documents
    .getByRole("button", { name: "全选当前结果", exact: true })
    .click();
  await expect(
    documents.getByText("已选 1 / 2 篇", { exact: true }),
  ).toBeVisible();
  await documents.getByRole("searchbox", { name: "搜索已扫描文档" }).fill("");
  await expect(documents.getByLabel("hello", { exact: true })).toBeChecked();
  await expect(
    documents.getByLabel("other", { exact: true }),
  ).not.toBeChecked();
  await documents
    .getByRole("button", { name: "清空选择", exact: true })
    .click();
  await expect(
    documents.getByText("已选 0 / 2 篇", { exact: true }),
  ).toBeVisible();
  await documents
    .getByRole("searchbox", { name: "搜索已扫描文档" })
    .fill("hello");
  await documents
    .getByRole("button", { name: "全选当前结果", exact: true })
    .click();
  await documents.getByLabel("仅迁移勾选项").check();
  await page.getByLabel("操作步骤").selectOption("export");
  const destination = path.join(fixtures.outputRoot, "browser-result");
  await page.getByLabel("导出根目录").fill(destination);
  await page.getByLabel("按来源自动创建子文件夹").uncheck();
  const accidentalStart = page
    .waitForRequest((request) => request.url().endsWith("/api/wandao/start"), {
      timeout: 500,
    })
    .catch(() => null);
  await documents
    .getByRole("searchbox", { name: "搜索已扫描文档" })
    .press("Enter");
  expect(await accidentalStart).toBeNull();
  const previousTasks = await page.locator(".wandao-task-list>li").count();
  await page.getByRole("button", { name: "开始导出", exact: true }).click();
  await expect(page.locator(".wandao-task-list>li")).toHaveCount(
    previousTasks + 1,
  );
  await expect(
    page
      .locator(".wandao-task-list>li")
      .first()
      .getByText("已完成", { exact: true }),
  ).toBeVisible();
  expect(await readFile(path.join(destination, "hello.md"), "utf8")).toContain(
    "browser-driven export",
  );
  await expect(
    readFile(path.join(destination, "other.md"), "utf8"),
  ).rejects.toThrow(/ENOENT/);
  await page.screenshot({
    path: path.join(os.tmpdir(), "wandao-dsh-desktop.png"),
    fullPage: true,
  });
  await page
    .getByLabel("Obsidian Vault 目录")
    .fill(path.join(fixtures.vault, "changed-source"));
  await expect(documents).not.toBeVisible();
  expect(errors).toEqual([]);
});

test("private settings save without echoing credentials and remote import asks for confirmation", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "万能导", exact: true }).click();
  await page.getByLabel("选择平台", { exact: true }).selectOption("ima-export");
  await page.getByText("账号与 API 设置", { exact: true }).click();
  const privateInputs = page.locator(".wandao-credentials input");
  await privateInputs.nth(0).fill("browser-client");
  await privateInputs.nth(1).fill("browser-secret");
  await page.getByRole("button", { name: "保存账号设置", exact: true }).click();
  await expect(page.getByText("设置已保存", { exact: true })).toBeVisible();
  await expect(privateInputs.nth(1)).toHaveValue("");
  expect(
    await page.evaluate(() =>
      JSON.stringify({
        local: { ...localStorage },
        session: { ...sessionStorage },
      }),
    ),
  ).not.toContain("browser-secret");
  await page
    .getByRole("group", { name: "迁移方向" })
    .getByRole("button", { name: "导入", exact: true })
    .click();
  await page
    .getByLabel("选择平台", { exact: true })
    .selectOption("xiliu-import");
  const fixtures = await (await page.request.get("/fixtures")).json();
  await page.getByLabel("本地 Markdown 目录").fill(fixtures.vault);
  await page.getByLabel(/^目标页面/).fill("page-id");
  await page.getByRole("button", { name: "开始导入", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "确认写入目标平台" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "返回检查", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("light theme and mobile viewport keep the form readable without horizontal overflow", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "万能导", exact: true }).click();
  await expect(page.getByLabel("Obsidian Vault 目录")).toBeVisible();
  await page.screenshot({
    path: path.join(os.tmpdir(), "wandao-dsh-light.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel("Obsidian Vault 目录")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".wandao-page")
        .evaluate((element) => element.scrollWidth <= element.clientWidth),
    )
    .toBe(true);
  await page.screenshot({
    path: path.join(os.tmpdir(), "wandao-dsh-mobile.png"),
    fullPage: true,
  });
});
