import { mount } from "@cloudflare/nimbus-docs/client";

let supportsDisplayTransition: boolean | undefined;

function canTransitionDisplay(): boolean {
  if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
  if (!window.CSS?.supports?.("transition-behavior", "allow-discrete") || !document.body) {
    return false;
  }
  const probe = document.createElement("div");
  probe.style.cssText = "transition: display 1s allow-discrete !important; display: block;";
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = "none";
  supportsDisplayTransition = getComputedStyle(probe).display === "block";
  probe.remove();
  return supportsDisplayTransition;
}

function supportsTopLayerExit(): boolean {
  return Boolean(window.CSS?.supports?.("overlay", "auto")) && canTransitionDisplay();
}

export async function closeAnimatedDialog(dialog: HTMLDialogElement): Promise<void> {
  if (!dialog.open) return;
  if (!supportsTopLayerExit()) {
    dialog.setAttribute("data-closing", "");
    const animations = dialog.getAnimations({ subtree: true });
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((a) => a.finished)),
        new Promise<void>((resolve) => setTimeout(resolve, 600)),
      ]);
    }
    if (!dialog.hasAttribute("data-closing")) return;
    dialog.removeAttribute("data-closing");
  }
  dialog.close();
}

mount("[data-dialog]", (root) => {
  if (!(root instanceof HTMLDialogElement)) return () => {};
  const dialog = root;
  const controller = new AbortController();
  const { signal } = controller;

  const onCancel = (event: Event) => {
    if (!supportsTopLayerExit()) {
      event.preventDefault();
      void closeAnimatedDialog(dialog);
    }
  };
  dialog.addEventListener("cancel", onCancel, { signal });

  // Progressive fallback for browsers without native Invoker Commands (`commandfor`/`command`).
  if (!("commandForElement" in HTMLButtonElement.prototype) && dialog.id) {
    const onInvokerClick = (event: MouseEvent) => {
      const btn = (event.target as Element | null)?.closest<HTMLButtonElement>(
        `button[commandfor="${CSS.escape(dialog.id)}"]`,
      );
      if (!btn) return;
      const cmd = btn.getAttribute("command");
      if (cmd === "close") void closeAnimatedDialog(dialog);
      else if (cmd === "show-modal" && !dialog.open) dialog.showModal();
    };
    document.addEventListener("click", onInvokerClick, { signal });
  }

  // Fallback light-dismiss for browsers without native `closedby="any"` (Safari).
  if (!("closedBy" in HTMLDialogElement.prototype)) {
    let pressedOn: EventTarget | null = null;
    dialog.addEventListener(
      "pointerdown",
      (e: PointerEvent) => {
        pressedOn = e.target;
      },
      { signal },
    );
    dialog.addEventListener(
      "pointerup",
      (e: PointerEvent) => {
        if (e.target === dialog && pressedOn === dialog) {
          void closeAnimatedDialog(dialog);
        }
        pressedOn = null;
      },
      { signal },
    );
  }

  return () => controller.abort();
});
