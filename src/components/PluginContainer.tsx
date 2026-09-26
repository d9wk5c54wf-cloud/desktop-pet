import React, { useEffect, useState } from "react";
import { Plugin } from "../types/plugin";
import { PluginLoader } from "../loaders/PluginLoader";

interface PluginContainerProps {
  pluginId: string;
  onClose?: () => void;
}

export const PluginContainer: React.FC<PluginContainerProps> = ({
  pluginId,
  onClose,
}) => {
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loader = PluginLoader.getInstance();
    const loadedPlugin = loader.getPlugin(pluginId);

    if (loadedPlugin) {
      setPlugin(loadedPlugin);
      // 调用启用生命周期
      if (loadedPlugin.onEnable) {
        loadedPlugin.onEnable().catch(console.error);
      }
    } else {
      setError(`插件未找到: ${pluginId}`);
    }

    return () => {
      // 清理：调用禁用生命周期
      if (loadedPlugin?.onDisable) {
        loadedPlugin.onDisable().catch(console.error);
      }
    };
  }, [pluginId]);

  if (error) {
    return (
      <div
        style={{
          padding: "20px",
          background: "#fee",
          border: "1px solid #fcc",
          borderRadius: "8px",
          color: "#c00",
        }}
      >
        <p>❌ {error}</p>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "#c00",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            关闭
          </button>
        )}
      </div>
    );
  }

  if (!plugin) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "#666",
        }}
      >
        <p>⏳ 加载中...</p>
      </div>
    );
  }

  const PluginComponent = plugin.main;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      {/* 关闭按钮 */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            zIndex: 1000,
            padding: "6px 12px",
            background: "rgba(0,0,0,0.5)",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          ✕
        </button>
      )}

      {/* 插件组件 */}
      <PluginComponent config={plugin.config} />
    </div>
  );
};