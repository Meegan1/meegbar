import app from "ags/gtk4/app";
import { Astal, Gtk, Gdk } from "ags/gtk4";
import { execAsync } from "ags/process";
import { createPoll } from "ags/time";
import { createBinding, For, With } from "ags";
import Hyprland from "gi://AstalHyprland";

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
    const m = ws.monitor || {};

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

export default function Bar(gdkmonitor: Gdk.Monitor) {
  const time = createPoll("", 1000, ["date", "+%d/%m/%Y %H:%M"]);
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor;

  const hyprland = Hyprland.get_default();

  const workspaces = createBinding(hyprland, "workspaces").as(
    (allWorkspaces) => {
      return getWorkspacesOnMonitor(allWorkspaces, gdkmonitor).sort(
        (a: any, b: any) => a.get_name() - b.get_name(),
      );
    },
  );

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
        <box $type="start" spacing={5} class="container workspaces">
          <For each={workspaces}>
            {(workspace) => (
              <box>
                <WorkspaceButton workspace={workspace} hyprland={hyprland} />
              </box>
            )}
          </For>
        </box>

        <box $type="end" class="container time">
          <menubutton>
            <label label={time} />
            <popover>
              <Gtk.Calendar />
            </popover>
          </menubutton>
        </box>
      </centerbox>
    </window>
  );
}
