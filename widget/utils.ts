import { Gdk } from "ags/gtk4";

export function getWorkspacesOnMonitor(
  workspaces: any[],
  gdkmonitor: Gdk.Monitor,
) {
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

    let m: any;
    try {
      m = ws.monitor;
    } catch {
      return false;
    }

    if (!m) return false;

    try {
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
    } catch {
      return false;
    }

    return false;
  });
}
