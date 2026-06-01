import app from "ags/gtk4/app";
import { Astal, Gtk, Gdk } from "ags/gtk4";
import { execAsync } from "ags/process";
import { createPoll } from "ags/time";
import { createBinding, createComputed, For } from "ags";
import Hyprland from "gi://AstalHyprland";
import Network from "gi://AstalNetwork";
import WirePlumber from "gi://AstalWp";
import { Tray } from "./Tray";
import { AppConfig } from "../app";
import { WorkspaceButton } from "./WorkspaceButton";
import { getWorkspacesOnMonitor } from "./utils";

export type BarProps = {
  gdkmonitor: Gdk.Monitor;
  config: AppConfig;
};

export default function Bar({ gdkmonitor, config }: BarProps) {
  const pointer = Gdk.Cursor.new_from_name("pointer", null);

  const time = createPoll("", 1000, ["date", "+%d/%m/%Y %H:%M"]);
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor;

  const hyprland = Hyprland.get_default();

  const workspaces = createBinding(hyprland, "workspaces").as(
    (allWorkspaces) => {
      if (!allWorkspaces) return [];

      return getWorkspacesOnMonitor(allWorkspaces, gdkmonitor)
        .filter(Boolean)
        .sort((a: any, b: any) => a.get_name() - b.get_name());
    },
  );

  const network = Network.get_default();
  const wifi = createBinding(network, "wifi");
  const wired = createBinding(network, "wired");
  const networkLabel = createComputed(() => {
    const _wifi = wifi();
    const _wired = wired();

    if (_wifi?.ssid) return `${_wifi?.ssid} `;
    if (_wired?.connection.ip4_config.addresses) return "Wired ";

    return "Disconnected ";
  });

  const networkTooltip = createComputed(() => {
    const _wifi = wifi();
    const _wired = wired();

    if (_wifi?.ssid) return `${_wifi.ssid} (${Math.round(_wifi.strength)}%)`;
    if (_wired?.connection.ip4_config) return `Wired`;

    return "No network connection";
  });

  const speaker = WirePlumber.get_default().audio.defaultSpeaker;
  const volume = createBinding(speaker, "volume");
  const speakerName = createBinding(speaker, "description");
  const volumeLabel = createComputed(() => {
    return `  ${Math.round(volume() * 100)}%`;
  });
  const volumeTooltip = createComputed(() => {
    const name = speakerName();
    const vol = Math.round(volume() * 100);
    return `${name}: ${vol}%`;
  });

  const showTray = createBinding(config, "showTray");

  return (
    <window
      visible
      name="bar"
      class="Bar"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <centerbox cssName="centerbox">
        <box $type="start">
          <box spacing={5} class="container workspaces">
            <For each={workspaces}>
              {(workspace) => (
                <box>
                  <WorkspaceButton workspace={workspace} hyprland={hyprland} />
                </box>
              )}
            </For>
          </box>
        </box>

        <box $type="end" spacing={16}>
          <box visible={showTray} class="container" spacing={5}>
            <Tray />
          </box>

          <box class="container" spacing={5}>
            <button
              class="volume"
              cursor={pointer}
              tooltip_text={volumeTooltip}
              onClicked={() =>
                execAsync(
                  "bash -c 'if pidof pavucontrol > /dev/null; then pkill -f pavucontrol; else pavucontrol & disown; fi'",
                )
              }
            >
              <label label={volumeLabel} />
            </button>

            <button
              class="network"
              cursor={pointer}
              tooltip_text={networkTooltip}
              onClicked={() =>
                execAsync(
                  "bash -c 'if pidof nm-connection-editor > /dev/null; then pkill -f nm-connection-editor; else nm-connection-editor & disown; fi'",
                )
              }
            >
              <label label={networkLabel} />
            </button>

            <menubutton class="time" cursor={pointer}>
              <label label={time} />
              <popover class="calendar-popover">
                <Gtk.Calendar />
              </popover>
            </menubutton>
          </box>

          <box class="container actions">
            <button
              class="power"
              onClicked={() => execAsync("wlogout")}
              cursor={pointer}
            >
              <label label={"⏻"} />
            </button>
          </box>
        </box>
      </centerbox>
    </window>
  );
}
