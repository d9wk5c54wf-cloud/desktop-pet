import React, { useEffect, useState } from "react";
import { Plugin } from "../types/plugin";
import { PluginLoader } from "../loaders/PluginLoader";
import { PluginContainer } from "./PluginContainer";

export const PluginPanel: React.FC = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [activePlugin, setActivePlugin] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    setLoading(true);
    const loader = PluginLoader.getInstance();

    // 尝试加载测试插件
    try {
      await loader.loadPlugin(
        "../../plugins/local/test-plugin/src/index.ts"
      );
    } catch (error) {
      console.warn("加载测试插件失败:", error);
    }

    setPlugins(loader.getLoadedPlugins());
    setLoading(false);
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "#666",
        }}
      >
        <p>⏳ 加载插件中...</p>
      </div>
    );
  }

  if (activePlugin) {
    return (
      <PluginContainer
        pluginId={activePlugin}
        onClose={() => setActivePlugin(null)}
      />
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        background: "rgba(255,255,255,0.95)",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        maxWidth: "400px",
        width: "100%",
      }}
    >
      <h2
        style={{
          margin: "0 0 20px 0",
          fontSize: "20px",
          color: "#333",
          borderBottom: "2px solid #667eea",
          paddingBottom: "10px",
        }}
      >
        🧩 插件面板
      </h2>

      {plugins.length === 0 ? (
        <p style={{ color: "#666", textAlign: "center" }}>
          暂无可用插件
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {plugins.map((plugin) => (
            <div
              key={plugin.id}
              onClick={() => setActivePlugin(plugin.id)}
              style={{
                padding: "15px",
                background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                border: "1px solid #e0e0e0",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    color: "#333",
                  }}
                >
                  {plugin.name}
                </h3>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    background: "#fff",
                    padding: "2px 8px",
                    borderRadius: "12px",
                  }}
                >
                  v{plugin.version}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "#666",
                }}
              >
                {plugin.description}
              </p>
              <p
                style={{
                  margin: "8px 0 0 0",
                  fontSize: "12px",
                  color: "#999",
                }}
              >
                👤 {plugin.author}
              </p>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={loadPlugins}
        style={{
          marginTop: "20px",
          width: "100%",
          padding: "10px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        🔄 刷新插件
      </button>
    </div>
  );
};