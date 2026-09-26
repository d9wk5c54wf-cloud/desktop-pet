import { Plugin } from "../types/plugin";

// 插件加载器
export class PluginLoader {
  private static instance: PluginLoader;
  private plugins: Map<string, Plugin> = new Map();
  private pluginContext: Record<string, any> = {};

  private constructor() {}

  static getInstance(): PluginLoader {
    if (!PluginLoader.instance) {
      PluginLoader.instance = new PluginLoader();
    }
    return PluginLoader.instance;
  }

  // 加载单个插件
  async loadPlugin(pluginPath: string): Promise<Plugin | null> {
    try {
      // 动态导入插件模块
      const pluginModule = await import(/* @vite-ignore */ pluginPath);
      const plugin: Plugin = pluginModule.default || pluginModule;

      // 验证插件接口
      if (!this.validatePlugin(plugin)) {
        console.error(`插件验证失败: ${pluginPath}`);
        return null;
      }

      // 存储插件
      this.plugins.set(plugin.id, plugin);
      console.log(`✅ 插件已加载: ${plugin.name} (${plugin.id})`);

      return plugin;
    } catch (error) {
      console.error(`加载插件失败: ${pluginPath}`, error);
      return null;
    }
  }

  // 验证插件接口
  private validatePlugin(plugin: any): plugin is Plugin {
    return (
      typeof plugin === "object" &&
      typeof plugin.id === "string" &&
      typeof plugin.name === "string" &&
      typeof plugin.version === "string" &&
      typeof plugin.main === "function"
    );
  }

  // 获取所有已加载插件
  getLoadedPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  // 根据ID获取插件
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  // 卸载插件
  unloadPlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      if (plugin.onDisable) {
        plugin.onDisable();
      }
      this.plugins.delete(pluginId);
      console.log(`❌ 插件已卸载: ${pluginId}`);
      return true;
    }
    return false;
  }

  // 设置插件上下文（共享数据）
  setContext(key: string, value: any): void {
    this.pluginContext[key] = value;
  }

  // 获取插件上下文
  getContext(key: string): any {
    return this.pluginContext[key];
  }
}