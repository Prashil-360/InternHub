import { test, expect } from "@playwright/test";
import { AuthModalPage } from "./pages/auth-modal.page";
import { LandingPage } from "./pages/landing.page";
import { TEST_CONFIG } from "./fixtures/test-config";

test.describe("Suite 1 — Authentication and Validation", () => {
  let authModal: AuthModalPage;
  let landingPage: LandingPage;

  test.beforeEach(async ({ page }) => {
    authModal = new AuthModalPage(page);
    landingPage = new LandingPage(page);
  });

  test("TC01_Admin_Login", async ({ page }) => {
    const { email, password } = TEST_CONFIG.adminCredentials;
    if (!email || !password) {
      test.skip(
        true,
        "Skipped honestly: Live admin credentials are not provided. Set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD in .env.test to run."
      );
    }

    await landingPage.goto();
    await landingPage.openSignInModal();
    await authModal.proceedToEmailSignIn();
    await authModal.fillSignInForm(email, password);
    await authModal.submitSignIn();

    // Verify successful login
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
    await expect(page.locator("text=Welcome back!").first()).toBeVisible({ timeout: 10000 });
  });

  test("TC04_Wrong_Password", async ({ page }) => {
    await authModal.openSignInViaUrl();
    await authModal.proceedToEmailSignIn();
    await authModal.fillSignInForm(
      TEST_CONFIG.dummyUsers.wrongPassword.email,
      TEST_CONFIG.dummyUsers.wrongPassword.password
    );
    await authModal.submitSignIn();

    // Verify error toast and non-crash
    const toast = page.locator("text=Invalid email or password").first();
    await expect(toast).toBeVisible({ timeout: 10000 });
    // Verify user remains on the login modal (not logged in)
    await expect(authModal.modalDialog).toBeVisible();
    expect(page.url()).not.toContain("/admin");
  });

  test("TC05_Wrong_Email", async ({ page }) => {
    await authModal.openSignInViaUrl();
    await authModal.proceedToEmailSignIn();
    await authModal.fillSignInForm(
      TEST_CONFIG.dummyUsers.unregistered.email,
      TEST_CONFIG.dummyUsers.unregistered.password
    );
    await authModal.submitSignIn();

    // Verify error toast
    const toast = page.locator("text=Invalid email or password").first();
    await expect(toast).toBeVisible({ timeout: 10000 });
    await expect(authModal.modalDialog).toBeVisible();
    expect(page.url()).not.toContain("/admin");
  });

  test("TC06_Empty_Login_Fields", async ({ page }) => {
    await authModal.openSignInViaUrl();
    await authModal.proceedToEmailSignIn();

    // Ensure fields are empty
    await expect(authModal.emailInput).toHaveValue("");
    await expect(authModal.passwordInput).toHaveValue("");

    // Click Sign In
    await authModal.submitSignIn();

    // Native browser HTML5 required validation check
    const isEmailValid = await authModal.emailInput.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(isEmailValid).toBe(false);

    // Assert modal remains visible and no redirect occurred
    await expect(authModal.modalDialog).toBeVisible();
    expect(page.url()).toContain("signin=true");
  });

  test("TC12_Password_Mismatch", async ({ page }) => {
    await authModal.openSignUpViaUrl();
    await authModal.proceedToEmailSignUp();

    await authModal.fillSignUpForm(TEST_CONFIG.dummyUsers.mismatchSignup);
    await authModal.submitSignUp();

    // Verify client-side mismatch toast
    const toast = page.locator("text=Passwords don't match").first();
    await expect(toast).toBeVisible({ timeout: 10000 });

    // Assert form is still visible and user was not registered
    await expect(authModal.modalDialog).toBeVisible();
  });
});
