import { Plugin } from "../../../../src/types/plugin";
import { WebBrowserComponent } from "./components/WebBrowser";

const WebBrowserPlugin: Plugin = {
  id: "web-browser",
  name: "网站访问",
  version: "1.0.0",
  description: "让桌宠可以访问网站并显示内容",
  author: "Desktop Pet Team",
  icon: "icon.png",
  main: WebBrowserComponent,
  config: {
    homepage: "https://example.com",
    enableJavaScript: true,
    userAgent: "DesktopPet/1.0",
  },

  async onInstall() {
    console.log("网站访问插件已安装");
  },

  async onUninstall() {
    console.log("网站访问插件已卸载");
  },

  async onEnable() {
    console.log("网站访问插件已启用");
  },

  async onDisable() {
    console.log("网站访问插件已禁用");
  },
};

export default WebBrowserPlugin;