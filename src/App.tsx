import { useState, useCallback, useRef, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { PhysicalPosition } from "@tauri-apps/api/dpi";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  // 长按相关状态
  const isLongPress = useRef(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const windowStartPos = useRef({ x: 0, y: 0 });

  // 存储事件处理函数的引用，避免循环依赖
  const handleMouseMoveRef = useRef<
    ((e: MouseEvent) => void) | null
  >(null);
  const handleMouseUpRef = useRef<(() => void) | null>(null);

  // 鼠标按下事件
  const handleMouseDown = useCallback(async (e: React.MouseEvent) => {
    // 设置长按定时器（300ms）
    pressTimer.current = setTimeout(async () => {
      isLongPress.current = true;
      isDragging.current = true;

      // 开始拖拽时，改变鼠标样式
      document.body.style.cursor = "grabbing";

      // 记录长按开始时的鼠标屏幕位置和窗口位置
      // 使用 screenX/screenY 获取屏幕坐标
      dragStartPos.current = { x: e.screenX, y: e.screenY };

      try {
        const window = getCurrentWindow();
        const position = await window.outerPosition();
        windowStartPos.current = { x: position.x, y: position.y };
      } catch (error) {
        console.error("获取窗口位置失败:", error);
      }

      // 添加全局事件监听，确保鼠标移出窗口后仍能接收事件
      if (handleMouseMoveRef.current) {
        document.addEventListener("mousemove", handleMouseMoveRef.current);
      }
      if (handleMouseUpRef.current) {
        document.addEventListener("mouseup", handleMouseUpRef.current);
      }
    }, 300);
  }, []);

  // 鼠标移动事件（使用 requestAnimationFrame 优化）
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current) return;

      // 计算鼠标移动的距离（屏幕坐标）
      const deltaX = e.screenX - dragStartPos.current.x;
      const deltaY = e.screenY - dragStartPos.current.y;

      // 窗口新位置 = 窗口初始位置 + 鼠标移动距离
      const newX = windowStartPos.current.x + deltaX;
      const newY = windowStartPos.current.y + deltaY;

      // 使用 requestAnimationFrame 优化高频更新
      requestAnimationFrame(async () => {
        try {
          const window = getCurrentWindow();
          await window.setPosition(new PhysicalPosition(newX, newY));
        } catch (error) {
          console.error("移动窗口失败:", error);
        }
      });
    },
    []
  );

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

    // 移除全局事件监听
    if (handleMouseMoveRef.current) {
      document.removeEventListener("mousemove", handleMouseMoveRef.current);
    }
    if (handleMouseUpRef.current) {
      document.removeEventListener("mouseup", handleMouseUpRef.current);
    }
  }, []);

  // 存储事件处理函数引用
  useEffect(() => {
    handleMouseMoveRef.current = handleMouseMove;
    handleMouseUpRef.current = handleMouseUp;
  }, [handleMouseMove, handleMouseUp]);

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main
      className="container"
      onMouseDown={handleMouseDown}
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
