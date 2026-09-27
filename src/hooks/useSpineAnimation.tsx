import { createContext, useContext, useRef, useState, useCallback, type ReactNode } from "react";

interface SpineAnimationContextType {
  /** 可用动画列表 */
  animations: string[];
  /** 设置动画列表 */
  setAnimations: (animations: string[]) => void;
  /** 播放动画 */
  playAnimation: (name: string, loop?: boolean) => void;
  /** 注册播放函数 */
  registerPlayFunction: (playFn: (name: string, loop: boolean, onComplete?: () => void) => void) => void;
  /** 设置默认动画 */
  setDefaultAnimation: (name: string) => void;
  /** 获取默认动画 */
  getDefaultAnimation: () => string;
  /** 设置拖拽状态（拖拽中时非循环动画完成后不自动回到默认动画） */
  setDragging: (dragging: boolean) => void;
}

const SpineAnimationContext = createContext<SpineAnimationContextType | null>(null);

/**
 * Spine 动画状态 Provider
 */
export function SpineAnimationProvider({ children }: { children: ReactNode }) {
  const [animations, setAnimations] = useState<string[]>([]);
  const playFunctionRef = useRef<((name: string, loop: boolean, onComplete?: () => void) => void) | null>(null);
  const defaultAnimationRef = useRef<string>("stand2");
  const isDraggingRef = useRef(false);

  const registerPlayFunction = useCallback(
    (playFn: (name: string, loop: boolean, onComplete?: () => void) => void) => {
      playFunctionRef.current = playFn;
    },
    []
  );

  const setDefaultAnimation = useCallback((name: string) => {
    defaultAnimationRef.current = name;
  }, []);

  const getDefaultAnimation = useCallback(() => {
    return defaultAnimationRef.current;
  }, []);

  const setDragging = useCallback((dragging: boolean) => {
    isDraggingRef.current = dragging;
  }, []);

  const playAnimation = useCallback(
    (name: string, loop: boolean = true) => {
      if (playFunctionRef.current) {
        if (loop) {
          // 循环动画直接播放
          playFunctionRef.current(name, true);
        } else {
          // 非循环动画，播放完成后自动回到默认动画（拖拽中则跳过）
          playFunctionRef.current(name, false, () => {
            if (isDraggingRef.current) {
              console.log(`动画 ${name} 播放完成，但正在拖拽中，跳过自动切换`);
              return;
            }
            const defaultAnim = defaultAnimationRef.current;
            if (defaultAnim && defaultAnim !== name) {
              console.log(`动画 ${name} 播放完成，切换回默认动画: ${defaultAnim}`);
              playFunctionRef.current?.(defaultAnim, true);
            }
          });
        }
      } else {
        console.warn("动画播放函数未注册");
      }
    },
    []
  );

  return (
    <SpineAnimationContext.Provider
      value={{
        animations,
        setAnimations,
        playAnimation,
        registerPlayFunction,
        setDefaultAnimation,
        getDefaultAnimation,
        setDragging,
      }}
    >
      {children}
    </SpineAnimationContext.Provider>
  );
}

/**
 * 使用 Spine 动画状态的 Hook
 */
export function useSpineAnimation() {
  const context = useContext(SpineAnimationContext);
  if (!context) {
    throw new Error("useSpineAnimation 必须在 SpineAnimationProvider 内部使用");
  }
  return context;
}