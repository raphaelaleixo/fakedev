import "@testing-library/jest-dom/vitest";

/**
 * jsdom implements `<dialog>` as an element but not its methods, so anything
 * using the native modal API throws. `react-gameroom`'s RoomInfoModal is built
 * on it — correctly, since it's the accessible choice — so the environment gets
 * shimmed rather than the component avoided.
 */
if (typeof HTMLDialogElement !== "undefined") {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.open = true;
    };
  }
  if (!HTMLDialogElement.prototype.show) {
    HTMLDialogElement.prototype.show = function show() {
      this.open = true;
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function close() {
      this.open = false;
      this.dispatchEvent(new Event("close"));
    };
  }
}
