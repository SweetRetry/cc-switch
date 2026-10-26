import { useTranslation } from "react-i18next";
import { Monitor, Moon, Sun } from "lucide-react";
import type { SettingsFormState } from "@/hooks/useSettings";
import { useTheme } from "@/components/theme-provider";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isLinux } from "@/lib/platform";
import { TerminalSelect } from "@/components/settings/TerminalSettings";
import {
  SettingsList,
  SettingsOption,
  SettingsRow,
} from "@/components/settings/SettingsLayout";

type Language = SettingsFormState["language"];

const LANGUAGES: { value: Language; labelKey: string }[] = [
  { value: "zh", labelKey: "settings.languageOptionChinese" },
  { value: "zh-TW", labelKey: "settings.languageOptionTraditionalChinese" },
  { value: "en", labelKey: "settings.languageOptionEnglish" },
  { value: "ja", labelKey: "settings.languageOptionJapanese" },
  { value: "tr", labelKey: "settings.languageOptionTurkish" },
];

interface GeneralSectionProps {
  settings: SettingsFormState;
  onAutoSave: (updates: Partial<SettingsFormState>) => Promise<boolean>;
}

export function GeneralSection({ settings, onAutoSave }: GeneralSectionProps) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <>
      <SettingsList title={t("settings.tabGeneral")}>
        <SettingsRow
          label={t("settings.language")}
          control={
            <Select
              value={settings.language}
              onValueChange={(value) =>
                void onAutoSave({ language: value as Language })
              }
            >
              <SelectTrigger
                className="h-8 w-[160px]"
                aria-label={t("settings.language")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((language) => (
                  <SelectItem key={language.value} value={language.value}>
                    {t(language.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
        <SettingsRow
          label={t("settings.theme")}
          control={
            <SegmentedControl
              size="sm"
              aria-label={t("settings.theme")}
              value={theme}
              onValueChange={setTheme}
              items={[
                {
                  value: "system",
                  label: (
                    <span className="sr-only">{t("settings.themeSystem")}</span>
                  ),
                  icon: Monitor,
                },
                {
                  value: "light",
                  label: (
                    <span className="sr-only">{t("settings.themeLight")}</span>
                  ),
                  icon: Sun,
                },
                {
                  value: "dark",
                  label: (
                    <span className="sr-only">{t("settings.themeDark")}</span>
                  ),
                  icon: Moon,
                },
              ]}
            />
          }
        />
        <SettingsRow
          label={t("settings.terminal.title")}
          help={{
            title: t("settings.terminal.title"),
            body: t("settings.general.terminalHelp"),
          }}
          control={
            <TerminalSelect
              className="h-8 w-[160px]"
              value={settings.preferredTerminal}
              onChange={(terminal) =>
                void onAutoSave({ preferredTerminal: terminal })
              }
            />
          }
        />
      </SettingsList>

      <div className="grid gap-5">
        <SettingsOption
          label={t("settings.launchOnStartup")}
          description={t("settings.launchOnStartupDescription")}
          checked={!!settings.launchOnStartup}
          onCheckedChange={(value) =>
            void onAutoSave({ launchOnStartup: value })
          }
        />
        {settings.launchOnStartup && (
          <SettingsOption
            label={t("settings.silentStartup")}
            description={t("settings.silentStartupDescription")}
            checked={!!settings.silentStartup}
            onCheckedChange={(value) =>
              void onAutoSave({ silentStartup: value })
            }
          />
        )}
        <SettingsOption
          label={t("settings.minimizeToTray")}
          description={t("settings.general.minimizeToTrayHelp")}
          checked={settings.minimizeToTrayOnClose}
          onCheckedChange={(value) =>
            void onAutoSave({ minimizeToTrayOnClose: value })
          }
        />
        {isLinux() && (
          <SettingsOption
            label={t("settings.useAppWindowControls")}
            description={t("settings.useAppWindowControlsDescription")}
            checked={!!settings.useAppWindowControls}
            onCheckedChange={(value) =>
              void onAutoSave({ useAppWindowControls: value })
            }
          />
        )}
        <SettingsOption
          label={t("settings.general.checkToolUpdates")}
          description={t("settings.general.checkToolUpdatesHelp")}
          checked={settings.checkToolUpdatesOnStartup ?? false}
          onCheckedChange={(value) =>
            void onAutoSave({ checkToolUpdatesOnStartup: value })
          }
        />
      </div>
    </>
  );
}
