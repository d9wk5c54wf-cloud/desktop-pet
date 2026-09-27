import { useCallback, useRef, useEffect } from "react";

interface UseLongPressOptions {
  /** 长按触发时间（毫秒），默认 300 */
  delay?: number;
  /** 长按开始回调 */
  onLongPressStart?: (e: React.MouseEvent) => void;
  /** 长按中移动回调（全局） */
  onLongPressMove?: (e: MouseEvent) => void;
  /** 长按结束回调（全局） */
  onLongPressEnd?: () => void;
  /** 点按回调（非长按） */
  onClick?: () => void;
}


export function useLongPress({
  delay = 300,
  onLongPressStart,
  onLongPressMove,
  onLongPressEnd,
  onClick,
}: UseLongPressOptions = {}) {
  const isLongPress = useRef(false);
  const isDragging = useRef(false);
  const isMouseDown = useRef(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 存储回调引用，避免闭包问题
  const callbacksRef = useRef({
    onLongPressStart,
    onLongPressMove,
    onLongPressEnd,
    onClick,
  });

  // 更新回调引用
  useEffect(() => {
    callbacksRef.current = {
      onLongPressStart,
      onLongPressMove,
      onLongPressEnd,
      onClick,
    };
  });

  // 全局鼠标移动处理
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    callbacksRef.current.onLongPressMove?.(e);
  }, []);

  // 全局鼠标松开处理
  const handleGlobalMouseUp = useCallback(() => {
    const wasLongPress = isLongPress.current;
    const wasDragging = isDragging.current;

    // 重置状态
    isMouseDown.current = false;
    isLongPress.current = false;
    isDragging.current = false;

    // 移除全局事件监听
    document.removeEventListener("mousemove", handleGlobalMouseMove);
    document.removeEventListener("mouseup", handleGlobalMouseUp);
    console.log("移除mousemove和mouseup回调");

    // 恢复鼠标样式
    document.body.style.cursor = "default";

    // 如果不是长按，触发点按回调
    if (!wasLongPress) {
      callbacksRef.current.onClick?.();
    }

    if (wasDragging) {
      callbacksRef.current.onLongPressEnd?.();
    }

  }, [handleGlobalMouseMove]);

  // 鼠标按下事件
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isMouseDown.current = true;
      isLongPress.current = false;

      // 立即添加全局监听器，确保能捕获鼠标松开
      
      document.addEventListener("mouseup", handleGlobalMouseUp);
      console.log("添加mouseup回调");

      // 设置长按定时器
      pressTimer.current = setTimeout(() => {
        // 检查鼠标是否仍然按下
        if (!isMouseDown.current) return;

        document.addEventListener("mousemove", handleGlobalMouseMove);
        console.log("添加mousemove回调");

        isLongPress.current = true;
        isDragging.current = true;

        // 改变鼠标样式
        document.body.style.cursor = "grabbing";

        // 触发长按开始回调
        callbacksRef.current.onLongPressStart?.(e);
      }, delay);
    },
    [delay, handleGlobalMouseMove, handleGlobalMouseUp]
  );

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
      }
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, []);

  return {
    onMouseDown: handleMouseDown,
    isLongPress,
    isDragging,
  };
}