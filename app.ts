import app from "ags/gtk4/app";
import style from "./style.scss";
import Bar from "./widget/Bar";

app.start({
  main() {
    app.apply_css(style);

    app.get_monitors().map(Bar);
  },
});
