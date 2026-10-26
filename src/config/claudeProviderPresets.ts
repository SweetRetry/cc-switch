/**
 * 预设供应商配置模板
 */
import { ProviderCategory } from "../types";
import type { PresetFamilyFields } from "./presetFamilies";

export interface TemplateValueConfig {
  label: string;
  placeholder: string;
  defaultValue?: string;
  editorValue: string;
}

/**
 * 预设供应商的视觉主题配置
 */
export interface PresetTheme {
  /** 图标类型：'claude' | 'codex' | 'gemini' | 'generic' */
  icon?: "claude" | "codex" | "gemini" | "generic";
  /** 背景色（选中状态），支持 Tailwind 类名或 hex 颜色 */
  backgroundColor?: string;
  /** 文字色（选中状态），支持 Tailwind 类名或 hex 颜色 */
  textColor?: string;
}

export interface ProviderPreset extends PresetFamilyFields {
  name: string;
  nameKey?: string; // i18n key for localized display name
  websiteUrl: string;
  // 新增：第三方/聚合等可单独配置获取 API Key 的链接
  apiKeyUrl?: string;
  settingsConfig: object;
  isOfficial?: boolean;
  category?: ProviderCategory; // 新增：分类
  // 新增：指定该预设所使用的 API Key 字段名（默认 ANTHROPIC_AUTH_TOKEN）
  apiKeyField?: "ANTHROPIC_AUTH_TOKEN" | "ANTHROPIC_API_KEY";
  // 新增：模板变量定义，用于动态替换配置中的值
  templateValues?: Record<string, TemplateValueConfig>; // editorValue 存储编辑器中的实时输入值
  // 新增：请求地址候选列表（用于地址管理/测速）
  endpointCandidates?: string[];
  // 新增：视觉主题配置
  theme?: PresetTheme;
  // 图标配置
  icon?: string; // 图标名称
  iconColor?: string; // 图标颜色

  // Claude API 格式（仅 Claude 供应商使用）
  // - "anthropic" (默认): Anthropic Messages API 格式，直接透传
  // - "openai_chat": OpenAI Chat Completions 格式，需要格式转换
  // - "openai_responses": OpenAI Responses API 格式，需要格式转换
  // - "gemini_native": Gemini Native generateContent API 格式，需要格式转换
  apiFormat?:
    | "anthropic"
    | "openai_chat"
    | "openai_responses"
    | "gemini_native";

  // 供应商类型标识（用于特殊供应商检测）
  // - "github_copilot": GitHub Copilot 供应商（需要 OAuth 认证）
  // - "codex_oauth": OpenAI Codex via ChatGPT Plus/Pro 反代（需要 OAuth 认证）
  providerType?: "github_copilot" | "codex_oauth" | "xai_oauth";

  // 是否需要 OAuth 认证（而非 API Key）
  requiresOAuth?: boolean;

  // 是否在 UI 中隐藏该预设（预设仍存在，仅不在列表中显示）
  hidden?: boolean;

  // 获取模型列表使用的完整 URL（覆写自动候选逻辑）
  // 缺省时后端基于 baseURL 自动尝试 /v1/models、/models 以及剥离已知兼容子路径后的变体。
  modelsUrl?: string;
}

