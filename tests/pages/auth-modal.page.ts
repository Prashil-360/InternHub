import { Page, Locator, expect } from "@playwright/test";

export class AuthModalPage {
  readonly page: Page;
  readonly modalDialog: Locator;
  readonly modalTitle: Locator;
  readonly closeButton: Locator;
  readonly continueWithEmailButton: Locator;
  readonly signUpWithEmailButton: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitSignInButton: Locator;

  // Sign up inputs
  readonly companyNameInput: Locator;
  readonly fullNameInput: Locator;
  readonly workEmailInput: Locator;
  readonly signUpPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitSignUpButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modalDialog = page.locator(".auth-modal");
    this.modalTitle = page.locator("#auth-modal-title");
    this.closeButton = page.locator(".auth-modal button[aria-label='Close']");
    this.continueWithEmailButton = page.locator(".auth-provider-btn.primary", {
      hasText: "Continue with Email",
    });
    this.signUpWithEmailButton = page.locator(".auth-provider-btn.primary", {
      hasText: "Sign up with Email",
    });
    this.emailInput = page.locator(".auth-modal input[type='email']");
    this.passwordInput = page.locator(".auth-modal input[type='password']");
    this.submitSignInButton = page.locator(".auth-modal form button[type='submit']");

    this.companyNameInput = page.locator("input[placeholder='Acme Technologies']");
    this.fullNameInput = page.locator("input[placeholder='Full name']");
    this.workEmailInput = page.locator(".auth-modal form input[type='email']");
    this.signUpPasswordInput = page.locator("input[placeholder='Min 8 characters']");
    this.confirmPasswordInput = page.locator("input[placeholder='Repeat password']");
    this.submitSignUpButton = page.locator(".auth-modal form button", {
      hasText: "Create Account",
    });
  }

  async openSignInViaUrl() {
    await this.page.goto("/?signin=true", { waitUntil: "commit" });
    await expect(this.modalDialog).toBeVisible({ timeout: 20000 });
  }

  async openSignUpViaUrl() {
    await this.page.goto("/?signup=true", { waitUntil: "commit" });
    await expect(this.modalDialog).toBeVisible({ timeout: 20000 });
  }

  async proceedToEmailSignIn() {
    await expect(this.continueWithEmailButton).toBeVisible();
    await this.continueWithEmailButton.click();
    await expect(this.emailInput).toBeVisible();
  }

  async proceedToEmailSignUp() {
    await expect(this.signUpWithEmailButton).toBeVisible();
    await this.signUpWithEmailButton.click();
    await expect(this.companyNameInput).toBeVisible();
  }

  async fillSignInForm(email: string, pass: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
  }

  async submitSignIn() {
    await this.submitSignInButton.click();
  }

  async fillSignUpForm(data: {
    companyName: string;
    name: string;
    email: string;
    password: string;
    confirm: string;
  }) {
    await this.companyNameInput.fill(data.companyName);
    await this.fullNameInput.fill(data.name);
    await this.workEmailInput.fill(data.email);
    await this.signUpPasswordInput.fill(data.password);
    await this.confirmPasswordInput.fill(data.confirm);
  }

  async submitSignUp() {
    await this.submitSignUpButton.click();
  }

  async expectToast(message: string | RegExp) {
    const toast = this.page.locator(`text=${message}`).first();
    await expect(toast).toBeVisible({ timeout: 10000 });
  }
}
