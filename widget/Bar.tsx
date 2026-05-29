import app from "ags/gtk4/app";
import { Astal, Gtk, Gdk } from "ags/gtk4";
import { execAsync } from "ags/process";
import { createPoll } from "ags/time";
import {
  createBinding,
  createComputed,
  createConnection,
  For,
  With,
} from "ags";
import Hyprland from "gi://AstalHyprland";
import Network from "gi://AstalNetwork";
import WirePlumber from "gi://AstalWp";

function getWorkspacesOnMonitor(workspaces: any[], gdkmonitor: Gdk.Monitor) {
  const geom =
    typeof (gdkmonitor as any).get_geometry === "function"
      ? (gdkmonitor as any).get_geometry()
      : (gdkmonitor as any).geometry || null;

  const monitorNames = [
    (gdkmonitor as any).model,
    (gdkmonitor as any).name,
    (gdkmonitor as any).manufacturer,
    typeof (gdkmonitor as any).get_model === "function"
      ? (gdkmonitor as any).get_model()
      : null,
    typeof (gdkmonitor as any).get_name === "function"
      ? (gdkmonitor as any).get_name()
      : null,
  ]
    .filter(Boolean)
    .map(String);

  return workspaces.filter((ws: any) => {
    if (!ws) return false;

    const m = ws.monitor || {};

    if (!m) return false;

    if (geom && typeof m.x === "number" && typeof m.y === "number") {
      if (m.x === geom.x && m.y === geom.y) return true;
      if (
        typeof m.width === "number" &&
        typeof m.height === "number" &&
        !(
          m.x + m.width <= geom.x ||
          m.x >= geom.x + geom.width ||
          m.y + m.height <= geom.y ||
          m.y >= geom.y + geom.height
        )
      ) {
        return true;
      }
    }

    if (m.id && monitorNames.length) {
      if (monitorNames.includes(String(m.id))) return true;
      if (monitorNames.includes(String(m.name || ""))) return true;
    }

    if (m.id && ((gdkmonitor as any).id || (gdkmonitor as any).name)) {
      if (
        String(m.id) ===
        String((gdkmonitor as any).id || (gdkmonitor as any).name)
      )
        return true;
    }

    return false;
  });
}

function WorkspaceButton({
  workspace,
  hyprland,
}: {
  workspace: any;
  hyprland: any;
}) {
  const focusedWorkspace = createBinding(hyprland, "focusedWorkspace");

  return (
    <With value={focusedWorkspace}>
      {(focused) => (
        <button
          class={
            focused?.get_id() === workspace.get_id()
              ? "workspace active"
              : "workspace"
          }
          onClicked={() =>
            hyprland.dispatch("workspace", workspace.get_id().toString())
          }
        >
          <label label={`${workspace.get_name()} `} />
        </button>
      )}
    </With>
  );
}

export type BarProps = {
  gdkmonitor: Gdk.Monitor;
};

export default function Bar({ gdkmonitor }: BarProps) {
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