export const providerPresets: ProviderPreset[] = [
  {
    name: "Claude Official",
    websiteUrl: "https://www.anthropic.com/claude-code",
    settingsConfig: {
      env: {},
    },
    isOfficial: true, // 明确标识为官方预设
    category: "official",
    theme: {
      icon: "claude",
      backgroundColor: "#D97757",
      textColor: "#FFFFFF",
    },
    icon: "anthropic",
    iconColor: "#D4915D",
  },

  {
    name: "Kimi",
    family: "kimi",
    planKey: "payg",
    regionKey: "cn",
    websiteUrl: "https://platform.kimi.com",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://api.moonshot.cn/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "kimi-k2.7-code",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "kimi-k2.7-code",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "kimi-k2.7-code",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "kimi-k2.7-code",
      },
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
    websiteUrl: "https://platform.kimi.ai",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://api.moonshot.ai/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "kimi-k2.7-code",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "kimi-k2.7-code",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "kimi-k2.7-code",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "kimi-k2.7-code",
      },
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
    websiteUrl: "https://www.kimi.com/code/",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://api.kimi.com/coding/",
        ANTHROPIC_AUTH_TOKEN: "",
        // CLAUDE_CODE_MAX_CONTEXT_TOKENS 只对非 claude- 前缀模型 id 生效，
        // 必须显式路由端点别名 kimi-for-coding（与 codex/hermes/opencode 预设一致）
        ANTHROPIC_MODEL: "kimi-for-coding",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "kimi-for-coding",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "kimi-for-coding",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "kimi-for-coding",
        // 双键钉 256K：压缩窗口=min(模型窗口,值)，与窗口同值时行为等价于不设，
        // 但显式钉住可屏蔽远程实验下发的更小压缩点；调整直接改 JSON，不出表单字段
        CLAUDE_CODE_MAX_CONTEXT_TOKENS: "262144",
        CLAUDE_CODE_AUTO_COMPACT_WINDOW: "262144",
      },
    },
    category: "cn_official",
    icon: "kimi",
    iconColor: "#6366F1",
  },
  {
    name: "Kimi For Coding Global",
    family: "kimi",
    planKey: "coding",
    regionKey: "intl",
    websiteUrl: "https://www.kimi.ai/code",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://api.kimi.ai/coding/",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "kimi-for-coding",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "kimi-for-coding",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "kimi-for-coding",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "kimi-for-coding",
        CLAUDE_CODE_MAX_CONTEXT_TOKENS: "262144",
        CLAUDE_CODE_AUTO_COMPACT_WINDOW: "262144",
      },
    },
    category: "cn_official",
    icon: "kimi",
    iconColor: "#6366F1",
  },
  {
    name: "火山 Agent Plan",
    family: "volcengine",
    planKey: "agentPlan",
    websiteUrl: "https://www.volcengine.com/activity/agentplan",
    apiKeyUrl: "https://www.volcengine.com/activity/agentplan",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://ark.cn-beijing.volces.com/api/plan",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "ark-code-latest",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "ark-code-latest",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "ark-code-latest",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "ark-code-latest",
      },
    },
    category: "cn_official",
    icon: "huoshan",
    iconColor: "#3370FF",
  },
  {
    name: "火山 Coding Plan",
    family: "volcengine",
    planKey: "codingPlan",
    websiteUrl: "https://www.volcengine.com/activity/codingplan",
    apiKeyUrl: "https://www.volcengine.com/activity/codingplan",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://ark.cn-beijing.volces.com/api/coding",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "ark-code-latest",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "ark-code-latest",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "ark-code-latest",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "ark-code-latest",
      },
    },
    category: "cn_official",
    icon: "huoshan",
    iconColor: "#3370FF",
  },
  {
    name: "BytePlus",
    websiteUrl: "https://www.byteplus.com/en/product/modelark",
    apiKeyUrl: "https://www.byteplus.com/en/product/modelark",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL:
          "https://ark.ap-southeast.bytepluses.com/api/coding",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "ark-code-latest",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "ark-code-latest",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "ark-code-latest",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "ark-code-latest",
      },
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
    websiteUrl:
      "https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey?apikey=%7B%7D",
    apiKeyUrl:
      "https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey?apikey=%7B%7D",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://ark.cn-beijing.volces.com/api/compatible",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "doubao-seed-2-1-pro-260915",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "doubao-seed-2-1-pro-260915",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "doubao-seed-2-1-pro-260915",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "doubao-seed-2-1-pro-260915",
      },
    },
    category: "cn_official",
    icon: "doubao",
    iconColor: "#3370FF",
  },
  {
    name: "DeepSeek",
    websiteUrl: "https://platform.deepseek.com",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://api.deepseek.com/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "deepseek-flash[1M]",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "deepseek-flash[1M]",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "deepseek-flash[1M]",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "deepseek-flash[1M]",
      },
    },
    category: "cn_official",
    // Anthropic 兼容层挂在 /anthropic 子路径；/models 是根上独立端点
    modelsUrl: "https://api.deepseek.com/models",
    icon: "deepseek",
    iconColor: "#1E88E5",
  },
  {
    // 腾讯云 Token Plan 个人版（1823/130060，2026-08-21 版）：通用 + Hy 两
    // 系列共用同一端点与 API Key；Auto 智能路由的调用 ID 是 tc-code-latest。
    // 注意与 TokenHub 按量 API 市场（1823 线，如 Hunyuan 预设的 /v1 端点）
    // 是两条产品线，订阅 Key 只能走 /plan 端点
    name: "Tencent Token Plan",
    family: "tencent",
    planKey: "tokenPlan",
    regionKey: "cn",
    websiteUrl: "https://cloud.tencent.com/product/tokenhub",
    apiKeyUrl: "https://console.cloud.tencent.com/tokenhub/tokenplan",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL:
          "https://api.lkeap.cloud.tencent.com/plan/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "tc-code-latest",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "tc-code-latest",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "tc-code-latest",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "tc-code-latest",
      },
    },
    category: "cn_official",
    endpointCandidates: ["https://api.lkeap.cloud.tencent.com/plan/anthropic"],
    // /plan/v3/models 真 Key 实测可用（2026-08-31，返回套餐内 19 个模型含
    // 别名）；企业/国际端点无 /models（404），故仅此预设覆写
    modelsUrl: "https://api.lkeap.cloud.tencent.com/plan/v3/models",
    icon: "tencent",
    iconColor: "#0052D9",
  },
  {
    // 国际站（新加坡地域）个人版（intl 1300/81315，2026-08-20 版）：
    // Auto 的调用 ID 是 auto（与国内个人版 tc-code-latest 不同），模型阵容
    // 也与国内不同（无 GLM-5/5.1/Hy3，多 GLM-5.2/MiniMax-M3）。端点用国际站
    // 文档钦定的 tencentcloudmaas.com 域（DNS 实测解析新加坡节点）；国内站
    // 文档对新加坡地域给的是 tokenhub-intl.tencentmaas.com，Key 按站独立、
    // 不跨站通用，故互不作候选
    name: "Tencent Token Plan (Intl)",
    family: "tencent",
    planKey: "tokenPlan",
    regionKey: "intl",
    websiteUrl: "https://www.tencentcloud.com/products/tokenhub",
    apiKeyUrl: "https://console.tencentcloud.com/tokenhub/tokenplan",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL:
          "https://tokenhub-intl.tencentcloudmaas.com/plan/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "auto",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "auto",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "auto",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "auto",
      },
    },
    category: "cn_official",
    endpointCandidates: [
      "https://tokenhub-intl.tencentcloudmaas.com/plan/anthropic",
    ],
    icon: "tencent",
    iconColor: "#0052D9",
  },
  {
    // Token Plan 企业版专业套餐（1823/130659，2026-08-25 版）：广州地域端点
    // 为国内站文档钦定的 tencentmaas.com；新加坡地域模型阵容不同且 Key 不
    // 跨站，见 (Intl) 预设
    name: "Tencent Token Plan Enterprise Pro",
    family: "tencent",
    planKey: "enterprisePro",
    regionKey: "cn",
    websiteUrl: "https://cloud.tencent.com/product/tokenhub",
    apiKeyUrl: "https://console.cloud.tencent.com/tokenhub/tokenplan-e",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://tokenhub.tencentmaas.com/plan/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "auto",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "auto",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "auto",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "auto",
      },
    },
    category: "cn_official",
    // 广州地域为默认端点；国内站企业套餐另可选新加坡地域（1823/130659、
    // 131173 双地域表：tokenhub-intl.tencentmaas.com，需开通新加坡地域，
    // 不支持跨地域调用，故仅作候选端点）
    endpointCandidates: [
      "https://tokenhub.tencentmaas.com/plan/anthropic",
      "https://tokenhub-intl.tencentmaas.com/plan/anthropic",
    ],
    icon: "tencent",
    iconColor: "#0052D9",
  },
  {
    // 国际站企业版专业套餐（intl 1300/81489，2026-08-26 版）：新加坡地域，
    // 模型阵容为广州地域的子集（无 GLM-5/5.1/5-Turbo、Kimi-K2.6、
    // MiniMax-M2.7）
    name: "Tencent Token Plan Enterprise Pro (Intl)",
    family: "tencent",
    planKey: "enterprisePro",
    regionKey: "intl",
    websiteUrl: "https://www.tencentcloud.com/products/tokenhub",
    apiKeyUrl: "https://console.tencentcloud.com/tokenhub/tokenplan-e",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL:
          "https://tokenhub-intl.tencentcloudmaas.com/plan/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "auto",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "auto",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "auto",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "auto",
      },
    },
    category: "cn_official",
    // 新加坡地域为默认端点；国际站企业套餐另可选广州地域（1300/81489、
    // 81490 双地域表：tokenhub.tencentcloudmaas.com，需开通广州地域，
    // 不支持跨地域调用，故仅作候选端点）
    endpointCandidates: [
      "https://tokenhub-intl.tencentcloudmaas.com/plan/anthropic",
      "https://tokenhub.tencentcloudmaas.com/plan/anthropic",
    ],
    icon: "tencent",
    iconColor: "#0052D9",
  },
  {
    // Token Plan 企业版轻享套餐（1823/131173，2026-08-28 版）：仅 Auto 模型
    name: "Tencent Token Plan Enterprise Lite",
    family: "tencent",
    planKey: "enterpriseLite",
    regionKey: "cn",
    websiteUrl: "https://cloud.tencent.com/product/tokenhub",
    apiKeyUrl: "https://console.cloud.tencent.com/tokenhub/tokenplan-e",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://tokenhub.tencentmaas.com/plan/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "auto",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "auto",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "auto",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "auto",
      },
    },
    category: "cn_official",
    // 广州地域为默认端点；国内站企业套餐另可选新加坡地域（1823/130659、
    // 131173 双地域表：tokenhub-intl.tencentmaas.com，需开通新加坡地域，
    // 不支持跨地域调用，故仅作候选端点）
    endpointCandidates: [
      "https://tokenhub.tencentmaas.com/plan/anthropic",
      "https://tokenhub-intl.tencentmaas.com/plan/anthropic",
    ],
    icon: "tencent",
    iconColor: "#0052D9",
  },
  {
    // 国际站企业版轻享套餐（intl 1300/81490）：新加坡地域（资源调度范围为
    // Global），仅 Auto 模型
    name: "Tencent Token Plan Enterprise Lite (Intl)",
    family: "tencent",
    planKey: "enterpriseLite",
    regionKey: "intl",
    websiteUrl: "https://www.tencentcloud.com/products/tokenhub",
    apiKeyUrl: "https://console.tencentcloud.com/tokenhub/tokenplan-e",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL:
          "https://tokenhub-intl.tencentcloudmaas.com/plan/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "auto",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "auto",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "auto",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "auto",
      },
    },
    category: "cn_official",
    // 新加坡地域为默认端点；国际站企业套餐另可选广州地域（1300/81489、
    // 81490 双地域表：tokenhub.tencentcloudmaas.com，需开通广州地域，
    // 不支持跨地域调用，故仅作候选端点）
    endpointCandidates: [
      "https://tokenhub-intl.tencentcloudmaas.com/plan/anthropic",
      "https://tokenhub.tencentcloudmaas.com/plan/anthropic",
    ],
    icon: "tencent",
    iconColor: "#0052D9",
  },
  {
    name: "Zhipu GLM",
    family: "zhipu",
    regionKey: "cn",
    websiteUrl: "https://open.bigmodel.cn",
    apiKeyUrl: "https://www.bigmodel.cn/claude-code",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://open.bigmodel.cn/api/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "glm-5.3[1M]",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "glm-5.3[1M]",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "glm-5.3[1M]",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "glm-5.3[1M]",
      },
    },
    category: "cn_official",
    icon: "zhipu",
    iconColor: "#0F62FE",
  },
  {
    name: "Zhipu GLM en",
    family: "zhipu",
    regionKey: "intl",
    websiteUrl: "https://z.ai",
    apiKeyUrl: "https://z.ai/subscribe",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://api.z.ai/api/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "glm-5.3[1M]",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "glm-5.3[1M]",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "glm-5.3[1M]",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "glm-5.3[1M]",
      },
    },
    category: "cn_official",
    icon: "zhipu",
    iconColor: "#0F62FE",
  },
  {
    name: "Baidu Qianfan Coding Plan",
    family: "baidu-qianfan",
    planKey: "codingPlan",
    websiteUrl: "https://cloud.baidu.com/product/qianfan_modelbuilder",
    apiKeyUrl:
      "https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://qianfan.baidubce.com/anthropic/coding",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "qianfan-code-latest",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "qianfan-code-latest",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "qianfan-code-latest",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "qianfan-code-latest",
      },
    },
    category: "cn_official",
    endpointCandidates: ["https://qianfan.baidubce.com/anthropic/coding"],
    icon: "baidu",
    iconColor: "#2932E1",
  },
  {
    // Token Plan 个人版：2026-07-13 起替代 Coding Plan 发售（存量 Coding
    // Plan 可用至到期，旧预设保留）。模型=官方 Claude Code 接入页
    // （2026-07-30 版）全角色 deepseek-v4-pro，2026-10-25 起因 Pro 贵且效果
    // 不如 Flash 改为全角色 deepseek-v4-flash；Key 是订阅页专属 Key
    name: "Baidu Qianfan Token Plan",
    family: "baidu-qianfan",
    planKey: "tokenPlan",
    websiteUrl: "https://cloud.baidu.com/product/codingplan.html",
    apiKeyUrl: "https://console.bce.baidu.com/qianfan/resource/token-plan",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL:
          "https://qianfan.baidubce.com/anthropic/tokenplan/personal",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "deepseek-v4-flash[1M]",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "deepseek-v4-flash[1M]",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "deepseek-v4-flash[1M]",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "deepseek-v4-flash[1M]",
      },
    },
    category: "cn_official",
    endpointCandidates: [
      "https://qianfan.baidubce.com/anthropic/tokenplan/personal",
    ],
    icon: "baidu",
    iconColor: "#2932E1",
  },
  {
    name: "千问AI平台",
    family: "qianwen",
    planKey: "payg",
    websiteUrl: "https://platform.qianwenai.com/",
    apiKeyUrl: "https://platform.qianwenai.com/home/api-keys",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://dashscope.aliyuncs.com/apps/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "qwen3.8-max[1M]",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "qwen3.8-flash[1M]",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "qwen3.7-plus[1M]",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "qwen3.8-max[1M]",
        // 模型 id 非 claude-* 时 Claude Code 按 200K 默认窗口处理：各档带
        // [1M]（表单预勾，优先于下面的值）；这里保留官方钉的值兜底取消
        // 勾选或换成未勾模型的档位：qwen3.8 系 context_window = 983616
        CLAUDE_CODE_MAX_CONTEXT_TOKENS: "983616",
      },
    },
    category: "cn_official",
    icon: "qianwenai",
    iconColor: "#624AFF",
  },
  {
    name: "千问AI平台 Coding Plan",
    family: "qianwen",
    planKey: "codingPlan",
    websiteUrl: "https://bailian.console.aliyun.com",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL:
          "https://coding.dashscope.aliyuncs.com/apps/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
      },
    },
    category: "cn_official",
    icon: "qianwenai",
    iconColor: "#624AFF",
  },
  {
    name: "千问AI平台 Token Plan",
    family: "qianwen",
    planKey: "tokenPlan",
    websiteUrl: "https://platform.qianwenai.com/pricing/token-plan",
    apiKeyUrl: "https://platform.qianwenai.com/home/api-keys",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL:
          "https://token-plan.cn-beijing.maas.aliyuncs.com/apps/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "qwen3.8-max[1M]",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "qwen3.8-flash[1M]",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "qwen3.7-plus[1M]",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "qwen3.8-max[1M]",
        // 官方 Token Plan 配置同样钉窗口：qwen3.8 系 context_window = 983616；
        // 各档带 [1M] 时以标记为准，这里兜底未勾 1M 的档位
        CLAUDE_CODE_MAX_CONTEXT_TOKENS: "983616",
      },
    },
    category: "cn_official",
    icon: "qianwenai",
    iconColor: "#624AFF",
  },
  // ===== QwenCloud（DashScope 国际站）=====
  // 与上面国内百炼是两套独立站点：域名、控制台、密钥互不通用。
  // 三条线各有专属 base_url 与专属 API Key，官方文档明示密钥类型与
  // base_url 不匹配会 401，因此拆成三个预设而非共用一条加候选地址。
  {
    name: "QwenCloud",
    family: "qwencloud",
    planKey: "payg",
    websiteUrl: "https://home.qwencloud.com/",
    apiKeyUrl: "https://home.qwencloud.com/api-keys",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL:
          "https://dashscope-intl.aliyuncs.com/apps/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "qwen3.8-max[1M]",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "qwen3.8-flash[1M]",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "qwen3.7-plus[1M]",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "qwen3.8-max[1M]",
      },
    },
    category: "cn_official",
    icon: "qwencloud",
    iconColor: "#6336E7",
  },
  {
    name: "QwenCloud For Coding",
    family: "qwencloud",
    planKey: "coding",
    websiteUrl: "https://www.qwencloud.com",
    apiKeyUrl: "https://home.qwencloud.com/api-keys",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL:
          "https://coding-intl.dashscope.aliyuncs.com/apps/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "qwen3.7-plus[1M]",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "qwen3.7-plus[1M]",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "qwen3.7-plus[1M]",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "qwen3.7-plus[1M]",
      },
    },
    category: "cn_official",
    icon: "qwencloud",
    iconColor: "#6336E7",
  },
  {
    name: "QwenCloud Token Plan",
    family: "qwencloud",
    planKey: "tokenPlan",
    websiteUrl: "https://www.qwencloud.com/pricing/token-plan",
    apiKeyUrl: "https://home.qwencloud.com/api-keys",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL:
          "https://token-plan.ap-southeast-1.maas.aliyuncs.com/apps/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "qwen3.8-max[1M]",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "qwen3.8-flash[1M]",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "qwen3.7-plus[1M]",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "qwen3.8-max[1M]",
        // 官方 Claude Code 配置钉的窗口：qwen3.8 系 context_window = 983616；
        // 各档带 [1M] 时以标记为准，这里兜底未勾 1M 的档位
        CLAUDE_CODE_MAX_CONTEXT_TOKENS: "983616",
      },
    },
    category: "cn_official",
    icon: "qwencloud",
    iconColor: "#6336E7",
  },
  {
    name: "StepFun",
    family: "stepfun",
    regionKey: "cn",
    websiteUrl: "https://platform.stepfun.com/step-plan",
    apiKeyUrl: "https://platform.stepfun.com/interface-key",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://api.stepfun.com/step_plan",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "step-5-preview",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "step-5-preview",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "step-5-preview",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "step-5-preview",
      },
    },
    category: "cn_official",
    endpointCandidates: ["https://api.stepfun.com/step_plan"],
    icon: "stepfun",
    iconColor: "#16D6D2",
  },
  {
    name: "StepFun en",
    family: "stepfun",
    regionKey: "intl",
    websiteUrl: "https://platform.stepfun.ai/step-plan",
    apiKeyUrl: "https://platform.stepfun.ai/interface-key",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://api.stepfun.ai/step_plan",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "step-3.5-flash-2603",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "step-3.5-flash-2603",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "step-3.5-flash-2603",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "step-3.5-flash-2603",
      },
    },
    category: "cn_official",
    endpointCandidates: ["https://api.stepfun.ai/step_plan"],
    icon: "stepfun",
    iconColor: "#16D6D2",
  },
  {
    name: "StreamLake",
    family: "streamlake",
    regionKey: "cn",
    websiteUrl: "https://www.streamlake.com",
    apiKeyUrl: "https://console.streamlake.com/console/wanqing/api-key",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL:
          "https://wanqing.streamlakeapi.com/api/gateway/v1/endpoints/kat-coder-pro-v2.5/claude-code-proxy",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "kat-coder-pro-v2.5",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "kat-coder-pro-v2.5",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "kat-coder-pro-v2.5",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "kat-coder-pro-v2.5",
      },
    },
    category: "cn_official",
    icon: "streamlake",
  },
  {
    name: "StreamLake en",
    family: "streamlake",
    regionKey: "intl",
    websiteUrl: "https://console.streamlake.ai",
    apiKeyUrl: "https://console.streamlake.ai/console/api-key",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL:
          "https://vanchin.streamlake.ai/api/gateway/v1/endpoints/kat-coder-pro-v2.5/claude-code-proxy",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "kat-coder-pro-v2.5",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "kat-coder-pro-v2.5",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "kat-coder-pro-v2.5",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "kat-coder-pro-v2.5",
      },
    },
    category: "cn_official",
    icon: "streamlake",
  },
  {
    name: "Longcat",
    websiteUrl: "https://longcat.chat/platform",
    apiKeyUrl: "https://longcat.chat/platform/api_keys",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://api.longcat.chat/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "LongCat-2.0[1M]",
        ANTHROPIC_SMALL_FAST_MODEL: "LongCat-2.0",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "LongCat-2.0[1M]",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "LongCat-2.0[1M]",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "LongCat-2.0[1M]",
        CLAUDE_CODE_MAX_OUTPUT_TOKENS: "131072",
      },
    },
    category: "cn_official",
    icon: "longcat",
    iconColor: "#29E154",
  },
  {
    name: "MiniMax",
    family: "minimax",
    regionKey: "cn",
    websiteUrl: "https://platform.minimax.cn",
    apiKeyUrl: "https://platform.minimax.cn/subscribe/token-plan",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://api.minimax.cn/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        CLAUDE_CODE_AUTO_COMPACT_WINDOW: "1000000",
        ANTHROPIC_MODEL: "MiniMax-M3.1-Flash[1M]",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "MiniMax-M3.1-Flash[1M]",
        // M3 stays selectable as Opus; a role slot also works through the local route
        ANTHROPIC_DEFAULT_OPUS_MODEL: "MiniMax-M3[1M]",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "MiniMax-M3.1-Flash[1M]",
      },
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
    websiteUrl: "https://platform.minimax.io",
    apiKeyUrl: "https://platform.minimax.io/subscribe/coding-plan",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://api.minimax.io/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        CLAUDE_CODE_AUTO_COMPACT_WINDOW: "1000000",
        ANTHROPIC_MODEL: "MiniMax-M3.1-Flash[1M]",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "MiniMax-M3.1-Flash[1M]",
        // M3 stays selectable as Opus; a role slot also works through the local route
        ANTHROPIC_DEFAULT_OPUS_MODEL: "MiniMax-M3[1M]",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "MiniMax-M3.1-Flash[1M]",
      },
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
    websiteUrl: "https://developer.ant-ling.com/zh-CN/docs/",
    apiKeyUrl: "https://chat.ant-ling.com/open",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://api.ant-ling.com/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "Ling-2.6-1T",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "Ling-2.6-1T",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "Ling-2.6-1T",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "Ling-2.6-1T",
      },
    },
    category: "cn_official",
    icon: "bailing",
  },
  {
    name: "Ollama",
    websiteUrl: "https://ollama.com",
    // 本机 Ollama（docs.ollama.com/integrations/claude-code，2026-10-14 核对）：
    // /v1/messages 自 v0.14.0 起支持，服务端不校验 Key，官方写法是
    // AUTH_TOKEN=ollama、ANTHROPIC_API_KEY 置空；默认只监听 127.0.0.1:11434
    //（OLLAMA_HOST 可改）。模型由用户自己 ollama pull：qwen3.5 是官方示例，
    // 换成自己已下载的模型，或用「获取模型」从 /v1/models 拉取（id 带 :latest
    // 等 tag）。实际窗口受服务端限制：显存低于 24 GiB 时默认只有 4k，官方要求
    // 编程工具至少 64k（OLLAMA_CONTEXT_LENGTH=64000 ollama serve，
    // docs.ollama.com/context-length）。兼容层不支持 cache_control、
    // count_tokens 与 tool_choice（docs.ollama.com/api/anthropic-compatibility）
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "http://localhost:11434",
        ANTHROPIC_AUTH_TOKEN: "ollama",
        ANTHROPIC_API_KEY: "",
        ANTHROPIC_MODEL: "qwen3.5",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "qwen3.5",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "qwen3.5",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "qwen3.5",
      },
    },
    category: "local",
    endpointCandidates: ["http://localhost:11434", "http://127.0.0.1:11434"],
    icon: "ollama",
  },
  {
    name: "LM Studio",
    websiteUrl: "https://lmstudio.ai",
    // 本机 LM Studio（lmstudio.ai/docs/integrations/claude-code，2026-10-14
    // 核对）：Anthropic 兼容 /v1/messages 自 0.4.1 起支持，base 不带 /v1。默认
    // 不鉴权，官方写法 AUTH_TOKEN=lmstudio，预填该占位值；开启 Require
    // Authentication 后换成 App 里创建的 API Token（x-api-key 与 Bearer 都认，
    // lmstudio.ai/docs/developer/core/authentication）。官方另建议
    // CLAUDE_CODE_ATTRIBUTION_HEADER=0，它不是关键 / 独有字段，写进预设不生效，
    // 需自行加到全局设置。模型由用户自己下载：openai/gpt-oss-20b 是官方示例，
    // 换成自己已下载的模型 ID，或用「获取模型」从 /v1/models 拉取。已知问题
    //（lmstudio-bug-tracker #2164、#2220，仍未关）：0.4.19 Build 2 起 Qwen 停在
    // 一句话、0.4.20 起 gpt-oss-120b 报 grammar 400，撞上时可改 openai_chat +
    // http://localhost:1234/v1 走路由
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "http://localhost:1234",
        ANTHROPIC_AUTH_TOKEN: "lmstudio",
        ANTHROPIC_MODEL: "openai/gpt-oss-20b",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "openai/gpt-oss-20b",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "openai/gpt-oss-20b",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "openai/gpt-oss-20b",
        // 模型 id 非 claude-* 时 Claude Code 按 200K 默认窗口处理，钉住
        // gpt-oss-20b 的原生值 131072。实际窗口受 LM Studio 加载模型时的
        // context length 限制（UI 设置或 lms load --context-length），官方要求
        // 至少约 25K；加载窗口更小时此值要一起调小
        CLAUDE_CODE_MAX_CONTEXT_TOKENS: "131072",
      },
    },
    category: "local",
    icon: "lmstudio",
    endpointCandidates: ["http://localhost:1234", "http://127.0.0.1:1234"],
  },
  {
    name: "llama.cpp",
    websiteUrl: "https://github.com/ggml-org/llama.cpp",
    // 本机 llama-server（github.com/ggml-org/llama.cpp/blob/master/tools/server/
    // README.md，2026-10-14 核对）：Anthropic 兼容 /v1/messages 自 b7187 起支持
    //（PR #17570），只有带 /v1 的路由，base 不带 /v1；工具调用需要的 jinja 自
    // b7170 起默认开启，不用再加 --jinja。默认端口自 b11521（PR #30159，
    // 2026-10-09）起为 9931，v0.6.0 及更早、Homebrew 与 Docker 镜像仍是 8080，
    // 见候选地址；默认只监听 IPv4 的 127.0.0.1，故不写 localhost。不带
    // --api-key 启动时不校验 Key，预填占位值 no-key（同 README 示例）；带了
    // --api-key 就填那个值（Bearer 与 x-api-key 都认）。server 会归一化
    // x-anthropic-billing-header 里每次变化的 cch=，前缀缓存不受影响（PR #21793）。
    // 模型由用户自己下载：默认取 ggml-org 官方 GGUF 的 Qwen3-Coder 30B A3B
    //（llama-server -hf 拉取后 /v1/models 的 id 即此值），换成自己已下载的模型，
    // 或用「获取模型」从 /v1/models 拉取；单模型启动时 model 字段被忽略，
    // router 模式（启动不带 -m / -hf）须与 /v1/models 的 id 一致。模型 id 非
    // claude-* 时 Claude Code 按 200K 默认窗口处理，而本地实际窗口受 -c / --fit /
    // -np 限制（以 /v1/models 的 meta.n_ctx 为准），更小时自行加
    // CLAUDE_CODE_MAX_CONTEXT_TOKENS 钉成实际值
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "http://127.0.0.1:9931",
        ANTHROPIC_AUTH_TOKEN: "no-key",
        ANTHROPIC_MODEL: "ggml-org/Qwen3-Coder-30B-A3B-Instruct-Q8_0-GGUF",
        ANTHROPIC_DEFAULT_HAIKU_MODEL:
          "ggml-org/Qwen3-Coder-30B-A3B-Instruct-Q8_0-GGUF",
        ANTHROPIC_DEFAULT_SONNET_MODEL:
          "ggml-org/Qwen3-Coder-30B-A3B-Instruct-Q8_0-GGUF",
        ANTHROPIC_DEFAULT_OPUS_MODEL:
          "ggml-org/Qwen3-Coder-30B-A3B-Instruct-Q8_0-GGUF",
      },
    },
    category: "local",
    icon: "llamacpp",
    endpointCandidates: ["http://127.0.0.1:9931", "http://127.0.0.1:8080"],
  },
  {
    name: "vLLM",
    websiteUrl: "https://vllm.ai",
    // 本机 vllm serve（docs.vllm.ai/en/stable/serving/integrations/claude_code，
    // v0.31.0 源码，2026-10-14 核对）：Anthropic 兼容 /v1/messages 自 v0.11.1
    // 起支持，与 OpenAI 接口同端口，base 不带 /v1；Claude Code 2.1.154 起在
    // messages 里带 system 角色，v0.23.0 之前报 400（PR #44283），故要求
    // vLLM ≥ 0.23.0；0.17.1 之后会自动剥掉 Claude Code 注入的逐请求 hash，
    // 前缀缓存不受影响，不用设 CLAUDE_CODE_ATTRIBUTION_HEADER。默认端口 8000，
    // 不带 --host 时监听全部 IPv4 网卡，建议加 --host 127.0.0.1。不带 --api-key
    // 时不校验 Key，预填官方占位值 dummy；带了就填那个值（只认 Bearer，不认
    // x-api-key，默认的 AUTH_TOKEN 正好是 Bearer）。工具调用要启动时加
    // --enable-auto-tool-choice 与 --tool-call-parser，推荐命令（Qwen 模型卡）：
    // vllm serve Qwen/Qwen3.6-27B --max-model-len 262144 --reasoning-parser qwen3
    // --enable-auto-tool-choice --tool-call-parser qwen3_coder。兼容层不支持
    // PDF document 块，cache_control 被忽略。模型由用户自己下载：默认取 vLLM
    // Codex 接入页的示例 Qwen/Qwen3.6-27B，模型 ID 须与 /v1/models 返回的一致
    //（没传 --served-model-name 时就是 HF 仓库名），换成自己的模型，或用
    // 「获取模型」从 /v1/models 拉取。模型 id 非 claude-* 时 Claude Code 按 200K
    // 默认窗口处理，而本地实际窗口受 --max-model-len 限制，更小时自行加
    // CLAUDE_CODE_MAX_CONTEXT_TOKENS 钉成实际值
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "http://localhost:8000",
        ANTHROPIC_AUTH_TOKEN: "dummy",
        ANTHROPIC_MODEL: "Qwen/Qwen3.6-27B",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "Qwen/Qwen3.6-27B",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "Qwen/Qwen3.6-27B",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "Qwen/Qwen3.6-27B",
      },
    },
    category: "local",
    icon: "vllm",
    endpointCandidates: ["http://localhost:8000", "http://127.0.0.1:8000"],
  },
  {
    name: "Meta Model API",
    websiteUrl: "https://dev.meta.ai",
    // Key 在 dev.meta.ai 登录后的「API keys」标签页（dev.meta.ai/docs/
    // authentication.md，2026-10-14 核对），没有独立的 Key 页面
    apiKeyUrl: "https://dev.meta.ai",
    // 官方 Claude Code 接入文档（dev.meta.ai/docs/coding-agents.md，2026-10-14
    // 核对）原样：base 不带 /v1（Claude Code 自己拼 /v1/messages），只认
    // Authorization: Bearer，Key 填 AUTH_TOKEN 而非 ANTHROPIC_API_KEY
    //（x-api-key）；五个模型变量全部钉到 Muse，主循环/opus 用 Wonder、
    // sonnet/haiku/子代理用 Spark 1.3。两个 -contributor 版本会拿用户内容训练
    // 模型，禁收。根路径 + /v1/models 即模型列表（无 Key 401），不覆写 modelsUrl
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://api.meta.ai",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "muse-wonder-1.0[1M]",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "muse-wonder-1.0[1M]",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "muse-spark-1.3[1M]",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "muse-spark-1.3[1M]",
        CLAUDE_CODE_SUBAGENT_MODEL: "muse-spark-1.3[1M]",
        // 非第一方 host 默认关闭 MCP 工具搜索，官方要求打开
        ENABLE_TOOL_SEARCH: "true",
        // 模型 id 非 claude-* 时 Claude Code 按 200K 默认窗口处理：两款模型
        // 窗口均为 1048576（dev.meta.ai/docs/models.md），各档带 [1M]（表单
        // 预勾）；这里兜底未勾 1M 的档位
        CLAUDE_CODE_MAX_CONTEXT_TOKENS: "1048576",
      },
    },
    category: "cn_official",
    endpointCandidates: ["https://api.meta.ai"],
    icon: "meta",
  },
  {
    name: "Microsoft Foundry",
    websiteUrl: "https://azure.microsoft.com/en-us/products/ai-foundry",
    // Key 和 Target URI 都在 Foundry 门户 Build → Models → 部署的 Details 标签页
    //（Azure 门户里是资源的 Keys and Endpoint），没有直达 Key 的页面
    apiKeyUrl: "https://ai.azure.com/",
    // 原名 Azure AI Foundry。官方部署文档（learn.microsoft.com/en-us/azure/
    // foundry/foundry-models/how-to/use-foundry-models-claude，2026-10-14 核对）：
    // base 为 https://<资源名>.services.ai.azure.com/anthropic、不带 /v1（实测
    // /anthropic/v1/messages 无 Key 401，少了 /v1 则 404），资源名由用户填。
    // REST 示例发 x-api-key，Anthropic 文档（platform.claude.com/docs/en/
    // build-with-claude/claude-in-microsoft-foundry）与官方 foundry-sdk 同，故
    // Key 填 ANTHROPIC_API_KEY；Hermes 有用户报 x-api-key 401、Bearer 可用
    //（hermes-agent #26970 / #29414），未经真 Key 实测。模型名填的是部署名，
    // 默认等于模型 ID，部署后不能改，自定义了名字须同步改；Mythos 系列只认
    // Entra，不收。走 ANTHROPIC_BASE_URL 时 Claude Code 当普通网关，而
    // cloud_provider 不会自动补 AUTO_MODE_SERVER=0，故手写。Foundry 不支持
    // Models API（文档同上），「获取模型列表」会失败，不写 modelsUrl。原生
    // CLAUDE_CODE_USE_FOUNDRY 模式没有 BASE_URL，走不了本地路由，不用。须付费
    // Azure 订阅并在 Marketplace 订阅 Claude，学生、试用、CSP 订阅不可用；开了
    // ZDR 的订阅调用 Covered Model 返回 400
    apiKeyField: "ANTHROPIC_API_KEY",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL:
          "https://${AZURE_RESOURCE_NAME}.services.ai.azure.com/anthropic",
        ANTHROPIC_API_KEY: "",
        ANTHROPIC_MODEL: "claude-opus-5-5",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "claude-haiku-5-5",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "claude-sonnet-5-5",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "claude-opus-5-5",
        CLAUDE_CODE_AUTO_MODE_SERVER: "0",
      },
    },
    category: "cloud_provider",
    templateValues: {
      AZURE_RESOURCE_NAME: {
        label: "Azure Resource Name",
        placeholder: "my-foundry-resource",
        editorValue: "",
      },
    },
    icon: "azure",
    iconColor: "#0078D4",
  },
  {
    name: "Mistral AI",
    websiteUrl: "https://mistral.ai",
    apiKeyUrl: "https://console.mistral.ai/api-keys",
    // 官方 OpenAPI（docs.mistral.ai/openapi.yaml，2026-10-14 核对）只列
    // /v1/chat/completions，鉴权为 Bearer。/v1/messages 与 /v1/responses 无 Key
    // 实测 401（不是 404，网关配了路由），但文档与 changelog 均未提，未经真 Key
    // 实测前只走 openai_chat 路由；base 不带 /v1，适配器自拼
    // /v1/chat/completions（同 Nebius）。模型取官方模型表（docs.mistral.ai/
    // models.md 同日），用固定版本 ID：主力 Mistral Medium 3.5、haiku 档
    // Mistral Small 4，均为 GA。Devstral 全系已下线（官方替代即这两款）；
    // Codestral 定位补全 / FIM，不做 Agent 主力。ChatCompletionRequest 不收
    // 额外字段且没有 stream_options，转换层给流式请求加的
    // stream_options.include_usage 会不会被 422 拒、开推理后 content 变成
    // thinking/text 分块数组能否解析，均未经真 Key 实测。/v1/models 无 Key 401，
    // 默认探测即可，不写 modelsUrl
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://api.mistral.ai",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "mistral-medium-3-5",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "mistral-small-2603",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "mistral-medium-3-5",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "mistral-medium-3-5",
        // 两款窗口官方只写「256k」（模型卡 docs.mistral.ai/models/
        // mistral-medium-3-5-26-04.md、mistral-small-4-0-26-03.md 同日），规则是
        // prompt + max_tokens ≤ 窗口；models.dev 记 262144，取较小的 256000 钉住
        CLAUDE_CODE_MAX_CONTEXT_TOKENS: "256000",
        CLAUDE_CODE_AUTO_COMPACT_WINDOW: "256000",
      },
    },
    category: "cn_official",
    apiFormat: "openai_chat",
    endpointCandidates: ["https://api.mistral.ai"],
    icon: "mistral",
    // 先隐藏：上面两条转换层风险（stream_options 可能 422、推理分块数组）
    // 真 Key 冒烟通过前不在列表里展示
    hidden: true,
  },
  {
    name: "GitHub Copilot",
    websiteUrl: "https://github.com/features/copilot",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://api.githubcopilot.com",
        ANTHROPIC_MODEL: "claude-sonnet-5",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "claude-haiku-4.5",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "claude-sonnet-5",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "claude-sonnet-5",
      },
    },
    category: "third_party",
    apiFormat: "openai_chat",
    providerType: "github_copilot",
    requiresOAuth: true,
    icon: "github",
    iconColor: "#000000",
  },
  {
    name: "Codex",
    websiteUrl: "https://openai.com/chatgpt/pricing",
    settingsConfig: {
      env: {
        // base_url 由代理后端强制重写为 chatgpt.com/backend-api/codex
        // 用户无需配置
        ANTHROPIC_BASE_URL: "https://chatgpt.com/backend-api/codex",
        ANTHROPIC_MODEL: "gpt-5.6-sol",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "gpt-5.6-luna",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "gpt-5.6-sol",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "gpt-5.6-sol",
        // Claude Code falls back to a 200K context window for unrecognized
        // non-Claude model ids. The ChatGPT Codex backend catalogs gpt-5.6-sol
        // at a 272K window (Codex budgets 95% of it), not the 1.05M API window;
        // it was 372K until mid-2026 (openai/codex#31860). Same cap as every
        // GPT window CC Switch fills (GPT_CONTEXT_WINDOW_CAP). Pin both knobs:
        // the compact window equals min(model window, value), and the routing
        // alias gets a 1M model window, so the compact window is what keeps the
        // trigger under the backend's limit.
        // Tweak these directly in the JSON editor; no form fields on purpose.
        CLAUDE_CODE_MAX_CONTEXT_TOKENS: "272000",
        CLAUDE_CODE_AUTO_COMPACT_WINDOW: "272000",
      },
    },
    category: "third_party",
    apiFormat: "openai_responses",
    providerType: "codex_oauth",
    requiresOAuth: true,
    icon: "openai",
    iconColor: "#000000",
  },
  {
    name: "xAI (Grok)",
    websiteUrl: "https://x.ai/grok",
    settingsConfig: {
      env: {
        // The proxy enforces both this origin and the Responses wire format.
        ANTHROPIC_BASE_URL: "https://api.x.ai/v1",
        ANTHROPIC_MODEL: "grok-4.7",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "grok-4.7",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "grok-4.7",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "grok-4.7",
        // Claude Code falls back to 200K for non-Claude model ids; grok-4.7
        // has a 500K window (same as grok_config::DEFAULT_CONTEXT_WINDOW).
        CLAUDE_CODE_MAX_CONTEXT_TOKENS: "500000",
      },
    },
    category: "third_party",
    apiFormat: "openai_responses",
    providerType: "xai_oauth",
    requiresOAuth: true,
    icon: "xai",
    iconColor: "#000000",
  },
  {
    name: "Xiaomi MiMo",
    family: "xiaomi-mimo",
    planKey: "payg",
    websiteUrl: "https://platform.xiaomimimo.com",
    apiKeyUrl: "https://platform.xiaomimimo.com/#/console/api-keys",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://api.xiaomimimo.com/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "mimo-v2.6-pro[1M]",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "mimo-v2.6-pro[1M]",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "mimo-v2.6-pro[1M]",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "mimo-v2.6-pro[1M]",
      },
    },
    category: "cn_official",
    icon: "xiaomimimo",
    iconColor: "#000000",
  },
  {
    name: "Xiaomi MiMo Token Plan (China)",
    family: "xiaomi-mimo",
    planKey: "tokenPlan",
    websiteUrl: "https://platform.xiaomimimo.com/#/token-plan",
    apiKeyUrl: "https://platform.xiaomimimo.com/#/console/plan-manage",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://token-plan-cn.xiaomimimo.com/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "mimo-v2.6-pro[1M]",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "mimo-v2.6-pro[1M]",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "mimo-v2.6-pro[1M]",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "mimo-v2.6-pro[1M]",
      },
    },
    category: "cn_official",
    icon: "xiaomimimo",
    iconColor: "#000000",
  },
  {
    name: "AWS Bedrock (AKSK)",
    family: "aws-bedrock",
    planKey: "aksk",
    websiteUrl: "https://aws.amazon.com/bedrock/",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL:
          "https://bedrock-runtime.${AWS_REGION}.amazonaws.com",
        AWS_ACCESS_KEY_ID: "${AWS_ACCESS_KEY_ID}",
        AWS_SECRET_ACCESS_KEY: "${AWS_SECRET_ACCESS_KEY}",
        AWS_REGION: "${AWS_REGION}",
        ANTHROPIC_MODEL: "global.anthropic.claude-opus-5",
        ANTHROPIC_DEFAULT_HAIKU_MODEL:
          "global.anthropic.claude-haiku-4-5-20251001-v1:0",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "global.anthropic.claude-sonnet-5",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "global.anthropic.claude-opus-5",
        CLAUDE_CODE_USE_BEDROCK: "1",
      },
    },
    category: "cloud_provider",
    templateValues: {
      AWS_REGION: {
        label: "AWS Region",
        placeholder: "us-west-2",
        editorValue: "us-west-2",
      },
      AWS_ACCESS_KEY_ID: {
        label: "Access Key ID",
        placeholder: "AKIA...",
        editorValue: "",
      },
      AWS_SECRET_ACCESS_KEY: {
        label: "Secret Access Key",
        placeholder: "your-secret-key",
        editorValue: "",
      },
    },
    icon: "aws",
    iconColor: "#FF9900",
  },
  {
    name: "AWS Bedrock (API Key)",
    family: "aws-bedrock",
    planKey: "apiKey",
    websiteUrl: "https://aws.amazon.com/bedrock/",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL:
          "https://bedrock-runtime.${AWS_REGION}.amazonaws.com",
        // Claude Code 只从这个变量读 Bedrock API Key，顶层 apiKey 它不认
        AWS_BEARER_TOKEN_BEDROCK: "",
        AWS_REGION: "${AWS_REGION}",
        ANTHROPIC_MODEL: "global.anthropic.claude-opus-5",
        ANTHROPIC_DEFAULT_HAIKU_MODEL:
          "global.anthropic.claude-haiku-4-5-20251001-v1:0",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "global.anthropic.claude-sonnet-5",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "global.anthropic.claude-opus-5",
        CLAUDE_CODE_USE_BEDROCK: "1",
      },
    },
    category: "cloud_provider",
    templateValues: {
      AWS_REGION: {
        label: "AWS Region",
        placeholder: "us-west-2",
        editorValue: "us-west-2",
      },
    },
    icon: "aws",
    iconColor: "#FF9900",
  },
  {
    name: "Ollama Cloud",
    websiteUrl: "https://ollama.com",
    apiKeyUrl: "https://ollama.com/settings/keys",
    // 官方 Claude Code 直连文档（docs.ollama.com/integrations/claude-code，
    // 2026-10-14 核对）：base 为 https://ollama.com、Key 填 AUTH_TOKEN、
    // ANTHROPIC_API_KEY 置空。云端只认 Authorization: Bearer，不认单独的
    // x-api-key（docs.ollama.com/api/anthropic-compatibility），默认的
    // AUTH_TOKEN 正好是 Bearer。兼容层不支持 cache_control 与 count_tokens。
    // 模型 ID 调 API 时不带 :cloud 后缀（docs.ollama.com/cloud）
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://ollama.com",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_API_KEY: "",
        ANTHROPIC_MODEL: "glm-5.3[1M]",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "glm-5.3-flash[1M]",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "glm-5.3[1M]",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "kimi-k3[1M]",
      },
    },
    category: "cloud_provider",
    // api.ollama.com / www.ollama.com 都 301/308 跳回 ollama.com，不另列候选
    endpointCandidates: ["https://ollama.com"],
    icon: "ollama",
  },
  {
    name: "Cloudflare AI Gateway",
    websiteUrl: "https://developers.cloudflare.com/ai-gateway/",
    // 网关设置页 dash.cloudflare.com/?to=/:account/ai/ai-gateway 也能建 token
    //（developers.cloudflare.com/ai-gateway/get-started，2026-10-14 核对）
    apiKeyUrl: "https://dash.cloudflare.com/profile/api-tokens",
    // 走厂商原生透传端点：base 为 https://gateway.ai.cloudflare.com/v1/<账户 ID>/
    // <网关 ID>/anthropic、不带 /v1（官方 Claude Code 接入页 developers.
    // cloudflare.com/ai-gateway/integrations/coding-agents/claude-code，
    // 2026-10-14 核对）。该页写法是 ANTHROPIC_API_KEY 填网关 token 再加
    // ANTHROPIC_CUSTOM_HEADERS 的 cf-aig-authorization 头，但本地路由不转发自定义
    // 头，靠它鉴权的卡进路由会 401；官方 Claude Desktop 接入页（…/coding-agents/
    // claude-desktop 同日）对同一端点写的是 Bearer 直接带网关 token（Key 是自己
    // 的 Anthropic Key 时才另加该头），故用默认的 AUTH_TOKEN 发 Bearer，只填一次
    // token、路由模式也能用。未经真 Key 实测：Unified Billing 页说请求带了厂商
    // Key 会原样转给厂商，Bearer 网关 token 会不会被当成 Anthropic Key 转发。
    // 网关 ID 默认 default（首个带鉴权的请求自动创建，get-started 同日），token
    // 须有 AI Gateway Run 权限。走 Unified Billing 预充值（充值收 5%，推理按厂商
    // 原价）或 BYOK 存自家 Key。模型用 Anthropic 原生连字符 ID（点号 ID 属于 REST
    // 统一 API，这里不用），三款窗口均 1M（developers.cloudflare.com/ai/models
    // 同日）。走 ANTHROPIC_BASE_URL 时 Claude Code 当普通网关，而 cloud_provider
    // 不会自动补 AUTO_MODE_SERVER=0，故手写（同 Microsoft Foundry）
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL:
          "https://gateway.ai.cloudflare.com/v1/${ACCOUNT_ID}/${GATEWAY_ID}/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "claude-sonnet-5-5",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "claude-haiku-5-5",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "claude-sonnet-5-5",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "claude-opus-5-5",
        CLAUDE_CODE_AUTO_MODE_SERVER: "0",
      },
    },
    category: "cloud_provider",
    templateValues: {
      ACCOUNT_ID: {
        label: "Account ID",
        placeholder: "32-character account ID",
        editorValue: "",
      },
      GATEWAY_ID: {
        label: "Gateway ID",
        placeholder: "default",
        defaultValue: "default",
        editorValue: "default",
      },
    },
    icon: "cloudflare",
  },
];
