import app from "ags/gtk4/app";
import style from "./style.scss";
import Bar from "./widget/Bar";
import { createBinding, For, This } from "ags";
import GLib from "gi://GLib";

app.start({
  instanceName:
    GLib.getenv("MEEGBAR_DEV") !== "true" ? "meegbar" : "meegbar-dev",

  main() {
    app.apply_css(style);

    const monitors = createBinding(app, "monitors");

    return (
      <For each={monitors}>
        {(monitor) => (
          <This this={app}>
            <Bar gdkmonitor={monitor} />
          </This>
        )}
      </For>
    );
  },
});
