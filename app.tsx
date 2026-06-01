import app from "ags/gtk4/app";
import style from "./style.scss";
import Bar from "./widget/Bar";
import { createBinding, For, This } from "ags";
import GLib from "gi://GLib";
import GObject, { register, property } from "gnim/gobject";

@register()
class AppConfig extends GObject.Object {
  @property(Boolean)
  showTray = false;
}

const config = new AppConfig();

app.start({
  instanceName:
    GLib.getenv("MEEGBAR_DEV") !== "true" ? "meegbar" : "meegbar-dev",

  requestHandler: (argv: string[], response: (response: string) => void) => {
    const [cmd, arg, ...rest] = argv;

    if (cmd === "toggle-tray") {
      config.showTray = !config.showTray;
      response(`Tray visibility toggled: ${config.showTray}`);
      return;
    }

    if (cmd === "help" || cmd === "--help" || cmd === "-h") {
      response(
        "Available commands:\n" +
          "\n" +
          "toggle-tray: Toggle the visibility of the system tray.\n" +
          "\n" +
          "help: Show this help message.",
      );

      return;
    }

    if (cmd) {
      response(`Unknown command: ${cmd}. Type 'help' for a list of commands.`);
      return;
    }
  },

  main() {
    app.apply_css(style);

    const monitors = createBinding(app, "monitors");

    return (
      <For each={monitors}>
        {(monitor) => (
          <This this={app}>
            <Bar gdkmonitor={monitor} config={config} />
          </This>
        )}
      </For>
    );
  },
});
