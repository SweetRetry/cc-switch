import type { ProviderCategory } from "@/types";
import type { PresetTheme } from "./claudeProviderPresets";
import {
  getPiModelCatalogReference,
  piModel,
  type PiCatalogModel,
} from "./piModelCatalog";
import {
  getPiThinkingProfile,
  resolvePiThinkingProfile,
  type PiThinkingLevelMap,
} from "./piThinkingProfiles";
import type { PresetFamilyFields } from "./presetFamilies";

export type PiApiFormat =
  | "openai-completions"
  | "openai-responses"
  | "anthropic-messages"
  | "google-generative-ai"
  | "bedrock-converse-stream";

export type PiPresetModel = PiCatalogModel & {
  thinkingLevelMap?: PiThinkingLevelMap;
  compat?: Record<string, unknown>;
};

export interface PiProviderPreset extends PresetFamilyFields {
  name: string;
  nameKey?: string;
  providerKey: string;
  websiteUrl: string;
  apiKeyUrl?: string;
  settingsConfig: {
    name: string;
    baseUrl: string;
    api: PiApiFormat;
    apiKey: string;
    headers?: Record<string, string>;
    compat?: Record<string, unknown>;
    models: PiPresetModel[];
  };
  category?: ProviderCategory;
  theme?: PresetTheme;
  icon?: string;
  iconColor?: string;
}

const OPENAI_COMPLETIONS_COMPAT = {
  supportsStore: false,
  supportsDeveloperRole: false,
  maxTokensField: "max_tokens",
} as const;

// 1823/132248: thinking.type defaults to "enabled"; disabling requires an explicit
// {"type":"disabled"}. The same doc says reasoning_content need not be echoed back
// on multi-turn, so we don't reuse DEEPSEEK_THINKING_COMPAT wholesale.
const TENCENT_DEEPSEEK_THINKING_COMPAT = {
  ...OPENAI_COMPLETIONS_COMPAT,
  thinkingFormat: "deepseek",
} as const;

const XIAOMI_THINKING_COMPAT = {
  requiresReasoningContentOnAssistantMessages: true,
  thinkingFormat: "deepseek",
} as const;

// DashScope's /compatible-mode/v1 returns reasoning in Qwen's own envelope and
// rejects the `developer` role, so neither OpenAI nor DeepSeek thinking applies.
const QWEN_THINKING_COMPAT = {
  thinkingFormat: "qwen",
  supportsDeveloperRole: false,
} as const;

const KIMI_K3_COMPAT = {
  supportsStore: false,
  supportsDeveloperRole: false,
  supportsReasoningEffort: true,
  maxTokensField: "max_tokens",
  supportsStrictMode: false,
  thinkingFormat: "openai",
  requiresReasoningContentOnAssistantMessages: true,
  deferredToolsMode: "kimi",
} as const;

/**
 * Pi-native provider catalog.
 *
 * This list is independently maintained because provider protocol, endpoint
 * roots and model capabilities are application-specific. It was initially
 * aligned with the OpenCode catalog, but Pi does not import or derive from
 * another application's presets at runtime.
 */
