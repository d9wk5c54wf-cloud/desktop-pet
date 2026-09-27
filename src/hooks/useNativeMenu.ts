import { useCallback } from "react";
import { Menu, MenuItem, Submenu, PredefinedMenuItem } from "@tauri-apps/api/menu";
import { getCurrentWindow } from "@tauri-apps/api/window";

interface MenuItemConfig {
  id: string;
  text?: string;
  icon?: string;
  enabled?: boolean;
  accelerator?: string;
  action?: () => void;
  submenu?: MenuItemConfig[];
  separator?: boolean;
}

/**
 * 递归创建菜单项
 */
async function createMenuItem(
  item: MenuItemConfig,
  parent: Menu | Submenu
): Promise<void> {
  if (item.separator) {
    const separator = await PredefinedMenuItem.new({
      item: "Separator",
    });
    await parent.append(separator);
  } else if (item.submenu && item.text) {
    // 创建子菜单
    const sub = await Submenu.new({
      text: item.text,
      enabled: item.enabled !== false,
    });

    // 递归添加子项
    for (const subItem of item.submenu) {
      await createMenuItem(subItem, sub);
    }

    await parent.append(sub);
  } else if (item.text) {
    // 创建普通菜单项
    const menuItem = await MenuItem.new({
      id: item.id,
      text: item.text,
      enabled: item.enabled !== false,
      accelerator: item.accelerator,
      action: item.action ? () => item.action!() : undefined,
    });
    await parent.append(menuItem);
  }
}

/**
 * 原生菜单 Hook
 *
 * 使用 Tauri 原生菜单 API，菜单由操作系统渲染，不受窗口边界限制
 * 支持多级子菜单
 */
export function useNativeMenu() {
  const showContextMenu = useCallback(async (items: MenuItemConfig[]) => {
    try {
      const menu = await Menu.new();

      // 递归创建所有菜单项
      for (const item of items) {
        await createMenuItem(item, menu);
      }

      // 弹出菜单
      const window = getCurrentWindow();
      await menu.popup(undefined, window);
    } catch (error) {
      console.error("显示原生菜单失败:", error);
    }
  }, []);

  return { showContextMenu };
}