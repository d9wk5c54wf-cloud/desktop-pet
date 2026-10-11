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

/**
 * 加载插件并返回插件实例（用于缓存以调用 onTap 等钩子）
 */
export async function loadPlugin(
  plugin: DiscoveredPlugin,
  context: PluginContext
): Promise<any | null> {
  console.log("准备加载插件：", plugin)

  try {
    const source = await invoke<string>("read_plugin_file", {
      path: plugin.path,
      main: plugin.manifest.main,
    })

    console.log("插件源码：", source)

    const blob = new Blob(
      [source],
      { type: "text/javascript" }
    )

    const url = URL.createObjectURL(blob)

    try {
      const module = await import(/* @vite-ignore */ url)

      const pluginInstance = module.default

      console.log("插件实例：", pluginInstance)

      if (pluginInstance?.onLoad) {
        const result = await pluginInstance.onLoad(context, plugin.manifest.config ?? {})
        // 如果 onLoad 返回了对象（包含 onTap 等），用它作为实例
        if (result && typeof result === "object") {
          return result
        }
      }

      return pluginInstance

    } finally {
      URL.revokeObjectURL(url)
    }

  } catch (error) {
    console.error("插件加载失败：", error)
    return null
  }
}