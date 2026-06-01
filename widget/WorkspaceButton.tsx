import { createBinding, With } from "ags";

export function WorkspaceButton({
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
            hyprland.dispatch(
              'hl.dsp.focus({ workspace = "' +
                workspace.get_id().toString() +
                '" })',
              "",
            )
          }
        >
          <label label={`${workspace.get_name()} `} />
        </button>
      )}
    </With>
  );
}
