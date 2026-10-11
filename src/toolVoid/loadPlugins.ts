import { invoke } from "@tauri-apps/api/core"
import { TauriHttpClient } from "../api/HttpClient"

export interface BubbleAPI {
  show(text: string): void
  hide(): void
}

export interface PluginContext {
  bubble: BubbleAPI
  http: TauriHttpClient
}

export interface DiscoveredPlugin {
  path: string
  manifest: {
    id: string
    name: string
    version: string
    author?: string
    description?: string
    main: string
    config?: Record<string, unknown>
  }
}

// 缓存已加载的插件模块，避免重复 import 导致模块级变量重置
const moduleCache = new Map<string, any>()

/**
 * 加载插件并返回插件实例（用于缓存以调用 onTap 等钩子）
 */
export async function loadPlugin(
  plugin: DiscoveredPlugin,
  context: PluginContext
): Promise<any | null> {

  const cacheKey = `${plugin.path}/${plugin.manifest.main}`

  try {
    let pluginInstance = moduleCache.get(cacheKey)

    if (!pluginInstance) {
      // 首次加载：读取源码并 import
      const source = await invoke<string>("read_plugin_file", {
        path: plugin.path,
        main: plugin.manifest.main,
      })

      const blob = new Blob(
        [source],
        { type: "text/javascript" }
      )

      const url = URL.createObjectURL(blob)

      try {
        const module = await import(/* @vite-ignore */ url)
        pluginInstance = module.default
        moduleCache.set(cacheKey, pluginInstance)
      } finally {
        URL.revokeObjectURL(url)
      }
    }

    // 每次都调用 onLoad（可以显示气泡等），但模块级变量不会重置
    if (pluginInstance?.onLoad) {
      const result = await pluginInstance.onLoad(context, plugin.manifest.config ?? {})
      // 如果 onLoad 返回了对象（包含 onTap 等），用它作为实例
      if (result && typeof result === "object") {
        return result
      }
    }

    return pluginInstance

  } catch (error) {
    console.error("插件加载失败：", error)
    return null
  }
}