const piProviderPresetDefinitions: PiProviderPreset[] = [
  {
    name: "Kimi",
    family: "kimi",
    planKey: "payg",
    regionKey: "cn",
    providerKey: "cc-switch-kimi",
    websiteUrl: "https://platform.kimi.com",
    apiKeyUrl: "https://platform.kimi.com/console/api-keys",
    settingsConfig: {
      name: "Kimi",
      baseUrl: "https://api.moonshot.cn/v1",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("moonshotai/kimi-k2.7-code", {
          id: "kimi-k2.7-code",
          thinkingProfile: "offUnsupported",
        }),
        {
          ...piModel("moonshotai/kimi-k3", {
            id: "kimi-k3",
            thinkingProfile: "kimi3",
          }),
          compat: { ...KIMI_K3_COMPAT },
        },
        // 官方文档：K3.1 Pro 同 K3 用顶层 reasoning_effort（low/high/max），
        // HighSpeed 与之能力相同
        {
          ...piModel("moonshotai/kimi-k3.1-pro", {
            id: "kimi-k3.1-pro",
            thinkingProfile: "kimi3",
          }),
          compat: { ...KIMI_K3_COMPAT },
        },
        {
          ...piModel("moonshotai/kimi-k3.1-pro-highspeed", {
            id: "kimi-k3.1-pro-highspeed",
            thinkingProfile: "kimi3",
          }),
          compat: { ...KIMI_K3_COMPAT },
        },
        piModel("moonshotai/kimi-k2.7-code-highspeed", {
          id: "kimi-k2.7-code-highspeed",
          thinkingProfile: "offUnsupported",
        }),
        piModel("moonshotai/kimi-k2.6", { id: "kimi-k2.6" }),
      ],
    },
    category: "cn_official",
    icon: "kimi",
    iconColor: "#6366F1",
  },
  // API 开放平台海外/Global 变体：platform.kimi.ai + api.moonshot.ai 端点
  {
    name: "Kimi Global",
    family: "kimi",
    planKey: "payg",
    regionKey: "intl",
    providerKey: "cc-switch-kimi-global",
    websiteUrl: "https://platform.kimi.ai",
    apiKeyUrl: "https://platform.kimi.ai/console/api-keys",
    settingsConfig: {
      name: "Kimi",
      baseUrl: "https://api.moonshot.ai/v1",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("moonshotai/kimi-k2.7-code", {
          id: "kimi-k2.7-code",
          thinkingProfile: "offUnsupported",
        }),
        {
          ...piModel("moonshotai/kimi-k3", {
            id: "kimi-k3",
            thinkingProfile: "kimi3",
          }),
          compat: { ...KIMI_K3_COMPAT },
        },
        // 官方文档：K3.1 Pro 同 K3 用顶层 reasoning_effort（low/high/max），
        // HighSpeed 与之能力相同
        {
          ...piModel("moonshotai/kimi-k3.1-pro", {
            id: "kimi-k3.1-pro",
            thinkingProfile: "kimi3",
          }),
          compat: { ...KIMI_K3_COMPAT },
        },
        {
          ...piModel("moonshotai/kimi-k3.1-pro-highspeed", {
            id: "kimi-k3.1-pro-highspeed",
            thinkingProfile: "kimi3",
          }),
          compat: { ...KIMI_K3_COMPAT },
        },
        piModel("moonshotai/kimi-k2.7-code-highspeed", {
          id: "kimi-k2.7-code-highspeed",
          thinkingProfile: "offUnsupported",
        }),
        piModel("moonshotai/kimi-k2.6", { id: "kimi-k2.6" }),
      ],
    },
    category: "cn_official",
    icon: "kimi",
    iconColor: "#6366F1",
  },
  {
    name: "Kimi For Coding",
    family: "kimi",
    planKey: "coding",
    regionKey: "cn",
    providerKey: "cc-switch-kimi-for-coding",
    websiteUrl: "https://www.kimi.com/code/",
    apiKeyUrl: "https://platform.kimi.com/console/api-keys",
    settingsConfig: {
      name: "Kimi For Coding",
      baseUrl: "https://api.kimi.com/coding",
      api: "anthropic-messages",
      apiKey: "",
      models: [
        piModel("moonshotai/kimi-k2.7-code", {
          id: "kimi-for-coding",
          name: "Kimi For Coding",
          maxTokens: 32768,
        }),
      ],
    },
    category: "cn_official",
    icon: "kimi",
    iconColor: "#6366F1",
  },
  // 海外/Global 变体：kimi.ai/code + api.kimi.ai 端点，其余与国内版一致
  {
    name: "Kimi For Coding Global",
    family: "kimi",
    planKey: "coding",
    regionKey: "intl",
    providerKey: "cc-switch-kimi-for-coding-global",
    websiteUrl: "https://www.kimi.ai/code",
    apiKeyUrl: "https://www.kimi.ai/code",
    settingsConfig: {
      name: "Kimi For Coding",
      baseUrl: "https://api.kimi.ai/coding",
      api: "anthropic-messages",
      apiKey: "",
      models: [
        piModel("moonshotai/kimi-k2.7-code", {
          id: "kimi-for-coding",
          name: "Kimi For Coding",
          maxTokens: 32768,
        }),
      ],
    },
    category: "cn_official",
    icon: "kimi",
    iconColor: "#6366F1",
  },
  {
    name: "火山 Agent Plan",
    family: "volcengine",
    planKey: "agentPlan",
    providerKey: "cc-switch-agentplan",
    websiteUrl: "https://www.volcengine.com/activity/agentplan",
    apiKeyUrl: "https://www.volcengine.com/activity/agentplan",
    settingsConfig: {
      name: "火山 Agent Plan",
      baseUrl: "https://ark.cn-beijing.volces.com/api/plan/v3",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("volcengine/ark-code-latest", {
          id: "ark-code-latest",
        }),
      ],
    },
    category: "cn_official",
    icon: "huoshan",
    iconColor: "#3370FF",
  },
  {
    name: "火山 Coding Plan",
    family: "volcengine",
    planKey: "codingPlan",
    providerKey: "cc-switch-codingplan",
    websiteUrl: "https://www.volcengine.com/activity/codingplan",
    apiKeyUrl: "https://www.volcengine.com/activity/codingplan",
    settingsConfig: {
      name: "火山 Coding Plan",
      baseUrl: "https://ark.cn-beijing.volces.com/api/coding/v3",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("volcengine/ark-code-latest", {
          id: "ark-code-latest",
        }),
      ],
    },
    category: "cn_official",
    icon: "huoshan",
    iconColor: "#3370FF",
  },
  {
    name: "BytePlus",
    providerKey: "cc-switch-byte-plus",
    websiteUrl: "https://www.byteplus.com/en/product/modelark",
    apiKeyUrl: "https://www.byteplus.com/en/product/modelark",
    settingsConfig: {
      name: "BytePlus",
      baseUrl: "https://ark.ap-southeast.bytepluses.com/api/coding/v3",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("volcengine/ark-code-latest", {
          id: "ark-code-latest",
        }),
      ],
    },
    category: "cn_official",
    icon: "byteplus",
    iconColor: "#3370FF",
  },
  {
    name: "Volcengine Doubao",
    family: "volcengine",
    planKey: "payg",
    nameKey: "providerForm.presets.doubaoseed",
    providerKey: "cc-switch-dou-bao-seed",
    websiteUrl:
      "https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey?apikey=%7B%7D",
    apiKeyUrl:
      "https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey?apikey=%7B%7D",
    settingsConfig: {
      name: "Volcengine Doubao",
      baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("volcengine/doubao-seed-2.1-pro", {
          id: "doubao-seed-2-1-pro-260915",
        }),
      ],
    },
    category: "cn_official",
    icon: "doubao",
    iconColor: "#3370FF",
  },
  {
    name: "DeepSeek",
    providerKey: "cc-switch-deep-seek",
    websiteUrl: "https://platform.deepseek.com",
    apiKeyUrl: "https://platform.deepseek.com/api_keys",
    settingsConfig: {
      name: "DeepSeek",
      baseUrl: "https://api.deepseek.com/v1",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("deepseek/deepseek-flash", {
          id: "deepseek-flash",
          thinkingProfile: "deepseekV4",
        }),
      ],
    },
    category: "cn_official",
    icon: "deepseek",
    iconColor: "#1E88E5",
  },
  {
    name: "Zhipu GLM",
    family: "zhipu",
    regionKey: "cn",
    providerKey: "cc-switch-zhipu-glm",
    websiteUrl: "https://open.bigmodel.cn",
    apiKeyUrl: "https://www.bigmodel.cn/claude-code",
    settingsConfig: {
      name: "Zhipu GLM",
      baseUrl: "https://open.bigmodel.cn/api/coding/paas/v4",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("zai/glm-5.3", {
          id: "glm-5.3",
        }),
        piModel("zai/glm-5.3-flash", { id: "glm-5.3-flash" }),
      ],
    },
    category: "cn_official",
    icon: "zhipu",
    iconColor: "#0F62FE",
  },
  {
    name: "Zhipu GLM en",
    family: "zhipu",
    regionKey: "intl",
    providerKey: "cc-switch-zhipu-glm-en",
    websiteUrl: "https://z.ai",
    apiKeyUrl: "https://z.ai/subscribe",
    settingsConfig: {
      name: "Zhipu GLM en",
      baseUrl: "https://api.z.ai/api/coding/paas/v4",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("zai/glm-5.3", {
          id: "glm-5.3",
        }),
        piModel("zai/glm-5.3-flash", { id: "glm-5.3-flash" }),
      ],
    },
    category: "cn_official",
    icon: "zhipu",
    iconColor: "#0F62FE",
  },
  {
    name: "千问AI平台",
    family: "qianwen",
    planKey: "payg",
    providerKey: "cc-switch-qianwenai",
    websiteUrl: "https://platform.qianwenai.com/",
    apiKeyUrl: "https://platform.qianwenai.com/home/api-keys",
    settingsConfig: {
      name: "千问AI平台",
      baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      api: "openai-completions",
      apiKey: "",
      models: [
        {
          ...piModel("qwen/qwen3.8-max", {
            id: "qwen3.8-max",
          }),
          compat: { ...QWEN_THINKING_COMPAT },
        },
      ],
    },
    category: "cn_official",
    icon: "qianwenai",
    iconColor: "#624AFF",
  },
  {
    name: "千问AI平台 Token Plan",
    family: "qianwen",
    planKey: "tokenPlan",
    providerKey: "cc-switch-qianwenai-token-plan",
    websiteUrl: "https://platform.qianwenai.com/pricing/token-plan",
    apiKeyUrl: "https://platform.qianwenai.com/home/api-keys",
    settingsConfig: {
      name: "千问AI平台 Token Plan",
      baseUrl:
        "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
      api: "openai-completions",
      apiKey: "",
      models: [
        {
          ...piModel("qwen/qwen3.8-max", { id: "qwen3.8-max" }),
          compat: { ...QWEN_THINKING_COMPAT },
        },
        {
          ...piModel("qwen/qwen3.8-flash", { id: "qwen3.8-flash" }),
          compat: { ...QWEN_THINKING_COMPAT },
        },
      ],
    },
    category: "cn_official",
    icon: "qianwenai",
    iconColor: "#624AFF",
  },
  // ===== QwenCloud（DashScope 国际站）=====
  // 与上面国内条目是两套独立站点：域名、控制台、密钥互不通用。
  // 按量付费与 Token Plan 都走 OpenAI 兼容层（/compatible-mode/v1）。
  {
    name: "QwenCloud",
    family: "qwencloud",
    planKey: "payg",
    providerKey: "cc-switch-qwencloud",
    websiteUrl: "https://home.qwencloud.com/",
    apiKeyUrl: "https://home.qwencloud.com/api-keys",
    settingsConfig: {
      name: "QwenCloud",
      baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
      api: "openai-completions",
      apiKey: "",
      models: [
        {
          ...piModel("qwen/qwen3.8-max", { id: "qwen3.8-max" }),
          compat: { ...QWEN_THINKING_COMPAT },
        },
        {
          ...piModel("qwen/qwen3.8-flash", { id: "qwen3.8-flash" }),
          compat: { ...QWEN_THINKING_COMPAT },
        },
        {
          ...piModel("qwen/qwen3.7-max", { id: "qwen3.7-max" }),
          compat: { ...QWEN_THINKING_COMPAT },
        },
      ],
    },
    category: "cn_official",
    icon: "qwencloud",
    iconColor: "#6336E7",
  },
  {
    name: "QwenCloud For Coding",
    family: "qwencloud",
    planKey: "coding",
    providerKey: "cc-switch-qwencloud-coding",
    websiteUrl: "https://www.qwencloud.com",
    apiKeyUrl: "https://home.qwencloud.com/api-keys",
    settingsConfig: {
      name: "QwenCloud For Coding",
      baseUrl: "https://coding-intl.dashscope.aliyuncs.com/apps/anthropic",
      api: "anthropic-messages",
      apiKey: "",
      models: [
        piModel("qwen/qwen3.7-plus", { id: "qwen3.7-plus" }),
        piModel("qwen/qwen3-coder-plus", {
          id: "qwen3-coder-plus",
          contextWindow: 131_072,
        }),
      ],
    },
    category: "cn_official",
    icon: "qwencloud",
    iconColor: "#6336E7",
  },
  {
    name: "QwenCloud Token Plan",
    family: "qwencloud",
    planKey: "tokenPlan",
    providerKey: "cc-switch-qwencloud-token-plan",
    websiteUrl: "https://www.qwencloud.com/pricing/token-plan",
    apiKeyUrl: "https://home.qwencloud.com/api-keys",
    settingsConfig: {
      name: "QwenCloud Token Plan",
      baseUrl:
        "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
      api: "openai-completions",
      apiKey: "",
      models: [
        {
          ...piModel("qwen/qwen3.8-max", { id: "qwen3.8-max" }),
          compat: { ...QWEN_THINKING_COMPAT },
        },
        {
          ...piModel("qwen/qwen3.8-flash", { id: "qwen3.8-flash" }),
          compat: { ...QWEN_THINKING_COMPAT },
        },
        {
          ...piModel("qwen/qwen3.7-max", { id: "qwen3.7-max" }),
          compat: { ...QWEN_THINKING_COMPAT },
        },
      ],
    },
    category: "cn_official",
    icon: "qwencloud",
    iconColor: "#6336E7",
  },
  {
    name: "StepFun",
    family: "stepfun",
    regionKey: "cn",
    providerKey: "cc-switch-step-fun",
    websiteUrl: "https://platform.stepfun.com/step-plan",
    apiKeyUrl: "https://platform.stepfun.com/interface-key",
    settingsConfig: {
      name: "StepFun",
      baseUrl: "https://api.stepfun.com/step_plan/v1",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("stepfun/step-3.5-flash", {
          id: "step-3.5-flash-2603",
          name: "Step 3.5 Flash 2603",
        }),
        piModel("stepfun/step-3.5-flash", {
          id: "step-3.5-flash",
        }),
        piModel("stepfun/step-3.7-flash", { id: "step-3.7-flash" }),
        piModel("stepfun/step-5-preview", { id: "step-5-preview" }),
      ],
    },
    category: "cn_official",
    icon: "stepfun",
    iconColor: "#16D6D2",
  },
  {
    name: "StepFun en",
    family: "stepfun",
    regionKey: "intl",
    providerKey: "cc-switch-step-fun-en",
    websiteUrl: "https://platform.stepfun.ai/step-plan",
    apiKeyUrl: "https://platform.stepfun.ai/interface-key",
    settingsConfig: {
      name: "StepFun en",
      baseUrl: "https://api.stepfun.ai/step_plan/v1",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("stepfun/step-3.5-flash", {
          id: "step-3.5-flash-2603",
          name: "Step 3.5 Flash 2603",
        }),
        piModel("stepfun/step-3.5-flash", {
          id: "step-3.5-flash",
        }),
        piModel("stepfun/step-3.7-flash", { id: "step-3.7-flash" }),
        piModel("stepfun/step-5-preview", { id: "step-5-preview" }),
      ],
    },
    category: "cn_official",
    icon: "stepfun",
    iconColor: "#16D6D2",
  },
  {
    name: "StepFun Step Plan",
    providerKey: "cc-switch-step-fun-step-plan",
    websiteUrl: "https://platform.stepfun.com/docs/zh/step-plan/overview",
    apiKeyUrl: "https://platform.stepfun.com/interface-key",
    settingsConfig: {
      name: "StepFun Step Plan",
      baseUrl: "https://api.stepfun.com/step_plan/v1",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("stepfun/step-3.5-flash", {
          id: "step-3.5-flash",
        }),
        piModel("stepfun/step-3.7-flash", { id: "step-3.7-flash" }),
        piModel("stepfun/step-5-preview", { id: "step-5-preview" }),
      ],
    },
    category: "cn_official",
    icon: "stepfun",
    iconColor: "#005AFF",
  },
  {
    name: "StreamLake",
    family: "streamlake",
    regionKey: "cn",
    providerKey: "cc-switch-streamlake",
    websiteUrl: "https://www.streamlake.com",
    apiKeyUrl: "https://console.streamlake.com/console/wanqing/api-key",
    settingsConfig: {
      name: "StreamLake",
      baseUrl: "https://wanqing.streamlakeapi.com/api/gateway/v1/endpoints",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("streamlake/kat-coder-pro-v2.5", {
          id: "kat-coder-pro-v2.5",
        }),
      ],
    },
    category: "cn_official",
    icon: "streamlake",
  },
  {
    name: "StreamLake en",
    family: "streamlake",
    regionKey: "intl",
    providerKey: "cc-switch-kat-coder",
    websiteUrl: "https://console.streamlake.ai",
    apiKeyUrl: "https://console.streamlake.ai/console/api-key",
    settingsConfig: {
      name: "StreamLake en",
      baseUrl: "https://vanchin.streamlake.ai/api/gateway/v1/endpoints",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("streamlake/kat-coder-pro-v2.5", {
          id: "kat-coder-pro-v2.5",
        }),
      ],
    },
    category: "cn_official",
    icon: "streamlake",
  },
  {
    name: "Longcat",
    providerKey: "cc-switch-longcat",
    websiteUrl: "https://longcat.chat/platform",
    apiKeyUrl: "https://longcat.chat/platform/api_keys",
    settingsConfig: {
      name: "Longcat",
      baseUrl: "https://api.longcat.chat/openai/v1",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("longcat/longcat-2.0", {
          id: "LongCat-2.0",
        }),
      ],
    },
    category: "cn_official",
    icon: "longcat",
    iconColor: "#29E154",
  },
  {
    name: "MiniMax",
    family: "minimax",
    regionKey: "cn",
    providerKey: "cc-switch-mini-max",
    websiteUrl: "https://platform.minimax.cn",
    apiKeyUrl: "https://platform.minimax.cn/subscribe/token-plan",
    settingsConfig: {
      name: "MiniMax",
      baseUrl: "https://api.minimax.cn/v1",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("minimax/minimax-m3.1-flash", {
          id: "MiniMax-M3.1-Flash",
          maxTokens: 131072,
        }),
        piModel("minimax/minimax-m3", {
          id: "MiniMax-M3",
          maxTokens: 131072,
        }),
      ],
    },
    category: "cn_official",
    theme: {
      backgroundColor: "#f64551",
      textColor: "#FFFFFF",
    },
    icon: "minimax",
    iconColor: "#FF6B6B",
  },
  {
    name: "MiniMax en",
    family: "minimax",
    regionKey: "intl",
    providerKey: "cc-switch-mini-max-en",
    websiteUrl: "https://platform.minimax.io",
    apiKeyUrl: "https://platform.minimax.io/subscribe/coding-plan",
    settingsConfig: {
      name: "MiniMax en",
      baseUrl: "https://api.minimax.io/v1",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("minimax/minimax-m3.1-flash", {
          id: "MiniMax-M3.1-Flash",
          maxTokens: 131072,
        }),
        piModel("minimax/minimax-m3", {
          id: "MiniMax-M3",
          maxTokens: 131072,
        }),
      ],
    },
    category: "cn_official",
    theme: {
      backgroundColor: "#f64551",
      textColor: "#FFFFFF",
    },
    icon: "minimax",
    iconColor: "#FF6B6B",
  },
  {
    name: "BaiLing",
    providerKey: "cc-switch-bai-ling",
    websiteUrl: "https://developer.ant-ling.com/zh-CN/docs/",
    apiKeyUrl: "https://chat.ant-ling.com/open",
    settingsConfig: {
      name: "BaiLing",
      baseUrl: "https://api.ant-ling.com/v1",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("inclusionai/ling-2.6-1t", {
          id: "Ling-2.6-1T",
        }),
      ],
    },
    category: "cn_official",
    icon: "bailing",
  },
  {
    name: "Xiaomi MiMo",
    family: "xiaomi-mimo",
    planKey: "payg",
    providerKey: "cc-switch-xiaomi-mi-mo",
    websiteUrl: "https://platform.xiaomimimo.com",
    apiKeyUrl: "https://platform.xiaomimimo.com/#/console/api-keys",
    settingsConfig: {
      name: "Xiaomi MiMo",
      baseUrl: "https://api.xiaomimimo.com/v1",
      api: "openai-completions",
      apiKey: "",
      models: [
        {
          ...piModel("xiaomi/mimo-v2.6-pro", { id: "mimo-v2.6-pro" }),
          compat: XIAOMI_THINKING_COMPAT,
        },
        {
          ...piModel("xiaomi/mimo-v2.6-flash", { id: "mimo-v2.6-flash" }),
          compat: XIAOMI_THINKING_COMPAT,
        },
        {
          ...piModel("xiaomi/mimo-v2.6-pro-ultraspeed", {
            id: "mimo-v2.6-pro-ultraspeed",
          }),
          compat: XIAOMI_THINKING_COMPAT,
        },
      ],
    },
    category: "cn_official",
    icon: "xiaomimimo",
    iconColor: "#000000",
  },
  {
    name: "Xiaomi MiMo Token Plan (China)",
    family: "xiaomi-mimo",
    planKey: "tokenPlan",
    providerKey: "cc-switch-xiaomi-mi-mo-token-plan-china",
    websiteUrl: "https://platform.xiaomimimo.com/#/token-plan",
    apiKeyUrl: "https://platform.xiaomimimo.com/#/console/plan-manage",
    settingsConfig: {
      name: "Xiaomi MiMo Token Plan (China)",
      baseUrl: "https://token-plan-cn.xiaomimimo.com/v1",
      api: "openai-completions",
      apiKey: "",
      models: [
        {
          ...piModel("xiaomi/mimo-v2.6-pro", { id: "mimo-v2.6-pro" }),
          compat: XIAOMI_THINKING_COMPAT,
        },
        {
          ...piModel("xiaomi/mimo-v2.6-flash", { id: "mimo-v2.6-flash" }),
          compat: XIAOMI_THINKING_COMPAT,
        },
      ],
    },
    category: "cn_official",
    icon: "xiaomimimo",
    iconColor: "#000000",
  },
  {
    // Pi 运行时没有内置本机 Ollama provider，Pi 文档自己就用 models.json 写它
    name: "Ollama",
    providerKey: "cc-switch-ollama",
    websiteUrl: "https://ollama.com",
    settingsConfig: {
      name: "Ollama",
      // Pi 文档（pi-mono packages/coding-agent/docs/models.md，2026-10-14
      // 核对）的本机写法：openai-completions + http://localhost:11434/v1。
      // 服务端不校验 Key，但 Pi 文档说要填一个占位 Key 模型才会出现在列表里，
      // 添加后手填 ollama。模型换成自己已下载的
      baseUrl: "http://localhost:11434/v1",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("qwen/qwen3.5", { id: "qwen3.5" }),
        piModel("openai/gpt-oss-20b", { id: "gpt-oss:20b" }),
      ],
    },
    category: "local",
    icon: "ollama",
  },
  {
    // Pi 运行时没有内置 LM Studio provider（pi-mono models.generated.ts 搜不到），
    // Pi 文档自己就用 models.json 写它，不违反「勿写内置节点」契约
    name: "LM Studio",
    providerKey: "cc-switch-lmstudio",
    websiteUrl: "https://lmstudio.ai",
    settingsConfig: {
      name: "LM Studio",
      // 本机 OpenAI Chat base http://localhost:1234/v1（lmstudio.ai/docs/
      // developer/openai-compat、pi-mono packages/coding-agent/docs/models.md，
      // 2026-10-14 核对）。默认不鉴权，但 Pi 要填一个占位 Key 模型才会出现在
      // 列表里，添加后手填 lmstudio。Chat 上的 reasoning_effort 未证实，同 Groq
      // 先例不写 thinkingProfile，compat 按通用 OpenAI Completions 写；最大输出
      // 取 models.dev 的 lmstudio 条目（目录里的 65536 来自 Groq）。模型换成
      // 自己已下载的；实际窗口受 LM Studio 加载时的 context length 限制
      baseUrl: "http://localhost:1234/v1",
      api: "openai-completions",
      apiKey: "",
      models: [
        {
          ...piModel("openai/gpt-oss-20b", {
            id: "openai/gpt-oss-20b",
            maxTokens: 32_768,
          }),
          compat: { ...OPENAI_COMPLETIONS_COMPAT },
        },
      ],
    },
    category: "local",
    icon: "lmstudio",
  },
  {
    // Pi 运行时没有内置 vLLM provider（pi-mono models.generated.ts 搜不到），
    // Pi 文档把 vLLM 列为用 models.json 配置兼容端点的场景，不违反「勿写内置
    // 节点」契约
    name: "vLLM",
    providerKey: "cc-switch-vllm",
    websiteUrl: "https://vllm.ai",
    settingsConfig: {
      name: "vLLM",
      // 本机 vllm serve 的 OpenAI Chat base http://localhost:8000/v1
      //（docs.vllm.ai/en/latest/serving/online_serving/openai_compatible_server、
      // pi-mono packages/coding-agent/docs/models.md，2026-10-14 核对）。不带
      // --api-key 时不校验，但 Pi 要填一个非空占位 Key 模型才会出现在列表里，
      // 添加后手填 dummy（带了 --api-key 就填那个值）。工具调用要启动时加
      // --enable-auto-tool-choice --tool-call-parser qwen3_coder。档位映射没有
      // 逐模型证据，不写 thinkingProfile。默认模型须与 /v1/models 的 id 一致，
      // 换成自己已下载的；实际窗口受 --max-model-len 限制
      baseUrl: "http://localhost:8000/v1",
      api: "openai-completions",
      apiKey: "",
      models: [piModel("qwen/qwen3.6-27b", { id: "Qwen/Qwen3.6-27B" })],
    },
    category: "local",
    icon: "vllm",
  },
  {
    name: "Meta Model API",
    providerKey: "cc-switch-meta",
    websiteUrl: "https://dev.meta.ai",
    apiKeyUrl: "https://dev.meta.ai",
    settingsConfig: {
      name: "Meta Model API",
      // OpenAI Chat 端点 /v1/chat/completions（dev.meta.ai/docs/coding-agents.md，
      // 2026-10-14 核对），Bearer 鉴权。两款常开思考（none 返回 400），关闭档
      // 隐藏；xhigh/max 原样发（dev.meta.ai/docs/reasoning.md）。Chat 参数表只
      // 列到 xhigh，max 是否被 Chat 接受未实测
      baseUrl: "https://api.meta.ai/v1",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("meta/muse-wonder-1.0", {
          id: "muse-wonder-1.0",
          thinkingProfile: "offUnsupportedXhighAndMax",
        }),
        piModel("meta/muse-spark-1.3", {
          id: "muse-spark-1.3",
          thinkingProfile: "offUnsupportedXhighAndMax",
        }),
      ],
    },
    category: "cn_official",
    icon: "meta",
  },
  {
    name: "Microsoft Foundry",
    providerKey: "cc-switch-microsoft-foundry",
    websiteUrl: "https://azure.microsoft.com/en-us/products/ai-foundry",
    apiKeyUrl: "https://ai.azure.com/",
    settingsConfig: {
      name: "Microsoft Foundry",
      // 同 Claude Code 预设：Anthropic 端点 base 为 https://<资源名>.services.ai.azure.com/
      // anthropic、不带 /v1，API Key 发 x-api-key（learn.microsoft.com/en-us/azure/
      // foundry/foundry-models/how-to/use-foundry-models-claude，2026-10-14 核对）；
      // pi-ai 对普通 Key 走 Anthropic SDK 的 apiKey，发的正是 x-api-key。Pi 内置的
      // azure-openai-responses 只管 GPT，Claude 须自定义节点。资源名用字面占位符；
      // 模型 ID 填默认部署名，自定义了须同步改。Haiku 5.5 为 1M / 128K、支持思考
      //（learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/
      // claude-models 同日），目录里原先没有，已补
      baseUrl: "https://YOUR_RESOURCE_NAME.services.ai.azure.com/anthropic",
      api: "anthropic-messages",
      apiKey: "",
      models: [
        piModel("anthropic/claude-opus-5.5", { id: "claude-opus-5-5" }),
        piModel("anthropic/claude-sonnet-5.5", { id: "claude-sonnet-5-5" }),
        piModel("anthropic/claude-haiku-5.5", { id: "claude-haiku-5-5" }),
      ],
    },
    category: "cloud_provider",
    icon: "azure",
    iconColor: "#0078D4",
  },
  {
    name: "AWS Bedrock",
    providerKey: "cc-switch-aws-bedrock",
    websiteUrl: "https://aws.amazon.com/bedrock/",
    settingsConfig: {
      name: "AWS Bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      api: "bedrock-converse-stream",
      apiKey: "",
      models: [
        piModel("anthropic/claude-opus-5", {
          id: "global.anthropic.claude-opus-5",
          thinkingProfile: "xhighAndMax",
        }),
        piModel("anthropic/claude-sonnet-5", {
          id: "global.anthropic.claude-sonnet-5",
          thinkingProfile: "xhighAndMax",
        }),
        piModel("anthropic/claude-haiku-4.5-20251001", {
          id: "global.anthropic.claude-haiku-4-5-20251001-v1:0",
        }),
        piModel("amazon/nova-pro", {
          id: "us.amazon.nova-pro-v1:0",
        }),
        piModel("meta/llama-4-maverick", {
          id: "us.meta.llama4-maverick-17b-instruct-v1:0",
        }),
        piModel("deepseek/deepseek-r1", {
          id: "us.deepseek.r1-v1:0",
        }),
      ],
    },
    category: "cloud_provider",
    icon: "aws",
    iconColor: "#FF9900",
  },
  // ===== 腾讯云 Token Plan（订阅套餐，产品线 1823/1300）=====
  // 与 claude/codex/opencode/hermes/openclaw 六 app 的腾讯预设同源：
  // 个人版国内走 api.lkeap.cloud.tencent.com/plan，其余走 tencentmaas.com/plan
  // 域族；两站 Key 不互通，双地域候选（国内→新加坡、国际→广州）仅在企业
  // 套餐存在。Pi 预设只携带默认地域 baseUrl（PiProviderPreset 无
  // endpointCandidates 字段），需要第二地域的用户在 UI 中手动改 baseUrl。
  {
    name: "Tencent Token Plan",
    family: "tencent",
    planKey: "tokenPlan",
    regionKey: "cn",
    providerKey: "cc-switch-tencent-token-plan",
    websiteUrl: "https://cloud.tencent.com/product/tokenhub",
    apiKeyUrl: "https://console.cloud.tencent.com/tokenhub/tokenplan",
    settingsConfig: {
      name: "Tencent Token Plan",
      baseUrl: "https://api.lkeap.cloud.tencent.com/plan/v3",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("tencent/tokenplan-auto", { id: "tc-code-latest" }),
        {
          ...piModel("deepseek/deepseek-v4-flash", {
            id: "deepseek-v4-flash-202605",
            name: "DeepSeek V4 Flash Official",
            thinkingProfile: "deepseekV4",
          }),
          compat: { ...TENCENT_DEEPSEEK_THINKING_COMPAT },
        },
        piModel("minimax/minimax-m2.7", { id: "minimax-m2.7" }),
        piModel("zai/glm-5", { id: "glm-5" }),
        piModel("zai/glm-5.1", { id: "glm-5.1" }),
        piModel("zai/glm-5.2", { id: "glm-5.2" }),
        piModel("tencent/hy3", { id: "hy3" }),
        piModel("tencent/hy3-preview", { id: "hy3-preview" }),
      ],
    },
    category: "cn_official",
    icon: "tencent",
    iconColor: "#00A4FF",
  },
  {
    name: "Tencent Token Plan (Intl)",
    family: "tencent",
    planKey: "tokenPlan",
    regionKey: "intl",
    providerKey: "cc-switch-tencent-token-plan-intl",
    websiteUrl: "https://www.tencentcloud.com/products/tokenhub",
    apiKeyUrl: "https://console.tencentcloud.com/tokenhub/tokenplan",
    settingsConfig: {
      name: "Tencent Token Plan (Intl)",
      baseUrl: "https://tokenhub-intl.tencentcloudmaas.com/plan/v3",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("tencent/tokenplan-auto", { id: "auto" }),
        piModel("zai/glm-5.2", { id: "glm-5.2" }),
        piModel("moonshotai/kimi-k2.6", { id: "kimi-k2.6" }),
        {
          ...piModel("deepseek/deepseek-v4-flash", {
            id: "deepseek-v4-flash-202605",
            name: "DeepSeek V4 Flash Official",
            thinkingProfile: "deepseekV4",
          }),
          compat: { ...TENCENT_DEEPSEEK_THINKING_COMPAT },
        },
        piModel("minimax/minimax-m3", { id: "minimax-m3" }),
      ],
    },
    category: "cn_official",
    icon: "tencent",
    iconColor: "#00A4FF",
  },
  {
    name: "Tencent Token Plan Enterprise Pro",
    family: "tencent",
    planKey: "enterprisePro",
    regionKey: "cn",
    providerKey: "cc-switch-tencent-token-plan-enterprise-pro",
    websiteUrl: "https://cloud.tencent.com/product/tokenhub",
    apiKeyUrl: "https://console.cloud.tencent.com/tokenhub/tokenplan-e",
    settingsConfig: {
      name: "Tencent Token Plan Enterprise Pro",
      baseUrl: "https://tokenhub.tencentmaas.com/plan/v3",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("tencent/tokenplan-auto", { id: "auto" }),
        piModel("zai/glm-5.3", { id: "glm-5.3" }),
        piModel("zai/glm-5.2", { id: "glm-5.2" }),
        piModel("zai/glm-5", { id: "glm-5" }),
        piModel("zai/glm-5.1", { id: "glm-5.1" }),
        piModel("zai/glm-5-turbo", { id: "glm-5-turbo" }),
        piModel("moonshotai/kimi-k2.7-code", {
          id: "kimi-k2.7-code",
          thinkingProfile: "offUnsupported",
        }),
        piModel("moonshotai/kimi-k2.7-code-highspeed", {
          id: "kimi-k2.7-code-highspeed",
          thinkingProfile: "offUnsupported",
        }),
        piModel("moonshotai/kimi-k2.6", { id: "kimi-k2.6" }),
        piModel("minimax/minimax-m3", { id: "minimax-m3" }),
        {
          ...piModel("deepseek/deepseek-v4-flash", {
            id: "deepseek-v4-flash",
            thinkingProfile: "deepseekV4",
          }),
          compat: { ...TENCENT_DEEPSEEK_THINKING_COMPAT },
        },
        {
          ...piModel("deepseek/deepseek-v4-flash", {
            id: "deepseek-v4-flash-0731",
            name: "DeepSeek V4 Flash 0731 GA",
            thinkingProfile: "deepseekV4",
          }),
          compat: { ...TENCENT_DEEPSEEK_THINKING_COMPAT },
        },
        {
          ...piModel("deepseek/deepseek-v4-flash", {
            id: "deepseek-v4-flash-202605",
            name: "DeepSeek V4 Flash Official",
            thinkingProfile: "deepseekV4",
          }),
          compat: { ...TENCENT_DEEPSEEK_THINKING_COMPAT },
        },
      ],
    },
    category: "cn_official",
    icon: "tencent",
    iconColor: "#00A4FF",
  },
  {
    name: "Tencent Token Plan Enterprise Pro (Intl)",
    family: "tencent",
    planKey: "enterprisePro",
    regionKey: "intl",
    providerKey: "cc-switch-tencent-token-plan-enterprise-pro-intl",
    websiteUrl: "https://www.tencentcloud.com/products/tokenhub",
    apiKeyUrl: "https://console.tencentcloud.com/tokenhub/tokenplan-e",
    settingsConfig: {
      name: "Tencent Token Plan Enterprise Pro (Intl)",
      baseUrl: "https://tokenhub-intl.tencentcloudmaas.com/plan/v3",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("tencent/tokenplan-auto", { id: "auto" }),
        piModel("zai/glm-5.3", { id: "glm-5.3" }),
        piModel("zai/glm-5.2", { id: "glm-5.2" }),
        piModel("minimax/minimax-m3", { id: "minimax-m3" }),
        piModel("moonshotai/kimi-k2.7-code", {
          id: "kimi-k2.7-code",
          thinkingProfile: "offUnsupported",
        }),
        piModel("moonshotai/kimi-k2.7-code-highspeed", {
          id: "kimi-k2.7-code-highspeed",
          thinkingProfile: "offUnsupported",
        }),
        {
          ...piModel("deepseek/deepseek-v4-flash", {
            id: "deepseek-v4-flash",
            thinkingProfile: "deepseekV4",
          }),
          compat: { ...TENCENT_DEEPSEEK_THINKING_COMPAT },
        },
        {
          ...piModel("deepseek/deepseek-v4-flash", {
            id: "deepseek-v4-flash-0731",
            name: "DeepSeek V4 Flash 0731 GA",
            thinkingProfile: "deepseekV4",
          }),
          compat: { ...TENCENT_DEEPSEEK_THINKING_COMPAT },
        },
        {
          ...piModel("deepseek/deepseek-v4-flash", {
            id: "deepseek-v4-flash-202605",
            name: "DeepSeek V4 Flash Official",
            thinkingProfile: "deepseekV4",
          }),
          compat: { ...TENCENT_DEEPSEEK_THINKING_COMPAT },
        },
      ],
    },
    category: "cn_official",
    icon: "tencent",
    iconColor: "#00A4FF",
  },
  {
    name: "Tencent Token Plan Enterprise Lite",
    family: "tencent",
    planKey: "enterpriseLite",
    regionKey: "cn",
    providerKey: "cc-switch-tencent-token-plan-enterprise-lite",
    websiteUrl: "https://cloud.tencent.com/product/tokenhub",
    apiKeyUrl: "https://console.cloud.tencent.com/tokenhub/tokenplan-e",
    settingsConfig: {
      name: "Tencent Token Plan Enterprise Lite",
      baseUrl: "https://tokenhub.tencentmaas.com/plan/v3",
      api: "openai-completions",
      apiKey: "",
      models: [piModel("tencent/tokenplan-auto", { id: "auto" })],
    },
    category: "cn_official",
    icon: "tencent",
    iconColor: "#00A4FF",
  },
  {
    name: "Tencent Token Plan Enterprise Lite (Intl)",
    family: "tencent",
    planKey: "enterpriseLite",
    regionKey: "intl",
    providerKey: "cc-switch-tencent-token-plan-enterprise-lite-intl",
    websiteUrl: "https://www.tencentcloud.com/products/tokenhub",
    apiKeyUrl: "https://console.tencentcloud.com/tokenhub/tokenplan-e",
    settingsConfig: {
      name: "Tencent Token Plan Enterprise Lite (Intl)",
      baseUrl: "https://tokenhub-intl.tencentcloudmaas.com/plan/v3",
      api: "openai-completions",
      apiKey: "",
      models: [piModel("tencent/tokenplan-auto", { id: "auto" })],
    },
    category: "cn_official",
    icon: "tencent",
    iconColor: "#00A4FF",
  },
  // ===== 腾讯云 TokenHub（按量付费 API 市场，产品线 1823/1300，/v1 端点）=====
  // 与 Token Plan 订阅线（/plan 端点）是两条独立产品线：Key 不互通、端点不同。
  // 模型清单取自官方「语言模型」列表（国内 130051 / 国际 78934），只收录支持
  // Function Calling 的通用语言模型；翻译（hy-mt2）、角色扮演（hy-role）等
  // 专用模型不收录（无法用于编码 agent）。
  {
    name: "Tencent TokenHub",
    family: "tencent",
    planKey: "payg",
    regionKey: "cn",
    providerKey: "cc-switch-tencent-tokenhub",
    websiteUrl: "https://cloud.tencent.com/product/tokenhub",
    apiKeyUrl: "https://console.cloud.tencent.com/tokenhub/apikey",
    settingsConfig: {
      name: "Tencent TokenHub",
      baseUrl: "https://tokenhub.tencentmaas.com/v1",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("tencent/hy4-preview", { id: "hy4-preview" }),
        piModel("tencent/hy3", { id: "hy3" }),
        {
          ...piModel("deepseek/deepseek-v4-flash", {
            id: "deepseek-v4-flash-202605",
            name: "DeepSeek V4 Flash Official",
            thinkingProfile: "deepseekV4",
          }),
          compat: { ...TENCENT_DEEPSEEK_THINKING_COMPAT },
        },
        {
          ...piModel("deepseek/deepseek-v4-flash-vision-exp", {
            id: "deepseek/deepseek-v4-flash-vision-exp",
            thinkingProfile: "deepseekV4",
          }),
          compat: { ...TENCENT_DEEPSEEK_THINKING_COMPAT },
        },
        {
          ...piModel("deepseek/deepseek-v4-flash", {
            id: "deepseek-v4-flash-0731",
            name: "DeepSeek V4 Flash 0731 GA",
            thinkingProfile: "deepseekV4",
          }),
          compat: { ...TENCENT_DEEPSEEK_THINKING_COMPAT },
        },
        {
          ...piModel("deepseek/deepseek-v4-flash", {
            id: "deepseek-v4-flash",
            thinkingProfile: "deepseekV4",
          }),
          compat: { ...TENCENT_DEEPSEEK_THINKING_COMPAT },
        },
        piModel("zai/glm-5.3-flash", { id: "glm-5.3-flash" }),
        piModel("zai/glm-5.3", { id: "glm-5.3" }),
        piModel("zai/glm-5.2", { id: "glm-5.2" }),
        piModel("zai/glm-5.1", { id: "glm-5.1" }),
        piModel("zai/glm-5v-turbo", { id: "glm-5v-turbo" }),
        piModel("zai/glm-5-turbo", { id: "glm-5-turbo" }),
        piModel("zai/glm-5", { id: "glm-5" }),
        piModel("moonshotai/kimi-k2.7-code-highspeed", {
          id: "kimi-k2.7-code-highspeed",
          thinkingProfile: "offUnsupported",
        }),
        piModel("moonshotai/kimi-k3", { id: "kimi-k3" }),
        piModel("moonshotai/kimi-k2.7-code", {
          id: "kimi-k2.7-code",
          thinkingProfile: "offUnsupported",
        }),
        piModel("moonshotai/kimi-k2.6", { id: "kimi-k2.6" }),
        piModel("moonshotai/kimi-k2.5", { id: "kimi-k2.5" }),
        piModel("minimax/minimax-m3", { id: "minimax-m3" }),
        piModel("minimax/minimax-m2.7", { id: "minimax-m2.7" }),
        piModel("xiaomi/mimo-v2.5-pro", { id: "mimo-v2.5-pro" }),
      ],
    },
    category: "cn_official",
    icon: "tencent",
    iconColor: "#00A4FF",
  },
  {
    name: "Tencent TokenHub (Intl)",
    family: "tencent",
    planKey: "payg",
    regionKey: "intl",
    providerKey: "cc-switch-tencent-tokenhub-intl",
    websiteUrl: "https://www.tencentcloud.com/products/tokenhub",
    apiKeyUrl: "https://console.tencentcloud.com/tokenhub/apikey",
    settingsConfig: {
      name: "Tencent TokenHub (Intl)",
      baseUrl: "https://tokenhub-intl.tencentcloudmaas.com/v1",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("tencent/hy4-preview", { id: "hy4-preview" }),
        piModel("tencent/hy3", { id: "hy3" }),
        {
          ...piModel("deepseek/deepseek-v4-flash", {
            id: "deepseek-v4-flash-202605",
            name: "DeepSeek V4 Flash Official",
            thinkingProfile: "deepseekV4",
          }),
          compat: { ...TENCENT_DEEPSEEK_THINKING_COMPAT },
        },
        {
          ...piModel("deepseek/deepseek-v4-flash-vision-exp", {
            id: "deepseek/deepseek-v4-flash-vision-exp",
            thinkingProfile: "deepseekV4",
          }),
          compat: { ...TENCENT_DEEPSEEK_THINKING_COMPAT },
        },
        {
          ...piModel("deepseek/deepseek-v4-flash", {
            id: "deepseek-v4-flash-0731",
            name: "DeepSeek V4 Flash 0731 GA",
            thinkingProfile: "deepseekV4",
          }),
          compat: { ...TENCENT_DEEPSEEK_THINKING_COMPAT },
        },
        {
          ...piModel("deepseek/deepseek-v4-flash", {
            id: "deepseek-v4-flash",
            thinkingProfile: "deepseekV4",
          }),
          compat: { ...TENCENT_DEEPSEEK_THINKING_COMPAT },
        },
        {
          ...piModel("deepseek/deepseek-v3.2", {
            id: "deepseek-v3.2",
            thinkingProfile: "deepseekV4",
          }),
          compat: { ...TENCENT_DEEPSEEK_THINKING_COMPAT },
        },
        piModel("zai/glm-5.3", { id: "glm-5.3" }),
        piModel("zai/glm-5.3-flash", { id: "glm-5.3-flash" }),
        piModel("zai/glm-5.2", { id: "glm-5.2" }),
        piModel("zai/glm-5", { id: "glm-5" }),
        piModel("zai/glm-5-turbo", { id: "glm-5-turbo" }),
        piModel("zai/glm-5v-turbo", { id: "glm-5v-turbo" }),
        piModel("zai/glm-5.1", { id: "glm-5.1" }),
        piModel("moonshotai/kimi-k3", { id: "kimi-k3" }),
        piModel("moonshotai/kimi-k2.7-code-highspeed", {
          id: "kimi-k2.7-code-highspeed",
          thinkingProfile: "offUnsupported",
        }),
        piModel("moonshotai/kimi-k2.7-code", {
          id: "kimi-k2.7-code",
          thinkingProfile: "offUnsupported",
        }),
        piModel("moonshotai/kimi-k2.6", { id: "kimi-k2.6" }),
        piModel("moonshotai/kimi-k2.5", { id: "kimi-k2.5" }),
        piModel("minimax/minimax-m3", { id: "minimax-m3" }),
        piModel("minimax/minimax-m2.7", { id: "minimax-m2.7" }),
        piModel("xiaomi/mimo-v2.5-pro", { id: "mimo-v2.5-pro" }),
      ],
    },
    category: "cn_official",
    icon: "tencent",
    iconColor: "#00A4FF",
  },
  {
    // Pi 运行时没有内置 Ollama provider（pi-mono models.generated.ts 搜不到），
    // 不违反「勿写内置节点」契约
    name: "Ollama Cloud",
    providerKey: "cc-switch-ollama-cloud",
    websiteUrl: "https://ollama.com",
    apiKeyUrl: "https://ollama.com/settings/keys",
    settingsConfig: {
      name: "Ollama Cloud",
      // 云端 OpenAI 兼容 base（docs.ollama.com/api/openai-compatibility，
      // 2026-10-14 核对）；窗口取 https://ollama.com/api/show
      baseUrl: "https://ollama.com/v1",
      api: "openai-completions",
      apiKey: "",
      models: [
        piModel("zai/glm-5.3", { id: "glm-5.3" }),
        piModel("zai/glm-5.3-flash", { id: "glm-5.3-flash" }),
        piModel("moonshotai/kimi-k3", { id: "kimi-k3" }),
        // 2026-10-25 起 DeepSeek 一律用 Flash（Pro 贵且效果不如 Flash），
        // id 与 Codex / Hermes 的 Ollama Cloud 预设一致
        piModel("deepseek/deepseek-flash", {
          id: "deepseek-v4.1-flash",
          contextWindow: 1_048_576,
        }),
        // 目录默认 1M，Ollama 云端只开 512K，必须覆盖
        piModel("minimax/minimax-m3", {
          id: "minimax-m3",
          contextWindow: 512_000,
        }),
      ],
    },
    category: "cloud_provider",
    icon: "ollama",
  },
];

function materializeVerifiedThinkingProfiles(
  preset: PiProviderPreset,
): PiProviderPreset {
  return {
    ...preset,
    settingsConfig: {
      ...preset.settingsConfig,
      models: preset.settingsConfig.models.map((model) => {
        const reference = getPiModelCatalogReference(model);
        if (!reference) return model;
        const resolved = reference.presetThinkingProfileId
          ? getPiThinkingProfile(reference.presetThinkingProfileId)
          : resolvePiThinkingProfile({
              catalogKey: reference.catalogKey,
              api: preset.settingsConfig.api,
            });
        return {
          ...model,
          ...(model.reasoning ? { thinkingLevelMap: resolved?.map ?? {} } : {}),
          ...(resolved?.modelCompat
            ? {
                compat: {
                  ...model.compat,
                  ...resolved.modelCompat,
                },
              }
            : {}),
        };
      }),
    },
  };
}

export const piProviderPresets = piProviderPresetDefinitions.map(
  materializeVerifiedThinkingProfiles,
);
