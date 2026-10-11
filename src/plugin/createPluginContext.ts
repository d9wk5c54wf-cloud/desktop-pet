import type { PluginContext } from "./PluginContext"

import {
  TauriHttpClient
} from "../api/HttpClient"

import type { PetAPI } from "../api/PetAPI"
import type { MenuAPI, MenuItem } from "../api/MenuAPI"


export function createPluginContext(): PluginContext {

  const http = new TauriHttpClient()

  const pet: PetAPI = {
    async playAnimation(animation: string, loop = false) {

      console.log(
        "播放动画:",
        animation,
        "loop:",
        loop
      )

      // 这里以后连接你的 Spine
    },

    async moveTo(x: number, y: number) {

      console.log(
        "移动桌宠:",
        x,
        y
      )

      // 这里以后连接 Tauri
    }
  }


  const menu: MenuAPI = {

    addItem(item: MenuItem) {

      console.log(
        "添加菜单:",
        item
      )

    },

    removeItem(id: string) {

      console.log(
        "删除菜单:",
        id
      )

    }
  }


  return {
    http,
    pet,
    menu
  }
}