import { useState, useCallback, useRef } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  // 长按相关状态
  const isLongPress = useRef(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // 鼠标按下事件
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 记录初始位置
    dragStartPos.current = { x: e.clientX, y: e.clientY };

    // 设置长按定时器（300ms）
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      isDragging.current = true;

      // 开始拖拽时，改变鼠标样式
      document.body.style.cursor = "grabbing";
    }, 300);
  }, []);

  // 鼠标移动事件
  const handleMouseMove = useCallback(async (e: React.MouseEvent) => {
    if (!isDragging.current) return;

    // 计算移动距离
    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;

    // 使用 Tauri API 移动窗口
    try {
      const window = getCurrentWindow();
      await window.setPosition({
        type: "Physical",
        x: deltaX,
        y: deltaY,
      });
    } catch (error) {
      console.error("移动窗口失败:", error);
    }
  }, []);

  // 鼠标松开事件
  const handleMouseUp = useCallback(() => {
    // 清除定时器
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }

    // 重置状态
    isLongPress.current = false;
    isDragging.current = false;
    document.body.style.cursor = "default";

    // 如果不是长按，执行点击逻辑（留空，后续使用）
    // if (!isLongPress.current) {
    //   // 这里可以添加点击逻辑
    // }
  }, []);

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main
      className="container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} // 鼠标离开窗口时也停止拖拽
    >
      <h1>Welcome to Desktop Pet! 🐾</h1>

      <div className="row">
        <a href="https://vite.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greetMsg}</p>
    </main>
  );
}

export default App;
