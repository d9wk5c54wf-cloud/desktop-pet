import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface WebBrowserProps {
  config: {
    homepage: string;
    enableJavaScript: boolean;
    userAgent: string;
  };
}

export const WebBrowserComponent: React.FC<WebBrowserProps> = ({ config }) => {
  const [url, setUrl] = useState(config.homepage);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWebsite = async (targetUrl: string) => {
    setLoading(true);
    setError(null);

    try {
      // 使用 Tauri 的 HTTP 插件获取网站内容
      const response = await invoke("fetch_url", {
        url: targetUrl,
        userAgent: config.userAgent,
      });
      setContent(response as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取网站失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (config.homepage) {
      fetchWebsite(config.homepage);
    }
  }, [config.homepage]);

  return (
    <div className="web-browser-plugin">
      <div className="browser-toolbar">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              fetchWebsite(url);
            }
          }}
          placeholder="输入网址..."
          className="url-input"
        />
        <button
          onClick={() => fetchWebsite(url)}
          disabled={loading}
          className="go-button"
        >
          {loading ? "加载中..." : "访问"}
        </button>
      </div>

      <div className="browser-content">
        {error ? (
          <div className="error-message">错误: {error}</div>
        ) : (
          <div
            className="website-content"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </div>
    </div>
  );
};