export const TEST_CONFIG = {
  baseUrl: process.env.PLAYWRIGHT_BASE_URL || "https://intern-hub-blue.vercel.app",
  adminCredentials: {
    email: process.env.TEST_ADMIN_EMAIL || "",
    password: process.env.TEST_ADMIN_PASSWORD || "",
  },
  mentorCredentials: {
    email: process.env.TEST_MENTOR_EMAIL || "",
    password: process.env.TEST_MENTOR_PASSWORD || "",
  },
  internCredentials: {
    email: process.env.TEST_INTERN_EMAIL || "",
    password: process.env.TEST_INTERN_PASSWORD || "",
  },
  dummyUsers: {
    wrongPassword: {
      email: "stqa_test_wrongpw@example.com",
      password: "WrongPassword999!",
    },
    unregistered: {
      email: "nonexistent_stqa_user_404@example.com",
      password: "RandomPassword123!",
    },
    mismatchSignup: {
      companyName: "STQA Quality Testing Ltd",
      name: "Tester Admin",
      email: "tester@stqaquality.io",
      password: "Password123!",
      confirm: "DifferentPassword999!",
    },
  },
};
