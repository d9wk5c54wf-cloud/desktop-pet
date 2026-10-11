import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { PhysicalPosition } from "@tauri-apps/api/dpi";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useLongPress } from "./hooks/useLongPress";
import { useNativeMenu } from "./hooks/useNativeMenu";
import { useSpineAnimation } from "./hooks/useSpineAnimation";
import { SpineCanvas } from "./components/SpineCanvas";
import { getMenuConfig } from "./components/MenuConfig";
import { loadPlugin } from "./toolVoid/loadPlugins"
import { TauriHttpClient } from "./api/HttpClient"
import "./App.css";

function App() {
  // 使用全局动画状态
  const { animations, playAnimation, setDragging, stopWalk } = useSpineAnimation();
  

  // 监听主窗口移动事件，同步更新气泡窗口位置
  // 覆盖所有移动来源：拖拽、自动走动、系统移动等
  useEffect(() => {
    const win = getCurrentWindow();
    const unlisten = win.onMoved(() => {
      invoke("update_bubble_position").catch(() => {});
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // 鼠标穿透状态
  const [isPassthrough, setIsPassthrough] = useState(false);
  const [plugins, setPlugins] = useState<any[]>([])

  // 点按插件：用户选中的插件 ID（从 localStorage 恢复）
  const [activePluginId, setActivePluginId] = useState<string | null>(
    () => localStorage.getItem("clickPluginId")
  )

  // 缓存已加载的插件实例及其完整信息
  const pluginInstancesRef = useRef<Map<string, { instance: any; plugin: any }>>(new Map())

  // 监听 Rust 托盘的穿透状态变化
  useEffect(() => {
    const unlisten = listen<boolean>("passthrough-changed", (event) => {
      setIsPassthrough(event.payload);
    });
    return () => { unlisten.then(fn => fn()); };
  }, []);

  // 初始化时从 Rust 获取当前穿透状态
  useEffect(() => {
    invoke<boolean>("get_passthrough").then(setIsPassthrough).catch(() => {});
  }, []);

  // 切换鼠标穿透（通过 Tauri 命令同步到 Rust）
  const togglePassthrough = useCallback(async () => {
    try {
      const newValue = !isPassthrough;
      await invoke("set_passthrough", { ignore: newValue });
      setIsPassthrough(newValue);
    } catch (e) {
      console.error("设置鼠标穿透失败:", e);
    }
  }, [isPassthrough]);

  useEffect(() => {
    async function loadPlugins() {
      const plugins = await invoke<any[]>("discover_plugins")
      setPlugins(plugins)

      console.log("插件：", plugins)
    }

    loadPlugins()
  }, [])

  // 窗口拖拽相关状态
  const dragStartPos = useRef({ x: 0, y: 0 });
  const windowStartPos = useRef({ x: 0, y: 0 });

  // 长按开始：记录初始位置，切换到拖拽动画
  const handleLongPressStart = useCallback(async (e: React.MouseEvent) => {
    // 标记拖拽状态，防止非循环动画完成后自动切换
    setDragging(true);

    // 切换到拖拽动画
    if (animations.includes("tuozhuai2")) {
      playAnimation("tuozhuai2", true);
    }

    dragStartPos.current = { x: e.screenX, y: e.screenY };

    try {
      const window = getCurrentWindow();
      const position = await window.outerPosition();
      windowStartPos.current = { x: position.x, y: position.y };
    } catch (error) {
      console.error("获取窗口位置失败:", error);
    }
  }, [animations, playAnimation, setDragging]);


  // 长按移动：移动窗口
  const handleLongPressMove = useCallback((e: MouseEvent) => {
    const deltaX = e.screenX - dragStartPos.current.x;
    const deltaY = e.screenY - dragStartPos.current.y;

    const newX = windowStartPos.current.x + deltaX;
    const newY = windowStartPos.current.y + deltaY;

    requestAnimationFrame(async () => {
      try {
        const window = getCurrentWindow();
        await window.setPosition(new PhysicalPosition(newX, newY));
      } catch (error) {
        console.error("移动窗口失败:", error);
      }
    });
  }, []);

  // 长按结束：重置为默认动画
  const handleLongPressEnd = useCallback(() => {
    // 取消拖拽状态
    setDragging(false);

    // 切换回默认动画
    if (animations.includes("stand2")) {
      playAnimation("stand2", true);
    }
  }, [animations, playAnimation, setDragging]);

  // 点按事件：播放 touch 动画 + 触发选中的点按插件
  const handleClick = useCallback(() => {
    if (animations.length > 0 && animations.includes("touch")) {
      playAnimation("touch", false);
    }

    // 触发点按插件：优先 onTap，没有则回退到 onLoad
    if (activePluginId) {
      const cached = pluginInstancesRef.current.get(activePluginId)
      if (cached?.instance) {
        const ctx = { bubble: bubbleAPI, http: httpClient }
        const cfg = cached.plugin?.manifest?.config ?? {}
        if (cached.instance.onTap) {
          cached.instance.onTap(ctx, cfg)
        } else if (cached.instance.onLoad) {
          cached.instance.onLoad(ctx, cfg)
        }
      }
    }
  }, [animations, playAnimation, activePluginId]);

  // 使用长按 Hook
  const { onMouseDown } = useLongPress({
    delay: 300,
    onLongPressStart: handleLongPressStart,
    onLongPressMove: handleLongPressMove,
    onLongPressEnd: handleLongPressEnd,
    onClick: handleClick,
  });

  // 使用原生菜单
  const { showContextMenu } = useNativeMenu();

  const httpClient = new TauriHttpClient()

  const handleLoadPlugin = async (plugin: any) => {
    const instance = await loadPlugin(plugin, {
      bubble: bubbleAPI,
      http: httpClient,
    })
    if (instance) {
      pluginInstancesRef.current.set(plugin.manifest.id, { instance, plugin })
    }
  }

  // 切换点按插件选择，如果插件未加载则自动加载
  const handleSelectClickPlugin = useCallback(async (id: string | null) => {
    setActivePluginId(id)
    if (id) {
      localStorage.setItem("clickPluginId", id)
      // 如果插件实例尚未缓存，自动加载
      if (!pluginInstancesRef.current.has(id)) {
        const plugin = plugins.find((p: any) => p.manifest.id === id)
        if (plugin) {
          await handleLoadPlugin(plugin)
        }
      }
    } else {
      localStorage.removeItem("clickPluginId")
    }
  }, [plugins])

  // 右键菜单
  const handleContextMenu = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();

      // 菜单打开前停止自动走动，避免菜单关闭后位置跳变
      stopWalk();

      // 从 MenuConfig 获取菜单配置
      const menuItems = getMenuConfig(animations, plugins, playAnimation, isPassthrough, togglePassthrough, handleLoadPlugin, activePluginId, handleSelectClickPlugin);

      await showContextMenu(menuItems);
    },
    [showContextMenu, animations, playAnimation, isPassthrough, togglePassthrough, activePluginId, stopWalk]
  );

  const bubbleAPI = {
    async show(text: string) {
      try {
        await invoke("show_bubble", { text, duration: 5000 })
      } catch (e) {
        console.error("显示气泡失败:", e)
      }
    },

    async hide() {
      try {
        await invoke("hide_bubble")
      } catch (e) {
        console.error("隐藏气泡失败:", e)
      }
    },
  }

  return (
    <main
      className="container"
      onMouseDown={onMouseDown}
      onContextMenu={handleContextMenu}
    >
      {/* Spine 动画显示区域 - 自适应窗口大小 */}
      <SpineCanvas
        assetPath="/assets/changmen/changmen"
        loop={true}
      />
    </main>
  );
}

export default App;