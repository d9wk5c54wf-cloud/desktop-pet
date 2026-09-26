import { Plugin } from "../../../src/types/plugin";
import { TestComponent } from "./components/TestComponent";

const TestPlugin: Plugin = {
  id: "test-plugin",
  name: "测试插件",
  version: "1.0.0",
  description: "用于测试插件系统的示例插件",
  author: "Developer",
  main: TestComponent,
  config: {
    greeting: "你好，我是测试插件！",
  },

  async onInstall() {
    console.log("[测试插件] 已安装");
  },

  async onUninstall() {
    console.log("[测试插件] 已卸载");
  },

  async onEnable() {
    console.log("[测试插件] 已启用");
  },

  async onDisable() {
    console.log("[测试插件] 已禁用");
  },
};

export default TestPlugin;