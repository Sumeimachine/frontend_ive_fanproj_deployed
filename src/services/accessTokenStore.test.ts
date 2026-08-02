import { afterEach, describe, expect, it } from "vitest";
import { clearAccessToken, getAccessToken, setAccessToken } from "./accessTokenStore";

describe("accessTokenStore", () => {
  afterEach(clearAccessToken);

  it("keeps the access token in memory and clears it", () => {
    expect(getAccessToken()).toBeNull();

    setAccessToken("short-lived-token");
    expect(getAccessToken()).toBe("short-lived-token");

    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });
});
