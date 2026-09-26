// 插件接口定义
export interface Plugin {
  // 插件唯一标识
  id: string;
  // 插件名称
  name: string;
  // 插件版本
  version: string;
  // 插件描述
  description: string;
  // 插件作者
  author: string;
  // 插件图标
  icon?: string;
  // 插件入口组件
  main: React.ComponentType;
  // 插件配置
  config?: Record<string, any>;
  // 生命周期方法
  onInstall?: () => Promise<void>;
  onUninstall?: () => Promise<void>;
  onEnable?: () => Promise<void>;
  onDisable?: () => Promise<void>;
}

// 插件管理器接口
export interface PluginManager {
  // 获取所有已安装插件
  getInstalledPlugins(): Plugin[];
  // 安装插件
  install(plugin: Plugin): Promise<void>;
  // 卸载插件
  uninstall(pluginId: string): Promise<void>;
  // 启用插件
  enable(pluginId: string): Promise<void>;
  // 禁用插件
  disable(pluginId: string): Promise<void>;
  // 获取插件配置
  getConfig(pluginId: string): Record<string, any>;
  // 更新插件配置
  updateConfig(pluginId: string, config: Record<string, any>): Promise<void>;
}