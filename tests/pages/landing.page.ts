import { Page, Locator, expect } from "@playwright/test";

export class LandingPage {
  readonly page: Page;
  readonly navbarSignInButton: Locator;
  readonly navbarSignUpButton: Locator;
  readonly heroSignInButton: Locator;
  readonly heroStartButton: Locator;
  readonly modalTitle: Locator;
  readonly themeToggleButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navbarSignInButton = page.locator("nav button", { hasText: "Sign in" });
    this.navbarSignUpButton = page.locator("nav button", { hasText: "Get started" });
    this.heroSignInButton = page.locator("section button", { hasText: "Sign in" });
    this.heroStartButton = page.locator("section button", { hasText: "Start for free" });
    this.modalTitle = page.locator("#auth-modal-title");
    this.themeToggleButton = page.locator("nav button[aria-label='Toggle theme']");
  }

  async goto() {
    await this.page.goto("/", { waitUntil: "commit" });
    await expect(this.page).toHaveTitle(/InternHub/, { timeout: 15000 });
  }

  async openSignInModal() {
    await this.navbarSignInButton.click();
    await expect(this.modalTitle).toBeVisible();
    await expect(this.modalTitle).toHaveText("Sign in to InternHub");
  }

  async openSignUpModal() {
    await this.navbarSignUpButton.click();
    await expect(this.modalTitle).toBeVisible();
    await expect(this.modalTitle).toHaveText("Create your account");
  }
}
