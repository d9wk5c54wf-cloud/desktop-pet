import { Plugin, PluginManager as IPluginManager } from "../types/plugin";
import { invoke } from "@tauri-apps/api/core";
import { appDataDir, join } from "@tauri-apps/api/path";
import { readTextFile, writeTextFile, exists, mkdir } from "@tauri-apps/plugin-fs";

export class PluginManager implements IPluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private configPath: string = "";

  async initialize() {
    const appData = await appDataDir();
    this.configPath = await join(appData, "plugins.json");
    await this.loadPlugins();
  }

  private async loadPlugins() {
    try {
      if (await exists(this.configPath)) {
        const config = await readTextFile(this.configPath);
        const pluginConfigs = JSON.parse(config);
        // 加载已安装的插件
        for (const pluginConfig of pluginConfigs) {
          await this.loadPlugin(pluginConfig);
        }
      }
    } catch (error) {
      console.error("加载插件配置失败:", error);
    }
  }

  private async loadPlugin(config: { id: string; path: string }) {
    try {
      // 动态加载插件
      const pluginModule = await import(/* @vite-ignore */ config.path);
      const plugin: Plugin = pluginModule.default;
      this.plugins.set(plugin.id, plugin);
    } catch (error) {
      console.error(`加载插件 ${config.id} 失败:`, error);
    }
  }

  getInstalledPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  async install(plugin: Plugin): Promise<void> {
    // 调用插件的安装方法
    if (plugin.onInstall) {
      await plugin.onInstall();
    }
    this.plugins.set(plugin.id, plugin);
    await this.savePlugins();
  }

  async uninstall(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`插件 ${pluginId} 不存在`);
    }

    // 调用插件的卸载方法
    if (plugin.onUninstall) {
      await plugin.onUninstall();
    }
    this.plugins.delete(pluginId);
    await this.savePlugins();
  }

  async enable(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`插件 ${pluginId} 不存在`);
    }

    if (plugin.onEnable) {
      await plugin.onEnable();
    }
  }

  async disable(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`插件 ${pluginId} 不存在`);
    }

    if (plugin.onDisable) {
      await plugin.onDisable();
    }
  }

  getConfig(pluginId: string): Record<string, any> {
    const plugin = this.plugins.get(pluginId);
    return plugin?.config || {};
  }

  async updateConfig(pluginId: string, config: Record<string, any>): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`插件 ${pluginId} 不存在`);
    }

    plugin.config = { ...plugin.config, ...config };
    await this.savePlugins();
  }

  private async savePlugins() {
    const pluginConfigs = Array.from(this.plugins.entries()).map(([id, plugin]) => ({
      id,
      path: `plugins/${id}/index.ts`, // 插件路径
    }));
    await writeTextFile(this.configPath, JSON.stringify(pluginConfigs, null, 2));
  }
}