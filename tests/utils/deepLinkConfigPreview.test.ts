import { describe, expect, it } from "vitest";
import { parseDeepLinkConfigPreview } from "@/utils/deepLinkConfigPreview";

const encodeBase64 = (value: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(value)));

const grokConfig = `[models]
default = "grok-4.5"

[model."grok-4.5"]
model = "grok-4.5"
base_url = "https://relay.example/v1"
name = "Relay"
api_key = "secret-grok-key"
api_backend = "responses"
context_window = 500000
`;

describe("parseDeepLinkConfigPreview", () => {
  it("masks authentication headers in nested TOML", () => {
    const config = `${grokConfig}
[mcp.servers.example]
url = "https://mcp.example"
headers = { Authorization = "Bearer top-secret", Cookie = "session=secret", credential = "credential-secret", auth = "auth-secret", safe_header = "visible" }
`;
    const preview = parseDeepLinkConfigPreview({
      app: "codex",
      config: encodeBase64(JSON.stringify({ config })),
      configFormat: "json",
    });

    expect(preview?.tomlConfig).not.toContain("Bearer top-secret");
    expect(preview?.tomlConfig).not.toContain("session=secret");
    expect(preview?.tomlConfig).not.toContain("credential-secret");
    expect(preview?.tomlConfig).not.toContain("auth-secret");
    expect(preview?.tomlConfig).toContain("visible");
  });

  it("inherits sensitivity through nested tables and arrays of tables", () => {
    const config = `${grokConfig}
[model."grok-4.5".auth]
value = "nested-auth-secret"
short = "tiny"
empty = ""
nested = { value = "inline-nested-secret" }

[[model."grok-4.5".credentials]]
value = "array-table-secret"
`;
    const preview = parseDeepLinkConfigPreview({
      app: "codex",
      config: encodeBase64(JSON.stringify({ config })),
      configFormat: "json",
    });

    expect(preview?.tomlConfig).not.toContain("nested-auth-secret");
    expect(preview?.tomlConfig).not.toContain("inline-nested-secret");
    expect(preview?.tomlConfig).not.toContain("array-table-secret");
    expect(preview?.tomlConfig).toContain("nest************");
    expect(preview?.tomlConfig).toContain("inli************");
    expect(preview?.tomlConfig).toContain("arra************");
    expect(preview?.tomlConfig).toContain('short = "****"');
    expect(preview?.tomlConfig).toContain('empty = ""');
  });

  it("also masks secrets in Codex TOML previews", () => {
    const preview = parseDeepLinkConfigPreview({
      app: "codex",
      config: encodeBase64(
        JSON.stringify({
          auth: { OPENAI_API_KEY: "secret-auth-key" },
          config: 'experimental_bearer_token = "secret-config-key"',
        }),
      ),
      configFormat: "json",
    });

    expect(preview?.type).toBe("codex");
    expect(preview?.tomlConfig).not.toContain("secret-config-key");
  });
});

it("previews agy wrapped and flat configs without unrelated native options", () => {
  for (const config of [
    {
      env: {
        GEMINI_API_KEY: "fixture",
        GEMINI_MODEL: "legacy",
        NODE_OPTIONS: "ignored",
      },
      config: { model: { name: "native" }, arbitrary: "ignored" },
    },
    {
      GEMINI_API_KEY: "fixture",
      GEMINI_MODEL: "native",
      NODE_OPTIONS: "ignored",
    },
  ]) {
    const preview = parseDeepLinkConfigPreview({
      app: "agy",
      config: encodeBase64(JSON.stringify(config)),
    });
    expect(preview?.type).toBe("agy");
    expect(preview?.model).toBe("native");
    expect(preview?.env).toEqual({ GEMINI_API_KEY: "fixture" });
    expect(JSON.stringify(preview)).not.toContain("ignored");
  }
});
