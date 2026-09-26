import React, { useState } from "react";

interface TestComponentProps {
  config?: {
    greeting?: string;
  };
}

export const TestComponent: React.FC<TestComponentProps> = ({
  config = {},
}) => {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState(config.greeting || "测试插件已加载！");

  return (
    <div
      style={{
        padding: "20px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "12px",
        color: "white",
        fontFamily: "sans-serif",
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
      }}
    >
      <h2 style={{ margin: "0 0 15px 0", fontSize: "18px" }}>
        🧪 测试插件
      </h2>

      <p style={{ margin: "0 0 15px 0", opacity: 0.9 }}>{message}</p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "15px",
        }}
      >
        <button
          onClick={() => setCount((c) => c + 1)}
          style={{
            padding: "8px 16px",
            background: "rgba(255,255,255,0.2)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: "6px",
            color: "white",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          点击我
        </button>
        <span style={{ fontSize: "16px" }}>点击次数: {count}</span>
      </div>

      <div
        style={{
          padding: "10px",
          background: "rgba(0,0,0,0.2)",
          borderRadius: "6px",
          fontSize: "12px",
        }}
      >
        <p style={{ margin: "0 0 5px 0" }}>✅ 插件状态: 运行中</p>
        <p style={{ margin: "0" }}>📦 版本: 1.0.0</p>
      </div>
    </div>
  );
};