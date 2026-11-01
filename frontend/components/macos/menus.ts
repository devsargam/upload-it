import type { MenuEntry } from "./menu";

export type FrontApp = "Ghostty" | "Finder";

/** What the menus can do to the desktop. */
export interface DesktopActions {
  hasWindow: boolean;
  newWindow: () => void;
  closeWindow: () => void;
  minimize: () => void;
  zoom: () => void;
  quit: () => void;
  copyCommand: () => void;
  openGitHub: () => void;
}

export interface MenuDef {
  title: string;
  entries: MenuEntry[];
}

/** The Apple menu is the same whichever app is in front. */
const appleMenu: MenuEntry[] = [
  { label: "About This Mac" },
  "separator",
  { label: "System Settings…" },
  { label: "App Store…" },
  "separator",
  { label: "Recent Items" },
  "separator",
  { label: "Force Quit…", shortcut: "⌥⌘⎋" },
  "separator",
  { label: "Sleep" },
  { label: "Restart…" },
  { label: "Shut Down…" },
  "separator",
  { label: "Lock Screen", shortcut: "⌃⌘Q" },
  { label: "Log Out you…", shortcut: "⇧⌘Q" },
];

function ghosttyMenus(a: DesktopActions): MenuDef[] {
  return [
    {
      title: "Ghostty",
      entries: [
        { label: "About Ghostty" },
        "separator",
        { label: "Settings…", shortcut: "⌘," },
        "separator",
        { label: "Hide Ghostty", shortcut: "⌘H" },
        { label: "Hide Others", shortcut: "⌥⌘H" },
        { label: "Show All", disabled: true },
        "separator",
        { label: "Quit Ghostty", shortcut: "⌘Q", action: a.quit },
      ],
    },
    {
      title: "File",
      entries: [
        { label: "New Window", shortcut: "⌘N", action: a.newWindow },
        { label: "New Tab", shortcut: "⌘T", disabled: true },
        "separator",
        { label: "Close Window", shortcut: "⌘W", disabled: !a.hasWindow, action: a.closeWindow },
      ],
    },
    {
      title: "Edit",
      entries: [
        { label: "Undo", shortcut: "⌘Z", disabled: true },
        { label: "Redo", shortcut: "⇧⌘Z", disabled: true },
        "separator",
        { label: "Copy", shortcut: "⌘C", action: a.copyCommand },
        { label: "Paste", shortcut: "⌘V", disabled: true },
        { label: "Select All", shortcut: "⌘A", disabled: true },
      ],
    },
    {
      title: "View",
      entries: [
        { label: "Increase Font Size", shortcut: "⌘+" },
        { label: "Decrease Font Size", shortcut: "⌘−" },
        { label: "Reset Font Size", shortcut: "⌘0" },
        "separator",
        { label: "Enter Full Screen", shortcut: "⌃⌘F", disabled: !a.hasWindow, action: a.zoom },
      ],
    },
    {
      title: "Window",
      entries: [
        { label: "Minimize", shortcut: "⌘M", disabled: !a.hasWindow, action: a.minimize },
        { label: "Zoom", disabled: !a.hasWindow, action: a.zoom },
        "separator",
        { label: "Bring All to Front", disabled: !a.hasWindow },
        "separator",
        { label: "upload-it — zsh", checked: a.hasWindow, disabled: !a.hasWindow },
      ],
    },
    {
      title: "Help",
      entries: [
        { label: "upload-it on GitHub", action: a.openGitHub },
        "separator",
        { label: "Ghostty Help" },
      ],
    },
  ];
}

function finderMenus(a: DesktopActions): MenuDef[] {
  return [
    {
      title: "Finder",
      entries: [
        { label: "About Finder" },
        "separator",
        { label: "Settings…", shortcut: "⌘," },
        "separator",
        { label: "Empty Trash…", shortcut: "⇧⌘⌫" },
        "separator",
        { label: "Hide Finder", shortcut: "⌘H" },
        { label: "Hide Others", shortcut: "⌥⌘H" },
        { label: "Show All" },
      ],
    },
    {
      title: "File",
      entries: [
        { label: "New Finder Window", shortcut: "⌘N" },
        { label: "New Folder", shortcut: "⇧⌘N" },
        "separator",
        { label: "Close Window", shortcut: "⌘W", disabled: true },
      ],
    },
    {
      title: "Edit",
      entries: [
        { label: "Undo", shortcut: "⌘Z", disabled: true },
        { label: "Redo", shortcut: "⇧⌘Z", disabled: true },
        "separator",
        { label: "Cut", shortcut: "⌘X", disabled: true },
        { label: "Copy", shortcut: "⌘C", disabled: true },
        { label: "Paste", shortcut: "⌘V", disabled: true },
        { label: "Select All", shortcut: "⌘A" },
      ],
    },
    {
      title: "View",
      entries: [
        { label: "as Icons", shortcut: "⌘1", checked: true },
        { label: "as List", shortcut: "⌘2" },
        { label: "as Columns", shortcut: "⌘3" },
        { label: "as Gallery", shortcut: "⌘4" },
      ],
    },
    {
      title: "Go",
      entries: [
        { label: "Back", shortcut: "⌘[", disabled: true },
        { label: "Forward", shortcut: "⌘]", disabled: true },
        "separator",
        { label: "Recents", shortcut: "⇧⌘F" },
        { label: "Documents", shortcut: "⇧⌘O" },
        { label: "Desktop", shortcut: "⇧⌘D" },
        { label: "Downloads", shortcut: "⌥⌘L" },
        { label: "Home", shortcut: "⇧⌘H" },
        { label: "Applications", shortcut: "⇧⌘A" },
      ],
    },
    {
      title: "Window",
      entries: [
        { label: "Minimize", shortcut: "⌘M", disabled: true },
        { label: "Zoom", disabled: true },
        "separator",
        { label: "Bring All to Front", disabled: !a.hasWindow },
      ],
    },
    {
      title: "Help",
      entries: [{ label: "macOS Help" }, "separator", { label: "upload-it on GitHub", action: a.openGitHub }],
    },
  ];
}

export function appMenus(app: FrontApp, actions: DesktopActions): MenuDef[] {
  return app === "Ghostty" ? ghosttyMenus(actions) : finderMenus(actions);
}

export { appleMenu };

export const batteryMenu: MenuEntry[] = [
  { label: "Battery", kind: "heading", detail: "100%" },
  { label: "Power Source: Battery", kind: "caption" },
  "separator",
  { label: "Battery Settings…" },
];

export const wifiMenu: MenuEntry[] = [
  { label: "Wi-Fi", kind: "heading", detail: "On" },
  "separator",
  { label: "Known Network", kind: "caption" },
  { label: "upload-it", checked: true },
  "separator",
  { label: "Other Networks" },
  "separator",
  { label: "Wi-Fi Settings…" },
];
